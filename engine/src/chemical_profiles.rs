//! Bounded continuous interaction profiles, independent of kinetic property surfaces.
use crate::{
    chemistry::{Properties, coordinate, product},
    random::Random,
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ProfileBasis {
    pub coefficients: [[f64; 16]; 2],
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileCoverage {
    pub quadrants: [Vec<usize>; 4],
    pub minimum_eigenvalue: f64,
    pub maximum_normalized_step: f64,
}

impl ProfileCoverage {
    pub fn measure(properties: &[Properties]) -> Self {
        let mut quadrants: [Vec<usize>; 4] = std::array::from_fn(|_| Vec::new());
        let mut mean = [0.; 2];
        for (s, p) in properties.iter().enumerate() {
            let [x, y] = p.interaction;
            mean[0] += x / properties.len() as f64;
            mean[1] += y / properties.len() as f64;
            if x.abs() >= 0.25 && y.abs() >= 0.25 {
                quadrants[usize::from(x > 0.) * 2 + usize::from(y > 0.)].push(s);
            }
        }
        let (mut xx, mut xy, mut yy) = (0., 0., 0.);
        let mut maximum_normalized_step = 0_f64;
        for (s, p) in properties.iter().enumerate() {
            let [x, y] = [p.interaction[0] - mean[0], p.interaction[1] - mean[1]];
            xx += x * x / properties.len() as f64;
            xy += x * y / properties.len() as f64;
            yy += y * y / properties.len() as f64;
            for t in [product(s, 1, 0), product(s, 0, 1)] {
                for k in 0..2 {
                    maximum_normalized_step = maximum_normalized_step
                        .max((p.interaction[k] - properties[t].interaction[k]).abs() / 2.);
                }
            }
        }
        let minimum_eigenvalue = (xx + yy - (xx - yy).hypot(2. * xy)) / 2.;
        Self {
            quadrants,
            minimum_eigenvalue,
            maximum_normalized_step,
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        if !self.minimum_eigenvalue.is_finite() || self.minimum_eigenvalue < 0.05 {
            return Err("Insufficient interaction profile rank".into());
        }
        if let Some(i) = self.quadrants.iter().position(|ids| ids.len() < 8) {
            return Err(format!("Insufficient interaction profile quadrant {i}"));
        }
        if !self.maximum_normalized_step.is_finite() || self.maximum_normalized_step > 0.15 {
            return Err("Interaction profile is too steep".into());
        }
        Ok(())
    }
}

impl ProfileBasis {
    pub fn new(seed: u64) -> Self {
        // Domain-separated from chemistry's 0x43c7a921 kinetic-property stream.
        let mut rng = Random::new(seed ^ 0x71696e7465726163);
        let mut coefficients =
            std::array::from_fn(|_| std::array::from_fn(|_| rng.signed() * 0.0125));
        coefficients[0][4] += if rng.unit() < 0.5 { -1. } else { 1. };
        coefficients[1][1] += if rng.unit() < 0.5 { -1. } else { 1. };
        Self { coefficients }
    }

    /// Validated basis and finite manifold coordinates are required at the call boundary.
    pub fn evaluate(&self, point: [f64; 2]) -> [f64; 2] {
        let [x, y] = point.map(|v| v * std::f64::consts::PI / 15.);
        self.coefficients.map(|row| {
            let norm: f64 = row.iter().map(|v| v.abs()).sum();
            row.iter()
                .enumerate()
                .map(|(j, v)| (v / norm) * ((j / 4) as f64 * x).cos() * ((j % 4) as f64 * y).cos())
                .sum()
        })
    }

    pub fn validate(&self, properties: &[Properties]) -> Result<(), String> {
        for row in self.coefficients {
            let norm: f64 = row.iter().map(|v| v.abs()).sum();
            if row.iter().any(|v| !v.is_finite()) || !norm.is_finite() || norm <= 0. {
                return Err("Invalid interaction profile basis".into());
            }
        }
        for (s, p) in properties.iter().enumerate() {
            let expected = self.evaluate(coordinate(s));
            for (a, b) in p.interaction.into_iter().zip(expected) {
                if !a.is_finite() || a.abs() > 1. || (a - b).abs() > 1e-12 {
                    return Err("Interaction profile differs from coefficients".into());
                }
            }
        }
        Ok(())
    }
}
