//! One reflected heavy-tail law; existing scales retain their parameter units.
use crate::random::Random;

// Phi^-1(0.75): median |N(0,1)|. The common law preserves the former Gaussian's
// median proposed step, while P(|step| > d) = b / (b + d), b = scale * this value.
const NORMAL_ABS_MEDIAN: f64 = 0.6744897501960817;

pub(crate) fn count(value: usize, maximum: usize, scale: f64, rng: &mut Random) -> usize {
    let u = rng.signed().clamp(-1. + f64::EPSILON, 1. - f64::EPSILON);
    let period = 2. * (maximum - 1) as f64;
    let step = (NORMAL_ABS_MEDIAN * scale * u / (1. - u.abs())).rem_euclid(period);
    let rounded = step.floor() + f64::from(rng.unit() < step.fract());
    let phase = (value as f64 - 1. + rounded).rem_euclid(period);
    (1. + (maximum - 1) as f64 - (phase - (maximum - 1) as f64).abs()) as usize
}

pub(crate) trait Gene: Copy + PartialEq {
    fn read(self) -> f64;
    fn write(value: f64) -> Self;
}
impl Gene for f32 {
    fn read(self) -> f64 {
        self as f64
    }
    fn write(value: f64) -> Self {
        value as f32
    }
}
impl Gene for f64 {
    fn read(self) -> f64 {
        self
    }
    fn write(value: f64) -> Self {
        value
    }
}

fn phase(value: f64, low: f64, high: f64, scale: f64, uniform: f64) -> f64 {
    let width = high - low;
    let normalized_scale = NORMAL_ABS_MEDIAN * scale / width;
    let u = uniform.clamp(-1. + f64::EPSILON, 1. - f64::EPSILON);
    let denominator = 1. - u.abs();
    // Reduce modulo the reflection period before dividing: even a finite extreme
    // scale or an endpoint draw cannot overflow the heavy-tailed displacement.
    let step = (normalized_scale * u).rem_euclid(2. * denominator) / denominator;
    ((value - low) / width + step).rem_euclid(2.)
}

fn reflected(value: f64, low: f64, high: f64, scale: f64, uniform: f64) -> f64 {
    let width = high - low;
    let phase = phase(value, low, high, scale, uniform);
    low + width * (1. - (phase - 1.).abs())
}

/// The same heavy-tail displacement on a circle instead of a reflected interval.
pub(crate) fn mutate_angles<'a>(
    values: impl IntoIterator<Item = &'a mut f64>,
    rng: &mut Random,
    rate: f64,
    scale: f64,
) -> bool {
    if rate <= 0. || scale <= 0. {
        return false;
    }
    let mut changed = false;
    for value in values {
        if rng.unit() >= rate {
            continue;
        }
        let next = std::f64::consts::TAU
            * phase(*value, 0., std::f64::consts::TAU, scale, rng.signed()).rem_euclid(1.);
        let next = crate::genetics::angles::wrap(next);
        changed |= *value != next;
        *value = next;
    }
    changed
}

/// `scale` has the same units as the gene. Rate and scale are supplied by the
/// caller; the law and boundary handling are shared. Skip unselected coordinates.
pub(crate) fn mutate<'a, T: Gene + 'a>(
    values: impl IntoIterator<Item = &'a mut T>,
    rng: &mut Random,
    rate: f64,
    scale: f64,
    low: f64,
    high: f64,
) -> bool {
    if rate <= 0. || scale <= 0. {
        return false;
    }
    let mut values = values.into_iter();
    let log_failure = (-rate).ln_1p();
    let mut changed = false;
    loop {
        let gap = if rate >= 1. {
            0
        } else {
            ((-rng.unit()).ln_1p() / log_failure).floor() as usize
        };
        let Some(value) = values.nth(gap) else {
            break;
        };
        let next = T::write(reflected(value.read(), low, high, scale, rng.signed()));
        changed |= *value != next;
        *value = next;
    }
    changed
}

fn event_count(rng: &mut Random, rate: f64) -> usize {
    let p = rate.clamp(0., 1.);
    let u = rng.unit();
    usize::from(u < 2. * p - p * p) + usize::from(u < p * p)
}

fn vector_step(point: [f64; 2], bounds: [f64; 2], scale: f64, u: f64, angle: f64) -> [f64; 2] {
    let direction = [angle.cos(), angle.sin()];
    std::array::from_fn(|i| reflected(point[i], bounds[0], bounds[1], scale * direction[i], u))
}

/// Two scalar opportunities become a Binomial(2, rate) number of isotropic
/// vector events. Each event retains the scalar law's absolute-step distribution.
pub(crate) fn mutate_pairs<'a>(
    values: impl IntoIterator<Item = [&'a mut f64; 2]>,
    rng: &mut Random,
    rate: f64,
    scale: f64,
    low: f64,
    high: f64,
) -> bool {
    if rate <= 0. || scale <= 0. {
        return false;
    }
    let mut changed = false;
    for [x, y] in values {
        let original = [*x, *y];
        let mut point = original;
        for _ in 0..event_count(rng, rate) {
            let u = rng.signed();
            let angle = rng.unit() * std::f64::consts::TAU;
            point = vector_step(point, [low, high], scale, u, angle);
        }
        changed |= original != point;
        [*x, *y] = point;
    }
    changed
}

#[cfg(test)]
#[path = "mutation_geometry_tests.rs"]
mod geometry_tests;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn common_law_is_affine_equivalent_and_reflects_instead_of_clamping() {
        for u in [-0.99, -0.5, 0., 0.5, 0.99] {
            let normalized = reflected(0.4, 0., 1., 0.08, u);
            for (low, high) in [(-16., 16.), (-1., 1.), (-3., 3.), (0., 15.), (-15., 15.)] {
                let result = reflected(low + 0.4 * (high - low), low, high, 0.08 * (high - low), u);
                assert!((result - low - normalized * (high - low)).abs() < 1e-12);
                assert!(result.is_finite() && (low..=high).contains(&result));
            }
        }
        assert!((reflected(0.95, 0., 1., 0.1 / NORMAL_ABS_MEDIAN, 0.5) - 0.95).abs() < 1e-12);
        // At endpoint draws, tiny scale-rounding differences are magnified by
        // near-infinite displacement. Check finite bounds, not equal fold phase.
        for u in [-1., 0., 1.] {
            for (low, high) in [(-16., 16.), (-1., 1.), (-3., 3.), (0., 15.), (-15., 15.)] {
                let result = reflected(0.4, low, high, f64::MAX, u);
                assert!(result.is_finite() && (low..=high).contains(&result));
            }
        }
    }

    #[test]
    fn calibrated_median_and_tail_match_the_predicted_step_distribution() {
        for (scale, threshold) in [(0.08, 1.), (0.12, 3.)] {
            let b = NORMAL_ABS_MEDIAN * scale;
            let mut values = vec![0_f64; 100000];
            mutate(&mut values, &mut Random::new(27), 1., scale, -1e6, 1e6);
            let small = values.iter().filter(|v| v.abs() < b).count();
            let large = values.iter().filter(|v| v.abs() > threshold).count();
            let probability = b / (b + threshold);
            let expected = values.len() as f64 * probability;
            let tolerance = 6. * (expected * (1. - probability)).sqrt();
            assert!((48000..52000).contains(&small), "small={small}");
            assert!((large as f64 - expected).abs() < tolerance, "large={large}");
            println!(
                "scale={scale} median_target={b} small={small}/100000 tail_above={threshold} observed={large}/100000 predicted={probability}"
            );
        }
    }

    #[test]
    fn sparse_selection_and_rng_resume_are_deterministic() {
        let original = vec![0_f32; 100000];
        let mut values = original.clone();
        let mut rng = Random::new(101);
        let before = rng.0;
        assert!(!mutate(&mut values, &mut rng, 0., 0.08, -16., 16.));
        assert!(!mutate(&mut values, &mut rng, 1., 0., -16., 16.));
        assert_eq!(values, original);
        assert_eq!(rng.0, before);
        let mut replay = rng.clone();
        let mut repeated = original;
        mutate(&mut values, &mut rng, 0.01, 0.08, -16., 16.);
        mutate(&mut repeated, &mut replay, 0.01, 0.08, -16., 16.);
        assert_eq!(values, repeated);
        assert_eq!(rng.0, replay.0);
        let selected = values.iter().filter(|v| **v != 0.).count();
        assert!((850..1150).contains(&selected), "selected={selected}");
    }

    #[test]
    fn inheritance_uses_separate_constants_with_shared_law_and_immutable_parent() {
        let mut w = crate::diagnostics::nutrition(0.8, 2., true, false);
        let parent = w.genomes[&w.cells[0].genome].clone();
        let inherit = |c: &crate::config::Config| {
            parent.inherit(
                2,
                1,
                &w.cells[0].brain,
                &mut Random::new(27),
                c,
                &w.chemistry,
            )
        };
        assert_eq!(inherit(&w.config).chromosomes, parent.chromosomes);
        w.config.physical_mutation_rate = 1.;
        let physical_child = inherit(&w.config);
        assert_eq!(
            physical_child.chromosomes[0].behavior,
            parent.chromosomes[0].behavior
        );
        assert_ne!(
            physical_child.chromosomes[0].physical,
            parent.chromosomes[0].physical
        );
        assert_ne!(
            physical_child.chromosomes[0].chemistry,
            parent.chromosomes[0].chemistry
        );
        w.config.physical_mutation_rate = 0.;
        w.config.mutation_rate = 1.;
        w.config.mutation_scale = 0.08;
        let child = inherit(&w.config);
        let a = &parent.chromosomes[0];
        let b = &child.chromosomes[0];
        assert_ne!(a.behavior.weights, b.behavior.weights);
        assert_ne!(a.behavior.plasticity, b.behavior.plasticity);
        assert_eq!(a.physical, b.physical);
        assert_eq!(a.chemistry, b.chemistry);
        assert!(child.mutated);
        child.validate(&w.config).unwrap();
        assert_eq!(child.chromosomes, inherit(&w.config).chromosomes);
        assert_eq!(parent.chromosomes, w.genomes[&parent.id].chromosomes);
    }

    #[test]
    fn broad_mutation_at_birth_preserves_funded_stock_and_checkpoint_replay() {
        let mut w = crate::diagnostics::nutrition(0.8, 2., true, false);
        w.config.mutation_rate = 1.;
        w.config.mutation_scale = 0.08;
        w.config.physical_mutation_rate = 1.;
        let cell = &mut w.cells[0];
        cell.set_fixture_body(cell.body.map(|q| q * 2.));
        cell.energy = 1.;
        let installed = cell.installed.clone();
        let stock = cell.body;
        let original = w.genomes[&cell.genome].chromosomes.clone();
        let before = w.held();
        crate::lifecycle::reproduce(&mut w);
        assert_eq!(w.cells.len(), 2);
        for cell in &w.cells {
            let child = &w.genomes[&cell.genome];
            child.validate(&w.config).unwrap();
            assert_ne!(child.chromosomes, original);
            assert_ne!(
                child.compiled.as_ref().unwrap().chromosome.chemistry,
                installed
            );
            assert_eq!(cell.installed, installed);
            assert!(
                child.chromosomes[0]
                    .chemistry
                    .enzymes
                    .iter()
                    .any(|e| e.angle != 0.)
            );
            assert_eq!(cell.body, stock.map(|q| q * 0.5));
        }
        let after = w.held();
        assert!((before.0 - after.0).abs() < 1e-12);
        assert!((before.1 - after.1 - w.ledger.division_heat).abs() < 1e-12);
        let mut restored = crate::world::World::restore(&w.snapshot().unwrap()).unwrap();
        w.step();
        restored.step();
        assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
    }

    #[test]
    fn scalar_rates_preserve_per_coordinate_mutation_opportunities() {
        let c = crate::config::Config::default();
        let g = crate::controller::seed();
        let neural = g.weights.len() + g.plasticity.len();
        let mut rng = Random::new(27);
        for (count, rate, scale) in [
            (neural, c.mutation_rate, c.mutation_scale),
            (49, c.physical_mutation_rate, c.physical_mutation_scale),
        ] {
            let mut values = vec![0_f64; count];
            let mut changed = 0;
            for _ in 0..10000 {
                values.fill(0.);
                mutate(&mut values, &mut rng, rate, scale, -16., 16.);
                changed += values.iter().filter(|v| **v != 0.).count();
            }
            let expected = 10000. * count as f64 * rate;
            assert!((changed as f64 - expected).abs() < 6. * (expected * (1. - rate)).sqrt());
            println!(
                "loci={count} mutations_per_birth={} predicted={}",
                changed as f64 / 10000.,
                expected / 10000.
            );
        }
    }
}
