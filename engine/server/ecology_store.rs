//! Compressed, bounded diagnostic snapshots on the existing state volume.
use super::ecology::{History, MAX_BYTES};
use flate2::{Compression, read::GzDecoder, write::GzEncoder};
use serde_json::{Value, json};
use std::{
    fs,
    io::{Read, Write},
    path::Path,
};

pub const SAVE_SECONDS: u64 = 30;
pub struct Writer {
    diagnostics: std::sync::Arc<super::diagnostics::Diagnostics>,
    status: std::sync::Arc<std::sync::Mutex<Value>>,
    slot: std::sync::Arc<tokio::sync::Semaphore>,
    attempted: Option<std::time::Instant>,
    revision: Option<u64>,
    generation: Option<u64>,
    population: usize,
}
impl Writer {
    pub fn new(
        diagnostics: std::sync::Arc<super::diagnostics::Diagnostics>,
        status: std::sync::Arc<std::sync::Mutex<Value>>,
    ) -> Self {
        Self {
            diagnostics,
            status,
            slot: std::sync::Arc::new(tokio::sync::Semaphore::new(1)),
            attempted: None,
            revision: None,
            generation: None,
            population: 0,
        }
    }
    pub fn poll(&mut self, runtime: &super::runtime::Runtime) {
        let critical = self.generation != Some(runtime.generation)
            || (self.population > 0 && runtime.world.cells.is_empty());
        let failed = self.status.lock().unwrap()["ok"] == false;
        if !critical
            && (self
                .attempted
                .is_some_and(|t| t.elapsed().as_secs() < SAVE_SECONDS)
                || (self.revision == Some(runtime.ecology.revision) && !failed))
        {
            return;
        }
        let Ok(permit) = self.slot.clone().try_acquire_owned() else {
            return;
        };
        self.attempted = Some(std::time::Instant::now());
        self.revision = Some(runtime.ecology.revision);
        self.generation = Some(runtime.generation);
        self.population = runtime.world.cells.len();
        let history = runtime.ecology.clone();
        let diagnostics = self.diagnostics.clone();
        let status = self.status.clone();
        std::thread::spawn(move || {
            let record = outcome(history.revision, diagnostics.save_ecology(&history));
            if record["ok"] == false {
                eprintln!("Ecology history save failed: {record}");
            }
            let mut last = status.lock().unwrap();
            if last["revision"]
                .as_u64()
                .is_none_or(|r| r <= history.revision)
            {
                *last = record;
            }
            drop(permit);
        });
    }
}

impl super::runtime::Host {
    pub async fn flush_ecology(&self) -> Result<(), super::management_owner::Error> {
        use super::management_owner::{Error, Operation, Reply};
        let Some(p) = &self.persistence else {
            return Ok(());
        };
        let Some(diagnostics) = p.diagnostics.clone() else {
            return Ok(());
        };
        let Reply::Json(mut report) = self.manage(Operation::Ecology).await? else {
            return Err(Error::Unavailable);
        };
        let history: History = serde_json::from_value(report["history"].take())
            .map_err(|e| Error::Storage(e.to_string()))?;
        tokio::task::spawn_blocking(move || diagnostics.save_ecology(&history))
            .await
            .map_err(|e| Error::Storage(e.to_string()))?
            .map_err(|e| Error::Storage(e.to_string()))
    }
}

pub fn load(path: &Path) -> History {
    if !path.exists() {
        return History::default();
    }
    match read(path) {
        Ok(mut history) => {
            history.rebound();
            history
        }
        Err(error) => History {
            load_error: Some(format!("Ecology history could not be restored: {error}")),
            ..History::default()
        },
    }
}
fn read(path: &Path) -> Result<History, String> {
    let file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut raw = Vec::new();
    GzDecoder::new(file)
        .take(MAX_BYTES as u64 + 1)
        .read_to_end(&mut raw)
        .map_err(|e| e.to_string())?;
    if raw.len() > MAX_BYTES {
        return Err("Raw history exceeds its byte budget".into());
    }
    serde_json::from_slice(&raw).map_err(|e| e.to_string())
}
pub fn write(path: &Path, history: &History) -> std::io::Result<()> {
    let raw = serde_json::to_vec(history)?;
    if raw.len() > MAX_BYTES {
        return Err(std::io::Error::other(
            "Ecology history exceeds its byte budget",
        ));
    }
    let partial = path.with_extension("tmp");
    let mut encoder = GzEncoder::new(fs::File::create(&partial)?, Compression::fast());
    encoder.write_all(&raw)?;
    let file = encoder.finish()?;
    file.sync_all()?;
    fs::rename(partial, path)?;
    if let Some(parent) = path.parent() {
        fs::File::open(parent)?.sync_all()?;
    }
    Ok(())
}
pub fn outcome(revision: u64, result: std::io::Result<()>) -> Value {
    match result {
        Ok(()) => json!({"at":super::ecology::now_ms(),"revision":revision,"ok":true}),
        Err(error) => {
            json!({"at":super::ecology::now_ms(),"revision":revision,"ok":false,"error":error.to_string()})
        }
    }
}
