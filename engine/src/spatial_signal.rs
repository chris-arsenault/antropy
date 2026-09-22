//! Scalar carrier support is owned by writes, including diagnostic writes.
use serde::{Deserialize, Serialize};
use std::ops::{Index, IndexMut};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(from = "Vec<[f64; 2]>", into = "Vec<[f64; 2]>")]
pub struct Signal {
    values: Vec<[f64; 2]>,
    pub nodes: Vec<usize>,
    slots: Vec<usize>,
    pending: Vec<usize>,
    touched: Vec<bool>,
    pub(crate) exact: bool,
}
impl Default for Signal {
    fn default() -> Self {
        Vec::new().into()
    }
}
impl PartialEq for Signal {
    fn eq(&self, other: &Self) -> bool {
        self.values == other.values
    }
}
impl From<Vec<[f64; 2]>> for Signal {
    fn from(values: Vec<[f64; 2]>) -> Self {
        let nodes: Vec<usize> = values
            .iter()
            .enumerate()
            .filter_map(|(n, q)| (*q != [0.; 2]).then_some(n))
            .collect();
        let mut slots = vec![usize::MAX; values.len()];
        for (slot, &n) in nodes.iter().enumerate() {
            slots[n] = slot;
        }
        let pending = nodes.clone();
        let touched = values.iter().map(|q| *q != [0.; 2]).collect();
        Self {
            values,
            nodes,
            slots,
            pending,
            touched,
            exact: true,
        }
    }
}
impl From<Signal> for Vec<[f64; 2]> {
    fn from(s: Signal) -> Self {
        s.values
    }
}
impl Signal {
    pub(crate) fn drain_changes(
        &mut self,
        geometry: crate::spatial::Geometry,
        work: &mut crate::spatial::Work,
    ) {
        for n in self.pending.drain(..) {
            self.touched[n] = false;
            work.insert(geometry.address(n).0);
        }
    }
    fn touch(&mut self, n: usize) {
        if !self.touched[n] {
            self.pending.push(n);
            self.touched[n] = true;
        }
    }
    pub fn len(&self) -> usize {
        self.values.len()
    }
    pub fn is_empty(&self) -> bool {
        self.values.is_empty()
    }
    pub fn iter(&self) -> std::slice::Iter<'_, [f64; 2]> {
        self.values.iter()
    }
    pub fn as_slice(&self) -> &[[f64; 2]] {
        &self.values
    }
    pub fn fill(&mut self, value: [f64; 2]) {
        self.exact = true;
        for n in 0..self.len() {
            if self.values[n] != value {
                self.touch(n);
            }
        }
        if value == [0.; 2] {
            for n in self.nodes.drain(..) {
                self.values[n] = value;
                self.slots[n] = usize::MAX;
            }
        } else {
            self.values.fill(value);
            for (n, slot) in self.slots.iter_mut().enumerate() {
                *slot = n;
            }
            self.nodes = (0..self.len()).collect();
        }
    }
    pub fn compact(&mut self) {
        for &n in &self.pending {
            let slot = self.slots[n];
            if self.values[n] == [0.; 2] && slot != usize::MAX {
                self.nodes.swap_remove(slot);
                self.slots[n] = usize::MAX;
                if slot < self.nodes.len() {
                    self.slots[self.nodes[slot]] = slot;
                }
            }
        }
    }
}
impl Index<usize> for Signal {
    type Output = [f64; 2];
    fn index(&self, n: usize) -> &Self::Output {
        &self.values[n]
    }
}
impl IndexMut<usize> for Signal {
    fn index_mut(&mut self, n: usize) -> &mut Self::Output {
        self.touch(n);
        if self.slots[n] == usize::MAX {
            self.slots[n] = self.nodes.len();
            self.nodes.push(n);
        }
        &mut self.values[n]
    }
}
