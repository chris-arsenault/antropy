use super::*;

#[test]
fn strategic_clock_and_context_survive_mid_interval_checkpoint() {
    let mut w = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            source_count: 0,
            founders: 1,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..Config::default()
        },
    )
    .unwrap();
    for _ in 0..17 {
        w.step();
    }
    let bytes = w.snapshot().unwrap();
    let mut restored = World::restore(&bytes).unwrap();
    assert!(bytes == restored.snapshot().unwrap());
    // Match the restored derived-cache state; warm-cache displacement is checked below.
    w.contact_cache = Default::default();
    w.footprints = Default::default();
    w.sites.clear();
    w.field.rebuild();
    w.field.refresh_features(&w.chemistry);
    w.cover.rebuild();
    w.cover.refresh_features(&w.chemistry);
    crate::cover::refresh(&mut w);
    crate::source_medium::project(&mut w);
    for _ in 0..15 {
        w.step();
        restored.step();
    }
    let a = &w.cells[0].brain.strategy;
    let b = &restored.cells[0].brain.strategy;
    assert_eq!(a.evaluations, 1);
    assert_eq!(b.evaluations, 1);
    assert_eq!(a.noise.0, b.noise.0);
    assert_eq!(a.context, b.context);
    let summary = crate::observation::summary(&w);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-8);
}

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
