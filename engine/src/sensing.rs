//! Local embodied recognition. No property, coordinate, route or lineage input reaches the RNN.
use crate::{
    chemistry::Chemistry,
    config::Config,
    controller::LIGHT_INPUT,
    field::Field,
    genetics::Compiled,
    organism::{Cell, PHOTO_STOCK},
};
struct Samples {
    nodes: [(usize, [f64; 5]); 32],
    length: usize,
}
fn sample_rows(cell: &Cell, c: &Config, field: &Field) -> Samples {
    let row = crate::footprint::sites(cell, c, field);
    let radius = cell.radius(c);
    let forward = [radius * cell.heading.cos(), radius * cell.heading.sin()];
    let left = [-forward[1], forward[0]];
    let perimeter = [forward, left, forward.map(|x| -x), left.map(|x| -x)]
        .map(|p| field.stencil(cell.x + p[0], cell.y + p[1]));
    // Compose the five observation rows first, then evaluate each geographic chemical row once.
    // Four body quadrature points plus four perimeter points, four nodes each.
    let mut samples = Samples {
        nodes: [(0, [0.; 5]); 32],
        length: 0,
    };
    for (k, sites) in std::iter::once(row.as_slice())
        .chain(perimeter.iter().map(|r| r.as_slice()))
        .enumerate()
    {
        for &(node, w) in sites {
            if let Some(n) = samples.nodes[..samples.length]
                .iter_mut()
                .find(|n| n.0 == node)
            {
                n.1[k] += w;
            } else {
                let mut weights = [0.; 5];
                weights[k] = w;
                samples.nodes[samples.length] = (node, weights);
                samples.length += 1;
            }
        }
    }
    samples
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
        if cell.body[stock] == 0. || (slot < 4 && cell.chemistry().inward[slot] == 1.) {
            return [0.; 3];
        }
        let mut readings = [0.; 5];
        for &(node, weights) in &nodes.nodes[..nodes.length] {
            let local = if slot == 4 {
                field.illumination.node(node)
            } else if field.active_groups(node) == 0 {
                0.
            } else {
                let row = field.amounts().row(node);
                cell.operators.as_ref().unwrap().receptors[slot]
                    .iter()
                    .map(|a| a.value * row[a.species] as f64)
                    .sum::<f64>()
                    / field.spacing.powi(2)
            };
            for k in 0..5 {
                readings[k] += weights[k] * local;
            }
        }
        if slot < 4 {
            for (k, value) in readings.iter_mut().enumerate() {
                *value = *value * cell.interface.field + cell.interface.recognition[slot][k];
            }
        }
        response(
            readings,
            cell.body[stock]
                * if slot == 4 {
                    1.
                } else {
                    1. - cell.chemistry().inward[slot]
                },
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
    cell.inward_receptors = inward(cell, c);
    observe(cell, g, c, field);
}
pub fn observe(cell: &mut Cell, g: &Compiled, c: &Config, field: &Field) {
    observe_environment(cell, c, field);
    observe_body(cell, g, c);
}

/// Environmental refresh is independent of the base-step body/private-byte sample.
pub fn observe_environment(cell: &mut Cell, c: &Config, field: &Field) {
    observe_external(cell, c, field);
    observe_inward(cell, c);
}

/// The geographic owner publishes only cues sampled from the external medium.
pub fn observe_external(cell: &mut Cell, c: &Config, field: &Field) {
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
    crate::controller::publish_inputs(
        &mut cell.brain,
        &cell.inputs,
        crate::controller::ENVIRONMENT_INPUTS,
    );
}

fn observe_inward(cell: &mut Cell, c: &Config) {
    for (i, value) in inward(cell, c).iter().enumerate() {
        cell.inputs[crate::controller::INWARD_INPUT + 2 * i] = *value as f32;
        cell.inputs[crate::controller::INWARD_INPUT + 2 * i + 1] =
            (*value - cell.inward_receptors[i]) as f32;
    }
}

/// Body and private-byte cues share the base clock; geographic recognition owns its refresh.
pub fn observe_body(cell: &mut Cell, g: &Compiled, c: &Config) {
    observe_stocks(cell, g, c);
    observe_base(cell, c);
    crate::controller::publish_inputs(&mut cell.brain, &cell.inputs, u64::MAX);
}

/// Publish after transport, reactions and funded body changes have completed.
pub fn observe_physiology(cell: &mut Cell, g: &Compiled, c: &Config) {
    observe_stocks(cell, g, c);
    observe_inward(cell, c);
    crate::controller::publish_inputs(
        &mut cell.brain,
        &cell.inputs,
        crate::controller::PHYSIOLOGY_INPUTS,
    );
}

fn observe_stocks(cell: &mut Cell, g: &Compiled, c: &Config) {
    let stock = |q: f64, reference: f64| (q / (q + reference).max(1e-30)) as f32;
    for i in 0..12 {
        cell.inputs[16 + i] = stock(cell.body[3 + i], g.body[3 + i]);
    }
    for slot in 0..crate::organism::MAX_ENZYMES {
        let i = crate::organism::enzyme_stock(slot);
        cell.inputs[crate::controller::programs::stock_input(slot)] =
            if cell.chemistry().programs[slot] {
                stock(cell.body[i], g.body[i])
            } else {
                0.
            };
    }
    cell.inputs[29] = ((cell.body[0] / g.body[0] - 1.).clamp(0., 1.)) as f32;
    cell.inputs[35] = stock(cell.body[1], g.body[1]);
    cell.inputs[36] = stock(cell.body[2], g.body[2]);
    cell.inputs[37] = (cell.material() / cell.capacity(c).max(1e-30)).clamp(0., 1.) as f32;
    cell.inputs[38] = cell.damage as f32;
    cell.inputs[LIGHT_INPUT + 4] = stock(cell.body[PHOTO_STOCK], g.body[PHOTO_STOCK]);
    cell.inputs[crate::controller::BUILDER_INPUT] = stock(
        cell.body[crate::organism::BUILDER_STOCK],
        g.body[crate::organism::BUILDER_STOCK],
    );
    cell.inputs[crate::controller::EMITTER_INPUT] = stock(
        cell.body[crate::organism::EMITTER_STOCK],
        g.body[crate::organism::EMITTER_STOCK],
    );
}

/// Energy, scalar crowding shares and the private byte advance on the base clock.
pub fn observe_base(cell: &mut Cell, c: &Config) {
    cell.inputs[28] = (cell.energy / cell.energy_capacity(c).max(1e-30)).clamp(0., 1.) as f32;
    for i in 0..4 {
        cell.inputs[30 + i] = cell.contacts[i] as f32;
    }
    cell.inputs[34] = cell.brain.task as f32 / 255.;
}
pub fn adapt(cell: &mut Cell, c: &Config, dt: f64) {
    let alpha = 1. - (-dt / c.receptor_tau).exp();
    for i in 0..4 {
        cell.receptors[i] += alpha * (cell.inputs[i * 4] as f64 - cell.receptors[i]);
        cell.inward_receptors[i] += alpha
            * (cell.inputs[crate::controller::INWARD_INPUT + 2 * i] as f64
                - cell.inward_receptors[i]);
    }
    cell.photoreceptor += alpha * (cell.inputs[LIGHT_INPUT] as f64 - cell.photoreceptor);
}
fn inward(cell: &Cell, c: &Config) -> [f64; 4] {
    let volume = cell.volume(c).max(1e-30);
    std::array::from_fn(|slot| {
        let stock = cell.body[3 + slot] * cell.chemistry().inward[slot];
        if stock == 0. {
            return 0.;
        }
        let local = cell.operators.as_ref().unwrap().receptors[slot]
            .iter()
            .map(|a| a.value * cell.inventory.value(a.species))
            .sum::<f64>()
            / volume;
        response([local; 5], stock, cell.body[0], c.receptor_k, c)[0]
    })
}
pub fn stress_load(
    cell: &Cell,
    _g: &Compiled,
    c: &Config,
    field: &Field,
    chemistry: &Chemistry,
) -> f64 {
    stress_boundary(cell, c, field, chemistry, &cell.interface)
}
pub fn stress_boundary(
    cell: &Cell,
    c: &Config,
    field: &Field,
    chemistry: &Chemistry,
    interface: &crate::interfaces::Reading,
) -> f64 {
    let row = crate::footprint::sites(cell, c, field);
    let mut load = field.stress_sample(&row);
    let membrane = &cell.operators.as_ref().unwrap().membrane;
    let attenuation = row
        .iter()
        .map(|&(node, weight)| {
            if field.active_groups(node) == 0 {
                return 0.;
            }
            let values = field.amounts().row(node);
            weight
                * membrane
                    .iter()
                    .map(|a| {
                        a.value * chemistry.properties[a.species].stress * values[a.species] as f64
                    })
                    .sum::<f64>()
        })
        .sum::<f64>()
        / field.spacing.powi(2);
    load -= (1. - c.susceptibility_floor) * attenuation;
    load = load * interface.field + interface.stress;
    let mut internal = cell.inventory.projection(chemistry).stress;
    for a in membrane.iter() {
        internal -= (1. - c.susceptibility_floor)
            * a.value
            * chemistry.properties[a.species].stress
            * cell.inventory.value(a.species);
    }
    (load + c.internal_exposure * internal / cell.volume(c).max(1e-30)).max(0.)
}

#[cfg(test)]
#[path = "sensing_publication_tests.rs"]
mod publication_tests;
