use antropy_engine::{commands::load_fixture, config::Config, world::World};
use std::time::Instant;

fn main() {
    let mut world = World::new(
        101,
        Config {
            founders: 0,
            source_count: 0,
            ..Config::default()
        },
    )
    .unwrap();
    load_fixture(&mut world, 2000).unwrap();
    for _ in 0..10 {
        world.step();
    }
    let start = Instant::now();
    let mut times = [0.; 9];
    for _ in 0..10 {
        let step = world.step_measured(|| start.elapsed().as_secs_f64() * 1000.);
        for i in 0..9 {
            times[i] += step[i] / 10.;
        }
    }
    println!("{}", serde_json::to_string(&times).unwrap());
}
