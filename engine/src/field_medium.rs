//! Spatial contractions of the same three feature rows for fields and finite owners.
use crate::{field::Field, medium_response};

/// Only valid between begin and the end of one immutable-field movement pass.
#[derive(Clone, Debug, Default)]
pub(crate) struct GradientCache {
    rows: Vec<[[f64; 3]; 2]>,
    valid: Vec<u64>,
    epoch: u64,
}
impl GradientCache {
    pub fn begin(&mut self, field: &Field) {
        self.rows.resize(field.nx * field.ny, [[0.; 3]; 2]);
        self.valid.resize(self.rows.len(), 0);
        self.epoch = self.epoch.wrapping_add(1);
        if self.epoch == 0 {
            self.valid.fill(0);
            self.epoch = 1;
        }
    }
    pub fn sample(&mut self, field: &Field, sites: &[(usize, f64)]) -> [[f64; 3]; 2] {
        let mut result = [[0.; 3]; 2];
        for &(node, weight) in sites {
            if self.valid[node] != self.epoch {
                self.rows[node] = field.gradient(&[(node, 1.)]);
                self.valid[node] = self.epoch;
            }
            for (out, value) in result
                .iter_mut()
                .flatten()
                .zip(self.rows[node].iter().flatten())
            {
                *out += weight * value;
            }
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frozen_gradients_match_direct_reads_and_refresh_every_carrier() {
        let mut field = Field::new(16., 16., 2.);
        let chemistry = crate::chemistry::Chemistry::new(101).unwrap();
        let mut cache = GradientCache::default();
        let sites = field.stencil(0.25, 15.75);
        for change in 0..5 {
            field.add(7, 43, 0.3, &chemistry);
            field.body_signal[6] = [change as f64, -0.3];
            field.source_signal[6] = [-0.2, change as f64];
            field.body_load[63] = change as f64;
            field.source_load[1] = change as f64;
            field.attraction_length = change as f64;
            field.prepare_attraction();
            cache.begin(&field);
            for _ in 0..2 {
                let actual = cache.sample(&field, &sites);
                let expected = field.gradient(&sites);
                for (a, b) in actual.iter().flatten().zip(expected.iter().flatten()) {
                    assert!((a - b).abs() < 1e-12);
                }
            }
        }
    }

    #[test]
    fn minimum_image_fast_path_preserves_periodicity_and_half_world_ties() {
        for width in [1., 32., 320.] {
            for i in -1000..=1000 {
                let x = i as f64 * width / 64.;
                let expected = (x + width * 0.5).rem_euclid(width) - width * 0.5;
                assert_eq!(crate::movement::delta(x, width), expected);
            }
        }
    }
}

impl Field {
    pub(crate) fn mechanical_load(&self, n: usize) -> f64 {
        self.impedance[n] + self.source_load[n] + self.body_load[n]
    }

    pub fn pressure_load(&self, sites: &[(usize, f64)]) -> f64 {
        sites
            .iter()
            .map(|&(n, w)| w * self.mechanical_load(n))
            .sum::<f64>()
            .max(0.)
    }

    pub fn gradient(&self, sites: &[(usize, f64)]) -> [[f64; 3]; 2] {
        let mut result = [[0.; 3]; 2];
        for &(n, w) in sites {
            let [r, l, d, u] = self.neighbors[n];
            for (axis, (a, b)) in [(r, l), (d, u)].into_iter().enumerate() {
                for (k, value) in result[axis][..2].iter_mut().enumerate() {
                    let mut difference = self.signal[a][k] - self.signal[b][k]
                        + self.source_signal[a][k]
                        - self.source_signal[b][k];
                    difference += self.body_signal[a][k] - self.body_signal[b][k];
                    if k == 0 {
                        difference = self.attractive(a) - self.attractive(b);
                    }
                    *value += w * difference / (2. * self.spacing);
                }
                let mut difference = self.impedance[a] + self.source_load[a]
                    - self.impedance[b]
                    - self.source_load[b];
                difference += self.body_load[a] - self.body_load[b];
                result[axis][2] += w * difference / (2. * self.spacing);
            }
        }
        result
    }

    pub(crate) fn coefficients(
        &self,
        node: usize,
        dt: f64,
        impedance: f64,
        max_impedance: f64,
    ) -> [[f32; 4]; 4] {
        self.neighbors[node].map(|other| {
            let difference = [
                self.attractive(other) - self.attractive(node),
                self.medium_signal(other)[1] - self.medium_signal(node)[1],
            ];
            let pressure = self.pressure_strength
                * medium_response::pressure_difference(
                    self.mechanical_load(node),
                    self.mechanical_load(other),
                );
            let rate = dt
                / (1.
                    + impedance
                        * (self.impedance[node]
                            + self.source_load[node]
                            + self.impedance[other]
                            + self.source_load[other])
                        / 2.);
            // |a|,|b| <= 1 and i <= max_impedance bound every species with one face contraction.
            let drift = self.drift
                / (self.spacing
                    * (1.
                        + difference[0].abs()
                        + difference[1].abs()
                        + max_impedance * pressure.abs()));
            [
                (rate / self.spacing.powi(2)) as f32,
                (rate * drift * difference[0]) as f32,
                (-rate * drift * difference[1]) as f32,
                (-rate * drift * pressure) as f32,
            ]
        })
    }
}
