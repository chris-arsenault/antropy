use crate::{
    accounting::Ledger,
    chemistry::{Chemistry, SPECIES},
    config::Config,
    field::Field,
    movement::distance,
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
        };
        source.rebuild(c, field);
        source
    }
    pub fn rebuild(&mut self, c: &Config, field: &Field) {
        self.footprint.clear();
        let radius = self.habitat.radius.max(field.spacing * 0.25);
        let mut total = 0.;
        for y in 0..field.ny {
            for x in 0..field.nx {
                let d = distance(
                    [
                        (x as f64 + 0.5) * field.spacing,
                        (y as f64 + 0.5) * field.spacing,
                    ],
                    [self.habitat.x, self.habitat.y],
                    c,
                );
                if d <= 3. * radius {
                    let w = (-d * d / (2. * radius * radius)).exp();
                    self.footprint.push((y * field.nx + x, w));
                    total += w;
                }
            }
        }
        if total == 0. {
            self.footprint = field.stencil(self.habitat.x, self.habitat.y).to_vec();
        } else {
            for (_, w) in &mut self.footprint {
                *w /= total;
            }
        }
    }
    pub fn release(
        &mut self,
        fraction: f64,
        field: &mut Field,
        chemistry: &Chemistry,
        ledger: &mut Ledger,
    ) {
        for (s, q) in self.inventory.iter_mut().enumerate() {
            let released = *q * fraction;
            if released <= 0. {
                continue;
            }
            *q -= released;
            for &(node, w) in &self.footprint {
                let loss = field.add(node, s, released * w, chemistry);
                ledger.rounding(loss, s, chemistry);
            }
        }
    }
    pub fn advance(
        &mut self,
        tick: u64,
        c: &Config,
        rng: &mut Random,
        field: &mut Field,
        chemistry: &Chemistry,
        ledger: &mut Ledger,
    ) {
        if self.remaining <= 0. {
            self.wait -= c.dt;
            if self.wait > 0. {
                return;
            }
            *self = Self::new(self.habitat.clone(), tick, c, rng, field);
            for (s, q) in self.inventory.iter().enumerate() {
                ledger.supplied += q;
                ledger.supplied_energy += q * chemistry.properties[s].potential;
            }
        }
        let total = self.inventory.iter().sum::<f64>();
        self.release(
            (self.rate * c.dt / total.max(1e-300)).min(1.),
            field,
            chemistry,
            ledger,
        );
        self.remaining -= c.dt;
        if self.remaining <= 0. || total <= self.rate * c.dt {
            self.release(1., field, chemistry, ledger);
            self.remaining = 0.;
            self.wait = -(1. - rng.unit()).ln() * c.source_gap;
        }
    }
}
fn composition(h: &Habitat, tick: u64, c: &Config) -> Vec<f64> {
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
