use crate::{ancestry, config::Config, lifecycle, world::World};
use serde_json::json;

fn world(budget: usize, reproduction: &str) -> World {
    World::new(
        27,
        Config {
            width: 16.,
            height: 16.,
            founders: 1,
            source_count: 0,
            max_ancestry_records: budget,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            reproduction: reproduction.into(),
            ..Default::default()
        },
    )
    .unwrap()
}

fn turnover(w: &mut World) {
    w.tick += 1;
    let c = &mut w.cells[0];
    let target = w.genomes[&c.genome].compiled.as_ref().unwrap().body;
    c.set_fixture_body(target.map(|q| 2. * q));
    c.energy = 1.;
    c.inventory.fill(0.);
    c.inventory.set(0, 0.8);
    crate::diagnostics::initialize(w);
    lifecycle::reproduce(w);
    assert_eq!(w.cells.len(), 2);
    let removed = w.cells.remove(0);
    lifecycle::release(w, &removed, ancestry::Cause::ConstructedDeath);
    ancestry::compact(w);
}

#[test]
fn retention_preserves_physics_ids_and_continuation_across_many_cycles() {
    for mode in ["fission", "budding"] {
        let mut bounded = world(8, mode);
        let mut full = world(10000, mode);
        for _ in 0..128 {
            turnover(&mut bounded);
            turnover(&mut full);
            assert_eq!(bounded.stop_reason, None);
            assert!(bounded.ancestry.len() <= bounded.cells.len() + 8);
            assert_eq!(bounded.next_cell, full.next_cell);
            assert_eq!(bounded.held(), full.held());
            assert_eq!(
                serde_json::to_value(&bounded.cells).unwrap(),
                serde_json::to_value(&full.cells).unwrap()
            );
            assert_eq!(
                serde_json::to_value(&bounded.ledger).unwrap(),
                serde_json::to_value(&full.ledger).unwrap()
            );
            bounded.validate().unwrap();
        }
        assert!(bounded.ancestry.len() < full.ancestry.len());
        let before = bounded.snapshot().unwrap();
        let id = bounded.cells[0].id;
        let selected = crate::observation::inspect(&bounded, id).unwrap();
        assert_eq!(selected["genealogy"]["complete"], false);
        assert_eq!(
            selected["genealogy"]["generation"],
            bounded.cells[0].generation
        );
        assert!(crate::observation::inspect(&bounded, 1).is_err());
        crate::census::observe(&bounded, &json!({})).unwrap();
        let mut colors = crate::presentation::Colors::default();
        for mode in [5, 11, 12, 13] {
            colors.prepare(&bounded, mode, id);
            colors.color(&bounded, &bounded.cells[0], mode, id, 0.5);
        }
        assert_eq!(bounded.snapshot().unwrap(), before);
        let mut restored = World::restore(&before).unwrap();
        bounded.step();
        restored.step();
        assert_eq!(bounded.snapshot().unwrap(), restored.snapshot().unwrap());
    }
}

#[test]
fn live_records_survive_even_when_population_exceeds_history_budget() {
    let mut w = world(1, "budding");
    for _ in 0..8 {
        let c = &mut w.cells[0];
        let target = w.genomes[&c.genome].compiled.as_ref().unwrap().body;
        c.set_fixture_body(target.map(|q| 2. * q));
        c.energy = 1.;
        c.inventory.set(0, 0.8);
        lifecycle::reproduce(&mut w);
    }
    assert_eq!(w.cells.len(), 9);
    assert_eq!(w.ancestry.len(), 9);
    assert_eq!(w.stop_reason, None);
    w.validate().unwrap();
}

#[test]
fn old_bookkeeping_stops_clear_on_restore_without_reseeding() {
    for reason in ["ancestry-limit", "extinction"] {
        let mut w = world(8, "fission");
        w.tick = 123;
        w.stop_reason = Some(reason.into());
        let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
        assert_eq!(restored.stop_reason, None);
        assert_eq!(restored.tick, 123);
        assert_eq!(restored.cells[0].id, w.cells[0].id);
        restored.step();
        assert_eq!(restored.tick, 124);
    }
}

#[test]
fn expired_pins_fail_explicitly_without_changing_physics() {
    let mut w = world(8, "fission");
    for _ in 0..16 {
        turnover(&mut w);
    }
    let before = w.snapshot().unwrap();
    let pin = crate::phenotype::Pin {
        id: "old".into(),
        label: "Historical cohort".into(),
        started: 0,
        roots: std::collections::BTreeSet::from([1]),
        live: Default::default(),
    };
    assert!(
        crate::phenotype::restore_pin(&w, pin)
            .unwrap_err()
            .contains("expired")
    );
    assert_eq!(w.snapshot().unwrap(), before);
}
