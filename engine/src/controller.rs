use crate::{config::Config, random::Random};
use serde::{Deserialize, Serialize};

/// Realized activity of transporters 0–3, then enzyme programs 0–7.
pub const ACTIVITY_INPUT: usize = 16;
pub const FILL_INPUT: usize = 35;
pub const INJURY_INPUT: usize = 36;
pub const LIGHT_INPUT: usize = 37;
pub const INWARD_INPUT: usize = 41;
pub const BUILDER_INPUT: usize = 49;
pub const EMITTER_INPUT: usize = 50;
pub const MOTOR_LOAD_INPUT: usize = 51;
pub const HEARING_INPUT: usize = 52;
pub const CONTEXT_INPUT: usize = HEARING_INPUT + hearing::CHANNELS;
pub const INPUTS: usize = CONTEXT_INPUT + 4;
pub const BASE_INPUTS: u128 =
    (1 << 28) | (0b11111 << 30) | (1 << MOTOR_LOAD_INPUT) | (0b1111 << CONTEXT_INPUT);
pub const ENVIRONMENT_INPUTS: u128 = ((1 << 16) - 1) | (0b1111 << LIGHT_INPUT);
pub const PHYSIOLOGY_INPUTS: u128 =
    ((1_u128 << HEARING_INPUT) - 1) & !(BASE_INPUTS | ENVIRONMENT_INPUTS);
pub const CONTINUOUS_INPUTS: u128 = ((1_u128 << HEARING_INPUT) - 1) | (0b1111 << CONTEXT_INPUT);
mod arithmetic;
pub mod hearing;
mod heredity;
pub mod observation;
pub mod strategic;
pub use heredity::{assimilate, express, genome_distance, mutate, recombine};
mod learning;
mod prepared;
mod weights;
pub use prepared::{
    Epoch, act_owned, act_published, current_traces, expiry_counts, invalidate, materialize,
    observed_state, owns_inputs, publish_inputs, validate_state,
};
pub use weights::WeightStore;
pub mod diagnostics;
#[cfg(test)]
mod drive_tests;
pub mod programs;
#[cfg(test)]
mod symmetry_tests;
pub const HIDDEN: usize = 24;
pub const OUTPUTS: usize = 9;
pub const ACTIVITY: usize = OUTPUTS;
pub const COVER: usize = ACTIVITY + crate::organism::MAX_ENZYMES;
pub const EMISSION: usize = COVER + 1;
pub const SPEECH_BITS: usize = COVER + 2;
pub const SPEECH_EFFORT: usize = SPEECH_BITS + 8;
pub const TOTAL_OUTPUTS: usize = SPEECH_EFFORT + 1;
pub const RECURRENT: usize = INPUTS * HIDDEN;
const BIAS: usize = RECURRENT + HIDDEN * HIDDEN;
const OUTPUT: usize = BIAS + HIDDEN;
const OUTPUT_BIAS: usize = OUTPUT + TOTAL_OUTPUTS * HIDDEN;
pub const PARAMETERS: usize = OUTPUT_BIAS + TOTAL_OUTPUTS;
const DRIVE_LIMIT: f32 = 3.;

/// One incoming-strength budget for bounded sensory, hidden and constant-bias inputs.
fn bounded_drive(value: f32, strength: f32) -> f32 {
    value * (DRIVE_LIMIT / strength.max(DRIVE_LIMIT))
}

/// Monotone odd C1 saturation. Its derivative inside [-3,3] is
/// 9*(x*x-9)^2/(27+9*x*x)^2; no expensive transcendental is needed per neuron.
pub fn squash(x: f32) -> f32 {
    let x = x.clamp(-DRIVE_LIMIT, DRIVE_LIMIT);
    let xx = x * x;
    (x * (27. + xx) / (27. + 9. * xx)).clamp(-1., 1.)
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Genome {
    pub weights: WeightStore,
    pub plasticity: Vec<f32>,
    pub strategy: strategic::Genome,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct State {
    pub hidden: Vec<f32>,
    pub traces: Vec<f32>,
    pub task: u8,
    pub last_energy: Option<f32>,
    pub hearing: hearing::Hearing,
    pub pending_speech: Option<(u8, f64)>,
    pub strategy: strategic::State,
    #[serde(default)]
    pub epoch: Option<Epoch>,
}
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Action {
    pub swim: f64,
    pub turn: f64,
    pub repair: f64,
    pub transport: [f64; 4],
    pub activity: [f64; crate::organism::MAX_ENZYMES],
    pub cover: f64,
    pub emission: f64,
    pub speech: u8,
    pub speech_effort: f64,
}
impl Default for Action {
    fn default() -> Self {
        Self {
            swim: 0.,
            turn: 0.,
            repair: 0.,
            transport: [0.5; 4],
            activity: [1.; crate::organism::MAX_ENZYMES],
            cover: 0.,
            emission: 0.,
            speech: 0,
            speech_effort: 0.,
        }
    }
}

impl Default for State {
    fn default() -> Self {
        Self {
            hidden: vec![0.; HIDDEN],
            traces: vec![0.; HIDDEN * HIDDEN],
            task: 0,
            last_energy: None,
            hearing: Default::default(),
            pending_speech: None,
            strategy: Default::default(),
            epoch: None,
        }
    }
}
pub fn seed() -> Genome {
    let mut w = vec![0.; PARAMETERS];
    programs::seed_requests(&mut w);
    for i in 0..16 {
        w[i * INPUTS + i] = 1.5;
    }
    for i in [3, 7] {
        w[i * INPUTS + i] = 8.;
    }
    for (h, i) in [
        (16, 28),
        (17, 30),
        (18, 31),
        (19, 33),
        (20, FILL_INPUT),
        (21, INJURY_INPUT),
    ] {
        w[h * INPUTS + i] = 1.5;
    }
    w[OUTPUT_BIAS] = 0.7;
    w[OUTPUT] = -0.6;
    w[OUTPUT + 4] = -0.6;
    w[OUTPUT + HIDDEN + 3] = 3.;
    w[OUTPUT + HIDDEN + 7] = 3.;
    w[OUTPUT + HIDDEN + 17] = 1.;
    w[OUTPUT + HIDDEN + 18] = 1.;
    w[OUTPUT + HIDDEN + 19] = -1.;
    w[OUTPUT + 2 * HIDDEN + 21] = 2.;
    w[OUTPUT_BIAS + 4] = -1.;
    for s in [0, 1] {
        w[OUTPUT_BIAS + 5 + s] = 1.5;
    }
    for s in [2, 3] {
        w[OUTPUT + (5 + s) * HIDDEN + 20] = -3.;
        w[OUTPUT_BIAS + 5 + s] = 3. * squash(1.5_f32 * 0.75);
    }
    Genome {
        weights: w.into(),
        plasticity: vec![0.1, 0.02, 1., 0., 0., 0., 1., 1., 0., 0., 1.],
        strategy: strategic::Genome::seed(),
    }
}
/// Mutable starting behavior: retain feeding, export product, repair and follow local food.
pub fn circuit_seed() -> Genome {
    let mut g = seed();
    g.weights[OUTPUT_BIAS] = 0.25;
    g.weights[OUTPUT_BIAS + 2] = 1.4;
    for s in [2, 3] {
        g.weights[OUTPUT + (5 + s) * HIDDEN + 20] = 0.;
        g.weights[OUTPUT_BIAS + 5 + s] = -0.15;
    }
    g
}
/// Handcrafted experimental chromosomes still execute through the ordinary RNN.
pub fn diagnostic(logits: [f32; OUTPUTS], response: Option<(usize, usize, f32)>) -> Genome {
    let mut genome = Genome {
        weights: vec![0.; PARAMETERS].into(),
        plasticity: vec![0.; 11],
        strategy: strategic::Genome::seed(),
    };
    programs::seed_requests(&mut genome.weights);
    genome.weights[OUTPUT_BIAS..OUTPUT_BIAS + OUTPUTS].copy_from_slice(&logits);
    if let Some((input, output, gain)) = response {
        assert!(input < INPUTS && output < OUTPUTS);
        genome.weights[input] = 1.;
        genome.weights[OUTPUT + output * HIDDEN] = gain;
    }
    genome
}
pub fn act(g: &Genome, inputs: &[f32], state: &mut State, config: &Config, learn: bool) -> Action {
    prepared::advance(g, inputs, state, config, learn, None)
}
fn decode(logits: &[f32], state: &mut State) -> Action {
    if logits[4] >= 0. {
        state.task = (127.5 * (1. + squash(logits[3] * 0.5))).round() as u8;
    }
    Action {
        swim: squash(logits[0]).max(0.) as f64,
        turn: squash(logits[1]) as f64,
        repair: squash(logits[2]).max(0.) as f64,
        transport: std::array::from_fn(|s| (1. + squash(logits[5 + s]) as f64) * 0.5),
        activity: std::array::from_fn(|s| squash(logits[ACTIVITY + s]).max(0.) as f64),
        cover: squash(logits[COVER]) as f64,
        emission: squash(logits[EMISSION]).max(0.) as f64,
        speech: (0..8).fold(0, |byte, bit| {
            byte | ((logits[SPEECH_BITS + bit] >= 0.) as u8) << bit
        }),
        speech_effort: squash(logits[SPEECH_EFFORT]).max(0.) as f64,
    }
}
pub fn mutate_vector(
    values: &mut [f32],
    rng: &mut Random,
    rate: f64,
    scale: f64,
    bound: f32,
) -> bool {
    crate::genetics::mutation::mutate(values, rng, rate, scale, -(bound as f64), bound as f64)
}
pub fn combine<T: Clone>(a: &[T], b: &[T], rng: &mut Random, kind: &str) -> Vec<T> {
    let split = rng.index(a.len() + 1);
    a.iter()
        .zip(b)
        .enumerate()
        .map(|(i, (x, y))| {
            if (kind == "one-point" && i < split) || (kind == "uniform" && rng.unit() < 0.5) {
                x.clone()
            } else {
                y.clone()
            }
        })
        .collect()
}
/// Read-only RMS acquired change over the recurrent weights, excluding inherited weights.
pub fn acquired_rms(g: &Genome, state: &State, config: &Config) -> f64 {
    if config.learning != "plastic" {
        return 0.;
    }
    let mean = current_traces(state)
        .iter()
        .map(|v| (*v as f64).powi(2))
        .sum::<f64>()
        / state.traces.len() as f64;
    g.plasticity[0].abs() as f64 * mean.sqrt()
}
pub fn validate(g: &Genome) -> Result<(), String> {
    if !g.strategy.validate()
        || g.weights.len() != PARAMETERS
        || g.plasticity.len() != 11
        || g.weights.iter().any(|x| !x.is_finite() || x.abs() > 16.)
        || g.plasticity.iter().any(|x| !x.is_finite() || x.abs() > 1.)
    {
        return Err("Invalid controller genome".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn sparse_mutation_keeps_rate_support_and_zero_rate_identity() {
        let mut rng = Random::new(101);
        let mut values = vec![0.; 100000];
        assert!(!mutate_vector(&mut values, &mut rng, 0., 0.1, 16.));
        assert!(mutate_vector(&mut values, &mut rng, 0.01, 0.1, 16.));
        let counts: Vec<_> = values
            .chunks(10000)
            .map(|bin| bin.iter().filter(|v| **v != 0.).count())
            .collect();
        assert!((850..1150).contains(&counts.iter().sum::<usize>()));
        assert!(counts.iter().all(|n| (60..140).contains(n)));
        assert!(values.iter().all(|x| x.is_finite() && x.abs() <= 16.));
        assert!(values.iter().any(|x| x.abs() > 8.));
    }
    #[test]
    fn private_learning_and_assimilation() {
        let g = seed();
        let original = g.clone();
        let mut s = State::default();
        let c = Config::default();
        let mut input = [0.; INPUTS];
        input[1] = 0.5;
        input[28] = 0.8;
        for _ in 0..10 {
            act(&g, &input, &mut s, &c, true);
        }
        assert_eq!(g, original);
        assert!(current_traces(&s).iter().any(|x| *x != 0.));
        let child = assimilate(&g, &g, &s, 1.);
        assert!(genome_distance(&g, &child) > 0.);
        assert_eq!(genome_distance(&g, &assimilate(&g, &g, &s, 0.)), 0.);
    }
    #[test]
    fn unpaid_learning_does_not_update_traces() {
        let mut s = State::default();
        act(&seed(), &[0.5; INPUTS], &mut s, &Config::default(), false);
        assert!(s.traces.iter().all(|x| *x == 0.));
    }
    #[test]
    fn founder_turns_toward_the_body_left_chemical_reading() {
        for cue in [-0.1, 0.1] {
            let mut inputs = [0.; INPUTS];
            inputs[3] = cue;
            let action = act(
                &seed(),
                &inputs,
                &mut State::default(),
                &Config::default(),
                false,
            );
            assert!(action.turn * cue as f64 > 0.);
        }
    }
    #[test]
    fn activation_preserves_a_smooth_bounded_neural_response() {
        let mut before = -1.;
        for i in -10000..=10000 {
            let x = i as f32 / 1000.;
            let y = squash(x);
            assert!((-1. ..=1.).contains(&y));
            assert!(y >= before - 1e-6);
            assert_eq!(squash(-x), -y);
            assert!((y - x.tanh()).abs() < 0.024);
            before = y;
        }
        assert!((squash(3.) - squash(3. - 0.001)).abs() < 1e-6);
    }
}
