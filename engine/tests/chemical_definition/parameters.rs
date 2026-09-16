use antropy_engine::{config::Config, world::World};
#[test]
fn actual_continuous_parameters_survive_checkpoint_separately_from_targets() {
    let mut w = World::new(
        101,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 0,
            ..Default::default()
        },
    )
    .unwrap();
    w.cells[0].installed.enzymes[0].dx = 0.12345;
    w.cells[0].machinery_revision = 7;
    let bytes = w.snapshot().unwrap();
    let restored = World::restore(&bytes).unwrap();
    assert_eq!(restored.cells[0].installed, w.cells[0].installed);
    assert_eq!(restored.cells[0].machinery_revision, 7);
    assert_ne!(
        restored.cells[0].installed,
        w.genomes[&1].express().chemistry
    );
    assert_eq!(bytes, restored.snapshot().unwrap());
}
#[test]
fn invalid_genetic_and_installed_parameters_are_rejected() {
    for value in [f64::NAN, f64::INFINITY, 15.01, -15.01] {
        let mut w = World::new(
            101,
            Config {
                width: 24.,
                height: 24.,
                founders: 1,
                source_count: 0,
                ..Default::default()
            },
        )
        .unwrap();
        w.genomes.get_mut(&1).unwrap().chromosomes[0]
            .chemistry
            .enzymes[0]
            .dx = value;
        assert!(w.genomes[&1].validate(&w.config).is_err());
        let mut w = World::new(
            101,
            Config {
                width: 24.,
                height: 24.,
                founders: 1,
                source_count: 0,
                ..Default::default()
            },
        )
        .unwrap();
        w.cells[0].installed.enzymes[0].dx = value;
        assert!(World::restore(&w.snapshot().unwrap()).is_err());
    }
}
