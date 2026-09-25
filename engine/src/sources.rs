use crate::{
    accounting::Ledger,
    chemistry::{Chemistry, SPECIES},
    config::Config,
    field::Field,
    random::Random,
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Habitat {
    pub x: f64,
    pub y: f64,
    pub radius: f64,
    pub richness: f64,
    pub share: f64,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Source {
    pub habitat: Habitat,
    pub amount: f64,
    pub wait: f64,
    pub rate: f64,
    /// Inventory is amount * mixture; at zero amount this is only the supply condition.
    pub mixture: Vec<f64>,
    #[serde(skip)]
    pub footprint: Vec<(usize, f64)>,
    #[serde(skip)]
    pub kernel: crate::source_footprint::Kernel,
    #[serde(skip)]
    pub material: crate::source_medium::Material,
    #[serde(skip)]
    pub interface: f64,
    /// Stocked time not yet released; restore derives it from the shared medium clock.
    #[serde(skip)]
    pub pending: f64,
}
/// One reservoir's step results that touch shared state: ledger flows and medium release.
#[derive(Clone, Copy, Debug, Default)]
pub struct Outcome {
    pub changed: bool,
    pub conversion: [f64; 3],
    pub distance: f64,
    pub supplied: [f64; 2],
    pub released: f64,
}
impl Source {
    pub fn new(habitat: Habitat, tick: u64, c: &Config, rng: &mut Random, field: &Field) -> Self {
        let rate = c.source_rate * habitat.richness;
        let amount = rate * c.source_lifetime * (0.5 + rng.unit());
        let shares = composition(&habitat, tick, c);
        let mut mixture = vec![0.; SPECIES];
        for (i, &s) in c.source_species.iter().enumerate() {
            mixture[s] += shares[i];
        }
        let mut source = Self {
            habitat,
            amount,
            wait: 0.,
            rate,
            mixture,
            footprint: vec![],
            kernel: Default::default(),
            material: Default::default(),
            interface: 0.,
            pending: 0.,
        };
        source.rebuild(c, field);
        source
    }
    pub fn rebuild(&mut self, _c: &Config, field: &Field) {
        self.kernel.prepare(self.habitat.radius, field);
        self.kernel
            .translate(self.habitat.x, self.habitat.y, field, &mut self.footprint);
        // Node order lets carrier updates merge old and new footprints without re-sorting.
        self.footprint.sort_unstable_by_key(|&(n, _)| n);
        self.interface =
            field.spacing.powi(2) / self.footprint.iter().map(|(_, a)| a * a).sum::<f64>();
    }
    pub fn release(
        &mut self,
        fraction: f64,
        field: &mut Field,
        chemistry: &Chemistry,
        ledger: &mut Ledger,
    ) {
        let released = self.withdraw(fraction, chemistry);
        ledger.source_released += released;
        let loss = field.release_mixtures(&[(&self.footprint, &self.mixture, released)], chemistry);
        ledger.numerical_material += loss[0];
        ledger.numerical_energy += loss[1];
    }
    /// Removes a fraction of the inventory; the caller commits it to the medium.
    fn withdraw(&mut self, fraction: f64, chemistry: &Chemistry) -> f64 {
        let released = self.amount * fraction.clamp(0., 1.);
        self.amount -= released;
        self.refresh_material(chemistry);
        released
    }
    pub fn inventory(&self) -> impl Iterator<Item = f64> + '_ {
        self.mixture.iter().map(|share| self.amount * share)
    }
    pub fn refresh_material(&mut self, chemistry: &Chemistry) {
        self.material = crate::source_medium::Material::read(self.inventory(), chemistry);
        self.material.composition = crate::source_medium::composition(&self.mixture, chemistry);
    }
    /// Serial composition of the two phases; World runs `advance_local` across reservoirs.
    pub fn advance(
        &mut self,
        step: &crate::source_medium::Step<'_>,
        rng: &mut Random,
        field: &mut Field,
        ledger: &mut Ledger,
    ) -> bool {
        let outcome = self.advance_local(step, field);
        if outcome.released > 0. {
            let loss = field.release_mixtures(
                &[(&self.footprint, &self.mixture, outcome.released)],
                step.chemistry,
            );
            ledger.numerical_material += loss[0];
            ledger.numerical_energy += loss[1];
        }
        self.finish(&outcome, step.config, rng, ledger);
        outcome.changed
    }

    /// Conversion, motion, renewal and withdrawal of accrued release. Reads only the frozen
    /// field; the medium commit, ledger and ordered random draws follow in `finish`.
    pub fn advance_local(
        &mut self,
        step: &crate::source_medium::Step<'_>,
        field: &Field,
    ) -> Outcome {
        let c = step.config;
        let chemistry = step.chemistry;
        let conversion = self.convert(step);
        let mut outcome = Outcome {
            conversion: conversion.map(|v| self.amount * v),
            ..Outcome::default()
        };
        let r = &step.response;
        let [dx, dy] = [0, 1].map(|k| (r.velocity[k] + r.shift[k]) * c.dt);
        outcome.changed = dx != 0. || dy != 0. || (self.amount > 0. && conversion[0] > 0.);
        if dx != 0. || dy != 0. {
            self.habitat.x = (self.habitat.x + dx).rem_euclid(c.width);
            self.habitat.y = (self.habitat.y + dy).rem_euclid(c.height);
            outcome.distance = dx.hypot(dy);
            self.rebuild(c, field);
        }
        if self.amount == 0. {
            self.pending = 0.;
            self.wait = (self.wait - c.dt).max(0.);
            if self.wait > 0. || self.rate == 0. {
                return outcome;
            }
            self.renew(step.tick, c);
            outcome.changed = true;
            for (s, q) in self.inventory().enumerate() {
                outcome.supplied[0] += q;
                outcome.supplied[1] += q * chemistry.properties[s].potential;
            }
        }
        if self.rate > 0. && self.amount > 0. {
            self.pending += c.dt;
        }
        if step.release && self.pending > 0. && self.amount > 0. {
            // The medium diffuses, is sensed and exchanges only at its interval; release
            // accrues until then and commits the same rate-times-time supply in one pass.
            outcome.changed = true;
            let elapsed = std::mem::take(&mut self.pending);
            outcome.released =
                self.withdraw((self.rate * elapsed / self.amount).min(1.), chemistry);
        } else if outcome.changed || !self.material.valid {
            self.refresh_material(chemistry);
        }
        outcome
    }

    /// Ledger accounts and, at exhaustion, the ordered renewal draw.
    pub fn finish(&mut self, outcome: &Outcome, c: &Config, rng: &mut Random, ledger: &mut Ledger) {
        ledger.source_converted += outcome.conversion[0];
        ledger.source_heat += outcome.conversion[1];
        ledger.source_work += outcome.conversion[2];
        ledger.source_distance += outcome.distance;
        ledger.supplied += outcome.supplied[0];
        ledger.supplied_energy += outcome.supplied[1];
        ledger.source_released += outcome.released;
        if outcome.released > 0. && self.amount == 0. {
            // Independent renewal with mean source_gap; sample only at exhaustion.
            self.wait = -(1. - rng.unit()).ln() * c.source_gap;
        }
    }

    fn convert(&mut self, step: &crate::source_medium::Step<'_>) -> [f64; 3] {
        let c = step.config;
        self.convert_medium(
            step.operators,
            crate::reaction_medium::Medium::illuminated(step.response.signal, step.response.light),
            step.chemical_dt * c.weathering_rate * c.source_processing * step.exposure,
        )
    }

    pub(crate) fn convert_medium(
        &mut self,
        operators: &crate::weathering::Operators,
        medium: crate::reaction_medium::Medium,
        elapsed: f64,
    ) -> [f64; 3] {
        let accounts = operators
            .inventory_active(
                &mut self.mixture,
                medium,
                elapsed,
                f32::EPSILON as f64,
                u64::MAX,
            )
            .0;
        if accounts[0] > 0. {
            let total: f64 = self.mixture.iter().sum();
            for q in &mut self.mixture {
                *q /= total;
            }
        }
        accounts
    }

    fn renew(&mut self, tick: u64, c: &Config) {
        if c.source_epochs.is_some() || c.source_zones.is_some() {
            self.mixture.fill(0.);
            for (&s, q) in c
                .source_species
                .iter()
                .zip(composition(&self.habitat, tick, c))
            {
                self.mixture[s] += q;
            }
        }
        self.amount = c.source_lifetime * self.rate;
        self.wait = 0.;
        self.material.valid = false;
    }
}
pub(crate) fn composition(h: &Habitat, tick: u64, c: &Config) -> Vec<f64> {
    if let Some(zones) = &c.source_zones {
        return zones[((h.x / c.width) * zones.len() as f64) as usize].clone();
    }
    if let Some(epochs) = &c.source_epochs {
        return epochs.mixtures[(tick / epochs.phase_ticks) as usize % epochs.mixtures.len()]
            .clone();
    }
    if c.source_species.len() == 2 {
        vec![h.share, 1. - h.share]
    } else {
        vec![1. / c.source_species.len() as f64; c.source_species.len()]
    }
}
pub fn landscape(c: &Config, rng: &mut Random) -> (Vec<[f64; 2]>, Vec<Habitat>) {
    let centers: Vec<_> = (0..c.landscape_regions)
        .map(|_| [rng.unit() * c.width, rng.unit() * c.height])
        .collect();
    let weights: Vec<_> = centers
        .iter()
        .map(|_| 0.2 + 4. * rng.unit().powi(2))
        .collect();
    let total = weights.iter().sum::<f64>();
    let habitats = (0..c.source_count)
        .map(|i| {
            let mut draw = rng.unit() * total;
            let region = weights
                .iter()
                .position(|w| {
                    draw -= w;
                    draw <= 0.
                })
                .unwrap_or(0);
            let center = centers[if i < 3 { 0 } else { region }];
            let angle = rng.unit() * std::f64::consts::TAU;
            let reach = c.landscape_spread * rng.unit().sqrt();
            let mut x = (center[0] + angle.cos() * reach).rem_euclid(c.width);
            if let Some(zones) = &c.source_zones {
                x = ((i % zones.len()) as f64 + x / c.width) * c.width / zones.len() as f64;
            }
            Habitat {
                x,
                y: (center[1] + angle.sin() * reach).rem_euclid(c.height),
                radius: c.source_radius * (0.6 + rng.unit()),
                richness: 0.3 + 2. * rng.unit().powi(2),
                share: 0.55 + 0.1 * rng.unit(),
            }
        })
        .collect();
    (centers, habitats)
}
