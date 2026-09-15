use crate::{
    accounting::Ledger,
    chemistry::{Chemistry, SPECIES},
    config::Config,
    field::Field,
    genetics::Genotype,
    organism::Cell,
};
use std::collections::BTreeMap;

#[derive(Clone, Debug)]
struct Request {
    cell: usize,
    species: usize,
    export: bool,
    quantity: f64,
}
#[derive(Clone, Debug, Default)]
pub struct Work {
    requests: Vec<Request>,
    demand: Vec<f64>,
    change: Vec<f64>,
    marked: Vec<bool>,
    changed: Vec<usize>,
    touched: Vec<usize>,
    sites: Vec<[(usize, f64); 4]>,
}

impl Work {
    fn prepare(&mut self, n: usize) {
        self.requests.clear();
        self.sites.clear();
        if self.demand.len() != n {
            self.demand = vec![0.; n];
            self.change = vec![0.; n];
            self.marked = vec![false; n];
        }
        for i in self.touched.drain(..) {
            self.demand[i] = 0.;
        }
        for i in self.changed.drain(..) {
            self.change[i] = 0.;
            self.marked[i] = false;
        }
    }
    fn cell_requests(
        &mut self,
        index: usize,
        cell: &Cell,
        g: &Genotype,
        c: &Config,
        field: &Field,
        chemistry: &Chemistry,
    ) {
        let compiled = g.compiled.as_ref().unwrap();
        let sites = field.stencil(cell.x, cell.y);
        self.sites.push(sites);
        let start = self.requests.len();
        let mut demand = [[0.; SPECIES]; 2];
        let mut concentrations = [0.; SPECIES];
        for slot in 0..4 {
            let export = compiled.chromosome.chemistry.transporters[slot].export;
            let capacity = cell.body[7 + slot]
                * c.transporter_turnover
                * cell.action.transport[slot]
                * (1. - cell.damage)
                * c.dt;
            if capacity <= 0. {
                continue;
            }
            let first = self.requests.len();
            let mut total = 0.;
            for a in &compiled.transporters[slot] {
                let available = if export {
                    cell.inventory[a.species]
                } else {
                    let v = field.sample(a.species, &sites);
                    concentrations[a.species] = v;
                    v
                };
                let quantity = capacity * a.value * available;
                if quantity > 0. {
                    total += quantity;
                    self.requests.push(Request {
                        cell: index,
                        species: a.species,
                        export,
                        quantity,
                    });
                }
            }
            let scale = (capacity / total.max(1e-300)).min(1.);
            for r in &mut self.requests[first..] {
                r.quantity *= scale;
                demand[usize::from(r.export)][r.species] += r.quantity;
            }
        }
        let radius = cell.radius(c);
        let impedance = field.scalar(&field.impedance, &sites);
        let mut imported = 0.;
        for r in &mut self.requests[start..] {
            let supply = if r.export {
                cell.inventory[r.species]
            } else {
                diffusive_supply(
                    radius,
                    chemistry.properties[r.species].diffusion,
                    concentrations[r.species],
                    impedance,
                    c,
                ) * c.dt
            };
            r.quantity *= (supply / demand[usize::from(r.export)][r.species].max(1e-300)).min(1.);
            if !r.export {
                imported += r.quantity;
            }
        }
        let headroom =
            ((cell.capacity(c) - cell.material()).max(0.) / imported.max(1e-300)).min(1.);
        let mut total = 0.;
        for r in &mut self.requests[start..] {
            if !r.export {
                r.quantity *= headroom;
            }
            total += r.quantity;
        }
        let funded = ((cell.energy - cell.basal(c)).max(0.)
            / (total * c.transport_energy).max(1e-300))
        .min(1.);
        for r in &mut self.requests[start..] {
            r.quantity *= funded;
        }
    }
}
/// Material per model second; energy, headroom and shared-field allocation follow separately.
pub fn diffusive_supply(
    radius: f64,
    diffusion: f64,
    concentration: f64,
    impedance: f64,
    c: &Config,
) -> f64 {
    4. * std::f64::consts::PI
        * radius
        * diffusion
        * crate::field::mobility(impedance, c.diffusion_impedance)
        * concentration
}
pub fn exchange(
    cells: &mut [Cell],
    genomes: &BTreeMap<u64, Genotype>,
    c: &Config,
    field: &mut Field,
    chemistry: &Chemistry,
    ledger: &mut Ledger,
    work: &mut Work,
) {
    work.prepare(field.amounts.len());
    for (i, cell) in cells.iter().enumerate() {
        work.cell_requests(
            i,
            cell,
            &genomes[&cell.machinery_genome],
            c,
            field,
            chemistry,
        );
    }
    work.requests.retain(|r| r.quantity > 0.);
    for r in &work.requests {
        if !r.export {
            for &(node, w) in &work.sites[r.cell] {
                if w <= 0. {
                    continue;
                }
                let i = node * SPECIES + r.species;
                if work.demand[i] == 0. {
                    work.touched.push(i);
                }
                work.demand[i] += r.quantity * w;
            }
        }
    }
    for &i in &work.touched {
        work.demand[i] = (field.amounts[i] as f64 / work.demand[i]).min(1.);
    }
    // Frozen supply fractions make uptake independent of traversal order. Exports cannot relay.
    for exporting in [false, true] {
        for r in &work.requests {
            if r.export != exporting {
                continue;
            }
            let mut quantity = 0.;
            for &(node, w) in &work.sites[r.cell] {
                let q = r.quantity
                    * w
                    * if exporting {
                        1.
                    } else {
                        work.demand[node * SPECIES + r.species]
                    };
                if q == 0. {
                    continue;
                }
                let index = node * SPECIES + r.species;
                // Imports precede exports. Marking separately from the accumulated amount avoids
                // inserting a node twice when simultaneous inward and outward flux cancel.
                if !work.marked[index] {
                    work.changed.push(index);
                    work.marked[index] = true;
                }
                work.change[index] += if exporting { q } else { -q };
                quantity += q;
            }
            let cell = &mut cells[r.cell];
            cell.inventory.set(
                r.species,
                (cell.inventory[r.species] + if exporting { -quantity } else { quantity }).max(0.),
            );
            let paid = cell.pay(quantity * c.transport_energy);
            cell.flows.transport += paid;
            if exporting {
                cell.flows.exported += quantity;
                cell.chemical_flows.exported[r.species] += quantity;
            } else {
                cell.flows.imported += quantity;
                cell.chemical_flows.imported[r.species] += quantity;
            }
        }
    }
    for &i in &work.changed {
        let rounding = field.add(i / SPECIES, i % SPECIES, work.change[i], chemistry);
        ledger.rounding(rounding, i % SPECIES, chemistry);
    }
}
