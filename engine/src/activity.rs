//! Realized actuator activity. Every paid actuator reports its accepted effect since the last
//! physiology publication relative to itself plus its full-effort capacity over the same time.
//! The reading changes with local availability, storage, energy, injury and chosen effort.
use serde::{Deserialize, Serialize};

pub const TRANSPORTERS: usize = 0;
pub const ENZYMES: usize = 4;
pub const BUILDER: usize = 12;
pub const EMITTER: usize = 13;
pub const ACTUATORS: usize = 14;

/// Accepted signed effect and full-effort capacity per actuator.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Activity([[f64; 2]; ACTUATORS]);
impl Activity {
    pub fn add(&mut self, actuator: usize, accepted: f64, capacity: f64) {
        self.0[actuator][0] += accepted;
        self.0[actuator][1] += capacity;
    }
    /// Bounded signed reading `a/(|a|+capacity)`; zero for an absent or idle actuator.
    pub fn reading(&self, actuator: usize) -> f32 {
        let [accepted, capacity] = self.0[actuator];
        let scale = accepted.abs() + capacity;
        if scale > 0. {
            (accepted / scale) as f32
        } else {
            0.
        }
    }
    pub fn reset(&mut self) {
        self.0 = [[0.; 2]; ACTUATORS];
    }
    pub fn validate(&self) -> bool {
        self.0.iter().flatten().all(|v| v.is_finite()) && self.0.iter().all(|a| a[1] >= 0.)
    }
}
