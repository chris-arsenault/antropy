use crate::chemical_profiles::{ProfileBasis, ProfileCoverage};
use crate::random::Random;
use serde::{Deserialize, Serialize};

pub const SPECIES: usize = 256;
pub const RANGES: [(f64, f64); 4] = [(0.5, 8.), (0.005, 0.5), (0., 12.), (0., 1.)];
pub fn coordinate(s: usize) -> [f64; 2] {
    [(s / 16) as f64, (s % 16) as f64]
}
pub fn distance_squared(a: [f64; 2], b: [f64; 2]) -> f64 {
    (a[0] - b[0]).powi(2) + (a[1] - b[1]).powi(2)
}
pub fn reflect(x: f64) -> f64 {
    let t = x.rem_euclid(30.);
    if t > 15. { 30. - t } else { t }
}
pub fn product(s: usize, dx: i8, dy: i8) -> usize {
    let p = coordinate(s);
    reflect(p[0] + dx as f64) as usize * 16 + reflect(p[1] + dy as f64) as usize
}
pub fn affinity(target: [f64; 2], s: usize, radius: f64) -> f64 {
    let p = coordinate(s);
    let z = (1. - distance_squared(p, target) / radius.powi(2)).max(0.);
    z * z
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Properties {
    pub potential: f64,
    pub diffusion: f64,
    pub impedance: f64,
    pub stress: f64,
    pub interaction: [f64; 2],
}

impl Properties {
    fn coverage_matches(&self) -> [bool; 10] {
        let p = self;
        [
            p.potential <= 2.,
            p.potential >= 6.5,
            p.diffusion <= 0.0126,
            p.diffusion >= 0.199,
            p.stress >= 0.8,
            p.impedance >= 9.6 && p.diffusion <= 0.0126,
            p.stress <= 0.2 && p.impedance <= 2.4,
            p.impedance <= 2.4 && p.diffusion <= 0.0126,
            p.impedance >= 9.6 && p.diffusion >= 0.199,
            p.impedance <= 2.4 && p.diffusion >= 0.199,
        ]
    }
}

pub const COVERAGE_NAMES: [&str; 10] = [
    "lowPotential",
    "highPotential",
    "slowDiffusion",
    "fastDiffusion",
    "highStress",
    "highResistanceSlowDiffusion",
    "lowStressLowResistance",
    "lowResistanceSlowDiffusion",
    "highResistanceFastDiffusion",
    "lowResistanceFastDiffusion",
];

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PhysicalCoverage {
    pub witnesses: [Vec<usize>; 10],
    pub affinity_weighted_barriers: Vec<usize>,
    pub largest_barrier_component: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Chemistry {
    pub version: u32,
    pub seed: u64,
    pub coefficients: Vec<Vec<f64>>,
    pub properties: Vec<Properties>,
    pub decomposition: usize,
    pub profiles: ProfileBasis,
}

impl Chemistry {
    pub fn new(seed: u64) -> Result<Self, String> {
        let mut rng = Random::new(seed ^ 0x43c7a921);
        let mut coefficients: Vec<Vec<f64>> = (0..4)
            .map(|_| (0..16).map(|_| rng.signed() * 0.0125).collect())
            .collect();
        coefficients[0][4] += if rng.unit() < 0.5 { -1. } else { 1. };
        coefficients[2][1] += if rng.unit() < 0.5 { -1. } else { 1. };
        // An interaction mode gives both diffusion rates at either impedance extreme.
        // Properties remain smooth and related, but one no longer determines the other.
        coefficients[1][5] += if rng.unit() < 0.5 { -1. } else { 1. };
        coefficients[3][0] += 0.5;
        coefficients[3][8] -= 0.25;
        coefficients[3][2] -= 0.25;
        let profiles = ProfileBasis::new(seed);
        let mut properties = Self::resolve(&coefficients)?;
        for (s, p) in properties.iter_mut().enumerate() {
            p.interaction = profiles.evaluate(coordinate(s));
        }
        let decomposition = (0..SPECIES)
            .min_by(|&a, &b| {
                (properties[a].potential - 2.)
                    .abs()
                    .total_cmp(&(properties[b].potential - 2.).abs())
            })
            .unwrap();
        let mut result = Self {
            version: 5,
            seed,
            coefficients,
            properties,
            decomposition,
            profiles,
        };
        let mut landscape_rng = Random::new(seed ^ 0x706f74656e746961);
        for _ in 0..256 {
            result.coefficients[0] = (0..16)
                .map(|i| {
                    let square = (i / 4) * (i / 4) + (i % 4) * (i % 4);
                    if (4..=8).contains(&square) {
                        landscape_rng.normal() / square as f64
                    } else {
                        0.
                    }
                })
                .collect();
            let potential = Self::resolve(&result.coefficients)?;
            for (p, q) in result.properties.iter_mut().zip(potential) {
                p.potential = q.potential;
            }
            result.decomposition = (0..SPECIES)
                .min_by(|&a, &b| {
                    (result.properties[a].potential - 2.)
                        .abs()
                        .total_cmp(&(result.properties[b].potential - 2.).abs())
                })
                .unwrap();
            if result.validate().is_ok() {
                return Ok(result);
            }
        }
        Err("Unable to construct a smooth multidirectional chemical definition".into())
    }
    fn resolve(coefficients: &[Vec<f64>]) -> Result<Vec<Properties>, String> {
        if coefficients.len() != 4
            || coefficients
                .iter()
                .any(|v| v.len() != 16 || v.iter().any(|x| !x.is_finite()))
        {
            return Err("Invalid chemical basis".into());
        }
        let mut tables = vec![];
        for (i, c) in coefficients.iter().enumerate() {
            let raw: Vec<f64> = (0..SPECIES)
                .map(|s| {
                    let [x, y] = coordinate(s);
                    c.iter()
                        .enumerate()
                        .map(|(j, v)| {
                            v * ((j / 4) as f64 * std::f64::consts::PI * x / 15.).cos()
                                * ((j % 4) as f64 * std::f64::consts::PI * y / 15.).cos()
                        })
                        .sum()
                })
                .collect();
            let lo = raw.iter().copied().fold(f64::INFINITY, f64::min);
            let hi = raw.iter().copied().fold(f64::NEG_INFINITY, f64::max);
            if hi - lo < 0.1 {
                return Err("Degenerate chemical surface".into());
            }
            let (a, b) = RANGES[i];
            tables.push(
                raw.iter()
                    .map(|x| {
                        let f = (x - lo) / (hi - lo);
                        if i == 1 {
                            a * (b / a).powf(f)
                        } else {
                            a + (b - a) * f
                        }
                    })
                    .collect::<Vec<_>>(),
            );
        }
        Ok((0..SPECIES)
            .map(|s| Properties {
                potential: tables[0][s],
                diffusion: tables[1][s],
                impedance: tables[2][s],
                stress: tables[3][s],
                interaction: [0.; 2],
            })
            .collect())
    }
    pub fn coverage(&self) -> [usize; 10] {
        let mut n = [0; 10];
        for p in &self.properties {
            for (i, yes) in p.coverage_matches().iter().enumerate() {
                n[i] += usize::from(*yes);
            }
        }
        n
    }
    pub fn validate(&self) -> Result<(), String> {
        if self.version != 5 || self.properties.len() != SPECIES || self.decomposition >= SPECIES {
            return Err("Invalid chemistry schema".into());
        }
        let expected = Self::resolve(&self.coefficients)?;
        self.profiles.validate(&self.properties)?;
        ProfileCoverage::measure(&self.properties).validate()?;
        crate::chemical_landscape::validate(&self.properties)?;
        for (p, q) in self.properties.iter().zip(expected) {
            for (a, b) in [
                (p.potential, q.potential),
                (p.diffusion, q.diffusion),
                (p.impedance, q.impedance),
                (p.stress, q.stress),
            ] {
                if !a.is_finite() || (a - b).abs() > 1e-10 {
                    return Err("Chemical table differs from coefficients".into());
                }
            }
        }
        if let Some(i) = self.coverage().iter().position(|n| *n < 8) {
            return Err(format!(
                "Insufficient chemical coverage: {}",
                COVERAGE_NAMES[i]
            ));
        }
        for s in 0..SPECIES {
            for t in [product(s, 1, 0), product(s, 0, 1)] {
                let (a, b) = (&self.properties[s], &self.properties[t]);
                for delta in [
                    (a.potential - b.potential).abs() / 7.5,
                    (a.diffusion / b.diffusion).ln().abs() / 100_f64.ln(),
                    (a.impedance - b.impedance).abs() / 12.,
                    (a.stress - b.stress).abs(),
                ] {
                    if delta > 0.15 {
                        return Err("Chemical space is too steep".into());
                    }
                }
            }
        }
        let coverage = self.physical_coverage();
        if coverage.affinity_weighted_barriers.len() < 8 {
            return Err("Insufficient affinity-weighted barrier neighborhoods".into());
        }
        if coverage.largest_barrier_component < 4 {
            return Err("Insufficient connected barrier neighborhood".into());
        }
        Ok(())
    }
    pub fn physical_coverage(&self) -> PhysicalCoverage {
        let mut witnesses: [Vec<usize>; 10] = std::array::from_fn(|_| Vec::new());
        for (s, p) in self.properties.iter().enumerate() {
            for (i, yes) in p.coverage_matches().iter().enumerate() {
                if *yes {
                    witnesses[i].push(s);
                }
            }
        }
        let affinity_weighted_barriers = (0..SPECIES)
            .filter(|&s| {
                let (mut total, mut impedance, mut diffusion) = (0., 0., 0.);
                for t in 0..SPECIES {
                    let a = affinity(coordinate(s), t, 3.);
                    total += a;
                    impedance += a * self.properties[t].impedance;
                    diffusion += a * self.properties[t].diffusion;
                }
                impedance / total >= 9.6 && diffusion / total <= 0.025
            })
            .collect();
        PhysicalCoverage {
            witnesses,
            affinity_weighted_barriers,
            largest_barrier_component: self.connected_barrier(),
        }
    }
    fn connected_barrier(&self) -> usize {
        let mut seen = [false; SPECIES];
        let mut largest = 0;
        for start in 0..SPECIES {
            let mut queue = vec![start];
            let mut count = 0;
            while let Some(s) = queue.pop() {
                if seen[s] {
                    continue;
                }
                seen[s] = true;
                let p = &self.properties[s];
                if p.impedance < 9.6 || p.diffusion > 0.0126 {
                    continue;
                }
                count += 1;
                for (dx, dy) in [(1, 0), (-1, 0), (0, 1), (0, -1)] {
                    queue.push(product(s, dx, dy));
                }
            }
            largest = largest.max(count);
        }
        largest
    }
    pub fn source_species(&self) -> Vec<usize> {
        let score = |s: usize| {
            let p = &self.properties[s];
            // Rank supplied feedstock by deliverable potential, not stored potential alone.
            // This property-only startup policy never observes organisms or ecological outcomes.
            let drop = (p.potential - self.properties[self.decomposition].potential).max(0.);
            drop * p.diffusion / ((1. + p.impedance) * (1. + p.stress))
        };
        let first = (0..SPECIES)
            .max_by(|&a, &b| score(a).total_cmp(&score(b)))
            .unwrap();
        let [x, y] = coordinate(first);
        let second = (0..SPECIES)
            .filter(|&s| {
                let p = coordinate(s);
                (p[0] - x).hypot(p[1] - y) >= 5. && self.properties[s].potential > 4.
            })
            .max_by(|&a, &b| score(a).total_cmp(&score(b)))
            .unwrap();
        vec![first, second]
    }
}

/// Per-unit usable energy change and dissipated heat.
pub fn reaction_energy(from: f64, to: f64, eta: f64) -> (f64, f64) {
    let delta = from - to;
    if delta >= 0. {
        (eta * delta, (1. - eta) * delta)
    } else {
        (delta / eta, -delta * (1. / eta - 1.))
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Affinity {
    pub species: usize,
    pub value: f64,
}
pub fn compile_affinity(target: [f64; 2], radius: f64) -> Vec<Affinity> {
    let xmin = (target[0] - radius).ceil().max(0.) as usize;
    let xmax = (target[0] + radius).floor().min(15.) as usize;
    let ymin = (target[1] - radius).ceil().max(0.) as usize;
    let ymax = (target[1] + radius).floor().min(15.) as usize;
    (xmin..=xmax)
        .flat_map(|x| (ymin..=ymax).map(move |y| x * 16 + y))
        .filter_map(|s| {
            let value = affinity(target, s, radius);
            (value > 0.).then_some(Affinity { species: s, value })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn compact_smooth_specificity() {
        for x in 0..151 {
            for y in 0..151 {
                let p = [x as f64 / 10., y as f64 / 10.];
                assert!(compile_affinity(p, 3.).len() <= 36);
                if x % 15 == 0 && y % 15 == 0 {
                    let compiled = compile_affinity(p, 3.);
                    let full: Vec<_> = (0..SPECIES).filter(|s| affinity(p, *s, 3.) > 0.).collect();
                    assert_eq!(compiled.iter().map(|a| a.species).collect::<Vec<_>>(), full);
                }
            }
        }
        assert_eq!(affinity([3., 0.], 0, 3.), 0.);
        assert!(affinity([3. - 1e-5, 0.], 0, 3.) < 1e-10);
        assert_eq!(affinity([0., 0.], 0, 3.), 1.);
    }
    #[test]
    fn reflected_products_and_cycles() {
        for s in 0..SPECIES {
            for dx in -15..=15 {
                for dy in -15..=15 {
                    assert!(product(s, dx, dy) < SPECIES);
                }
            }
        }
        for a in [0.5, 2., 8.] {
            for b in [0.5, 2., 8.] {
                let (up, h1) = reaction_energy(a, b, 0.8);
                let (down, h2) = reaction_energy(b, a, 0.8);
                assert!(up + down <= 1e-12);
                assert!((up + down + h1 + h2).abs() < 1e-12);
            }
        }
    }
    #[test]
    fn physical_space_and_restore_validation() {
        for seed in [1, 2, 3, 7, 42, 101, 202, 65535] {
            let c = Chemistry::new(seed).unwrap();
            assert!(c.coverage().iter().all(|n| *n >= 8));
        }
        let mut c = Chemistry::new(101).unwrap();
        c.properties[0].potential += 1.;
        assert!(c.validate().is_err());
    }
}
