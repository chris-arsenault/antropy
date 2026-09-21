//! Accepted products reduce into shared scratch; commit each gross and net component once.
use super::*;

fn accumulate(sum: &mut f64, error: &mut f64, value: f64) {
    let next = *sum + value;
    *error += if sum.abs() >= value.abs() {
        (*sum - next) + value
    } else {
        (value - next) + *sum
    };
    *sum = next;
}

impl Executor {
    fn accept(
        &mut self,
        cell: &Cell,
        funding: f64,
        record: bool,
        mut observer: Option<(&mut crate::phenotype_activity::Interval, u8)>,
    ) -> [f64; 4] {
        let enzymes = &cell.operators.as_ref().unwrap().enzymes;
        let mut energy = [0.; 4];
        for i in 0..self.requests.len() {
            let r = &self.requests[i];
            let amount =
                r.rate * self.scales[r.substrate] * if r.energy[0] < 0. { funding } else { 1. };
            if amount == 0. {
                continue;
            }
            let slot = r.slot as usize;
            let row = r.row as usize;
            let edge = enzymes[slot].conversions.get(row);
            for (sum, value) in energy[..3].iter_mut().zip(r.energy) {
                *sum += amount * value;
            }
            energy[3] += amount * r.energy[0].max(0.);
            if record {
                self.work.routes.push((r.slot, r.row, amount));
            }
            self.accepted += 1;
            accumulate(
                &mut self.consumed[r.substrate],
                &mut self.consumed_error[r.substrate],
                amount * edge.changed,
            );
            for p in edge.products.iter().filter(|p| p.species != edge.substrate) {
                let produced = amount * p.weight;
                self.touch(p.species);
                accumulate(
                    &mut self.produced[p.species],
                    &mut self.produced_error[p.species],
                    produced,
                );
                if let Some((interval, mask)) = observer.as_mut() {
                    interval.each(*mask, |g| g.reaction(edge.substrate, p.species, produced));
                }
            }
        }
        energy
    }
    pub(super) fn apply(
        &mut self,
        cell: &mut Cell,
        funding: f64,
        record: bool,
        observer: Option<(&mut crate::phenotype_activity::Interval, u8)>,
    ) {
        let energy = self.accept(cell, funding, record, observer);
        for &s in &self.touched {
            let consumed = self.consumed[s] + self.consumed_error[s];
            let produced = self.produced[s] + self.produced_error[s];
            cell.chemical_flows.consumed.add(s, consumed);
            cell.chemical_flows.produced.add(s, produced);
            cell.flows.reacted += consumed;
        }
        cell.inventory.apply_sparse(self.touched.iter().map(|&s| {
            (
                s,
                (self.produced[s] - self.consumed[s])
                    + (self.produced_error[s] - self.consumed_error[s]),
            )
        }));
        cell.energy = (cell.energy + energy[0]).max(0.);
        cell.flows.captured += energy[3];
        cell.flows.reaction_heat += energy[1];
        cell.flows.external_work += energy[2];
        if record {
            self.work.enzymes = Some(cell.operators.as_ref().unwrap().enzymes.clone());
        }
    }
}
