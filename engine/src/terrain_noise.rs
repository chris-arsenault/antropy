//! World-creation noise only. Periodic hashed lattices avoid interior repeating tiles;
//! independent octaves and a smooth coordinate warp turn them into irregular regions.
use crate::random::Random;

struct Octave {
    values: Vec<f64>,
    extent: [f64; 2],
    shape: [usize; 2],
    offset: [f64; 2],
    amplitude: f64,
}

impl Octave {
    fn new(rng: &mut Random, extent: [f64; 2], scale: f64, amplitude: f64) -> Self {
        let seed = rng.next_u64();
        let shape = extent.map(|v| (v / scale).round().max(2.) as usize);
        let values = (0..shape[0] * shape[1])
            .map(|n| {
                Random::new(
                    seed ^ ((n % shape[0]) as u64).wrapping_mul(0x9e3779b97f4a7c15)
                        ^ ((n / shape[0]) as u64).wrapping_mul(0xd1b54a32d192ed03),
                )
                .signed()
            })
            .collect();
        Self {
            values,
            extent,
            shape,
            offset: [rng.unit(), rng.unit()],
            amplitude,
        }
    }

    fn corner(&self, x: usize, y: usize) -> f64 {
        self.values[(y % self.shape[1]) * self.shape[0] + x % self.shape[0]]
    }

    fn sample(&self, point: [f64; 2]) -> f64 {
        let coordinate: [f64; 2] = std::array::from_fn(|k| {
            point[k].rem_euclid(self.extent[k]) / self.extent[k] * self.shape[k] as f64
                + self.offset[k]
        });
        let [x, y] = coordinate.map(|v| v.floor() as usize);
        // Quintic interpolation makes value, slope and curvature continuous at lattice edges.
        let [u, v] = coordinate.map(|v| {
            let t = v.fract();
            t * t * t * (t * (6. * t - 15.) + 10.)
        });
        let lerp = |a: f64, b: f64, t: f64| a + t * (b - a);
        lerp(
            lerp(self.corner(x, y), self.corner(x + 1, y), u),
            lerp(self.corner(x, y + 1), self.corner(x + 1, y + 1), u),
            v,
        )
    }
}

fn octaves(rng: &mut Random, extent: [f64; 2], largest: f64, smallest: f64) -> Vec<Octave> {
    let mut result = Vec::new();
    let (mut scale, mut amplitude) = (largest, 1.);
    loop {
        result.push(Octave::new(rng, extent, scale, amplitude));
        if scale / 2. < smallest {
            break;
        }
        scale /= 2.;
        amplitude /= 2.;
    }
    result
}

fn sample(octaves: &[Octave], point: [f64; 2]) -> f64 {
    let value: f64 = octaves.iter().map(|o| o.amplitude * o.sample(point)).sum();
    value / octaves.iter().map(|o| o.amplitude).sum::<f64>()
}

pub(crate) struct Generator {
    detail: Vec<Octave>,
    warp: [Vec<Octave>; 2],
    displacement: f64,
}

impl Generator {
    pub fn new(seed: u64, extent: [f64; 2], scale: f64, mesh: f64) -> Self {
        let mut rng = Random::new(seed ^ 0x73686164655f7879);
        let largest = (4. * scale).min(extent[0].min(extent[1]) / 2.);
        let smallest = 4. * mesh;
        Self {
            detail: octaves(&mut rng, extent, largest, smallest),
            warp: std::array::from_fn(|_| {
                octaves(&mut rng, extent, 2. * largest, (largest / 2.).max(smallest))
            }),
            displacement: largest / 2.,
        }
    }

    pub fn sample(&self, point: [f64; 2]) -> f64 {
        let warped =
            std::array::from_fn(|k| point[k] + self.displacement * sample(&self.warp[k], point));
        sample(&self.detail, warped)
    }

    pub fn coarse(mut self, minimum: f64) -> Self {
        self.detail.retain(|o| {
            (o.extent[0] / o.shape[0] as f64).min(o.extent[1] / o.shape[1] as f64) >= minimum
        });
        self
    }

    pub fn wavelengths(&self) -> Vec<[f64; 2]> {
        self.detail
            .iter()
            .map(|o| std::array::from_fn(|k| o.extent[k] / o.shape[k] as f64))
            .collect()
    }

    /// Quintic interpolation has derivative <= 1.875 and corner differences <= 2.
    /// Bound the warp Jacobian globally and retain detail resolved by at most 8x8 quadrature.
    pub fn quadrature(&mut self, mesh: f64) -> usize {
        if self.detail.is_empty() {
            return 1;
        }
        let derivative = |octaves: &[Octave]| {
            let weight: f64 = octaves.iter().map(|o| o.amplitude).sum();
            octaves
                .iter()
                .map(|o| {
                    o.amplitude
                        * 3.75
                        * (o.shape[0] as f64 / o.extent[0]).hypot(o.shape[1] as f64 / o.extent[1])
                })
                .sum::<f64>()
                / weight
        };
        let stretch =
            1. + self.displacement * derivative(&self.warp[0]).hypot(derivative(&self.warp[1]));
        loop {
            let o = self.detail.last().unwrap();
            let wavelength = (o.extent[0] / o.shape[0] as f64).min(o.extent[1] / o.shape[1] as f64);
            let steps = (4. * mesh * stretch / wavelength).ceil().max(1.) as usize;
            if steps <= 8 {
                return steps;
            }
            self.detail.pop();
            if self.detail.is_empty() {
                return 1;
            }
        }
    }

    pub fn average(
        &self,
        center: [f64; 2],
        mesh: f64,
        steps: usize,
        transform: impl Fn(f64) -> f64,
    ) -> f64 {
        if self.detail.is_empty() {
            return transform(0.);
        }
        let mut total = 0.;
        for y in 0..steps {
            for x in 0..steps {
                let p = [
                    center[0] + mesh * ((x as f64 + 0.5) / steps as f64 - 0.5),
                    center[1] + mesh * ((y as f64 + 0.5) / steps as f64 - 0.5),
                ];
                total += transform(self.sample(p));
            }
        }
        total / (steps * steps) as f64
    }
}

/// Stable named environment streams; adding a consumer cannot advance another stream.
pub(crate) fn channel(seed: u64, name: &str) -> u64 {
    let hash = name.bytes().fold(seed ^ 0x100000001b3, |h, b| {
        (h ^ b as u64).wrapping_mul(0x100000001b3)
    });
    Random::new(hash).next_u64()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unresolved_worlds_use_uniform_values_instead_of_aliasing() {
        let mut generator = Generator::new(27, [4., 4.], 32., 2.).coarse(8.);
        let steps = generator.quadrature(2.);
        assert!(generator.wavelengths().is_empty());
        assert_eq!(generator.average([1., 1.], 2., steps, |v| v), 0.);
    }

    #[test]
    fn irregular_field_wraps_in_value_and_slope_without_repeating_inner_tiles() {
        let generator = Generator::new(27, [720., 540.], 32., 2.);
        let different = Generator::new(28, [720., 540.], 32., 2.);
        let mut seed_difference = 0.;
        let mut tile_difference = 0.;
        for i in 0..40 {
            let p = [i as f64 * 17.31 - 6., i as f64 * 11.71 + 3.];
            let a = generator.sample(p);
            assert!((-1. ..=1.).contains(&a));
            for (axis, period) in [(0, 720.), (1, 540.)] {
                let mut wrapped = p;
                wrapped[axis] += period;
                assert!((generator.sample(wrapped) - a).abs() < 1e-12);
                let epsilon = 1e-4;
                let mut before = p;
                before[axis] = -epsilon;
                let mut boundary = before;
                boundary[axis] = 0.;
                let mut after = before;
                after[axis] = epsilon;
                let slope_change = generator.sample(after) - 2. * generator.sample(boundary)
                    + generator.sample(before);
                assert!(slope_change.abs() < 1e-7);
            }
            seed_difference += (a - different.sample(p)).abs();
            tile_difference += (a - generator.sample([p[0] + 128., p[1]])).abs();
        }
        assert!(seed_difference / 40. > 0.1);
        assert!(tile_difference / 40. > 0.1);
    }
}
