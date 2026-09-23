//! Zero-tick force diagnosis. Calls ordinary projection, gradients and source response.
use antropy_engine::{
    chemistry, config, field, footprint, movement, source_medium, sources::Source, world,
};
use config::Config;
use field::Field;
use serde_json::{Value, json};
use world::World;

// Reuse private production modules without widening the engine's public API.
#[allow(dead_code)]
#[path = "../src/medium_response.rs"]
mod medium_response;

fn norm(v: [f64; 2]) -> f64 {
    v[0].hypot(v[1])
}

fn profile(s: &Source) -> [f64; 3] {
    if s.material.total > 0. {
        return s.material.moments.map(|v| v / s.material.total);
    }
    [0.; 3]
}

fn terms(w: &World, s: &Source) -> Value {
    let p = profile(s);
    let gradient = w.field.gradient(&s.footprint);
    // Since v41 reservoirs carry no crowding pressure: the chemical force is the signed terms.
    let signed = gradient.map(|g| p[0] * g[0] - p[1] * g[1]);
    let force = medium_response::force(p, gradient, 0.);
    let load = w.field.medium_load(&s.footprint);
    let velocity = movement::passive(
        p,
        gradient,
        0.,
        antropy_engine::field::mobility(load, w.config.movement_impedance),
        w.config.source_drift,
    );
    let ordinary = source_medium::response(s, w.tick, &w.config, &w.field, &w.chemistry);
    for k in 0..2 {
        assert!((velocity[k] - ordinary.velocity[k]).abs() < 1e-12);
        assert!((force[k] - signed[k]).abs() < 1e-12);
    }
    json!({"profile":p,"gradient":gradient,"signed":signed,"force":force,"velocity":velocity,
        "load":load,"inventory":s.material.total,"interface":s.interface})
}

fn snapshot(path: &str) -> Result<Value, Box<dyn std::error::Error>> {
    let mut w = World::restore(&std::fs::read(path)?)?;
    // This historical decomposition diagnoses the local-law identity limit.
    w.config.attraction_length = 0.;
    w.field.attraction_length = 0.;
    // This is the body projection made immediately before source response in World::advance.
    let sites: Vec<_> = w
        .cells
        .iter()
        .map(|c| footprint::sites(c, &w.config, &w.field))
        .collect();
    footprint::deposit_profiles(&w.cells, &w.config, &mut w.field, &sites);
    let mut channels = Vec::new();
    for kind in ["reservoirs", "dissolved", "bodies"] {
        let mut f = Field::new(w.config.width, w.config.height, w.config.mesh);
        match kind {
            "reservoirs" => {
                let mut isolated = w.clone();
                isolated.field = f;
                source_medium::project(&mut isolated);
                f = isolated.field;
            }
            "dissolved" => {
                f.replace_material(&w.chemistry, |i| w.field.amounts()[i]);
            }
            _ => {
                footprint::deposit_profiles(&w.cells, &w.config, &mut f, &sites);
            }
        }
        channels.push((kind, f));
    }
    let rows: Vec<_> = w
        .sources
        .iter()
        .enumerate()
        .map(|(id, s)| {
            let mut row = terms(&w, s);
            let p = profile(s);
            let other = row["otherLoad"].as_f64().unwrap();
            let mut parts = serde_json::Map::new();
            let mut sum = [0.; 2];
            for (name, field) in &channels {
                let g = field.gradient(&s.footprint);
                let force = medium_response::force(p, g, w.config.pressure_strength * other);
                for k in 0..2 {
                    sum[k] += force[k];
                }
                parts.insert(
                    (*name).into(),
                    json!({"force":force,"norm":norm(force),"gradient":g}),
                );
            }
            for (k, value) in sum.iter().enumerate() {
                assert!((value - row["force"][k].as_f64().unwrap()).abs() < 1e-11);
            }
            let nearest = w
                .sources
                .iter()
                .enumerate()
                .filter(|(j, _)| *j != id)
                .map(|(_, b)| {
                    movement::distance(
                        [s.habitat.x, s.habitat.y],
                        [b.habitat.x, b.habitat.y],
                        &w.config,
                    )
                })
                .fold(f64::INFINITY, f64::min);
            row["channels"] = Value::Object(parts);
            row["id"] = json!(id);
            row["position"] = json!([s.habitat.x, s.habitat.y]);
            row["radius"] = json!(s.habitat.radius);
            row["nearest"] = json!(nearest);
            row["amount"] = json!(s.amount);
            row["wait"] = json!(s.wait);
            row
        })
        .collect();
    Ok(json!({"path":path,"tick":w.tick,"population":w.cells.len(),"sources":rows}))
}

fn fixture() -> World {
    let c = Config {
        width: 128.,
        height: 64.,
        founders: 0,
        source_count: 2,
        source_species: vec![0, 136],
        source_priming: 0.,
        attraction_length: 0., // Historical local-law baseline; candidate filtering is explicit.
        ..Config::default()
    };
    let mut w = World::new(27, c).unwrap();
    for (i, s) in w.sources.iter_mut().enumerate() {
        s.habitat.x = 32.3 + 4. * i as f64;
        s.habitat.y = 31.1;
        s.habitat.radius = 3.;
        s.habitat.share = 0.6;
        s.rebuild(&w.config, &w.field);
        s.rate = 0.;
    }
    w
}

fn set_pair(w: &mut World, distance: f64, ratio: f64, second: usize, empty: bool) {
    for (j, s) in w.sources.iter_mut().enumerate() {
        s.habitat.x = 32.3 + distance * j as f64;
        s.rebuild(&w.config, &w.field);
        s.mixture.fill(0.);
        s.mixture[0] += 0.6;
        s.mixture[second] += 0.4;
        s.amount = 0.;
        if !empty || j == 0 {
            s.amount = ratio * s.interface;
        }
    }
    source_medium::project(w);
}

fn pair_curves() -> Vec<Value> {
    let mut w = fixture();
    let mut rows = Vec::new();
    for ratio in [0.01, 0.1, 1., 10.] {
        for second in [136, 8, 128] {
            for empty in [false, true] {
                for pressure in [0., 0.0003, 0.003] {
                    w.config.pressure_strength = pressure;
                    for distance in [1., 2., 4., 6., 8., 10., 12., 16., 20., 24., 32.] {
                        set_pair(&mut w, distance, ratio, second, empty);
                        let a = terms(&w, &w.sources[0]);
                        let b = terms(&w, &w.sources[1]);
                        let relative =
                            b["velocity"][0].as_f64().unwrap() - a["velocity"][0].as_f64().unwrap();
                        rows.push(json!({"ratio":ratio,"secondSpecies":second,"emptySecond":empty,
                            "pressureStrength":pressure,"distance":distance,"separationRate":relative,
                            "first":a,"second":b}));
                    }
                }
            }
        }
    }
    rows
}

fn backgrounds() -> Vec<Value> {
    let mut w = fixture();
    let mut rows = Vec::new();
    for species in [0, 8, 128, 136] {
        for concentration in [0.01, 0.1] {
            w.field = Field::new(w.config.width, w.config.height, w.config.mesh);
            for n in 0..w.field.nx * w.field.ny {
                w.field.add(
                    n,
                    species,
                    concentration * w.config.mesh.powi(2),
                    &w.chemistry,
                );
            }
            for distance in [2., 4., 6., 8., 10., 12., 16., 20.] {
                set_pair(&mut w, distance, 1., 136, false);
                let a = terms(&w, &w.sources[0]);
                let b = terms(&w, &w.sources[1]);
                rows.push(json!({"species":species,"concentration":concentration,"distance":distance,
                    "separationRate":b["velocity"][0].as_f64().unwrap()-a["velocity"][0].as_f64().unwrap(),
                    "first":a,"second":b}));
            }
        }
    }
    rows
}

// A normalized even filter gives the attractive row a distinct interaction length.
// Probe the selected compact operator through its configuration boundary.
// The earlier Gaussian carrier mutation experiment is historical; it must not bypass ownership.
fn broaden_attraction(w: &mut World, length: f64) {
    w.field.attraction_length = length;
    w.field.prepare_attraction();
}

fn candidate_curves() -> Vec<Value> {
    let mut w = fixture();
    let mut rows = Vec::new();
    for sigma in [3., 6.] {
        for second in [136, 8, 128] {
            for empty in [false, true] {
                for distance in [1., 2., 4., 6., 8., 10., 12., 16., 20., 24., 32.] {
                    set_pair(&mut w, distance, 1., second, empty);
                    broaden_attraction(&mut w, sigma);
                    let a = terms(&w, &w.sources[0]);
                    let b = terms(&w, &w.sources[1]);
                    if empty {
                        assert!(
                            a["velocity"].as_array().unwrap().iter().all(|v| v
                                .as_f64()
                                .unwrap()
                                .abs()
                                < 1e-12)
                        );
                    }
                    rows.push(json!({"sigma":sigma,"distance":distance,"secondSpecies":second,
                        "emptySecond":empty,"first":a,"second":b,
                        "separationRate":b["velocity"][0].as_f64().unwrap()-a["velocity"][0].as_f64().unwrap()}));
                }
            }
        }
    }
    rows
}

fn cluster_curves() -> Vec<Value> {
    let mut c = fixture().config;
    c.source_count = 7;
    c.height = 128.;
    let mut w = World::new(27, c).unwrap();
    let mut rows = Vec::new();
    for sigma in [0., 6.] {
        for radius in [4., 8., 12., 16., 20., 24.] {
            for center_species in [136, 8, 128] {
                for empty_center in [false, true] {
                    for (j, s) in w.sources.iter_mut().enumerate() {
                        let angle = (j as f64 - 1.) * std::f64::consts::TAU / 6.;
                        let r = if j == 0 { 0. } else { radius };
                        s.habitat.x = 64.3 + r * angle.cos();
                        s.habitat.y = 63.1 + r * angle.sin();
                        s.habitat.radius = 3.;
                        s.habitat.share = 0.6;
                        s.rebuild(&w.config, &w.field);
                        s.mixture.fill(0.);
                        s.mixture[0] = 0.6;
                        s.mixture[if j == 0 { center_species } else { 136 }] += 0.4;
                        s.amount = 0.;
                        if j > 0 || !empty_center {
                            s.amount = s.interface;
                        }
                    }
                    source_medium::project(&mut w);
                    if sigma > 0. {
                        broaden_attraction(&mut w, sigma);
                    }
                    let radial: Vec<_> = w
                        .sources
                        .iter()
                        .enumerate()
                        .skip(1)
                        .map(|(j, s)| {
                            let angle = (j as f64 - 1.) * std::f64::consts::TAU / 6.;
                            let v = source_medium::response(
                                s,
                                w.tick,
                                &w.config,
                                &w.field,
                                &w.chemistry,
                            )
                            .velocity;
                            v[0] * angle.cos() + v[1] * angle.sin()
                        })
                        .collect();
                    rows.push(
                        json!({"sigma":sigma,"radius":radius,"centerSpecies":center_species,
                        "emptyCenter":empty_center,"radialVelocities":radial}),
                    );
                }
            }
        }
    }
    rows
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let snapshots: Vec<_> = std::env::args()
        .skip(1)
        .map(|p| snapshot(&p))
        .collect::<Result<_, _>>()?;
    println!(
        "{}",
        json!({"ticksAdvanced":0,"registration":"docs/design/resource-binding-investigation.md",
        "snapshots":snapshots,"pairCurves":pair_curves(),"backgrounds":backgrounds(),
        "candidateCurves":candidate_curves(),"clusterCurves":cluster_curves()})
    );
    Ok(())
}
