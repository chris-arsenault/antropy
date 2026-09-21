//! Frozen-mixture conversion and proportional construction with explicit work accounts.
use crate::{chemistry::Chemistry, config::Config, genetics::Compiled, organism::Cell};
#[derive(Default)]
pub struct Work {
    edges: Vec<(usize, usize, f64)>,
}
impl Work {
    pub fn reactions(&self) -> impl Iterator<Item = (usize, usize, f64)> + '_ {
        self.edges.iter().copied()
    }
}
pub fn react(cell: &mut Cell, c: &Config, chemistry: &Chemistry, dt: f64) -> Work {
    react_observed(cell, c, chemistry, dt, true, [0.; 2])
}
pub fn react_observed(
    cell: &mut Cell,
    c: &Config,
    chemistry: &Chemistry,
    dt: f64,
    record: bool,
    signal: [f64; 2],
) -> Work {
    let operators = cell.operators.as_ref().unwrap();
    let mixture = retained_response(cell, c, chemistry);
    let volume = cell.volume(c);
    // Retain unresolved material in its owner. Uptake can accumulate it until this
    // concentration is meaningful; no reaction work or waste is booked below it.
    let resolved = crate::field_activity::CONCENTRATION_FLOOR as f64 * volume;
    let factors: [f64; crate::organism::MAX_ENZYMES] = std::array::from_fn(|slot| {
        let stock = cell.body[crate::organism::enzyme_stock(slot)];
        if stock == 0. || !cell.installed.programs[slot] || cell.action.activity[slot] == 0. {
            return 0.;
        }
        let enzyme = &operators.enzymes[slot];
        let occupancy = enzyme
            .engagement
            .iter()
            .map(|a| a.value * cell.inventory[a.species])
            .sum::<f64>();
        dt * c.enzyme_turnover * stock * cell.action.activity[slot] * (1. - cell.damage)
            / (c.receptor_k * volume + occupancy).max(1e-30)
    });
    // Only occupied installed rows need a local yield. Reuse it for reservation and commit.
    let mut requests = Vec::new();
    let mut cost = 0.;
    for (factor, enzyme) in factors.iter().zip(&operators.enzymes) {
        if *factor == 0. {
            continue;
        }
        for edge in &enzyme.conversions {
            if cell.inventory[edge.substrate] <= resolved {
                continue;
            }
            let requested = factor
                * edge.catalytic
                * cell.inventory[edge.substrate]
                * response(edge.work_coefficient, mixture);
            if requested == 0. {
                continue;
            }
            let energy = edge.energy(c, signal);
            cost += requested * (-energy[0]).max(0.);
            requests.push((edge, requested, energy));
        }
    }
    let funding = if cost > 0. {
        (cell.energy / cost).min(1.)
    } else {
        1.
    };
    let funded = |work: f64| if work < 0. { funding } else { 1. };
    let mut demand = [0.; 256];
    for &(edge, requested, energy) in &requests {
        demand[edge.substrate] += requested * funded(energy[0]);
    }
    for (s, value) in demand.iter_mut().enumerate() {
        if *value > 0. {
            *value = (cell.inventory[s] / *value).min(1.);
        }
    }
    let mut delta = [0.; 256];
    let mut work = Work::default();
    let mut balance = 0.;
    for (edge, requested, energy) in requests {
        let q = requested * demand[edge.substrate] * funded(energy[0]);
        if q == 0. {
            continue;
        }
        delta[edge.substrate] -= q * edge.changed;
        cell.chemical_flows.consumed[edge.substrate] += q * edge.changed;
        for p in &edge.products {
            if p.species == edge.substrate {
                continue;
            }
            let amount = q * p.weight;
            delta[p.species] += amount;
            cell.chemical_flows.produced[p.species] += amount;
            if record {
                work.edges.push((edge.substrate, p.species, amount));
            }
        }
        balance += q * energy[0];
        cell.flows.reacted += q * edge.changed;
        cell.flows.captured += q * energy[0].max(0.);
        cell.flows.reaction_heat += q * energy[1];
        cell.flows.external_work += q * energy[2];
    }
    cell.inventory.apply(&delta);
    cell.energy = (cell.energy + balance).max(0.);
    work
}
/// Consume a proportional mixture; returns constructed material and dissipated value.
pub fn assemble(
    cell: &mut Cell,
    _chemistry: &Chemistry,
    c: &Config,
    requested: f64,
    reserve: f64,
    work_reserve: f64,
) -> (f64, f64) {
    let total = cell.material();
    if total <= 0. {
        return (0., 0.);
    }
    let cost = c.construction_energy;
    let built = requested
        .max(0.)
        .min((total - reserve).max(0.))
        .min((cell.energy - work_reserve).max(0.) / cost);
    cell.inventory.transfer_to(&mut cell.bound_material, built);
    cell.pay(built * cost);
    (built, built * cost)
}
pub fn grow(cell: &mut Cell, g: &Compiled, c: &Config, chemistry: &Chemistry, dt: f64) {
    let _ = chemistry;
    crate::organization::remodel(cell, g, c, dt);
}

pub fn retained_response(cell: &Cell, c: &Config, chemistry: &Chemistry) -> [f64; 2] {
    let mut sum = [0.; 2];
    for (s, p) in chemistry.properties.iter().enumerate() {
        let q = cell.inventory[s] + cell.bound_material[s];
        sum[0] += q * p.interaction[0];
        sum[1] += q * p.interaction[1];
    }
    let denominator =
        c.receptor_k * cell.volume(c) + cell.material() + cell.bound_material.material();
    sum.map(|v| v / denominator.max(1e-30))
}
pub fn response(coefficient: [f64; 2], mixture: [f64; 2]) -> f64 {
    let z = 4. * (coefficient[0] * mixture[0] + coefficient[1] * mixture[1]);
    1. + z / (1. + z.abs())
}
pub fn repair(cell: &mut Cell, c: &Config, _chemistry: &Chemistry, dt: f64) {
    let mass = cell.mass();
    let material_per_fraction = mass * c.repair_material;
    let work_per_fraction = mass * c.repair_energy;
    let repair = (dt * c.repair_rate * cell.action.repair).min(cell.damage);
    let total = cell.material();
    let actual = repair
        .min(total / material_per_fraction.max(1e-30))
        .min(mass / material_per_fraction.max(1e-30))
        .min(cell.energy / work_per_fraction.max(1e-30));
    if actual <= 0. {
        return;
    }
    let used = actual * material_per_fraction;
    cell.inventory.exchange_with(&mut cell.bound_material, used);
    let paid = cell.pay(actual * work_per_fraction);
    cell.damage = (cell.damage - actual).max(0.);
    cell.flows.repaired += actual;
    cell.flows.repair += paid;
}

#[cfg(test)]
mod resolution_tests {
    use super::*;

    #[test]
    fn unresolved_substrate_is_retained_and_accumulation_reenables_paid_conversion() {
        for scale in [0.01, 1., 100.] {
            let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
            let c = &mut w.cells[0];
            c.body.iter_mut().for_each(|q| *q *= scale);
            c.bound_material.scale(scale);
            c.inventory.fill(0.);
            c.energy = scale;
            c.action.activity.fill(1.);
            let substrate = c.operators.as_ref().unwrap().enzymes[0]
                .conversions
                .iter()
                .max_by(|a, b| a.binding.total_cmp(&b.binding))
                .unwrap()
                .substrate;
            let quantum = crate::field_activity::CONCENTRATION_FLOOR as f64 * c.volume(&w.config);
            c.inventory.set(substrate, quantum * 0.5);
            let before = (c.material(), c.energy);
            react_observed(c, &w.config, &w.chemistry, 0.8, true, [1.; 2]);
            assert_eq!((c.material(), c.energy), before);
            assert_eq!(c.flows.reacted, 0.);
            c.inventory.set(substrate, quantum * 4.);
            let potential = |cell: &Cell| {
                cell.energy
                    + cell
                        .inventory
                        .iter()
                        .zip(&w.chemistry.properties)
                        .map(|(q, p)| q * p.potential)
                        .sum::<f64>()
            };
            let before = (c.material(), potential(c));
            react_observed(c, &w.config, &w.chemistry, 0.8, true, [1.; 2]);
            assert!(c.flows.reacted > 0.);
            assert!((c.material() - before.0).abs() < 1e-12 * scale);
            assert!(
                (potential(c) + c.flows.reaction_heat - c.flows.external_work - before.1).abs()
                    < 1e-12 * scale
            );
            c.inventory.validate().unwrap();
        }
    }
}
