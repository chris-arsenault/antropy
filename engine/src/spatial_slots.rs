//! Dense node-to-slot index for compact per-donor rows; one word per node, written in
//! parallel because every slot belongs to exactly one node.
use crate::spatial::Geometry;
use std::sync::atomic::{AtomicUsize, Ordering};

#[derive(Debug, Default)]
pub struct Slots {
    pub geometry: Geometry,
    slots: Vec<AtomicUsize>,
}
impl Clone for Slots {
    fn clone(&self) -> Self {
        Self {
            geometry: self.geometry,
            slots: self
                .slots
                .iter()
                .map(|s| AtomicUsize::new(s.load(Ordering::Relaxed)))
                .collect(),
        }
    }
}
impl Slots {
    pub fn new(geometry: Geometry) -> Self {
        Self {
            geometry,
            slots: (0..geometry.nx * geometry.ny)
                .map(|_| AtomicUsize::new(usize::MAX))
                .collect(),
        }
    }
    pub fn set(&self, node: usize, value: usize) {
        self.slots[node].store(value, Ordering::Relaxed);
    }
    pub fn get(&self, node: usize) -> usize {
        self.slots[node].load(Ordering::Relaxed)
    }
    #[cfg(test)]
    pub fn is_empty(&self) -> bool {
        self.slots
            .iter()
            .all(|s| s.load(Ordering::Relaxed) == usize::MAX)
    }
}
