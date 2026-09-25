//! Separable periodic external drive, locally sampled by funded photoreceptors.
use crate::{config::Config, random::Random};
use std::f64::consts::TAU;

#[derive(Clone, Debug, Default)]
pub struct Illumination {
    pub shade: std::sync::Arc<crate::terrain::Shade>,
    pub cover: std::sync::Arc<std::collections::BTreeMap<usize, f64>>,
    pub film: bool,
    pub emission: std::sync::Arc<crate::optics::Plane>,
    geometry: (usize, usize),
    basis: [Vec<[f64; 2]>; 2],
    rotated: [Vec<[f64; 2]>; 2],
    key: Option<(u64, u64, [f64; 4])>,
    modulation: [f64; 2],
    contrast: f64,
}

pub fn phases(seed: u64, seconds: f64, periods: [f64; 3]) -> [f64; 3] {
    let mut rng = Random::new(seed ^ 0x6c696768745f7068);
    periods.map(|period| TAU * (rng.unit() + seconds.rem_euclid(period) / period))
}

fn circle(angle: f64) -> [f64; 2] {
    let (sin, cos) = angle.sin_cos();
    [cos, sin]
}

fn subtract([a, b]: [f64; 2], [c, d]: [f64; 2]) -> [f64; 2] {
    [a * c + b * d, b * c - a * d]
}

pub fn response(x: [f64; 2], y: [f64; 2], modulation: [f64; 2], contrast: f64) -> f64 {
    // Composed rotations supply one optical intensity, independent of the chemical basis.
    1. + contrast * 0.5 * (x[0] * subtract(y, modulation)[0] + y[0] * subtract(x, modulation)[0])
}

impl Illumination {
    pub fn prepare(&mut self, seed: u64, tick: u64, c: &Config, nx: usize, ny: usize) {
        self.contrast = c.illumination_contrast;
        if self.contrast == 0. {
            self.key = None;
            return;
        }
        let periods = [
            c.illumination_fast_period,
            c.illumination_slow_period,
            c.illumination_modulation_period,
        ];
        let key = (seed, tick, [c.dt, periods[0], periods[1], periods[2]]);
        if self.geometry != (nx, ny) {
            self.geometry = (nx, ny);
            self.basis = [nx, ny].map(|size| {
                (0..size)
                    .map(|j| circle(TAU * (j as f64 + 0.5) / size as f64))
                    .collect()
            });
            self.rotated = [vec![[0.; 2]; nx], vec![[0.; 2]; ny]];
            self.key = None;
        }
        if self.key == Some(key) {
            return;
        }
        self.key = Some(key);
        let phase = phases(seed, tick as f64 * c.dt, periods).map(circle);
        for (axis, &angle) in phase[..2].iter().enumerate() {
            for (out, &basis) in self.rotated[axis].iter_mut().zip(&self.basis[axis]) {
                *out = subtract(basis, angle);
            }
        }
        self.modulation = phase[2];
    }

    pub fn sun(&self, node: usize) -> f64 {
        if self.contrast == 0. {
            return 1.;
        }
        response(
            self.rotated[0][node % self.geometry.0],
            self.rotated[1][node / self.geometry.0],
            self.modulation,
            self.contrast,
        )
    }

    pub fn solar(&self, node: usize) -> f64 {
        let tau = self.cover.get(&node).copied().unwrap_or(0.);
        let transmission = if self.film && tau > 0. {
            -(-tau).exp_m1() / tau
        } else {
            (-tau).exp()
        };
        self.shade.apply(node, self.sun(node)) * transmission
    }

    pub fn node(&self, node: usize) -> f64 {
        self.solar(node) + self.emission.get(&node).copied().unwrap_or(0.)
    }

    pub fn sample(&self, sites: &[(usize, f64)]) -> f64 {
        let mut value = 0.;
        for &(node, weight) in sites {
            value += weight * self.node(node);
        }
        value
    }
}

pub fn drive(signal: [f64; 2], light: f64) -> [f64; 2] {
    signal.map(|value| light * value)
}

/// Bounded on-demand inspection; never refresh the frozen physical cache for an observer.
pub fn at(w: &crate::world::World, x: f64, y: f64) -> f64 {
    let mut light = observer(w);
    light.prepare(w.seed, w.tick, &w.config, w.field.nx, w.field.ny);
    light.sample(&w.field.stencil(x, y))
}

/// Center-footprint optical breakdown, distinct from the body's directional receptors.
pub fn inspect(w: &crate::world::World, cell: &crate::organism::Cell) -> serde_json::Value {
    let mut light = observer(w);
    light.prepare(w.seed, w.tick, &w.config, w.field.nx, w.field.ny);
    let mut values = [0.; 4];
    for (n, a) in w.field.stencil(cell.x, cell.y) {
        values[0] += a * light.solar(n);
        values[1] += a * light.emission.get(&n).copied().unwrap_or(0.);
        values[2] += a * w.shade.transmission[n];
        values[3] += a * (-light.cover.get(&n).copied().unwrap_or(0.)).exp();
    }
    serde_json::json!({"solar":values[0],"emitted":values[1],
        "terrainTransmission":values[2],"coverTransmission":values[3],
        "paidPower":w.incident.emitters.get(&cell.id).copied().unwrap_or(0.)})
}

fn observer(w: &crate::world::World) -> Illumination {
    Illumination {
        shade: w.shade.clone(),
        cover: w.field.illumination.cover.clone(),
        emission: w.incident.lateral.clone(),
        ..Default::default()
    }
}
