//! Bounded constructed questions; every action and consequence uses the ordinary World.
use crate::{binding::Key, config::Config, controller, diagnostics, world::World};
use serde_json::json;

fn lock(species: usize) -> Key {
    Key::target(crate::chemistry::coordinate(species))
}

fn receiver(w: &World) -> &crate::organism::Cell {
    w.cells
        .iter()
        .find(|c| c.id == 2)
        .expect("receiver survives the declared bounded fixture")
}

pub(crate) fn succession(export: bool, responsive: bool) -> World {
    let mut w = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 2,
            source_count: 0,
            radial_founders: false,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            learning_retention: 0.,
            ..Config::default()
        },
    )
    .unwrap();
    let packet = w.cells[0].bound_material.clone();
    for (index, g) in w.genomes.values_mut().enumerate() {
        let producer = index == 0;
        let substrate = if producer { 0 } else { 136 };
        let product = if producer { 136 } else { 128 };
        let mut logits = vec![-3.; controller::TOTAL_OUTPUTS];
        logits[0] = 0.;
        logits[1] = 0.;
        logits[2] = 3.;
        logits[5] = if producer { 3. } else { 0. };
        logits[6] = if producer && !export { 0. } else { -3. };
        logits[7] = 0.;
        logits[8] = 0.;
        logits[controller::ACTIVITY] = 3.;
        for ch in &mut g.chromosomes {
            ch.physical[7] = 3.;
            ch.physical[8] = 3.;
            ch.physical[11] = 3.;
            ch.chemistry.programs = std::array::from_fn(|i| i == 0);
            ch.chemistry.enzymes[0] = crate::genetics::Enzyme {
                x: 0.,
                y: 0.,
                center_x: if producer { 4. } else { 8. },
                center_y: 4.,
                angle: 0.,
            };
            let keys = ch.chemistry.keys.as_mut().unwrap();
            keys.receptors = [lock(substrate); 4];
            keys.transporters[0] = lock(substrate);
            keys.transporters[1] = lock(product);
            keys.enzymes[0] = lock(substrate);
            keys.membrane = lock(136);
            ch.behavior = controller::diagnostics::authored(
                logits.clone(),
                if !producer && responsive {
                    Some((0, 5, 6.))
                } else {
                    None
                },
            )
            .unwrap();
        }
        g.compile(&w.config, &w.chemistry);
    }
    for (index, cell) in w.cells.iter_mut().enumerate() {
        cell.x = 12. + 2. * index as f64;
        cell.y = 12.;
        cell.heading = 0.;
        cell.inventory.fill(0.);
        cell.bound_material = packet.clone();
        cell.energy = 0.5;
    }
    for node in 0..w.field.nx * w.field.ny {
        w.field.add(node, 0, 1.2, &w.chemistry);
    }
    diagnostics::initialize(&mut w);
    w
}

#[test]
fn chemical_export_changes_a_neighbor_reading_and_paid_response() {
    // Question: does a finite exported intermediate change ordinary paid receiver action?
    // Competing explanations: passive leakage or private cycling without response.
    // Three matched conditions; 120 ticks, one seed, frozen mutation/learning/assimilation.
    let mut active = succession(true, true);
    let mut held_export = succession(false, true);
    let mut held_response = succession(true, false);
    for w in [&active, &held_export, &held_response] {
        let budget = crate::binding_observation::budget(w, &json!({"cell":2})).unwrap();
        assert_eq!(budget["ticksAdvanced"], 0);
    }
    for _ in 0..120 {
        active.step();
        held_export.step();
        held_response.step();
    }
    for w in [&active, &held_export, &held_response] {
        w.validate().unwrap();
        let summary = crate::observation::summary(w);
        assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-6);
        assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-6);
    }
    let a = receiver(&active);
    let e = receiver(&held_export);
    let r = receiver(&held_response);
    println!(
        "succession receiver: imports136 active={} exportHeld={} responseHeld={} effort={} / {} / {} cue={} / {}; total work={} expenses={}",
        a.chemical_flows.imported.value(136),
        e.chemical_flows.imported.value(136),
        r.chemical_flows.imported.value(136),
        a.action.transport[0],
        e.action.transport[0],
        r.action.transport[0],
        a.inputs[0],
        e.inputs[0],
        active.ledger.flows.captured,
        active.ledger.heat()
    );
    assert!(a.chemical_flows.imported.value(136) > e.chemical_flows.imported.value(136));
    assert!(a.inputs[0] > e.inputs[0]);
    assert!(a.action.transport[0] > r.action.transport[0]);
    assert!(active.ledger.flows.transport > 0.);
    assert!(a.chemical_flows.consumed.value(136) > 0.);
}

#[test]
fn relationships_report_funded_union_and_gross_histories_without_mutation() {
    let mut w = succession(true, true);
    for _ in 0..8 {
        w.step();
    }
    let before = w.snapshot().unwrap();
    let report = crate::chemical_relationships::observe(&w, 2).unwrap();
    assert_eq!(report["sites"].as_array().unwrap().len(), 17);
    assert!(report["fundedEnzymeUnion"].as_u64().unwrap() > 0);
    assert!(
        report["sites"]
            .as_array()
            .unwrap()
            .iter()
            .all(|r| r["totalAffinity"].as_f64().unwrap() <= 1. + 1e-12)
    );
    assert_eq!(w.snapshot().unwrap(), before);
}

pub(crate) fn replace_supply(w: &mut World, species: usize) {
    supply(w, Some(species));
}
pub(crate) fn clear_supply(w: &mut World) {
    supply(w, None);
}
fn supply(w: &mut World, species: Option<usize>) {
    let removed = w.field.totals(&w.chemistry);
    w.field.replace_material(&w.chemistry, |index| {
        if Some(index % 256) == species {
            1.2
        } else {
            0.
        }
    });
    let added = w.field.totals(&w.chemistry);
    w.ledger.washed_out += removed.0;
    w.ledger.washout_energy += removed.1;
    w.ledger.supplied += added.0;
    w.ledger.supplied_energy += added.1;
}

pub(crate) fn allocation_world() -> World {
    let mut w = succession(true, true);
    crate::commands::execute(&mut w, &json!({"op":"intervene","cell":1,"kill":true})).unwrap();
    let g = w.genomes.get_mut(&2).unwrap();
    for ch in &mut g.chromosomes {
        ch.chemistry.programs[1] = true;
        ch.physical[12] = 3.;
        ch.chemistry.enzymes[1] = crate::genetics::Enzyme {
            x: 0.,
            y: 0.,
            center_x: 4.,
            center_y: 4.,
            angle: 0.,
        };
        let keys = ch.chemistry.keys.as_mut().unwrap();
        keys.receptors[1] = lock(0);
        keys.transporters[1] = lock(0);
        keys.enzymes[1] = lock(0);
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
                (4, controller::ACTIVITY + 1, 6.),
            ],
        )
        .unwrap();
    }
    g.compile(&w.config, &w.chemistry);
    replace_supply(&mut w, 136);
    diagnostics::initialize(&mut w);
    w
}

#[test]
fn supply_reversal_changes_allocation_within_one_inherited_repertoire() {
    // Two 40-tick windows isolate immediate inference, not learned benefit.
    let mut w = allocation_world();
    let birth_body = w.cells[0].body;
    let budget = crate::binding_observation::budget(&w, &json!({"cell":2})).unwrap();
    assert_eq!(budget["ticksAdvanced"], 0);
    for _ in 0..40 {
        w.step();
    }
    let before = w.cells[0].action.activity;
    let consumed = w.cells[0].chemical_flows.consumed.value(0);
    replace_supply(&mut w, 0);
    for _ in 0..40 {
        w.step();
    }
    let cell = &w.cells[0];
    println!(
        "allocation reversal: effort before={:?} after={:?}; captured={} learning={} growth={}",
        &before[..2],
        &cell.action.activity[..2],
        w.ledger.flows.captured,
        w.ledger.flows.learning,
        w.ledger.flows.grown
    );
    assert!(before[0] > before[1]);
    assert!(cell.action.activity[1] > cell.action.activity[0]);
    assert!(cell.chemical_flows.consumed.value(0) > consumed);
    assert!(w.ledger.flows.captured > 0.);
    assert_eq!(w.ledger.flows.learning, 0.);
    // Capacities scale with biomass, but no physical proportions or genotype were refitted.
    for i in 1..crate::organism::STOCKS {
        assert!((cell.body[i] / cell.body[0] - birth_body[i] / birth_body[0]).abs() < 1e-12);
    }
    let summary = crate::observation::summary(&w);
    assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-6);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-6);
}
