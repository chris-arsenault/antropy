#[cfg(not(target_arch = "wasm32"))]
mod display;
#[cfg(not(target_arch = "wasm32"))]
mod observations;
#[cfg(not(target_arch = "wasm32"))]
mod runtime;
#[cfg(not(target_arch = "wasm32"))]
mod socket;
#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests;

#[cfg(target_arch = "wasm32")]
fn main() {}

#[cfg(not(target_arch = "wasm32"))]
#[tokio::main(worker_threads = 2)]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    use axum::{
        Router,
        http::{HeaderName, HeaderValue},
        routing::get,
    };
    use tower_http::{
        services::{ServeDir, ServeFile},
        set_header::SetResponseHeaderLayer,
    };
    let read = |key: &str, default: &str| std::env::var(key).unwrap_or(default.into());
    let threads: usize = read("BIOTROPY_THREADS", "32").parse()?;
    if !(1..=32).contains(&threads) {
        return Err("BIOTROPY_THREADS must be 1..32".into());
    }
    let config = serde_json::from_str(&read("BIOTROPY_CONFIG", "{}"))?;
    let host = runtime::start(read("BIOTROPY_SEED", "27").parse()?, config, threads)?;
    let token = std::env::var("BIOTROPY_OPERATOR_TOKEN")
        .ok()
        .filter(|s| !s.is_empty());
    if token.as_ref().is_some_and(|v| v.len() < 32) {
        return Err("Operator token must contain at least 32 bytes".into());
    }
    let state = socket::State {
        host,
        token,
        origins: read("BIOTROPY_ORIGINS", "")
            .split(',')
            .filter(|s| !s.is_empty())
            .map(String::from)
            .collect(),
        permits: std::sync::Arc::new(tokio::sync::Semaphore::new(runtime::MAX_VIEWERS)),
    };
    let static_dir = read("BIOTROPY_STATIC_DIR", "/app/public");
    let files =
        ServeDir::new(&static_dir).fallback(ServeFile::new(format!("{static_dir}/index.html")));
    let app = Router::new()
        .route("/health", get(socket::health))
        .route("/stream", get(socket::upgrade))
        .route(
            "/execution.json",
            get(|| async { axum::Json(serde_json::json!({"mode":"server","endpoint":"/stream"})) }),
        )
        .fallback_service(files)
        .with_state(state)
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("cross-origin-opener-policy"),
            HeaderValue::from_static("same-origin"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("cross-origin-embedder-policy"),
            HeaderValue::from_static("require-corp"),
        ));
    let address = read("BIOTROPY_BIND", "0.0.0.0:8095");
    let listener = tokio::net::TcpListener::bind(&address).await?;
    eprintln!(
        "Biotropy listening on {address}; {threads} compute threads; public routing is external configuration"
    );
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;
    Ok(())
}
