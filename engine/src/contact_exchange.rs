//! Direct requests over circle contacts, capped once against each frozen donor.
use crate::{interfaces::Graph, organism::Cell};

#[derive(Clone, Debug, Default)]
pub struct Allocation {
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
        for rows in [&mut self.demand, &mut self.received, &mut self.withdrawn] {
            rows.resize(count, [0.; 256]);
            rows.fill([0.; 256]);
        }
        self.donor_masks.resize(count, 0);
        self.donor_masks.fill(0);
        self.receiver_masks.resize(count, 0);
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
        let support: Vec<_> = species(mask)
            .filter(|&s| imports[s] > 0. && local[s] > 0.)
            .map(|s| (s, imports[s] / local[s]))
            .collect();
        self.request_intensity(i, graph, &support);
    }
    pub(crate) fn request_intensity(&mut self, i: usize, graph: &Graph, support: &[(usize, f64)]) {
        if self.demand.is_empty() || support.is_empty() {
            return;
        }
        let mask = support.iter().fold(0, |m, &(s, _)| m | (1 << (s / 4)));
        self.receiver_masks[i] = mask;
        for &(s, value) in support {
            self.received[i][s] = value;
        }
        for n in graph.neighbors(i) {
            self.donor_masks[n.donor] |= mask;
            let gain = n.weight * graph.exposure[n.donor];
            for &(s, value) in support {
                self.demand[n.donor][s] += gain * value;
            }
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
            for s in species(masks[i] | self.donor_masks[i]) {
                let stock = cell.inventory.value(s);
                let foreign = self.demand[i][s] * stock;
                let total = foreign + exports[i][s];
                let fraction = if total > 0. {
                    (stock / total).min(1.)
                } else {
                    0.
                };
                self.demand[i][s] = stock * fraction;
                self.withdrawn[i][s] = foreign * fraction;
                exports[i][s] *= fraction;
            }
        }
        for i in 0..cells.len() {
            for s in species(self.receiver_masks[i]) {
                let supply: f64 = graph
                    .neighbors(i)
                    .iter()
                    .map(|n| n.weight * graph.exposure[n.donor] * self.demand[n.donor][s])
                    .sum();
                self.received[i][s] *= supply;
            }
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn circle_allocation_matches_frozen_donor_contention() {
        for count in [4, 12, 24] {
            let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
            w.cells = vec![w.cells[0].clone(); count];
            for (i, cell) in w.cells.iter_mut().enumerate() {
                cell.x = 12. + i as f64 * 0.01;
                cell.damage = i as f64 / count as f64;
                for s in 0..256 {
                    cell.inventory.set(s, ((s + i) % 7) as f64 * 0.001);
                }
            }
            let graph = Graph::new(&w.cells, &w.config);
            let intensity: Vec<[f64; 256]> = (0..count)
                .map(|i| std::array::from_fn(|s| if s % 3 == i % 3 { 30. } else { 0. }))
                .collect();
            let mut exports = vec![[0.002; 256]; count];
            let mut wanted = exports.clone();
            let mut edges = Vec::new();
            for (i, row) in intensity.iter().enumerate() {
                for n in graph.neighbors(i) {
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
            let mut received = vec![[0.; 256]; count];
            let mut withdrawn = received.clone();
            for (i, j, s, q) in edges {
                let accepted = q * (w.cells[j].inventory.value(s) / wanted[j][s]).min(1.);
                received[i][s] += accepted;
                withdrawn[j][s] += accepted;
            }
            let mut allocation = Allocation::default();
            allocation.begin(count);
            for (i, row) in intensity.iter().enumerate() {
                allocation.request(i, &graph, row, &[1.; 256], u64::MAX);
            }
            allocation.allocate(&w.cells, &mut exports, &graph, &vec![u64::MAX; count]);
            for i in 0..count {
                for s in 0..256 {
                    assert!((allocation.received[i][s] - received[i][s]).abs() < 1e-12);
                    assert!((allocation.withdrawn[i][s] - withdrawn[i][s]).abs() < 1e-12);
                    assert!(
                        exports[i][s] + withdrawn[i][s] <= w.cells[i].inventory.value(s) + 1e-12
                    );
                }
            }
            allocation.begin(0);
            assert!(allocation.received.is_empty() && allocation.withdrawn.is_empty());
        }
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
