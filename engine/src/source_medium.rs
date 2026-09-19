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
    pub load: f64,
}

pub struct Step<'a> {
    pub tick: u64,
    pub config: &'a Config,
    pub chemistry: &'a Chemistry,
    pub operators: &'a crate::weathering::Operators,
    pub exposure: f64,
    pub response: Response,
}

/// Derived inventory reduction; rebuilt from owned material after every mutation and restore.
#[derive(Clone, Debug, Default)]
pub struct Material {
    pub valid: bool,
    pub mask: u64,
    pub total: f64,
    pub moments: [f64; 3],
}

impl Material {
    pub fn add(&mut self, s: usize, q: f64, chem: &Chemistry) {
        if q <= 0. {
            return;
        }
        self.mask |= 1 << (s / 4);
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
    pub fn read(row: &[f64], chem: &Chemistry) -> Self {
        let mut result = Self {
            valid: true,
            ..Self::default()
        };
        for (s, &q) in row.iter().enumerate() {
            result.add(s, q, chem);
        }
        result
    }
}

fn profile(s: &Source, tick: u64, c: &Config, chem: &Chemistry) -> [f64; 3] {
    let fresh;
    let material = if s.material.valid {
        &s.material
    } else {
        fresh = Material::read(&s.inventory, chem);
        &fresh
    };
    if material.total > 0. {
        return material.moments.map(|v| v / material.total);
    }
    let mut incoming = Material::default();
    for (&species, share) in c
        .source_species
        .iter()
        .zip(crate::sources::composition(&s.habitat, tick, c))
    {
        incoming.add(species, share, chem);
    }
    incoming.moments
}

/// Explicit intervention/restore boundary. Ordinary stepping uses already refreshed owners.
pub fn project(w: &mut World) {
    for source in &mut w.sources {
        source.material = Material::read(&source.inventory, &w.chemistry);
    }
    project_current(w);
    w.field.attraction_length = w.config.attraction_length;
    w.field.prepare_attraction();
}

fn project_current(w: &mut World) {
    for n in w.field.source_nodes.drain(..) {
        w.field.source_signal[n] = [0.; 2];
        w.field.source_load[n] = 0.;
        w.field.source_listed[n] = false;
    }
    let area = w.field.spacing.powi(2);
    for source in &w.sources {
        let total = source.material.total;
        if total == 0. {
            continue;
        }
        let scale = 1. / (1. + total / source.interface) / area;
        for &(node, a) in &source.footprint {
            if !w.field.source_listed[node] {
                w.field.source_nodes.push(node);
                w.field.source_listed[node] = true;
            }
            for (k, value) in source.material.moments[..2].iter().enumerate() {
                w.field.source_signal[node][k] += a * scale * value;
            }
            w.field.source_load[node] += a * scale * source.material.moments[2];
        }
    }
}

pub fn response(s: &Source, tick: u64, c: &Config, field: &Field, chem: &Chemistry) -> Response {
    let sites = &s.footprint;
    let p = profile(s, tick, c, chem);
    let load = field.medium_load(sites).max(0.);
    let total: f64 = if s.material.valid {
        s.material.total
    } else {
        s.inventory.iter().sum()
    };
    let projected = total * p[2] / (1. + total / s.interface);
    let self_load = crate::medium_response::self_load(projected, field.spacing.powi(2), sites);
    let other_load = (field.pressure_load(sites) - self_load).max(0.);
    Response {
        velocity: crate::movement::passive(
            p,
            field.gradient(sites),
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

pub fn advance(w: &mut World) {
    if !w.sources.is_empty() {
        w.field.prepare_attraction();
    }
    w.climate.operators.as_mut().unwrap().work_strength = w.config.environmental_work;
    let responses: Vec<_> = w
        .sources
        .iter()
        .map(|s| {
            let r = response(s, w.tick, &w.config, &w.field, &w.chemistry);
            (
                r,
                crate::weathering::exposure(
                    1.,
                    r.load,
                    w.config.habitat_feedback,
                    w.config.diffusion_impedance,
                ),
            )
        })
        .collect();
    let mut changed = false;
    for (source, (response, exposure)) in w.sources.iter_mut().zip(responses) {
        changed |= source.advance(
            &Step {
                tick: w.tick,
                config: &w.config,
                chemistry: &w.chemistry,
                operators: w.climate.operators.as_ref().unwrap(),
                exposure,
                response,
            },
            &mut w.environment_rng,
            &mut w.field,
            &mut w.ledger,
        );
    }
    if changed {
        project_current(w);
    }
}

/// Current release composition; chemical processing occurs in inventory, not during release.
pub fn observe(w: &World) -> serde_json::Value {
    let rows: Vec<_> = w.sources.iter().map(|s| {
        let r = response(s, w.tick, &w.config, &w.field, &w.chemistry);
        let total = s.inventory.iter().sum::<f64>();
        let rate = if s.remaining > 0. { s.rate.min(total / w.config.dt) } else { 0. };
        let output: Vec<_> = (0..SPECIES).filter(|&id| s.inventory[id] > 0.)
            .map(|id| (id, rate * s.inventory[id] / total)).collect();
        serde_json::json!({"velocity":r.velocity,"signal":r.signal,"load":r.load,"outputRate":output})
    }).collect();
    serde_json::json!(rows)
}
