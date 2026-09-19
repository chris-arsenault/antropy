use crate::{commands::execute, config::Config, world::World};
use serde_json::json;

fn world() -> World {
    World::new(
        101,
        Config {
            width: 16.,
            height: 16.,
            founders: 2,
            source_count: 0,
            ..Config::default()
        },
    )
    .unwrap()
}
fn rejected(change: impl FnOnce(&mut World)) {
    let mut w = world();
    change(&mut w);
    assert!(World::restore(&w.snapshot().unwrap()).is_err());
}
#[test]
fn restore_rejects_inconsistent_bodies_and_history() {
    let mut trailing = world().snapshot().unwrap();
    trailing.push(0);
    assert!(World::restore(&trailing).is_err());
    rejected(|w| w.cells[0].generation = 1);
    rejected(|w| {
        w.tick = 1;
        w.cells[0].born = 1;
    });
    rejected(|w| {
        w.cells.remove(0);
    });
    rejected(|w| {
        w.ancestry[1].lineage = 1;
        w.cells[1].lineage = 1;
    });
    rejected(|w| w.cells[0].parent = Some(2));
    rejected(|w| w.ancestry[0].cause = crate::ancestry::Cause::Starvation);
    rejected(|w| w.next_genome = 0);
    rejected(|w| w.genomes.get_mut(&1).unwrap().parent = Some(1));
}
#[test]
fn restore_rejects_nonfinite_accounting_and_controller_state() {
    rejected(|w| w.ledger.flows.motors = f64::NAN);
    rejected(|w| w.cells[0].flows.exposure = f64::INFINITY);
    rejected(|w| w.cells[0].receptors[0] = f64::NAN);
    rejected(|w| w.cells[0].action.swim = 2.);
    rejected(|w| w.cells[0].brain.last_energy = Some(f32::NAN));
    rejected(|w| w.patch_centers[0][0] = -1.);
}
#[test]
fn manual_interventions_survive_recent_event_rollover_and_restore() {
    let mut w = world();
    execute(&mut w, &json!({"op":"task","cell":1,"value":91})).unwrap();
    for _ in 0..600 {
        w.event("ordinary", 0, vec![]);
    }
    w.step();
    assert_eq!(w.events.len(), 513);
    assert_eq!(w.events[0].kind, "override");
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    for _ in 0..3 {
        w.step();
        restored.step();
    }
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
    for _ in 1..4096 {
        w.event("override", 1, vec![0, 91]);
    }
    let before = w.snapshot().unwrap();
    assert!(execute(&mut w, &json!({"op":"task","cell":1,"value":92})).is_err());
    assert_eq!(before, w.snapshot().unwrap());
}
#[test]
fn counterfactual_retools_paid_machinery_and_resets_both_memories() {
    let mut w = world();
    for c in &mut w.cells {
        c.brain.traces.fill(0.5);
    }
    let mut g = w.genomes[&1].clone();
    g.chromosomes[0].chemistry.transporters[0].x = 10.;
    let before = w.held();
    execute(
        &mut w,
        &json!({"op":"replaceLineage","replacement":{"lineage":1,"genotypes":{"1":g}}}),
    )
    .unwrap();
    assert_eq!(w.cells[0].body[7], w.cells[1].body[7]);
    assert_ne!(w.cells[0].machinery_genome, w.cells[0].genome);
    assert!(w.cells[1].body[7] > 0.);
    assert!(
        w.cells
            .iter()
            .all(|c| c.brain.traces.iter().all(|x| *x == 0.))
    );
    let after = w.held();
    assert!((before.0 - after.0 - w.ledger.numerical_material).abs() < 1e-7);
    assert!((before.1 - after.1 - w.ledger.numerical_energy).abs() < 1e-7);
    assert_eq!(w.ledger.supplied, 0.);
    World::restore(&w.snapshot().unwrap()).unwrap();
}

#[test]
fn diagnostic_catalog_is_atomic_and_does_not_replace_observed_cells() {
    let mut w = world();
    let before = serde_json::to_value(&w.cells).unwrap();
    let mut candidate = w.genomes[&1].clone();
    candidate.parent = Some(1);
    candidate.chromosomes[0].chemistry.membrane.x += 1.;
    let mut invalid = candidate.clone();
    invalid.parent = Some(9000);
    let initial = w.snapshot().unwrap();
    let next_genome = w.next_genome;
    assert!(
        execute(
            &mut w,
            &json!({"op":"appendCatalog", "genotypes":[candidate, invalid]})
        )
        .is_err()
    );
    assert_eq!(initial, w.snapshot().unwrap());
    let ids = execute(
        &mut w,
        &json!({"op":"appendCatalog", "genotypes":[candidate]}),
    )
    .unwrap();
    assert_eq!(ids, json!([next_genome]));
    assert_eq!(before, serde_json::to_value(&w.cells).unwrap());
    assert_eq!(w.events.last().unwrap().kind, "catalog");
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    for _ in 0..3 {
        w.step();
        restored.step();
    }
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
}
