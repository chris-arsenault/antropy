//! Frozen-mixture conversion and proportional construction with explicit work accounts.
use crate::{chemistry::Chemistry, config::Config, genetics::Compiled, organism::Cell};
#[path = "reaction_execution.rs"]
mod execution;
pub use execution::Executor;

#[derive(Clone, Debug, Default)]
pub struct Work {
    enzymes: Option<
        [std::sync::Arc<crate::chemical_operators::EnzymeOperator>; crate::organism::MAX_ENZYMES],
    >,
    routes: Vec<(u8, u16, f64)>,
}
impl Work {
    pub(crate) fn accepted_routes(
        &self,
    ) -> impl Iterator<
        Item = (
            &std::sync::Arc<crate::chemical_operators::EnzymeOperator>,
            u16,
            f64,
        ),
    > + '_ {
        self.routes.iter().map(|&(slot, row, amount)| {
            (&self.enzymes.as_ref().unwrap()[slot as usize], row, amount)
        })
    }
    pub fn reactions(&self) -> impl Iterator<Item = (usize, usize, f64)> + '_ {
        self.routes.iter().flat_map(|&(slot, row, amount)| {
            let edge = self.enzymes.as_ref().unwrap()[slot as usize]
                .conversions
                .get(row as usize);
            edge.products.iter().filter_map(move |product| {
                (product.species != edge.substrate).then_some((
                    edge.substrate,
                    product.species,
                    amount * product.weight,
                ))
            })
        })
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
    let mut executor = Executor::default();
    executor.react(cell, c, chemistry, dt, record, signal);
    executor.into_work()
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
    let free = cell.inventory.projection(chemistry).interaction;
    let bound = cell.bound_material.projection(chemistry).interaction;
    let denominator =
        c.receptor_k * cell.volume(c) + cell.material() + cell.bound_material.material();
    std::array::from_fn(|k| (free[k] + bound[k]) / denominator.max(1e-30))
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
