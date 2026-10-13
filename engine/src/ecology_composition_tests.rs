use crate::{config::Config, world::World};
use serde_json::{Value, json};

#[test]
fn mutable_default_operators_refill_and_restore_under_same_checkpoint_controls() {
    let mut initial = World::new(
        27,
        Config {
            width: 48.,
            height: 36.,
            founders: 8,
            source_count: 12,
            ..Config::ecology()
        },
    )
    .unwrap();
    // Declared clock fixture: retained finite contents at a nominal refill boundary.
    // No inventory is removed or invented, and the full ordinary next batch is accounted.
    initial.sources[0].allowance = 0.;
    initial.sources[0].wait = 0.2;
    let budget = crate::binding_observation::budget(&initial, &json!({"cell":1})).unwrap();
    assert_eq!(budget["ticksAdvanced"], 0);
    let c = &initial.config;
    println!(
        "composition budget: batch={} nominal mean source rate={} initial upkeep={}",
        c.source_rate * c.source_lifetime,
        c.source_count as f64 * c.source_rate * c.source_lifetime
            / (c.source_lifetime + c.source_gap),
        initial
            .cells
            .iter()
            .map(|cell| cell.basal(c, 0) / c.dt)
            .sum::<f64>()
    );
    assert!(c.mutation_rate > 0. && c.physical_mutation_rate > 0. && c.reflex_plastic());
    let save = initial.snapshot().unwrap();
    for patch in [
        include_str!("../../config/activity-on.json"),
        include_str!("../../config/activity-off.json"),
    ] {
        let mut arm = World::restore(&save).unwrap();
        let patch: Value = serde_json::from_str(patch).unwrap();
        let held = arm.held();
        crate::run_control::configure(&mut arm, &json!({"revision":0,"patch":patch})).unwrap();
        assert_eq!(arm.held(), held);
        for _ in 0..96 {
            arm.step();
        }
        assert!(arm.ledger.supplied >= 120.);
        assert_eq!(arm.run_control.revision, 1);
        arm.validate().unwrap();
        let mut restored = World::restore(&arm.snapshot().unwrap()).unwrap();
        for _ in 0..8 {
            restored.step();
        }
        restored.validate().unwrap();
        let summary = crate::observation::summary(&restored);
        assert!(
            summary["materialResidual"].as_f64().unwrap().abs() < 1e-5,
            "{summary}"
        );
        assert!(
            summary["energyResidual"].as_f64().unwrap().abs() < 1e-5,
            "{summary}"
        );
        println!(
            "composition active={} living={} supplied={} births={} deaths={}",
            restored.config.active_features().strategy,
            restored.cells.len(),
            restored.ledger.supplied,
            restored.ledger.births,
            restored.ledger.deaths
        );
    }
}
