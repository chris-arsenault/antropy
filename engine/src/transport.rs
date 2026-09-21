//! Sparse requested support composes W C recognition, W^T demand and W donor allocation.
use crate::{
    accounting::Ledger, chemistry::Chemistry, config::Config, field::Field, organism::Cell,
};

#[derive(Clone, Debug, Default)]
pub struct Exchange {
    demand: Vec<f64>,
    changes: Vec<f64>,
    nodes: Vec<(usize, u64)>,
    slots: Vec<usize>,
    masks: Vec<u64>,
    imports: Vec<[f64; 256]>,
    exports: Vec<[f64; 256]>,
    contact: crate::contact_exchange::Allocation,
    pub profile: bool,
    pub preparation_ms: f64,
}

fn requests(cell: &Cell, c: &Config, local: &[f64; 256]) -> ([f64; 256], [f64; 256]) {
    let mut imports = [0.; 256];
    let mut exports = [0.; 256];
    let volume = cell.volume(c).max(1e-30);
    for slot in 0..4 {
        let effort = 2. * cell.action.transport[slot] - 1.;
        let capacity = c.dt
            * c.transporter_turnover
            * cell.body[7 + slot]
            * (1. - cell.damage)
            * effort.abs()
            * if effort < 0. {
                cell.interface.field
            } else {
                1.
            };
        if capacity == 0. {
            continue;
        }
        let recognition = &cell.operators.as_ref().unwrap().transporters[slot];
        let available = |s| {
            if effort >= 0. {
                local[s]
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
    fn prepare_nodes(&mut self, count: usize, sites: &[Vec<(usize, f64)>]) {
        self.slots.resize(count, usize::MAX);
        for &(node, _) in &self.nodes {
            self.slots[node] = usize::MAX;
        }
        self.nodes.clear();
        for &(node, weight) in sites.iter().flatten() {
            if weight > 0. && self.slots[node] == usize::MAX {
                self.slots[node] = self.nodes.len();
                self.nodes.push((node, 0));
            }
        }
        let needed = self.nodes.len() * 256;
        for values in [&mut self.demand, &mut self.changes] {
            if needed > values.capacity() {
                let capacity = needed.next_power_of_two().min(count * 256);
                values.reserve_exact(capacity - values.len());
            }
            values.resize(needed, 0.);
        }
        self.demand.fill(0.);
        self.changes.fill(0.);
    }

    fn prepare_requests(
        &mut self,
        cells: &[Cell],
        c: &Config,
        field: &Field,
        sites: &[Vec<(usize, f64)>],
        graph: &crate::interfaces::Graph,
    ) {
        self.prepare_nodes(field.nx * field.ny, sites);
        self.imports.resize(cells.len(), [0.; 256]);
        self.exports.resize(cells.len(), [0.; 256]);
        self.masks.resize(cells.len(), 0);
        let exposed = graph
            .neighbors
            .iter()
            .flatten()
            .any(|n| cells[n.donor].damage > 0.);
        self.contact.begin(if exposed { cells.len() } else { 0 });
        for (i, cell) in cells.iter().enumerate() {
            let field_local = crate::numeric::mixture(field, &sites[i]);
            let local = graph.local(i, cells, c, &field_local);
            (self.imports[i], self.exports[i]) = requests(cell, c, &local);
            if !graph.neighbors[i]
                .iter()
                .any(|n| cells[n.donor].damage > 0.)
            {
                continue;
            }
            let intensity = std::array::from_fn(|s| {
                if local[s] > 0. {
                    self.imports[i][s] / local[s]
                } else {
                    0.
                }
            });
            self.contact.request(i, cells, c, graph, &intensity);
            for s in 0..256 {
                self.imports[i][s] = intensity[s] * graph.field[i] * field_local[s] as f64;
            }
        }
        self.contact.allocate(cells, &mut self.exports);
        for (i, site) in sites.iter().enumerate() {
            let mask = self.imports[i]
                .iter()
                .zip(&self.exports[i])
                .enumerate()
                .fold(0, |m, (s, (&a, &b))| {
                    m | if a > 0. || b > 0. { 1 << (s / 4) } else { 0 }
                });
            self.masks[i] = mask;
            for &(node, weight) in site {
                if weight == 0. || mask == 0 {
                    continue;
                }
                let slot = self.slots[node];
                self.nodes[slot].1 |= mask;
                let range = slot * 256..(slot + 1) * 256;
                crate::exchange_vector::deposit(
                    &mut self.demand[range.clone()],
                    &mut self.changes[range],
                    &self.imports[i],
                    &self.exports[i],
                    weight,
                    mask,
                );
            }
        }
    }

    pub fn advance(
        &mut self,
        cells: &mut [Cell],
        c: &Config,
        field: &mut Field,
        chemistry: &Chemistry,
        sites: &[Vec<(usize, f64)>],
        accounting: (&mut Ledger, Option<&mut crate::phenotype::Observer>),
    ) {
        let (ledger, mut observer) = accounting;
        let started = if self.profile {
            crate::abi::clock()
        } else {
            0.
        };
        let graph = crate::interfaces::Graph::new(cells, c);
        graph.prepare(cells, c, chemistry);
        self.prepare_requests(cells, c, field, sites, &graph);
        self.preparation_ms = if self.profile {
            crate::abi::clock() - started
        } else {
            0.
        };
        for (slot, &(node, mask)) in self.nodes.iter().enumerate() {
            let range = slot * 256..(slot + 1) * 256;
            crate::exchange_vector::donors(
                &mut self.demand[range.clone()],
                &mut self.changes[range.clone()],
                &field.amounts[node * 256..(node + 1) * 256],
                mask,
            );
        }
        for (i, cell) in cells.iter_mut().enumerate() {
            let accepted = crate::exchange_vector::gather(
                &self.demand,
                &sites[i],
                &self.slots,
                &self.imports[i],
                self.masks[i],
            );
            let mut incoming = 0.;
            let mut outgoing = 0.;
            for (s, &q) in accepted.iter().enumerate() {
                let contact = self.contact.received.get(i).map_or(0., |row| row[s]);
                let lost = self.contact.withdrawn.get(i).map_or(0., |row| row[s]);
                let q = q + contact;
                let export = self.exports[i][s];
                if q == 0. && export == 0. && lost == 0. {
                    continue;
                }
                cell.inventory
                    .set(s, (cell.inventory[s] - export - lost).max(0.) + q);
                cell.chemical_flows.imported[s] += q;
                cell.chemical_flows.exported[s] += export + lost;
                cell.flows.contact_imported += contact;
                cell.flows.contact_lost += lost;
                if let Some(o) = observer.as_deref_mut() {
                    o.transfer(cell.id, s, q, export + lost);
                }
                incoming += q;
                outgoing += export;
            }
            cell.flows.imported += incoming;
            cell.flows.exported += outgoing;
            cell.flows.transport += cell.pay((incoming + outgoing) * c.transport_energy);
        }
        let loss = field.apply_rows(&mut self.changes, &self.nodes, chemistry);
        ledger.numerical_material += loss[0];
        ledger.numerical_energy += loss[1];
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scratch_follows_touched_nodes_and_reuses_slots_without_stale_demands() {
        let mut exchange = Exchange::default();
        exchange.prepare_nodes(19200, &[vec![(17, 0.5), (19000, 0.5), (4, 0.)]]);
        assert_eq!(exchange.nodes, [(17, 0), (19000, 0)]);
        assert_eq!(exchange.demand.len(), 512);
        exchange.demand.fill(0.75);
        exchange.changes.fill(-0.01);
        exchange.prepare_nodes(19200, &[vec![(3, 1.)]]);
        assert_eq!(exchange.nodes, [(3, 0)]);
        assert_eq!(exchange.slots[17], usize::MAX);
        assert_eq!(exchange.slots[19000], usize::MAX);
        assert_eq!(exchange.slots[3], 0);
        assert_eq!(exchange.demand.len(), 256);
        assert!(
            exchange
                .demand
                .iter()
                .chain(&exchange.changes)
                .all(|q| *q == 0.)
        );
        exchange.prepare_nodes(19200, &[]);
        assert!(exchange.nodes.is_empty() && exchange.demand.is_empty());
        assert_eq!(exchange.slots[3], usize::MAX);
    }
}
