//! Bounded controller-owned diagnostics; observations never advance either clock.
use super::{Config, Genome, State, strategic};
use serde_json::{Value, json};

pub fn inspect(g: &Genome, state: &State, c: &Config) -> Value {
    let observed = super::observed_state(state);
    let state = &observed;
    let allocation_bias = super::allocation::project(g, state, c);
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
        "strategicInputs":s.inputs,"hearing":state.hearing.last,"pendingHearing":pending,
        "activityReinforcement":{"state":state.allocation,
            "bias":(0..super::allocation::CHANNELS).map(|i|
                allocation_bias[super::allocation::ports(i).1]).collect::<Vec<_>>(),
            "ports":(0..super::allocation::CHANNELS).map(super::allocation::ports).collect::<Vec<_>>(),
            "enabled":c.activity_reinforcement && c.reflex_plastic(),
            "rate":g.plasticity[1].abs(),"gain":super::allocation::gain(g)}})
}

pub fn retention_mean(g: &Genome) -> f64 {
    g.strategy
        .retention()
        .iter()
        .map(|v| *v as f64)
        .sum::<f64>()
        / strategic::HIDDEN as f64
}
