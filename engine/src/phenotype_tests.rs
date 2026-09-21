use crate::{commands::execute, phenotype::Selection, world::World};
use serde_json::json;

fn enable(w: &mut World) {
    execute(
        w,
        &json!({"op":"phenotype","action":"configure","enabled":true,
        "highlight":true,"selection":{"kind":"all"}}),
    )
    .unwrap();
}

#[test]
fn actual_flows_reconcile_without_changing_physical_continuation() {
    let mut w = crate::initial_ecology::probe(2, true).unwrap();
    let mut control = w.clone();
    enable(&mut w);
    let before = w.ledger.clone();
    for _ in 0..60 {
        w.step();
        control.step();
    }
    assert_eq!(w.snapshot().unwrap(), control.snapshot().unwrap());
    let o = w.observer.as_ref().unwrap();
    let f = &o.interval().groups[0];
    assert!(f.ledger.flows.reacted > 0.);
    assert!((w.observed_reactions(0).iter().sum::<f64>() - f.ledger.flows.reacted).abs() < 1e-12);
    assert!(
        (f.imports.iter().sum::<f64>() - (w.ledger.flows.imported - before.flows.imported)).abs()
            < 1e-12
    );
    assert!((f.exports.iter().sum::<f64>() - f.ledger.flows.exported).abs() < 1e-12);
    assert_eq!(
        f.ledger.flows.captured,
        w.ledger.flows.captured - before.flows.captured
    );
    let report = execute(&mut w, &json!({"op":"phenotype","action":"report"})).unwrap();
    assert!(report.to_string().len() < 16384);
    assert_eq!(report["groups"][0], report["groups"][1]);
    assert_eq!(
        report["groups"][2]["actual"],
        serde_json::to_value([None::<f64>; 7]).unwrap()
    );
    let web = execute(
        &mut w,
        &json!({"op":"chemicalWeb","mode":"measured","focus":null,"offset":0}),
    )
    .unwrap();
    assert!(web.to_string().len() < 16384);
    assert_eq!(web["window"]["end"], 60);
    assert!(web["pairs"].as_u64().unwrap() > 0);
    assert_eq!(w.snapshot().unwrap(), control.snapshot().unwrap());
}

#[test]
fn disabling_observation_keeps_the_last_accepted_window() {
    let mut w = crate::initial_ecology::probe(2, true).unwrap();
    enable(&mut w);
    for _ in 0..8 {
        w.step();
    }
    let before = w.observed_reactions(0).to_vec();
    assert!(before.iter().sum::<f64>() > 0.);
    execute(
        &mut w,
        &json!({"op":"phenotype","action":"configure","enabled":false,
        "highlight":false,"selection":{"kind":"all"}}),
    )
    .unwrap();
    for _ in 0..8 {
        w.step();
    }
    for (&a, &b) in w.observed_reactions(0).iter().zip(&before) {
        assert!((a - b).abs() < 1e-12);
    }
}

#[test]
fn pinned_roots_follow_fission_changed_roles_death_and_restore() {
    let mut w = crate::initial_ecology::probe(0, true).unwrap();
    w.config.division_work_per_core = crate::config::Config::default().division_work_per_core;
    enable(&mut w);
    execute(
        &mut w,
        &json!({"op":"phenotype","action":"pin","id":"cohort","label":"Founder"}),
    )
    .unwrap();
    let saved = serde_json::to_value(w.observer.as_ref().unwrap().pin.as_ref().unwrap()).unwrap();
    let body = w.genomes[&w.cells[0].genome]
        .compiled
        .as_ref()
        .unwrap()
        .body;
    w.cells[0].set_fixture_body(body.map(|q| q * 2.1));
    w.cells[0].energy = w.cells[0].energy_capacity(&w.config);
    w.cells[0].inventory.fill(0.01);
    w.tick = 1;
    crate::lifecycle::reproduce(&mut w);
    assert_eq!(w.cells.len(), 2);
    let o = w.observer.as_mut().unwrap();
    assert_eq!(o.pin.as_ref().unwrap().live.len(), 2);
    assert!(!o.pinned(1));
    o.selection = Selection::Role {
        input: 255,
        output: 255,
    };
    assert!(!o.selected(&w.cells[0]));
    assert!(o.pinned(w.cells[0].id));
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    execute(
        &mut restored,
        &json!({"op":"phenotype","action":"restorePin","pin":saved}),
    )
    .unwrap();
    assert_eq!(
        restored
            .observer
            .as_ref()
            .unwrap()
            .pin
            .as_ref()
            .unwrap()
            .live,
        w.observer.as_ref().unwrap().pin.as_ref().unwrap().live
    );
    let cells = std::mem::take(&mut w.cells);
    for c in cells {
        crate::lifecycle::release(&mut w, &c, crate::ancestry::Cause::Starvation);
    }
    assert!(
        w.observer
            .as_ref()
            .unwrap()
            .pin
            .as_ref()
            .unwrap()
            .live
            .is_empty()
    );
    let report = execute(&mut w, &json!({"op":"phenotype","action":"report"})).unwrap();
    assert_eq!(report["groups"][2]["count"], 0);
    assert_eq!(report["pin"]["roots"], 1);
}

#[test]
fn windows_are_bounded_and_filter_changes_do_not_mix_memberships() {
    let mut w = crate::initial_ecology::probe(0, true).unwrap();
    enable(&mut w);
    let o = w.observer.as_mut().unwrap();
    o.current.groups[0].reaction(1, 2, 3.);
    o.finish(250);
    assert_eq!(o.interval().groups[0].routes[258], 3.);
    o.finish(500);
    assert_eq!(o.interval().groups[0].routes[258], 0.);
    assert!(o.current.groups[0].touched.is_empty());
    execute(
        &mut w,
        &json!({"op":"phenotype","action":"configure","enabled":true,
        "highlight":false,"selection":{"kind":"region","id":1},"members":[]}),
    )
    .unwrap();
    assert_eq!(
        w.observer.as_ref().unwrap().coverage(w.config.dt).seconds,
        0.
    );
    assert!(!w.observer.as_ref().unwrap().selected(&w.cells[0]));
    let bad = json!({"op":"phenotype","action":"restorePin","pin":
        {"id":"bad","label":"Bad","started":0,"roots":[999]}});
    assert!(execute(&mut w, &bad).is_err());
}

#[test]
fn compact_reactions_match_expanded_reports_and_preserve_membership_and_windows() {
    let mut w = crate::initial_ecology::probe(0, true).unwrap();
    let work = crate::metabolism::react_observed(
        &mut w.cells[0],
        &w.config,
        &w.chemistry,
        0.01,
        true,
        [1., 1.],
    );
    let mut expected = vec![0.; 65536];
    for (input, output, amount) in work.reactions() {
        expected[input * 256 + output] += amount;
    }
    assert!(expected.iter().any(|q| *q > 0.));
    enable(&mut w);
    let id = w.cells[0].id;
    let o = w.observer.as_mut().unwrap();
    o.selection = Selection::Region { id: 1 };
    o.region.insert(id);
    o.pin = Some(crate::phenotype::Pin {
        id: "local".into(),
        label: "local".into(),
        started: 0,
        roots: [id].into_iter().collect(),
        live: [id].into_iter().collect(),
    });
    o.begin(&w.cells);
    // Membership comes from the current interval's capture, not query-time state.
    o.region.clear();
    o.pin.as_mut().unwrap().live.clear();
    o.reactions(&w.cells[0], &work);
    o.begin(&w.cells);
    o.reactions(&w.cells[0], &work);
    for group in 0..3 {
        let scale = if group == 0 { 2. } else { 1. };
        let actual: std::collections::BTreeMap<_, _> = o.current.reactions(group).collect();
        for (key, q) in expected.iter().enumerate() {
            assert!((actual.get(&key).copied().unwrap_or(0.) - scale * q).abs() < 1e-12);
        }
    }
    o.finish(250);
    let before = w.snapshot().unwrap();
    let query = json!({"op":"chemicalWeb","mode":"measured","focus":null,"offset":0});
    let actual = execute(&mut w, &query).unwrap();
    let repeated = execute(&mut w, &query).unwrap();
    assert_eq!(actual, repeated);
    assert_eq!(w.snapshot().unwrap(), before);
    let mut direct = w.clone();
    let o = direct.observer.as_mut().unwrap();
    o.previous.reset(0);
    o.previous.end = 250;
    for (key, q) in expected.iter().enumerate().filter(|(_, q)| **q > 0.) {
        o.previous.groups[0].reaction(key / 256, key % 256, 2. * q);
    }
    let expanded = execute(&mut direct, &query).unwrap();
    assert_eq!(actual["pairs"], expanded["pairs"]);
    assert_eq!(actual["window"], expanded["window"]);
    assert_eq!(actual["activity"], expanded["activity"]);
    let rows = expanded["rows"].as_array().unwrap();
    for row in actual["rows"].as_array().unwrap() {
        let expected = rows
            .iter()
            .find(|r| r["input"] == row["input"] && r["output"] == row["output"])
            .unwrap();
        assert!(
            (row["amount"].as_f64().unwrap() - expected["amount"].as_f64().unwrap()).abs() < 1e-12
        );
    }
    w.observer.as_mut().unwrap().finish(500);
    assert_eq!(
        w.observer.as_ref().unwrap().interval().reactions(0).count(),
        0
    );
}
