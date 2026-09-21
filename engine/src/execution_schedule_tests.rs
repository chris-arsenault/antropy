use crate::{config::Config, world::World};

fn world() -> World {
    World::new(
        101,
        Config {
            width: 16.,
            height: 16.,
            founders: 2,
            source_count: 0,
            ..Config::default()
        },
    )
    .unwrap()
}

#[test]
fn actions_are_held_while_learning_is_paid_between_material_boundaries() {
    let mut w = world();
    let id = w.cells[0].id;
    w.step();
    for _ in 0..2 {
        let before = w.cells.iter().find(|c| c.id == id).unwrap();
        let hidden = before.brain.hidden.clone();
        let learning = w.config.plasticity_cost * w.config.dt * before.body[0];
        w.step();
        let cell = w.cells.iter().find(|c| c.id == id).unwrap();
        assert!(cell.brain.epoch.is_some());
        assert_eq!(cell.brain.hidden, hidden);
        assert!((cell.flows.learning - learning).abs() < 1e-12);
        assert!(w.field_elapsed > 0.);
    }
    crate::boundary_tests::usable_continuation(&w, 3);
}

#[test]
fn checkpoint_retains_prepared_private_time_and_continues() {
    let mut w = world();
    for _ in 0..3 {
        w.step();
    }
    let mut restored = crate::boundary_tests::restored_state(&w);
    assert!(restored.cells.iter().all(|c| c.brain.epoch.is_some()));
    for _ in 0..5 {
        restored.step();
    }
    crate::boundary_tests::usable_continuation(&restored, 8);
}
