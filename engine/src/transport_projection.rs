//! Transposed footprint adjacency gives each destination its complete donor request.
use super::*;
type ProjectionRow<'a> = (
    usize,
    ((&'a mut [f64], &'a mut [f64]), &'a mut (usize, u64)),
);

impl Exchange {
    pub(super) fn project_requests(&mut self) {
        let (delivery, offsets) = (&self.delivery, &self.offsets);
        let (masks, imports, exports) = (&self.masks, &self.imports, &self.exports);
        let project = |(slot, ((demand, changes), node)): ProjectionRow<'_>| {
            let receivers = &delivery[offsets[slot]..offsets[slot + 1]];
            node.1 = receivers.iter().fold(0, |m, &(cell, _)| m | masks[cell]);
            clear(demand, node.1);
            clear(changes, node.1);
            for &(cell, weight) in receivers {
                let mask = masks[cell];
                crate::exchange_vector::deposit(
                    demand,
                    changes,
                    &imports[cell],
                    &exports[cell],
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
