//! Normalized finite body quadrature composed with the geographic interpolation matrix.
use crate::{config::Config, field::Field, organism::Cell};
#[path = "footprint_execution.rs"]
mod execution;
pub use execution::Projection;

/// Four quadrature points each have four interpolation destinations. Duplicate
/// destinations are merged, so no footprint needs a per-cell heap allocation.
#[derive(Clone, Debug, Default)]
pub struct Row {
    entries: [(usize, f64); 16],
    length: usize,
    revision: u64,
}
impl Row {
    pub fn from_slice(entries: &[(usize, f64)]) -> Self {
        assert!(entries.len() <= 16);
        let mut row = Self::default();
        row.entries[..entries.len()].copy_from_slice(entries);
        row.length = entries.len();
        row
    }
    pub fn as_slice(&self) -> &[(usize, f64)] {
        &self.entries[..self.length]
    }
    pub fn revision(&self) -> u64 {
        self.revision
    }
    fn add(&mut self, node: usize, weight: f64) {
        if let Some(pair) = self.entries[..self.length].iter_mut().find(|p| p.0 == node) {
            pair.1 += weight;
        } else {
            self.entries[self.length] = (node, weight);
            self.length += 1;
        }
    }
}
impl std::ops::Deref for Row {
    type Target = [(usize, f64)];
    fn deref(&self) -> &Self::Target {
        self.as_slice()
    }
}
impl<'a> IntoIterator for &'a Row {
    type Item = &'a (usize, f64);
    type IntoIter = std::slice::Iter<'a, (usize, f64)>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

pub fn sites(cell: &Cell, config: &Config, field: &Field) -> Row {
    let radius = cell.radius(config) * std::f64::consts::FRAC_1_SQRT_2;
    let mut result = Row::default();
    for [dx, dy] in [[radius, 0.], [-radius, 0.], [0., radius], [0., -radius]] {
        for (node, w) in field.stencil(cell.x + dx, cell.y + dy) {
            result.add(node, w * 0.25);
        }
    }
    result.entries[..result.length].sort_unstable_by_key(|p| p.0);
    result
}
pub fn deposit_profiles(cells: &[Cell], config: &Config, field: &mut Field, sites: &[Row]) {
    field.body_signal.fill([0.; 2]);
    field.body_load.fill(0.);
    let area = field.spacing * field.spacing;
    for (cell, row) in cells.iter().zip(sites) {
        visit_row(cell, area, row, &mut |node, values| {
            for (k, value) in values[..2].iter().enumerate() {
                field.body_signal[node][k] += value;
            }
            field.body_load[node] += values[2];
        });
    }
    let _ = config;
}

fn visit_row(
    cell: &Cell,
    area: f64,
    row: &[(usize, f64)],
    visit: &mut impl FnMut(usize, [f64; 3]),
) {
    let amount = cell.mass() / area;
    let profile = cell.operators.as_ref().unwrap().profile;
    for &(node, weight) in row {
        visit(node, profile.map(|p| weight * amount * p));
    }
}

/// Observers derive current body signals; the solver cache belongs to its frozen stage.
pub fn visit_current(w: &crate::world::World, mut visit: impl FnMut(usize, [f64; 2])) {
    for cell in &w.cells {
        visit_row(
            cell,
            w.field.spacing.powi(2),
            &sites(cell, &w.config, &w.field),
            &mut |node, values| visit(node, [values[0], values[1]]),
        );
    }
}
