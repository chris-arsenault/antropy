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
    let g = world.genomes[&cell.genome].compiled.as_ref().unwrap();
    assert_eq!(cell.inputs[38], cell.damage as f32);
    assert_eq!(
        cell.inputs[37],
        (cell.material() / cell.capacity(&world.config)).clamp(0., 1.) as f32
    );
    assert_eq!(
        cell.inputs[35],
        (cell.body[1] / (cell.body[1] + g.body[1])) as f32
    );
    for slot in 0..crate::organism::MAX_ENZYMES {
        let stock = crate::organism::enzyme_stock(slot);
        let expected = if cell.chemistry().programs[slot] {
            (cell.body[stock] / (cell.body[stock] + g.body[stock]).max(1e-30)) as f32
        } else {
            0.
        };
        assert_eq!(
            cell.inputs[crate::controller::programs::stock_input(slot)],
            expected
        );
    }
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
    let body_input = cell.inputs[35];
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
    assert_eq!(cell.inputs[35], body_input);
}
