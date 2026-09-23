//! Steps a default world and writes physical checkpoints at a fixed interval.
//! Usage: advance_world SEED TICKS INTERVAL OUTPUT_DIR THREADS
use antropy_engine::{config::Config, world::World};
use std::{path::Path, time::Instant};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let seed: u64 = args[0].parse()?;
    let ticks: u64 = args[1].parse()?;
    let interval: u64 = args[2].parse()?;
    let output = Path::new(&args[3]);
    let threads: usize = args[4].parse()?;
    std::fs::create_dir_all(output)?;
    let pool = rayon::ThreadPoolBuilder::new()
        .num_threads(threads)
        .build()?;
    pool.install(|| -> Result<(), String> {
        let mut w = World::new(seed, Config::default())?;
        let start = Instant::now();
        while w.tick < ticks {
            w.step();
            if w.tick % interval == 0 {
                std::fs::write(output.join(format!("t{}.bin", w.tick)), w.snapshot()?)
                    .map_err(|e| e.to_string())?;
                println!(
                    "tick {} population {} elapsed {:.0}s stop {:?}",
                    w.tick,
                    w.cells.len(),
                    start.elapsed().as_secs_f64(),
                    w.stop_reason
                );
            }
            if w.stop_reason.is_some() {
                break;
            }
        }
        Ok(())
    })?;
    Ok(())
}
