//! Paid optical work has one interval owner. Held light samples are rates, never reserves.
use crate::{config::Config, footprint::Row, world::World};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, sync::Arc};
#[path = "optical_accumulator.rs"]
mod accumulator;

pub type Plane = BTreeMap<usize, f64>;

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct Incident {
    pub lateral: Arc<Plane>,
    pub upward: Arc<Plane>,
    /// Last paid interval power, for bounded emitter markers and selected-cell inspection.
    pub emitters: BTreeMap<u64, f64>,
    #[serde(skip)]
    deposits: [accumulator::Accumulator; 2],
    #[serde(skip)]
    kernel: crate::source_footprint::Kernel,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct Exposure {
    pub solar: f64,
    pub emitted: f64,
    pub funded: f64,
}
impl Exposure {
    pub fn reserve(solar: f64, emitted: f64, work: f64, bound: f64) -> Self {
        Self {
            solar,
            emitted,
            funded: if bound > 0. {
                emitted.min(work / bound)
            } else {
                emitted
            },
        }
    }
    pub fn light(self) -> f64 {
        self.solar + self.emitted
    }
    pub fn drive(self) -> f64 {
        self.solar + self.funded
    }
    pub fn paid_fraction(self) -> f64 {
        if self.drive() > 0. {
            self.funded / self.drive()
        } else {
            0.
        }
    }
}

impl Incident {
    pub fn validate(&self, nodes: usize) -> Result<(), String> {
        if self.emitters.values().any(|v| !v.is_finite() || *v < 0.)
            || [&self.lateral, &self.upward]
                .into_iter()
                .flat_map(|p| p.iter())
                .any(|(&n, &v)| n >= nodes || !v.is_finite() || v < 0.)
        {
            return Err("Invalid held optical sample".into());
        }
        Ok(())
    }
}

pub fn bind(w: &mut World) {
    w.field.illumination.emission = w.incident.lateral.clone();
    w.cover.illumination.emission = w.incident.upward.clone();
}

/// Bound the shared coefficient over every possible product mixture and normalized medium.
pub fn work_bound(w: &World) -> f64 {
    let range = [0, 1].map(|k| {
        let lo = w
            .chemistry
            .properties
            .iter()
            .map(|p| p.interaction[k])
            .fold(f64::INFINITY, f64::min);
        let hi = w
            .chemistry
            .properties
            .iter()
            .map(|p| p.interaction[k])
            .fold(f64::NEG_INFINITY, f64::max);
        (hi - lo) / 4.
    });
    w.config.environmental_work * range[0].max(range[1])
}

fn radiate(w: &mut World, sites: &[Row], dt: f64) -> (Plane, Plane) {
    w.incident.emitters.clear();
    let geometry = crate::spatial::Geometry::new(w.field.nx, w.field.ny);
    let [lateral, upward] = &mut w.incident.deposits;
    lateral.reset(geometry);
    upward.reset(geometry);
    let kernel = &mut w.incident.kernel;
    let mut spread = Vec::new();
    for (cell, footprint) in w.cells.iter_mut().zip(sites) {
        let capacity =
            dt * w.config.motor_power_density * cell.body[crate::organism::EMITTER_STOCK];
        let requested = capacity * (1. - cell.damage) * cell.action.emission;
        cell.activity.add(crate::activity::EMITTER, 0., capacity);
        if requested == 0. {
            continue;
        }
        let paid = cell.pay(requested);
        cell.activity.add(crate::activity::EMITTER, paid, 0.);
        if paid > 0. {
            w.incident.emitters.insert(cell.id, paid / dt);
        }
        cell.flows.emission += paid;
        w.ledger.optical_heat += paid;
        let half = paid * w.config.conversion_efficiency / 2.;
        if half == 0. {
            continue;
        }
        kernel.prepare(w.config.optical_reach, &w.field);
        kernel.translate(cell.x, cell.y, &w.field, &mut spread);
        for &(n, weight) in &spread {
            lateral.add(n, half * weight);
        }
        for &(n, weight) in footprint {
            let tau = w.field.illumination.cover.get(&n).copied().unwrap_or(0.);
            upward.add(n, half * weight * -(-tau).exp_m1());
        }
    }
    (lateral.plane(), upward.plane())
}

fn mixture_mass(w: &World, sites: &[Row], light: &Plane) -> Plane {
    let mut mass: Plane = light
        .keys()
        .map(|&n| (n, w.field.amounts().site(n).2[0]))
        .collect();
    for (cell, row) in w.cells.iter().zip(sites) {
        let material = cell.material();
        for &(n, a) in row {
            if let Some(q) = mass.get_mut(&n) {
                *q += a * material;
            }
        }
    }
    for source in &w.sources {
        for &(n, a) in &source.footprint {
            if let Some(q) = mass.get_mut(&n) {
                *q += a * source.amount;
            }
        }
    }
    mass
}

fn sample(row: &[(usize, f64)], plane: &Plane) -> f64 {
    row.iter()
        .map(|&(n, a)| a * plane.get(&n).copied().unwrap_or(0.))
        .sum()
}

fn rate(work: &Plane, c: &Config, dt: f64) -> Arc<Plane> {
    let scale = 1. / (dt * c.mesh.powi(2) * c.optical_power_density);
    Arc::new(
        work.iter()
            .filter_map(|(&n, &q)| (q > 0.).then_some((n, q * scale)))
            .collect(),
    )
}

fn cell_exposures(
    w: &World,
    sites: &[Row],
    per_material: &Plane,
    bound: f64,
) -> Vec<([f64; 2], Exposure)> {
    let mut exposures = vec![([0.; 2], Exposure::default()); w.cells.len()];
    crate::parallel::for_each(
        &mut exposures,
        crate::parallel::cost::CELL_READ,
        |i, out| {
            let (cell, row) = (&w.cells[i], &sites[i]);
            let external = w.field.signal_sample(row);
            let signal =
                crate::metabolism::light_environment(cell, &w.config, &w.chemistry, external);
            let light = Exposure::reserve(
                row.iter()
                    .map(|&(n, a)| a * w.field.illumination.solar(n))
                    .sum(),
                sample(row, &w.incident.lateral),
                cell.material() * sample(row, per_material),
                bound * cell.material(),
            );
            *out = (signal, light);
        },
    );
    exposures
}

/// Conditional snapshot estimate only. The next physical boundary pays and reserves again.
pub fn observed_cell_exposures(w: &World, sites: &[Row]) -> Vec<([f64; 2], Exposure)> {
    let mass = mixture_mass(w, sites, &w.incident.lateral);
    let scale =
        w.config.physiology_interval * w.config.mesh.powi(2) * w.config.optical_power_density;
    let per_material = w
        .incident
        .lateral
        .iter()
        .map(|(&n, &light)| {
            (
                n,
                if mass[&n] > 0. {
                    light * scale / mass[&n]
                } else {
                    0.
                },
            )
        })
        .collect();
    cell_exposures(w, sites, &per_material, work_bound(w))
}

/// Transport and cover exchange precede this call. All chemical recipients then consume
/// one immutable allocation, independent of processing order and recipient count.
pub fn prepare(w: &mut World, sites: &[Row], dt: f64) -> Vec<([f64; 2], Exposure)> {
    let (lateral, upward) = radiate(w, sites, dt);
    let mass = mixture_mass(w, sites, &lateral);
    let per_material: Plane = lateral
        .iter()
        .map(|(&n, &e)| (n, if mass[&n] > 0. { e / mass[&n] } else { 0. }))
        .collect();
    w.incident.lateral = rate(&lateral, &w.config, dt);
    w.incident.upward = rate(&upward, &w.config, dt);
    bind(w);
    let bound = work_bound(w);
    let cells = cell_exposures(w, sites, &per_material, bound);
    let source_light: Vec<_> = w
        .sources
        .iter()
        .map(|s| {
            (
                crate::weathering::signal(w.field.signal_sample(&s.footprint)),
                w.field.medium_load(&s.footprint).max(0.),
                Exposure::reserve(
                    s.footprint
                        .iter()
                        .map(|&(n, a)| a * w.field.illumination.solar(n))
                        .sum(),
                    sample(&s.footprint, &w.incident.lateral),
                    s.amount * sample(&s.footprint, &per_material),
                    bound * s.amount,
                ),
            )
        })
        .collect();
    public(w, dt, bound, &per_material, &upward);
    crate::source_medium::photochemistry(w, dt, &source_light);
    cells
}

fn public(w: &mut World, dt: f64, bound: f64, per_material: &Plane, upward: &Plane) {
    w.climate.prepare(&w.config);
    let fields = [(&mut w.field, false), (&mut w.cover, true)];
    for (field, film) in fields {
        let allocation = if film { upward } else { per_material };
        let (balance, paid) =
            field.photochemistry(&w.chemistry, &w.climate, dt, allocation, !film, bound);
        w.ledger.numerical_material += balance.roundoff_matter;
        w.ledger.numerical_energy += balance.roundoff_energy;
        w.ledger.weathering_work += balance.weathering_work;
        w.ledger.weathering_heat += balance.weathering_heat;
        w.ledger.weathered_material += balance.weathered_material;
        w.ledger.sheltered_conversion += balance.sheltered_conversion;
        w.ledger.optical_heat -= paid;
        w.ledger.optical_captured += paid;
    }
}
