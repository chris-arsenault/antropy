//! Frozen-state contractions for the interrupted study; never advances World.
use antropy_engine::{illumination, metabolism, organism::Cell, weathering, world::World};
use serde_json::{Value, json};

fn yields(w: &World, c: &Cell, drives: &[[f64; 2]]) -> Value {
    let mixture = metabolism::retained_response(c, &w.config, &w.chemistry);
    let mut work = vec![0.; drives.len()];
    let mut rate = 0.;
    let mut neutral_rate = 0.;
    let mut neutral_work = 0.;
    let mut stimulated = 0.;
    let mut inhibited = 0.;
    for (slot, enzyme) in c.operators.as_ref().unwrap().enzymes.iter().enumerate() {
        let stock = c.body[antropy_engine::organism::enzyme_stock(slot)];
        if !c.chemistry().programs[slot] || stock == 0. || c.action.activity[slot] == 0. {
            continue;
        }
        let occupancy: f64 = enzyme
            .engagement
            .iter()
            .map(|a| a.value * c.inventory.value(a.species))
            .sum();
        let factor = w.config.enzyme_turnover * stock * c.action.activity[slot] * (1. - c.damage)
            / (w.config.receptor_k * c.volume(&w.config) + occupancy).max(1e-30);
        for row in &enzyme.conversions {
            let base = factor * row.catalytic * c.inventory.value(row.substrate);
            if base == 0. {
                continue;
            }
            let modifier = metabolism::response(row.work_coefficient, mixture);
            neutral_rate += base * row.changed;
            rate += base * row.changed * modifier;
            stimulated += base * row.changed * (modifier - 1.).max(0.);
            inhibited += base * row.changed * (1. - modifier).max(0.);
            neutral_work += base * row.energy(&w.config, drives[0])[0];
            for (total, drive) in work.iter_mut().zip(drives) {
                *total += base * modifier * row.energy(&w.config, *drive)[0];
            }
        }
    }
    json!({"requestedMaterialRate":rate,"neutralMixtureRate":neutral_rate,
        "requestedWorkRates":work,"neutralMixtureWorkRate":neutral_work,
        "stimulatedMaterialRate":stimulated,"inhibitedMaterialRate":inhibited})
}

pub fn body_signals(w: &World) -> Vec<[f64; 2]> {
    let mut result = vec![[0.; 2]; w.field.nx * w.field.ny];
    antropy_engine::footprint::visit_current(w, |n, value| {
        for (a, b) in result[n].iter_mut().zip(value) {
            *a += b;
        }
    });
    result
}

fn cell(w: &World, c: &Cell, bodies: &[[f64; 2]]) -> Value {
    let sites = antropy_engine::footprint::sites(c, &w.config, &w.field);
    let components = [
        w.field.signal.as_slice(),
        w.field.source_signal.as_slice(),
        bodies,
    ];
    let signals: [[f64; 2]; 3] = components
        .map(|values| std::array::from_fn(|k| sites.iter().map(|&(n, a)| a * values[n][k]).sum()));
    let total = std::array::from_fn(|k| signals.iter().map(|s| s[k]).sum());
    let no_body = std::array::from_fn(|k| signals[0][k] + signals[1][k]);
    let own_weight =
        c.mass() / w.field.spacing.powi(2) * sites.iter().map(|&(_, a)| a * a).sum::<f64>();
    let no_self =
        std::array::from_fn(|k| total[k] - own_weight * c.operators.as_ref().unwrap().profile[k]);
    let light = w.field.illumination.sample(&sites);
    let drive = illumination::drive(weathering::signal(total), light);
    let drives = [
        drive,
        illumination::drive(weathering::signal(no_body), light),
        illumination::drive(weathering::signal(total), 1.),
        [0.; 2],
        illumination::drive(weathering::signal(no_self), light),
    ];
    json!({"id":c.id,"signals":signals,"membraneProfile":c.operators.as_ref().unwrap().profile,
        "light":light,"drive":drive,"yields":yields(w,c,&drives)})
}

pub fn inspect(w: &World) -> Value {
    let bodies = body_signals(w);
    let cells: Vec<_> = w.cells.iter().map(|c| cell(w, c, &bodies)).collect();
    json!({"tick":w.tick,"cells":cells,
        "workRateOrder":["actual","withoutBodySignal","uniformLight","withoutExternalWork","withoutOwnBodySignal"],
        "meaning":"Frozen occupied-row requests per model second, before donor and energy reservation; not accepted flux or a survival intervention."})
}
