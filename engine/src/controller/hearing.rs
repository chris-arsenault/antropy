//! Exactly-once message/bearing moments; a pending impulse is not a held sensory channel.
use serde::{Deserialize, Serialize};
pub const CHANNELS: usize = 27;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Hearing {
    pub pending: [f64; CHANNELS],
    pub last: [f32; CHANNELS],
}
impl Default for Hearing {
    fn default() -> Self {
        Self {
            pending: [0.; CHANNELS],
            last: [0.; CHANNELS],
        }
    }
}
impl Hearing {
    pub fn receive(&mut self, byte: u8, direction: [f64; 2], gain: f64) {
        for component in 0..9 {
            let symbol = if component == 0 {
                1.
            } else {
                2. * ((byte >> (component - 1)) & 1) as f64 - 1.
            };
            for (axis, moment) in [1., direction[0], direction[1]].into_iter().enumerate() {
                self.pending[component * 3 + axis] += gain * symbol * moment;
            }
        }
    }
    pub fn consume(&mut self) -> [f32; CHANNELS] {
        let scale = 1. + self.pending[0];
        self.last = self.pending.map(|v| (v / scale) as f32);
        self.pending.fill(0.);
        self.last
    }
    pub fn validate(&self) -> bool {
        self.pending[0] >= 0.
            && self
                .pending
                .iter()
                .all(|v| v.is_finite() && v.abs() <= self.pending[0] + 1e-9)
            && self.last.iter().all(|v| v.is_finite() && v.abs() <= 1.)
    }
}

/// Coarse listener-relative bearing; half-world ties and coincident centers are ambiguous.
pub fn direction(displacement: [f64; 2], heading: f64, dimensions: [f64; 2]) -> [f64; 2] {
    if displacement == [0.; 2]
        || displacement
            .iter()
            .zip(dimensions)
            .any(|(v, size)| v.abs() == size / 2.)
    {
        return [0.; 2];
    }
    let angle =
        (displacement[1].atan2(displacement[0]) - heading).rem_euclid(std::f64::consts::TAU);
    let sector = ((angle * 16. / std::f64::consts::TAU + 0.5).floor() as usize) % 16;
    let (sin, cos) = (sector as f64 * std::f64::consts::TAU / 16.).sin_cos();
    [cos, sin]
}
