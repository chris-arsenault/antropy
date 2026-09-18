//! Same parent, successive ordinary inheritance calls; zero World ticks.
use antropy_engine::{config::Config, world::World};
use serde_json::json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let output = std::env::args().nth(1).ok_or("Expected new-output.json")?;
    let mut w = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 0,
            learning: "static".into(),
            learning_retention: 0.,
            ..Config::default()
        },
    )?;
    let parent = &w.genomes[&1];
    let mut rows = vec![];
    for id in 2..5 {
        let before = w.genetic_rng.0;
        let g = parent.inherit(
            id,
            0,
            &w.cells[0].brain,
            &mut w.genetic_rng,
            &w.config,
            &w.chemistry,
        );
        rows.push(json!({"genotype":g,"randomBefore":before,"randomAfter":w.genetic_rng.0}));
    }
    let file = std::fs::OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&output)?;
    serde_json::to_writer_pretty(file, &json!({"worldTicks":w.tick,"offspring":rows}))?;
    println!("{output}: three inheritance calls, zero World ticks");
    Ok(())
}
