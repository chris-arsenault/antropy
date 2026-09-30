use super::{
    Shade,
    noise::{Generator, channel},
};
use crate::{config::Config, geography::Geography, random::Random};

fn generator(seed: u64, name: &str, c: &Config, coarse: bool) -> Generator {
    let largest = (4. * c.shade_scale).min(c.width.min(c.height) / 2.);
    let minimum = if coarse {
        (largest / 4.).max(4. * c.mesh)
    } else {
        4. * c.mesh
    };
    Generator::new(
        channel(seed, name),
        [c.width, c.height],
        c.shade_scale,
        c.mesh,
    )
    .coarse(minimum)
}

pub(crate) fn map(
    seed: u64,
    name: &str,
    c: &Config,
    coarse: bool,
    transform: impl Fn(f64) -> f64,
) -> Vec<f64> {
    let nx = (c.width / c.mesh) as usize;
    let ny = (c.height / c.mesh) as usize;
    let mut generator = generator(seed, name, c, coarse);
    let steps = generator.quadrature(c.mesh);
    (0..nx * ny)
        .map(|n| {
            generator.average(
                [
                    (n % nx) as f64 * c.mesh + c.mesh / 2.,
                    (n / nx) as f64 * c.mesh + c.mesh / 2.,
                ],
                c.mesh,
                steps,
                &transform,
            )
        })
        .collect()
}

pub fn generate(seed: u64, c: &Config, nx: usize, ny: usize) -> Shade {
    let t = &c.terrain;
    let enabled = t.elevation || t.movement || t.transport || t.processing || t.seasons;
    let mut geography = Geography {
        nx,
        ny,
        spacing: c.mesh,
        config: t.clone(),
        seed,
        generator_version: 1,
        // Sampling depends on geometry and analytic bounds, not random values.
        sampling: [false, true].map(|coarse| {
            let mut g = generator(seed, "sampling", c, coarse);
            let steps = g.quadrature(c.mesh);
            (steps, g.wavelengths())
        }),
        phase: Random::new(channel(seed, "season-phase")).unit() * std::f64::consts::TAU,
        ..Default::default()
    };
    if enabled {
        geography.height = map(seed, "height", c, false, |v| c.shade_scale * v);
        geography.conductance = map(seed, "conductance", c, false, |v| {
            (t.minimum_conductance.ln() * (v + 1.) / 2.).exp()
        });
        let cos = map(seed, "season-cos", c, true, |v| {
            t.season_amplitude * v / std::f64::consts::SQRT_2
        });
        let sin = map(seed, "season-sin", c, true, |v| {
            t.season_amplitude * v / std::f64::consts::SQRT_2
        });
        geography.seasons = cos.into_iter().zip(sin).map(|(c, s)| [c, s]).collect();
        geography.rebuild();
    }
    let cover = map(seed, "cover", c, false, |v| ((v + 1.) / 2.).powi(2));
    Shade {
        transmission: cover
            .iter()
            .map(|v| {
                if t.transmission {
                    1. - c.shade_strength * v
                } else {
                    1.
                }
            })
            .collect(),
        ceiling: if t.ceiling {
            cover
                .iter()
                .map(|v| t.ceiling_min + (t.ceiling_max - t.ceiling_min) * (1. - v))
                .collect()
        } else {
            vec![]
        },
        geography,
    }
}
