use super::{
    display::ViewKey,
    runtime::{Host, MAX_VIEWS, Publication},
};
use axum::{
    Json,
    extract::{
        State as Extract,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    collections::BTreeSet,
    sync::{
        Arc,
        atomic::{AtomicU64, Ordering},
    },
    time::{Duration, Instant},
};
use tokio::sync::{OwnedSemaphorePermit, Semaphore};

#[derive(Clone)]
pub struct State {
    pub host: Host,
    pub token: Option<String>,
    pub origins: Vec<String>,
    pub permits: Arc<Semaphore>,
}
pub async fn health(Extract(state): Extract<State>) -> Json<Value> {
    let p = state.host.publications.borrow();
    Json(
        json!({"generation":p.generation,"sequence":p.sequence,"summary":p.status["summary"],
        "throughput":p.status["throughput"],"viewers":state.host.views.lock().unwrap().len(),"projections":p.projections}),
    )
}
pub async fn upgrade(
    Extract(state): Extract<State>,
    headers: HeaderMap,
    ws: WebSocketUpgrade,
) -> Response {
    if !origin_allowed(&headers, &state.origins) {
        return (StatusCode::FORBIDDEN, "Origin is not allowed").into_response();
    }
    let Ok(permit) = state.permits.clone().try_acquire_owned() else {
        return (StatusCode::SERVICE_UNAVAILABLE, "Viewer limit reached").into_response();
    };
    ws.max_message_size(16 * 1024)
        .max_frame_size(16 * 1024)
        .on_upgrade(move |socket| run(socket, state, permit))
}
fn origin_allowed(headers: &HeaderMap, allowed: &[String]) -> bool {
    let Some(origin) = headers.get("origin") else {
        return true;
    }; // Nonbrowser clients still require operator credentials.
    let Ok(origin) = origin.to_str() else {
        return false;
    };
    if allowed.iter().any(|s| s == origin) {
        return true;
    }
    let Some(host) = headers.get("host").and_then(|h| h.to_str().ok()) else {
        return false;
    };
    origin == format!("http://{host}") || origin == format!("https://{host}")
}
pub fn authenticated(expected: Option<&str>, supplied: &str) -> bool {
    let Some(expected) = expected else {
        return false;
    };
    if supplied.len() != expected.len() {
        return false;
    }
    expected
        .bytes()
        .zip(supplied.bytes())
        .fold(0u8, |diff, (a, b)| diff | (a ^ b))
        == 0
}
pub fn read_only(op: &str, payload: &Value) -> bool {
    matches!(op, "view" | "pick" | "inspectSelected" | "chemicalWeb")
        || op == "phenotype" && payload["action"] == "panel"
}
#[derive(Deserialize)]
struct Request {
    id: u64,
    op: String,
    #[serde(default)]
    payload: Value,
    #[serde(default)]
    generation: u64,
}
struct Viewer {
    id: u64,
    host: Host,
    key: ViewKey,
    revision: u64,
    operator: bool,
    awaiting: Option<u64>,
    last: u64,
}
impl Drop for Viewer {
    fn drop(&mut self) {
        self.host.views.lock().unwrap().remove(&self.id);
    }
}
impl Viewer {
    fn set_view(&mut self, p: &Value) -> Result<Value, String> {
        let key = ViewKey::parse(p)?;
        let revision = p["revision"].as_u64().ok_or("Missing view revision")?;
        let mut views = self.host.views.lock().unwrap();
        let mut distinct: BTreeSet<_> = views
            .iter()
            .filter(|(id, _)| **id != self.id)
            .map(|(_, k)| *k)
            .collect();
        distinct.insert(key);
        if distinct.len() > MAX_VIEWS {
            return Err("Distinct view budget busy; retain current view or retry".into());
        }
        views.insert(self.id, key);
        self.key = key;
        self.revision = revision;
        Ok(Value::Null)
    }
    async fn handle(&mut self, request: Request, token: Option<&str>) -> Value {
        let result = match request.op.as_str() {
            "authenticate" => {
                self.operator =
                    authenticated(token, request.payload["token"].as_str().unwrap_or(""));
                if self.operator {
                    Ok(json!({"operator":true}))
                } else {
                    Err("Operator credential rejected".into())
                }
            }
            "view" => self.set_view(&request.payload),
            "ack" => {
                if request.payload["sequence"].as_u64() == self.awaiting {
                    self.awaiting = None;
                }
                Ok(Value::Null)
            }
            op if self.operator || read_only(op, &request.payload) => {
                self.host
                    .command(request.generation, op, request.payload)
                    .await
            }
            _ => Err("Read-only spectator; operator access required".into()),
        };
        match result {
            Ok(value) => json!({"kind":"reply","id":request.id,"ok":true,"value":value}),
            Err(error) => json!({"kind":"reply","id":request.id,"ok":false,"error":error}),
        }
    }
}
async fn run(socket: WebSocket, state: State, _permit: OwnedSemaphorePermit) {
    static NEXT: AtomicU64 = AtomicU64::new(1);
    let id = NEXT.fetch_add(1, Ordering::Relaxed);
    let key = ViewKey::default();
    {
        let mut views = state.host.views.lock().unwrap();
        let mut distinct: BTreeSet<_> = views.values().copied().collect();
        distinct.insert(key);
        if distinct.len() > MAX_VIEWS {
            return;
        }
        views.insert(id, key);
    }
    let mut viewer = Viewer {
        id,
        host: state.host.clone(),
        key,
        revision: 0,
        operator: false,
        awaiting: None,
        last: 0,
    };
    let (mut sink, mut source) = socket.split();
    let mut publications = state.host.publications.clone();
    let mut heartbeat = tokio::time::interval(Duration::from_secs(10));
    let mut last_input = Instant::now();
    let mut rate_at = Instant::now();
    let mut requests = 0;
    loop {
        tokio::select! {
            incoming = source.next() => {
                let Some(Ok(message)) = incoming else { break; };
                last_input = Instant::now();
                if rate_at.elapsed() >= Duration::from_secs(1) { rate_at = Instant::now(); requests = 0; }
                if let Message::Text(text) = message {
                    requests += 1;
                    if requests > 40 { break; }
                    let Ok(request) = serde_json::from_str::<Request>(&text) else { break; };
                    let reply = viewer.handle(request, state.token.as_deref()).await;
                    if !matches!(tokio::time::timeout(Duration::from_secs(5), sink.send(Message::Text(reply.to_string().into()))).await, Ok(Ok(()))) { break; }
                } else if matches!(message, Message::Close(_)) { break; }
            }
            changed = publications.changed(), if viewer.awaiting.is_none() => {
                if changed.is_err() { break; }
                let p = publications.borrow_and_update().clone();
                if p.sequence <= viewer.last { continue; }
                let Some(frame) = p.frames.get(&viewer.key).cloned() else { continue; };
                let metadata = publication_metadata(&p, &viewer);
                let common = p.common.clone();
                let sequence = p.sequence;
                drop(p);
                let send = async {
                    sink.send(Message::Text(metadata.to_string().into())).await?;
                    sink.send(Message::Text(common)).await?;
                    sink.send(Message::Binary(frame)).await
                };
                if !matches!(tokio::time::timeout(Duration::from_secs(5), send).await, Ok(Ok(()))) { break; }
                viewer.last = sequence; viewer.awaiting = Some(sequence);
            }
            _ = heartbeat.tick() => {
                if last_input.elapsed() > Duration::from_secs(30) { break; }
                if !matches!(tokio::time::timeout(Duration::from_secs(5), sink.send(Message::Ping(vec![].into()))).await, Ok(Ok(()))) { break; }
            }
        }
    }
}
fn publication_metadata(p: &Publication, viewer: &Viewer) -> Value {
    json!({"kind":"sample","sequence":p.sequence,"generation":p.generation,
        "revision":viewer.revision,"operator":viewer.operator})
}
