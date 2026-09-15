//! Finite membrane exchange as W*C, W^T*K and one conservative node commitment.
use super::{Accounts, WORK_PRICE, bodies::Cloud, local_matrix::LocalMatrix};
use crate::{
    chemical_operators::CompiledOperators, chemistry::Chemistry, config::Config, field::Field,
    organism::Cell,
};
#[derive(Default)]
pub struct Exchange {
    pub local: Vec<[f64; 256]>,
    imports: Vec<[f64; 256]>,
    exports: Vec<[f64; 256]>,
    accepted: Vec<[f64; 256]>,
    geometry: LocalMatrix,
}
impl Exchange {
    pub fn advance(
        &mut self,
        cells: &mut [Cell],
        ops: &[CompiledOperators],
        clouds: &[Cloud],
        field: &mut Field,
        context: (&Chemistry, &Config),
        books: &mut Accounts,
    ) -> f64 {
        let (chemistry, c) = context;
        for values in [
            &mut self.local,
            &mut self.imports,
            &mut self.exports,
            &mut self.accepted,
        ] {
            values.resize(cells.len(), [0.; 256]);
            values.fill([0.; 256]);
        }
        self.geometry.rebuild(clouds, field.nx * field.ny);
        let area = field.spacing.powi(2);
        // Sample each geographic mixture into all incident cells before any owner changes.
        for &node in &self.geometry.nodes {
            let row = std::array::from_fn(|s| field.amounts[node * 256 + s] as f64 / area);
            self.geometry.gather(node, &row, &mut self.local);
        }
        for (i, cell) in cells.iter().enumerate() {
            self.plan(i, cell, &ops[i], c);
        }
        for &node in &self.geometry.nodes {
            let mut demand = [0.; 256];
            let mut exports = [0.; 256];
            self.geometry.transpose(node, &self.imports, &mut demand);
            self.geometry.transpose(node, &self.exports, &mut exports);
            let mut available = [0.; 256];
            let mut delta = [0.; 256];
            for s in 0..256 {
                let amount = field.amounts[node * 256 + s] as f64;
                let fraction = demand[s] / area;
                available[s] = amount / (area * fraction.max(1.));
                delta[s] = exports[s] - amount * fraction.min(1.);
            }
            // Imports sample the frozen donor; same-stage exports never replenish availability.
            self.geometry.gather(node, &available, &mut self.accepted);
            let b = field.apply_row(node, &delta, chemistry);
            books.material_error += b.roundoff_matter;
            books.energy_error += b.roundoff_energy;
        }
        let mut total = 0.;
        for (i, cell) in cells.iter_mut().enumerate() {
            let mut moved = 0.;
            for s in 0..256 {
                let imported = self.imports[i][s] * self.accepted[i][s];
                let exported = self.exports[i][s];
                cell.inventory
                    .set(s, cell.inventory[s] + imported - exported);
                moved += imported + exported;
            }
            books.heat += cell.pay(moved * WORK_PRICE);
            total += moved;
        }
        total
    }
    fn plan(&mut self, i: usize, cell: &Cell, ops: &CompiledOperators, c: &Config) {
        let mut request = [0.; 256];
        let volume = cell.volume(c).max(f64::MIN_POSITIVE);
        let local = &self.local[i];
        for slot in 0..4 {
            // Existing action carriers are in [0,1]; midpoint holds, endpoints export/import.
            let effort = 2. * cell.action.transport[slot] - 1.;
            let occupancy = ops.transporters[slot]
                .iter()
                .map(|a| a.value * (local[a.species] + cell.inventory[a.species] / volume))
                .sum::<f64>();
            let capacity =
                c.dt * cell.body[7 + slot] * (1. - cell.damage) * effort.abs() / (1. + occupancy);
            for a in &ops.transporters[slot] {
                request[a.species] += if effort >= 0. {
                    capacity * a.value * local[a.species]
                } else {
                    -capacity * a.value * cell.inventory[a.species] / volume
                };
            }
        }
        let imports = request.iter().filter(|q| **q > 0.).sum::<f64>();
        let storage =
            ((cell.capacity(c) - cell.material()).max(0.) / imports.max(f64::MIN_POSITIVE)).min(1.);
        for (s, q) in request.iter_mut().enumerate() {
            *q = if *q >= 0. {
                *q * storage
            } else {
                q.max(-cell.inventory[s])
            };
        }
        let price = request.iter().map(|q| q.abs() * WORK_PRICE).sum::<f64>();
        let funded = if price > 0. {
            (cell.energy / price).min(1.)
        } else {
            1.
        };
        for (s, q) in request.iter().enumerate() {
            let q = q * funded;
            self.imports[i][s] = if q > 0. { q / local[s] } else { 0. };
            self.exports[i][s] = (-q).max(0.);
        }
    }

    pub fn owned_bytes(&self) -> usize {
        (self.local.capacity()
            + self.imports.capacity()
            + self.exports.capacity()
            + self.accepted.capacity())
            * 256
            * 8
            + self.geometry.owned_bytes()
            + size_of::<Self>()
    }
}
