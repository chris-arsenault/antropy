//! Complete chemical rows compose W C recognition, W^T demand and W donor allocation.
use crate::{
    accounting::Ledger, chemistry::Chemistry, config::Config, field::Field, organism::Cell,
};

#[derive(Clone, Debug, Default)]
pub struct Exchange {
    demand: Vec<f64>,
    changes: Vec<f64>,
    active_nodes: Vec<bool>,
    imports: Vec<[f64; 256]>,
    exports: Vec<[f64; 256]>,
    pub profile: bool,
    pub preparation_ms: f64,
}

fn requests(cell: &Cell, c: &Config, local: &[f32; 256]) -> ([f64; 256], [f64; 256]) {
    let mut imports = [0.; 256];
    let mut exports = [0.; 256];
    let volume = cell.volume(c).max(1e-30);
    for slot in 0..4 {
        let effort = 2. * cell.action.transport[slot] - 1.;
        let capacity =
            c.dt * c.transporter_turnover * cell.body[7 + slot] * (1. - cell.damage) * effort.abs();
        let recognition = &cell.operators.as_ref().unwrap().transporters[slot];
        let available = |s| {
            if effort >= 0. {
                local[s] as f64
            } else {
                cell.inventory[s] / volume
            }
        };
        let occupied = recognition
            .iter()
            .map(|a| a.value * available(a.species))
            .sum::<f64>();
        let gain = capacity / (c.receptor_k + occupied);
        let destination = if effort >= 0. {
            &mut imports
        } else {
            &mut exports
        };
        for a in recognition.iter() {
            destination[a.species] += gain * a.value * available(a.species);
        }
    }
    let incoming = imports.iter().sum::<f64>();
    let headroom = (cell.capacity(c) - cell.material()).max(0.);
    let room = if incoming > 0. {
        (headroom / incoming).min(1.)
    } else {
        1.
    };
    let mut requested = 0.;
    for s in 0..256 {
        imports[s] *= room;
        exports[s] = exports[s].min(cell.inventory[s]);
        requested += imports[s] + exports[s];
    }
    let paid = if c.transport_energy * requested > 0. {
        (cell.energy / (c.transport_energy * requested)).min(1.)
    } else {
        1.
    };
    for s in 0..256 {
        imports[s] *= paid;
        exports[s] *= paid;
    }
    (imports, exports)
}

impl Exchange {
    pub fn advance(
        &mut self,
        cells: &mut [Cell],
        c: &Config,
        field: &mut Field,
        chemistry: &Chemistry,
        sites: &[Vec<(usize, f64)>],
        ledger: &mut Ledger,
    ) {
        let started = if self.profile {
            crate::abi::clock()
        } else {
            0.
        };
        self.demand.resize(field.amounts.len(), 0.);
        self.changes.resize(field.amounts.len(), 0.);
        self.active_nodes.resize(field.nx * field.ny, false);
        self.imports.resize(cells.len(), [0.; 256]);
        self.exports.resize(cells.len(), [0.; 256]);
        for (i, cell) in cells.iter().enumerate() {
            let local = crate::numeric::mixture(field, &sites[i]);
            (self.imports[i], self.exports[i]) = requests(cell, c, &local);
            for &(node, weight) in &sites[i] {
                if weight == 0. {
                    continue;
                }
                self.active_nodes[node] = true;
                let range = node * 256..(node + 1) * 256;
                crate::exchange_vector::deposit(
                    &mut self.demand[range.clone()],
                    &mut self.changes[range],
                    &self.imports[i],
                    &self.exports[i],
                    weight,
                );
            }
        }
        self.preparation_ms = if self.profile {
            crate::abi::clock() - started
        } else {
            0.
        };
        for (node, used) in self.active_nodes.iter().enumerate() {
            if !used {
                continue;
            }
            let range = node * 256..(node + 1) * 256;
            crate::exchange_vector::donors(
                &mut self.demand[range.clone()],
                &mut self.changes[range.clone()],
                &field.amounts[range],
            );
        }
        for (i, cell) in cells.iter_mut().enumerate() {
            let accepted =
                crate::exchange_vector::gather(&self.demand, &sites[i], &self.imports[i]);
            let mut incoming = 0.;
            let mut outgoing = 0.;
            for (s, &q) in accepted.iter().enumerate() {
                let export = self.exports[i][s];
                cell.inventory
                    .set(s, (cell.inventory[s] + q - export).max(0.));
                cell.chemical_flows.imported[s] += q;
                cell.chemical_flows.exported[s] += export;
                incoming += q;
                outgoing += export;
            }
            cell.flows.imported += incoming;
            cell.flows.exported += outgoing;
            cell.flows.transport += cell.pay((incoming + outgoing) * c.transport_energy);
        }
        for (node, used) in self.active_nodes.iter().enumerate() {
            if *used {
                self.demand[node * 256..(node + 1) * 256].fill(0.);
            }
        }
        let loss = field.apply_rows(&mut self.changes, &mut self.active_nodes, chemistry);
        ledger.numerical_material += loss[0];
        ledger.numerical_energy += loss[1];
    }
}
