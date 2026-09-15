//! Restore-time consistency checks; these never run in the tick loop.
use crate::{ancestry::Cause, world::World};
use std::collections::BTreeSet;

pub fn history(w: &World, living: &BTreeSet<u64>) -> Result<(), String> {
    let mut depths = Vec::<u32>::with_capacity(w.ancestry.len());
    for (i, a) in w.ancestry.iter().enumerate() {
        if a.id != i as u64 + 1
            || a.parent >= a.id
            || a.born > w.tick
            || a.ended().is_some_and(|t| t < a.born || t > w.tick)
            || matches!(a.cause, Cause::Alive) != a.ended().is_none()
            || a.ended().is_none() != living.contains(&a.id)
            || a.genome == 0
            || a.genome >= w.next_genome
        {
            return Err("Invalid ancestry record".into());
        }
        let depth = if let Some(parent) = a.parent() {
            let p = &w.ancestry[parent as usize - 1];
            if a.lineage != p.lineage || a.born < p.born {
                return Err("Inconsistent parentage".into());
            }
            depths[parent as usize - 1] + 1
        } else {
            if a.lineage != a.id {
                return Err("Invalid founder lineage".into());
            }
            0
        };
        depths.push(depth);
    }
    for c in &w.cells {
        let a = &w.ancestry[c.id as usize - 1];
        if c.born != a.born || c.generation != depths[c.id as usize - 1] as u64 {
            return Err("Body and ancestry disagree on age or generation".into());
        }
    }
    Ok(())
}

// Serde maps non-finite floats to null. These records contain numbers and objects only.
fn finite_numbers(v: &serde_json::Value) -> bool {
    match v {
        serde_json::Value::Number(n) => n.as_f64().is_some_and(f64::is_finite),
        serde_json::Value::Object(o) => o.values().all(finite_numbers),
        _ => false,
    }
}
pub fn numeric_record(v: &impl serde::Serialize) -> Result<(), String> {
    if !finite_numbers(&serde_json::to_value(v).map_err(|e| e.to_string())?) {
        return Err("Non-finite accounting record".into());
    }
    Ok(())
}
pub fn environment(w: &World) -> Result<(), String> {
    numeric_record(&w.ledger)?;
    let position = |x: f64, y: f64| {
        x.is_finite()
            && y.is_finite()
            && x >= 0.
            && x < w.config.width
            && y >= 0.
            && y < w.config.height
    };
    if w.sources.len() > 10000 || w.patch_centers.iter().any(|p| !position(p[0], p[1])) {
        return Err("Invalid source landscape".into());
    }
    for s in &w.sources {
        let h = &s.habitat;
        if !position(h.x, h.y)
            || !h.radius.is_finite()
            || h.radius < 0.
            || !h.richness.is_finite()
            || h.richness < 0.
            || !(0. ..=1.).contains(&h.share)
            || [s.remaining, s.wait, s.rate]
                .iter()
                .any(|v| !v.is_finite() || *v < 0.)
            || s.inventory.len() != 256
            || s.inventory.iter().any(|q| !q.is_finite() || *q < 0.)
        {
            return Err("Invalid source state".into());
        }
    }
    let mut previous = 0;
    for e in &w.events {
        if e.tick < previous
            || e.tick > w.tick
            || e.cell >= w.next_cell
            || e.location
                .is_some_and(|p| !position(p[0], p[1]) || !p[2].is_finite() || p[2] < 0.)
        {
            return Err("Invalid event history".into());
        }
        previous = e.tick;
    }
    Ok(())
}
