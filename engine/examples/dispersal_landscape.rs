//! Bounded ordinary source-only relaxation; exports geometry and accounted supply locally.
use antropy_engine::{config::Config, world::World};
use serde_json::json;
use std::{fs, time::Instant};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let directory = std::env::args()
        .nth(1)
        .ok_or("Expected new output directory")?;
    fs::create_dir(&directory)?;
    let mut w = World::new(
        27,
        Config {
            founders: 0,
            source_priming: 0.,
            ..Config::default()
        },
    )?;
    let report = |w: &World, seconds: f64| {
        let sources: Vec<_> = w
            .sources
            .iter()
            .map(|s| {
                json!({
                    "x": s.habitat.x, "y": s.habitat.y, "radius": s.habitat.radius,
                    "amount": s.amount, "rate": s.rate,
                })
            })
            .collect();
        json!({"version":w.version,"seed":w.seed,"tick":w.tick,"wallSeconds":seconds,
            "config":w.config,"sources":sources,"ledger":w.ledger,
            "nominalSupply":w.sources.iter().map(|s|s.rate*w.config.source_lifetime/
                (w.config.source_lifetime+w.config.source_gap)).sum::<f64>()})
    };
    fs::write(
        format!("{directory}/initial.json"),
        serde_json::to_vec(&report(&w, 0.))?,
    )?;
    let started = Instant::now();
    while w.tick < 500 && started.elapsed().as_secs_f64() < 120. {
        w.step();
    }
    fs::write(
        format!("{directory}/final.json"),
        serde_json::to_vec(&report(&w, started.elapsed().as_secs_f64()))?,
    )?;
    println!(
        "tick={} wall={:.2}s output={directory}",
        w.tick,
        started.elapsed().as_secs_f64()
    );
    Ok(())
}
