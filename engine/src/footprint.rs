//! Normalized finite body quadrature composed with the geographic interpolation matrix.
use crate::{config::Config, field::Field, organism::Cell};
pub fn sites(cell: &Cell, config: &Config, field: &Field) -> Vec<(usize, f64)> {
    let radius = cell.radius(config) * std::f64::consts::FRAC_1_SQRT_2;
    let mut result: Vec<(usize, f64)> = Vec::with_capacity(16);
    for [dx, dy] in [[radius, 0.], [-radius, 0.], [0., radius], [0., -radius]] {
        for (node, w) in field.stencil(cell.x + dx, cell.y + dy) {
            if let Some(pair) = result.iter_mut().find(|p| p.0 == node) {
                pair.1 += w * 0.25;
            } else {
                result.push((node, w * 0.25));
            }
        }
    }
    result.sort_unstable_by_key(|p| p.0);
    result
}
pub fn deposit_profiles(
    cells: &[Cell],
    config: &Config,
    field: &mut Field,
    sites: &[Vec<(usize, f64)>],
) {
    field.body_signal.fill([0.; 2]);
    let area = field.spacing * field.spacing;
    for (cell, row) in cells.iter().zip(sites) {
        visit_row(cell, area, row, &mut |node, values| {
            for (k, value) in values.into_iter().enumerate() {
                field.body_signal[node][k] += value;
            }
        });
    }
    let _ = config;
}

fn visit_row(
    cell: &Cell,
    area: f64,
    row: &[(usize, f64)],
    visit: &mut impl FnMut(usize, [f64; 2]),
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
            &mut visit,
        );
    }
}
