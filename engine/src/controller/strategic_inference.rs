//! The same bounded projections, recurrence, activation and exact paid trace flow as reflex.
use super::*;
pub fn evaluate(g: &Genome, state: &mut State, c: &Config, paid: bool) {
    let alpha = 1. - (-state.elapsed / g.long_time(c)).exp() as f32;
    for channel in 0..HISTORY {
        let short = (state.integral[channel] / state.elapsed) as f32;
        let surprise = short - state.long[channel];
        let offset = channel * 3;
        state.inputs[offset] = short.clamp(-1., 1.);
        state.inputs[offset + 1] = surprise.clamp(-1., 1.);
        state.volatility[channel] += alpha * (surprise.abs().min(1.) - state.volatility[channel]);
        state.inputs[offset + 2] = state.volatility[channel];
        state.long[channel] += alpha * (short.clamp(-1., 1.) - state.long[channel]);
    }
    for channel in 0..EXTRA {
        state.inputs[HISTORY * 3 + channel] =
            (state.integral[HISTORY + channel] / state.elapsed).clamp(-1., 1.) as f32;
    }
    state.inputs[HISTORY * 3 + 3] = if state.path > 0. {
        (state.displacement[0].hypot(state.displacement[1]) / state.path).min(1.) as f32
    } else {
        0.
    };
    state.inputs[INPUTS - 1] = state.noise.signed() as f32;
    infer(g, state, c, paid);
    for (mean, value) in state.context_mean.iter_mut().zip(state.context) {
        *mean += alpha * (value - *mean);
    }
    state.elapsed = 0.;
    state.integral.fill(0.);
    state.displacement = [0.; 2];
    state.path = 0.;
    state.evaluations += 1;
}

fn infer(g: &Genome, state: &mut State, c: &Config, paid: bool) {
    let program = g.weights.strategic_program();
    let plastic = c.learning == "plastic";
    let alpha = if plastic { g.plasticity[0].abs() } else { 0. };
    let mut next = [0.; HIDDEN];
    program.input.apply(
        &g.weights[..RECURRENT],
        &state.inputs,
        &g.weights[BIAS..OUTPUT],
        &mut next,
    );
    let retention = g.retention();
    for (i, value) in next.iter_mut().enumerate() {
        let row = &g.weights[RECURRENT + i * HIDDEN..RECURRENT + (i + 1) * HIDDEN];
        let trace = &state.traces[i * HIDDEN..(i + 1) * HIDDEN];
        let strength: f32 = row
            .iter()
            .zip(trace)
            .map(|(w, h)| (w + alpha * h).abs())
            .sum();
        let drive = *value + super::super::arithmetic::recurrent(row, trace, &state.hidden, alpha);
        *value = retention[i] * state.hidden[i]
            + (1. - retention[i])
                * squash(super::super::bounded_drive(
                    drive,
                    program.input_strength[i] + strength,
                ));
    }
    let mut logits = [0.; OUTPUTS];
    program.output.apply(
        &g.weights[OUTPUT..OUTPUT_BIAS],
        &next,
        &g.weights[OUTPUT_BIAS..],
        &mut logits,
    );
    for (value, strength) in logits.iter_mut().zip(program.output_strength) {
        *value = squash(super::super::bounded_drive(*value, strength));
    }
    if plastic && paid {
        super::super::learning::update(
            &mut state.traces,
            &state.hidden,
            &next,
            &g.plasticity,
            squash(g.plasticity[10] * state.inputs[1]),
            c.physiology_interval,
        );
    }
    state.hidden = next;
    state.context.copy_from_slice(&logits[..4]);
    state.learning_gain = 1. + logits[4] as f64;
}
