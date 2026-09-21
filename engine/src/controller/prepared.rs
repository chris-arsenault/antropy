//! A physiological evaluation clock, integrated local cues and paid private learning.
use super::*;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Epoch {
    owner: Option<u64>,
    tau: f64,
    plastic: bool,
    inputs: Vec<f32>,
    integral: Vec<f32>,
    sampled: Vec<f64>,
    elapsed: f64,
    pub(super) hidden: Vec<f32>,
    action: Action,
    pub(super) flow: learning::Flow,
    pub preparations: u64,
    /// Identity initialization/replacement and physiological evaluations (index 2).
    pub expiry_counts: [u64; 6],
}

pub fn expiry_counts(state: &State) -> [u64; 6] {
    state.epoch.as_ref().map_or([0; 6], |e| e.expiry_counts)
}

pub fn owns_inputs(state: &State, owner: u64) -> bool {
    state.epoch.as_ref().is_some_and(|e| e.owner == Some(owner))
}

pub fn current_traces(state: &State) -> Vec<f32> {
    learning::current(state)
}

pub fn observed_state(state: &State) -> State {
    let mut observed = state.clone();
    materialize(&mut observed);
    observed
}

pub fn materialize(state: &mut State) {
    if let Some(epoch) = state.epoch.take() {
        epoch.flow.apply(&mut state.traces, &epoch.hidden);
    }
}

pub fn invalidate(state: &mut State) {
    materialize(state);
}

pub fn act_owned(
    g: &Genome,
    inputs: &[f32],
    state: &mut State,
    config: &Config,
    learn: bool,
    owner: u64,
) -> Action {
    advance_with(g, inputs, state, config, learn, (Some(owner), u64::MAX))
}

/// Physical owners publish the other channels when their local state changes.
pub fn act_published(
    g: &Genome,
    inputs: &[f32],
    state: &mut State,
    config: &Config,
    learn: bool,
    owner: u64,
) -> Action {
    publish_inputs(state, inputs, BASE_INPUTS);
    advance_with(g, inputs, state, config, learn, (Some(owner), 0))
}

pub fn publish_inputs(state: &mut State, inputs: &[f32], mut channels: u64) {
    let Some(epoch) = &mut state.epoch else {
        return;
    };
    channels &= (1_u64 << INPUTS) - 1;
    while channels != 0 {
        let i = channels.trailing_zeros() as usize;
        channels &= channels - 1;
        epoch.integral[i] += epoch.inputs[i] * (epoch.elapsed - epoch.sampled[i]) as f32;
        epoch.sampled[i] = epoch.elapsed;
        epoch.inputs[i] = inputs[i];
    }
}

pub(super) fn advance(
    g: &Genome,
    inputs: &[f32],
    state: &mut State,
    c: &Config,
    learn: bool,
    owner: Option<u64>,
) -> Action {
    advance_with(g, inputs, state, c, learn, (owner, u64::MAX))
}

fn advance_with(
    g: &Genome,
    inputs: &[f32],
    state: &mut State,
    c: &Config,
    learn: bool,
    publication: (Option<u64>, u64),
) -> Action {
    let (owner, channels) = publication;
    let plastic = c.learning == "plastic";
    if state
        .epoch
        .as_ref()
        .is_none_or(|e| e.owner != owner || e.tau != c.physiology_interval || e.plastic != plastic)
    {
        initialize(g, inputs, state, c, owner);
    }
    let mut remaining = c.dt;
    while remaining > 0. {
        let epoch = state.epoch.as_mut().unwrap();
        let span = remaining.min(epoch.tau - epoch.elapsed);
        epoch.elapsed += span;
        if plastic && learn {
            epoch.flow.paid_elapsed += span;
        }
        remaining -= span;
        if epoch.elapsed + 1e-12 >= epoch.tau {
            let mut values = [0.; INPUTS];
            for (i, value) in values.iter_mut().enumerate() {
                *value = (epoch.integral[i]
                    + epoch.inputs[i] * (epoch.elapsed - epoch.sampled[i]) as f32)
                    / epoch.elapsed as f32;
            }
            epoch.expiry_counts[2] += 1;
            evaluate(g, &values, state);
        }
    }
    // Newly observed cues belong to the next interval, never the elapsed one.
    publish_inputs(state, inputs, channels);
    state.epoch.as_ref().unwrap().action
}

fn initialize(g: &Genome, inputs: &[f32], state: &mut State, c: &Config, owner: Option<u64>) {
    let (count, mut reasons) = state
        .epoch
        .as_ref()
        .map_or((0, [0; 6]), |e| (e.preparations, e.expiry_counts));
    materialize(state);
    reasons[0] += 1;
    state.epoch = Some(Epoch {
        owner,
        tau: c.physiology_interval,
        plastic: c.learning == "plastic",
        inputs: inputs.to_vec(),
        integral: vec![0.; INPUTS],
        sampled: vec![0.; INPUTS],
        elapsed: 0.,
        hidden: vec![0.; HIDDEN],
        action: Action::default(),
        flow: learning::Flow::default(),
        preparations: count,
        expiry_counts: reasons,
    });
    evaluate(g, inputs, state);
}

fn evaluate(g: &Genome, inputs: &[f32], state: &mut State) {
    let epoch = state.epoch.as_mut().unwrap();
    epoch.flow.apply(&mut state.traces, &epoch.hidden);
    let mut values = [0.; INPUTS];
    values.copy_from_slice(inputs);
    values[34] = state.task as f32 / 255.;
    let baseline = *state.last_energy.get_or_insert(values[28]);
    let baseline = values[28] + (baseline - values[28]) * (-epoch.elapsed / epoch.tau).exp() as f32;
    let modulation = learning::modulation(g, &values, baseline);
    state.last_energy = Some(baseline);
    let alpha = if epoch.plastic {
        g.plasticity[0].abs()
    } else {
        0.
    };
    let mut next = [0.; HIDDEN];
    let program = g.weights.program();
    program.input.apply(
        &g.weights[..RECURRENT],
        &values,
        &g.weights[BIAS..OUTPUT],
        &mut next,
    );
    for (i, value) in next.iter_mut().enumerate() {
        let row = &g.weights[RECURRENT + i * HIDDEN..RECURRENT + (i + 1) * HIDDEN];
        let trace = &state.traces[i * HIDDEN..(i + 1) * HIDDEN];
        *value = squash(*value + arithmetic::recurrent(row, trace, &state.hidden, alpha));
    }
    let mut logits = [0.; TOTAL_OUTPUTS];
    program.output.apply(
        &g.weights[OUTPUT..OUTPUT_BIAS],
        &next,
        &g.weights[OUTPUT_BIAS..],
        &mut logits,
    );
    epoch.flow.prepare(g, &next, modulation);
    epoch.hidden.copy_from_slice(&state.hidden);
    epoch.elapsed = 0.;
    epoch.integral.fill(0.);
    epoch.sampled.fill(0.);
    epoch.preparations += 1;
    state.hidden.copy_from_slice(&next);
    let action = decode(&logits, state);
    state.epoch.as_mut().unwrap().action = action;
}

pub fn validate_state(state: &State) -> Result<(), String> {
    if state.hidden.len() != HIDDEN
        || state.traces.len() != HIDDEN * HIDDEN
        || state
            .hidden
            .iter()
            .chain(&state.traces)
            .any(|v| !v.is_finite() || v.abs() > 1.)
        || state.last_energy.is_some_and(|v| !v.is_finite())
    {
        return Err("Invalid private controller state".into());
    }
    if let Some(e) = &state.epoch {
        let action = &e.action;
        if [
            (&e.inputs, INPUTS),
            (&e.integral, INPUTS),
            (&e.hidden, HIDDEN),
        ]
        .iter()
        .any(|(row, size)| row.len() != *size || row.iter().any(|v| !v.is_finite()))
            || e.sampled.len() != INPUTS
            || e.sampled
                .iter()
                .any(|v| !v.is_finite() || *v < 0. || *v > e.elapsed)
            || !e.tau.is_finite()
            || e.tau <= 0.
            || !e.elapsed.is_finite()
            || e.elapsed < 0.
            || e.elapsed >= e.tau
            || !e.flow.paid_elapsed.is_finite()
            || e.flow.paid_elapsed < 0.
            || e.hidden.iter().any(|v| v.abs() > 1.)
            || e.flow.decay.iter().any(|v| !v.is_finite() || *v < 0.)
            || e.flow
                .gain
                .iter()
                .chain(&e.flow.offset)
                .any(|v| !v.is_finite())
            || [action.swim, action.turn, action.repair, action.retirement]
                .iter()
                .chain(&action.transport)
                .chain(&action.activity)
                .chain(&action.allocation)
                .any(|v| !v.is_finite() || v.abs() > 1.)
        {
            return Err("Invalid physiological controller epoch".into());
        }
    }
    Ok(())
}

#[cfg(test)]
#[path = "prepared_tests.rs"]
mod tests;
