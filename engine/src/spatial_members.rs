//! Persistent local membership: motion changes a bin only when an owner crosses it.
use crate::{
    spatial::{Geometry, SITES},
    spatial_regions::Regions,
};
use std::collections::HashMap;
#[derive(Clone, Debug)]
struct Member {
    id: u64,
    node: usize,
    position: usize,
    epoch: u64,
}
#[derive(Clone, Debug, Default)]
struct Bin {
    slots: Vec<usize>,
    indices: Vec<usize>,
}
#[derive(Clone, Debug, Default)]
pub struct Members {
    geometry: Geometry,
    bins: Regions<[Bin; SITES]>,
    members: Vec<Option<Member>>,
    ids: HashMap<u64, usize>,
    free: Vec<usize>,
    epoch: u64,
    pub changes: u64,
}
impl Members {
    pub fn begin(&mut self, geometry: Geometry) {
        if geometry != self.geometry {
            *self = Self {
                geometry,
                bins: Regions::new(geometry.count()),
                ..Self::default()
            };
        }
        self.epoch += 1;
    }
    pub fn update(&mut self, id: u64, index: usize, node: usize) {
        let slot = if let Some(&slot) = self.ids.get(&id) {
            slot
        } else {
            let slot = self.free.pop().unwrap_or_else(|| {
                self.members.push(None);
                self.members.len() - 1
            });
            self.ids.insert(id, slot);
            slot
        };
        if let Some(member) = &mut self.members[slot] {
            member.epoch = self.epoch;
            if member.node == node {
                let (r, s) = self.geometry.address(node);
                self.bins.get_mut(r).unwrap()[s].indices[member.position] = index;
                return;
            }
            self.detach(slot);
        }
        let (r, s) = self.geometry.address(node);
        let bins = self.bins.own(r, || std::array::from_fn(|_| Bin::default()));
        let position = bins[s].slots.len();
        bins[s].slots.push(slot);
        bins[s].indices.push(index);
        self.members[slot] = Some(Member {
            id,
            node,
            position,
            epoch: self.epoch,
        });
        self.changes += 1;
    }
    fn detach(&mut self, slot: usize) {
        let old = self.members[slot].take().unwrap();
        let (r, s) = self.geometry.address(old.node);
        let bins = self.bins.get_mut(r).unwrap();
        bins[s].slots.swap_remove(old.position);
        bins[s].indices.swap_remove(old.position);
        if old.position < bins[s].slots.len() {
            self.members[bins[s].slots[old.position]]
                .as_mut()
                .unwrap()
                .position = old.position;
        }
        if bins.iter().all(|bin| bin.indices.is_empty()) {
            self.bins.remove(r);
        }
    }
    pub fn finish(&mut self) {
        for slot in 0..self.members.len() {
            if let Some(old) = &self.members[slot]
                && old.epoch != self.epoch
            {
                self.ids.remove(&old.id);
                self.detach(slot);
                self.free.push(slot);
                self.changes += 1;
            }
        }
    }
    #[cfg(test)]
    pub fn at(&self, node: usize) -> impl Iterator<Item = usize> + '_ {
        self.indices(node).iter().copied()
    }
    pub fn indices(&self, node: usize) -> &[usize] {
        let (r, s) = self.geometry.address(node);
        self.bins
            .get(r)
            .map_or(&[], |bins| bins[s].indices.as_slice())
    }
    pub fn occupied(&self) -> impl Iterator<Item = usize> + '_ {
        self.bins.entries.iter().flat_map(|entry| {
            self.geometry
                .sites(entry.id)
                .filter_map(|(s, n)| (!entry.value[s].indices.is_empty()).then_some(n))
        })
    }
}
