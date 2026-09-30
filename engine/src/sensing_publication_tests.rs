use super::*;

#[test]
fn funded_physiology_publishes_current_body_damage_and_internal_composition() {
    let mut world = crate::diagnostics::nutrition(0.8, 2., true, false);
    world.cells[0].damage = 0.4;
    let before = world.cells[0].body;
    let steps = (world.config.physiology_interval / world.config.dt).ceil() as usize;
    for _ in 0..steps {
        world.step();
    }
    let cell = &world.cells[0];
    assert_ne!(cell.body, before, "fixture must perform funded body work");
    assert_eq!(cell.inputs[INJURY_INPUT], cell.damage as f32);
    assert_eq!(
        cell.inputs[FILL_INPUT],
        (cell.material() / cell.capacity(&world.config)).clamp(0., 1.) as f32
    );
    // Enzyme programs report accepted turnover; absent programs and idle actuators read zero.
    let mut reacting = false;
    for slot in 0..crate::organism::MAX_ENZYMES {
        let reading = cell.inputs[crate::controller::programs::activity_input(slot)];
        assert!((0. ..1.).contains(&reading));
        if !cell.chemistry().programs[slot] {
            assert_eq!(reading, 0.);
        }
        reacting |= reading > 0.;
    }
    assert!(
        reacting,
        "the fed fixture must report accepted enzyme turnover"
    );
    assert_eq!(cell.inputs[EMITTER_INPUT], 0.);
    for (slot, value) in inward(cell, &world.config).into_iter().enumerate() {
        assert_eq!(
            cell.inputs[crate::controller::INWARD_INPUT + slot * 2],
            value as f32
        );
    }
}

#[test]
fn base_owner_publishes_energy_and_changed_overlap_before_the_next_physiology() {
    let mut world = crate::diagnostics::nutrition(0.8, 2., false, false);
    let mut other = world.cells[0].clone();
    other.id = world.next_cell;
    world.next_cell += 1;
    other.x += other.radius(&world.config);
    world.cells.push(other);
    world
        .contact_cache
        .prepare_local(&world.cells, &world.config);
    let before = world
        .contact_cache
        .graph_prepared(&world.cells, &world.config)
        .contacts[0];
    world.cells[0].x += 0.25 * world.cells[0].radius(&world.config);
    world.cells[0].energy *= 0.25;
    world
        .contact_cache
        .prepare_local(&world.cells, &world.config);
    let contacts = world
        .contact_cache
        .graph_prepared(&world.cells, &world.config)
        .contacts[0];
    assert_ne!(contacts, before);
    let cell = &mut world.cells[0];
    cell.contacts = contacts;
    observe_base(cell, &world.config);
    assert_eq!(&cell.inputs[30..34], &contacts.map(|value| value as f32));
    assert_eq!(
        cell.inputs[28],
        (cell.energy / cell.energy_capacity(&world.config)) as f32
    );
}

#[test]
fn external_receptors_follow_a_changed_local_medium_without_changing_body_cues() {
    let mut world = crate::diagnostics::nutrition(0.8, 2., false, false);
    let cell = &mut world.cells[0];
    let body_input = cell.inputs[FILL_INPUT];
    observe_external(cell, &world.config, &world.field);
    let before = cell.inputs[..16].to_vec();
    let species = cell.operators.as_ref().unwrap().receptors[0][0].species;
    for &(node, weight) in &crate::footprint::sites(cell, &world.config, &world.field) {
        world
            .field
            .add(node, species, weight * 100., &world.chemistry);
    }
    observe_external(cell, &world.config, &world.field);
    assert_ne!(&cell.inputs[..16], before);
    assert_eq!(cell.inputs[FILL_INPUT], body_input);
}

#[test]
fn transporter_activity_reports_accepted_import_not_requested_effort() {
    // The same importing controller reads positive activity only where material is available.
    let readings = [true, false].map(|supply| {
        let mut world = crate::diagnostics::nutrition(0.8, 2., supply, false);
        let steps = (world.config.physiology_interval / world.config.dt).ceil() as usize;
        for _ in 0..steps {
            world.step();
        }
        let cell = &world.cells[0];
        assert!(cell.action.transport[0] > 0.5, "fixture imports at slot 0");
        cell.inputs[ACTIVITY_INPUT]
    });
    // Without a patch the cell only recaptures its own passive leakage.
    assert!(
        readings[0] < 1. && readings[0] > 4. * readings[1],
        "fed {} unfed {}",
        readings[0],
        readings[1]
    );
}

#[test]
fn actuator_readings_are_signed_bounded_and_restart_after_publication() {
    let mut a = crate::activity::Activity::default();
    assert_eq!(a.reading(0), 0.);
    a.add(0, 0., 2.);
    a.add(0, -2., 0.);
    assert_eq!(a.reading(0), -0.5);
    a.add(1, 3., 1.);
    assert_eq!(a.reading(1), 0.75);
    let mut world = crate::diagnostics::nutrition(0.8, 2., true, false);
    let cell = &mut world.cells[0];
    cell.activity = a;
    let g = world.genomes[&cell.genome].compiled.clone().unwrap();
    observe_physiology(cell, &g, &world.config);
    assert_eq!(cell.inputs[ACTIVITY_INPUT], -0.5);
    assert_eq!(cell.activity, Default::default());
}
