//! Cell donors reserve own export and foreign uptake against the same frozen inventory.
use crate::{config::Config, interfaces::Graph, organism::Cell};

#[derive(Clone, Debug, Default)]
pub struct Allocation {
    requests: Vec<(usize, usize, usize, f64)>,
    demand: Vec<[f64; 256]>,
    pub received: Vec<[f64; 256]>,
    pub withdrawn: Vec<[f64; 256]>,
}
impl Allocation {
    pub fn begin(&mut self, count: usize) {
        self.requests.clear();
        for values in [&mut self.demand, &mut self.received, &mut self.withdrawn] {
            values.resize(count, [0.; 256]);
            values.fill([0.; 256]);
        }
    }
    pub fn request(
        &mut self,
        i: usize,
        cells: &[Cell],
        c: &Config,
        graph: &Graph,
        intensity: &[f64; 256],
    ) {
        if self.demand.is_empty() {
            return;
        }
        let support: Vec<_> = intensity
            .iter()
            .copied()
            .enumerate()
            .filter(|(_, value)| *value > 0.)
            .collect();
        for n in &graph.neighbors[i] {
            let donor = &cells[n.donor];
            let gain = n.weight * donor.damage / donor.volume(c).max(1e-30);
            if gain == 0. {
                continue;
            }
            for &(s, value) in &support {
                let q = value * gain * donor.inventory[s];
                if q == 0. {
                    continue;
                }
                self.requests.push((i, n.donor, s, q));
                self.demand[n.donor][s] += q;
            }
        }
    }
    pub fn allocate(&mut self, cells: &[Cell], exports: &mut [[f64; 256]]) {
        if self.demand.is_empty() {
            return;
        }
        for (i, cell) in cells.iter().enumerate() {
            for (s, export) in exports[i].iter_mut().enumerate() {
                let demand = self.demand[i][s] + *export;
                let fraction = if demand > 0. {
                    (cell.inventory[s] / demand).min(1.)
                } else {
                    0.
                };
                self.demand[i][s] = fraction;
                *export *= fraction;
            }
        }
        for &(receiver, donor, species, request) in &self.requests {
            let actual = request * self.demand[donor][species];
            self.received[receiver][species] += actual;
            self.withdrawn[donor][species] += actual;
        }
    }
}
