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
            (world.ledger.flows.maintenance - previous_upkeep - cell.basal(&world.config)).abs()
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
