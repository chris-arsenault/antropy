//! A paid clock advances bounded affine trace flows without touching every trace each tick.
use super::{Epoch, Genome, HIDDEN, State, arithmetic, squash};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub(super) struct Flow {
    pub decay: [f32; HIDDEN],
    pub gain: [f32; HIDDEN],
    pub offset: [f32; HIDDEN],
    pub paid_elapsed: f64,
}

pub(super) fn modulation(g: &Genome, inputs: &[f32], baseline: f32) -> f32 {
    let p = &g.plasticity;
    squash(
        p[6] * inputs[1]
            + p[7] * inputs[5]
            + p[8] * inputs[9]
            + p[9] * inputs[13]
            + p[10] * (inputs[28] - baseline),
    )
}

impl Flow {
    pub fn prepare(&mut self, g: &Genome, next: &[f32], modulation: f32) {
        let p = &g.plasticity;
        let eta = p[1].abs();
        self.paid_elapsed = 0.;
        for (i, &y) in next.iter().enumerate() {
            let decay = eta * y * y;
            let gain = eta * modulation * (p[2] * y + p[3]);
            let offset = eta * modulation * (p[4] * y + p[5]);
            self.decay[i] = decay;
            self.gain[i] = gain;
            self.offset[i] = offset;
        }
    }
    pub fn apply(&self, trace: &mut [f32], pre: &[f32]) {
        if self.paid_elapsed == 0. {
            return;
        }
        for i in 0..HIDDEN {
            apply_row(
                &mut trace[i * HIDDEN..(i + 1) * HIDDEN],
                pre,
                [self.decay[i], self.gain[i], self.offset[i]],
                self.paid_elapsed,
            );
        }
    }
}

fn apply_row(trace: &mut [f32], pre: &[f32], [decay, gain, offset]: [f32; 3], elapsed: f64) {
    let lambda = decay as f64;
    let change = (-lambda * elapsed).exp_m1();
    let integrated = if lambda == 0. {
        elapsed
    } else {
        -change / lambda
    };
    arithmetic::trace_row(
        trace,
        pre,
        (1. + change) as f32,
        (gain as f64 * integrated) as f32,
        (offset as f64 * integrated) as f32,
    );
}

pub(super) fn update(
    trace: &mut [f32],
    pre: &[f32],
    next: &[f32],
    p: &[f32],
    modulation: f32,
    elapsed: f64,
) {
    let eta = p[1].abs();
    for (i, &y) in next.iter().enumerate() {
        let flow = [
            eta * y * y,
            eta * modulation * (p[2] * y + p[3]),
            eta * modulation * (p[4] * y + p[5]),
        ];
        apply_row(
            &mut trace[i * pre.len()..(i + 1) * pre.len()],
            pre,
            flow,
            elapsed,
        );
    }
}

pub(super) fn current(state: &State) -> Vec<f32> {
    let mut trace = state.traces.clone();
    if let Some(Epoch { flow, hidden, .. }) = &state.epoch {
        flow.apply(&mut trace, hidden);
    }
    trace
}
