//! Common local external drive. Material maps and kinetic coefficients remain separate.
use crate::{chemical_products::ProductWeight, chemistry::Chemistry};

pub const DEFAULT_STRENGTH: f64 = 119.31341917861687;

pub fn coefficient(
    chemistry: &Chemistry,
    substrate: usize,
    products: &[ProductWeight],
) -> [f64; 2] {
    let from = chemistry.properties[substrate].interaction;
    std::array::from_fn(|k| {
        let delta: f64 = products
            .iter()
            .map(|p| p.weight * (chemistry.properties[p.species].interaction[k] - from[k]))
            .sum();
        delta * if k == 0 { 0.25 } else { -0.25 }
    })
}

pub fn engagement(coefficient: [f64; 2], signal: [f64; 2]) -> f64 {
    (coefficient[0] * signal[0] + coefficient[1] * signal[1]).max(0.)
}

/// [cellular yield, dissipation, external input], per accepted substrate unit.
pub fn cellular(delta: f64, supplied: f64, changed: f64, efficiency: f64) -> [f64; 3] {
    let available = delta + supplied;
    let work = if available >= 0. {
        efficiency * available
    } else {
        available / efficiency
    } - 0.05 * changed;
    [work, available - work, supplied]
}
