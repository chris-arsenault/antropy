//! Synthetic storage fixtures carry no claim about an evolved population.
use crate::{
    diagnostics,
    world::{Ancestor, World},
};
use serde_json::{Value, json};

pub fn history(w: &mut World, count: usize) -> Result<Value, String> {
    if w.tick != 0
        || w.cells.is_empty()
        || count <= w.cells.len()
        || count > w.config.max_ancestry_records
    {
        return Err(
            "History load requires founders at tick zero and more bounded records than living cells".into(),
        );
    }
    let genome = w.cells[0].genome;
    let parent = (count - w.cells.len()) as u64;
    w.ancestry = (1..=count as u64)
        .map(|id| Ancestor {
            id,
            parent: (id - 1).min(parent),
            lineage: 1,
            genome,
            born: id - 1,
            ended: if id > parent {
                crate::ancestry::ALIVE
            } else {
                id
            },
            cause: if id > parent {
                crate::ancestry::Cause::Alive
            } else {
                crate::ancestry::Cause::SyntheticHistory
            },
        })
        .collect();
    for (i, c) in w.cells.iter_mut().enumerate() {
        c.id = parent + 1 + i as u64;
        c.parent = Some(parent);
        c.lineage = 1;
        c.generation = parent;
        c.born = c.id - 1;
    }
    w.next_cell = count as u64 + 1;
    w.tick = count as u64;
    w.events.clear();
    w.event("synthetic-history", count as u64, vec![]);
    w.validate()?;
    Ok(json!({"records":count,"tick":w.tick}))
}
pub fn field(w: &mut World, kind: &str) -> Result<Value, String> {
    if w.tick != 0 {
        return Err("Chemical storage load requires tick zero".into());
    }
    if !["empty", "patchy", "widespread", "dense"].contains(&kind) {
        return Err("Unknown chemical storage load".into());
    }
    w.sources.clear();
    w.field.amounts.fill(0.);
    if kind == "patchy" {
        let node = (w.field.ny / 2 * w.field.nx + w.field.nx / 2) * 256;
        for s in (0..256).step_by(16) {
            w.field.amounts[node + s] = 1.;
        }
    }
    if kind == "widespread" {
        for node in w.field.amounts.as_chunks_mut::<256>().0 {
            for s in (0..256).step_by(16) {
                node[s] = 0.001;
            }
        }
    }
    if kind == "dense" {
        for (i, q) in w.field.amounts.iter_mut().enumerate() {
            *q = (0.001 * (1. + 0.2 * ((i % 997) as f64).sin())) as f32;
        }
    }
    w.field.refresh(&w.chemistry);
    diagnostics::initialize(w);
    w.event("synthetic-chemical-load", 0, vec![]);
    Ok(crate::observation::summary(w))
}
