use crate::{
    diagnostics, lifecycle, movement, organism::maintenance_rate, physiology, world::World,
};

fn close(a: f64, b: f64) {
    assert!((a - b).abs() < 1e-10 * (1. + a.abs()), "{a} != {b}");
}

#[test]
fn genetic_motor_is_immediate_without_energy_or_growth_and_zero_is_exact() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let mut g = w.genomes[&1].clone();
    let mut cell = w.cells[0].clone();
    cell.energy = 0.;
    let mass = cell.mass();
    let free = cell.inventory.clone();
    let bound = cell.bound_material.clone();
    let mut speeds = Vec::new();
    for investment in [-1., 0., 1.] {
        for ch in &mut g.chromosomes {
            ch.physical[1] = investment;
        }
        g.compile(&w.config, &w.chemistry);
        physiology::express(&mut cell, g.compiled.as_ref().unwrap());
        close(cell.mass(), mass);
        assert_eq!(cell.energy, 0.);
        assert_eq!(
            cell.inventory.iter().collect::<Vec<_>>(),
            free.iter().collect::<Vec<_>>()
        );
        assert_eq!(
            cell.bound_material.iter().collect::<Vec<_>>(),
            bound.iter().collect::<Vec<_>>()
        );
        assert_eq!(cell.flows.grown, 0.);
        speeds.push(movement::motor_limits(&cell, &w.config, 1.).0);
        // Exercise the ordinary movement operation immediately, with no growth call.
        let mut moving = cell.clone();
        moving.energy = 1.;
        moving.action.swim = 1.;
        let row = crate::footprint::sites(&moving, &w.config, &w.field);
        movement::advance(
            std::slice::from_mut(&mut moving),
            &w.config,
            &w.field,
            &[row],
        );
        close(moving.energy + moving.flows.motors, 1.);
        close(moving.flows.distance, speeds.last().unwrap() * w.config.dt);
        if investment == -1. {
            assert_eq!(cell.body[1], 0.);
            assert_eq!(moving.flows.distance, 0.);
        } else {
            assert!(moving.flows.distance > 0. && moving.flows.motors > 0.);
        }
    }
    assert_eq!(speeds[0], 0.);
    assert!(speeds[2] > speeds[1] && speeds[1] > 0.);
}

#[test]
fn growth_requires_resources_and_preserves_every_genetic_proportion() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let g = w.genomes[&1].compiled.as_ref().unwrap();
    for (energy, material) in [(0., 10.), (10., 0.), (10., 10.)] {
        let mut cell = w.cells[0].clone();
        cell.energy = energy;
        cell.inventory.fill(0.);
        cell.inventory.set(0, material);
        let before = cell.mass();
        physiology::grow(&mut cell, g, &w.config, 10000., w.tick);
        if energy == 0. || material == 0. {
            close(cell.mass(), before);
        } else {
            close(cell.mass(), 2. * g.body.iter().sum::<f64>());
        }
        close(cell.mass() + cell.material(), before + material);
        close(cell.energy + cell.flows.growth, energy);
        close(cell.flows.growth, cell.flows.grown * w.config.growth_energy);
        for (actual, reference) in cell.body.iter().zip(g.body) {
            close(actual / cell.mass(), reference / g.body.iter().sum::<f64>());
        }
    }
}

#[test]
fn mutations_express_at_birth_and_both_division_modes_conserve_resources() {
    for mode in ["fission", "budding"] {
        let mut w = diagnostics::nutrition(0.8, 2., false, false);
        w.config.reproduction = mode.into();
        w.config.physical_mutation_rate = 1.;
        let parent_genome = w.cells[0].genome;
        let parent = &mut w.cells[0];
        parent.set_fixture_body(parent.body.map(|q| q * 2.));
        parent.inventory.fill(0.);
        parent.inventory.set(0, 3.);
        parent.energy = 10.;
        let (matter, energy) = w.held();
        lifecycle::reproduce(&mut w);
        assert_eq!(w.cells.len(), 2);
        assert!(w.cells.iter().any(|cell| cell.genome != parent_genome));
        close(w.held().0, matter);
        close(w.held().1 + w.ledger.division_heat, energy);
        for cell in &w.cells {
            let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
            let expected = physiology::body(g, cell.bound_material.material());
            for (actual, expected) in cell.body.iter().zip(expected) {
                close(*actual, expected);
            }
        }
        let restored = World::restore(&w.snapshot().unwrap()).unwrap();
        for (a, b) in w.cells.iter().zip(&restored.cells) {
            for (x, y) in a.body.iter().zip(b.body) {
                close(*x, y);
            }
        }
    }
}

#[test]
fn repeated_division_cannot_dilute_genetic_capabilities() {
    let mut w = diagnostics::nutrition(0.8, 2., false, false);
    let reference = w.cells[0].body;
    for generation in 1..=5 {
        for cell in &mut w.cells {
            cell.set_fixture_body(reference.map(|q| 2. * q));
            cell.energy = 10.;
            cell.inventory.set(0, 3.);
        }
        lifecycle::reproduce(&mut w);
        assert_eq!(w.cells.len(), 1 << generation);
        for cell in &w.cells {
            for (actual, expected) in cell.body.iter().zip(reference) {
                close(*actual, expected);
            }
        }
    }
}

#[test]
fn equal_biomass_has_equal_basal_cost_regardless_of_equipment() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let mut a = w.cells[0].body;
    let before = maintenance_rate(&a, 0.2, 0., &w.config);
    a[1] += a[11];
    a[11] = 0.;
    close(before, maintenance_rate(&a, 0.2, 0., &w.config));
}
