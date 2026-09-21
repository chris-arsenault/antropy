use super::{
    display::{ViewKey, encode},
    observations::Observations,
};
use antropy_engine::{commands, config::Config, render::Buffers, world::World};
use axum::body::Bytes;
use serde_json::{Value, json};
use std::{
    collections::BTreeMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tokio::sync::{mpsc, oneshot, watch};

pub const MAX_VIEWERS: usize = 32;
pub const MAX_VIEWS: usize = 16;
pub const PUBLICATION_PERIOD: Duration = Duration::from_millis(500);

#[derive(Default)]
pub struct Publication {
    pub sequence: u64,
    pub generation: u64,
    pub status: Value,
    pub frames: BTreeMap<ViewKey, Bytes>,
    pub projections: u64,
    pub common: axum::extract::ws::Utf8Bytes,
}
pub struct Command {
    pub generation: u64,
    pub op: String,
    pub payload: Value,
    pub reply: oneshot::Sender<Result<Value, String>>,
}
#[derive(Clone)]
pub struct Host {
    pub commands: mpsc::Sender<Command>,
    pub publications: watch::Receiver<Arc<Publication>>,
    pub views: Arc<Mutex<BTreeMap<u64, ViewKey>>>,
}
impl Host {
    pub async fn command(
        &self,
        generation: u64,
        op: &str,
        payload: Value,
    ) -> Result<Value, String> {
        let (reply, received) = oneshot::channel();
        self.commands
            .try_send(Command {
                generation,
                op: op.into(),
                payload,
                reply,
            })
            .map_err(|_| "Server command budget busy; retry".to_string())?;
        tokio::time::timeout(Duration::from_secs(30), received)
            .await
            .map_err(|_| "Server command timed out; result is unknown".to_string())?
            .map_err(|_| "Simulation stopped responding".to_string())?
    }
}
pub struct Runtime {
    pub world: World,
    pub running: bool,
    pub generation: u64,
    pub speed: Option<f64>,
    pub threads: usize,
    observations: Observations,
    buffers: Buffers,
    sequence: u64,
    projections: u64,
    queries: BTreeMap<String, Value>,
}
impl Runtime {
    pub fn new(seed: u64, config: Config, threads: usize) -> Result<Self, String> {
        let mut world = World::new(seed, config)?;
        commands::execute(
            &mut world,
            &json!({"op":"phenotype","action":"configure",
            "enabled":true,"highlight":false,"selection":{"kind":"all"}}),
        )?;
        Ok(Self {
            world,
            running: true,
            generation: 1,
            speed: None,
            threads,
            observations: Observations::default(),
            buffers: Buffers::default(),
            sequence: 0,
            projections: 0,
            queries: BTreeMap::new(),
        })
    }
    pub fn command(&mut self, op: &str, payload: Value) -> Result<Value, String> {
        match op {
            "running" => {
                self.running = payload["value"].as_bool().ok_or("Invalid running state")?;
            }
            "step" => {
                self.running = false;
                self.world.step();
            }
            "speed" => {
                self.speed = if payload["value"] == "max" {
                    None
                } else {
                    Some(
                        payload["value"]
                            .as_f64()
                            .filter(|n| [1., 10., 30., 60., 120.].contains(n))
                            .ok_or("Invalid speed")?,
                    )
                };
            }
            "restart" => {
                let seed = payload["seed"].as_u64().ok_or("Invalid seed")?;
                let config =
                    serde_json::from_value(payload["config"].clone()).map_err(|e| e.to_string())?;
                let mut next = Self::new(seed, config, self.threads)?;
                next.generation = self.generation + 1;
                next.sequence = self.sequence;
                *self = next;
            }
            "phenotype" => return self.phenotype(payload),
            "task" => {
                self.query(op, payload)?;
                self.queries.clear();
            }
            "pick" | "inspectSelected" | "chemicalWeb" => return self.query(op, payload),
            _ => return Err("Operation is not available on the server".into()),
        }
        Ok(Value::Null)
    }
    fn phenotype(&mut self, mut p: Value) -> Result<Value, String> {
        match p["action"].as_str() {
            Some("panel") => return Ok(Value::Null),
            Some("select" | "highlight") => {
                let o = self.world.observer.as_ref().ok_or("Observer unavailable")?;
                let selection = p.get("selection").cloned().unwrap_or(json!(o.selection));
                let highlight = p["enabled"].as_bool().unwrap_or(o.highlight);
                let members = self.observations.members(&selection);
                p = json!({"action":"configure","enabled":true,"highlight":highlight,"selection":selection,"members":members});
            }
            Some("pin") => {
                p["id"] = json!(format!("{}-{}", self.generation, self.world.tick));
                p["label"] = json!("Operator selected cohort");
            }
            Some("unpin") => (),
            _ => return Err("Unknown phenotype control".into()),
        }
        p["op"] = json!("phenotype");
        self.queries.clear();
        commands::execute(&mut self.world, &p)
    }
    fn query(&mut self, op: &str, mut p: Value) -> Result<Value, String> {
        p["op"] = json!(op);
        let key = p.to_string();
        if let Some(v) = self.queries.get(&key) {
            return Ok(v.clone());
        }
        if self.queries.len() >= 64 {
            return Err("Observation budget busy; retry".into());
        }
        let value = commands::execute(&mut self.world, &p)?;
        if value.to_string().len() > 256 * 1024 {
            return Err("Observation exceeds reply budget".into());
        }
        if op != "task" {
            self.queries.insert(key, value.clone());
        }
        Ok(value)
    }
    pub fn publish(&mut self, keys: Vec<ViewKey>, throughput: f64) -> Result<Publication, String> {
        self.sequence += 1;
        self.queries.clear();
        let definition = commands::execute(&mut self.world, &json!({"op":"definition"}))?;
        let status = self.observations.status(
            &mut self.world,
            self.running,
            self.speed,
            throughput,
            self.threads,
        )?;
        let mut frames = BTreeMap::new();
        for key in keys
            .into_iter()
            .collect::<std::collections::BTreeSet<_>>()
            .into_iter()
            .take(MAX_VIEWS)
        {
            if frames.contains_key(&key) {
                continue;
            }
            let window = key.window(&self.world);
            self.buffers.prepare_window(
                &self.world,
                (key.kind, key.species, key.color, true, key.selected),
                window,
            )?;
            let frame = encode(
                &self.buffers,
                self.sequence,
                self.generation,
                self.world.tick,
                window.extent(&self.world),
            );
            if frame.len() > 16 * 1024 * 1024 {
                return Err("Display packet exceeds 16 MiB; zoom into a smaller viewport".into());
            }
            frames.insert(key, frame);
            self.projections += 1;
        }
        let common = json!({"kind":"publication","version":1,"sequence":self.sequence,"generation":self.generation,"definition":definition,"status":status}).to_string().into();
        Ok(Publication {
            sequence: self.sequence,
            generation: self.generation,
            status,
            frames,
            projections: self.projections,
            common,
        })
    }
}
pub fn start(seed: u64, config: Config, threads: usize) -> Result<Host, String> {
    let pool = rayon::ThreadPoolBuilder::new()
        .num_threads(threads)
        .build()
        .map_err(|e| e.to_string())?;
    let mut runtime = pool.install(|| Runtime::new(seed, config, threads))?;
    let initial = runtime.publish(vec![], 0.)?;
    let (sender, publications) = watch::channel(Arc::new(initial));
    let (commands, mut receiver) = mpsc::channel::<Command>(32);
    let views = Arc::new(Mutex::new(BTreeMap::<u64, ViewKey>::new()));
    let demand = views.clone();
    std::thread::Builder::new().name("world-owner".into()).spawn(move || {
        let mut published = Instant::now();
        let mut ticks = 0;
        let mut next_step = Instant::now();
        loop {
            for _ in 0..4 {
                let Ok(c) = receiver.try_recv() else { break; };
                if c.reply.is_closed() { continue; }
                let result = if c.generation != runtime.generation { Err("World changed; refresh before issuing controls".into()) }
                    else { pool.install(|| runtime.command(&c.op, c.payload)) };
                let _ = c.reply.send(result);
            }
            let now = Instant::now();
            if runtime.running && now >= next_step {
                pool.install(|| runtime.world.step());
                ticks += 1;
                if runtime.world.stop_reason.is_some() { runtime.running = false; }
                next_step = runtime.speed.map_or(now, |s| now + Duration::from_secs_f64(1. / s));
            } else { std::thread::sleep(Duration::from_millis(2)); }
            if published.elapsed() >= PUBLICATION_PERIOD {
                let sample_at = Instant::now();
                let keys = demand.lock().unwrap().values().copied().collect::<Vec<_>>();
                // Health is cheap without viewers; no census or presentation work then.
                let result = if keys.is_empty() {
                    runtime.sequence += 1;
                    let mut p = Publication { sequence: runtime.sequence, generation: runtime.generation, ..Default::default() };
                    p.status = json!({"summary":{"tick":runtime.world.tick,"population":runtime.world.cells.len()},
                        "running":runtime.running,"throughput":ticks as f64/published.elapsed().as_secs_f64(),"threads":threads});
                    Ok(p)
                } else { pool.install(|| runtime.publish(keys, ticks as f64 / published.elapsed().as_secs_f64())) };
                match result {
                    Ok(p) => { sender.send_replace(Arc::new(p)); }
                    Err(e) => { eprintln!("Publication failed: {e}"); }
                }
                published = sample_at; ticks = 0;
            }
            if receiver.is_closed() { break; }
        }
    }).map_err(|e| e.to_string())?;
    Ok(Host {
        commands,
        publications,
        views,
    })
}
