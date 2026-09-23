//! Reservoirs project finite interfaces into the ordinary geographic medium.
use crate::{
    chemistry::{Chemistry, SPECIES},
    config::Config,
    field::Field,
    sources::Source,
    world::World,
};
use serde::Serialize;

#[derive(Clone, Copy, Debug, Serialize)]
pub struct Response {
    pub velocity: [f64; 2],
    pub signal: [f64; 2],
    pub light: f64,
    pub load: f64,
}

pub struct Step<'a> {
    pub tick: u64,
    pub config: &'a Config,
    pub chemistry: &'a Chemistry,
    pub operators: &'a crate::weathering::Operators,
    pub exposure: f64,
    pub response: Response,
    /// True at the medium interval, when accrued reservoir release is committed.
    pub release: bool,
}

/// Derived inventory reduction; rebuilt from owned material after every mutation and restore.
#[derive(Clone, Debug, Default)]
pub struct Material {
    pub valid: bool,
    pub total: f64,
    pub moments: [f64; 3],
}

impl Material {
    pub fn add(&mut self, s: usize, q: f64, chem: &Chemistry) {
        if q <= 0. {
            return;
        }
        self.total += q;
        let p = &chem.properties[s];
        for (sum, value) in
            self.moments
                .iter_mut()
                .zip([p.interaction[0], p.interaction[1], p.impedance])
        {
            *sum += q * value;
        }
    }
    pub fn read(row: impl IntoIterator<Item = f64>, chem: &Chemistry) -> Self {
        let mut result = Self {
            valid: true,
            ..Self::default()
        };
        for (s, q) in row.into_iter().enumerate() {
            result.add(s, q, chem);
        }
        result
    }
}

fn profile(s: &Source, chem: &Chemistry) -> [f64; 3] {
    let fresh;
    let material = if s.material.valid {
        &s.material
    } else {
        fresh = Material::read(s.inventory(), chem);
        &fresh
    };
    if material.total > 0. {
        return material.moments.map(|v| v / material.total);
    }
    [0.; 3]
}

/// Explicit intervention/restore boundary. Ordinary stepping uses already refreshed owners.
pub fn project(w: &mut World) {
    w.field.reset_carriers(1);
    w.field.attraction = Default::default();
    for source in &mut w.sources {
        source.refresh_material(&w.chemistry);
    }
    project_current(w);
    w.field.attraction_length = w.config.attraction_length;
    w.field.prepare_attraction();
    w.field
        .illumination
        .prepare(w.seed, w.tick, &w.config, w.field.nx, w.field.ny);
}

fn project_current(w: &mut World) {
    let area = w.field.spacing.powi(2);
    let current = w
        .sources
        .iter()
        .map(|source| {
            let total = source.material.total;
            let scale = 1. / (1. + total / source.interface) / area;
            let profile = source.material.moments.map(|v| scale * v);
            (source.footprint.clone(), profile)
        })
        .collect();
    w.field.project_sources(current);
}

pub fn response(s: &Source, _tick: u64, c: &Config, field: &Field, chem: &Chemistry) -> Response {
    response_with_gradient(s, c, field, chem, field.gradient(&s.footprint))
}

/// Pure response evaluation also supports controlled gradient probes without mutating carriers.
pub fn response_with_gradient(
    s: &Source,
    c: &Config,
    field: &Field,
    chem: &Chemistry,
    gradient: [[f64; 3]; 2],
) -> Response {
    let sites = &s.footprint;
    let p = profile(s, chem);
    let load = field.medium_load(sites).max(0.);
    let total = s.amount;
    let projected = total * p[2] / (1. + total / s.interface);
    let self_load = crate::medium_response::self_load(projected, field.spacing.powi(2), sites);
    let other_load = (field.pressure_load(sites) - self_load).max(0.);
    Response {
        light: field.illumination.sample(sites),
        velocity: crate::movement::passive(
            p,
            gradient,
            c.pressure_strength * other_load,
            crate::field::mobility(load, c.movement_impedance),
            c.source_drift,
        ),
        signal: crate::weathering::signal(std::array::from_fn(|k| {
            sites
                .iter()
                .map(|&(n, a)| a * field.medium_signal(n)[k])
                .sum()
        })),
        load,
    }
}

/// Standalone assays treat every call as a medium interval.
pub fn advance(w: &mut World) {
    advance_scheduled(w, true);
}

pub fn advance_scheduled(w: &mut World, release: bool) {
    if !w.sources.is_empty() {
        w.field.prepare_attraction();
    }
    std::sync::Arc::make_mut(w.climate.operators.as_mut().unwrap()).work_strength =
        w.config.environmental_work;
    // Each reservoir reads the frozen field and owns its inventory; shared writes follow.
    let (field, config, chemistry) = (&w.field, &w.config, &w.chemistry);
    let operators = w.climate.operators.as_ref().unwrap();
    let tick = w.tick;
    let mut outcomes = vec![crate::sources::Outcome::default(); w.sources.len()];
    let mut jobs: Vec<_> = w.sources.iter_mut().zip(outcomes.iter_mut()).collect();
    let cost = crate::parallel::cost::RESERVOIR;
    crate::parallel::for_each(&mut jobs, cost, |_, (source, outcome)| {
        let r = response(source, tick, config, field, chemistry);
        let exposure = crate::weathering::exposure(
            1.,
            r.load,
            config.habitat_feedback,
            config.diffusion_impedance,
        );
        let step = Step {
            tick,
            config,
            chemistry,
            operators,
            exposure,
            response: r,
            release,
        };
        **outcome = source.advance_local(&step, field);
    });
    drop(jobs);
    let releases: Vec<_> = w
        .sources
        .iter()
        .zip(&outcomes)
        .filter(|(_, o)| o.released > 0.)
        .map(|(s, o)| (s.footprint.as_slice(), s.mixture.as_slice(), o.released))
        .collect();
    if !releases.is_empty() {
        let loss = w.field.release_mixtures(&releases, &w.chemistry);
        w.ledger.numerical_material += loss[0];
        w.ledger.numerical_energy += loss[1];
    }
    let mut changed = false;
    for (source, outcome) in w.sources.iter_mut().zip(&outcomes) {
        source.finish(outcome, &w.config, &mut w.environment_rng, &mut w.ledger);
        changed |= outcome.changed;
    }
    if changed {
        project_current(w);
    }
}

/// Current release composition; chemical processing occurs in inventory, not during release.
pub fn observe(w: &World) -> serde_json::Value {
    let rows: Vec<_> = w.sources.iter().map(|s| {
        let r = response(s, w.tick, &w.config, &w.field, &w.chemistry);
        let rate = s.rate.min(s.amount / w.config.dt);
        let output: Vec<_> = (0..SPECIES).filter(|&id| s.mixture[id] > 0. && rate > 0.)
            .map(|id| (id, rate * s.mixture[id])).collect();
        serde_json::json!({"velocity":r.velocity,"signal":r.signal,"load":r.load,"outputRate":output})
    }).collect();
    serde_json::json!(rows)
}
