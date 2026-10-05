//! Slow learned context behind the controller boundary; it cannot issue physical actions.
use super::{Config, Random, WeightStore, mutate_vector, squash, weights::Projection};
use serde::{Deserialize, Serialize};
pub const HISTORY: usize = 11;
pub const EXTRA: usize = 27;
pub const INPUTS: usize = HISTORY * 3 + EXTRA + 1;
pub const HIDDEN: usize = 8;
pub const OUTPUTS: usize = 5;
pub const INTERVALS: f64 = 8.;
pub const RECURRENT: usize = INPUTS * HIDDEN;
pub(super) const BIAS: usize = RECURRENT + HIDDEN * HIDDEN;
pub(super) const OUTPUT: usize = BIAS + HIDDEN;
pub(super) const OUTPUT_BIAS: usize = OUTPUT + HIDDEN * OUTPUTS;
pub const PARAMETERS: usize = OUTPUT_BIAS + OUTPUTS;
#[path = "strategic_inference.rs"]
mod inference;
pub use inference::evaluate;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Genome {
    pub weights: WeightStore,
    pub plasticity: Vec<f32>,
    /// Eight retention alleles, one long-timescale allele, one assimilation allele.
    pub loci: Vec<f32>,
}
impl Genome {
    pub fn seed() -> Self {
        let mut weights = vec![0.; PARAMETERS];
        weights[1] = 1.;
        weights[INPUTS + 6 * 3] = 1.;
        weights[OUTPUT] = 1.;
        weights[OUTPUT + HIDDEN + 1] = 1.;
        let mut loci = vec![0.; HIDDEN + 2];
        loci[HIDDEN + 1] = 1.;
        Self {
            weights: weights.into(),
            plasticity: vec![0.1, 0.02, 1., 0., 0., 0., 0., 0., 0., 0., 1.],
            loci,
        }
    }
    pub fn mutate(&mut self, rng: &mut Random, c: &Config) -> bool {
        let weights = mutate_vector(
            &mut self.weights,
            rng,
            c.mutation_rate,
            c.mutation_scale,
            16.,
        );
        let plasticity = mutate_vector(
            &mut self.plasticity,
            rng,
            c.mutation_rate,
            c.mutation_scale,
            1.,
        );
        let loci = mutate_vector(&mut self.loci, rng, c.mutation_rate, c.mutation_scale, 1.);
        weights || plasticity || loci
    }
    pub fn express(a: &Self, b: &Self) -> Self {
        fn mean(a: &[f32], b: &[f32]) -> Vec<f32> {
            a.iter().zip(b).map(|(a, b)| (a + b) * 0.5).collect()
        }
        Self {
            weights: mean(&a.weights, &b.weights).into(),
            plasticity: mean(&a.plasticity, &b.plasticity),
            loci: mean(&a.loci, &b.loci),
        }
    }
    pub fn assimilate(&self, expressed: &Self, state: &State, retention: f64) -> Self {
        let mut child = self.clone();
        let gain =
            retention as f32 * expressed.loci[HIDDEN + 1].abs() * expressed.plasticity[0].abs();
        for (i, &trace) in state.traces.iter().enumerate() {
            child.weights[RECURRENT + i] =
                (child.weights[RECURRENT + i] + gain * trace).clamp(-16., 16.);
        }
        child
    }
    pub fn values(&self) -> impl Iterator<Item = &f32> {
        self.weights
            .iter()
            .chain(&self.plasticity)
            .chain(&self.loci)
    }
    pub fn validate(&self) -> bool {
        self.weights.len() == PARAMETERS
            && self.plasticity.len() == 11
            && self.loci.len() == HIDDEN + 2
            && self.weights.iter().all(|v| v.is_finite() && v.abs() <= 16.)
            && self
                .plasticity
                .iter()
                .chain(&self.loci)
                .all(|v| v.is_finite() && v.abs() <= 1.)
    }
    pub fn retention(&self) -> [f32; HIDDEN] {
        std::array::from_fn(|i| ((1. + self.loci[i]) * 0.5).min(1. - f32::EPSILON))
    }
    pub fn long_time(&self, c: &Config) -> f64 {
        interval(c) * 2_f64.powf(5. + 3. * self.loci[HIDDEN] as f64)
    }
}

pub(super) struct Program {
    pub input: Projection,
    pub output: Projection,
    pub input_strength: [f32; HIDDEN],
    pub output_strength: [f32; OUTPUTS],
}
impl std::fmt::Debug for Program {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("StrategicProgram")
    }
}
impl Program {
    pub fn compile(weights: &[f32]) -> Self {
        Self {
            input: Projection::compile(&weights[..RECURRENT], INPUTS),
            output: Projection::compile(&weights[OUTPUT..OUTPUT_BIAS], HIDDEN),
            input_strength: std::array::from_fn(|i| {
                weights[i * INPUTS..(i + 1) * INPUTS]
                    .iter()
                    .map(|w| w.abs())
                    .sum::<f32>()
                    + weights[BIAS + i].abs()
            }),
            output_strength: std::array::from_fn(|i| {
                weights[OUTPUT + i * HIDDEN..OUTPUT + (i + 1) * HIDDEN]
                    .iter()
                    .map(|w| w.abs())
                    .sum::<f32>()
                    + weights[OUTPUT_BIAS + i].abs()
            }),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct State {
    pub hidden: [f32; HIDDEN],
    pub traces: Vec<f32>,
    pub long: [f32; HISTORY],
    pub volatility: [f32; HISTORY],
    pub integral: Vec<f64>,
    pub extra: [f32; EXTRA],
    pub inputs: Vec<f32>,
    pub elapsed: f64,
    pub context: [f32; 4],
    pub context_mean: [f32; 4],
    pub clamp_context: bool,
    pub learning_gain: f64,
    pub noise: Random,
    pub evaluations: u64,
    pub divisions: u64,
    pub last_division_age: f64,
    pub displacement: [f64; 2],
    pub path: f64,
}
impl Default for State {
    fn default() -> Self {
        Self {
            hidden: [0.; HIDDEN],
            traces: vec![0.; HIDDEN * HIDDEN],
            long: [0.; HISTORY],
            volatility: [0.; HISTORY],
            integral: vec![0.; HISTORY + EXTRA],
            extra: [0.; EXTRA],
            inputs: vec![0.; INPUTS],
            elapsed: 0.,
            context: [0.; 4],
            context_mean: [0.; 4],
            clamp_context: false,
            learning_gain: 1.,
            noise: Random::new(0),
            evaluations: 0,
            divisions: 0,
            last_division_age: 0.,
            displacement: [0.; 2],
            path: 0.,
        }
    }
}
impl State {
    pub fn child(&self, seed: u64) -> Self {
        Self {
            hidden: self.hidden,
            long: self.long,
            volatility: self.volatility,
            context: self.context,
            context_mean: self.context_mean,
            clamp_context: self.clamp_context,
            learning_gain: self.learning_gain,
            noise: Random::new(seed),
            ..Self::default()
        }
    }
    pub fn displayed(&self) -> [f32; 4] {
        if self.clamp_context {
            self.context_mean
        } else {
            self.context
        }
    }
    pub fn accumulate(
        &mut self,
        history: [f64; HISTORY],
        displacement: [f64; 2],
        distance: f64,
        dt: f64,
    ) {
        for (integral, value) in self
            .integral
            .iter_mut()
            .zip(history.into_iter().chain(self.extra.map(f64::from)))
        {
            *integral += value * dt;
        }
        for (total, value) in self.displacement.iter_mut().zip(displacement) {
            *total += value;
        }
        self.path += distance;
        self.elapsed += dt;
    }
    pub fn validate(&self) -> bool {
        self.traces.len() == HIDDEN * HIDDEN
            && self.integral.len() == HISTORY + EXTRA
            && self.inputs.len() == INPUTS
            && self
                .hidden
                .iter()
                .chain(&self.traces)
                .chain(&self.long)
                .chain(&self.volatility)
                .chain(&self.extra)
                .chain(&self.inputs)
                .chain(&self.context)
                .chain(&self.context_mean)
                .all(|v| v.is_finite() && v.abs() <= 1.)
            && self
                .integral
                .iter()
                .chain(&self.displacement)
                .all(|v| v.is_finite())
            && [self.elapsed, self.path, self.last_division_age]
                .iter()
                .all(|v| v.is_finite() && *v >= 0.)
            && self.learning_gain.is_finite()
            && (0. ..=2.).contains(&self.learning_gain)
    }
}
pub fn interval(c: &Config) -> f64 {
    INTERVALS * c.physiology_interval
}
pub fn upkeep_multiplier(c: &Config) -> f64 {
    1. + if c.features.strategy {
        PARAMETERS as f64 / (super::PARAMETERS as f64 * INTERVALS)
    } else {
        0.
    }
}
pub fn learning_rate(gain: f64, c: &Config) -> f64 {
    c.features.reflex_learning_gain(gain)
        + if c.features.strategy {
            1. / INTERVALS
        } else {
            0.
        }
}

pub fn seed_state(seed: u64) -> super::State {
    let mut state = super::State::default();
    state.strategy.noise = Random::new(seed);
    state
}
pub fn daughter(parent: &super::State, seed: u64) -> super::State {
    super::State {
        strategy: parent.strategy.child(seed),
        ..super::State::default()
    }
}

#[cfg(test)]
#[path = "strategic_tests.rs"]
mod tests;
