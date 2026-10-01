//! A single copy-on-write weight owner and shared, exact-zero connection support.
use super::*;
use std::{
    ops::{Deref, DerefMut},
    sync::{Arc, OnceLock},
};

#[derive(Debug, Serialize, Deserialize)]
#[serde(transparent)]
struct Owner {
    values: Vec<f32>,
    #[serde(skip)]
    program: OnceLock<Program>,
    #[serde(skip)]
    strategic_program: OnceLock<strategic::Program>,
}
impl Clone for Owner {
    fn clone(&self) -> Self {
        Self {
            values: self.values.clone(),
            program: OnceLock::new(),
            strategic_program: OnceLock::new(),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(transparent)]
pub struct WeightStore(Arc<Owner>);
impl From<Vec<f32>> for WeightStore {
    fn from(values: Vec<f32>) -> Self {
        Self(Arc::new(Owner {
            values,
            program: OnceLock::new(),
            strategic_program: OnceLock::new(),
        }))
    }
}
impl PartialEq for WeightStore {
    fn eq(&self, other: &Self) -> bool {
        self.0.values == other.0.values
    }
}
impl Deref for WeightStore {
    type Target = Vec<f32>;
    fn deref(&self) -> &Self::Target {
        &self.0.values
    }
}
impl DerefMut for WeightStore {
    fn deref_mut(&mut self) -> &mut Self::Target {
        let owner = Arc::make_mut(&mut self.0);
        owner.program.take();
        owner.strategic_program.take();
        &mut owner.values
    }
}
impl IntoIterator for WeightStore {
    type Item = f32;
    type IntoIter = std::vec::IntoIter<f32>;
    fn into_iter(self) -> Self::IntoIter {
        Arc::unwrap_or_clone(self.0).values.into_iter()
    }
}
impl<'a> IntoIterator for &'a WeightStore {
    type Item = &'a f32;
    type IntoIter = std::slice::Iter<'a, f32>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}
impl<'a> IntoIterator for &'a mut WeightStore {
    type Item = &'a mut f32;
    type IntoIter = std::slice::IterMut<'a, f32>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter_mut()
    }
}
impl WeightStore {
    pub(super) fn strategic_program(&self) -> &strategic::Program {
        self.0
            .strategic_program
            .get_or_init(|| strategic::Program::compile(self))
    }
    pub(super) fn program(&self) -> &Program {
        self.0.program.get_or_init(|| Program {
            input: Projection::compile(&self[..RECURRENT], INPUTS),
            output: Projection::compile(&self[OUTPUT..OUTPUT_BIAS], HIDDEN),
            input_strength: std::array::from_fn(|i| {
                strength(&self[i * INPUTS..(i + 1) * INPUTS]) + self[BIAS + i].abs()
            }),
            recurrent_strength: std::array::from_fn(|i| {
                strength(&self[RECURRENT + i * HIDDEN..RECURRENT + (i + 1) * HIDDEN])
            }),
            output_strength: std::array::from_fn(|i| {
                strength(&self[OUTPUT + i * HIDDEN..OUTPUT + (i + 1) * HIDDEN])
                    + self[OUTPUT_BIAS + i].abs()
            }),
        })
    }
}

fn strength(row: &[f32]) -> f32 {
    row.iter().map(|w| w.abs()).sum()
}

#[derive(Debug)]
enum Row {
    Dense,
    Sparse(std::ops::Range<usize>),
}
#[derive(Debug)]
pub(super) struct Projection {
    rows: Vec<Row>,
    columns: Vec<u8>,
    all_dense: bool,
}
impl Projection {
    pub(super) fn compile(weights: &[f32], width: usize) -> Self {
        let mut result = Self {
            rows: Vec::with_capacity(weights.len() / width),
            columns: Vec::new(),
            all_dense: true,
        };
        for row in weights.chunks_exact(width) {
            if row.iter().all(|w| *w != 0.) {
                result.rows.push(Row::Dense);
                continue;
            }
            let start = result.columns.len();
            result.all_dense = false;
            result.columns.extend(
                row.iter()
                    .enumerate()
                    .filter_map(|(i, w)| (*w != 0.).then_some(i as u8)),
            );
            result.rows.push(Row::Sparse(start..result.columns.len()));
        }
        result
    }
    pub(super) fn apply(&self, weights: &[f32], inputs: &[f32], bias: &[f32], output: &mut [f32]) {
        if self.all_dense {
            arithmetic::project(weights, inputs, bias, output);
            return;
        }
        for (i, row) in self.rows.iter().enumerate() {
            let weights = &weights[i * inputs.len()..(i + 1) * inputs.len()];
            let sum = match row {
                Row::Dense => crate::numeric::dot(weights, inputs),
                Row::Sparse(range) => {
                    // Preserve the four-lane summation order used by the dense contraction.
                    let mut lanes = [0.; 4];
                    for &j in &self.columns[range.clone()] {
                        let j = j as usize;
                        lanes[j % 4] += weights[j] * inputs[j];
                    }
                    lanes.into_iter().sum()
                }
            };
            output[i] = sum + bias[i];
        }
    }
}
#[derive(Debug)]
pub(super) struct Program {
    pub input: Projection,
    pub output: Projection,
    pub input_strength: [f32; HIDDEN],
    pub recurrent_strength: [f32; HIDDEN],
    pub output_strength: [f32; TOTAL_OUTPUTS],
}

#[cfg(test)]
#[path = "weights_tests.rs"]
mod tests;
