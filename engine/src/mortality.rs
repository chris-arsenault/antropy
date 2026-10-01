//! Physical-time loss history. Rates are material/time; biomass is bound material.
use crate::{config::Config, world::World};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct History {
    pub death_rate: f64,
    pub growth_rate: f64,
    pub biomass: f64,
    /// Living mass held over the next physical interval, independent of observers.
    pub living: f64,
    pub dead_body: f64,
    pub recovered: f64,
    pub spill: f64,
}
impl History {
    pub fn new(living: f64) -> Self {
        Self {
            biomass: living,
            living,
            ..Self::default()
        }
    }
    pub fn advance(&mut self, dt: f64, tau: f64) {
        let fraction = -(-dt / tau).exp_m1();
        self.death_rate *= 1. - fraction;
        self.growth_rate *= 1. - fraction;
        self.biomass += fraction * (self.living - self.biomass);
    }
    pub fn grow(&mut self, amount: f64, tau: f64) {
        self.growth_rate += amount / tau;
    }
    pub fn severity(&self, c: &Config) -> f64 {
        if self.biomass == 0. {
            return 0.;
        }
        c.mortality_memory * (self.death_rate - self.growth_rate).max(0.) / self.biomass
    }
    pub fn response(&self, c: &Config) -> f64 {
        if !c.mortality_recovery {
            return 0.;
        }
        let h = self.severity(c);
        (h / h.hypot(c.mortality_half_response)).powi(2)
    }
    pub fn deaths(&mut self, amount: f64, reference: f64, c: &Config) -> f64 {
        assert!(amount == 0. || (reference > 0. && self.biomass > 0.));
        self.death_rate += amount / c.mortality_memory;
        self.dead_body += amount;
        self.response(c)
    }
    pub fn validate(&self) -> Result<(), String> {
        if [
            self.death_rate,
            self.growth_rate,
            self.biomass,
            self.living,
            self.dead_body,
            self.recovered,
            self.spill,
        ]
        .iter()
        .any(|v| !v.is_finite() || *v < 0.)
            || self.recovered > self.dead_body + 1e-9
        {
            return Err("Invalid mortality history".into());
        }
        Ok(())
    }
}
pub fn rebase(w: &mut World) {
    w.mortality = History::new(w.cells.iter().map(|c| c.mass()).sum());
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn held_decay_subdivides_and_balanced_growth_cancels_loss() {
        let c = Config {
            mortality_recovery: true,
            ..Config::default()
        };
        let mut a = History::new(10.);
        a.deaths(2., 10., &c);
        assert!(a.response(&c) > 0.);
        a.grow(2., c.mortality_memory);
        assert_eq!(a.response(&c), 0.);
        a.living = 7.;
        let mut b = a.clone();
        a.advance(12., c.mortality_memory);
        for _ in 0..120 {
            b.advance(0.1, c.mortality_memory);
        }
        assert!((a.biomass - b.biomass).abs() < 1e-12);
        assert!((a.death_rate - b.death_rate).abs() < 1e-12);
        let mut empty = History::new(0.);
        empty.advance(100., c.mortality_memory);
        assert_eq!(empty.response(&c), 0.);
    }
}
