use crate::{
    chemistry::Chemistry, config::Config, controller, field::Field, genetics::Compiled,
    organism::Cell,
};

fn chemical_readings(cell: &Cell, g: &Compiled, c: &Config, field: &Field) -> [[f64; 4]; 4] {
    let radius = cell.radius(c);
    let mut sites = [field.stencil(cell.x, cell.y); 5];
    for (i, angle) in [
        0.,
        std::f64::consts::PI,
        -std::f64::consts::FRAC_PI_2,
        std::f64::consts::FRAC_PI_2,
    ]
    .iter()
    .enumerate()
    {
        let heading = cell.heading + angle;
        sites[i + 1] = field.stencil(
            cell.x + radius * heading.cos(),
            cell.y + radius * heading.sin(),
        );
    }
    // Receptor projection and bilinear interpolation commute. Most body samples share nodes.
    let mut nodes = [usize::MAX; 20];
    let mut count = 0;
    let mut indices = [[0; 4]; 5];
    for i in 0..5 {
        for j in 0..4 {
            let node = sites[i][j].0;
            let index = nodes[..count]
                .iter()
                .position(|n| *n == node)
                .unwrap_or_else(|| {
                    nodes[count] = node;
                    count += 1;
                    count - 1
                });
            indices[i][j] = index;
        }
    }
    std::array::from_fn(|slot| {
        let stock = cell.body[3 + slot];
        let gain = stock / (stock + c.birth_mass * c.receptor_ratio).max(1e-30);
        let mut projected = [0.; 20];
        let area = field.spacing * field.spacing;
        for n in 0..count {
            for a in &g.receptors[slot] {
                projected[n] += a.value * field.amounts[nodes[n] * 256 + a.species] as f64 / area;
            }
        }
        let mut values = [0.; 5];
        for i in 0..5 {
            for j in 0..4 {
                values[i] += sites[i][j].1 * projected[indices[i][j]];
            }
        }
        for v in &mut values {
            *v *= gain;
        }
        let [center, front, rear, left, right] = values;
        let tonic = center / (center + c.receptor_k);
        [
            tonic,
            tonic - cell.receptors[slot],
            (front - rear) / (front + rear + 2. * c.receptor_k),
            (left - right) / (left + right + 2. * c.receptor_k),
        ]
    })
}
pub fn initialize(cell: &mut Cell, g: &Compiled, c: &Config, field: &Field) {
    cell.receptors = chemical_readings(cell, g, c, field).map(|v| v[0]);
}
pub fn observe(cell: &mut Cell, g: &Compiled, installed: &Compiled, c: &Config, field: &Field) {
    let readings = chemical_readings(cell, installed, c, field);
    for (slot, values) in readings.iter().enumerate() {
        for (i, value) in values.iter().enumerate() {
            cell.inputs[slot * 4 + i] = *value as f32;
        }
        cell.receptors[slot] += (-(-c.dt / c.receptor_tau).exp_m1()) * values[1];
    }
    for i in 0..12 {
        cell.inputs[16 + i] =
            (cell.body[3 + i] / (cell.body[3 + i] + g.body[3 + i]).max(1e-30)) as f32;
    }
    cell.inputs[28] = (cell.energy / cell.energy_capacity(c).max(1e-30)).min(1.) as f32;
    cell.inputs[29] = (cell.body[0] / g.body[0] - 1.).clamp(0., 1.) as f32;
    for i in 0..4 {
        cell.inputs[30 + i] = cell.contacts[i] as f32;
    }
    cell.inputs[34] = cell.brain.task as f32 / 255.;
    cell.inputs[35] =
        (cell.body[1] / (cell.body[1] + c.birth_mass * c.motor_ratio).max(1e-30)) as f32;
    cell.inputs[36] =
        (cell.body[2] / (cell.body[2] + c.birth_mass * c.storage_ratio).max(1e-30)) as f32;
    cell.inputs[37] = (cell.material() / cell.capacity(c).max(1e-30)).min(1.) as f32;
    cell.inputs[38] = cell.damage as f32;
}
pub fn infer(
    cell: &mut Cell,
    g: &Compiled,
    installed: &Compiled,
    c: &Config,
    field: &Field,
) -> bool {
    observe(cell, g, installed, c, field);
    let previous = cell.brain.task;
    let strength = g.chromosome.behavior.plasticity[0].abs() as f64;
    let cost = c.plasticity_cost * strength * c.dt;
    let learn = c.learning == "plastic" && strength > 0. && cell.energy >= cell.basal(c) + cost;
    if learn {
        cell.flows.learning += cell.pay(cost);
    }
    cell.action = controller::act(
        &g.chromosome.behavior,
        &cell.inputs,
        &mut cell.brain,
        c,
        learn,
    );
    previous != cell.brain.task
}
pub fn stress_load(
    cell: &Cell,
    g: &Compiled,
    c: &Config,
    field: &Field,
    chemistry: &Chemistry,
) -> f64 {
    let sites = field.stencil(cell.x, cell.y);
    let volume = cell.volume(c).max(1e-12);
    let mut load = field.scalar(&field.stress, &sites)
        + c.internal_exposure / volume
            * cell
                .inventory
                .iter()
                .zip(&chemistry.properties)
                .map(|(q, p)| q * p.stress)
                .sum::<f64>();
    for a in &g.membrane {
        load -= (1. - c.susceptibility_floor)
            * a.value
            * chemistry.properties[a.species].stress
            * (field.sample(a.species, &sites)
                + c.internal_exposure * cell.inventory[a.species] / volume);
    }
    load.max(0.)
}
pub fn injure(cell: &mut Cell, g: &Compiled, c: &Config, field: &Field, chemistry: &Chemistry) {
    let load = stress_load(cell, g, c, field, chemistry);
    let injury = (1. - cell.damage).min(c.damage_rate * load / (load + c.stress_k) * c.dt);
    cell.damage += injury;
    cell.flows.exposure = load * c.dt;
    cell.flows.damage += injury;
}
