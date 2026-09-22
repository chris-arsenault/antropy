use crate::{
    chemical_operators::Operators, controller, diagnostics, metabolism, organization, sensing,
};

#[test]
fn response_is_bounded_complementary_and_does_not_change_yield() {
    for x in -20..=20 {
        for y in -20..=20 {
            let coefficient = [x as f64 / 40., y as f64 / 40.];
            let mixture = [0.7, -0.8];
            let a = metabolism::response(coefficient, mixture);
            let b = metabolism::response(coefficient.map(|v| -v), mixture);
            assert!((0.2..=1.8).contains(&a));
            assert!((a + b - 2.).abs() < 1e-14);
        }
    }
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let original = &w.cells[0];
    let edge = original.operators.as_ref().unwrap().enzymes[0]
        .conversions
        .get(0);
    let score = |s: usize| {
        edge.work_coefficient
            .iter()
            .zip(w.chemistry.properties[s].interaction)
            .map(|(a, b)| a * b)
            .sum::<f64>()
    };
    let low = (0..256)
        .min_by(|a, b| score(*a).total_cmp(&score(*b)))
        .unwrap();
    let high = (0..256)
        .max_by(|a, b| score(*a).total_cmp(&score(*b)))
        .unwrap();
    let mut results = Vec::new();
    for bound in [low, high] {
        let mut cell = original.clone();
        cell.bound_material.fill(0.);
        cell.bound_material.set(bound, cell.mass());
        cell.inventory.fill(0.);
        cell.inventory.set(edge.substrate, 0.1);
        cell.action.activity.fill(0.);
        cell.action.activity[0] = 1.;
        cell.energy = 100.;
        let before = cell.energy;
        let held = cell.material();
        metabolism::react_observed(&mut cell, &w.config, &w.chemistry, 0.01, false, [1., 1.]);
        assert!((cell.material() - held).abs() < 1e-12);
        results.push((
            cell.flows.reacted,
            (cell.energy - before) / cell.flows.reacted,
        ));
    }
    assert!(results[1].0 > results[0].0);
    assert!((results[1].1 - results[0].1).abs() < 1e-8);
}

#[test]
fn inward_sensing_requires_stock_and_allocation_and_tracks_free_material() {
    let mut w = diagnostics::nutrition(0.8, 2., false, false);
    let g = w.genomes[&1].compiled.as_ref().unwrap();
    let cell = &mut w.cells[0];
    cell.inventory.fill(0.);
    cell.inventory.set(w.config.source_species[0], 0.1);
    sensing::observe(cell, g, &w.config, &w.field);
    assert_eq!(cell.inputs[44], 0.);
    let mut machinery = cell.chemistry().clone();
    machinery.inward[0] = 1.;
    cell.operators = Some(Operators::compile(&machinery, &w.config, &w.chemistry));
    sensing::observe(cell, g, &w.config, &w.field);
    assert!(cell.inputs[44] > 0. && cell.inputs[45] > 0.);
    assert_eq!(cell.inputs[0], 0.);
    let controller = controller::diagnostic([0.; 9], Some((44, 0, 2.)));
    let action = controller::act(
        &controller,
        &cell.inputs,
        &mut controller::State::default(),
        &w.config,
        false,
    );
    assert!(action.swim > 0.);
    cell.body[3] = 0.;
    sensing::observe(cell, g, &w.config, &w.field);
    assert_eq!(cell.inputs[44], 0.);
}

#[test]
fn retirement_preserves_identity_pays_work_and_reserves_lost_storage() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let mut cell = w.cells[0].clone();
    let g = w.genomes[&1].compiled.as_ref().unwrap();
    cell.action.allocation.fill(0.);
    cell.action.retirement = 1.;
    cell.energy = 10.;
    cell.inventory.fill(0.);
    let before: Vec<_> = (0..256)
        .map(|s| cell.inventory.value(s) + cell.bound_material.value(s))
        .collect();
    let mass = cell.mass();
    organization::remodel(&mut cell, g, &w.config, 100.);
    assert!(cell.flows.retired > 0.);
    assert!((mass - cell.mass() - cell.flows.retired).abs() < 1e-12);
    assert!(cell.material() <= cell.capacity(&w.config) + 1e-12);
    assert!((10. - cell.energy - cell.flows.retired * w.config.construction_energy).abs() < 1e-12);
    for (s, q) in before.iter().enumerate() {
        assert!((cell.inventory.value(s) + cell.bound_material.value(s) - q).abs() < 1e-12);
    }
    cell.validate(&w.config).unwrap();
}

#[test]
fn optional_targets_do_not_prevent_core_funded_division_or_grant_daughter_machinery() {
    let mut w = diagnostics::nutrition(0.8, 2., true, false);
    let mut body = w.cells[0].body;
    body[0] *= 2.;
    body[11] = 0.;
    w.cells[0].set_fixture_body(body);
    w.cells[0].energy = 10.;
    w.cells[0].inventory.fill(0.);
    let capacity = w.cells[0].capacity(&w.config);
    w.cells[0].inventory.set(0, capacity);
    crate::lifecycle::reproduce(&mut w);
    assert_eq!(w.cells.len(), 2);
    assert!(w.cells.iter().all(|cell| cell.body[11] == 0.));
}

#[test]
fn inactive_and_retired_programs_cannot_convert_and_extra_programs_can() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let mut g = w.genomes[&1].clone();
    let mut cell = w.cells[0].clone();
    crate::genetics::repertoire::duplicate(&mut g, &mut cell, 0, 4);
    cell.action.activity.fill(0.);
    cell.action.activity[4] = 1.;
    g.compile(&w.config, &w.chemistry);
    cell.operators = Some(g.compiled.as_ref().unwrap().operators.clone());
    metabolism::react(&mut cell, &w.config, &w.chemistry, 0.1);
    assert!(cell.flows.reacted > 0.);
    cell.flows = Default::default();
    crate::genetics::repertoire::remove(&mut g, 4);
    g.compile(&w.config, &w.chemistry);
    cell.operators = Some(g.compiled.as_ref().unwrap().operators.clone());
    metabolism::react(&mut cell, &w.config, &w.chemistry, 0.1);
    assert_eq!(cell.flows.reacted, 0.);
}
