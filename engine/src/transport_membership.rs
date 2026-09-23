//! Transpose of local delivery, rebuilt in parallel each exchange: every donor node owns a
//! contiguous list of its receivers, ordered by receiver index.
use super::*;
impl Exchange {
    pub(super) fn prepare_nodes(
        &mut self,
        geometry: crate::spatial::Geometry,
        sites: &[crate::footprint::Row],
    ) {
        // Donor rows need no clearing here: projection zeroes each node's current groups
        // before accumulating, and every reader stays within those groups.
        if self.slots.geometry != geometry {
            self.slots = crate::spatial_slots::Slots::new(geometry);
        } else {
            let slots = &self.slots;
            self.nodes
                .par_iter()
                .for_each(|&(node, _)| slots.set(node, usize::MAX));
        }
        let receivers = |(i, row): (usize, &crate::footprint::Row)| {
            row.iter()
                .filter(|&&(_, w)| w != 0.)
                .map(move |&(n, w)| (n, i, w))
                .collect::<Vec<_>>()
        };
        let mut links: Vec<(usize, usize, f64)> =
            match crate::parallel::grain(sites.len(), crate::parallel::cost::CELL_MARK) {
                Some(grain) => sites
                    .par_iter()
                    .enumerate()
                    .with_min_len(grain)
                    .flat_map_iter(receivers)
                    .collect(),
                None => sites.iter().enumerate().flat_map(receivers).collect(),
            };
        links.par_sort_unstable_by_key(|&(n, i, _)| (n, i));
        self.offsets.clear();
        self.offsets.par_extend(
            (0..links.len())
                .into_par_iter()
                .filter(|&k| k == 0 || links[k - 1].0 != links[k].0),
        );
        self.nodes.clear();
        self.nodes
            .par_extend(self.offsets.par_iter().map(|&k| (links[k].0, 0)));
        self.offsets.push(links.len());
        self.delivery.clear();
        self.delivery
            .par_extend(links.par_iter().map(|&(_, i, w)| (i, w)));
        let slots = &self.slots;
        self.nodes
            .par_iter()
            .enumerate()
            .for_each(|(slot, &(node, _))| slots.set(node, slot));
        let needed = self.nodes.len() * 256;
        self.demand.resize(needed, 0.);
        self.changes.resize(needed, 0.);
    }
    /// Receivers of one donor slot.
    #[cfg(test)]
    pub(super) fn receivers(&self, slot: usize) -> &[(usize, f64)] {
        &self.delivery[self.offsets[slot]..self.offsets[slot + 1]]
    }
}
