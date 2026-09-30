//! Export canonical shade without creating cells, advancing ticks or starting a server.
use antropy_engine::config::Config;
use serde_json::json;
use std::{error::Error, fs, time::Instant};

fn main() -> Result<(), Box<dyn Error>> {
    let path = std::env::args()
        .nth(1)
        .ok_or("Expected a new output path")?;
    let mut maps = Vec::new();
    let integrated = std::env::args().nth(2).as_deref() == Some("integrated");
    let cases = if integrated {
        vec![(27, 1.)]
    } else {
        vec![(27, 1.), (101, 1.), (27, 1.5)]
    };
    for (seed, factor) in cases {
        let mut config = if integrated {
            Config::ecology()
        } else {
            Config::default()
        };
        config.width *= factor;
        config.height *= factor;
        config.validate()?;
        let nx = (config.width / config.mesh).ceil() as usize;
        let ny = (config.height / config.mesh).ceil() as usize;
        let at = Instant::now();
        let world = antropy_engine::world::World::new(seed, config.clone())?;
        let shade = &world.shade;
        let generation_ms = at.elapsed().as_secs_f64() * 1000.;
        let density = if integrated {
            antropy_engine::terrain::resource_density(seed, &config)
        } else {
            vec![]
        };
        maps.push(json!({"seed":seed,"config":config,"nx":nx,"ny":ny,
            "generationMs":generation_ms,"shade":shade,"resourceDensity":density,
            "resourceCenters":integrated.then(|| antropy_engine::terrain::resource_centers(seed, &config)),
            "sources":world.sources.iter().map(|s| &s.habitat).collect::<Vec<_>>()}));
    }
    let file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    serde_json::to_writer(file, &maps)?;
    Ok(())
}
