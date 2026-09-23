//! Operator controls for volume-backed checkpoints. File work runs on blocking threads;
//! the World owner only captures bytes or swaps in an already decompressed world.
use super::{
    management_owner::{Error, Operation, Reply},
    runtime::Host,
    socket,
    store::{AUTOMATIC, MANUAL, Meta, Reason, StoreError},
};
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Deserialize;
use serde_json::json;
use std::time::Duration;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Generation {
    generation: u64,
}

impl From<StoreError> for Error {
    fn from(e: StoreError) -> Self {
        match e {
            StoreError::Full => Self::Export(format!(
                "All {MANUAL} manual checkpoint slots are used; delete one first"
            )),
            StoreError::Missing => Self::NotFound,
            StoreError::Io(message) => Self::Storage(message),
        }
    }
}

async fn blocking<T: Send + 'static>(
    work: impl FnOnce() -> Result<T, StoreError> + Send + 'static,
) -> Result<T, Error> {
    tokio::task::spawn_blocking(work)
        .await
        .map_err(|e| Error::Storage(e.to_string()))?
        .map_err(Error::from)
}

impl Host {
    fn store(&self) -> Result<std::sync::Arc<super::store::Store>, Error> {
        Ok(self
            .persistence
            .as_ref()
            .ok_or(Error::Disabled)?
            .store
            .clone())
    }
    /// Capture on the owner, then compress and write while the world keeps stepping.
    /// `wait` queues behind an in-progress save (shutdown); otherwise a busy slot is 503.
    pub async fn save(
        &self,
        generation: Option<u64>,
        reason: Reason,
        wait: bool,
    ) -> Result<Meta, Error> {
        let store = self.store()?;
        let permit = if wait {
            tokio::time::timeout(Duration::from_secs(90), self.saves.clone().acquire_owned())
                .await
                .map_err(|_| Error::Timeout)?
                .map_err(|_| Error::Unavailable)?
        } else {
            self.saves
                .clone()
                .try_acquire_owned()
                .map_err(|_| Error::Busy)?
        };
        let Reply::Captured { capture, permit } = self
            .manage(Operation::Save {
                generation,
                reason,
                permit,
            })
            .await?
        else {
            return Err(Error::Unavailable);
        };
        blocking(move || {
            let meta = store.write(capture);
            drop(permit);
            meta
        })
        .await
    }
}

pub async fn list(State(state): State<socket::State>) -> Result<Response, Error> {
    let store = state.host.store()?;
    let interval = state.host.persistence.as_ref().and_then(|p| p.interval);
    let (entries, used, budget) = blocking(move || {
        let entries = store.list()?;
        let used = entries.iter().map(|m| m.bytes).sum::<u64>();
        Ok((entries, used, store.budget))
    })
    .await?;
    let checkpoints: Vec<_> = entries
        .iter()
        .map(|m| {
            let mut value = json!(m);
            value["compatible"] = json!(m.compatible());
            value
        })
        .collect();
    Ok(Json(
        json!({"checkpoints":checkpoints,"usedBytes":used,"budgetBytes":budget,
        "automaticLimit":AUTOMATIC,"manualLimit":MANUAL,
        "autosaveSeconds":interval.map(|d| d.as_secs())}),
    )
    .into_response())
}

pub async fn save(
    State(state): State<socket::State>,
    Json(body): Json<Generation>,
) -> Result<Response, Error> {
    let meta = state
        .host
        .save(Some(body.generation), Reason::Manual, false)
        .await?;
    Ok((StatusCode::CREATED, Json(json!(meta))).into_response())
}

pub async fn load(
    State(state): State<socket::State>,
    Path(id): Path<String>,
    Json(body): Json<Generation>,
) -> Result<Response, Error> {
    let store = state.host.store()?;
    let (meta, raw) = blocking(move || store.read(&id)).await?;
    if !meta.compatible() {
        return Err(Error::Invalid(format!(
            "Checkpoint {} uses physical format v{}; this server restores only its own format",
            meta.id, meta.version
        )));
    }
    let Reply::Json(mut value) = state
        .host
        .manage(Operation::Load {
            generation: body.generation,
            raw,
        })
        .await?
    else {
        return Err(Error::Unavailable);
    };
    value["checkpoint"] = json!(meta);
    Ok(Json(value).into_response())
}

pub async fn delete(
    State(state): State<socket::State>,
    Path(id): Path<String>,
) -> Result<Response, Error> {
    let store = state.host.store()?;
    blocking(move || store.delete(&id)).await?;
    Ok(StatusCode::NO_CONTENT.into_response())
}
