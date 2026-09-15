use super::Accounts;
use crate::{chemical_operators::CompiledOperators, config::Config, organism::Cell};

#[derive(Default)]
pub struct ReactionWork {
    requests: Vec<(usize, usize, f64)>,
}
impl ReactionWork {
    pub fn react(
        &mut self,
        cell: &mut Cell,
        ops: &CompiledOperators,
        c: &Config,
        dt: f64,
        books: &mut Accounts,
    ) -> f64 {
        self.requests.clear();
        let mut demand = [0.; 256];
        let volume = cell.volume(c).max(f64::MIN_POSITIVE);
        for (slot, channels) in ops.enzymes.iter().enumerate() {
            let occupancy: f64 = ops.engagement[slot]
                .iter()
                .map(|a| a.value * cell.inventory[a.species])
                .sum::<f64>()
                / volume;
            let capacity = dt * cell.body[11 + slot] * (1. - cell.damage) / (1. + occupancy);
            for (index, e) in channels.iter().enumerate() {
                let q = capacity * e.binding * e.attenuation * cell.inventory[e.substrate] / volume;
                demand[e.substrate] += q;
                self.requests.push((slot, index, q));
            }
        }
        let mut work = 0.;
        for (slot, index, q) in &mut self.requests {
            let e = &ops.enzymes[*slot][*index];
            *q *=
                (cell.inventory[e.substrate] / demand[e.substrate].max(f64::MIN_POSITIVE)).min(1.);
            work += *q * (-e.work).max(0.);
        }
        let funded = if work > 0. {
            (cell.energy / work).min(1.)
        } else {
            1.
        };
        let mut delta = [0.; 256];
        let mut energy = 0.;
        let mut total = 0.;
        for &(slot, index, requested) in &self.requests {
            let e = &ops.enzymes[slot][index];
            let q = requested * if e.work < 0. { funded } else { 1. };
            delta[e.substrate] -= q;
            for p in &e.products {
                delta[p.species] += q * p.weight;
            }
            energy += q * e.work;
            books.heat += q * e.heat;
            total += q;
        }
        cell.inventory.apply(&delta);
        cell.energy += energy;
        let overflow = (cell.energy - cell.energy_capacity(c)).max(0.);
        cell.energy -= overflow;
        books.heat += overflow;
        total
    }
}

pub fn receptors(cell: &Cell, ops: &CompiledOperators, local: &[f64; 256]) -> [f64; 4] {
    std::array::from_fn(|slot| {
        let occupancy: f64 = ops.receptors[slot]
            .iter()
            .map(|a| a.value * local[a.species])
            .sum();
        cell.body[3 + slot] * (1. - cell.damage) * occupancy / (1. + occupancy)
    })
}
