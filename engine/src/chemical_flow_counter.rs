//! Per-species gross histories, accumulated alongside actual accepted transfers.
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(transparent)]
pub struct Counter {
    values: Vec<f64>,
}

impl Default for Counter {
    fn default() -> Self {
        Self {
            values: vec![0.; 256],
        }
    }
}

impl Counter {
    pub fn len(&self) -> usize {
        self.values.len()
    }
    pub fn is_empty(&self) -> bool {
        self.values.is_empty()
    }
    pub fn value(&self, s: usize) -> f64 {
        self.values[s]
    }
    pub fn iter(&self) -> impl ExactSizeIterator<Item = f64> + '_ {
        self.values.iter().copied()
    }
    pub fn add(&mut self, s: usize, amount: f64) {
        self.values[s] += amount;
    }
}
