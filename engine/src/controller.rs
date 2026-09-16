use crate::{config::Config, random::Random};
use serde::{Deserialize, Serialize};

pub const INPUTS: usize = 39;
pub mod diagnostics;
pub const HIDDEN: usize = 24;
pub const OUTPUTS: usize = 9;
pub const RECURRENT: usize = INPUTS * HIDDEN;
const BIAS: usize = RECURRENT + HIDDEN * HIDDEN;
const OUTPUT: usize = BIAS + HIDDEN;
const OUTPUT_BIAS: usize = OUTPUT + OUTPUTS * HIDDEN;
pub const PARAMETERS: usize = OUTPUT_BIAS + OUTPUTS;

/// Monotone odd C1 saturation. Its derivative inside [-3,3] is
/// 9*(x*x-9)^2/(27+9*x*x)^2; no expensive transcendental is needed per neuron.
pub fn squash(x: f32) -> f32 {
    let x = x.clamp(-3., 3.);
    let xx = x * x;
    (x * (27. + xx) / (27. + 9. * xx)).clamp(-1., 1.)
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Genome {
    pub weights: Vec<f32>,
    pub plasticity: Vec<f32>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct State {
    pub hidden: Vec<f32>,
    pub traces: Vec<f32>,
    pub task: u8,
    pub last_energy: Option<f32>,
}
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Action {
    pub swim: f64,
    pub turn: f64,
    pub repair: f64,
    pub transport: [f64; 4],
}
impl Default for Action {
    fn default() -> Self {
        Self {
            swim: 0.,
            turn: 0.,
            repair: 0.,
            transport: [0.5; 4],
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
        }
    }
}
pub fn seed() -> Genome {
    let mut w = vec![0.; PARAMETERS];
    for i in 0..16 {
        w[i * INPUTS + i] = 1.5;
    }
    for i in [3, 7] {
        w[i * INPUTS + i] = 8.;
    }
    for (h, i) in [(16, 28), (17, 30), (18, 31), (19, 33), (20, 37), (21, 38)] {
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
        weights: w,
        plasticity: vec![0.1, 0.02, 1., 0., 0., 0., 1., 1., 0., 0., 1.],
    }
}
use crate::numeric::dot;
/// Handcrafted experimental chromosomes still execute through the ordinary RNN.
pub fn diagnostic(logits: [f32; OUTPUTS], response: Option<(usize, usize, f32)>) -> Genome {
    let mut genome = Genome {
        weights: vec![0.; PARAMETERS],
        plasticity: vec![0.; 11],
    };
    genome.weights[OUTPUT_BIAS..].copy_from_slice(&logits);
    if let Some((input, output, gain)) = response {
        assert!(input < INPUTS && output < OUTPUTS);
        genome.weights[input] = 1.;
        genome.weights[OUTPUT + output * HIDDEN] = gain;
    }
    genome
}
pub fn act(g: &Genome, inputs: &[f32], state: &mut State, config: &Config, learn: bool) -> Action {
    let alpha = if config.learning == "plastic" {
        g.plasticity[0].abs()
    } else {
        0.
    };
    let mut next = [0.; HIDDEN];
    for (h, value) in next.iter_mut().enumerate() {
        let recurrent = &g.weights[RECURRENT + h * HIDDEN..RECURRENT + (h + 1) * HIDDEN];
        let trace = &state.traces[h * HIDDEN..(h + 1) * HIDDEN];
        let sum = dot(&g.weights[h * INPUTS..(h + 1) * INPUTS], inputs)
            + dot(recurrent, &state.hidden)
            + alpha * dot(trace, &state.hidden)
            + g.weights[BIAS + h];
        *value = squash(sum);
    }
    let mut logits = [0.; OUTPUTS];
    for (o, value) in logits.iter_mut().enumerate() {
        *value = dot(
            &g.weights[OUTPUT + o * HIDDEN..OUTPUT + (o + 1) * HIDDEN],
            &next,
        ) + g.weights[OUTPUT_BIAS + o];
    }
    update_traces(g, inputs, state, &next, config, learn);
    state.hidden.copy_from_slice(&next);
    if logits[4] >= 0. {
        state.task = (127.5 * (1. + squash(logits[3] * 0.5))).round() as u8;
    }
    Action {
        swim: squash(logits[0]).max(0.) as f64,
        turn: squash(logits[1]) as f64,
        repair: squash(logits[2]).max(0.) as f64,
        transport: std::array::from_fn(|s| (1. + squash(logits[5 + s]) as f64) * 0.5),
    }
}
fn update_traces(
    g: &Genome,
    inputs: &[f32],
    state: &mut State,
    next: &[f32],
    c: &Config,
    learn: bool,
) {
    let delta = state.last_energy.map_or(0., |last| inputs[28] - last);
    state.last_energy = Some(inputs[28]);
    if c.learning != "plastic" || !learn {
        return;
    }
    let p = &g.plasticity;
    let modulation = squash(
        p[6] * inputs[1] + p[7] * inputs[5] + p[8] * inputs[9] + p[9] * inputs[13] + p[10] * delta,
    );
    let rate = p[1].abs() * c.dt as f32;
    for (i, &y) in next.iter().enumerate() {
        for (j, &x) in state.hidden.iter().enumerate() {
            let h = &mut state.traces[i * HIDDEN + j];
            *h = (*h
                + rate * (modulation * (p[2] * x * y + p[3] * x + p[4] * y + p[5]) - y * y * (*h)))
                .clamp(-1., 1.);
        }
    }
}
pub fn assimilate(allele: &Genome, expressed: &Genome, state: &State, retention: f64) -> Genome {
    let mut child = allele.clone();
    for (i, h) in state.traces.iter().enumerate() {
        child.weights[RECURRENT + i] = (child.weights[RECURRENT + i]
            + retention as f32 * expressed.plasticity[0].abs() * h)
            .clamp(-16., 16.);
    }
    child
}
pub fn mutate(g: &mut Genome, rng: &mut Random, c: &Config) -> bool {
    let weights = mutate_vector(
        &mut g.weights,
        rng,
        c.mutation_rate,
        c.mutation_scale,
        16.,
        &c.mutation_kind,
    );
    let plasticity = mutate_vector(
        &mut g.plasticity,
        rng,
        c.mutation_rate,
        c.mutation_scale,
        1.,
        &c.mutation_kind,
    );
    weights || plasticity
}
pub fn mutate_vector(
    values: &mut [f32],
    rng: &mut Random,
    rate: f64,
    scale: f64,
    bound: f32,
    kind: &str,
) -> bool {
    if rate <= 0. || scale <= 0. {
        return false;
    }
    let change = |value: &mut f32, rng: &mut Random| {
        let noise = if kind == "gaussian" {
            rng.normal()
        } else {
            rng.signed()
        };
        let next = (*value + (noise * scale) as f32).clamp(-bound, bound);
        let changed = next != *value;
        *value = next;
        changed
    };
    let mut changed = false;
    if rate >= 0.25 {
        for value in values {
            if rng.unit() < rate {
                changed |= change(value, rng);
            }
        }
    } else {
        // The number of failures before a Bernoulli success is geometric:
        // P(gap >= k) = (1-rate)^k. Skip loci without changing their probabilities.
        let log_failure = (-rate).ln_1p();
        let mut index = 0usize;
        loop {
            let gap = ((-rng.unit()).ln_1p() / log_failure).floor() as usize;
            index = index.saturating_add(gap);
            if index >= values.len() {
                break;
            }
            changed |= change(&mut values[index], rng);
            index += 1;
        }
    }
    changed
}
pub fn express(a: &Genome, b: &Genome) -> Genome {
    let mean = |x: &[f32], y: &[f32]| x.iter().zip(y).map(|(a, b)| (a + b) * 0.5).collect();
    Genome {
        weights: mean(&a.weights, &b.weights),
        plasticity: mean(&a.plasticity, &b.plasticity),
    }
}
pub fn recombine(a: &Genome, b: &Genome, rng: &mut Random, kind: &str) -> Genome {
    Genome {
        weights: combine(&a.weights, &b.weights, rng, kind),
        plasticity: combine(&a.plasticity, &b.plasticity, rng, kind),
    }
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
pub fn genome_distance(a: &Genome, b: &Genome) -> f64 {
    (a.weights
        .iter()
        .chain(&a.plasticity)
        .zip(b.weights.iter().chain(&b.plasticity))
        .map(|(x, y)| (*x as f64 - *y as f64).powi(2))
        .sum::<f64>()
        / (PARAMETERS + 11) as f64)
        .sqrt()
}
/// Read-only RMS acquired change over the recurrent weights, excluding inherited weights.
pub fn acquired_rms(g: &Genome, state: &State, config: &Config) -> f64 {
    if config.learning != "plastic" {
        return 0.;
    }
    let mean = state
        .traces
        .iter()
        .map(|v| (*v as f64).powi(2))
        .sum::<f64>()
        / state.traces.len() as f64;
    g.plasticity[0].abs() as f64 * mean.sqrt()
}
pub fn validate(g: &Genome) -> Result<(), String> {
    if g.weights.len() != PARAMETERS
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
        assert!(!mutate_vector(
            &mut values,
            &mut rng,
            0.,
            0.1,
            16.,
            "uniform"
        ));
        assert!(mutate_vector(
            &mut values,
            &mut rng,
            0.01,
            0.1,
            16.,
            "uniform"
        ));
        let counts: Vec<_> = values
            .chunks(10000)
            .map(|bin| bin.iter().filter(|v| **v != 0.).count())
            .collect();
        assert!((850..1150).contains(&counts.iter().sum::<usize>()));
        assert!(counts.iter().all(|n| (60..140).contains(n)));
        assert!(values.iter().all(|x| x.abs() <= 0.1));
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
        assert!(s.traces.iter().any(|x| *x != 0.));
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
