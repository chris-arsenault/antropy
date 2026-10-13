use crate::{binding::Key, chemistry::coordinate, controller, diagnostics, world::World};
use serde_json::json;

fn feedback(informative: bool) -> World {
    let mut w = crate::ecology_direction_tests::succession(true, false);
    w.config.activity.strategy = false;
    for g in w.genomes.values_mut() {
        let producer = g.id == 1;
        for ch in &mut g.chromosomes {
            let mut logits = vec![-3.; controller::TOTAL_OUTPUTS];
            logits[0] = 0.;
            logits[1] = 0.;
            logits[2] = 3.;
            logits[7] = 0.;
            logits[8] = 0.;
            logits[5] = if producer { 3. } else { 0. };
            logits[6] = -3.;
            logits[controller::ACTIVITY] = 3.;
            let mut paths = vec![];
            if producer {
                ch.chemistry.programs[1] = true;
                ch.physical[9] = 3.;
                ch.physical[12] = 3.;
                ch.chemistry.keys.as_mut().unwrap().transporters[2] = Key::target(coordinate(128));
                ch.chemistry.keys.as_mut().unwrap().enzymes[1] = Key::target(coordinate(128));
                ch.chemistry.enzymes[1] =
                    crate::genetics::Enzyme::between(coordinate(128), coordinate(8));
                logits[7] = 3.;
                logits[controller::ACTIVITY + 1] = 3.;
                logits[controller::SPEECH_EFFORT] = 3.;
                for bit in 0..8 {
                    logits[controller::SPEECH_BITS + bit] = -0.1;
                    paths.push((
                        0,
                        controller::SPEECH_BITS + bit,
                        if informative { 6. } else { -6. },
                    ));
                }
            } else {
                // Identical local receptor cues, paid event and ear; only private message differs.
                paths.push((controller::HEARING_INPUT + 3, 5, 6.));
            }
            ch.behavior = controller::diagnostics::authored_responses(logits, &paths).unwrap();
        }
        g.compile(&w.config, &w.chemistry);
    }
    diagnostics::initialize(&mut w);
    w.ecology = Some(Box::new(crate::ecology_observation::Observer::new(&w)));
    w
}

#[test]
fn paid_content_changes_receiver_processing_and_returned_material() {
    // Private producer feedstock precedes the receiver's product cue. Fixed 120-tick question:
    // does correctly associated content change returned product and the paying speaker's intake?
    // Strategy and learning are off; no language convention is installed in ordinary founders.
    let mut informative = feedback(true);
    let mut wrong = feedback(false);
    let mut withheld = World::restore(&informative.snapshot().unwrap()).unwrap();
    withheld.ecology = Some(Box::new(crate::ecology_observation::Observer::new(
        &withheld,
    )));
    crate::run_control::configure(&mut withheld, &json!({"patch":{"hearingContent":false}}))
        .unwrap();
    let mut silent = World::restore(&informative.snapshot().unwrap()).unwrap();
    silent.ecology = Some(Box::new(crate::ecology_observation::Observer::new(&silent)));
    crate::run_control::configure(&mut silent, &json!({"patch":{"speech":false}})).unwrap();
    for _ in 0..120 {
        informative.step();
        wrong.step();
        withheld.step();
        silent.step();
    }
    for w in [&informative, &wrong, &withheld, &silent] {
        w.validate().unwrap();
        let summary = crate::observation::summary(w);
        assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-6);
        assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-6);
    }
    let read = |w: &World| {
        let producer = w.cells.iter().find(|c| c.id == 1).unwrap();
        let receiver = w.cells.iter().find(|c| c.id == 2).unwrap();
        (
            producer.chemical_flows.imported.value(128),
            receiver.chemical_flows.imported.value(136),
            receiver.chemical_flows.exported.value(128),
            producer.energy,
            producer.flows.speech_work,
            w.ledger.flows.speech_work,
            w.ledger.flows.captured,
        )
    };
    let a = read(&informative);
    let b = read(&wrong);
    let c = read(&withheld);
    println!(
        "paid feedback (speaker import128, receiver import136/export128, reserve, last/total speech, capture): informative={a:?} wrong={b:?} withheld={c:?}"
    );
    assert!(a.1 > b.1);
    assert!(a.2 > b.2);
    assert!(a.0 > b.0);
    assert!(a.5 > 0. && b.5 > 0. && c.5 > 0.);
    for (name, world) in [
        ("informative", &informative),
        ("wrong", &wrong),
        ("withheld", &withheld),
        ("silent", &silent),
    ] {
        let window = &world.ecology.as_ref().unwrap().active[&1].current;
        let f = &window.ledger.flows;
        println!(
            "speaker {name}: captured={} maintenance={} transport={} growth={} speech={} reserve={}",
            f.captured,
            f.maintenance,
            f.transport,
            f.growth,
            f.speech_work,
            world.cells.iter().find(|cell| cell.id == 1).unwrap().energy
        );
    }
}

#[test]
fn independent_speech_listening_and_information_controls_preserve_once_only_events() {
    for (speech, listening) in [(true, false), (false, true), (true, true)] {
        let mut w = feedback(true);
        let body = w.cells[0].body;
        crate::run_control::configure(
            &mut w,
            &json!({"patch":{"speech":speech,"listening":listening}}),
        )
        .unwrap();
        for _ in 0..8 {
            w.step();
        }
        assert_eq!(w.ledger.flows.speech_work > 0., speech);
        assert_eq!(w.ledger.flows.heard > 0., speech && listening);
        assert!(w.cells[0].body[crate::organism::MOUTH_STOCK] > 0.);
        assert!(body[crate::organism::EAR_STOCK] > 0.);
        let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
        let paid = restored.ledger.flows.speech_work;
        restored.step();
        assert_eq!(restored.ledger.flows.speech_work, paid);
        restored.validate().unwrap();
    }
    let mut hearing = controller::hearing::Hearing::default();
    hearing.receive(255, [1., 0.], 0.5);
    let channels = hearing.consume();
    let mut c = crate::config::Config::default();
    c.hearing_content = false;
    let masked = controller::hearing::filtered(channels, &c);
    assert!(masked[0] > 0.);
    assert!(masked[1] > 0.);
    assert!(masked[3..].iter().all(|x| *x == 0.));
    c.hearing_content = true;
    c.hearing_bearing = false;
    let masked = controller::hearing::filtered(channels, &c);
    assert!(masked[3] > 0.);
    assert!(
        masked
            .chunks_exact(3)
            .all(|row| row[1] == 0. && row[2] == 0.)
    );
}
