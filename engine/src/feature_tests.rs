use super::*;
use crate::{config::Config, configuration, controller, diagnostics, lifecycle, world::World};
use serde_json::json;

fn off() -> Config {
    configuration::text(include_str!("../../config/explorations-off.json")).unwrap()
}

fn fixture(c: Config) -> World {
    World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 2,
            source_count: 0,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            ..c
        },
    )
    .unwrap()
}

#[test]
fn independent_switches_remove_only_their_body_capacities() {
    let baseline = fixture(Config::default()).cells[0].body;
    for (name, removed) in [
        ("photoreception", vec![PHOTO_STOCK]),
        ("cover", vec![BUILDER_STOCK]),
        ("emission", vec![EMITTER_STOCK]),
        ("vocalization", vec![MOUTH_STOCK, EAR_STOCK]),
        ("strategy", vec![]),
    ] {
        let c = configuration::parse(&json!({"features":{name:false}})).unwrap();
        let w = fixture(c);
        for (slot, expected) in baseline.into_iter().enumerate() {
            assert_eq!(
                w.cells[0].body[slot],
                if removed.contains(&slot) {
                    0.
                } else {
                    expected
                }
            );
        }
    }
    for bad in [
        json!({"features":{"typo":false}}),
        json!({"features":{"cover":0}}),
    ] {
        assert!(configuration::parse(&bad).is_err());
    }
}

#[test]
fn all_off_blocks_authored_actions_hearing_and_context_but_keeps_reflex_learning() {
    let mut a = fixture(off());
    for g in a.genomes.values_mut() {
        for chromosome in &mut g.chromosomes {
            let brain = &mut chromosome.behavior;
            controller::programs::optical(brain, 3., 3., None);
            controller::programs::speech(brain, 255, 3.);
        }
        g.compile(&a.config, &a.chemistry);
    }
    diagnostics::initialize(&mut a);
    for cell in &mut a.cells {
        cell.energy = 10.;
        cell.brain.strategy.context = [1.; 4];
        cell.brain.strategy.learning_gain = 0.;
        cell.brain.pending_speech = Some((255, 1.));
        cell.brain.hearing.receive(255, [1., 0.], 1.);
    }
    let mut b = a.clone();
    for cell in &mut b.cells {
        cell.brain.strategy.context = [-1.; 4];
        cell.brain.strategy.learning_gain = 2.;
    }
    for _ in 0..40 {
        a.step();
        b.step();
    }
    assert!(!a.cells.is_empty());
    assert_eq!(a.ledger.flows.learning, b.ledger.flows.learning);
    assert!(a.ledger.flows.learning > 0.);
    for cell in &a.cells {
        assert_eq!(cell.action.cover, 0.);
        assert_eq!(cell.action.emission, 0.);
        assert_eq!(cell.action.speech_effort, 0.);
        assert_eq!(cell.brain.pending_speech, None);
        assert_eq!(cell.brain.strategy.evaluations, 0);
        assert!(
            cell.inputs[controller::LIGHT_INPUT..controller::LIGHT_INPUT + 4]
                .iter()
                .all(|v| *v == 0.)
        );
        assert!(
            cell.inputs[controller::HEARING_INPUT..]
                .iter()
                .all(|v| *v == 0.)
        );
        assert!(
            controller::current_traces(&cell.brain)
                .iter()
                .any(|v| *v != 0.)
        );
    }
    assert_eq!(
        a.ledger.flows.emission + a.ledger.flows.cover_work + a.ledger.flows.speech_work,
        0.
    );
    assert_eq!(a.ledger.flows.utterances + a.ledger.flows.heard, 0.);
    assert!(!a.cover.has_active_material());
    assert!(a.incident.lateral.is_empty() && a.incident.upward.is_empty());
}

#[test]
fn strategy_off_removes_its_upkeep_and_reserve_without_removing_speech() {
    let mut c = Config::default();
    c.features.strategy = false;
    let mut w = fixture(c);
    for cell in &mut w.cells {
        cell.x = 12. + cell.id as f64;
        cell.y = 12.;
    }
    let cell = &w.cells[0];
    let maintenance = crate::organism::maintenance_rate(&cell.body, 0., 0., &w.config);
    assert!(
        (maintenance - cell.mass() * w.config.maintenance - w.config.controller_cost).abs() < 1e-12
    );
    assert_eq!(controller::strategic::learning_rate(0., &w.config), 1.);
    assert_eq!(controller::strategic::learning_rate(2., &w.config), 1.);
    w.cells[0].brain.pending_speech = Some((0, 1.));
    crate::utterances::Delivery::default().advance(&mut w.cells, &w.config, 0);
    assert!(w.cells[0].flows.speech_work > 0.);
    assert_eq!(w.cells[1].flows.heard, 1.);
}

#[test]
fn vocalization_off_keeps_strategy_active() {
    let mut c = Config::default();
    c.features.vocalization = false;
    c.learning = "static".into();
    let mut w = fixture(c);
    for cell in &mut w.cells {
        cell.energy = 10.;
    }
    for _ in 0..40 {
        w.step();
    }
    assert!(!w.cells.is_empty());
    assert!(w.cells.iter().all(|c| c.brain.strategy.evaluations > 0));
    assert_eq!(w.ledger.flows.speech_work + w.ledger.flows.heard, 0.);
}

#[test]
fn all_off_survives_birth_and_continuation_with_radial_chemistry_and_solar_work() {
    let mut w = fixture(off());
    w.config.physical_mutation_rate = 1.;
    for cell in &mut w.cells {
        cell.set_fixture_body(cell.body.map(|v| 2. * v));
        cell.energy = 10.;
        cell.inventory.set(0, 3.);
    }
    diagnostics::initialize(&mut w);
    lifecycle::reproduce(&mut w);
    assert_eq!(w.ledger.divisions, 2);
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    assert_eq!(restored.config.features, off().features);
    for _ in 0..8 {
        restored.step();
    }
    for g in restored.genomes.values() {
        assert!(g.chromosomes.iter().all(|ch| ch.chemistry.keys.is_none()));
    }
    for cell in &restored.cells {
        for stock in [
            PHOTO_STOCK,
            BUILDER_STOCK,
            EMITTER_STOCK,
            MOUTH_STOCK,
            EAR_STOCK,
        ] {
            assert_eq!(cell.body[stock], 0.);
        }
    }
    assert_eq!(restored.mortality.recovered, 0.);
    assert!(restored.ledger.flows.external_work > 0.);
    let summary = crate::observation::summary(&restored);
    assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-8);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-8);
}
