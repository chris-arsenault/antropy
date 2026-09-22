//! Compact local-node indexing backed by the shared regional owner.
use crate::{
    spatial::{Geometry, SITES},
    spatial_regions::Regions,
};
#[derive(Clone, Debug, Default)]
pub struct Slots {
    pub geometry: Geometry,
    regions: Regions<[usize; SITES]>,
}
impl Slots {
    pub fn new(geometry: Geometry) -> Self {
        Self {
            geometry,
            regions: Regions::new(geometry.count()),
        }
    }
    pub fn set(&mut self, node: usize, value: usize) {
        let (r, s) = self.geometry.address(node);
        if value == usize::MAX && self.regions.get(r).is_none() {
            return;
        }
        let row = self.regions.own(r, || [usize::MAX; SITES]);
        row[s] = value;
        if row.iter().all(|&v| v == usize::MAX) {
            self.regions.remove(r);
        }
    }
    #[cfg(test)]
    pub fn is_empty(&self) -> bool {
        self.regions.entries.is_empty()
    }
}
impl std::ops::Index<usize> for Slots {
    type Output = usize;
    fn index(&self, node: usize) -> &usize {
        let (r, s) = self.geometry.address(node);
        self.regions.get(r).map_or(&usize::MAX, |row| &row[s])
    }
}
