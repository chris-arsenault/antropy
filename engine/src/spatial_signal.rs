//! Scalar carrier support is owned by writes, including diagnostic writes.
use serde::{Deserialize, Serialize};
use std::ops::{Index, IndexMut};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(from = "Vec<[f64; 2]>", into = "Vec<[f64; 2]>")]
pub struct Signal {
    values: Vec<[f64; 2]>,
    pub nodes: Vec<usize>,
    listed: Vec<bool>,
    pub revision: u64,
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
        let nodes = values
            .iter()
            .enumerate()
            .filter_map(|(n, q)| (*q != [0.; 2]).then_some(n))
            .collect();
        let listed = values.iter().map(|q| *q != [0.; 2]).collect();
        Self {
            values,
            nodes,
            listed,
            revision: 1,
        }
    }
}
impl From<Signal> for Vec<[f64; 2]> {
    fn from(s: Signal) -> Self {
        s.values
    }
}
impl Signal {
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
        self.revision = self.revision.wrapping_add(1);
        if value == [0.; 2] {
            for n in self.nodes.drain(..) {
                self.values[n] = value;
                self.listed[n] = false;
            }
        } else {
            self.values.fill(value);
            self.listed.fill(true);
            self.nodes = (0..self.len()).collect();
        }
    }
    pub fn compact(&mut self) {
        self.nodes.retain(|&n| {
            let active = self.values[n] != [0.; 2];
            self.listed[n] = active;
            active
        });
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
        if !self.listed[n] {
            self.nodes.push(n);
            self.listed[n] = true;
        }
        self.revision = self.revision.wrapping_add(1);
        &mut self.values[n]
    }
}
