use crate::{
    controller, diagnostics,
    ecology_direction_tests::{allocation_world, clear_supply},
};
use serde_json::json;

fn history_world() -> crate::world::World {
    let mut initial = allocation_world();
    let g = initial.genomes.get_mut(&2).unwrap();
    for ch in &mut g.chromosomes {
        let mut logits = vec![-3.; controller::TOTAL_OUTPUTS];
        logits[0] = 0.;
        logits[1] = 0.;
        logits[2] = 3.;
        logits[5] = 3.;
        logits[6] = 3.;
        logits[7] = 0.;
        logits[8] = 0.;
        logits[controller::ACTIVITY] = 0.;
        logits[controller::ACTIVITY + 1] = 0.;
        ch.behavior = controller::diagnostics::authored_responses(
            logits,
            &[
                (0, controller::ACTIVITY, 6.),
                (controller::CONTEXT_INPUT, controller::ACTIVITY, 6.),
                (4, controller::ACTIVITY + 1, 6.),
            ],
        )
        .unwrap();
        controller::diagnostics::strategic_responses(&mut ch.behavior, &[(15, 0, 3.)]).unwrap();
    }
    g.compile(&initial.config, &initial.chemistry);
    diagnostics::initialize(&mut initial);
    crate::binding_observation::budget(&initial, &json!({"cell":2})).unwrap();
    for _ in 0..40 {
        initial.step();
    }
    initial
}

#[test]
fn held_uptake_history_can_repay_strategy_during_an_interrupted_present_cue() {
    // Same present exposure and inherited repertoire; one arm removes only context influence.
    // Forty prehistory ticks and sixteen matched interruption ticks, static learning.
    let mut initial = history_world();
    assert!(initial.cells[0].brain.strategy.context[0] > 0.);
    clear_supply(&mut initial);
    let mut with = initial.clone();
    let mut without = initial.clone();
    for (w, enabled) in [(&mut with, true), (&mut without, false)] {
        crate::run_control::configure(w, &json!({"patch":{"strategicContext":enabled}})).unwrap();
    }
    let before = initial.ledger.flows.captured;
    let mut effort = [0_f64; 2];
    for _ in 0..16 {
        with.step();
        without.step();
        for (i, w) in [&with, &without].into_iter().enumerate() {
            if let Some(cell) = w.cells.first() {
                effort[i] = effort[i].max(cell.action.activity[0]);
            }
        }
    }
    let gain = with.ledger.flows.captured - without.ledger.flows.captured;
    let strategy_price = initial.config.controller_cost
        * (controller::strategic::upkeep_multiplier(&initial.config) - 1.)
        * 56.
        * initial.config.dt;
    println!(
        "history interruption: work with={} without={} gain={} strategic upkeep={} context={}",
        with.ledger.flows.captured - before,
        without.ledger.flows.captured - before,
        gain,
        strategy_price,
        initial.cells[0].brain.strategy.context[0]
    );
    assert!(gain > strategy_price);
    assert!(effort[0] > effort[1]);
    assert!(!with.cells.is_empty());
    for w in [&with, &without] {
        w.validate().unwrap();
        let summary = crate::observation::summary(w);
        assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-6);
        assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-6);
    }
}

#[test]
fn brief_interruption_and_sustained_change_preserve_affordable_alternatives() {
    // A 4-tick interruption followed by old supply versus sustained loss plus new usable supply.
    // Same genotype/history, no escape policy; 32 further ticks, one seed, frozen discovery.
    let initial = history_world();
    let mut brief = initial.clone();
    let mut sustained = initial.clone();
    clear_supply(&mut brief);
    clear_supply(&mut sustained);
    for _ in 0..4 {
        brief.step();
        sustained.step();
    }
    crate::ecology_direction_tests::replace_supply(&mut brief, 136);
    crate::ecology_direction_tests::replace_supply(&mut sustained, 0);
    crate::binding_observation::budget(&sustained, &json!({"cell":2})).unwrap();
    for _ in 0..32 {
        brief.step();
        sustained.step();
    }
    let intake = |w: &crate::world::World, s| {
        w.cells
            .iter()
            .map(|c| c.chemical_flows.imported.value(s))
            .sum::<f64>()
    };
    println!(
        "persistence/change: brief import0={} sustained import0={} growth={} / {} motors={} / {}",
        intake(&brief, 0),
        intake(&sustained, 0),
        brief.ledger.flows.grown - initial.ledger.flows.grown,
        sustained.ledger.flows.grown - initial.ledger.flows.grown,
        brief.ledger.flows.motors - initial.ledger.flows.motors,
        sustained.ledger.flows.motors - initial.ledger.flows.motors
    );
    assert!(!brief.cells.is_empty() && !sustained.cells.is_empty());
    assert!(intake(&sustained, 0) > intake(&brief, 0));
    assert!(brief.ledger.flows.grown > initial.ledger.flows.grown);
    assert!(sustained.ledger.flows.grown > initial.ledger.flows.grown);
    for w in [&brief, &sustained] {
        w.validate().unwrap();
        let summary = crate::observation::summary(w);
        assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-6);
        assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-6);
    }
}

#[test]
fn strategic_gain_and_context_controls_leave_slow_operation_distinct() {
    let mut w = allocation_world();
    w.config.learning = "plastic".into();
    w.cells[0].brain.strategy.learning_gain = 0.;
    crate::run_control::configure(
        &mut w,
        &json!({"patch":{
        "strategicGain":false,"strategicContext":false}}),
    )
    .unwrap();
    assert_eq!(w.config.reflex_gain(0.), 1.);
    for _ in 0..40 {
        w.step();
    }
    assert!(w.ledger.flows.reflex_learning > 0.);
    assert!(w.cells[0].brain.strategy.evaluations > 0);
    assert!(
        w.cells[0].inputs[controller::CONTEXT_INPUT..]
            .iter()
            .all(|v| *v == 0.)
    );
}
