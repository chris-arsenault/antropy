//! Snapshot-neutral secondary-resource budgets; outputs stay in local harness artifacts.
use antropy_engine::{chemistry, footprint, metabolism, optics, world::World};
use serde_json::{Value, json};
use std::{fs, io::Write, path::Path};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
#[path = "secondary_economy/feedback.rs"]
mod feedback;
#[path = "secondary_economy/ordinary.rs"]
mod ordinary;
#[path = "secondary_economy/reservoir.rs"]
mod reservoir;

fn save(path: &Path, value: &Value) -> Result<()> {
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    serde_json::to_writer(&mut file, value)?;
    file.write_all(b"\n")?;
    Ok(())
}

fn top(values: &[f64], count: usize) -> Vec<(usize, f64)> {
    let mut rows: Vec<_> = values
        .iter()
        .copied()
        .enumerate()
        .filter(|r| r.1 > 0.)
        .collect();
    rows.sort_by(|a, b| b.1.total_cmp(&a.1));
    rows.truncate(count);
    rows
}

fn budget(w: &World) -> Value {
    let starting = w.config.founder_circuit;
    let mut field = [0.; 256];
    for (_, row) in w.field.amounts().rows() {
        for (a, q) in field.iter_mut().zip(row) {
            *a += *q as f64;
        }
    }
    let mut released_profile = [0.; 256];
    for source in &w.sources {
        for (a, q) in released_profile.iter_mut().zip(&source.supply_condition) {
            *a += source.rate * q;
        }
    }
    let sites: Vec<_> = w
        .cells
        .iter()
        .map(|c| footprint::sites(c, &w.config, &w.field))
        .collect();
    let exposures = optics::observed_cell_exposures(w, &sites);
    let mut imports = [0.; 256];
    let mut consumed = [0.; 256];
    let mut exports = [0.; 256];
    let mut shares = [0_usize; 4];
    let mut rows = Vec::new();
    for ((cell, sites), (signal, exposure)) in w.cells.iter().zip(sites).zip(exposures) {
        for s in 0..256 {
            imports[s] += cell.chemical_flows.imported.value(s);
            consumed[s] += cell.chemical_flows.consumed.value(s);
            exports[s] += cell.chemical_flows.exported.value(s);
        }
        let total: f64 = cell.chemical_flows.consumed.iter().sum();
        let secondary: f64 = (0..256)
            .filter(|s| !starting.contains(s))
            .map(|s| cell.chemical_flows.consumed.value(s))
            .sum();
        for (count, threshold) in shares.iter_mut().zip([0., 0.01, 0.1, 0.5]) {
            *count += usize::from(total > 0. && secondary / total > threshold);
        }
        let local: Vec<f64> = (0..256).map(|s| w.field.sample(s, &sites)).collect();
        let drive = antropy_engine::illumination::drive(signal, exposure.drive());
        let mut opportunities = Vec::new();
        for (s, concentration) in top(&local, 12)
            .into_iter()
            .filter(|(s, _)| !starting.contains(s))
        {
            let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
            let current_yield = antropy_engine::economy::local_work_ceiling(g, s, &w.config, drive);
            let mut best = (0., s, 0.);
            for t in 0..256 {
                let products = [antropy_engine::chemical_products::ProductWeight {
                    species: t,
                    weight: 1.,
                }];
                let coefficient =
                    antropy_engine::transformation_work::coefficient(&w.chemistry, s, products);
                let supplied = w.config.environmental_work
                    * antropy_engine::transformation_work::engagement(coefficient, drive);
                let yield_ = antropy_engine::transformation_work::cellular(
                    w.chemistry.properties[s].potential - w.chemistry.properties[t].potential,
                    supplied,
                    f64::from(s != t),
                    w.config.conversion_efficiency,
                )[0];
                let distance =
                    chemistry::distance_squared(chemistry::coordinate(s), chemistry::coordinate(t));
                let rate_return = yield_
                    * antropy_engine::transformation_work::kinetic(
                        distance,
                        w.config.affinity_radius,
                    );
                if rate_return > best.0 {
                    best = (rate_return, t, yield_);
                }
            }
            let pump: f64 = g
                .operators
                .transporters
                .iter()
                .enumerate()
                .map(|(i, p)| {
                    p.iter()
                        .find(|a| a.species == s)
                        .map_or(0., |a| cell.body[7 + i] * a.value)
                })
                .sum();
            opportunities.push(json!({"substrate":s,"concentration":concentration,"currentYieldCeiling":current_yield,
                "bestKineticReturn":best.0,"bestProduct":best.1,"bestYield":best.2,"recognizedPumpStock":pump}));
        }
        let mut copy = cell.clone();
        copy.flows = Default::default();
        metabolism::react_observed(
            &mut copy,
            &w.config,
            &w.chemistry,
            w.config.physiology_interval,
            false,
            drive,
        );
        rows.push(json!({"id":cell.id,"genome":cell.genome,"mass":cell.mass(),"age":(w.tick-cell.born) as f64*w.config.dt,
            "energy":cell.energy,"maintenance":cell.basal(&w.config,w.tick),"body":cell.body,
            "secondaryShare":if total>0. { secondary/total } else { 0. },"reactionWork":copy.energy-cell.energy,
            "drive":drive,"local":top(&local,12),"opportunities":opportunities,
            "enzymes":cell.chemistry().enzymes,"keys":cell.chemistry().keys}));
    }
    json!({"tick":w.tick,"population":w.cells.len(),"starting":starting,"config":w.config,
        "field":top(&field,256),"supplyRateProfile":top(&released_profile,256),
        "survivorLifetimeImports":top(&imports,256),"survivorLifetimeConsumed":top(&consumed,256),
        "survivorLifetimeExports":top(&exports,256),"cellShareThresholds":[0.,0.01,0.1,0.5],"cellCounts":shares,
        "cells":rows,"chemicalProperties":w.chemistry.properties,
        "meaning":"Zero-tick local potential/kinetic ceilings and actual retained-state reaction on clones. No growth prediction; lifetime survivor totals exclude ended cells and are not interval fluxes."})
}

fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() == 3 && args[0] == "ordinary" {
        return ordinary::run(Path::new(&args[1]), Path::new(&args[2]));
    }
    if args.len() == 2 && args[0] == "probe" {
        return feedback::run(Path::new(&args[1]));
    }
    if args.len() == 2 && args[0] == "reservoir" {
        return reservoir::run(Path::new(&args[1]));
    }
    if args.len() != 2 {
        return Err("Usage: secondary_economy CHECKPOINT NEW_JSON".into());
    }
    let w = World::restore(&fs::read(&args[0])?)?;
    let before = w.snapshot()?;
    let value = budget(&w);
    assert!(before == w.snapshot()?, "Budget changed physical state");
    save(Path::new(&args[1]), &value)?;
    println!(
        "tick={} population={} zero-tick budget saved",
        w.tick,
        w.cells.len()
    );
    Ok(())
}
