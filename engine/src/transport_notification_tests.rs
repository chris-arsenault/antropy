use super::{
    flux_tests::{fixture, step},
    *,
};

#[test]
fn field_birth_imports_only_recognized_species_even_inside_same_group() {
    let mut w = fixture(false);
    let mut support = [false; 256];
    for row in &w.cells[0].operators.as_ref().unwrap().transporters {
        for a in row.iter().filter(|a| a.value > 0.) {
            support[a.species] = true;
        }
    }
    let unrelated = (0..256)
        .find(|&s| !support[s] && support[s / 4 * 4..s / 4 * 4 + 4].iter().any(|b| *b))
        .unwrap();
    let recognized = (unrelated / 4 * 4..unrelated / 4 * 4 + 4)
        .find(|&s| support[s])
        .unwrap();
    let node = crate::footprint::sites(&w.cells[0], &w.config, &w.field)[0].0;
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut w);
    w.field.add(node, unrelated, 0.001, &w.chemistry);
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].flows.imported, 0.);
    w.field.add(node, recognized, 0.001, &w.chemistry);
    step(&mut exchange, &mut w);
    assert!(w.cells[0].flows.imported > 0.);
    assert_eq!(w.cells[0].inventory.value(unrelated), 0.);
    assert!(w.cells[0].inventory.value(recognized) > 0.);
}

#[test]
fn each_exchange_reads_small_existing_species_changes() {
    let mut w = fixture(false);
    let s = w.cells[0].operators.as_ref().unwrap().transporters[0][0].species;
    let node = crate::footprint::sites(&w.cells[0], &w.config, &w.field)[0].0;
    w.field.add(node, s, 0.01, &w.chemistry);
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut w);
    for _ in 0..3 {
        let mut unchanged = w.clone();
        w.field.add(node, s, 0.00001, &w.chemistry);
        step(&mut exchange, &mut w);
        step(&mut Exchange::default(), &mut unchanged);
        assert!(w.cells[0].flows.imported > unchanged.cells[0].flows.imported);
    }
}

#[test]
fn newly_enabled_inward_effort_reads_current_field() {
    let mut held = fixture(false);
    let mut fresh = fixture(false);
    let s = held.cells[0].operators.as_ref().unwrap().transporters[0][0].species;
    let node = crate::footprint::sites(&held.cells[0], &held.config, &held.field)[0].0;
    held.cells[0].action.transport.fill(0.5);
    held.field.add(node, s, 0.01, &held.chemistry);
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut held);
    let delta =
        0.01 * crate::execution::RESOLUTION * held.config.receptor_k * held.field.spacing.powi(2);
    held.field.add(node, s, delta, &held.chemistry);
    fresh.field.add(node, s, 0.01, &fresh.chemistry);
    fresh.field.add(node, s, delta, &fresh.chemistry);
    held.cells[0].action.transport.fill(1.);
    step(&mut exchange, &mut held);
    step(&mut Exchange::default(), &mut fresh);
    assert!(held.cells[0].flows.imported > 0.);
    assert!((held.cells[0].flows.imported - fresh.cells[0].flows.imported).abs() < 1e-12);
}
