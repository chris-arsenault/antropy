//! Read-only v33 organization reductions; no controller representation inspection.
use antropy_engine::{
    controller, interfaces::Graph, metabolism, organism::Cell, sensing, world::World,
};
use serde_json::{Value, json};
use std::collections::BTreeMap;

/// Stock-weighted diversity of installed linear conversion kernels, not accepted flux.
/// Identical copies score one; equally funded disjoint kernels score their count.
fn effective_programs(c: &Cell) -> Option<f64> {
    let operators = c.operators.as_ref().unwrap();
    let mut kernels = Vec::new();
    for (slot, op) in operators.enzymes.iter().enumerate() {
        let stock = c.body[antropy_engine::organism::enzyme_stock(slot)];
        if stock <= 1e-6 || !c.chemistry().programs[slot] {
            continue;
        }
        let mut kernel = BTreeMap::<usize, f64>::new();
        for row in &op.conversions {
            for product in &row.products {
                if product.species != row.substrate {
                    *kernel
                        .entry(row.substrate * 256 + product.species)
                        .or_default() += row.catalytic * product.weight;
                }
            }
        }
        let norm = kernel.values().map(|q| q * q).sum::<f64>().sqrt();
        if norm > 0. {
            kernels.push((stock, norm, kernel));
        }
    }
    let total = kernels.iter().map(|k| k.0).sum::<f64>();
    let mut overlap = 0.;
    for (a, na, ka) in &kernels {
        for (b, nb, kb) in &kernels {
            let dot = ka
                .iter()
                .map(|(key, q)| q * kb.get(key).unwrap_or(&0.))
                .sum::<f64>();
            overlap += a * b * dot / (na * nb);
        }
    }
    (overlap > 0.).then_some(total * total / overlap)
}

fn external_drive(w: &World, c: &Cell, bodies: &[[f64; 2]]) -> [f64; 2] {
    let sites = antropy_engine::footprint::sites(c, &w.config, &w.field);
    let signal = antropy_engine::weathering::signal(std::array::from_fn(|k| {
        sites
            .iter()
            .map(|&(n, a)| {
                a * (w.field.material_signal(n)[k] + w.field.source_signal()[n][k] + bodies[n][k])
            })
            .sum()
    }));
    antropy_engine::illumination::drive(signal, w.field.illumination.sample(&sites))
}

fn infer(w: &World, c: &Cell, inputs: &[f32]) -> controller::Action {
    let behavior = &w.genomes[&c.genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .behavior;
    controller::act(behavior, inputs, &mut c.brain.clone(), &w.config, false)
}

fn regulation(w: &World, cell: &Cell) -> Value {
    let mut c = cell.clone();
    let g = w.genomes[&c.genome].compiled.as_ref().unwrap();
    sensing::observe(&mut c, g, &w.config, &w.field);
    let normal = infer(w, &c, &c.inputs);
    let mut inward_absent = c.inputs.clone();
    inward_absent[controller::INWARD_INPUT..controller::INWARD_INPUT + 8].fill(0.);
    let mut inward_shift = c.inputs.clone();
    for slot in 0..4 {
        let stock = c.body[3 + slot] * c.chemistry().inward[slot];
        let gain = stock / (stock + w.config.receptor_ratio * c.body[0]).max(1e-30);
        let input = controller::INWARD_INPUT + 2 * slot;
        inward_shift[input] = (inward_shift[input] as f64 + 0.05 * gain).min(gain) as f32;
    }
    let mut light_absent = c.inputs.clone();
    light_absent[controller::LIGHT_INPUT..controller::LIGHT_INPUT + 4].fill(0.);
    json!({"normal":normal,"inwardAbsent":infer(w,&c,&inward_absent),
        "inwardShifted":infer(w,&c,&inward_shift),"lightAbsent":infer(w,&c,&light_absent),
        "inputs":c.inputs,"acquiredRms":controller::acquired_rms(&g.chromosome.behavior,&c.brain,&w.config)})
}

pub fn inspect(w: &World, c: &Cell, graph: &Graph, index: usize, bodies: &[[f64; 2]]) -> Value {
    let mixture = metabolism::retained_response(c, &w.config, &w.chemistry);
    let g = w.genomes[&c.genome].compiled.as_ref().unwrap();
    let rates: Vec<_> = c.operators.as_ref().unwrap().enzymes.iter().enumerate().map(|(slot, op)| {
        let stock = c.body[antropy_engine::organism::enzyme_stock(slot)];
        let rows: Vec<_> = op.conversions.iter().filter(|e| c.inventory.value(e.substrate) > 0. && stock > 0. && c.chemistry().programs[slot]).collect();
        let weights: f64 = rows.iter().map(|e| e.catalytic * c.inventory.value(e.substrate)).sum();
        let modifiers: Vec<_> = rows.iter().map(|e| metabolism::response(e.work_coefficient,mixture)).collect();
        let mean = rows.iter().zip(&modifiers).map(|(e,m)| e.catalytic * c.inventory.value(e.substrate) * m).sum::<f64>() / weights.max(1e-30);
        json!({"slot":slot,"rowsWithSubstrate":rows.len(),"weightedMean":if weights > 0. {Some(mean)} else {None},
            "minimum":modifiers.iter().copied().reduce(f64::min),"maximum":modifiers.iter().copied().reduce(f64::max)})
    }).collect();
    let neighbors: Vec<_> = graph
        .neighbors(index)
        .iter()
        .map(|n| {
            json!({
                "id":w.cells[n.donor].id,"weight":n.weight,"injury":w.cells[n.donor].damage
            })
        })
        .collect();
    json!({"retainedResponse":mixture,"rateModifiers":rates,"control":c.action,
        "effectiveInstalledPrograms":effective_programs(c),
        "externalDrive":external_drive(w,c,bodies),
        "regulation":regulation(w,c),"freeChemistry":c.inventory,"boundChemistry":c.bound_material,
        "inheritedMachinery":g.chromosome.chemistry,"fieldInterface":graph.field[index],
        "neighbors":neighbors,"maintenancePerSecond":antropy_engine::organism::maintenance_rate(&c.body,c.damage,&w.config)})
}
