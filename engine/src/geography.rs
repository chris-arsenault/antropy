//! Immutable physical geography shared with the existing optical substrate owner.
use crate::{config::Config, terrain_config::TerrainConfig};
use serde::{Deserialize, Serialize};
#[cfg(test)]
#[path = "geography_tests.rs"]
mod tests;

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct Geography {
    pub height: Vec<f64>,
    pub conductance: Vec<f64>,
    pub seasons: Vec<[f64; 2]>,
    pub phase: f64,
    pub seed: u64,
    pub generator_version: u32,
    /// Full-detail and seasonal retained wavelengths, with quadrature samples per axis.
    pub sampling: [(usize, Vec<[f64; 2]>); 2],
    pub nx: usize,
    pub ny: usize,
    pub spacing: f64,
    pub config: TerrainConfig,
    #[serde(skip)]
    pub faces: Vec<[[f32; 2]; 4]>,
}
impl Geography {
    pub fn sample(&self, p: [f64; 2]) -> [f64; 4] {
        if self.height.is_empty() {
            return [0., 1., 0., 0.];
        }
        let x = (p[0] / self.spacing - 0.5).rem_euclid(self.nx as f64);
        let y = (p[1] / self.spacing - 0.5).rem_euclid(self.ny as f64);
        let mut result = [0.; 4];
        for (dy, wy) in [(0, 1. - y.fract()), (1, y.fract())] {
            for (dx, wx) in [(0, 1. - x.fract()), (1, x.fract())] {
                let n = ((y as usize + dy) % self.ny) * self.nx + (x as usize + dx) % self.nx;
                let values = [
                    self.height[n],
                    self.conductance[n],
                    self.seasons[n][0],
                    self.seasons[n][1],
                ];
                for k in 0..4 {
                    result[k] += wx * wy * values[k];
                }
            }
        }
        result
    }
    fn mobility(&self, a: [f64; 4], b: [f64; 4], distance: f64, conductance: bool) -> f64 {
        let q = if conductance {
            2. * a[1] * b[1] / (a[1] + b[1])
        } else {
            1.
        };
        let uphill = if self.config.elevation {
            self.config.slope_resistance * ((b[0] - a[0]) / distance).max(0.)
        } else {
            0.
        };
        q / (1. + uphill)
    }
    pub fn movement(&self, p: [f64; 2], d: [f64; 2]) -> f64 {
        let length = d[0].hypot(d[1]);
        if self.height.is_empty() || (!self.config.movement && !self.config.elevation) {
            return 1.;
        }
        if length == 0. {
            return if self.config.movement {
                self.sample(p)[1]
            } else {
                1.
            };
        }
        let steps = (length / self.spacing).ceil().max(1.) as usize;
        let mut previous = self.sample(p);
        let mut resistance = 0.;
        for i in 1..=steps {
            let fraction = i as f64 / steps as f64;
            let next = self.sample([p[0] + d[0] * fraction, p[1] + d[1] * fraction]);
            resistance +=
                1. / self.mobility(previous, next, length / steps as f64, self.config.movement);
            previous = next;
        }
        steps as f64 / resistance
    }
    /// Solve d = sqrt(m(d)) motor + m(d) passive, so the resistance follows the
    /// resulting path. The scalar bracket also resolves a directional stall without
    /// dividing by a cancelled displacement or crediting additional motor work.
    pub fn combined_motion(
        &self,
        p: [f64; 2],
        motor: [f64; 2],
        passive: [f64; 2],
    ) -> ([f64; 2], f64) {
        let displacement = |x: f64| [0, 1].map(|k| x * motor[k] + x * x * passive[k]);
        let mut x = self.movement(p, displacement(1.)).sqrt();
        let (mut lo, mut hi) = (0., 1.);
        // A 2^-32 bracket is tighter than the engine's physical spatial resolution.
        // Uniform terrain and neutral operators converge on the first evaluation.
        for _ in 0..32 {
            let m = self.movement(p, displacement(x));
            if (x * x - m).abs() <= f64::EPSILON * 8. {
                break;
            }
            if x * x > m {
                hi = x;
            } else {
                lo = x;
            }
            x = (lo + hi) / 2.;
        }
        (displacement(x), x)
    }
    pub fn processing(&self, sites: &[(usize, f64)]) -> f64 {
        if !self.config.processing || self.conductance.is_empty() {
            return 1.;
        }
        sites.iter().map(|&(n, w)| w * self.conductance[n]).sum()
    }
    pub fn processing_node(&self, n: usize) -> f64 {
        if self.config.processing {
            self.conductance.get(n).copied().unwrap_or(1.)
        } else {
            1.
        }
    }
    pub fn season(&self, p: [f64; 2], time: f64) -> f64 {
        if !self.config.seasons {
            return 1.;
        }
        let s = self.sample(p);
        let (sin, cos) =
            (std::f64::consts::TAU * time / self.config.season_period + self.phase).sin_cos();
        (1. + s[2] * cos - s[3] * sin).clamp(0., 2.)
    }
    /// Analytic time integral at the step midpoint position; bounded spatial quadrature.
    pub fn supply_time(&self, p: [f64; 2], time: f64, dt: f64) -> f64 {
        if !self.config.seasons {
            return dt;
        }
        let s = self.sample(p);
        let omega = std::f64::consts::TAU / self.config.season_period;
        let angle = omega * (time + dt / 2.) + self.phase;
        let half = omega * dt / 2.;
        let sinc = if half.abs() < 1e-8 {
            1.
        } else {
            half.sin() / half
        };
        (dt * (1. + sinc * (s[2] * angle.cos() - s[3] * angle.sin()))).clamp(0., 2. * dt)
    }
    pub fn rebuild(&mut self) {
        self.faces.clear();
        if self.height.is_empty() || (!self.config.transport && !self.config.elevation) {
            return;
        }
        self.faces = (0..self.height.len())
            .map(|n| {
                let (x, y) = (n % self.nx, n / self.nx);
                let neighbors = [
                    y * self.nx + (x + 1) % self.nx,
                    y * self.nx + (x + self.nx - 1) % self.nx,
                    (y + 1) % self.ny * self.nx + x,
                    (y + self.ny - 1) % self.ny * self.nx + x,
                ];
                neighbors.map(|j| {
                    let a = [self.height[n], self.conductance[n], 0., 0.];
                    let b = [self.height[j], self.conductance[j], 0., 0.];
                    [
                        self.mobility(a, b, self.spacing, self.config.transport) as f32,
                        self.mobility(b, a, self.spacing, self.config.transport) as f32,
                    ]
                })
            })
            .collect();
    }
    pub fn validate(&self, c: &Config) -> Result<(), String> {
        self.config.validate()?;
        if self.config != c.terrain
            || self.nx != (c.width / c.mesh) as usize
            || self.ny != (c.height / c.mesh) as usize
            || self.spacing != c.mesh
            || self.generator_version != 1
            || !self.phase.is_finite()
            || self.sampling.iter().any(|(steps, scales)| {
                !(1..=8).contains(steps)
                    || scales
                        .iter()
                        .flatten()
                        .any(|s| !s.is_finite() || *s < 4. * c.mesh)
            })
        {
            return Err("Geography and world configuration disagree".into());
        }
        if self.height.is_empty()
            && self.conductance.is_empty()
            && self.seasons.is_empty()
            && !self.config.elevation
            && !self.config.movement
            && !self.config.transport
            && !self.config.processing
            && !self.config.seasons
        {
            return Ok(());
        }
        let n = (c.width / c.mesh) as usize * (c.height / c.mesh) as usize;
        if self.nx != (c.width / c.mesh) as usize
            || self.ny != (c.height / c.mesh) as usize
            || self.spacing != c.mesh
            || self.height.len() != n
            || self.conductance.len() != n
            || self.seasons.len() != n
            || self.height.iter().any(|v| !v.is_finite())
            || self
                .conductance
                .iter()
                .any(|v| !v.is_finite() || *v <= 0. || *v > 1.)
            || self
                .seasons
                .iter()
                .any(|s| !s[0].is_finite() || !s[1].is_finite() || s[0].hypot(s[1]) > 1. + 1e-12)
            || !self.phase.is_finite()
            || self.generator_version != 1
        {
            return Err("Invalid canonical geography".into());
        }
        Ok(())
    }
}
