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
    pub remaining: f64,
    pub wait: f64,
    pub rate: f64,
    pub inventory: Vec<f64>,
    #[serde(skip)]
    pub footprint: Vec<(usize, f64)>,
    #[serde(skip)]
    pub kernel: crate::source_footprint::Kernel,
    #[serde(skip)]
    pub material: crate::source_medium::Material,
    #[serde(skip)]
    pub interface: f64,
}
impl Source {
    pub fn new(habitat: Habitat, tick: u64, c: &Config, rng: &mut Random, field: &Field) -> Self {
        let duration = 0.5 + 4. * rng.unit().powi(2);
        let remaining = c.source_lifetime * duration * (0.5 + rng.unit());
        let rate = c.source_rate * (0.4 + 1.2 * rng.unit()) / duration.sqrt() * habitat.richness;
        let shares = composition(&habitat, tick, c);
        let mut inventory = vec![0.; SPECIES];
        for (i, &s) in c.source_species.iter().enumerate() {
            inventory[s] += remaining * rate * shares[i];
        }
        let mut source = Self {
            habitat,
            remaining,
            wait: 0.,
            rate,
            inventory,
            footprint: vec![],
            kernel: Default::default(),
            material: Default::default(),
            interface: 0.,
        };
        source.rebuild(c, field);
        source
    }
    pub fn rebuild(&mut self, _c: &Config, field: &Field) {
        self.kernel.prepare(self.habitat.radius, field);
        self.kernel
            .translate(self.habitat.x, self.habitat.y, field, &mut self.footprint);
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
        let mut mask = if self.material.valid {
            self.material.mask
        } else {
            u64::MAX
        };
        let mut material = crate::source_medium::Material {
            valid: true,
            ..Default::default()
        };
        while mask != 0 {
            let start = mask.trailing_zeros() as usize * 4;
            mask &= mask - 1;
            for s in start..start + 4 {
                let released = self.inventory[s] * fraction;
                self.inventory[s] -= released;
                material.add(s, self.inventory[s], chemistry);
                if released <= 0. {
                    continue;
                }
                ledger.source_released += released;
                for &(node, w) in &self.footprint {
                    let loss = field.add(node, s, released * w, chemistry);
                    ledger.rounding(loss, s, chemistry);
                }
            }
        }
        self.material = material;
    }
    pub fn advance(
        &mut self,
        step: &crate::source_medium::Step<'_>,
        rng: &mut Random,
        field: &mut Field,
        ledger: &mut Ledger,
    ) -> bool {
        let c = step.config;
        let chemistry = step.chemistry;
        let [dx, dy] = step.response.velocity.map(|v| v * c.dt);
        let mut changed = dx != 0. || dy != 0.;
        if dx != 0. || dy != 0. {
            self.habitat.x = (self.habitat.x + dx).rem_euclid(c.width);
            self.habitat.y = (self.habitat.y + dy).rem_euclid(c.height);
            ledger.source_distance += dx.hypot(dy);
            self.rebuild(c, field);
        }
        if self.remaining <= 0. {
            self.wait -= c.dt;
            if self.wait > 0. {
                return changed;
            }
            *self = Self::new(self.habitat.clone(), step.tick, c, rng, field);
            changed = true;
            for (s, q) in self.inventory.iter().enumerate() {
                ledger.supplied += q;
                ledger.supplied_energy += q * chemistry.properties[s].potential;
            }
        }
        if !self.material.valid {
            self.material = crate::source_medium::Material::read(&self.inventory, chemistry);
        }
        let total = self.material.total;
        let (conversion, mask) = step.operators.inventory_active(
            &mut self.inventory,
            step.response.signal,
            c.dt * c.weathering_rate * c.source_processing * step.exposure,
            crate::field_activity::CONCENTRATION_FLOOR as f64 * self.interface,
            self.material.mask,
        );
        self.material.mask = mask;
        ledger.source_converted += conversion[0];
        ledger.source_heat += conversion[1];
        if conversion[0] > 0. || (self.rate > 0. && total > 0.) {
            changed = true;
            self.release(
                (self.rate * c.dt / total.max(1e-300)).min(1.),
                field,
                chemistry,
                ledger,
            );
        }
        self.remaining -= c.dt;
        if self.remaining <= 1e-12 || total <= self.rate * c.dt {
            changed |= self.material.total > 0.;
            self.release(1., field, chemistry, ledger);
            self.remaining = 0.;
            self.wait = -(1. - rng.unit()).ln() * c.source_gap;
        }
        changed
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
                share: 0.05 + 0.9 * rng.unit(),
            }
        })
        .collect();
    (centers, habitats)
}
