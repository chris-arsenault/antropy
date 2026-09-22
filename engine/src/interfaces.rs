//! Scalar contact mixtures from ordinary circle overlaps.
use crate::{chemistry::Chemistry, config::Config, organism::Cell};

#[derive(Clone, Debug, PartialEq)]
pub struct Reading {
    pub field: f64,
    pub recognition: [[f64; 5]; 4],
    pub stress: f64,
}
impl Default for Reading {
    fn default() -> Self {
        Self {
            field: 1.,
            recognition: [[0.; 5]; 4],
            stress: 0.,
        }
    }
}
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Neighbor {
    pub donor: usize,
    /// Normalized overlap times the receiver's free-field share.
    pub weight: f64,
}
#[derive(Default, Debug, Clone)]
pub struct Graph {
    pub field: Vec<f64>,
    pub contacts: Vec<[f64; 4]>,
    pub exposure: Vec<f64>,
    pub exposed: bool,
    neighbors: Vec<Vec<Neighbor>>,
}
#[path = "interface_geometry.rs"]
mod geometry;
#[path = "interface_reading.rs"]
mod reading;
pub use reading::selected;

impl Graph {
    pub fn neighbors(&self, i: usize) -> &[Neighbor] {
        &self.neighbors[i]
    }
    pub fn prepare(&self, cells: &mut [Cell], c: &Config, chemistry: &Chemistry) {
        self.prepare_with::<true>(cells, c, chemistry);
    }
    pub fn prepare_exchange(&self, cells: &mut [Cell], c: &Config, chemistry: &Chemistry) {
        self.prepare_with::<false>(cells, c, chemistry);
    }
    fn prepare_with<const CONTROL: bool>(
        &self,
        cells: &mut [Cell],
        c: &Config,
        chemistry: &Chemistry,
    ) {
        let stress: Vec<_> = if CONTROL {
            Vec::new()
        } else {
            cells
                .iter()
                .map(|cell| cell.inventory.projection(chemistry).stress)
                .collect()
        };
        let mut readings = vec![Reading::default(); cells.len()];
        crate::parallel::for_each(&mut readings, 128, |i, out| {
            *out = self.read_with::<CONTROL>(i, cells, c, chemistry, &stress);
        });
        for (i, (cell, reading)) in cells.iter_mut().zip(readings).enumerate() {
            cell.interface = reading;
            if CONTROL {
                cell.contacts = self.contacts[i];
            }
        }
    }
    pub fn reading(&self, i: usize, cells: &[Cell], c: &Config, chemistry: &Chemistry) -> Reading {
        let mut reading = self.read_with::<true>(i, cells, c, chemistry, &[]);
        reading.stress = self.read_with::<false>(i, cells, c, chemistry, &[]).stress;
        reading
    }
    pub fn local(&self, i: usize, cells: &[Cell], c: &Config, field: &[f32; 256]) -> [f64; 256] {
        self.local_masked(i, cells, c, field, u64::MAX)
    }
    pub fn local_masked(
        &self,
        i: usize,
        cells: &[Cell],
        _c: &Config,
        field: &[f32; 256],
        mask: u64,
    ) -> [f64; 256] {
        let mut result = [0.; 256];
        for s in crate::contact_exchange::species(mask) {
            result[s] = field[s] as f64 * self.field[i];
        }
        for n in self.neighbors(i) {
            let gain = n.weight * self.exposure[n.donor];
            for s in crate::contact_exchange::species(mask) {
                result[s] += gain * cells[n.donor].inventory.value(s);
            }
        }
        result
    }
}
#[cfg(test)]
#[path = "mechanical_interface_tests.rs"]
mod mechanical_tests;
