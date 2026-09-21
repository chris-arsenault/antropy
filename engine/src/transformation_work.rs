//! Common local external drive. Material maps and kinetic coefficients remain separate.
use crate::{chemical_products::ProductWeight, chemistry::Chemistry};
use std::borrow::Borrow;

pub const DEFAULT_STRENGTH: f64 = 119.31341917861687;

pub fn kinetic(distance_squared: f64, radius: f64) -> f64 {
    1. / (1. + distance_squared / radius.powi(2))
}

pub fn coefficient<P: Borrow<ProductWeight>>(
    chemistry: &Chemistry,
    substrate: usize,
    products: impl IntoIterator<Item = P>,
) -> [f64; 2] {
    let from = chemistry.properties[substrate].interaction;
    let mut delta = [0.; 2];
    for p in products {
        let p = p.borrow();
        for k in 0..2 {
            delta[k] += p.weight * (chemistry.properties[p.species].interaction[k] - from[k]);
        }
    }
    [delta[0] * 0.25, delta[1] * -0.25]
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
