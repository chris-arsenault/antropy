//! Compact geographic rows; absent space owns no chemical allocation.
use serde::{Deserialize, Serialize};
use std::ops::{Index, IndexMut, Range};

const WIDTH: usize = 256;
static ZERO: [f32; WIDTH] = [0.; WIDTH];

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(try_from = "Stored", into = "Stored")]
pub struct Material {
    slots: Vec<u32>,
    nodes: Vec<usize>,
    values: Vec<f32>,
}

#[derive(Serialize, Deserialize)]
struct Stored {
    count: usize,
    nodes: Vec<usize>,
    values: Vec<f32>,
}
impl From<Material> for Stored {
    fn from(m: Material) -> Self {
        Self {
            count: m.slots.len(),
            nodes: m.nodes,
            values: m.values,
        }
    }
}
impl TryFrom<Stored> for Material {
    type Error = String;
    fn try_from(s: Stored) -> Result<Self, String> {
        if s.count > crate::memory_budget::MAX_FIELD_NODES
            || s.values.len() != s.nodes.len() * WIDTH
        {
            return Err("Invalid sparse material dimensions".into());
        }
        let mut m = Self::new(s.count);
        for (slot, &node) in s.nodes.iter().enumerate() {
            if node >= s.count || m.slots[node] != 0 {
                return Err("Invalid sparse material owner".into());
            }
            m.slots[node] = (slot + 1) as u32;
        }
        m.nodes = s.nodes;
        m.values = s.values;
        Ok(m)
    }
}
impl Default for Material {
    fn default() -> Self {
        Self::new(0)
    }
}
impl Material {
    pub fn new(count: usize) -> Self {
        Self {
            slots: vec![0; count],
            nodes: Vec::new(),
            values: Vec::new(),
        }
    }
    pub fn len(&self) -> usize {
        self.slots.len() * WIDTH
    }
    pub fn is_empty(&self) -> bool {
        self.slots.is_empty()
    }
    pub fn nodes(&self) -> &[usize] {
        &self.nodes
    }
    pub fn allocated_bytes(&self) -> usize {
        self.slots.capacity() * 4
            + self.nodes.capacity() * std::mem::size_of::<usize>()
            + self.values.capacity() * 4
    }
    pub fn row(&self, node: usize) -> &[f32] {
        let slot = self.slots[node];
        if slot == 0 {
            &ZERO
        } else {
            &self.values[(slot as usize - 1) * WIDTH..slot as usize * WIDTH]
        }
    }
    pub fn row_mut(&mut self, node: usize) -> &mut [f32] {
        if self.slots[node] == 0 {
            self.nodes.push(node);
            self.slots[node] = self.nodes.len() as u32;
            self.values.resize(self.nodes.len() * WIDTH, 0.);
        }
        let slot = self.slots[node] as usize - 1;
        &mut self.values[slot * WIDTH..(slot + 1) * WIDTH]
    }
    pub fn rows(&self) -> impl Iterator<Item = (usize, &[f32])> {
        self.nodes
            .iter()
            .copied()
            .zip(self.values.chunks_exact(WIDTH))
    }
    pub fn iter(&self) -> std::slice::Iter<'_, f32> {
        self.values.iter()
    }
    pub fn chunks_exact(&self, width: usize) -> std::slice::ChunksExact<'_, f32> {
        assert_eq!(width, WIDTH);
        self.values.chunks_exact(width)
    }
    /// Cold full-domain fixture/intervention only; never used by stepping or observations.
    pub fn dense_values_mut(&mut self) -> std::slice::IterMut<'_, f32> {
        let mut dense = vec![0.; self.len()];
        for (n, row) in self.rows() {
            dense[n * WIDTH..(n + 1) * WIDTH].copy_from_slice(row);
        }
        self.nodes = (0..self.slots.len()).collect();
        for (n, slot) in self.slots.iter_mut().enumerate() {
            *slot = (n + 1) as u32;
        }
        self.values = dense;
        self.values.iter_mut()
    }
    pub fn fill(&mut self, value: f32) {
        if value != 0. {
            self.dense_values_mut().for_each(|q| *q = value);
            return;
        }
        self.clear();
    }
    pub fn clear(&mut self) {
        for n in self.nodes.drain(..) {
            self.slots[n] = 0;
        }
        self.values.clear();
    }
    pub fn prepare(&mut self, nodes: &[usize]) {
        self.clear();
        for &n in nodes {
            self.row_mut(n);
        }
    }
    pub fn values_mut(&mut self) -> &mut [f32] {
        &mut self.values
    }
    pub fn reclaim(&mut self) {
        let keep: Vec<_> = self
            .values
            .chunks_exact(WIDTH)
            .map(|r| r.iter().any(|&q| q != 0.))
            .collect();
        let mut decision = vec![false; self.slots.len()];
        for (&n, keep) in self.nodes.iter().zip(keep) {
            decision[n] = keep;
        }
        self.retain(|n| decision[n]);
    }
    pub fn retain(&mut self, keep: impl Fn(usize) -> bool) {
        let mut slot = 0;
        while slot < self.nodes.len() {
            if keep(self.nodes[slot]) {
                slot += 1;
                continue;
            }
            let n = self.nodes.swap_remove(slot);
            self.slots[n] = 0;
            let last = self.nodes.len();
            if slot != last {
                self.values
                    .copy_within(last * WIDTH..(last + 1) * WIDTH, slot * WIDTH);
                self.slots[self.nodes[slot]] = (slot + 1) as u32;
            }
            self.values.truncate(last * WIDTH);
        }
        // Releasing a vanished colony must also release its retained high-water allocation.
        if self.values.capacity() > 4 * self.values.len().max(WIDTH) {
            self.values.shrink_to(self.values.len() * 2);
            self.nodes.shrink_to(self.nodes.len() * 2);
        }
    }
}
impl Index<usize> for Material {
    type Output = f32;
    fn index(&self, i: usize) -> &f32 {
        &self.row(i / WIDTH)[i % WIDTH]
    }
}
impl IndexMut<usize> for Material {
    fn index_mut(&mut self, i: usize) -> &mut f32 {
        &mut self.row_mut(i / WIDTH)[i % WIDTH]
    }
}
impl Index<Range<usize>> for Material {
    type Output = [f32];
    fn index(&self, r: Range<usize>) -> &[f32] {
        let start = r.start % WIDTH;
        &self.row(r.start / WIDTH)[start..start + r.len()]
    }
}
impl IndexMut<Range<usize>> for Material {
    fn index_mut(&mut self, r: Range<usize>) -> &mut [f32] {
        let start = r.start % WIDTH;
        &mut self.row_mut(r.start / WIDTH)[start..start + r.len()]
    }
}
