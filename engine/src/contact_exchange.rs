//! Cell donors reserve own export and foreign uptake against the same frozen inventory.
use crate::{interfaces::Graph, organism::Cell};

#[derive(Clone, Debug, Default)]
pub struct Allocation {
    intensity: Vec<(usize, f64)>,
    rows: Vec<std::ops::Range<usize>>,
    demand: Vec<[f64; 256]>,
    donor_masks: Vec<u64>,
    receiver_masks: Vec<u64>,
    pub received: Vec<[f64; 256]>,
    pub withdrawn: Vec<[f64; 256]>,
}

pub(crate) fn species(mask: u64) -> impl Iterator<Item = usize> {
    crate::field_activity::GroupLanes::<1>::new(mask)
}

pub(crate) fn clear(row: &mut [f64], mask: u64) {
    for s in species(mask) {
        row[s] = 0.;
    }
}

impl Allocation {
    pub fn begin(&mut self, count: usize) {
        self.intensity.clear();
        self.rows.resize(count, 0..0);
        self.rows.fill(0..0);
        for i in 0..count.min(self.demand.len()) {
            clear(&mut self.demand[i], self.donor_masks[i]);
            clear(&mut self.withdrawn[i], self.donor_masks[i]);
            clear(&mut self.received[i], self.receiver_masks[i]);
        }
        for values in [&mut self.demand, &mut self.received, &mut self.withdrawn] {
            values.resize(count, [0.; 256]);
        }
        self.donor_masks.resize(count, 0);
        self.receiver_masks.resize(count, 0);
        self.donor_masks.fill(0);
        self.receiver_masks.fill(0);
    }
    pub fn request(
        &mut self,
        i: usize,
        graph: &Graph,
        imports: &[f64; 256],
        local: &[f64; 256],
        mask: u64,
    ) {
        if self.demand.is_empty() || graph.neighbors[i].is_empty() {
            return;
        }
        let start = self.intensity.len();
        for s in species(mask) {
            if imports[s] > 0. && local[s] > 0. {
                self.intensity.push((s, imports[s] / local[s]));
                self.receiver_masks[i] |= 1 << (s / 4);
            }
        }
        self.rows[i] = start..self.intensity.len();
        self.request_donors(i, graph);
    }
    pub(crate) fn request_intensity(&mut self, i: usize, graph: &Graph, support: &[(usize, f64)]) {
        if self.demand.is_empty() || support.is_empty() {
            return;
        }
        let start = self.intensity.len();
        self.intensity.extend_from_slice(support);
        self.receiver_masks[i] = support.iter().fold(0, |m, &(s, _)| m | (1 << (s / 4)));
        self.rows[i] = start..self.intensity.len();
        self.request_donors(i, graph);
    }
    fn request_donors(&mut self, i: usize, graph: &Graph) {
        let support = &self.intensity[self.rows[i].clone()];
        for n in &graph.neighbors[i] {
            let gain = n.weight * graph.exposure[n.donor];
            if gain == 0. {
                continue;
            }
            for &(s, value) in support {
                self.demand[n.donor][s] += value * gain;
            }
            self.donor_masks[n.donor] |= self.receiver_masks[i];
        }
    }
    pub fn mask(&self, i: usize) -> u64 {
        self.donor_masks.get(i).copied().unwrap_or(0)
            | self.receiver_masks.get(i).copied().unwrap_or(0)
    }
    pub fn allocate(
        &mut self,
        cells: &[Cell],
        exports: &mut [[f64; 256]],
        graph: &Graph,
        masks: &[u64],
    ) {
        if self.demand.is_empty() {
            return;
        }
        for (i, cell) in cells.iter().enumerate() {
            self.donor_masks[i] |= masks[i];
            for s in species(self.donor_masks[i]) {
                let export = &mut exports[i][s];
                let foreign = self.demand[i][s] * cell.inventory.value(s);
                let demand = foreign + *export;
                let fraction = if demand > 0. {
                    (cell.inventory.value(s) / demand).min(1.)
                } else {
                    0.
                };
                // The forward gather consumes normalized donor material. No incoming
                // allocation may replenish this frozen owner during the same event.
                self.demand[i][s] = cell.inventory.value(s) * fraction;
                self.withdrawn[i][s] = foreign * fraction;
                *export *= fraction;
            }
        }
        for (i, range) in self.rows.iter().enumerate() {
            let support = &self.intensity[range.clone()];
            if support.is_empty() {
                continue;
            }
            for n in &graph.neighbors[i] {
                let gain = n.weight * graph.exposure[n.donor];
                if gain == 0. {
                    continue;
                }
                for &(s, value) in support {
                    self.received[i][s] += value * gain * self.demand[n.donor][s];
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn factored_allocation_matches_frozen_edge_contention() {
        let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
        w.cells = vec![w.cells[0].clone(); 4];
        for (i, cell) in w.cells.iter_mut().enumerate() {
            cell.x = 12. + i as f64 * 0.01;
            cell.damage = i as f64 / 4.;
            for s in 0..256 {
                cell.inventory.set(s, ((s + i) % 7) as f64 * 0.001);
            }
        }
        let graph = Graph::new(&w.cells, &w.config);
        let intensity: Vec<[f64; 256]> = (0..4)
            .map(|i| std::array::from_fn(|s| if s % 3 == i { 30. } else { 0. }))
            .collect();
        let mut exports = vec![[0.002; 256]; 4];
        let mut wanted = exports.clone();
        let mut edges = Vec::new();
        for (i, row) in intensity.iter().enumerate() {
            for n in &graph.neighbors[i] {
                for (s, value) in row.iter().enumerate() {
                    let q = value
                        * n.weight
                        * graph.exposure[n.donor]
                        * w.cells[n.donor].inventory.value(s);
                    wanted[n.donor][s] += q;
                    edges.push((i, n.donor, s, q));
                }
            }
        }
        let mut received = vec![[0.; 256]; 4];
        let mut withdrawn = received.clone();
        for (i, j, s, q) in edges {
            let accepted = q * (w.cells[j].inventory.value(s) / wanted[j][s]).min(1.);
            received[i][s] += accepted;
            withdrawn[j][s] += accepted;
        }
        let mut allocation = Allocation::default();
        allocation.begin(4);
        for (i, row) in intensity.iter().enumerate() {
            allocation.request(i, &graph, row, &[1.; 256], u64::MAX);
        }
        allocation.allocate(&w.cells, &mut exports, &graph, &[u64::MAX; 4]);
        for i in 0..4 {
            for s in 0..256 {
                assert!((allocation.received[i][s] - received[i][s]).abs() < 1e-12);
                assert!((allocation.withdrawn[i][s] - withdrawn[i][s]).abs() < 1e-12);
                assert!(exports[i][s] + withdrawn[i][s] <= w.cells[i].inventory.value(s) + 1e-12);
            }
        }
        allocation.begin(0);
        assert!(allocation.received.is_empty() && allocation.withdrawn.is_empty());
    }

    #[test]
    fn sparse_masks_match_dense_allocation_as_recipient_and_donor_support_changes() {
        let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
        w.cells = vec![w.cells[0].clone(); 3];
        for (i, cell) in w.cells.iter_mut().enumerate() {
            cell.x = 12. + i as f64 * 0.01;
            cell.damage = 0.5;
            cell.inventory.fill(0.01);
        }
        let graph = Graph::new(&w.cells, &w.config);
        let mut sparse = Allocation::default();
        for (recipient, s) in [(0, 3), (1, 255), (2, 4), (0, 128)] {
            let mut intensity = [0.; 256];
            intensity[s] = 30.;
            let mut exports = vec![[0.; 256]; 3];
            exports[(recipient + 1) % 3][77] = 0.002;
            let mut expected_exports = exports.clone();
            let mut masks = [0; 3];
            masks[(recipient + 1) % 3] = 1 << (77 / 4);
            sparse.begin(3);
            sparse.request(recipient, &graph, &intensity, &[1.; 256], 1 << (s / 4));
            sparse.allocate(&w.cells, &mut exports, &graph, &masks);
            let mut dense = Allocation::default();
            dense.begin(3);
            dense.request(recipient, &graph, &intensity, &[1.; 256], u64::MAX);
            dense.allocate(&w.cells, &mut expected_exports, &graph, &[u64::MAX; 3]);
            for i in 0..3 {
                for s in 0..256 {
                    assert!((sparse.received[i][s] - dense.received[i][s]).abs() < 1e-12);
                    assert!((sparse.withdrawn[i][s] - dense.withdrawn[i][s]).abs() < 1e-12);
                    assert!((exports[i][s] - expected_exports[i][s]).abs() < 1e-12);
                }
                if i != recipient {
                    assert_ne!(sparse.mask(i) & (1 << (s / 4)), 0);
                }
            }
        }
        sparse.begin(0);
        sparse.begin(3);
        assert!(sparse.received.iter().flatten().all(|q| *q == 0.));
        assert!(sparse.withdrawn.iter().flatten().all(|q| *q == 0.));
    }
}
