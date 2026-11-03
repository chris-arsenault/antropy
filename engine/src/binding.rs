//! Birth-compiled competing recognition states; live consumers borrow affinity rows.
use crate::{chemistry::Affinity, config::Config, genetics::mutation, random::Random};
use serde::{Deserialize, Serialize};

pub const BIAS_BOUND: f64 = 9.;
pub const SUPPORT_FRACTION: f64 = 1e-4;

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Key {
    pub weights: [f64; 8],
    pub bias: f64,
}

impl Key {
    /// Shared founder encoding; evolving keys never round back to coordinates.
    pub fn target(point: [f64; 2]) -> Self {
        let species = point[0].round() as usize * 16 + point[1].round() as usize;
        Self {
            weights: std::array::from_fn(|j| {
                if species & (1 << (7 - j)) == 0 {
                    -1.
                } else {
                    1.
                }
            }),
            bias: -7.,
        }
    }
    pub fn score(&self, species: usize) -> f64 {
        self.weights
            .iter()
            .enumerate()
            .fold(self.bias, |e, (j, w)| {
                e + w * if species & (1 << (7 - j)) == 0 {
                    -1.
                } else {
                    1.
                }
            })
    }

    pub fn affinity(&self, species: usize, lambda: f64) -> f64 {
        self.affinity_with(species, lambda, true)
    }

    /// Conditional chemical preference factors over the complete bit alphabet.
    fn preference_partition(&self, lambda: f64) -> f64 {
        self.weights.iter().fold(0., |sum, w| {
            let z = (lambda * w).abs();
            sum + z + (-2. * z).exp().ln_1p()
        })
    }

    fn normalization(&self, lambda: f64, independent: bool) -> f64 {
        let preference = self.preference_partition(lambda);
        // Unit-magnitude weights are the domain's maximally selective reference, not
        // a separate tuning constant. This preserves the existing founder profiles.
        let reference = self.weights.len() as f64 * (lambda + (-2. * lambda).exp().ln_1p());
        let bound = lambda * self.bias + if independent { reference } else { preference };
        let log_occupied = bound.min(0.) - (-bound.abs()).exp().ln_1p();
        preference - log_occupied
    }

    pub fn affinity_with(&self, species: usize, lambda: f64, independent: bool) -> f64 {
        (lambda * (self.score(species) - self.bias) - self.normalization(lambda, independent))
            .min(0.)
            .exp()
    }

    pub fn compile(&self, lambda: f64) -> Vec<Affinity> {
        self.compile_with(lambda, true)
    }

    pub fn compile_with(&self, lambda: f64, independent: bool) -> Vec<Affinity> {
        let partition = self.normalization(lambda, independent);
        let values: [f64; 256] = std::array::from_fn(|s| {
            (lambda * (self.score(s) - self.bias) - partition)
                .min(0.)
                .exp()
        });
        let cutoff = values.iter().copied().fold(0., f64::max) * SUPPORT_FRACTION;
        values
            .into_iter()
            .enumerate()
            .filter(|(_, v)| *v > 0. && *v >= cutoff)
            .map(|(species, value)| Affinity { species, value })
            .collect()
    }

    fn validate(&self) -> Result<(), String> {
        if self.weights.iter().any(|v| !v.is_finite() || v.abs() > 1.)
            || !self.bias.is_finite()
            || self.bias.abs() > BIAS_BOUND
        {
            return Err("Invalid complementarity key".into());
        }
        Ok(())
    }

    fn mutate(&mut self, rng: &mut Random, c: &Config) -> bool {
        let weights = mutation::mutate(
            &mut self.weights,
            rng,
            c.physical_mutation_rate,
            c.physical_mutation_scale,
            -1.,
            1.,
        );
        let bias = mutation::mutate(
            [&mut self.bias],
            rng,
            c.physical_mutation_rate,
            BIAS_BOUND * c.physical_mutation_scale,
            -BIAS_BOUND,
            BIAS_BOUND,
        );
        weights || bias
    }

    /// Conditional diagnostic event, using the same law and domain as inheritance.
    pub(crate) fn mutate_locus(&mut self, locus: usize, rng: &mut Random, c: &Config) {
        let (value, bound) = if locus < 8 {
            (&mut self.weights[locus], 1.)
        } else {
            (&mut self.bias, BIAS_BOUND)
        };
        mutation::mutate(
            [value],
            rng,
            1.,
            bound * c.physical_mutation_scale,
            -bound,
            bound,
        );
    }

    fn mean(a: Self, b: Self) -> Self {
        Self {
            weights: std::array::from_fn(|j| (a.weights[j] + b.weights[j]) * 0.5),
            bias: (a.bias + b.bias) * 0.5,
        }
    }
}

/// Site order is four receptors, four transporters, eight enzymes, then membrane.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Keys {
    pub receptors: [Key; 4],
    pub transporters: [Key; 4],
    pub enzymes: [Key; crate::organism::MAX_ENZYMES],
    pub membrane: Key,
}

impl Keys {
    pub fn founders(m: &crate::genetics::Machinery) -> Self {
        Self {
            receptors: m.receptors.map(|p| Key::target(p.point())),
            transporters: m.transporters.map(|p| Key::target([p.x, p.y])),
            enzymes: m.enzymes.map(|p| Key::target([p.x, p.y])),
            membrane: Key::target(m.membrane.point()),
        }
    }
    pub fn site(&self, site: usize) -> Key {
        match site {
            0..=3 => self.receptors[site],
            4..=7 => self.transporters[site - 4],
            8..=15 => self.enzymes[site - 8],
            16 => self.membrane,
            _ => unreachable!("Unknown recognition site"),
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        for i in 0..17 {
            self.site(i).validate()?;
        }
        Ok(())
    }

    pub(crate) fn mutate(&mut self, rng: &mut Random, c: &Config) -> bool {
        let mut changed = false;
        for key in self
            .receptors
            .iter_mut()
            .chain(&mut self.transporters)
            .chain(&mut self.enzymes)
            .chain([&mut self.membrane])
        {
            changed |= key.mutate(rng, c);
        }
        changed
    }

    pub(crate) fn express(a: &Self, b: &Self) -> Self {
        Self {
            receptors: std::array::from_fn(|i| Key::mean(a.receptors[i], b.receptors[i])),
            transporters: std::array::from_fn(|i| Key::mean(a.transporters[i], b.transporters[i])),
            enzymes: std::array::from_fn(|i| Key::mean(a.enzymes[i], b.enzymes[i])),
            membrane: Key::mean(a.membrane, b.membrane),
        }
    }

    pub(crate) fn combine(a: &Self, b: &Self, mask: &[bool]) -> Self {
        Self {
            receptors: std::array::from_fn(|i| {
                if mask[i] {
                    a.receptors[i]
                } else {
                    b.receptors[i]
                }
            }),
            transporters: std::array::from_fn(|i| {
                if mask[4 + i] {
                    a.transporters[i]
                } else {
                    b.transporters[i]
                }
            }),
            enzymes: std::array::from_fn(|i| {
                if mask[8 + i % 4] {
                    a.enzymes[i]
                } else {
                    b.enzymes[i]
                }
            }),
            membrane: if mask[12] { a.membrane } else { b.membrane },
        }
    }
}
