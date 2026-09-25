//! World-creation noise only. Periodic hashed lattices avoid interior repeating tiles;
//! independent octaves and a smooth coordinate warp turn them into irregular regions.
use crate::random::Random;

struct Octave {
    seed: u64,
    extent: [f64; 2],
    shape: [usize; 2],
    offset: [f64; 2],
    amplitude: f64,
}

impl Octave {
    fn new(rng: &mut Random, extent: [f64; 2], scale: f64, amplitude: f64) -> Self {
        Self {
            seed: rng.next_u64(),
            extent,
            shape: extent.map(|v| (v / scale).round().max(2.) as usize),
            offset: [rng.unit(), rng.unit()],
            amplitude,
        }
    }

    fn corner(&self, x: usize, y: usize) -> f64 {
        let x = (x % self.shape[0]) as u64;
        let y = (y % self.shape[1]) as u64;
        Random::new(
            self.seed ^ x.wrapping_mul(0x9e3779b97f4a7c15) ^ y.wrapping_mul(0xd1b54a32d192ed03),
        )
        .signed()
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

pub(super) struct Generator {
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
}

#[cfg(test)]
mod tests {
    use super::*;

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
