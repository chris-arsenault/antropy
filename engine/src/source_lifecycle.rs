//! Exact lifecycle transitions in accrued local supply time. One draw per exhaustion.
use super::{Outcome, Source};
use crate::source_medium::Step;

impl Source {
    pub(super) fn advance_supply(&mut self, step: &Step<'_>, outcome: &mut Outcome) {
        let mut remaining = std::mem::take(&mut self.pending);
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
                self.renew(step.tick, step.config);
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
