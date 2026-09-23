use crate::{ancestry::Cause, config::Config, lifecycle, metabolism, world::World};

fn world() -> World {
    World::new(
        101,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 0,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..Config::default()
        },
    )
    .unwrap()
}

fn close(a: f64, b: f64) {
    assert!((a - b).abs() < 1e-9 * (1. + a.abs()), "{a} != {b}");
}

#[test]
fn growth_and_death_return_each_funded_species_with_paid_assembly() {
    for species in [0, 178, 240, 255] {
        let mut w = world();
        let initial = w.cells[0].bound_material.clone();
        let cell = &mut w.cells[0];
        cell.inventory.fill(0.);
        cell.inventory.set(species, 0.7);
        cell.inventory.set(187, 0.3);
        cell.energy = 10.;
        let before = w.held();
        let cell = &mut w.cells[0];
        let (built, heat) = metabolism::assemble(cell, &w.chemistry, &w.config, 0.5, 0., 0.);
        cell.body[0] += built;
        close(built, 0.5);
        close(heat, built * w.config.construction_energy);
        close(
            cell.bound_material.value(species) - initial.value(species),
            0.35,
        );
        close(cell.bound_material.value(187) - initial.value(187), 0.15);
        cell.validate(&w.config).unwrap();
        let after = w.held();
        close(before.0, after.0);
        close(before.1, after.1 + heat);
        let cell = w.cells.remove(0);
        let field = w.field.amounts().clone();
        lifecycle::release(&mut w, &cell, Cause::Starvation);
        for s in 0..256 {
            let released: f64 = (0..w.field.nx * w.field.ny)
                .map(|n| w.field.amounts()[n * 256 + s] as f64 - field[n * 256 + s] as f64)
                .sum();
            assert!(
                (released - cell.inventory.value(s) - cell.bound_material.value(s)).abs() < 1e-6
            );
        }
    }
}

#[test]
fn repeated_repair_exchanges_frozen_mixtures_without_creating_chemicals_or_work() {
    let mut w = world();
    let cell = &mut w.cells[0];
    let mass = cell.mass();
    cell.bound_material.fill(0.);
    cell.bound_material.set(178, mass * 0.7);
    cell.bound_material.set(240, mass * 0.3);
    cell.inventory.fill(0.);
    cell.inventory.set(0, 0.8);
    cell.energy = 10.;
    cell.damage = 0.5;
    cell.action.repair = 1.;
    let before: Vec<_> = (0..256)
        .map(|s| cell.inventory.value(s) + cell.bound_material.value(s))
        .collect();
    let replaced = mass * w.config.repair_material * w.config.repair_rate;
    metabolism::repair(cell, &w.config, &w.chemistry, 1.);
    close(cell.inventory.value(178), replaced * 0.7);
    close(cell.inventory.value(240), replaced * 0.3);
    close(cell.bound_material.value(0), replaced);
    for _ in 0..100 {
        metabolism::repair(cell, &w.config, &w.chemistry, 1.);
    }
    for (s, amount) in before.iter().enumerate() {
        close(
            *amount,
            cell.inventory.value(s) + cell.bound_material.value(s),
        );
    }
    close(cell.energy + cell.flows.repair, 10.);
    close(
        cell.flows.repair,
        cell.flows.repaired * mass * w.config.repair_energy,
    );
    assert_eq!(cell.bound_material.value(w.chemistry.decomposition), 0.);
    cell.validate(&w.config).unwrap();
    let frozen = cell.bound_material.clone();
    cell.energy = 0.;
    cell.damage = 0.5;
    metabolism::repair(cell, &w.config, &w.chemistry, 1.);
    assert_eq!(
        cell.bound_material.iter().collect::<Vec<_>>(),
        frozen.iter().collect::<Vec<_>>()
    );
}

#[test]
fn division_splits_actual_composition_for_fission_and_budding() {
    for mode in ["fission", "budding"] {
        let mut w = world();
        w.config.reproduction = mode.into();
        let cell = &mut w.cells[0];
        cell.set_fixture_body(cell.body.map(|q| q * 2.));
        let mass = cell.mass();
        cell.bound_material.fill(0.);
        cell.bound_material.set(178, mass * 0.7);
        cell.bound_material.set(187, mass * 0.3);
        cell.inventory.fill(0.);
        cell.inventory.set(0, 2.);
        cell.energy = 10.;
        lifecycle::reproduce(&mut w);
        assert_eq!(w.cells.len(), 2);
        for cell in &w.cells {
            close(cell.bound_material.value(178), mass * 0.35);
            close(cell.bound_material.value(187), mass * 0.15);
            cell.validate(&w.config).unwrap();
        }
    }
}

#[test]
fn restore_preserves_mixtures_and_rejects_unfunded_body_and_old_schema() {
    let mut w = world();
    let cell = &mut w.cells[0];
    let mass = cell.mass();
    cell.bound_material.fill(0.);
    cell.bound_material.set(178, mass);
    let initial = w.held();
    w.ledger.initial_material = initial.0;
    w.ledger.initial_energy = initial.1;
    let saved = w.snapshot().unwrap();
    let mut restored = World::restore(&saved).unwrap();
    for _ in 0..17 {
        w.step();
        restored.step();
    }
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
    restored.cells[0].bound_material.scale(0.5);
    assert!(
        World::restore(&restored.snapshot().unwrap())
            .unwrap_err()
            .contains("Bound material")
    );
    let mut old = saved;
    old[7] = b'1';
    old[8] = b'9';
    assert!(World::restore(&old).unwrap_err().contains("v41 required"));
}
