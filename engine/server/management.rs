//! Authenticated HTTP management, independent of display subscriptions.
use super::{
    management_owner::{Control, Error, Operation, Reply},
    management_store, socket,
};
use axum::{
    Json, Router,
    body::{Body, Bytes},
    extract::{DefaultBodyLimit, Query, Request, State},
    http::{StatusCode, header},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{delete, get, post},
};
use serde::Deserialize;
use serde_json::json;
use tokio::sync::OwnedSemaphorePermit;

struct ExportBody {
    bytes: Bytes,
    _permit: OwnedSemaphorePermit,
}
impl AsRef<[u8]> for ExportBody {
    fn as_ref(&self) -> &[u8] {
        &self.bytes
    }
}

pub fn routes(state: socket::State) -> Router<socket::State> {
    Router::new()
        .route("/status", get(status))
        .route("/control", post(control))
        .route("/checkpoint", get(checkpoint))
        .route("/diagnostics", get(diagnostics))
        .route(
            "/checkpoints",
            get(management_store::list).post(management_store::save),
        )
        .route("/checkpoints/{id}", delete(management_store::delete))
        .route("/checkpoints/{id}/load", post(management_store::load))
        .fallback(|| async { StatusCode::NOT_FOUND })
        .layer(DefaultBodyLimit::max(16 * 1024))
        .layer(middleware::from_fn_with_state(state, authorize))
}
async fn authorize(State(state): State<socket::State>, request: Request, next: Next) -> Response {
    let token = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "));
    let mut response = if token.is_some_and(|v| socket::authenticated(state.token.as_deref(), v)) {
        next.run(request).await
    } else {
        (
            StatusCode::UNAUTHORIZED,
            [(header::WWW_AUTHENTICATE, "Bearer")],
            Json(json!({"error":"Operator credential required"})),
        )
            .into_response()
    };
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, "no-store".parse().unwrap());
    response
}
async fn status(State(state): State<socket::State>) -> Result<Response, Error> {
    let Reply::Json(mut value) = state.host.manage(Operation::Status).await? else {
        return Err(Error::Unavailable);
    };
    if let Some(p) = &state.host.persistence {
        value["persistence"] = json!({"lastSave":p.last(),
            "autosaveSeconds":p.interval.map(|d| d.as_secs())});
    }
    Ok(Json(value).into_response())
}
/// Boot history with the previous process's last heartbeat and any panic, live memory and
/// the current heartbeat. Answered off the World owner so it works while stepping stalls.
async fn diagnostics(State(state): State<socket::State>) -> Result<Response, Error> {
    let report = state
        .host
        .persistence
        .as_ref()
        .and_then(|p| p.diagnostics.as_ref())
        .map(|d| d.report())
        .ok_or(Error::Disabled)?;
    Ok(Json(report).into_response())
}
async fn control(
    State(state): State<socket::State>,
    Json(control): Json<Control>,
) -> Result<Response, Error> {
    response(state.host.manage(Operation::Control(control)).await?)
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct CheckpointQuery {
    generation: u64,
}
async fn checkpoint(
    State(state): State<socket::State>,
    Query(query): Query<CheckpointQuery>,
) -> Result<Response, Error> {
    let permit = state
        .host
        .exports
        .clone()
        .try_acquire_owned()
        .map_err(|_| Error::Busy)?;
    response(
        state
            .host
            .manage(Operation::Checkpoint {
                generation: query.generation,
                permit,
            })
            .await?,
    )
}
fn response(reply: Reply) -> Result<Response, Error> {
    match reply {
        Reply::Json(value) => Ok(Json(value).into_response()),
        Reply::Captured { .. } => Err(Error::Unavailable),
        Reply::Checkpoint {
            bytes,
            generation,
            tick,
            permit,
        } => {
            let length = bytes.len();
            // The slot follows the allocation, including any slices retained by HTTP I/O.
            let bytes = Bytes::from_owner(ExportBody {
                bytes,
                _permit: permit,
            });
            Ok((
                [
                    (header::CONTENT_TYPE, "application/octet-stream".into()),
                    (header::CONTENT_LENGTH, length.to_string()),
                    (
                        header::CONTENT_DISPOSITION,
                        format!("attachment; filename=\"biotropy-g{generation}-t{tick}.bin\""),
                    ),
                    (
                        header::HeaderName::from_static("x-biotropy-generation"),
                        generation.to_string(),
                    ),
                    (
                        header::HeaderName::from_static("x-biotropy-tick"),
                        tick.to_string(),
                    ),
                ],
                Body::from(bytes),
            )
                .into_response())
        }
    }
}
impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            Self::Invalid(message) => (StatusCode::BAD_REQUEST, message),
            Self::Conflict => (
                StatusCode::CONFLICT,
                "World changed; refresh status before issuing controls".into(),
            ),
            Self::Busy => (
                StatusCode::SERVICE_UNAVAILABLE,
                "Management queue or checkpoint export busy; retry".into(),
            ),
            Self::Unavailable => (
                StatusCode::SERVICE_UNAVAILABLE,
                "Simulation stopped responding".into(),
            ),
            Self::Timeout => (
                StatusCode::GATEWAY_TIMEOUT,
                "Command timed out; outcome unknown. Inspect status before retrying".into(),
            ),
            Self::Export(message) => (StatusCode::INSUFFICIENT_STORAGE, message),
            Self::NotFound => (StatusCode::NOT_FOUND, "Stored checkpoint not found".into()),
            Self::Storage(message) => (StatusCode::INTERNAL_SERVER_ERROR, message),
            Self::Disabled => (
                StatusCode::NOT_IMPLEMENTED,
                "Checkpoint storage is not configured (BIOTROPY_STATE_DIR)".into(),
            ),
        };
        (status, Json(json!({"error":message}))).into_response()
    }
}
