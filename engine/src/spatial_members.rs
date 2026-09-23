//! Bin membership rebuilt in parallel from sorted (node, index) entries; a dense node table
//! gives each occupied bin's contiguous list of indices.
use crate::spatial::Geometry;
use rayon::prelude::*;
use std::sync::atomic::{AtomicU32, Ordering};

#[derive(Debug, Default)]
pub struct Members {
    geometry: Geometry,
    /// Node -> occupied bin, or `u32::MAX`; reset only for previously occupied bins.
    lookup: Vec<AtomicU32>,
    nodes: Vec<usize>,
    offsets: Vec<usize>,
    indices: Vec<usize>,
}
impl Clone for Members {
    fn clone(&self) -> Self {
        Self {
            geometry: self.geometry,
            lookup: self
                .lookup
                .iter()
                .map(|v| AtomicU32::new(v.load(Ordering::Relaxed)))
                .collect(),
            nodes: self.nodes.clone(),
            offsets: self.offsets.clone(),
            indices: self.indices.clone(),
        }
    }
}
impl Members {
    /// `entry(k)` gives the k-th (node, index) pair; pairs must be sorted by node.
    pub fn rebuild(
        &mut self,
        geometry: Geometry,
        len: usize,
        entry: impl Fn(usize) -> (usize, usize) + Sync,
    ) {
        if geometry != self.geometry || self.lookup.is_empty() {
            self.geometry = geometry;
            self.lookup = (0..geometry.nx * geometry.ny)
                .map(|_| AtomicU32::new(u32::MAX))
                .collect();
        } else {
            let lookup = &self.lookup;
            self.nodes
                .par_iter()
                .for_each(|&n| lookup[n].store(u32::MAX, Ordering::Relaxed));
        }
        self.offsets.clear();
        self.offsets.par_extend(
            (0..len)
                .into_par_iter()
                .filter(|&k| k == 0 || entry(k - 1).0 != entry(k).0),
        );
        self.nodes.clear();
        self.nodes
            .par_extend(self.offsets.par_iter().map(|&k| entry(k).0));
        self.offsets.push(len);
        self.indices.clear();
        self.indices
            .par_extend((0..len).into_par_iter().map(|k| entry(k).1));
        let lookup = &self.lookup;
        self.nodes
            .par_iter()
            .enumerate()
            .for_each(|(bin, &n)| lookup[n].store(bin as u32, Ordering::Relaxed));
    }
    #[cfg(test)]
    pub fn at(&self, node: usize) -> impl Iterator<Item = usize> + '_ {
        self.indices(node).iter().copied()
    }
    pub fn indices(&self, node: usize) -> &[usize] {
        match self.lookup.get(node).map(|v| v.load(Ordering::Relaxed)) {
            Some(bin) if bin != u32::MAX => {
                let bin = bin as usize;
                &self.indices[self.offsets[bin]..self.offsets[bin + 1]]
            }
            _ => &[],
        }
    }
    pub fn occupied(&self) -> impl Iterator<Item = usize> + '_ {
        self.nodes.iter().copied()
    }
}
