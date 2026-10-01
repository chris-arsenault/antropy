use super::*;
use crate::{
    controller::{self, hearing::Hearing},
    world::World,
};

fn world(count: usize) -> World {
    World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: count,
            source_count: 0,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..Config::default()
        },
    )
    .unwrap()
}

#[test]
fn byte_zero_is_a_heard_event_and_opposed_bearings_cancel_without_silence() {
    let mut hearing = Hearing::default();
    hearing.receive(0, [1., 0.], 0.5);
    let one = hearing.consume();
    assert_eq!(one[0], 1. / 3.);
    assert_eq!(one[3], -one[0]);
    hearing.receive(0, [1., 0.], 0.5);
    hearing.receive(0, [-1., 0.], 0.5);
    let opposed = hearing.consume();
    assert_eq!(opposed[0], 0.5);
    assert_eq!(opposed[1], 0.);
    assert_eq!(opposed[3], -0.5);
    assert_eq!(hearing.consume(), [0.; 27]);
}

#[test]
fn swapping_messages_swaps_their_directional_moments() {
    let mut a = Hearing::default();
    let mut b = Hearing::default();
    a.receive(0, [1., 0.], 1.);
    a.receive(255, [-1., 0.], 1.);
    b.receive(255, [1., 0.], 1.);
    b.receive(0, [-1., 0.], 1.);
    let a = a.consume();
    let b = b.consume();
    assert_eq!(a[0], b[0]);
    for component in 1..9 {
        assert_eq!(a[component * 3 + 1], -b[component * 3 + 1]);
    }
}

#[test]
fn all_sectors_wrap_and_rotate_with_the_listener() {
    use std::f64::consts::TAU;
    for sector in 0..16 {
        let angle = sector as f64 * TAU / 16.;
        for heading in [0., 0.37, 5.4] {
            let (sin, cos) = (angle + heading).sin_cos();
            let d = controller::hearing::direction([cos, sin], heading, [24.; 2]);
            assert!((d[0] - angle.cos()).abs() < 1e-12);
            assert!((d[1] - angle.sin()).abs() < 1e-12);
        }
    }
    assert_eq!(
        controller::hearing::direction([0.; 2], 0., [24.; 2]),
        [0.; 2]
    );
    assert_eq!(
        controller::hearing::direction([12., 1.], 0., [24.; 2]),
        [0.; 2]
    );
    let tie = TAU / 32.;
    let d = controller::hearing::direction([tie.cos(), tie.sin()], 0., [24.; 2]);
    assert!((d[1] - (TAU / 16.).sin()).abs() < 1e-12);
}

#[test]
fn paid_events_have_flat_gain_periodic_delivery_and_no_self_hearing() {
    let mut w = world(4);
    for (cell, x) in w.cells.iter_mut().zip([0.5, 1.5, 23.5, 8.]) {
        cell.x = x;
        cell.y = 12.;
        cell.heading = 0.;
    }
    w.cells[0].brain.pending_speech = Some((0, 1.));
    let before = w.cells.iter().map(|c| c.energy).sum::<f64>();
    Delivery::default().advance(&mut w.cells, &w.config, 0);
    assert_eq!(w.cells[0].brain.hearing.pending[0], 0.);
    assert_eq!(w.cells[1].brain.hearing.pending[0], 0.5);
    assert_eq!(w.cells[2].brain.hearing.pending[0], 0.5);
    assert_eq!(w.cells[3].brain.hearing.pending[0], 0.);
    let paid = w.cells[0].flows.speech_work;
    assert!((before - w.cells.iter().map(|c| c.energy).sum::<f64>() - paid).abs() < 1e-12);
    assert!((paid - 0.0064).abs() < 1e-12);
    assert_eq!(w.cells[0].flows.utterances, 1.);
}

#[test]
fn unaffordable_zero_stock_and_deaf_events_cannot_be_recovered_later() {
    let mut w = world(2);
    w.cells[0].x = 12.;
    w.cells[1].x = 13.;
    for cell in &mut w.cells {
        cell.y = 12.;
    }
    let mut delivery = Delivery::default();
    w.cells[0].body[MOUTH_STOCK] = 0.;
    w.cells[0].brain.pending_speech = Some((1, 1.));
    delivery.advance(&mut w.cells, &w.config, 0);
    assert_eq!(w.cells[0].flows.speech_work, 0.);
    w.cells[0].body[MOUTH_STOCK] = 0.04;
    w.cells[0].energy = 0.00001;
    w.cells[0].brain.pending_speech = Some((1, 1.));
    delivery.advance(&mut w.cells, &w.config, 0);
    assert_eq!(w.cells[0].flows.speech_work, 0.);
    w.cells[0].energy = 0.5;
    w.cells[1].body[EAR_STOCK] = 0.;
    w.cells[0].brain.pending_speech = Some((1, 1.));
    delivery.advance(&mut w.cells, &w.config, 0);
    w.cells[1].body[EAR_STOCK] = 0.01;
    delivery.advance(&mut w.cells, &w.config, 0);
    assert_eq!(w.cells[1].brain.hearing.pending[0], 0.);
}

#[test]
fn initialization_and_cache_replacement_do_not_consume_or_emit_events() {
    let g = controller::diagnostic(
        [0.; controller::OUTPUTS],
        Some((controller::HEARING_INPUT + 2, 1, 3.)),
    );
    let c = Config {
        learning: "static".into(),
        ..Config::default()
    };
    let mut state = controller::State::default();
    state.hearing.receive(0, [0., 1.], 0.5);
    let inputs = vec![0.; controller::INPUTS];
    controller::act(&g, &inputs, &mut state, &c, false);
    assert!(state.pending_speech.is_none());
    assert_eq!(state.hearing.pending[0], 0.5);
    let mut action = controller::Action::default();
    for _ in 0..3 {
        action = controller::act(&g, &inputs, &mut state, &c, false);
    }
    assert!(action.turn > 0.);
    assert_eq!(state.hearing.pending[0], 0.);
    assert_eq!(state.hearing.last[2], 1. / 3.);
    state.pending_speech.take();
    controller::invalidate(&mut state);
    controller::act(&g, &inputs, &mut state, &c, false);
    assert!(state.pending_speech.is_none());
}

#[test]
fn ordinary_world_speech_is_once_per_evaluation_and_continues_pending_hearing() {
    let mut w = world(2);
    let mut logits = vec![0.; controller::TOTAL_OUTPUTS];
    logits[controller::SPEECH_EFFORT] = 3.;
    for genotype in w.genomes.values_mut() {
        for chromosome in &mut genotype.chromosomes {
            chromosome.behavior = controller::diagnostics::authored(logits.clone(), None).unwrap();
        }
        genotype.compile(&w.config, &w.chemistry);
    }
    for (cell, x) in w.cells.iter_mut().zip([12., 13.]) {
        cell.x = x;
        cell.y = 12.;
    }
    for _ in 0..3 {
        w.step();
    }
    assert_eq!(w.ledger.flows.utterances, 0.);
    w.step();
    assert_eq!(w.ledger.flows.utterances, 2.);
    assert!(w.cells[0].brain.hearing.pending[0] > 0.);
    let bytes = w.snapshot().unwrap();
    let mut restored = World::restore(&bytes).unwrap();
    assert!(
        bytes == restored.snapshot().unwrap(),
        "restore must retain pending impulses"
    );
    for _ in 0..2 {
        w.step();
        restored.step();
    }
    assert_eq!(w.ledger.flows.utterances, 2.);
    for (a, b) in w.cells.iter().zip(&restored.cells) {
        assert_eq!(a.brain.hearing.pending, b.brain.hearing.pending);
        assert_eq!(a.brain.hearing.last, b.brain.hearing.last);
        assert_eq!(a.action.speech, b.action.speech);
        assert!((a.energy - b.energy).abs() < 1e-7);
    }
    let summary = crate::observation::summary(&w);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-8);
}

#[test]
fn births_clear_pending_hearing_while_budding_parents_keep_it() {
    for reproduction in ["fission", "budding"] {
        let mut w = world(1);
        w.config.reproduction = reproduction.into();
        let body = w.cells[0].body.map(|v| v * 2.);
        w.cells[0].set_fixture_body(body);
        w.cells[0].energy = 2.;
        w.cells[0].brain.hearing.receive(42, [1., 0.], 0.5);
        crate::lifecycle::reproduce(&mut w);
        assert_eq!(w.ledger.divisions, 1);
        for cell in &w.cells {
            if cell.parent.is_some() {
                assert_eq!(cell.brain.hearing.pending, [0.; 27]);
                assert_eq!(cell.brain.task, 0);
            } else {
                assert_eq!(cell.brain.hearing.pending[0], 0.5);
            }
        }
    }
}
