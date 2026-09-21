//! Zero-tick mature geometry check registered in docs/contact-performance.md.
use antropy_engine::{movement, world::World};
use serde_json::json;
use std::time::Instant;

fn main() {
    let args: Vec<_> = std::env::args().collect();
    let w = World::restore(&std::fs::read(&args[1]).unwrap()).unwrap();
    let start = Instant::now();
    let contacts = movement::geometry::Contacts::new(&w.cells, &w.config);
    let elapsed = start.elapsed().as_secs_f64() * 1000.;
    let mut reference = vec![];
    for (i, a) in contacts.bodies.iter().enumerate() {
        for (j, b) in contacts.bodies.iter().enumerate().skip(i + 1) {
            if movement::distance(a.position, b.position, &w.config) < a.radius + b.radius {
                reference.push((i, j));
            }
        }
    }
    let mut found: Vec<_> = contacts.edges.iter().map(|e| (e.i, e.j)).collect();
    found.sort_unstable();
    assert_eq!(found, reference);
    let radius = contacts.bodies.iter().map(|b| b.radius).fold(0.1, f64::max);
    let old = movement::Spatial::for_observation(&w.config, &w.cells, 2. * radius);
    let mut near = vec![];
    let mut candidates = 0;
    for (i, cell) in w.cells.iter().enumerate() {
        old.near(cell.x, cell.y, &mut near);
        candidates += near.iter().filter(|&&j| j > i).count();
    }
    let result = json!({"version":w.version,"tick":w.tick,"population":w.cells.len(),
        "oldCandidates":candidates,"candidates":contacts.candidates,"contacts":reference.len(),
        "matchesAllPairs":true,"nativeGeometryMs":elapsed});
    std::fs::write(&args[2], serde_json::to_vec_pretty(&result).unwrap()).unwrap();
    println!("{result}");
}
