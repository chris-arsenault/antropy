//! Direct composition of recognition, shared donor allocation and physical commitment.
use crate::{
    accounting::Ledger,
    chemistry::Chemistry,
    config::Config,
    contact_exchange::{clear, species},
    field::Field,
    organism::Cell,
};
use rayon::prelude::*;
#[path = "transport_compose.rs"]
mod compose;
#[path = "transport_membership.rs"]
mod membership;
#[path = "transport_projection.rs"]
mod projection;

#[derive(Clone, Debug, Default)]
pub struct Exchange {
    demand: Vec<f64>,
    changes: Vec<f64>,
    nodes: Vec<(usize, u64)>,
    slots: crate::spatial_slots::Slots,
    masks: Vec<u64>,
    imports: Vec<[f64; 256]>,
    exports: Vec<[f64; 256]>,
    contact_support: Vec<Vec<(usize, f64)>>,
    delivery: Vec<Vec<(usize, f64)>>,
    delivery_links: Vec<Vec<(usize, usize)>>,
    previous_sites: Vec<crate::footprint::Row>,
    contact: crate::contact_exchange::Allocation,
    preparations: u64,
    pub profile: bool,
    pub preparation_ms: f64,
}

/// Only funded inward machinery can consume an external chemical projection.
fn import_support(cell: &Cell, c: &Config) -> u64 {
    if (cell.energy == 0. && c.transport_energy > 0.)
        || cell.damage == 1.
        || c.transporter_turnover == 0.
        || cell.material() >= cell.capacity(c)
    {
        return 0;
    }
    let mut mask = 0;
    for (slot, recognition) in cell
        .operators
        .as_ref()
        .unwrap()
        .transporters
        .iter()
        .enumerate()
    {
        if cell.body[7 + slot] == 0. || cell.action.transport[slot] <= 0.5 {
            continue;
        }
        for a in recognition.iter() {
            mask |= 1 << (a.species / 4);
        }
    }
    mask
}

impl Exchange {
    pub fn counts(&self) -> serde_json::Value {
        serde_json::json!({"owners":self.imports.len(),"preparations":self.preparations,
            "execution":"directComposition","fieldDonors":self.nodes.len(),
            "scratchBytes":8*(self.demand.capacity()+self.changes.capacity())
                +2048*(self.imports.capacity()+self.exports.capacity())})
    }
    pub fn advance(
        &mut self,
        cells: &mut [Cell],
        c: &Config,
        field: &mut Field,
        chemistry: &Chemistry,
        sites: &[crate::footprint::Row],
        accounting: (&mut Ledger, Option<&mut crate::phenotype::Observer>),
    ) {
        self.advance_cached(
            cells,
            c,
            field,
            chemistry,
            sites,
            (
                &mut crate::movement::geometry::Cache::default(),
                accounting.0,
                accounting.1,
            ),
        );
    }
    pub fn advance_cached(
        &mut self,
        cells: &mut [Cell],
        c: &Config,
        field: &mut Field,
        chemistry: &Chemistry,
        sites: &[crate::footprint::Row],
        stage: (
            &mut crate::movement::geometry::Cache,
            &mut Ledger,
            Option<&mut crate::phenotype::Observer>,
        ),
    ) {
        stage.0.prepare_local(cells, c);
        self.advance_prepared(cells, c, field, chemistry, sites, stage);
    }
    /// Geometry is frozen by the shared step. Requests read actual current material.
    pub fn advance_prepared(
        &mut self,
        cells: &mut [Cell],
        c: &Config,
        field: &mut Field,
        chemistry: &Chemistry,
        sites: &[crate::footprint::Row],
        stage: (
            &mut crate::movement::geometry::Cache,
            &mut Ledger,
            Option<&mut crate::phenotype::Observer>,
        ),
    ) {
        if c.dt == 0. {
            return;
        }
        let (cache, ledger, observer) = stage;
        let started = if self.profile {
            crate::abi::clock()
        } else {
            0.
        };
        let graph = cache.graph_prepared(cells, c);
        graph.prepare_exchange(cells, c, chemistry);
        self.prepare_requests(cells, c, field, sites, graph);
        self.preparation_ms = if self.profile {
            crate::abi::clock() - started
        } else {
            0.
        };
        let solve = |(slot, (demand, changes)): (usize, (&mut [f64], &mut [f64]))| {
            let (node, mask) = self.nodes[slot];
            crate::exchange_vector::donors(
                demand,
                changes,
                &field.amounts()[node * 256..(node + 1) * 256],
                mask,
            );
        };
        let cost = crate::parallel::cost::EXCHANGE_NODE;
        if let Some(grain) = crate::parallel::grain(self.nodes.len(), cost) {
            self.demand
                .par_chunks_mut(256)
                .zip(self.changes.par_chunks_mut(256))
                .enumerate()
                .with_min_len(grain)
                .for_each(solve);
        } else {
            self.demand
                .chunks_mut(256)
                .zip(self.changes.chunks_mut(256))
                .enumerate()
                .for_each(solve);
        }
        self.commit(cells, c, sites, observer);
        let loss = field.apply_rows(&mut self.changes, &self.nodes, chemistry);
        ledger.numerical_material += loss[0];
        ledger.numerical_energy += loss[1];
    }
    fn commit(
        &mut self,
        cells: &mut [Cell],
        c: &Config,
        sites: &[crate::footprint::Row],
        observer: Option<&mut crate::phenotype::Observer>,
    ) {
        let demand = &self.demand;
        let slots = &self.slots;
        let masks = &self.masks;
        let cost = crate::parallel::cost::CELL_READ;
        crate::parallel::for_each(&mut self.imports, cost, |i, imports| {
            *imports = crate::exchange_vector::gather(demand, &sites[i], slots, imports, masks[i]);
        });
        crate::parallel::for_each(cells, cost, |i, cell| {
            let accepted = &self.imports[i];
            let mut incoming = 0.;
            let mut outgoing = 0.;
            for s in species(self.masks[i] | self.contact.mask(i)) {
                let contact = self.contact.received.get(i).map_or(0., |row| row[s]);
                let lost = self.contact.withdrawn.get(i).map_or(0., |row| row[s]);
                let q = accepted[s] + contact;
                let export = self.exports[i][s];
                if q == 0. && export == 0. && lost == 0. {
                    continue;
                }
                cell.inventory
                    .set(s, (cell.inventory.value(s) - export - lost).max(0.) + q);
                cell.chemical_flows.imported.add(s, q);
                cell.chemical_flows.exported.add(s, export + lost);
                cell.flows.contact_imported += contact;
                cell.flows.contact_lost += lost;
                incoming += q;
                outgoing += export;
            }
            cell.flows.imported += incoming;
            cell.flows.exported += outgoing;
            cell.flows.transport += cell.pay((incoming + outgoing) * c.transport_energy);
        });
        if let Some(o) = observer {
            for (i, cell) in cells.iter().enumerate() {
                for s in species(self.masks[i] | self.contact.mask(i)) {
                    let incoming =
                        self.imports[i][s] + self.contact.received.get(i).map_or(0., |row| row[s]);
                    let outgoing =
                        self.exports[i][s] + self.contact.withdrawn.get(i).map_or(0., |row| row[s]);
                    o.transfer(cell.id, s, incoming, outgoing);
                }
            }
        }
    }
}

#[cfg(test)]
#[path = "transport_flux_tests.rs"]
mod flux_tests;
#[cfg(test)]
#[path = "transport_notification_tests.rs"]
mod notification_tests;
#[cfg(test)]
#[path = "transport_execution_tests.rs"]
mod tests;
