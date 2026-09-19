//! Derived work lists; material ownership and checkpoint layout remain in Field.
// Shared concentration resolution: below 0.001% of the default recognition half-saturation.
// Discarded extracellular material remains explicit in FieldBalance numerical accounts.
pub const CONCENTRATION_FLOOR: f32 = 1e-6;

/// Four-chemical support, consumed two lanes at a time by f64 SIMD kernels.
pub fn pairs(mut mask: u64) -> impl Iterator<Item = usize> {
    std::iter::from_fn(move || {
        if mask == 0 {
            return None;
        }
        let start = mask.trailing_zeros() as usize * 4;
        mask &= mask - 1;
        Some([start, start + 2])
    })
    .flatten()
}

#[derive(Clone, Debug, Default)]
pub struct Activity {
    pub masks: Vec<u64>,
    pub nodes: Vec<usize>,
    listed: Vec<bool>,
    pub work: Vec<usize>,
    pub candidates: Vec<u64>,
    queued: Vec<bool>,
}

pub fn mask(row: &[f32]) -> u64 {
    let mut bits = 0;
    for (i, group) in row.as_chunks::<4>().0.iter().enumerate() {
        if group.iter().any(|q| *q > 0.) {
            bits |= 1 << i;
        }
    }
    bits
}

pub fn clear(row: &mut [f32], mut mask: u64) {
    if mask == u64::MAX {
        row.fill(0.);
        return;
    }
    while mask != 0 {
        let s = mask.trailing_zeros() as usize * 4;
        mask &= mask - 1;
        row[s..s + 4].fill(0.);
    }
}

impl Activity {
    pub fn rebuild(&mut self, amounts: &[f32]) {
        let count = amounts.len() / 256;
        self.masks = vec![0; count];
        self.listed = vec![false; count];
        self.candidates = vec![0; count];
        self.queued = vec![false; count];
        self.nodes.clear();
        self.work.clear();
        for (node, row) in amounts.as_chunks::<256>().0.iter().enumerate() {
            self.set(node, mask(row));
        }
    }
    pub fn set(&mut self, node: usize, mask: u64) {
        self.masks[node] = mask;
        if mask != 0 {
            self.retain(node);
        }
    }
    pub fn retain(&mut self, node: usize) {
        if !self.listed[node] {
            self.listed[node] = true;
            self.nodes.push(node);
        }
    }
    fn queue(&mut self, node: usize, mask: u64) {
        if !self.queued[node] {
            self.queued[node] = true;
            self.work.push(node);
        }
        self.candidates[node] |= mask;
    }
    pub fn prepare(&mut self, neighbors: &[[usize; 4]]) {
        if self.nodes.len() > neighbors.len() / 2 {
            for (node, adjacent) in neighbors.iter().enumerate() {
                let mask = adjacent
                    .iter()
                    .fold(self.masks[node], |m, &n| m | self.masks[n]);
                if mask != 0 || self.listed[node] {
                    self.queue(node, mask);
                }
                self.listed[node] = false;
            }
            self.nodes.clear();
            return;
        }
        for i in 0..self.nodes.len() {
            let node = self.nodes[i];
            let mask = self.masks[node];
            self.queue(node, mask);
            if mask != 0 {
                for &other in &neighbors[node] {
                    self.queue(other, mask);
                }
            }
            self.listed[node] = false;
        }
        self.nodes.clear();
        self.work.sort_unstable();
    }
    pub fn finish(&mut self) {
        for &node in &self.work {
            self.candidates[node] = 0;
            self.queued[node] = false;
        }
        self.work.clear();
    }
}
