use antropy_engine::{config::Config, world::World};
#[test]
fn birth_parameters_and_actual_stock_survive_checkpoint() {
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
    let g = w.genomes.get_mut(&1).unwrap();
    g.chromosomes[0].chemistry.enzymes[0].center_x = 0.12345;
    g.compile(&w.config, &w.chemistry);
    w.cells[0].operators = Some(g.compiled.as_ref().unwrap().operators.clone());
    let body = w.cells[0].body.map(|q| q * 0.75);
    w.cells[0].set_fixture_body(body);
    let bytes = w.snapshot().unwrap();
    let restored = World::restore(&bytes).unwrap();
    assert_eq!(restored.cells[0].chemistry(), w.cells[0].chemistry());
    assert_eq!(restored.cells[0].body, w.cells[0].body);
    assert_eq!(
        restored.cells[0].chemistry(),
        &w.genomes[&1].express().chemistry
    );
    assert!(std::sync::Arc::ptr_eq(
        &restored.cells[0].operators.as_ref().unwrap().enzymes[0],
        &restored.genomes[&1]
            .compiled
            .as_ref()
            .unwrap()
            .operators
            .enzymes[0],
    ));
    assert_eq!(bytes, restored.snapshot().unwrap());
}
#[test]
fn invalid_birth_parameters_are_rejected() {
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
            .center_x = value;
        assert!(w.genomes[&1].validate(&w.config).is_err());
        assert!(World::restore(&w.snapshot().unwrap()).is_err());
    }
}
