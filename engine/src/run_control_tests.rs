use super::*;

fn world() -> World {
    World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 4,
            source_count: 2,
            ..Config::default()
        },
    )
    .unwrap()
}

#[test]
fn partial_live_patch_is_atomic_and_preserves_funded_bodies() {
    let mut w = world();
    let bodies: Vec<_> = w.cells.iter().map(|c| c.body).collect();
    let held = w.held();
    let preview = configure(
        &mut w,
        &json!({"patch":{"activity":{"strategy":false}},"preview":true}),
    )
    .unwrap();
    assert_eq!(preview["config"]["activity"]["strategy"], false);
    assert!(w.config.activity.strategy);
    assert!(
        configure(
            &mut w,
            &json!({"patch":{"width":32.,"mortalityRecovery":false}})
        )
        .is_err()
    );
    assert!(w.config.mortality_recovery);
    configure(
        &mut w,
        &json!({"patch":{"activity":{"strategy":false},"mortalityRecovery":false}}),
    )
    .unwrap();
    assert!(!w.config.active_features().strategy);
    assert!(w.config.features.strategy);
    assert_eq!(w.held(), held);
    assert_eq!(w.cells.iter().map(|c| c.body).collect::<Vec<_>>(), bodies);
    assert_eq!(w.run_control.revision, 1);
    assert!(configure(&mut w, &json!({"patch":{"activity":{"unknown":true}}})).is_err());
    assert_eq!(w.run_control.revision, 1);
}

#[test]
fn pending_patch_and_revision_survive_a_mid_interval_checkpoint() {
    let mut w = world();
    w.step();
    configure(
        &mut w,
        &json!({"revision":0,"patch":{"mortalityRecovery":false}}),
    )
    .unwrap();
    assert!(w.run_control.pending.is_some());
    assert!(w.config.mortality_recovery);
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    assert!(restored.run_control.pending.is_some());
    for _ in 0..4 {
        restored.step();
    }
    assert!(!restored.config.mortality_recovery);
    assert!(restored.run_control.pending.is_none());
    assert_eq!(restored.run_control.revision, 1);
    assert!(
        configure(
            &mut restored,
            &json!({"revision":0,"patch":{"mortalityRecovery":true}})
        )
        .is_err()
    );
}

#[test]
fn live_off_on_restores_participation_without_refitting_genetics() {
    let mut w = world();
    let ids: Vec<_> = w.cells.iter().map(|c| c.genome).collect();
    configure(&mut w,&json!({"patch":{"activity":{"photoreception":false,"cover":false,"emission":false,"vocalization":false,"strategy":false}}})).unwrap();
    for _ in 0..8 {
        w.step();
    }
    assert_eq!(w.ledger.flows.speech_work, 0.);
    assert!(
        w.cells
            .iter()
            .all(|c| c.inputs[crate::controller::LIGHT_INPUT] == 0.)
    );
    configure(&mut w,&json!({"patch":{"activity":{"photoreception":true,"cover":true,"emission":true,"vocalization":true,"strategy":true}}})).unwrap();
    assert_eq!(w.cells.iter().map(|c| c.genome).collect::<Vec<_>>(), ids);
    assert!(w.config.active_features().strategy);
    let restored = World::restore(&w.snapshot().unwrap()).unwrap();
    assert_eq!(restored.run_control.revision, 2);
    assert!(restored.config.active_features().strategy);
}

#[test]
fn learning_layers_have_independent_paid_clocks_and_costs() {
    for (reflex, strategy) in [(true, false), (false, true), (false, false), (true, true)] {
        let mut w = crate::diagnostics::nutrition(0.8, 2., true, false);
        w.config.learning = "plastic".into();
        w.config.reflex_learning = reflex;
        w.config.strategic_learning = strategy;
        for _ in 0..64 {
            w.step();
        }
        let f = &w.ledger.flows;
        assert_eq!(f.reflex_learning > 0., reflex);
        assert_eq!(f.strategic_learning > 0., strategy);
        assert!((f.learning - f.reflex_learning - f.strategic_learning).abs() < 1e-12);
        if !reflex {
            assert!(
                crate::controller::current_traces(&w.cells[0].brain)
                    .iter()
                    .all(|v| *v == 0.)
            );
        }
        if !strategy {
            assert!(w.cells[0].brain.strategy.traces.iter().all(|v| *v == 0.));
        }
        World::restore(&w.snapshot().unwrap())
            .unwrap()
            .validate()
            .unwrap();
    }
}
