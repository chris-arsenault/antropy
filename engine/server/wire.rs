//! One compressed, revisioned publication; baselines commit only after acknowledgement.
use super::{display::ViewKey, observation_delta, runtime::Publication, scene::Scene};
use axum::body::Bytes;
use flate2::{Compression, write::GzEncoder};
use serde_json::json;
use std::{io::Write, sync::Arc};

pub struct Baseline {
    pub sequence: u64,
    pub generation: u64,
    pub key: ViewKey,
    pub scene: Arc<Scene>,
    pub status: Arc<serde_json::Value>,
    pub terrain_revision: u32,
}
pub type CacheKey = (ViewKey, u64, Option<ViewKey>, u64, bool);
pub fn encode(
    p: &Publication,
    key: ViewKey,
    revision: u64,
    operator: bool,
    previous: Option<&Baseline>,
) -> Result<(Bytes, Baseline), String> {
    let scene = p.scenes.get(&key).ok_or("Missing requested scene")?.clone();
    let previous = previous.filter(|b| b.generation == p.generation);
    let cache_key = (
        key,
        previous.map_or(0, |b| b.sequence),
        previous.map(|b| b.key),
        revision,
        operator,
    );
    let next = Baseline {
        sequence: p.sequence,
        generation: p.generation,
        key,
        scene: scene.clone(),
        status: p.status.clone(),
        terrain_revision: p.terrain_revision,
    };
    if let Some(packet) = p.packets.lock().unwrap().get(&cache_key) {
        return Ok((packet.clone(), next));
    }
    let old_scene = previous.filter(|b| b.key == key && scene.same_grid(&b.scene));
    let terrain = if previous.is_none_or(|b| b.terrain_revision != p.terrain_revision) {
        p.terrain.as_ref()
    } else {
        &[]
    };
    let metadata = json!({"kind":"publication","version":3,"sequence":p.sequence,
        "base":previous.map_or(0, |b| b.sequence),"generation":p.generation,"tick":p.tick,
        "revision":revision,"operator":operator,"reset":old_scene.is_none(),
        "nx":scene.nx,"ny":scene.ny,"extent":scene.extent,
        "viewKind":scene.kind,"solar":scene.solar,
        "axes":if old_scene.is_none() { serde_json::json!(scene.axes) } else { serde_json::Value::Null },
        "terrainRevision":p.terrain_revision,
        "definition":if previous.is_none() { &*p.definition } else { &serde_json::Value::Null },
        "status":observation_delta::status(&p.status, previous.map(|b| &*b.status))});
    let json = serde_json::to_vec(&metadata).map_err(|e| e.to_string())?;
    let mut raw = Vec::new();
    for n in [0x4254494e, 1, json.len() as u32, terrain.len() as u32] {
        raw.extend(n.to_le_bytes());
    }
    raw.extend(json);
    raw.extend(terrain);
    scene.encode(old_scene.map(|b| &*b.scene), &mut raw);
    if raw.len() > 16 * 1024 * 1024 {
        return Err("Scene update exceeds 16 MiB".into());
    }
    let mut gzip = GzEncoder::new(Vec::new(), Compression::fast());
    gzip.write_all(&raw).map_err(|e| e.to_string())?;
    let packet: Bytes = gzip.finish().map_err(|e| e.to_string())?.into();
    let mut cache = p.packets.lock().unwrap();
    if cache.len() < super::runtime::MAX_VIEWERS {
        cache.insert(cache_key, packet.clone());
    }
    Ok((packet, next))
}
