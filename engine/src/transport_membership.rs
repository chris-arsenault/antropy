//! Persistent transpose of local delivery; changing a footprint edits only its donor rows.
use super::*;
impl Exchange {
    pub(super) fn prepare_nodes(
        &mut self,
        geometry: crate::spatial::Geometry,
        sites: &[crate::footprint::Row],
    ) {
        for (slot, (_, mask)) in self.nodes.iter_mut().enumerate() {
            clear(&mut self.demand[slot * 256..(slot + 1) * 256], *mask);
            clear(&mut self.changes[slot * 256..(slot + 1) * 256], *mask);
            *mask = 0;
        }
        if self.slots.geometry != geometry {
            self.slots = crate::spatial_slots::Slots::new(geometry);
            self.nodes.clear();
            self.delivery.clear();
            self.delivery_links.clear();
            self.previous_sites.clear();
        }
        self.delivery_links
            .resize_with(sites.len().max(self.previous_sites.len()), Vec::new);
        for i in 0..sites.len().max(self.previous_sites.len()) {
            let next = sites.get(i).map_or(&[][..], |row| row.as_slice());
            let old = self
                .previous_sites
                .get(i)
                .map_or(&[][..], |row| row.as_slice());
            if next == old {
                continue;
            }
            for link in (0..self.delivery_links[i].len()).rev() {
                let (n, position) = self.delivery_links[i][link];
                if let Some(&(_, weight)) = next.iter().find(|&&(node, w)| node == n && w > 0.) {
                    self.delivery[self.slots[n]][position].1 = weight;
                } else {
                    self.remove_delivery(i, link);
                }
            }
            for &(n, weight) in next {
                if weight == 0. || self.delivery_links[i].iter().any(|&(node, _)| node == n) {
                    continue;
                }
                if self.slots[n] == usize::MAX {
                    self.slots.set(n, self.nodes.len());
                    self.nodes.push((n, 0));
                    self.delivery.push(Vec::new());
                }
                let delivery = &mut self.delivery[self.slots[n]];
                self.delivery_links[i].push((n, delivery.len()));
                delivery.push((i, weight));
            }
        }
        self.delivery_links.truncate(sites.len());
        self.previous_sites
            .resize_with(sites.len(), crate::footprint::Row::default);
        self.previous_sites.clone_from_slice(sites);
        for i in (0..self.nodes.len()).rev() {
            if !self.delivery[i].is_empty() {
                continue;
            }
            let (node, _) = self.nodes.swap_remove(i);
            self.delivery.swap_remove(i);
            self.slots.set(node, usize::MAX);
            if i < self.nodes.len() {
                self.slots.set(self.nodes[i].0, i);
            }
        }
        let needed = self.nodes.len() * 256;
        self.demand.resize(needed, 0.);
        self.changes.resize(needed, 0.);
    }
    fn remove_delivery(&mut self, cell: usize, link: usize) {
        let (node, position) = self.delivery_links[cell].swap_remove(link);
        let delivery = &mut self.delivery[self.slots[node]];
        delivery.swap_remove(position);
        if let Some(&(moved, _)) = delivery.get(position) {
            let reverse = self.delivery_links[moved]
                .iter_mut()
                .find(|entry| entry.0 == node)
                .unwrap();
            reverse.1 = position;
        }
    }
}
