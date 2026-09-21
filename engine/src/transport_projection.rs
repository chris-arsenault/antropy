//! Transposed footprint adjacency gives each destination its complete donor request.
use super::*;
type ProjectionRow<'a> = (
    usize,
    ((&'a mut [f64], &'a mut [f64]), &'a mut (usize, u64)),
);

impl Exchange {
    pub(super) fn project_requests(&mut self, sites: &[crate::footprint::Row]) {
        self.site_offsets.clear();
        self.site_offsets.resize(self.nodes.len() + 1, 0);
        for site in sites {
            for &(node, weight) in site {
                if weight > 0. {
                    self.site_offsets[self.slots[node] + 1] += 1;
                }
            }
        }
        for i in 1..self.site_offsets.len() {
            self.site_offsets[i] += self.site_offsets[i - 1];
        }
        self.site_contributions
            .resize(*self.site_offsets.last().unwrap(), (0, 0.));
        let mut cursor = self.site_offsets.clone();
        for (cell, site) in sites.iter().enumerate() {
            for &(node, weight) in site {
                if weight > 0. {
                    let slot = self.slots[node];
                    self.site_contributions[cursor[slot]] = (cell, weight);
                    cursor[slot] += 1;
                }
            }
        }
        let project = |(slot, ((demand, changes), node)): ProjectionRow<'_>| {
            for &(cell, weight) in
                &self.site_contributions[self.site_offsets[slot]..self.site_offsets[slot + 1]]
            {
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
        if crate::parallel::enabled(self.nodes.len(), 128) {
            self.demand
                .par_chunks_mut(256)
                .zip(self.changes.par_chunks_mut(256))
                .zip(self.nodes.par_iter_mut())
                .enumerate()
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
