//! Canonical geographic shade. Generation never reads organisms or reservoir placement.
use crate::config::Config;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[path = "terrain_noise.rs"]
mod noise;

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct Shade {
    pub transmission: Vec<f64>,
    /// Empty means unrestricted; otherwise one nonnegative light ceiling per node.
    pub ceiling: Vec<f64>,
}

impl Shade {
    pub fn generate(seed: u64, c: &Config, nx: usize, ny: usize) -> Arc<Self> {
        let generator = noise::Generator::new(seed, [c.width, c.height], c.shade_scale, c.mesh);
        let transmission = (0..nx * ny)
            .map(|node| {
                let x = (node % nx) as f64 + 0.5;
                let y = (node / nx) as f64 + 0.5;
                let signal = generator.sample([x * c.width / nx as f64, y * c.height / ny as f64]);
                1. - c.shade_strength * (0.5 + 0.5 * signal).powi(2)
            })
            .collect();
        Arc::new(Self {
            transmission,
            ceiling: Vec::new(),
        })
    }

    pub fn apply(&self, node: usize, sun: f64) -> f64 {
        (sun * self.transmission.get(node).copied().unwrap_or(1.))
            .min(self.ceiling.get(node).copied().unwrap_or(f64::INFINITY))
    }

    pub fn validate(&self, nodes: usize) -> Result<(), String> {
        if self.transmission.len() != nodes
            || self
                .transmission
                .iter()
                .any(|v| !v.is_finite() || !(0. ..=1.).contains(v))
            || (!self.ceiling.is_empty() && self.ceiling.len() != nodes)
            || self.ceiling.iter().any(|v| !v.is_finite() || *v < 0.)
        {
            return Err("Invalid geographic shade".into());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn shade_is_bounded_static_and_clipping_precedes_averaging() {
        let c = Config::default();
        let a = Shade::generate(27, &c, 360, 270);
        let b = Shade::generate(27, &c, 360, 270);
        assert_eq!(a.transmission, b.transmission);
        assert!(
            a.transmission
                .iter()
                .all(|v| *v >= 1. - c.shade_strength && *v <= 1.)
        );
        let shade = Shade {
            transmission: vec![0.5, 1.],
            ceiling: vec![0.3, 0.8],
        };
        let mut light = crate::illumination::Illumination::default();
        light.shade = Arc::new(shade);
        assert!((light.sample(&[(0, 0.5), (1, 0.5)]) - 0.55).abs() < 1e-12);
    }

    #[test]
    fn canonical_shade_survives_checkpoint_and_observation() {
        let c = Config {
            width: 24.,
            height: 24.,
            founders: 0,
            source_count: 0,
            illumination_contrast: 0.,
            ..Config::default()
        };
        let mut world = crate::world::World::new(27, c).unwrap();
        let shade = Arc::make_mut(&mut world.shade);
        shade.transmission.fill(0.25);
        shade.ceiling = vec![0.1; 144];
        let before = world.snapshot().unwrap();
        assert!((crate::illumination::at(&world, 0., 0.) - 0.1).abs() < 1e-12);
        assert!((crate::illumination::at(&world, 24., 24.) - 0.1).abs() < 1e-12);
        assert_eq!(before, world.snapshot().unwrap());
        let restored = crate::world::World::restore(&before).unwrap();
        assert_eq!(restored.shade.transmission, world.shade.transmission);
        assert_eq!(restored.shade.ceiling, world.shade.ceiling);
        assert!((restored.field.illumination.node(0) - 0.1).abs() < 1e-12);
    }
}
