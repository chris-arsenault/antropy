//! Small local projections captured before a cell spills or divides.
use crate::{footprint, organism::Cell, world::World};
use serde_json::{Value, json};

pub fn capture(w: &World, cell: &Cell) -> Value {
    let sites = footprint::sites(cell, &w.config, &w.field);
    let local: Vec<_> = (0..256).map(|s| w.field.sample(s, &sites)).collect();
    let mut overlaps: Vec<_> = w
        .sources
        .iter()
        .enumerate()
        .filter_map(|(i, s)| {
            let weight: f64 = sites
                .iter()
                .map(|(n, a)| {
                    s.footprint
                        .binary_search_by_key(n, |(node, _)| *node)
                        .map_or(0., |j| a * s.footprint[j].1)
                })
                .sum();
            (weight > 0.).then_some((i, weight))
        })
        .collect();
    let count = overlaps.len();
    let total: f64 = overlaps.iter().map(|(_, a)| a).sum();
    overlaps.sort_by(|a, b| b.1.total_cmp(&a.1).then(a.0.cmp(&b.0)));
    let sources: Vec<_> = overlaps
        .into_iter()
        .take(8)
        .map(|(i, weight)| {
            let s = &w.sources[i];
            json!({"source":i,"weight":weight/total,"position":[s.habitat.x,s.habitat.y],
            "amount":s.amount,"allowance":s.allowance,"wait":s.wait,"rate":s.rate,
            "emptyElapsed":s.empty_elapsed,
            "supplyMultiplier":w.shade.geography.season([s.habitat.x,s.habitat.y],w.tick as f64*w.config.dt),
            "pending":s.pending,"admissionPending":s.admission_pending,"mixture":s.mixture,
            "totalReleased":s.total_released,"recentRecovery":s.recent_recovery})
        })
        .collect();
    json!({"local":local,"sources":sources,"overlappingSources":count,
        "sourcesOmitted":count.saturating_sub(8),"phase":"before body spill, reservoir admission or division payment"})
}
