//! Export canonical shade without creating cells, advancing ticks or starting a server.
use antropy_engine::{config::Config, terrain::Shade};
use serde_json::json;
use std::{error::Error, fs, time::Instant};

fn main() -> Result<(), Box<dyn Error>> {
    let path = std::env::args()
        .nth(1)
        .ok_or("Expected a new output path")?;
    let mut maps = Vec::new();
    for (seed, factor) in [(27, 1.), (101, 1.), (27, 1.5)] {
        let mut config = Config::default();
        config.width *= factor;
        config.height *= factor;
        config.validate()?;
        let nx = (config.width / config.mesh).ceil() as usize;
        let ny = (config.height / config.mesh).ceil() as usize;
        let at = Instant::now();
        let shade = Shade::generate(seed, &config, nx, ny);
        maps.push(json!({"seed":seed,"config":config,"nx":nx,"ny":ny,
            "generationMs":at.elapsed().as_secs_f64()*1000.,"shade":shade}));
    }
    let file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    serde_json::to_writer(file, &maps)?;
    Ok(())
}
