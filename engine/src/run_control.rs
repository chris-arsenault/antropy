//! Prospective configuration changes at an ordinary completed physiology boundary.
use crate::{config::Config, world::World};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

pub const LIVE: &[&str] = &[
    "activity",
    "mortalityRecovery",
    "mortalityLocal",
    "mortalityMemory",
    "mortalityHalfResponse",
    "learning",
    "reflexLearning",
    "activityReinforcement",
    "strategicLearning",
    "strategicContext",
    "strategicGain",
    "learningRetention",
    "plasticityCost",
    "controllerCost",
    "utteranceWorkDensity",
    "speech",
    "listening",
    "hearingContent",
    "hearingBearing",
    "illuminationContrast",
    "geographicShade",
    "opticalColumn",
    "opticalReach",
    "opticalPowerDensity",
    "illuminationFastPeriod",
    "illuminationSlowPeriod",
    "illuminationModulationPeriod",
];

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct State {
    pub revision: u64,
    pub pending: Option<Config>,
    pub changes: Vec<Change>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Change {
    pub tick: u64,
    pub revision: u64,
    pub patch: String,
}

pub fn status(w: &World) -> Value {
    let changes: Vec<_> = w
        .run_control
        .changes
        .iter()
        .map(|change| {
            json!({"tick":change.tick,"revision":change.revision,
            "patch":serde_json::from_str::<Value>(&change.patch).unwrap_or(Value::Null)})
        })
        .collect();
    json!({"revision":w.run_control.revision,"pending":w.run_control.pending,
        "changes":changes,"liveFields":LIVE,
        "effectiveActivity":w.config.active_features(),
        "boundary":"completed physiology interval"})
}

pub fn validate(w: &World) -> Result<(), String> {
    let state = &w.run_control;
    if state.pending.is_some() && state.revision == u64::MAX {
        return Err("Pending configuration exceeds revision capacity".into());
    }
    if let Some(config) = &state.pending {
        config.validate()?;
        let before = serde_json::to_value(&w.config).map_err(|e| e.to_string())?;
        let after = serde_json::to_value(config).map_err(|e| e.to_string())?;
        if before
            .as_object()
            .unwrap()
            .iter()
            .any(|(key, value)| !LIVE.contains(&key.as_str()) && after.get(key) != Some(value))
        {
            return Err("Pending live configuration changes a structural field".into());
        }
    }
    if state.changes.len() > 64
        || state.changes.iter().any(|change| {
            change.tick > w.tick
                || change.revision > state.revision
                || change.patch.len() > 16 * 1024
                || serde_json::from_str::<Value>(&change.patch).is_err()
        })
    {
        return Err("Invalid runtime configuration history".into());
    }
    Ok(())
}

pub fn configure(w: &mut World, request: &Value) -> Result<Value, String> {
    let patch = request["patch"]
        .as_object()
        .ok_or("patch must be an object")?;
    if patch.is_empty() {
        return Err("Configuration patch is empty".into());
    }
    for key in patch.keys() {
        if serde_json::to_value(&w.config)
            .map_err(|e| e.to_string())?
            .get(key)
            .is_none()
        {
            return Err(format!("Unknown configuration field: {key}"));
        }
        if !LIVE.contains(&key.as_str()) {
            return Err(format!("{key} requires an explicit fresh-world restart"));
        }
    }
    if request
        .get("revision")
        .is_some_and(|v| v.as_u64() != Some(w.run_control.revision))
    {
        return Err("Configuration revision changed; refresh before applying".into());
    }
    if w.run_control.pending.is_some() {
        return Err("A configuration change is pending; inspect runControls first".into());
    }
    if w.run_control.revision == u64::MAX {
        return Err("Configuration revision capacity reached".into());
    }
    let mut value = serde_json::to_value(&w.config).map_err(|e| e.to_string())?;
    merge(&mut value, &Value::Object(patch.clone()));
    let config: Config = serde_json::from_value(value).map_err(|e| e.to_string())?;
    config.validate()?;
    if request["preview"].as_bool() == Some(true) {
        return Ok(json!({"config":config,"controls":status(w)}));
    }
    w.run_control.pending = Some(config);
    if w.field_elapsed == 0. {
        commit(w);
    }
    Ok(json!({"config":w.config,"controls":status(w)}))
}

fn merge(base: &mut Value, patch: &Value) {
    if let (Some(target), Some(source)) = (base.as_object_mut(), patch.as_object()) {
        for (key, value) in source {
            merge(target.entry(key.clone()).or_insert(Value::Null), value);
        }
    } else {
        *base = patch.clone();
    }
}

pub fn commit(w: &mut World) {
    let Some(next) = w.run_control.pending.take() else {
        return;
    };
    let before = serde_json::to_value(&w.config).expect("finite validated config");
    let after = serde_json::to_value(&next).expect("finite validated config");
    let patch: serde_json::Map<String, Value> = after
        .as_object()
        .unwrap()
        .iter()
        .filter(|(key, value)| before.get(key.as_str()) != Some(value))
        .map(|(key, value)| (key.clone(), value.clone()))
        .collect();
    if w.config.mortality_memory != next.mortality_memory {
        w.local_mortality
            .settle(w.tick as f64 * w.config.dt, &w.config);
    }
    w.config = next;
    // Only derived optics are refreshed; existing film material and paid work stay owned.
    crate::cover::refresh(w);
    w.field
        .illumination
        .prepare(w.seed, w.tick, &w.config, w.field.nx, w.field.ny);
    w.cover
        .illumination
        .prepare(w.seed, w.tick, &w.config, w.field.nx, w.field.ny);
    w.run_control.revision += 1;
    w.run_control.changes.push(Change {
        tick: w.tick,
        revision: w.run_control.revision,
        patch: Value::Object(patch).to_string(),
    });
    if w.run_control.changes.len() > 64 {
        w.run_control.changes.remove(0);
    }
    for cell in &mut w.cells {
        crate::controller::invalidate(&mut cell.brain);
        let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
        crate::sensing::observe(cell, g, &w.config, &w.field);
    }
}

#[cfg(test)]
#[path = "run_control_tests.rs"]
mod tests;
