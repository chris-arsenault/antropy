//! Local embodied recognition. No property, coordinate, route or lineage input reaches the RNN.
use crate::{
    chemistry::Chemistry,
    config::Config,
    controller::LIGHT_INPUT,
    field::Field,
    genetics::Compiled,
    organism::{Cell, PHOTO_STOCK},
};
fn sample_rows(cell: &Cell, c: &Config, field: &Field) -> Vec<(usize, [f64; 5])> {
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
    nodes
}

fn response(readings: [f64; 5], stock: f64, core: f64, reference: f64, c: &Config) -> [f64; 3] {
    let gain = stock / (stock + c.receptor_ratio * core).max(1e-30);
    let r = readings.map(|v| gain * v / (reference + v));
    [r[0], r[1] - r[3], r[2] - r[4]]
}

fn readings(cell: &Cell, c: &Config, field: &Field) -> [[f64; 3]; 5] {
    let nodes = sample_rows(cell, c, field);
    std::array::from_fn(|slot| {
        let stock = if slot == 4 { PHOTO_STOCK } else { 3 + slot };
        if cell.body[stock] == 0. {
            return [0.; 3];
        }
        let mut readings = [0.; 5];
        for &(node, weights) in &nodes {
            let local = if slot == 4 {
                let light = field.illumination.node(node);
                (light[0] + light[1]) * 0.5
            } else {
                cell.operators.as_ref().unwrap().receptors[slot]
                    .iter()
                    .map(|a| a.value * field.amounts[node * 256 + a.species] as f64)
                    .sum::<f64>()
                    / field.spacing.powi(2)
            };
            for k in 0..5 {
                readings[k] += weights[k] * local;
            }
        }
        response(
            readings,
            cell.body[stock],
            cell.body[0],
            if slot == 4 { 1. } else { c.receptor_k },
            c,
        )
    })
}

pub fn initialize(cell: &mut Cell, g: &Compiled, c: &Config, field: &Field) {
    let values = readings(cell, c, field);
    cell.receptors = std::array::from_fn(|i| values[i][0]);
    cell.photoreceptor = values[4][0];
    observe(cell, g, g, c, field);
}
pub fn observe(cell: &mut Cell, g: &Compiled, _installed: &Compiled, c: &Config, field: &Field) {
    let values = readings(cell, c, field);
    for (i, r) in values.iter().enumerate() {
        let (input, baseline) = if i == 4 {
            (LIGHT_INPUT, cell.photoreceptor)
        } else {
            (4 * i, cell.receptors[i])
        };
        cell.inputs[input] = r[0] as f32;
        cell.inputs[input + 1] = (r[0] - baseline) as f32;
        cell.inputs[input + 2] = r[1] as f32;
        cell.inputs[input + 3] = r[2] as f32;
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
    cell.inputs[LIGHT_INPUT + 4] = stock(cell.body[PHOTO_STOCK], g.body[PHOTO_STOCK]);
}
pub fn adapt(cell: &mut Cell, c: &Config, dt: f64) {
    let alpha = 1. - (-dt / c.receptor_tau).exp();
    for i in 0..4 {
        cell.receptors[i] += alpha * (cell.inputs[i * 4] as f64 - cell.receptors[i]);
    }
    cell.photoreceptor += alpha * (cell.inputs[LIGHT_INPUT] as f64 - cell.photoreceptor);
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
