use serde::{Deserialize, Serialize};

/// Persisted independent streams; no process-global random state.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Random(pub u64);

impl Random {
    pub fn new(seed: u64) -> Self {
        Self(seed)
    }
    pub fn next_u64(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9e3779b97f4a7c15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
        z ^ (z >> 31)
    }
    pub fn unit(&mut self) -> f64 {
        (self.next_u64() >> 11) as f64 / 9007199254740992.0
    }
    pub fn index(&mut self, n: usize) -> usize {
        (self.unit() * n as f64) as usize
    }
    pub fn signed(&mut self) -> f64 {
        2.0 * self.unit() - 1.0
    }
    pub fn normal(&mut self) -> f64 {
        (-2.0 * (1.0 - self.unit()).ln()).sqrt() * (std::f64::consts::TAU * self.unit()).cos()
    }
}
