use super::{management, management_owner, runtime, socket};
use antropy_engine::{config::Config, world::World};
use axum::{
    Router,
    body::{Body, to_bytes},
    http::{Request, StatusCode},
    response::Response,
};
use serde_json::{Value, json};
use std::sync::Arc;
use tower::ServiceExt;

pub const TOKEN: &str = "test-operator-credential-32-characters";

async fn fixture(token: Option<&str>) -> (Router, runtime::Host) {
    stored_fixture(token, None).await
}
pub async fn stored_fixture(
    token: Option<&str>,
    persistence: Option<super::persistence::Persistence>,
) -> (Router, runtime::Host) {
    let config = Config {
        width: 24.,
        height: 24.,
        founders: 4,
        source_count: 2,
        ..Default::default()
    };
    let host = runtime::start(27, config, 1, persistence).unwrap();
    host.command(1, "running", json!({"value":false}))
        .await
        .unwrap();
    let state = socket::State {
        host: host.clone(),
        token: token.map(String::from),
        origins: vec![],
        permits: Arc::new(tokio::sync::Semaphore::new(runtime::MAX_VIEWERS)),
    };
    (
        Router::new()
            .nest("/api", management::routes(state.clone()))
            .with_state(state),
        host,
    )
}
async fn request(app: &Router, path: &str, body: Option<Value>, token: Option<&str>) -> Response {
    let mut request = Request::builder().uri(path);
    if let Some(token) = token {
        request = request.header("authorization", format!("Bearer {token}"));
    }
    let body = if let Some(value) = body {
        request = request
            .method("POST")
            .header("content-type", "application/json");
        Body::from(value.to_string())
    } else {
        Body::empty()
    };
    app.clone()
        .oneshot(request.body(body).unwrap())
        .await
        .unwrap()
}
pub async fn json_body(response: Response) -> Value {
    serde_json::from_slice(&to_bytes(response.into_body(), 1024 * 1024).await.unwrap()).unwrap()
}
async fn control(app: &Router, generation: u64, op: &str, payload: Value) -> Response {
    request(
        app,
        "/api/control",
        Some(json!({"generation":generation,"op":op,"payload":payload})),
        Some(TOKEN),
    )
    .await
}

#[tokio::test]
async fn http_management_requires_auth_even_without_a_stream() {
    let (app, host) = fixture(Some(TOKEN)).await;
    for path in [
        "/api/status",
        "/api/checkpoint?generation=1",
        "/api/control",
    ] {
        for token in [None, Some("wrong")] {
            let reply = request(&app, path, None, token).await;
            assert_eq!(reply.status(), StatusCode::UNAUTHORIZED);
            assert_eq!(reply.headers()["cache-control"], "no-store");
        }
    }
    assert_eq!(host.exports.available_permits(), 1);
    assert!(host.views.lock().unwrap().is_empty());
    let reply = request(&app, "/api/status", None, Some(TOKEN)).await;
    assert_eq!(reply.status(), StatusCode::OK);
    let status = json_body(reply).await;
    assert_eq!(status["seed"], 27);
    assert_eq!(status["config"]["width"], 24.);
    assert_eq!(status["running"], false);
    assert_eq!(status["threads"], 1);
    let (disabled, _) = fixture(None).await;
    assert_eq!(
        request(&disabled, "/api/status", None, Some(TOKEN))
            .await
            .status(),
        StatusCode::UNAUTHORIZED
    );
    assert_eq!(
        request(&app, "/api/missing", None, Some(TOKEN))
            .await
            .status(),
        StatusCode::NOT_FOUND
    );
}

#[tokio::test]
async fn http_controls_are_atomic_and_reject_stale_generations() {
    let (app, _) = fixture(Some(TOKEN)).await;
    let before = json_body(request(&app, "/api/status", None, Some(TOKEN)).await).await;
    let step = control(&app, 1, "step", json!({})).await;
    assert_eq!(step.status(), StatusCode::OK);
    let after = json_body(step).await;
    assert_eq!(
        after["status"]["tick"].as_u64().unwrap(),
        before["tick"].as_u64().unwrap() + 1
    );
    assert_eq!(after["status"]["running"], false);
    assert_eq!(
        control(&app, 1, "restart", json!({"seed":28,"config":{"width":-1}}))
            .await
            .status(),
        StatusCode::BAD_REQUEST
    );
    let unchanged = json_body(request(&app, "/api/status", None, Some(TOKEN)).await).await;
    assert_eq!(unchanged, after["status"]);
    let speed = json_body(control(&app, 1, "speed", json!({"value":10})).await).await;
    assert_eq!(speed["status"]["speed"], 10.);
    let restarted = control(
        &app,
        1,
        "restart",
        json!({"seed":28,"config":{"width":24,"height":24,"founders":4,"sourceCount":2}}),
    )
    .await;
    assert_eq!(restarted.status(), StatusCode::OK);
    let status = json_body(restarted).await["status"].clone();
    assert_eq!(status["generation"], 2);
    assert_eq!(status["tick"], 0);
    assert_eq!(status["seed"], 28);
    assert_eq!(status["running"], true);
    assert_eq!(
        control(&app, 1, "running", json!({"value":false}))
            .await
            .status(),
        StatusCode::CONFLICT
    );
    assert_eq!(
        request(&app, "/api/checkpoint?generation=1", None, Some(TOKEN))
            .await
            .status(),
        StatusCode::CONFLICT
    );
    assert_eq!(
        control(&app, 2, "running", json!({"value":false}))
            .await
            .status(),
        StatusCode::OK
    );
    assert_eq!(
        control(&app, 2, "intervene", json!({})).await.status(),
        StatusCode::BAD_REQUEST
    );
    let oversized = control(
        &app,
        2,
        "restart",
        json!({"seed":28,"padding":"x".repeat(17 * 1024)}),
    )
    .await;
    assert_eq!(oversized.status(), StatusCode::PAYLOAD_TOO_LARGE);
}

#[tokio::test]
async fn checkpoint_is_restorable_and_export_slot_covers_download_lifetime() {
    let (app, host) = fixture(Some(TOKEN)).await;
    let status = json_body(request(&app, "/api/status", None, Some(TOKEN)).await).await;
    let export = request(&app, "/api/checkpoint?generation=1", None, Some(TOKEN)).await;
    assert_eq!(export.status(), StatusCode::OK);
    assert_eq!(
        export.headers()["x-biotropy-tick"],
        status["tick"].as_u64().unwrap().to_string()
    );
    assert_eq!(host.exports.available_permits(), 0);
    assert_eq!(
        request(&app, "/api/checkpoint?generation=1", None, Some(TOKEN))
            .await
            .status(),
        StatusCode::SERVICE_UNAVAILABLE
    );
    // A slow downloader does not block the World owner or HTTP controls.
    assert_eq!(
        control(&app, 1, "step", json!({})).await.status(),
        StatusCode::OK
    );
    let bytes = to_bytes(export.into_body(), management_owner::MAX_CHECKPOINT_BYTES)
        .await
        .unwrap();
    assert_eq!(host.exports.available_permits(), 0);
    let restored = World::restore(&bytes).unwrap();
    assert_eq!(restored.tick, status["tick"].as_u64().unwrap());
    assert_eq!(restored.seed, 27);
    assert_eq!(
        restored.cells.len(),
        status["population"].as_u64().unwrap() as usize
    );
    assert_eq!(restored.snapshot().unwrap(), bytes);
    let retained_slice = bytes.slice(..10);
    let length = bytes.len();
    drop(bytes);
    assert_eq!(host.exports.available_permits(), 0);
    drop(retained_slice);
    assert_eq!(host.exports.available_permits(), 1);
    let abandoned = request(&app, "/api/checkpoint?generation=1", None, Some(TOKEN)).await;
    assert_eq!(host.exports.available_permits(), 0);
    drop(abandoned);
    assert_eq!(host.exports.available_permits(), 1);
    assert!(management_owner::checkpoint(&restored, 100).is_err());
    assert_eq!(
        management_owner::checkpoint(&restored, length).unwrap(),
        restored.snapshot().unwrap()
    );
    assert!(management_owner::checkpoint(&restored, length - 1).is_err());
}
