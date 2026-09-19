//! Spatial contractions of the same three feature rows for fields and finite owners.
use crate::{field::Field, medium_response};

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
