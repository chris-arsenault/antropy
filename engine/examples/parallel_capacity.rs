//! Bounded same-kernel comparison; output is experimental data, not a source artifact.
use antropy_engine::{config::Config, world::World};
use std::time::Instant;

fn main() {
    let args: Vec<_> = std::env::args().collect();
    let workers: usize = args[1].parse().unwrap();
    let output = &args[2];
    let pool = rayon::ThreadPoolBuilder::new()
        .num_threads(workers)
        .build()
        .unwrap();
    let result = pool.install(|| {
        let mut world = if let Some(path) = args.get(3) {
            World::restore(&std::fs::read(path).unwrap()).unwrap()
        } else {
            let mut w = World::new(101, Config::default()).unwrap();
            antropy_engine::commands::load_fixture(&mut w, 2000).unwrap();
            w
        };
        for _ in 0..10 {
            world.step();
        }
        let start = Instant::now();
        let mut phases = [0.; 9];
        let mut ticks = 0;
        while ticks < 100 && start.elapsed().as_secs_f64() < 60. {
            let measured = world.step_measured(|| start.elapsed().as_secs_f64() * 1000.);
            for (sum, value) in phases.iter_mut().zip(measured) {
                *sum += value;
            }
            ticks += 1;
        }
        let elapsed = start.elapsed().as_secs_f64();
        world.validate().unwrap();
        serde_json::json!({"workers": workers, "ticks": ticks, "seconds": elapsed,
            "ticksPerSecond": ticks as f64 / elapsed, "phaseMs": phases.map(|v| v / ticks as f64),
            "summary": antropy_engine::observation::summary(&world),
            "exclusions": ["census", "inspection", "rendering", "active phenotype observation"]})
    });
    std::fs::write(output, serde_json::to_vec_pretty(&result).unwrap()).unwrap();
    println!(
        "{}",
        serde_json::json!({"workers": workers, "ticksPerSecond": result["ticksPerSecond"], "phaseMs": result["phaseMs"]})
    );
}
