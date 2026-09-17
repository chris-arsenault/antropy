//! Registered 300-tick cell-free probes using the production source and field operators.
use crate::{config::Config, source_medium, world::World};
use serde_json::{Value, json};

fn fixture(name: &str, chemistry_seed: u64) -> World {
    let c = Config {
        width: 24.,
        height: 24.,
        mesh: 2.,
        founders: 0,
        source_count: 1,
        source_priming: 0.,
        source_species: vec![0, 80],
        chemistry_seed,
        physiology_interval: 0.2,
        source_drift: if name == "fixed" { 0. } else { 1. },
        source_processing: if name == "raw" { 0. } else { 1. },
        ..Config::default()
    };
    let mut w = World::new(27, c).unwrap();
    w.sources[0].habitat.x = 12.;
    w.sources[0].habitat.y = 12.;
    w.sources[0].habitat.radius = 2.;
    w.sources[0].rebuild(&w.config, &w.field);
    for n in 0..w.field.nx * w.field.ny {
        let x = (n % w.field.nx) as f64 * w.config.mesh + w.config.mesh / 2.;
        let sign = if name == "reversed" { -1. } else { 1. };
        let q = if name == "bare" {
            0.
        } else {
            4. * (0.3 + sign * 0.25 * (x / 24. * std::f64::consts::TAU).sin())
        };
        w.field.add(n, 15, q, &w.chemistry);
        if name == "dense" {
            w.field.add(n, 15, 40., &w.chemistry);
        }
    }
    let (matter, energy) = w.held();
    w.ledger.initial_material = matter;
    w.ledger.initial_energy = energy;
    source_medium::project(&mut w);
    w
}

fn advance(w: &mut World) {
    source_medium::advance(w);
    w.climate.prepare(&w.config);
    let b = w.field.advance_weathered(
        &w.chemistry,
        w.config.dt,
        w.config.washout,
        w.config.diffusion_impedance,
        Some(&mut w.climate),
    );
    w.ledger.washed_out += b.matter;
    w.ledger.washout_energy += b.energy;
    w.ledger.numerical_material += b.roundoff_matter;
    w.ledger.numerical_energy += b.roundoff_energy;
    w.ledger.weathering_heat += b.weathering_heat;
    w.ledger.weathered_material += b.weathered_material;
    w.ledger.sheltered_conversion += b.sheltered_conversion;
    w.tick += 1;
}

pub fn run(chemistry_seed: u64) -> Value {
    let results: Vec<_> = ["bare", "gradient", "reversed", "dense", "fixed", "raw"]
        .into_iter()
        .map(|name| {
            let mut w = fixture(name, chemistry_seed);
            let initial = json!({"source":w.sources[0],"summary":crate::observation::summary(&w),
                "response":source_medium::observe(&w)});
            let mut samples = vec![];
            for _ in 0..300 {
                advance(&mut w);
                if w.tick.is_multiple_of(25) {
                    samples.push(json!({"tick":w.tick,"x":w.sources[0].habitat.x,
                        "y":w.sources[0].habitat.y,"summary":crate::observation::summary(&w),
                        "response":source_medium::observe(&w)}));
                }
            }
            json!({"name":name,"config":w.config,"initial":initial,"samples":samples,
                "finalSource":w.sources[0],"final":crate::observation::summary(&w)})
        })
        .collect();
    json!({"registration":"ENVIRONMENTAL-ECOLOGY-PLAN.md#ecology-correction","seed":27,"chemistrySeed":chemistry_seed,
        "ticksPerCase":300,"cases":results})
}
