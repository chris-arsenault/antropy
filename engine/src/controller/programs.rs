//! Neural ports move with enzyme programs; physiology never inspects weights.
use super::*;

/// The realized-activity input that belongs to an enzyme program's ports.
pub const fn activity_input(slot: usize) -> usize {
    ACTIVITY_INPUT + 4 + slot
}
pub(super) fn seed_requests(weights: &mut [f32]) {
    weights[OUTPUT_BIAS + ACTIVITY..OUTPUT_BIAS + COVER].fill(3.);
}

/// Handcrafted diagnostics still run ordinary neural inference and paid physical actions.
pub fn optical(g: &mut Genome, cover: f32, emission: f32, response: Option<(usize, usize, f32)>) {
    g.weights[OUTPUT_BIAS + COVER] = cover;
    g.weights[OUTPUT_BIAS + EMISSION] = emission;
    if let Some((input, output, gain)) = response {
        assert!(input < INPUTS && output < TOTAL_OUTPUTS);
        g.weights[input] = 1.;
        g.weights[OUTPUT + output * HIDDEN] = gain;
    }
}
pub fn duplicate(g: &mut Genome, source: usize, destination: usize) {
    let (from, to) = (activity_input(source), activity_input(destination));
    for h in 0..HIDDEN {
        let value = g.weights[h * INPUTS + from] * 0.5;
        g.weights[h * INPUTS + from] = value;
        g.weights[h * INPUTS + to] = value;
    }
    let (from, to) = (ACTIVITY + source, ACTIVITY + destination);
    for h in 0..HIDDEN {
        g.weights[OUTPUT + to * HIDDEN + h] = g.weights[OUTPUT + from * HIDDEN + h];
    }
    g.weights[OUTPUT_BIAS + to] = g.weights[OUTPUT_BIAS + from];
}
pub fn remove(g: &mut Genome, slot: usize) {
    for h in 0..HIDDEN {
        g.weights[h * INPUTS + activity_input(slot)] = 0.;
    }
    let output = ACTIVITY + slot;
    g.weights[OUTPUT + output * HIDDEN..OUTPUT + (output + 1) * HIDDEN].fill(0.);
    g.weights[OUTPUT_BIAS + output] = 0.;
}
#[cfg(test)]
pub(crate) fn permute(g: &Genome, order: [usize; crate::organism::MAX_ENZYMES]) -> Genome {
    let mut result = g.clone();
    for (to, from) in order.into_iter().enumerate() {
        for h in 0..HIDDEN {
            result.weights[h * INPUTS + activity_input(to)] =
                g.weights[h * INPUTS + activity_input(from)];
        }
        let (from, to) = (ACTIVITY + from, ACTIVITY + to);
        for h in 0..HIDDEN {
            result.weights[OUTPUT + to * HIDDEN + h] = g.weights[OUTPUT + from * HIDDEN + h];
        }
        result.weights[OUTPUT_BIAS + to] = g.weights[OUTPUT_BIAS + from];
    }
    result
}
