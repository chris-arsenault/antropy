//! Frozen-mixture conversion and proportional construction with explicit work accounts.
use crate::{
    chemistry::{self, Chemistry},
    config::Config,
    genetics::Compiled,
    organism::Cell,
};
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
    react_observed(cell, c, chemistry, dt, true)
}
pub fn react_observed(
    cell: &mut Cell,
    c: &Config,
    _chemistry: &Chemistry,
    dt: f64,
    record: bool,
) -> Work {
    let operators = cell.operators.as_ref().unwrap();
    let factors: [f64; 4] = std::array::from_fn(|slot| {
        let enzyme = &operators.enzymes[slot];
        let occupancy = enzyme
            .engagement
            .iter()
            .map(|a| a.value * cell.inventory[a.species])
            .sum::<f64>();
        enzyme.attenuation * dt * c.enzyme_turnover * cell.body[11 + slot] * (1. - cell.damage)
            / (c.receptor_k * cell.volume(c) + occupancy).max(1e-30)
    });
    let mut demand = [0.; 256];
    for (factor, enzyme) in factors.iter().zip(&operators.enzymes) {
        for edge in &enzyme.conversions {
            demand[edge.substrate] += factor * edge.binding * cell.inventory[edge.substrate];
        }
    }
    for (s, value) in demand.iter_mut().enumerate() {
        if *value > 0. {
            *value = (cell.inventory[s] / *value).min(1.);
        }
    }
    let cost = factors
        .iter()
        .zip(&operators.enzymes)
        .map(|(factor, enzyme)| {
            enzyme
                .conversions
                .iter()
                .map(|e| {
                    factor
                        * e.binding
                        * cell.inventory[e.substrate]
                        * demand[e.substrate]
                        * (-e.work).max(0.)
                })
                .sum::<f64>()
        })
        .sum::<f64>();
    let funding = if cost > 0. {
        (cell.energy / cost).min(1.)
    } else {
        1.
    };
    let mut delta = [0.; 256];
    let mut work = Work::default();
    let mut balance = 0.;
    for (factor, enzyme) in factors.iter().zip(&operators.enzymes) {
        for edge in &enzyme.conversions {
            let q = factor
                * edge.binding
                * cell.inventory[edge.substrate]
                * demand[edge.substrate]
                * funding;
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
            balance += q * edge.work;
            cell.flows.reacted += q * edge.changed;
            cell.flows.captured += q * edge.work.max(0.);
            cell.flows.reaction_heat += q * edge.heat;
        }
    }
    cell.inventory.apply(&delta);
    cell.energy = (cell.energy + balance).max(0.);
    work
}
/// Consume a proportional mixture; returns constructed material and dissipated value.
pub fn assemble(
    cell: &mut Cell,
    chemistry: &Chemistry,
    c: &Config,
    requested: f64,
    reserve: f64,
    work_reserve: f64,
) -> (f64, f64) {
    let total = cell.material();
    if total <= 0. {
        return (0., 0.);
    }
    let potential = cell
        .inventory
        .iter()
        .zip(&chemistry.properties)
        .map(|(q, p)| q * p.potential)
        .sum::<f64>()
        / total;
    let body = chemistry.properties[chemistry.decomposition].potential;
    let (cost, heat) = chemistry::assembly_cost(
        potential,
        body,
        c.construction_energy,
        c.conversion_efficiency,
    );
    let built = requested
        .max(0.)
        .min((total - reserve).max(0.))
        .min((cell.energy - work_reserve).max(0.) / cost);
    cell.inventory.scale((1. - built / total).max(0.));
    cell.pay(built * cost);
    (built, built * heat)
}
pub fn grow(cell: &mut Cell, g: &Compiled, c: &Config, chemistry: &Chemistry, dt: f64) {
    let need: [f64; 15] = std::array::from_fn(|i| (2. * g.body[i] - cell.body[i]).max(0.));
    let total = need.iter().sum::<f64>();
    if total == 0. {
        return;
    }
    let request = total.min(dt * c.growth_rate * cell.body[0] * (1. - cell.damage));
    // Construction must leave work for the entire interval without another metabolic update.
    // Price the largest proposed body, so growth itself cannot invalidate that reserve.
    let proposed = std::array::from_fn(|i| cell.body[i] + request * need[i] / total);
    let reserve = crate::accounting::interval_reserve(cell, &proposed, c);
    let material_reserve = cell.capacity(c) * c.protected_inventory_fraction;
    let (built, heat) = assemble(cell, chemistry, c, request, material_reserve, reserve);
    for (stock, n) in cell.body.iter_mut().zip(need) {
        *stock += built * n / total;
    }
    cell.flows.constructed += built;
    cell.flows.construction += heat;
}
pub fn repair(cell: &mut Cell, c: &Config, chemistry: &Chemistry, dt: f64) {
    let mass = cell.mass();
    let material_per_fraction = mass * c.repair_material;
    let work_per_fraction = mass * c.repair_energy;
    let repair = (dt * c.repair_rate * cell.action.repair).min(cell.damage);
    let total = cell.material();
    let actual = repair
        .min(total / material_per_fraction.max(1e-30))
        .min(cell.energy / work_per_fraction.max(1e-30));
    if actual <= 0. {
        return;
    }
    // Repair material is converted to the decomposition chemical and remains material.
    let value = cell
        .inventory
        .iter()
        .zip(&chemistry.properties)
        .map(|(q, p)| q * p.potential)
        .sum::<f64>()
        / total;
    let product = chemistry.properties[chemistry.decomposition].potential;
    let conversion = (product - value).max(0.) / c.conversion_efficiency;
    let actual = actual
        .min(cell.energy / (work_per_fraction + material_per_fraction * conversion).max(1e-30));
    let used = actual * material_per_fraction;
    cell.inventory.scale((1. - used / total).max(0.));
    let s = chemistry.decomposition;
    cell.inventory.set(s, cell.inventory[s] + used);
    let paid = cell.pay(actual * work_per_fraction + used * conversion);
    cell.damage = (cell.damage - actual).max(0.);
    cell.flows.repaired += actual;
    cell.flows.repair += paid + used * (value - product);
}
