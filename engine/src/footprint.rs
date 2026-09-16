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
        let profile = cell.operators.as_ref().unwrap().profile;
        let amount = cell.mass() / area;
        for &(node, w) in row {
            for (k, p) in profile.iter().enumerate() {
                field.body_signal[node][k] += w * amount * p;
            }
        }
    }
    let _ = config;
}
