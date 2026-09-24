//! Volume-backed physical checkpoints with the browser recovery retention shape.
//! The owner thread only captures bytes; compression and disk I/O run elsewhere.
use super::management_owner::MAX_CHECKPOINT_BYTES;
use antropy_engine::world::{VERSION, World};
use flate2::{Compression, read::GzDecoder, write::GzEncoder};
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeSet,
    fs,
    io::{BufWriter, Read, Write},
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

pub const AUTOMATIC: usize = 6;
pub const MANUAL: usize = 8;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Reason {
    Automatic,
    Manual,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Meta {
    pub id: String,
    pub reason: Reason,
    pub version: u32,
    pub seed: u64,
    pub tick: u64,
    pub generation: u64,
    pub population: usize,
    pub created_at: u64,
    pub bytes: u64,
    pub raw_bytes: u64,
}
impl Meta {
    /// A checkpoint restores only into the physical format it was written with.
    pub fn compatible(&self) -> bool {
        self.version == VERSION
    }
}

/// Owner-thread capture of an ordinary physical checkpoint.
pub struct Capture {
    pub raw: Vec<u8>,
    pub reason: Reason,
    pub seed: u64,
    pub tick: u64,
    pub generation: u64,
    pub population: usize,
}

#[derive(Debug)]
pub enum StoreError {
    /// The manual quota is full; the operator must delete one first.
    Full,
    Missing,
    Io(String),
}
impl From<std::io::Error> for StoreError {
    fn from(e: std::io::Error) -> Self {
        Self::Io(e.to_string())
    }
}

pub struct Store {
    dir: PathBuf,
    pub budget: u64,
}

impl Store {
    /// Opens the directory and removes partial writes left by an interrupted save.
    pub fn open(dir: impl Into<PathBuf>, budget: u64) -> Result<Self, StoreError> {
        let store = Self {
            dir: dir.into(),
            budget,
        };
        fs::create_dir_all(&store.dir)?;
        let listed: BTreeSet<_> = store.list()?.into_iter().map(|m| m.id).collect();
        for entry in fs::read_dir(&store.dir)? {
            let name = entry?.file_name().to_string_lossy().into_owned();
            let orphan = name
                .strip_suffix(".bin.gz")
                .is_some_and(|id| !listed.contains(id));
            if name.ends_with(".tmp") || orphan {
                fs::remove_file(store.dir.join(&name))?;
            }
        }
        Ok(store)
    }
    /// Complete checkpoints, newest first. Unreadable sidecars are ignored, not deleted.
    pub fn list(&self) -> Result<Vec<Meta>, StoreError> {
        let mut entries = Vec::new();
        for entry in fs::read_dir(&self.dir)? {
            let path = entry?.path();
            if path.extension().is_none_or(|e| e != "json") {
                continue;
            }
            let Ok(meta) = serde_json::from_slice::<Meta>(&fs::read(&path)?) else {
                continue;
            };
            let data = fs::metadata(self.data(&meta.id));
            if valid_id(&meta.id) && data.is_ok_and(|d| d.len() == meta.bytes) {
                entries.push(meta);
            }
        }
        entries.sort_by(|a, b| b.created_at.cmp(&a.created_at).then(b.id.cmp(&a.id)));
        Ok(entries)
    }
    pub fn write(&self, capture: Capture) -> Result<Meta, StoreError> {
        let entries = self.list()?;
        let manual = entries
            .iter()
            .filter(|m| m.reason == Reason::Manual)
            .count();
        if capture.reason == Reason::Manual && manual >= MANUAL {
            return Err(StoreError::Full);
        }
        let created_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(0, |d| d.as_millis() as u64)
            .max(entries.first().map_or(0, |m| m.created_at + 1));
        let reason = match capture.reason {
            Reason::Automatic => "automatic",
            Reason::Manual => "manual",
        };
        let id = format!("{reason}-{created_at}-t{}", capture.tick);
        let partial = self.dir.join(format!("{id}.bin.gz.tmp"));
        let mut encoder = GzEncoder::new(
            BufWriter::new(fs::File::create(&partial)?),
            Compression::fast(),
        );
        encoder.write_all(&capture.raw)?;
        let file = encoder.finish()?.into_inner().map_err(|e| e.into_error())?;
        file.sync_all()?;
        let bytes = file.metadata()?.len();
        fs::rename(&partial, self.data(&id))?;
        let meta = Meta {
            id,
            reason: capture.reason,
            version: VERSION,
            seed: capture.seed,
            tick: capture.tick,
            generation: capture.generation,
            population: capture.population,
            created_at,
            bytes,
            raw_bytes: capture.raw.len() as u64,
        };
        let partial = self.dir.join(format!("{}.json.tmp", meta.id));
        let mut sidecar = fs::File::create(&partial)?;
        sidecar
            .write_all(&serde_json::to_vec(&meta).map_err(|e| StoreError::Io(e.to_string()))?)?;
        sidecar.sync_all()?;
        fs::rename(&partial, self.sidecar(&meta.id))?;
        fs::File::open(&self.dir)?.sync_all()?;
        self.prune()?;
        Ok(meta)
    }
    fn prune(&self) -> Result<(), StoreError> {
        let entries = self.list()?;
        let keep = retained(&entries, self.budget);
        for meta in entries.iter().filter(|m| !keep.contains(&m.id)) {
            self.delete(&meta.id)?;
        }
        Ok(())
    }
    /// Decompresses one checkpoint within the server's raw physical checkpoint cap.
    pub fn read(&self, id: &str) -> Result<(Meta, Vec<u8>), StoreError> {
        let meta = self.find(id)?;
        let mut raw = Vec::new();
        GzDecoder::new(fs::File::open(self.data(id))?)
            .take(MAX_CHECKPOINT_BYTES as u64 + 1)
            .read_to_end(&mut raw)?;
        if raw.len() > MAX_CHECKPOINT_BYTES {
            return Err(StoreError::Io(
                "Stored checkpoint exceeds the raw checkpoint cap".into(),
            ));
        }
        Ok((meta, raw))
    }
    pub fn delete(&self, id: &str) -> Result<(), StoreError> {
        self.find(id)?;
        // The sidecar goes first: a crash between removals leaves an orphan that open() removes.
        fs::remove_file(self.sidecar(id))?;
        fs::remove_file(self.data(id))?;
        Ok(())
    }
    /// Newest checkpoint written by this physical format that also restores; others are kept.
    pub fn restore_latest(&self) -> Option<(Meta, World)> {
        for meta in self.list().ok()?.into_iter().filter(Meta::compatible) {
            match self
                .read(&meta.id)
                .map_err(|e| format!("{e:?}"))
                .and_then(|(_, raw)| World::restore(&raw))
            {
                Ok(world) => return Some((meta, world)),
                Err(e) => eprintln!("Skipping stored checkpoint {}: {e}", meta.id),
            }
        }
        None
    }
    fn find(&self, id: &str) -> Result<Meta, StoreError> {
        if !valid_id(id) {
            return Err(StoreError::Missing);
        }
        self.list()?
            .into_iter()
            .find(|m| m.id == id)
            .ok_or(StoreError::Missing)
    }
    fn data(&self, id: &str) -> PathBuf {
        self.dir.join(format!("{id}.bin.gz"))
    }
    fn sidecar(&self, id: &str) -> PathBuf {
        self.dir.join(format!("{id}.json"))
    }
}

/// Always keep the newest checkpoint and every manual one; fill the byte budget with the
/// newest automatic checkpoints, at most six of them.
pub fn retained(entries: &[Meta], budget: u64) -> BTreeSet<String> {
    let mut keep = BTreeSet::new();
    let mut bytes = 0;
    let manual = entries.iter().filter(|m| m.reason == Reason::Manual);
    for meta in entries.first().into_iter().chain(manual) {
        if keep.insert(meta.id.clone()) {
            bytes += meta.bytes;
        }
    }
    let automatic = entries.iter().filter(|m| m.reason == Reason::Automatic);
    for meta in automatic.take(AUTOMATIC) {
        if !keep.contains(&meta.id) && bytes + meta.bytes <= budget {
            keep.insert(meta.id.clone());
            bytes += meta.bytes;
        }
    }
    keep
}

fn valid_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 64
        && id
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
}
