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
    assert!((f.routes.iter().sum::<f64>() - f.ledger.flows.reacted).abs() < 1e-12);
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
