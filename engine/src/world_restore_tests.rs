use super::*;

#[test]
fn restored_motion_matches_rebuilt_derived_caches_without_losing_physical_state() {
    let mut warm = World::new(101, Config::default()).unwrap();
    for _ in 0..110 {
        warm.step();
    }
    let saved = warm.snapshot().unwrap();
    let mut restored = World::restore(&saved).unwrap();
    assert_eq!(saved, restored.snapshot().unwrap());
    // Rebuild derived owners on a clone without serializing any physical state.
    let mut rebuilt = warm.clone();
    rebuilt.contact_cache = Default::default();
    rebuilt.footprints = Default::default();
    rebuilt.sites.clear();
    rebuilt.field.rebuild();
    rebuilt.field.refresh_features(&rebuilt.chemistry);
    rebuilt.cover.rebuild();
    rebuilt.cover.refresh_features(&rebuilt.chemistry);
    crate::cover::refresh(&mut rebuilt);
    crate::source_medium::project(&mut rebuilt);
    warm.step();
    restored.step();
    rebuilt.step();
    let max_distance = warm
        .cells
        .iter()
        .zip(&restored.cells)
        .map(|(a, b)| crate::movement::distance([a.x, a.y], [b.x, b.y], &warm.config))
        .fold(0_f64, f64::max);
    assert!(max_distance > 0.);
    assert!(max_distance < crate::execution::RESOLUTION * warm.config.mesh);
    for (a, b) in rebuilt.cells.iter().zip(&restored.cells) {
        assert_eq!([a.x, a.y, a.heading], [b.x, b.y, b.heading]);
    }
    eprintln!("warm versus restored maximum first-step displacement: {max_distance}");
}
