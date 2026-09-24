//! Launch restore and periodic automatic saves for the volume-backed checkpoint store.
use super::{
    runtime::Runtime,
    store::{Reason, Store},
};
use antropy_engine::config::Config;
use serde_json::{Value, json};
use std::{
    sync::{Arc, Mutex},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tokio::sync::Semaphore;

#[derive(Clone)]
pub struct Persistence {
    pub store: Arc<Store>,
    /// Period between automatic saves; `None` keeps only shutdown and operator saves.
    pub interval: Option<Duration>,
    /// Most recent save attempt of any kind, so failures are visible without logs.
    pub last: Arc<Mutex<Value>>,
    /// Restart evidence on the same volume; absent in tests that only exercise the store.
    pub diagnostics: Option<Arc<super::diagnostics::Diagnostics>>,
}
impl Persistence {
    pub fn new(store: Arc<Store>, interval: Option<Duration>) -> Self {
        Self {
            store,
            interval,
            last: Arc::new(Mutex::new(Value::Null)),
            diagnostics: None,
        }
    }
    /// Records one save attempt: `Ok` carries the stored record, `Err` the failure.
    pub fn record(&self, reason: Reason, tick: u64, result: Result<Value, String>) {
        let at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(0, |d| d.as_millis() as u64);
        let entry = match result {
            Ok(checkpoint) => json!({"at":at,"reason":reason,"tick":tick,"ok":true,
                "checkpoint":checkpoint}),
            Err(error) => json!({"at":at,"reason":reason,"tick":tick,"ok":false,"error":error}),
        };
        if entry["ok"] == false {
            eprintln!("Save failed: {entry}");
        }
        *self.last.lock().unwrap() = entry;
    }
    pub fn last(&self) -> Value {
        self.last.lock().unwrap().clone()
    }
}

/// Restores the newest compatible stored world, otherwise starts the configured seed.
pub fn initial(
    persistence: Option<&Persistence>,
    seed: u64,
    config: Config,
    threads: usize,
) -> Result<Runtime, String> {
    if let Some((meta, world)) = persistence.and_then(|p| p.store.restore_latest()) {
        eprintln!(
            "Restored stored checkpoint {} at tick {}",
            meta.id, meta.tick
        );
        return Runtime::from_world(world, threads);
    }
    Runtime::new(seed, config, threads)
}

pub struct Autosave {
    persistence: Persistence,
    last: Instant,
    beat: Option<Instant>,
    saved: Option<(u64, u64)>,
}
impl Autosave {
    pub fn new(persistence: Persistence, runtime: &Runtime) -> Self {
        Self {
            persistence,
            last: Instant::now(),
            beat: None,
            saved: Some((runtime.generation, runtime.world.tick)),
        }
    }
    /// Captures on the owner thread when due; compression and disk writes run on their own
    /// thread holding the single save slot. An unchanged paused world is not saved again.
    /// The diagnostic heartbeat runs on its own minute timer, independent of saving.
    pub fn poll(&mut self, runtime: &mut Runtime, saves: &Arc<Semaphore>) {
        if let Some(d) = &self.persistence.diagnostics
            && self
                .beat
                .is_none_or(|t| t.elapsed().as_secs() >= super::diagnostics::HEARTBEAT_SECONDS)
        {
            self.beat = Some(Instant::now());
            d.heartbeat(
                json!({"generation":runtime.generation,"tick":runtime.world.tick,
                "population":runtime.world.cells.len(),"running":runtime.running,
                "lastSave":self.persistence.last()}),
            );
        }
        let Some(interval) = self.persistence.interval else {
            return;
        };
        if self.last.elapsed() < interval {
            return;
        }
        let state = (runtime.generation, runtime.world.tick);
        if self.saved == Some(state) {
            self.last = Instant::now();
            return;
        }
        let Ok(permit) = saves.clone().try_acquire_owned() else {
            return;
        };
        self.last = Instant::now();
        let tick = runtime.world.tick;
        match runtime.capture(Reason::Automatic) {
            Ok(capture) => {
                self.saved = Some(state);
                let persistence = self.persistence.clone();
                std::thread::spawn(move || {
                    let result = persistence.store.write(capture);
                    persistence.record(
                        Reason::Automatic,
                        tick,
                        result.map(|m| json!(m)).map_err(|e| format!("{e:?}")),
                    );
                    drop(permit);
                });
            }
            Err(e) => self.persistence.record(Reason::Automatic, tick, Err(e)),
        }
    }
}
