//! Constitutive response on shared signed features and positive impedance load.
use crate::chemistry::Properties;
pub const DEFAULT_PRESSURE_STRENGTH: f64 = 0.003;

/// Exact sampled self-load from the same normalized deposition footprint.
pub fn self_load(projected: f64, area: f64, sites: &[(usize, f64)]) -> f64 {
    projected / area * sites.iter().map(|(_, w)| w * w).sum::<f64>()
}

pub fn profile(p: &Properties) -> [f64; 3] {
    [p.interaction[0], p.interaction[1], p.impedance]
}

/// Exact face difference of P(L) = L²/2; reversal negates the result.
pub fn pressure_difference(left: f64, right: f64) -> f64 {
    0.5 * (left + right) * (right - left)
}

/// Apply the scalar pressure slope at the owner's resolved footprint scale.
pub fn force(profile: [f64; 3], gradient: [[f64; 3]; 2], load: f64) -> [f64; 2] {
    gradient.map(|g| profile[0] * g[0] - profile[1] * g[1] - profile[2] * load * g[2])
}
