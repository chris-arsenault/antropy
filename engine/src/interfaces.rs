//! Shared compact contact geometry. No lineage labels or new encounter radius.
use crate::{chemistry::Chemistry, config::Config, organism::Cell};

#[derive(Clone, Debug)]
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
#[derive(Clone, Debug, Default)]
pub struct Neighbor {
    pub donor: usize,
    pub weight: f64,
    /// World-frame unit displacement; receivers rotate it when sensing.
    pub direction: [f64; 2],
}
/// Material adjacency contains current exposed donors; mechanical summaries include all contacts.
#[derive(Default, Debug, Clone)]
pub struct Neighbors {
    rows: Vec<Vec<Neighbor>>,
}
impl std::ops::Index<usize> for Neighbors {
    type Output = [Neighbor];
    fn index(&self, i: usize) -> &Self::Output {
        &self.rows[i]
    }
}
impl Neighbors {
    pub fn iter(&self) -> impl Iterator<Item = &[Neighbor]> {
        self.rows.iter().map(Vec::as_slice)
    }
}
#[derive(Default, Debug, Clone)]
pub struct Graph {
    pub neighbors: Neighbors,
    pub field: Vec<f64>,
    /// Directional contact inputs include every geometric overlap, including intact cells.
    pub contacts: Vec<[f64; 4]>,
    /// Current damage per donor volume; the base step's geometry stays frozen.
    pub exposure: Vec<f64>,
}
#[path = "interface_geometry.rs"]
mod geometry;
#[path = "interface_reading.rs"]
mod reading;
pub use reading::selected;

impl Graph {
    pub fn prepare(&self, cells: &mut [Cell], c: &Config, chemistry: &Chemistry) {
        self.prepare_with::<true>(cells, c, chemistry);
    }
    /// Exchange consumes field access and stress, without receptor or contact inputs.
    pub fn prepare_exchange(&self, cells: &mut [Cell], c: &Config, chemistry: &Chemistry) {
        self.prepare_with::<false>(cells, c, chemistry);
    }
    fn prepare_with<const CONTROL: bool>(
        &self,
        cells: &mut [Cell],
        c: &Config,
        chemistry: &Chemistry,
    ) {
        // A donor's total stress is independent of the receiver. Reduce its mixture
        // once per frozen pass; only membrane compatibility varies across edges.
        let stress: Vec<_> = if CONTROL {
            Vec::new()
        } else {
            cells
                .iter()
                .map(|cell| donor_stress(cell, chemistry))
                .collect()
        };
        let mut readings = vec![Reading::default(); cells.len()];
        crate::parallel::for_each(&mut readings, 128, |i, output| {
            *output = {
                if CONTROL {
                    self.reading_with::<true, false>(i, cells, c, chemistry, |_| 0.)
                } else {
                    self.reading_with::<false, true>(i, cells, c, chemistry, |j| stress[j])
                }
            };
        });
        for (i, (cell, reading)) in cells.iter_mut().zip(readings).enumerate() {
            cell.interface = reading;
            if !CONTROL {
                continue;
            }
            cell.contacts = self.contacts[i];
        }
    }
    pub fn reading(&self, i: usize, cells: &[Cell], c: &Config, chemistry: &Chemistry) -> Reading {
        self.reading_with::<true, true>(i, cells, c, chemistry, |j| {
            donor_stress(&cells[j], chemistry)
        })
    }
    fn reading_with<const CONTROL: bool, const STRESS: bool>(
        &self,
        i: usize,
        cells: &[Cell],
        c: &Config,
        chemistry: &Chemistry,
        stress: impl Fn(usize) -> f64,
    ) -> Reading {
        reading::Boundary {
            neighbors: &self.neighbors[i],
            field: self.field[i],
        }
        .read::<CONTROL, STRESS>(i, cells, c, chemistry, stress, |j| self.exposure[j])
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
        for s in crate::field_activity::pairs(mask) {
            result[s] = field[s] as f64 * self.field[i];
            result[s + 1] = field[s + 1] as f64 * self.field[i];
        }
        for n in &self.neighbors[i] {
            let donor = &cells[n.donor];
            let gain = n.weight * self.exposure[n.donor];
            if gain == 0. {
                continue;
            }
            for s in crate::field_activity::pairs(mask) {
                result[s] += gain * donor.inventory.value(s);
                result[s + 1] += gain * donor.inventory.value(s + 1);
            }
        }
        result
    }
}

fn donor_stress(cell: &Cell, chemistry: &Chemistry) -> f64 {
    if cell.damage == 0. {
        return 0.;
    }
    cell.inventory.projection(chemistry).stress
}

#[cfg(test)]
#[path = "mechanical_interface_tests.rs"]
mod mechanical_tests;
