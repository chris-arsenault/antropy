use crate::{commands, config::Config, controller, observation, world::World};
use serde_json::json;

fn fixture() -> World {
    let mut w = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 2,
            source_count: 0,
            founder_inventory: 0.,
            learning: "static".into(),
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            ..Config::default()
        },
    )
    .unwrap();
    for g in w.genomes.values_mut() {
        for ch in &mut g.chromosomes {
            ch.behavior = controller::diagnostic([0.; 9], None);
        }
        g.compile(&w.config, &w.chemistry);
    }
    for (i, c) in w.cells.iter_mut().enumerate() {
        c.x = 12. + i as f64 * 0.4;
        c.y = 12.;
        c.brain.strategy.context = [if i == 0 { 0.5 } else { -0.5 }; 4];
        c.brain.strategy.elapsed = controller::strategic::interval(&w.config) - w.config.dt;
    }
    w
}

#[test]
fn contact_reads_previous_displays_independently_of_execution_order() {
    let mut a = fixture();
    let mut b = a.clone();
    b.cells.reverse();
    a.step();
    b.step();
    for cell in &a.cells {
        let other = b.cells.iter().find(|c| c.id == cell.id).unwrap();
        let expected = if cell.id == 1 { -0.5 } else { 0.5 };
        assert_eq!(cell.brain.strategy.extra[22..26], [expected; 4]);
        assert!(cell.brain.strategy.extra[26] > 0.);
        assert_eq!(cell.brain.strategy.inputs, other.brain.strategy.inputs);
        assert_eq!(cell.brain.strategy.context, other.brain.strategy.context);
    }
}

#[test]
fn inspection_is_read_only_and_ablation_survives_checkpoint_and_remains_local() {
    let mut w = fixture();
    let before = w.snapshot().unwrap();
    let report = observation::inspect(&w, 1).unwrap();
    assert_eq!(
        report["control"]["strategicInputs"]
            .as_array()
            .unwrap()
            .len(),
        61
    );
    assert_eq!(report["control"]["hearing"].as_array().unwrap().len(), 27);
    assert_eq!(before, w.snapshot().unwrap());
    w.cells[0].brain.strategy.context_mean = [-0.25; 4];
    commands::execute(
        &mut w,
        &json!({"op":"strategyAblation","cell":1,"enabled":true}),
    )
    .unwrap();
    let restored = World::restore(&w.snapshot().unwrap()).unwrap();
    assert_eq!(restored.cells[0].brain.strategy.displayed(), [-0.25; 4]);
    assert_eq!(restored.cells[0].brain.strategy.context, [0.5; 4]);
    assert!(!restored.cells[1].brain.strategy.clamp_context);
    assert!(
        commands::execute(
            &mut w,
            &json!({"op":"strategyAblation","cell":99,"enabled":true})
        )
        .is_err()
    );
    assert!(
        commands::execute(
            &mut w,
            &json!({"op":"strategyAblation","cell":-1,"enabled":true})
        )
        .is_err()
    );
    for _ in 0..600 {
        w.event("recent", 0, vec![]);
    }
    assert!(w.events.iter().any(|e| e.kind == "strategy-ablation"));
}

#[test]
fn heard_left_moment_changes_funded_turning_after_the_delivery_barrier() {
    let mut w = fixture();
    for c in &mut w.cells {
        c.brain.strategy.elapsed = 0.;
        c.heading = 0.;
    }
    w.cells[1].x = 12.;
    w.cells[1].y = 13.;
    let speaker = w.cells[1].genome;
    for g in w.genomes.values_mut() {
        let mut logits = vec![0.; controller::TOTAL_OUTPUTS];
        logits[controller::SPEECH_EFFORT] = if g.id == speaker { 3. } else { -3. };
        for ch in &mut g.chromosomes {
            ch.behavior = controller::diagnostics::authored(
                logits.clone(),
                if g.id == speaker {
                    None
                } else {
                    Some((controller::HEARING_INPUT + 2, 1, 3.))
                },
            )
            .unwrap();
        }
        g.compile(&w.config, &w.chemistry);
    }
    for _ in 0..4 {
        w.step();
    }
    assert_eq!(w.cells[0].action.turn, 0.);
    assert!(w.cells[0].brain.hearing.pending[0] > 0.);
    let heading = w.cells[0].heading;
    for _ in 0..4 {
        w.step();
    }
    assert!(w.cells[0].action.turn > 0.);
    assert_ne!(w.cells[0].heading, heading);
    assert!(w.cells[0].flows.motors > 0.);
    assert!(
        observation::summary(&w)["energyResidual"]
            .as_f64()
            .unwrap()
            .abs()
            < 1e-9
    );
}
