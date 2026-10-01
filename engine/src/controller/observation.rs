//! Bounded controller-owned diagnostics; observations never advance either clock.
use super::{Config, Genome, State, strategic};
use serde_json::{Value, json};

pub fn inspect(g: &Genome, state: &State, c: &Config) -> Value {
    let s = &state.strategy;
    let pending = state
        .hearing
        .pending
        .map(|v| v / (1. + state.hearing.pending[0]));
    json!({"context":s.displayed(),"generatedContext":s.context,"contextMean":s.context_mean,
        "clamped":s.clamp_context,"learningGain":s.learning_gain,
        "retention":g.strategy.retention(),"longTime":g.strategy.long_time(c),
        "interval":strategic::interval(c),"elapsed":s.elapsed,"evaluations":s.evaluations,
        "neighbors":&s.extra[22..26],"neighborCoverage":s.extra[26],
        "strategicInputs":s.inputs,"hearing":state.hearing.last,"pendingHearing":pending})
}

pub fn retention_mean(g: &Genome) -> f64 {
    g.strategy
        .retention()
        .iter()
        .map(|v| *v as f64)
        .sum::<f64>()
        / strategic::HIDDEN as f64
}
