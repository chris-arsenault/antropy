use super::*;

fn totals(cell: &Cell, chemistry: &Chemistry) -> (f64, f64) {
    let potential: f64 = cell
        .inventory
        .iter()
        .zip(&chemistry.properties)
        .map(|(q, p)| q * p.potential)
        .sum();
    (cell.material(), cell.energy + potential)
}

fn funded(world: &crate::world::World) -> Cell {
    let mut cell = world.cells[0].clone();
    cell.inventory.fill(0.1);
    cell.energy = 10.;
    cell.action.activity.fill(1.);
    cell
}

#[test]
fn joint_donors_and_work_remain_funded_across_interval_sizes() {
    let world = crate::initial_ecology::probe(1, true).unwrap();
    let mut executor = Executor::default();
    for dt in [0.001, 0.8, 8.] {
        for energy in [0., 0.001, 10.] {
            let mut cell = funded(&world);
            cell.energy = energy;
            let before = totals(&cell, &world.chemistry);
            let mut attempts = [0.; 256];
            let mut consumed = [0.; 256];
            let mut produced = [0.; 256];
            let work = executor.react(
                &mut cell,
                &world.config,
                &world.chemistry,
                dt,
                true,
                [1.; 2],
            );
            for (enzyme, row, amount) in work.accepted_routes() {
                attempts[enzyme.conversions.get(row as usize).substrate] += amount;
            }
            for (s, p, amount) in work.reactions() {
                consumed[s] += amount;
                produced[p] += amount;
            }
            for s in 0..256 {
                assert!(attempts[s] <= 0.1 + 1e-12, "unfunded donor {s}");
                assert!(
                    (cell.inventory.value(s) - (0.1 - consumed[s] + produced[s])).abs() < 1e-12
                );
            }
            cell.inventory.validate().unwrap();
            assert!(cell.energy >= 0.);
            let after = totals(&cell, &world.chemistry);
            assert!((after.0 - before.0).abs() < 1e-11);
            assert!(
                (after.1 + cell.flows.reaction_heat - cell.flows.external_work - before.1).abs()
                    < 1e-10
            );
        }
    }
}

#[test]
fn absent_work_or_substrate_reactivates_on_the_next_application() {
    let world = crate::initial_ecology::probe(1, true).unwrap();
    let mut cell = funded(&world);
    cell.energy = 0.;
    cell.inventory.fill(0.);
    cell.inventory.set(128, 0.1);
    let lit = crate::weathering::signal(std::array::from_fn(|k| {
        (world.chemistry.properties[0].interaction[k]
            + world.chemistry.properties[136].interaction[k])
            / 2.
    }));
    let mut executor = Executor::default();
    executor.react(
        &mut cell,
        &world.config,
        &world.chemistry,
        0.001,
        false,
        [0.; 2],
    );
    assert_eq!(cell.flows.reacted, 0.);
    for (signal, energy) in [(lit, 0.), ([0.; 2], 1.)] {
        let mut available = cell.clone();
        available.energy = energy;
        executor.react(
            &mut available,
            &world.config,
            &world.chemistry,
            0.001,
            false,
            signal,
        );
        assert!(available.flows.reacted > 0.);
    }
    cell.inventory.fill(0.);
    cell.energy = 1.;
    executor.react(
        &mut cell,
        &world.config,
        &world.chemistry,
        0.001,
        false,
        [0.; 2],
    );
    assert_eq!(cell.flows.reacted, 0.);
    cell.inventory.set(128, 0.1);
    executor.react(
        &mut cell,
        &world.config,
        &world.chemistry,
        0.001,
        false,
        [0.; 2],
    );
    assert!(cell.flows.reacted > 0.);
}

#[test]
fn scratch_reuse_does_not_transfer_requests_between_cells_or_disable_live_actions() {
    let world = crate::diagnostics::nutrition(0.8, 2., false, false);
    let template = funded(&world);
    let mut executor = Executor::default();
    let mut active = template.clone();
    assert!(
        executor
            .react(
                &mut active,
                &world.config,
                &world.chemistry,
                0.8,
                true,
                [1.; 2]
            )
            .reactions()
            .count()
            > 0
    );
    let storage = executor.requests.as_ptr();
    let mut inactive = template.clone();
    inactive.action.activity.fill(0.);
    let before = totals(&inactive, &world.chemistry);
    assert_eq!(
        executor
            .react(
                &mut inactive,
                &world.config,
                &world.chemistry,
                0.8,
                true,
                [1.; 2]
            )
            .reactions()
            .count(),
        0
    );
    assert_eq!(totals(&inactive, &world.chemistry), before);
    inactive.action.activity.fill(1.);
    executor.react(
        &mut inactive,
        &world.config,
        &world.chemistry,
        0.8,
        false,
        [1.; 2],
    );
    assert!(inactive.flows.reacted > 0.);
    assert_eq!(executor.requests.as_ptr(), storage);
    assert!(executor.work.routes.is_empty());
    assert_eq!(executor.counts()["applications"], 3);
}

#[test]
fn observer_uses_the_accepted_product_pass_and_preserves_sampled_membership() {
    let world = crate::initial_ecology::probe(0, true).unwrap();
    let mut cell = funded(&world);
    let mut plain = cell.clone();
    let mut observer = Observer::new(0);
    observer.enabled = true;
    observer.pin = Some(crate::phenotype::Pin {
        id: "probe".into(),
        label: "Probe".into(),
        started: 0,
        roots: [cell.id].into(),
        live: [cell.id].into(),
    });
    observer.begin(std::slice::from_ref(&cell));
    observer.pin = None;
    observer.selection = crate::phenotype::Selection::Region { id: 0 };
    let mut executor = Executor::default();
    let mut oracle = Executor::default();
    let work = executor.react_observed(
        &mut cell,
        &world.config,
        &world.chemistry,
        0.8,
        (false, Some(&mut observer)),
        [1.; 2],
    );
    assert_eq!(work.reactions().count(), 0);
    let mut expected = vec![0.; 65536];
    for (s, p, q) in oracle
        .react(
            &mut plain,
            &world.config,
            &world.chemistry,
            0.8,
            true,
            [1.; 2],
        )
        .reactions()
    {
        expected[s * 256 + p] += q;
    }
    assert!(expected.iter().sum::<f64>() > 0.);
    for group in &observer.current.groups {
        assert_eq!(group.routes, expected);
    }
    assert_eq!(
        postcard::to_stdvec(&cell).unwrap(),
        postcard::to_stdvec(&plain).unwrap()
    );
    observer.begin(std::slice::from_ref(&cell));
    executor.react_observed(
        &mut cell,
        &world.config,
        &world.chemistry,
        0.8,
        (false, Some(&mut observer)),
        [1.; 2],
    );
    assert_eq!(observer.current.groups[1].routes, expected);
    assert_eq!(observer.current.groups[2].routes, expected);
    assert!(observer.current.groups[0].routes.iter().sum::<f64>() > expected.iter().sum::<f64>());
}

#[test]
fn clearing_gross_histories_records_only_the_new_accepted_application() {
    let world = crate::diagnostics::nutrition(0.8, 2., false, false);
    let mut cell = funded(&world);
    let mut executor = Executor::default();
    executor.react(
        &mut cell,
        &world.config,
        &world.chemistry,
        0.001,
        false,
        [1.; 2],
    );
    cell.chemical_flows = Default::default();
    let reacted = cell.flows.reacted;
    let mut consumed = [0.; 256];
    let mut produced = [0.; 256];
    for (s, p, q) in executor
        .react(
            &mut cell,
            &world.config,
            &world.chemistry,
            0.001,
            true,
            [1.; 2],
        )
        .reactions()
    {
        consumed[s] += q;
        produced[p] += q;
    }
    for s in 0..256 {
        assert!((cell.chemical_flows.consumed.value(s) - consumed[s]).abs() < 1e-12);
        assert!((cell.chemical_flows.produced.value(s) - produced[s]).abs() < 1e-12);
    }
    assert!((cell.flows.reacted - reacted - consumed.iter().sum::<f64>()).abs() < 1e-12);
}

#[test]
fn detached_chemical_definition_uses_current_potential_in_the_work_account() {
    let world = crate::initial_ecology::probe(0, true).unwrap();
    let mut chemistry = world.chemistry.clone();
    chemistry.properties[0].potential += 0.4;
    let mut cell = funded(&world);
    let before = totals(&cell, &chemistry);
    Executor::default().react(&mut cell, &world.config, &chemistry, 0.8, false, [1.; 2]);
    let after = totals(&cell, &chemistry);
    assert!((after.0 - before.0).abs() < 1e-11);
    assert!(
        (after.1 + cell.flows.reaction_heat - cell.flows.external_work - before.1).abs() < 1e-10
    );
}

#[test]
fn detached_interaction_definition_updates_external_work_coefficients() {
    let world = crate::initial_ecology::probe(0, true).unwrap();
    let mut chemistry = world.chemistry.clone();
    for (s, property) in chemistry.properties.iter_mut().enumerate() {
        property.interaction = [s as f64 / 255., -(s as f64) / 255.];
    }
    let mut cell = funded(&world);
    let before = totals(&cell, &chemistry);
    let mut executor = Executor::default();
    let work = executor.react(&mut cell, &world.config, &chemistry, 0.8, true, [1.; 2]);
    let mut expected = 0.;
    let mut stale = 0.;
    for (enzyme, row, amount) in work.accepted_routes() {
        let edge = enzyme.conversions.get(row as usize);
        let current =
            crate::transformation_work::coefficient(&chemistry, edge.substrate, &edge.products);
        expected += amount
            * world.config.environmental_work
            * crate::transformation_work::engagement(current, [1.; 2]);
        stale += amount
            * world.config.environmental_work
            * crate::transformation_work::engagement(edge.work_coefficient, [1.; 2]);
    }
    assert!((expected - stale).abs() > 1e-10);
    assert!((cell.flows.external_work - expected).abs() < 1e-12);
    let after = totals(&cell, &chemistry);
    assert!(
        (after.1 + cell.flows.reaction_heat - cell.flows.external_work - before.1).abs() < 1e-10
    );
}

#[test]
fn mixed_self_products_from_multiple_enzymes_match_committed_material_and_work() {
    let world = crate::initial_ecology::probe(0, true).unwrap();
    let mut cell = funded(&world);
    cell.installed.programs.fill(false);
    for slot in 0..3 {
        cell.installed.programs[slot] = true;
        cell.installed.enzymes[slot] = crate::genetics::Enzyme {
            x: 7.,
            y: 7.,
            center_x: 7. + slot as f64 * 0.1,
            center_y: 7.,
            angle: 0.13 * (slot + 1) as f64,
        };
        cell.body[crate::organism::enzyme_stock(slot)] = 0.2;
    }
    cell.operators = Some(crate::chemical_operators::Operators::compile(
        &cell.installed,
        &world.config,
        &world.chemistry,
    ));
    assert!(
        cell.operators
            .as_ref()
            .unwrap()
            .enzymes
            .iter()
            .flat_map(|e| &e.conversions)
            .any(|r| r.products.iter().any(|p| p.species == r.substrate)
                && r.products.iter().any(|p| p.species != r.substrate))
    );
    let before = totals(&cell, &world.chemistry);
    let mut executor = Executor::default();
    let work = executor.react(
        &mut cell,
        &world.config,
        &world.chemistry,
        0.8,
        true,
        [1.; 2],
    );
    assert_eq!(
        work.routes
            .iter()
            .map(|r| r.0)
            .collect::<std::collections::BTreeSet<_>>()
            .len(),
        3
    );
    let mut produced = [0.; 256];
    let mut consumed = [0.; 256];
    for (s, p, q) in work.reactions() {
        consumed[s] += q;
        produced[p] += q;
    }
    for s in 0..256 {
        assert!((cell.inventory.value(s) - (0.1 - consumed[s] + produced[s])).abs() < 1e-12);
        assert!((cell.chemical_flows.consumed.value(s) - consumed[s]).abs() < 1e-12);
        assert!((cell.chemical_flows.produced.value(s) - produced[s]).abs() < 1e-12);
    }
    let after = totals(&cell, &world.chemistry);
    assert!((after.0 - before.0).abs() < 1e-11);
    assert!(
        (after.1 + cell.flows.reaction_heat - cell.flows.external_work - before.1).abs() < 1e-10
    );
}
