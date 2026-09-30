//! Exact lifecycle transitions in accrued local supply time. One draw per exhaustion.
use super::{Outcome, Source};
use crate::source_medium::Step;

impl Source {
    pub(super) fn advance_supply(
        &mut self,
        step: &Step<'_>,
        outcome: &mut Outcome,
        carried: f64,
        start: [f64; 2],
        delta: [f64; 2],
        geography: &crate::geography::Geography,
    ) {
        let mut remaining = std::mem::take(&mut self.pending);
        let total = remaining;
        if self.rate == 0. {
            return;
        }
        while remaining > 0. {
            if self.amount == 0. {
                let waited = remaining.min(self.wait);
                self.wait -= waited;
                remaining -= waited;
                if self.wait > 0. {
                    break;
                }
                let elapsed = renewal_time(
                    geography,
                    step,
                    start,
                    delta,
                    (total - remaining - carried).max(0.),
                );
                let c = step.config;
                let position = [
                    (start[0] + delta[0] * elapsed / c.dt).rem_euclid(c.width),
                    (start[1] + delta[1] * elapsed / c.dt).rem_euclid(c.height),
                ];
                self.renew(step.tick + u64::from(elapsed >= c.dt), position, c);
                if self.amount == 0. {
                    break;
                }
                outcome.changed = true;
                for (s, q) in self.inventory().enumerate() {
                    outcome.supplied[0] += q;
                    outcome.supplied[1] += q * step.chemistry.properties[s].potential;
                }
            }
            let exhausted = self.amount <= self.rate * remaining;
            let duration = (self.amount / self.rate).min(remaining);
            let q = if exhausted {
                self.amount
            } else {
                duration * self.rate
            };
            if q > 0. {
                // Parcels retain composition if an epoch/zone refill changes it within this step.
                if let Some((mix, quantity)) = outcome
                    .parcels
                    .last_mut()
                    .filter(|(mix, _)| *mix == self.mixture)
                {
                    let _ = mix;
                    *quantity += q;
                } else {
                    outcome.parcels.push((self.mixture.clone(), q));
                }
                self.amount = (self.amount - q).max(0.);
                outcome.released += q;
                outcome.changed = true;
            }
            remaining = (remaining - duration).max(0.);
            if self.amount == 0. {
                self.wait = -(1. - self.renewal_rng.unit()).ln() * step.config.source_gap;
            }
        }
    }
}

/// Invert the same monotone seasonal integral used for this movement interval.
/// Only actual renewals need a location; ordinary accrual remains one scalar per source.
fn renewal_time(
    g: &crate::geography::Geography,
    step: &Step<'_>,
    start: [f64; 2],
    delta: [f64; 2],
    supply: f64,
) -> f64 {
    let c = step.config;
    if !g.config.seasons {
        return supply.min(c.dt);
    }
    let midpoint = [0, 1].map(|k| start[k] + delta[k] / 2.);
    if supply == 0. {
        return 0.;
    }
    if supply >= g.supply_time(midpoint, step.tick as f64 * c.dt, c.dt) {
        return c.dt;
    }
    let (mut lo, mut hi) = (0., c.dt);
    for _ in 0..40 {
        let t = (lo + hi) / 2.;
        if g.supply_time(midpoint, step.tick as f64 * c.dt, t) < supply {
            lo = t;
        } else {
            hi = t;
        }
    }
    (lo + hi) / 2.
}
