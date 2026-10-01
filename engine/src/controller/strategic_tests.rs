use super::*;
use crate::{controller, world::World};

fn fixture() -> World {
    World::new(
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
    .unwrap()
}

#[test]
fn history_records_surprise_volatility_and_does_not_update_without_paid_learning() {
    let g = Genome::seed();
    let c = Config::default();
    let mut state = State::default();
    state.hidden.fill(0.2);
    let mut history = [0.; HISTORY];
    history[0] = 0.5;
    history[6] = 0.75;
    state.accumulate(history, [1., 0.], 2., interval(&c));
    evaluate(&g, &mut state, &c, false);
    assert_eq!(state.inputs[0], 0.5);
    assert_eq!(state.inputs[1], 0.5);
    assert!(state.inputs[2] > 0.);
    assert_eq!(state.inputs[HISTORY * 3 + 3], 0.5);
    assert!(state.context[0] > 0. && state.context[1] > 0.);
    assert!(state.traces.iter().all(|v| *v == 0.));
    state.accumulate(history, [0.; 2], 0., interval(&c));
    evaluate(&g, &mut state, &c, true);
    assert!(state.traces.iter().any(|v| *v != 0.));
    assert!(state.inputs[1] < 0.5);
    assert!(state.validate());
}

#[test]
fn both_layers_assimilate_once_and_strategic_chromosome_changes_distance() {
    let g = controller::seed();
    let mut state = controller::State::default();
    state.strategy.traces.fill(0.25);
    let child = controller::assimilate(&g, &g, &state, 1.);
    assert!(controller::genome_distance(&g, &child) > 0.);
    assert_eq!(child.strategy.weights[RECURRENT], 0.025);
    assert_eq!(
        controller::genome_distance(&g, &controller::assimilate(&g, &g, &state, 0.)),
        0.
    );
    let daughter = daughter(&state, 123);
    assert!(daughter.strategy.traces.iter().all(|v| *v == 0.));
    let child_again = controller::assimilate(&child, &child, &daughter, 1.);
    assert_eq!(controller::genome_distance(&child, &child_again), 0.);
}

#[test]
fn daughters_copy_long_memory_and_context_but_clear_reflex_and_pending_events() {
    for mode in ["fission", "budding"] {
        let mut w = fixture();
        w.config.reproduction = mode.into();
        let body = w.cells[0].body.map(|v| v * 2.);
        w.cells[0].set_fixture_body(body);
        w.cells[0].energy = 2.;
        w.cells[0].brain.strategy.hidden.fill(0.3);
        w.cells[0].brain.strategy.long.fill(0.4);
        w.cells[0].brain.strategy.context = [0.2, -0.3, 0.4, 0.5];
        w.cells[0].brain.hidden.fill(0.5);
        w.cells[0].brain.task = 99;
        w.cells[0].brain.hearing.receive(23, [1., 0.], 0.5);
        crate::lifecycle::reproduce(&mut w);
        assert_eq!(w.ledger.divisions, 1);
        for cell in &w.cells {
            assert_eq!(cell.brain.strategy.hidden, [0.3; HIDDEN]);
            assert_eq!(cell.brain.strategy.long, [0.4; HISTORY]);
            assert_eq!(cell.brain.strategy.context, [0.2, -0.3, 0.4, 0.5]);
            if cell.parent.is_some() {
                assert_eq!(cell.brain.hidden, vec![0.; controller::HIDDEN]);
                assert_eq!(cell.brain.task, 0);
                assert_eq!(cell.brain.hearing.pending, [0.; 27]);
                assert_eq!(cell.brain.strategy.divisions, 0);
            } else {
                assert_eq!(cell.brain.strategy.divisions, 1);
            }
        }
    }
}

#[test]
fn learning_gain_scales_reflex_work_and_trace_time_together() {
    let mut a = fixture();
    a.config.learning = "plastic".into();
    let mut b = a.clone();
    a.cells[0].brain.strategy.learning_gain = 0.;
    b.cells[0].brain.strategy.learning_gain = 2.;
    for _ in 0..4 {
        a.step();
        b.step();
    }
    assert_eq!(a.ledger.flows.learning, 0.);
    assert!(b.ledger.flows.learning > 0.);
    assert!(
        controller::current_traces(&a.cells[0].brain)
            .iter()
            .all(|v| *v == 0.)
    );
    assert!(
        controller::current_traces(&b.cells[0].brain)
            .iter()
            .any(|v| *v != 0.)
    );
}

#[test]
fn authored_strategy_can_change_funded_swimming_through_reflex_context() {
    // No free feedstock: the probe tests motor funding from initial stored work,
    // with static learning and frozen mutation across three strategic intervals.
    let mut c = fixture().config;
    c.founder_inventory = 0.;
    c.terrain.seasons = true;
    c.terrain.season_period = 12.8;
    c.terrain.feature_wavelength = 8.;
    c.landscape_region_spacing = 12.;
    let mut w = World::new(27, c).unwrap();
    let initial = [w.cells[0].x, w.cells[0].y];
    let geography = &mut std::sync::Arc::make_mut(&mut w.shade).geography;
    let sample = geography.sample(initial);
    assert!(sample[2].hypot(sample[3]) > 0.);
    geography.phase = -sample[3].atan2(sample[2]) - std::f64::consts::FRAC_PI_2;
    w.field.illumination.shade = w.shade.clone();
    for genotype in w.genomes.values_mut() {
        for chromosome in &mut genotype.chromosomes {
            let brain = &mut chromosome.behavior;
            brain.weights.fill(0.);
            brain.weights[controller::CONTEXT_INPUT] = 1.;
            brain.weights[controller::OUTPUT] = 3.;
            brain.strategy.weights.fill(0.);
            // Negative balance surprise makes positive context; local seasonal cosine also participates.
            brain.strategy.weights[1] = -2.;
            brain.strategy.weights[HISTORY * 3 + 17] = 12.;
            brain.strategy.weights[OUTPUT] = 3.;
        }
        genotype.compile(&w.config, &w.chemistry);
    }
    let mut contexts = Vec::new();
    let mut efforts = Vec::new();
    for _ in 0..96 {
        w.step();
        contexts.push(w.cells[0].brain.strategy.context[0]);
        efforts.push(w.cells[0].action.swim);
        if w.tick.is_multiple_of(32) {
            eprintln!(
                "seasonal probe tick {}: balance surprise {}, season {}, context {}, swim {}, motor work {}, displacement {}",
                w.tick,
                w.cells[0].brain.strategy.inputs[1],
                w.cells[0].brain.strategy.inputs[HISTORY * 3 + 17],
                contexts.last().unwrap(),
                efforts.last().unwrap(),
                w.ledger.flows.motors,
                crate::movement::distance(initial, [w.cells[0].x, w.cells[0].y], &w.config)
            );
        }
    }
    assert!(contexts[31] > 0.);
    assert!(contexts[63] < contexts[31]);
    assert!(efforts[35] > 0.);
    assert_eq!(efforts[67], 0.);
    assert!(w.ledger.flows.motors > 0.);
    assert!(crate::movement::distance(initial, [w.cells[0].x, w.cells[0].y], &w.config) > 0.01);
    let summary = crate::observation::summary(&w);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-8);
}

#[test]
fn reservoir_sensing_ignores_remaining_wait_and_tracks_elapsed_time() {
    let mut w = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 1,
            ..Config::default()
        },
    )
    .unwrap();
    w.sources[0].amount = 0.;
    w.sources[0].empty_elapsed = 12.;
    let position = [w.sources[0].habitat.x, w.sources[0].habitat.y];
    let mut local = crate::strategic_local::Reservoirs::default();
    local.prepare(&w.sources, &w.field, &w.config);
    let a = local.read(w.field.stencil(position[0], position[1]));
    w.sources[0].wait = 1e9;
    local.prepare(&w.sources, &w.field, &w.config);
    assert_eq!(a, local.read(w.field.stencil(position[0], position[1])));
    assert!(a[1] > 0. && a[2] > 0.);
    assert_eq!(a[0], 0.);
}
