//! Transposed footprint adjacency gives each destination its complete donor request.
use super::*;
type ProjectionRow<'a> = (
    usize,
    ((&'a mut [f64], &'a mut [f64]), &'a mut (usize, u64)),
);

impl Exchange {
    pub(super) fn project_requests(&mut self) {
        let project = |(slot, ((demand, changes), node)): ProjectionRow<'_>| {
            for &(cell, weight) in &self.delivery[slot] {
                let mask = self.masks[cell];
                node.1 |= mask;
                crate::exchange_vector::deposit(
                    demand,
                    changes,
                    &self.imports[cell],
                    &self.exports[cell],
                    weight,
                    mask,
                );
            }
        };
        let cost = crate::parallel::cost::EXCHANGE_NODE;
        if let Some(grain) = crate::parallel::grain(self.nodes.len(), cost) {
            self.demand
                .par_chunks_mut(256)
                .zip(self.changes.par_chunks_mut(256))
                .zip(self.nodes.par_iter_mut())
                .enumerate()
                .with_min_len(grain)
                .for_each(project);
        } else {
            self.demand
                .chunks_mut(256)
                .zip(self.changes.chunks_mut(256))
                .zip(self.nodes.iter_mut())
                .enumerate()
                .for_each(project);
        }
    }
}
