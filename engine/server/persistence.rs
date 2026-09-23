//! Launch restore and periodic automatic saves for the volume-backed checkpoint store.
use super::{
    runtime::Runtime,
    store::{Reason, Store},
};
use antropy_engine::config::Config;
use std::{
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::sync::Semaphore;

#[derive(Clone)]
pub struct Persistence {
    pub store: Arc<Store>,
    /// Period between automatic saves; `None` keeps only shutdown and operator saves.
    pub interval: Option<Duration>,
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
    saved: Option<(u64, u64)>,
}
impl Autosave {
    pub fn new(persistence: Persistence, runtime: &Runtime) -> Self {
        Self {
            persistence,
            last: Instant::now(),
            saved: Some((runtime.generation, runtime.world.tick)),
        }
    }
    /// Captures on the owner thread when due; compression and disk writes run on their own
    /// thread holding the single save slot. An unchanged paused world is not saved again.
    pub fn poll(&mut self, runtime: &Runtime, saves: &Arc<Semaphore>) {
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
        match runtime.capture(Reason::Automatic) {
            Ok(capture) => {
                self.saved = Some(state);
                let store = self.persistence.store.clone();
                std::thread::spawn(move || {
                    if let Err(e) = store.write(capture) {
                        eprintln!("Automatic save failed: {e:?}");
                    }
                    drop(permit);
                });
            }
            Err(e) => eprintln!("Automatic capture failed: {e}"),
        }
    }
}
