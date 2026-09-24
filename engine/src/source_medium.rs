//! Reservoirs project finite interfaces into the ordinary geographic medium.
use crate::{
    chemistry::{Chemistry, SPECIES},
    config::Config,
    field::Field,
    reservoir_coupling::Coupling,
    sources::Source,
    world::World,
};
use serde::Serialize;

#[derive(Clone, Copy, Debug, Serialize)]
pub struct Response {
    pub velocity: [f64; 2],
    /// Circle separation from overlapping reservoirs, applied unbounded like cell contact.
    pub shift: [f64; 2],
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
    /// Property means of the persistent composition, defined whether or not the reservoir
    /// holds inventory. The deposit's exposed surface carries this profile.
    pub composition: [f64; 3],
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

/// Composition property means: the exposed profile of the deposit, full or empty.
pub fn composition(mixture: &[f64], chem: &Chemistry) -> [f64; 3] {
    let mut result = Material::default();
    for (s, &q) in mixture.iter().enumerate() {
        result.add(s, q, chem);
    }
    if result.total > 0. {
        result.moments.map(|v| v / result.total)
    } else {
        [0.; 3]
    }
}

fn profile(s: &Source, chem: &Chemistry) -> [f64; 3] {
    if s.material.valid {
        s.material.composition
    } else {
        composition(&s.mixture, chem)
    }
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
            // The deposit exposes its full interface, the saturation limit of Q/(1+Q/I),
            // whatever its current fill: an emptied reservoir remains a coherent structure.
            let scale = source.interface / area;
            let profile = source.material.composition.map(|v| scale * v);
            (source.footprint.clone(), profile)
        })
        .collect();
    w.field.project_sources(current);
}

/// Single-reservoir response without reservoir-to-reservoir coupling (isolated probes).
pub fn response(s: &Source, _tick: u64, c: &Config, field: &Field, chem: &Chemistry) -> Response {
    coupled_response(s, c, field, chem, Coupling::default())
}

pub fn coupled_response(
    s: &Source,
    c: &Config,
    field: &Field,
    chem: &Chemistry,
    coupling: Coupling,
) -> Response {
    response_with_gradient(s, c, field, chem, field.gradient(&s.footprint), coupling)
}

/// Pure response evaluation also supports controlled gradient probes without mutating carriers.
/// Reservoirs couple to the shared chemical features through attraction and repulsion only;
/// crowding pressure is a dissolved-material law and is not applied to reservoirs.
pub fn response_with_gradient(
    s: &Source,
    c: &Config,
    field: &Field,
    chem: &Chemistry,
    gradient: [[f64; 3]; 2],
    coupling: Coupling,
) -> Response {
    let sites = &s.footprint;
    let p = profile(s, chem);
    let load = field.medium_load(sites).max(0.);
    let chemical = crate::medium_response::force(p, gradient, 0.);
    Response {
        light: field.illumination.sample(sites),
        velocity: crate::movement::bounded(
            [0, 1].map(|k| chemical[k] + coupling.force[k]),
            crate::field::mobility(load, c.movement_impedance),
            c.source_drift,
        ),
        shift: coupling.shift,
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
    let couplings = crate::reservoir_coupling::prepare(&w.sources, config, chemistry);
    let mut outcomes = vec![crate::sources::Outcome::default(); w.sources.len()];
    let mut jobs: Vec<_> = w
        .sources
        .iter_mut()
        .zip(outcomes.iter_mut())
        .zip(&couplings)
        .collect();
    let cost = crate::parallel::cost::RESERVOIR;
    crate::parallel::for_each(&mut jobs, cost, |_, ((source, outcome), coupling)| {
        let r = coupled_response(source, config, field, chemistry, **coupling);
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
    let couplings = crate::reservoir_coupling::prepare(&w.sources, &w.config, &w.chemistry);
    let rows: Vec<_> = w.sources.iter().zip(couplings).map(|(s, coupling)| {
        let r = coupled_response(s, &w.config, &w.field, &w.chemistry, coupling);
        let rate = s.rate.min(s.amount / w.config.dt);
        let output: Vec<_> = (0..SPECIES).filter(|&id| s.mixture[id] > 0. && rate > 0.)
            .map(|id| (id, rate * s.mixture[id])).collect();
        serde_json::json!({"velocity":r.velocity,"signal":r.signal,"load":r.load,"outputRate":output})
    }).collect();
    serde_json::json!(rows)
}
