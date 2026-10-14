//! Activity-dependent plastic output bias. Chemical demand stays in physical surroundings.
use super::{Config, DRIVE_LIMIT, Genome, HIDDEN, State, TOTAL_OUTPUTS};

pub const CHANNELS: usize = crate::activity::ACTUATORS;

pub const fn ports(channel: usize) -> (usize, usize) {
    match channel {
        0..4 => (super::ACTIVITY_INPUT + channel, 5 + channel),
        4..12 => (
            super::ACTIVITY_INPUT + channel,
            super::ACTIVITY + channel - 4,
        ),
        12 => (super::BUILDER_INPUT, super::COVER),
        13 => (super::EMITTER_INPUT, super::EMISSION),
        _ => panic!("Unknown activity channel"),
    }
}

pub fn targets(inputs: &[f32]) -> [f32; CHANNELS] {
    std::array::from_fn(|i| inputs[ports(i).0])
}

pub fn advance(state: &mut [f32; CHANNELS], target: &[f32; CHANNELS], time: f64, rate: f64) {
    let change = -(-rate * time).exp_m1() as f32;
    for (value, target) in state.iter_mut().zip(target) {
        *value = (*value + change * (*target - *value)).clamp(-1., 1.);
    }
}

pub fn gain(g: &Genome) -> f32 {
    // A learned bias is expressed in the same units as the bounded neural drive.
    DRIVE_LIMIT * g.plasticity[0].abs()
}

pub fn project(g: &Genome, state: &State, c: &Config) -> [f32; TOTAL_OUTPUTS] {
    let mut bias = [0.; TOTAL_OUTPUTS];
    if c.activity_reinforcement && c.reflex_plastic() {
        for (i, value) in state.allocation.iter().enumerate() {
            bias[ports(i).1] = gain(g) * value;
        }
    }
    bias
}

pub fn learning_multiplier(c: &Config) -> f64 {
    1. + if c.activity_reinforcement {
        CHANNELS as f64 / (HIDDEN * HIDDEN) as f64
    } else {
        0.
    }
}

#[cfg(test)]
mod tests;
