//! Explicit initial-condition authoring. No fixture supplies a controller during stepping.
use crate::{
    controller, genetics::Genotype, metabolism, movement, organism::Cell, sensing, world::World,
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::collections::BTreeSet;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Assignment {
    cell: u64,
    variant: usize,
    x: f64,
    y: f64,
    heading: f64,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Variant {
    genotype: Genotype,
    #[serde(default)]
    changes: controller::diagnostics::Changes,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Fixture {
    variants: Vec<Variant>,
    assignments: Vec<Assignment>,
    #[serde(default)]
    mature: bool,
}

fn fund(cell: &mut Cell, g: &Genotype, w: &World) -> Result<(f64, f64), String> {
    let target = g.compiled.as_ref().unwrap().body;
    let mut surplus = 0.;
    for (stock, goal) in cell.body.iter_mut().zip(target) {
        let returned = (*stock - goal).max(0.);
        *stock -= returned;
        surplus += returned;
    }
    let s = w.chemistry.decomposition;
    cell.inventory.set(s, cell.inventory[s] + surplus);
    let requested = target
        .iter()
        .zip(cell.body)
        .map(|(goal, stock)| goal - stock)
        .sum();
    let (built, heat) = metabolism::assemble(cell, &w.chemistry, &w.config, requested, 0., 0.);
    if (built - requested).abs() > 1e-10 {
        return Err("Cannot fund diagnostic mature body from common packet".into());
    }
    cell.body = target;
    Ok((built, heat))
}

pub fn install(w: &mut World, value: &Value) -> Result<Value, String> {
    if w.tick != 0 || w.trace.is_some() {
        return Err("Fixture installation requires tick zero before assay tracing".into());
    }
    let f: Fixture = serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
    if f.variants.is_empty()
        || f.variants.len() > w.config.max_population
        || f.assignments.len() != w.cells.len()
    {
        return Err("Fixture must assign every founder and use bounded variants".into());
    }
    let mut variants = vec![];
    for (i, v) in f.variants.into_iter().enumerate() {
        let mut g = v.genotype;
        g.validate(&w.config)?;
        for ch in &mut g.chromosomes {
            ch.behavior = controller::diagnostics::change(&ch.behavior, &v.changes)?;
        }
        // Imported/constructed templates start new local roots; their source IDs are provenance.
        g.parent = None;
        g.id = w.next_genome + i as u64;
        g.born = 0;
        g.compile(&w.config, &w.chemistry);
        variants.push(g);
    }
    // Validate and fund copies before publishing any initial-condition change.
    let mut cells = w.cells.clone();
    let mut seen = BTreeSet::new();
    let (mut built, mut heat) = (0., 0.);
    for a in f.assignments {
        if !seen.insert(a.cell) {
            return Err("Duplicate founder assignment".into());
        }
        let c = cells
            .iter_mut()
            .find(|c| c.id == a.cell)
            .ok_or("Unknown founder")?;
        let g = variants.get(a.variant).ok_or("Unknown fixture variant")?;
        c.genome = g.id;
        c.machinery_genome = g.id;
        c.x = a.x;
        c.y = a.y;
        c.heading = a.heading;
        c.brain = controller::State::default();
        if f.mature {
            let funded = fund(c, g, w)?;
            built += funded.0;
            heat += funded.1;
        }
        c.validate(&w.config)?;
        sensing::initialize(c, g.compiled.as_ref().unwrap(), &w.config, &w.field);
    }
    let ids: Vec<_> = variants.iter().map(|g| g.id).collect();
    for g in variants {
        w.genomes.insert(g.id, g);
    }
    w.next_genome += ids.len() as u64;
    w.cells = cells;
    for c in &w.cells {
        w.ancestry[c.id as usize - 1].genome = c.genome;
    }
    w.ledger.flows.constructed += built;
    w.ledger.flows.construction += heat;
    w.event("authored-founders", 0, ids.clone());
    Ok(json!({"genomes":ids,"constructed":built,"constructionHeat":heat}))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Pulse {
    mixture: Vec<(usize, f64)>,
    center: Option<[f64; 2]>,
    sigma: Option<f64>,
}
pub fn pulse(w: &mut World, value: &Value) -> Result<Value, String> {
    let p: Pulse = serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
    if p.mixture.len() > 256
        || p.mixture
            .iter()
            .any(|(s, q)| *s >= 256 || !q.is_finite() || *q < 0. || *q > 1e9)
        || p.center.is_some_and(|xy| xy.iter().any(|x| !x.is_finite()))
        || p.center.is_some() != p.sigma.is_some()
        || p.sigma.is_some_and(|s| {
            !s.is_finite() || s < w.config.mesh / 4. || s > w.config.width.max(w.config.height)
        })
    {
        return Err("Invalid finite chemical pulse".into());
    }
    let spacing = w.field.spacing;
    let mut weights = vec![];
    let mut total = 0.;
    for i in 0..w.field.nx * w.field.ny {
        let xy = [
            (i % w.field.nx) as f64 * spacing + spacing / 2.,
            (i / w.field.nx) as f64 * spacing + spacing / 2.,
        ];
        let weight = if let Some(center) = p.center {
            let d2 = movement::distance_squared(xy, center, &w.config);
            let sigma = p.sigma.unwrap();
            if d2 > 9. * sigma * sigma {
                0.
            } else {
                (-d2 / (2. * sigma * sigma)).exp()
            }
        } else {
            1.
        };
        weights.push(weight);
        total += weight;
    }
    if total <= 0. {
        return Err("Pulse footprint does not cover a field node".into());
    }
    for (s, amount) in p.mixture {
        for (i, weight) in weights.iter().enumerate() {
            let q = amount * weight / total;
            let round = w.field.add(i, s, q, &w.chemistry);
            w.ledger.rounding(round, s, &w.chemistry);
        }
        w.ledger.supplied += amount;
        w.ledger.supplied_energy += amount * w.chemistry.properties[s].potential;
    }
    w.event("external-pulse", 0, vec![]);
    Ok(crate::observation::summary(w))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn paid_fixture_is_atomic_and_shared_genotypes_are_preserved() {
        let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
        let mut g = w.genomes[&1].clone();
        g.chromosomes[0].physical[1] = 1.;
        let fixture = json!({"variants":[{"genotype":g}],"assignments":[{"cell":1,"variant":0,"x":12.,"y":12.,"heading":0.}],"mature":true});
        let before = w.held();
        install(&mut w, &fixture).unwrap();
        assert!((w.cells[0].body[1] - 0.16).abs() < 1e-10);
        assert!((w.held().0 - before.0).abs() < 1e-10);
        assert!((w.held().1 + w.ledger.heat() - before.1).abs() < 1e-10);
        let snapshot = w.snapshot().unwrap();
        let mut invalid = fixture.clone();
        invalid["assignments"][0]["x"] = json!(-1.);
        assert!(install(&mut w, &invalid).is_err());
        assert_eq!(snapshot, w.snapshot().unwrap());
    }
    #[test]
    fn pulses_are_accounted_at_both_meshes() {
        for mesh in [1., 2.] {
            let mut w = crate::diagnostics::nutrition(0.8, mesh, false, false);
            pulse(
                &mut w,
                &json!({"mixture":[[0,96.]],"center":[12.,12.],"sigma":2.}),
            )
            .unwrap();
            let s = crate::observation::summary(&w);
            assert!(s["materialResidual"].as_f64().unwrap().abs() < 1e-10);
            assert!(s["energyResidual"].as_f64().unwrap().abs() < 1e-9);
        }
    }
}
