//! Spatial contractions of the same three feature rows for fields and finite owners.
use crate::{field::Field, medium_response};

#[cfg(test)]
mod tests {
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

/// Per-node transport features: attraction, second signal axis, mechanical load and
/// medium impedance (material plus reservoir load).
pub(crate) type Features = [f64; 4];

impl Field {
    pub(crate) fn mechanical_load(&self, n: usize) -> f64 {
        let carried = self.carriers.site(n);
        self.impedance_at(n) + carried.load[1] + carried.load[0]
    }

    /// Features of node `n` given its already-read material projection.
    pub(crate) fn features(&self, n: usize, p: &crate::spatial_material::Projection) -> Features {
        let area = self.spacing * self.spacing;
        let carried = self.carriers.site(n);
        let impedance = p[2] / area + carried.load[1];
        [
            self.attractive(n),
            p[5] / area + carried.signal[0][1] + carried.signal[1][1],
            impedance + carried.load[0],
            impedance,
        ]
    }

    fn features_at(&self, n: usize) -> Features {
        self.features(n, &self.amounts.projection(n))
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
                let (a, b) = (self.features_at(a), self.features_at(b));
                for (k, value) in result[axis].iter_mut().enumerate() {
                    *value += w * (a[k] - b[k]) / (2. * self.spacing);
                }
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
        let center = self.features_at(node);
        let adjacent = self.neighbors[node].map(|other| self.features_at(other));
        self.face_coefficients(center, adjacent, dt, impedance, max_impedance)
    }

    /// Face transport coefficients from features read once for a node and its neighbors.
    pub(crate) fn face_coefficients(
        &self,
        center: Features,
        adjacent: [Features; 4],
        dt: f64,
        impedance: f64,
        max_impedance: f64,
    ) -> [[f32; 4]; 4] {
        adjacent.map(|other| {
            let difference = [other[0] - center[0], other[1] - center[1]];
            let pressure =
                self.pressure_strength * medium_response::pressure_difference(center[2], other[2]);
            let rate = dt / (1. + impedance * (center[3] + other[3]) / 2.);
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
