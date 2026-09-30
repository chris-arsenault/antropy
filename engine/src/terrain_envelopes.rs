//! Boot-only normalized resource envelopes on the existing periodic fractal substrate.
use crate::{
    config::Config,
    random::Random,
    terrain::{
        generation::{Band, map},
        noise::channel,
    },
};

struct Deformation {
    values: Vec<[f64; 2]>,
    nx: usize,
    ny: usize,
    mesh: f64,
    amplitude: f64,
}

impl Deformation {
    fn new(seed: u64, c: &Config) -> Self {
        let x = map(seed, "resource-warp-x", c, Band::Resource, |v| v);
        let y = map(seed, "resource-warp-y", c, Band::Resource, |v| v);
        let mut result = Self {
            values: x.into_iter().zip(y).map(|(x, y)| [x, y]).collect(),
            nx: (c.width / c.mesh) as usize,
            ny: (c.height / c.mesh) as usize,
            mesh: c.mesh,
            amplitude: 0.,
        };
        let bound = result.derivative_bound();
        result.amplitude = (c.landscape_spread / (2. * std::f64::consts::SQRT_2)).min(0.5 / bound);
        result
    }

    /// Bilinear derivatives interpolate edge differences. Their component maxima
    /// give a global Frobenius bound, which also bounds the operator norm.
    fn derivative_bound(&self) -> f64 {
        let mut bounds = [0_f64; 4];
        for (n, v) in self.values.iter().enumerate() {
            let neighbors = [
                n / self.nx * self.nx + (n % self.nx + 1) % self.nx,
                (n + self.nx) % self.values.len(),
            ];
            for (axis, j) in neighbors.into_iter().enumerate() {
                for k in 0..2 {
                    bounds[2 * axis + k] =
                        bounds[2 * axis + k].max((self.values[j][k] - v[k]).abs() / self.mesh);
                }
            }
        }
        bounds.iter().map(|v| v * v).sum::<f64>().sqrt()
    }

    fn sample(&self, p: [f64; 2]) -> [f64; 2] {
        let x = (p[0] / self.mesh - 0.5).rem_euclid(self.nx as f64);
        let y = (p[1] / self.mesh - 0.5).rem_euclid(self.ny as f64);
        let mut result = [0.; 2];
        for (dy, wy) in [(0, 1. - y.fract()), (1, y.fract())] {
            for (dx, wx) in [(0, 1. - x.fract()), (1, x.fract())] {
                let n = ((y as usize + dy) % self.ny) * self.nx + (x as usize + dx) % self.nx;
                for (k, value) in result.iter_mut().enumerate() {
                    *value += wx * wy * self.values[n][k];
                }
            }
        }
        result
    }
}

fn envelope(
    p: [f64; 2],
    center: [f64; 2],
    offset: [f64; 2],
    warp: &Deformation,
    c: &Config,
) -> f64 {
    let v = warp.sample(p);
    let squared: f64 = [c.width, c.height]
        .into_iter()
        .enumerate()
        .map(|(k, period)| {
            let d = (p[k] - center[k] + warp.amplitude * (v[k] - offset[k]) + period / 2.)
                .rem_euclid(period)
                - period / 2.;
            (d / c.landscape_spread).powi(2)
        })
        .sum();
    (1. + squared).powi(-2)
}

fn integrate(center: [f64; 2], warp: &Deformation, c: &Config, output: &mut [f64]) {
    let offset = warp.sample(center);
    // Four samples per axis at boot integrate the smooth envelope and bilinear warp.
    // This does not change physical mesh resolution or add any per-tick work.
    for (n, value) in output.iter_mut().enumerate() {
        *value = 0.;
        for y in 0..4 {
            for x in 0..4 {
                let p = [
                    (n % warp.nx) as f64 * c.mesh + c.mesh * (x as f64 + 0.5) / 4.,
                    (n / warp.nx) as f64 * c.mesh + c.mesh * (y as f64 + 0.5) / 4.,
                ];
                *value += envelope(p, center, offset, warp, c) / 16.;
            }
        }
    }
}

pub(super) fn density(seed: u64, c: &Config) -> Vec<f64> {
    let nodes = (c.width / c.mesh) as usize * (c.height / c.mesh) as usize;
    let mut density = vec![0.; nodes];
    if c.source_count == 0 {
        return density;
    }
    let warp = Deformation::new(seed, c);
    let mut envelope = vec![0.; nodes];
    let mut total = 0.;
    for (center, weight) in centers(seed, c) {
        integrate(center, &warp, c, &mut envelope);
        let normalization = envelope.iter().sum::<f64>() * c.mesh.powi(2);
        for (sum, value) in density.iter_mut().zip(&envelope) {
            *sum += weight * value / normalization;
        }
        total += weight;
    }
    for value in &mut density {
        *value /= total;
    }
    density
}

/// Reconstructible boot provenance for local map diagnostics only.
pub fn centers(seed: u64, c: &Config) -> Vec<([f64; 2], f64)> {
    let mut positions = Random::new(channel(seed, "resource-centers"));
    let mut weights = Random::new(channel(seed, "resource-weights"));
    (0..c.landscape_region_count())
        .map(|_| {
            (
                [positions.unit() * c.width, positions.unit() * c.height],
                0.2 + 4. * weights.unit().powi(2),
            )
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deformation_is_periodic_fixes_centers_and_cannot_fold() {
        let c = Config {
            width: 64.,
            height: 48.,
            ..Config::default()
        };
        let warp = Deformation::new(27, &c);
        assert!(warp.amplitude * warp.derivative_bound() <= 0.5 + 1e-12);
        assert!(warp.amplitude * std::f64::consts::SQRT_2 <= c.landscape_spread / 2.);
        let center = [12.3, 24.7];
        assert_eq!(envelope(center, center, warp.sample(center), &warp, &c), 1.);
        let p = [3.2, 7.1];
        let shifted = [p[0] + c.width, p[1] - c.height];
        assert!(
            (envelope(p, center, warp.sample(center), &warp, &c)
                - envelope(shifted, center, warp.sample(center), &warp, &c))
            .abs()
                < 1e-12
        );
    }

    #[test]
    fn each_envelope_normalizes_and_the_undeformed_limit_keeps_the_radial_tail() {
        let c = Config {
            width: 64.,
            height: 48.,
            ..Config::default()
        };
        let mut warp = Deformation::new(27, &c);
        warp.values.fill([0., 0.]);
        let center = [20., 20.];
        for r in [0., 9., 18.] {
            let p = [20. + r, 20.];
            assert!(
                (envelope(p, center, [0., 0.], &warp, &c) - (1. + (r / 18.).powi(2)).powi(-2))
                    .abs()
                    < 1e-12
            );
        }
        let p = density(27, &c);
        assert!(p.iter().all(|v| v.is_finite() && *v > 0.));
        assert!((p.iter().sum::<f64>() * c.mesh.powi(2) - 1.).abs() < 1e-12);
    }
}
