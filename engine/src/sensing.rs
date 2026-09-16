//! Local embodied recognition. No property, coordinate, route or lineage input reaches the RNN.
use crate::{
    chemistry::Chemistry, config::Config, field::Field, genetics::Compiled, organism::Cell,
};
fn readings(cell: &Cell, c: &Config, field: &Field) -> [[f64; 3]; 4] {
    let row = crate::footprint::sites(cell, c, field);
    let radius = cell.radius(c);
    let forward = [radius * cell.heading.cos(), radius * cell.heading.sin()];
    let left = [-forward[1], forward[0]];
    let perimeter = [forward, left, forward.map(|x| -x), left.map(|x| -x)]
        .map(|p| field.stencil(cell.x + p[0], cell.y + p[1]));
    // Compose the five observation rows first, then evaluate each geographic chemical row once.
    let mut nodes: Vec<(usize, [f64; 5])> = Vec::with_capacity(16);
    for (k, sites) in std::iter::once(row.as_slice())
        .chain(perimeter.iter().map(|r| r.as_slice()))
        .enumerate()
    {
        for &(node, w) in sites {
            if let Some(n) = nodes.iter_mut().find(|n| n.0 == node) {
                n.1[k] += w;
            } else {
                let mut weights = [0.; 5];
                weights[k] = w;
                nodes.push((node, weights));
            }
        }
    }
    std::array::from_fn(|slot| {
        let mut readings = [0.; 5];
        let kernel = &cell.operators.as_ref().unwrap().receptors[slot];
        for &(node, weights) in &nodes {
            let local = kernel
                .iter()
                .map(|a| a.value * field.amounts[node * 256 + a.species] as f64)
                .sum::<f64>()
                / field.spacing.powi(2);
            for k in 0..5 {
                readings[k] += weights[k] * local;
            }
        }
        let gain = cell.body[3 + slot]
            / (cell.body[3 + slot] + c.receptor_ratio * cell.body[0]).max(1e-30);
        let r = readings.map(|v| gain * v / (c.receptor_k + v));
        [r[0], r[1] - r[3], r[2] - r[4]]
    })
}

pub fn initialize(cell: &mut Cell, g: &Compiled, c: &Config, field: &Field) {
    let values = readings(cell, c, field);
    cell.receptors = values.map(|r| r[0]);
    observe(cell, g, g, c, field);
}
pub fn observe(cell: &mut Cell, g: &Compiled, _installed: &Compiled, c: &Config, field: &Field) {
    let values = readings(cell, c, field);
    for (i, r) in values.iter().enumerate() {
        cell.inputs[4 * i] = r[0] as f32;
        cell.inputs[4 * i + 1] = (r[0] - cell.receptors[i]) as f32;
        cell.inputs[4 * i + 2] = r[1] as f32;
        cell.inputs[4 * i + 3] = r[2] as f32;
    }
    let stock = |q: f64, reference: f64| (q / (q + reference).max(1e-30)) as f32;
    for i in 0..12 {
        cell.inputs[16 + i] = stock(cell.body[3 + i], g.body[3 + i]);
    }
    cell.inputs[28] = (cell.energy / cell.energy_capacity(c).max(1e-30)).clamp(0., 1.) as f32;
    cell.inputs[29] = ((cell.body[0] / g.body[0] - 1.).clamp(0., 1.)) as f32;
    for i in 0..4 {
        cell.inputs[30 + i] = cell.contacts[i] as f32;
    }
    cell.inputs[34] = cell.brain.task as f32 / 255.;
    cell.inputs[35] = stock(cell.body[1], g.body[1]);
    cell.inputs[36] = stock(cell.body[2], g.body[2]);
    cell.inputs[37] = (cell.material() / cell.capacity(c).max(1e-30)).clamp(0., 1.) as f32;
    cell.inputs[38] = cell.damage as f32;
}
pub fn adapt(cell: &mut Cell, c: &Config, dt: f64) {
    let alpha = 1. - (-dt / c.receptor_tau).exp();
    for i in 0..4 {
        cell.receptors[i] += alpha * (cell.inputs[i * 4] as f64 - cell.receptors[i]);
    }
}
pub fn stress_load(
    cell: &Cell,
    _g: &Compiled,
    c: &Config,
    field: &Field,
    chemistry: &Chemistry,
) -> f64 {
    let row = crate::footprint::sites(cell, c, field);
    let mut load = field.scalar(&field.stress, &row);
    let membrane = &cell.operators.as_ref().unwrap().membrane;
    for a in membrane.iter() {
        load -= (1. - c.susceptibility_floor)
            * a.value
            * chemistry.properties[a.species].stress
            * field.sample(a.species, &row);
    }
    let mut internal = cell
        .inventory
        .iter()
        .zip(&chemistry.properties)
        .map(|(q, p)| q * p.stress)
        .sum::<f64>();
    for a in membrane.iter() {
        internal -= (1. - c.susceptibility_floor)
            * a.value
            * chemistry.properties[a.species].stress
            * cell.inventory[a.species];
    }
    (load + c.internal_exposure * internal / cell.volume(c).max(1e-30)).max(0.)
}
