use crate::{config::Config, controller, diagnostics, movement, world::World};

fn fixture(population: usize, swim: f32) -> World {
    let mut world = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: population,
            source_count: 0,
            learning: "static".into(),
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            ..Config::default()
        },
    )
    .unwrap();
    world.field.drift = 0.;
    for g in world.genomes.values_mut() {
        for chromosome in &mut g.chromosomes {
            chromosome.behavior =
                controller::diagnostic([swim, 0., 0., 0., -1., 0., 0., 0., 0.], None);
        }
        g.compile(&world.config, &world.chemistry);
    }
    for (i, cell) in world.cells.iter_mut().enumerate() {
        cell.x = 12. + 0.02 * i as f64;
        cell.y = 12.;
        cell.heading = 0.;
        cell.energy = 1.;
    }
    diagnostics::initialize(&mut world);
    world
}

#[test]
fn newly_evaluated_action_moves_immediately_and_each_base_step_pays_once() {
    let mut world = fixture(1, 1.);
    let initial_energy = world.cells[0].energy;
    assert_eq!(world.cells[0].action.swim, 0.);
    for _ in 0..2 {
        let before_x = world.cells[0].x;
        let previous_motors = world.ledger.flows.motors;
        let previous_upkeep = world.ledger.flows.maintenance;
        world.step();
        let cell = &world.cells[0];
        assert!(cell.action.swim > 0.);
        assert!(cell.x > before_x, "the current action must drive this step");
        let motors = movement::motor_work_rate(
            &cell.body,
            cell.damage,
            cell.action.swim,
            cell.action.turn,
            &world.config,
        ) * world.config.dt;
        assert!((cell.flows.motors - motors).abs() < 1e-12);
        assert!((world.ledger.flows.motors - previous_motors - motors).abs() < 1e-12);
        assert!(
            (world.ledger.flows.maintenance
                - previous_upkeep
                - cell.basal(&world.config, world.tick - 1))
            .abs()
                < 1e-12
        );
        assert!(world.field_elapsed > 0.);
    }
    let expenses = world.ledger.flows.motors + world.ledger.flows.maintenance;
    assert!((initial_energy - world.cells[0].energy - expenses).abs() < 1e-12);
}

#[test]
fn frozen_contact_motion_is_reciprocal_and_independent_of_cell_loop_order() {
    let mut forward = fixture(3, 0.);
    let initial_x: f64 = forward.cells.iter().map(|cell| cell.x).sum();
    let mut reversed = forward.clone();
    reversed.cells.reverse();
    forward.step();
    reversed.step();
    let final_x: f64 = forward.cells.iter().map(|cell| cell.x).sum();
    assert!((final_x - initial_x).abs() < 1e-12);
    assert!(forward.cells[0].x < 12.);
    assert!(forward.cells[2].x > 12.04);
    for a in &forward.cells {
        let b = reversed.cells.iter().find(|cell| cell.id == a.id).unwrap();
        assert!((a.x - b.x).abs() < 1e-12);
        assert!((a.y - b.y).abs() < 1e-12);
        assert!((a.energy - b.energy).abs() < 1e-12);
        assert!(a.contacts.iter().sum::<f64>() > 0.);
        for (left, right) in a.contacts.iter().zip(b.contacts) {
            assert!((left - right).abs() < 1e-12);
        }
    }
}

#[test]
fn aging_exhausts_fixed_newborn_income_and_core_allocation_delays_it() {
    // Fixed-mass upkeep probe: E(t)=E0-slope*t^2/2 with income equal to newborn upkeep.
    // Ordinary payments, ledger accumulation and lifecycle death; no ecological time run.
    let mut lifetimes = Vec::new();
    for motor_gene in [-0.5, 3.] {
        let mut w = fixture(1, 0.);
        let g = w.genomes.get_mut(&1).unwrap();
        for ch in &mut g.chromosomes {
            ch.physical[1] = motor_gene;
        }
        g.compile(&w.config, &w.chemistry);
        crate::physiology::express(&mut w.cells[0], g.compiled.as_ref().unwrap());
        w.cells[0].energy = 0.1;
        w.cells[0].inventory.fill(0.);
        diagnostics::initialize(&mut w);
        let c = &w.cells[0];
        let base = crate::organism::maintenance_rate(&c.body, 0., 0., &w.config);
        let slope = w.config.maintenance * c.mass().powi(2) / (w.config.aging_time * c.body[0]);
        let expected = (2. * c.energy / slope).sqrt();
        assert!(expected < 1000.);
        for _ in 0..5000 {
            w.cells[0].flows = Default::default();
            let income = base * w.config.dt;
            w.cells[0].energy += income;
            w.ledger.supplied_energy += income;
            w.finish_cells();
            w.tick += 1;
            crate::lifecycle::advance(&mut w);
            if w.cells.is_empty() {
                break;
            }
        }
        let measured = w.tick as f64 * w.config.dt;
        assert!(w.cells.is_empty());
        assert!((measured - expected).abs() <= w.config.dt);
        assert_eq!(w.ledger.deaths, 1);
        assert_eq!(w.ledger.divisions, 0);
        let summary = crate::observation::summary(&w);
        assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-8);
        println!("motor gene {motor_gene}: predicted {expected:.3}s; died at {measured:.3}s");
        lifetimes.push(measured);
    }
    assert!(lifetimes[0] > lifetimes[1]);
}
