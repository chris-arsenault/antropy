use crate::{config::Config, phenotype::Observer, world::World};

fn pool(count: usize) -> rayon::ThreadPool {
    rayon::ThreadPoolBuilder::new()
        .num_threads(count)
        .build()
        .unwrap()
}

#[test]
fn partitioned_world_preserves_funding_observations_and_checkpoint_boundaries() {
    let config = Config {
        founders: 192,
        width: 64.,
        height: 64.,
        source_count: 8,
        ..Config::default()
    };
    let mut initial = World::new(101, config).unwrap();
    let mut observer = Observer::new(0);
    observer.enabled = true;
    initial.observer = Some(Box::new(observer));
    let mut serial = initial.clone();
    let mut parallel = initial;
    for (workers, world) in [(1, &mut serial), (4, &mut parallel)] {
        pool(workers).install(|| {
            for _ in 0..16 {
                world.step();
            }
            world.validate().unwrap();
            let saved = world.snapshot().unwrap();
            let mut restored = World::restore(&saved).unwrap();
            restored.step();
            restored.validate().unwrap();
        });
    }
    assert_eq!(serial.cells.len(), parallel.cells.len());
    let a = serial.held();
    let b = parallel.held();
    assert!((a.0 - b.0).abs() < 1e-7);
    assert!((a.1 - b.1).abs() < 1e-7);
    assert_eq!(serial.ledger.divisions, parallel.ledger.divisions);
    for (a, b) in serial
        .field
        .amounts()
        .iter()
        .zip(parallel.field.amounts().iter())
    {
        assert!((*a as f64 - *b as f64).abs() < 1e-6);
    }
    let a = &serial.observer.as_ref().unwrap().current;
    let b = &parallel.observer.as_ref().unwrap().current;
    assert!(a.groups[0].routes.iter().sum::<f64>() > 0.);
    for (a, b) in a.groups.iter().zip(&b.groups) {
        for (&x, &y) in a.routes.iter().zip(&b.routes) {
            assert!((x - y).abs() < 1e-8);
        }
        assert!((a.ledger.overflow_heat - b.ledger.overflow_heat).abs() < 1e-8);
    }
}

#[test]
fn shared_owners_are_thread_safe_without_mutable_aliases() {
    fn check<T: Send + Sync>() {}
    check::<World>();
    check::<crate::genetics::Compiled>();
    check::<crate::organism::Cell>();
}

#[test]
fn parallel_geographic_filters_preserve_periodic_axes_and_input_invalidation() {
    let (nx, ny) = (384, 192);
    let mut carrier: crate::spatial_signal::Signal = (0..nx * ny)
        .map(|i| [((i * 37 % 997) as f64 * 0.17).sin(), 0.])
        .collect::<Vec<_>>()
        .into();
    let empty = vec![[0.; 2]; nx * ny].into();
    let mut serial = crate::attraction::Attraction::default();
    let mut parallel = serial.clone();
    for phase in 0..3 {
        carrier[phase * 1000][0] += 0.2;
        for (workers, filter) in [(1, &mut serial), (4, &mut parallel)] {
            pool(workers).install(|| {
                filter.prepare((nx, ny, 2., 11.7), [&carrier, &empty, &empty]);
            });
        }
        assert_eq!(serial.revisions, parallel.revisions);
        for (&a, &b) in serial.output.iter().zip(&parallel.output) {
            assert!((a - b).abs() < 1e-12);
        }
    }
}
