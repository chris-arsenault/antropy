use super::*;

pub(super) fn fixture(supply: bool) -> crate::world::World {
    let mut w = crate::diagnostics::nutrition(0.8, 2., supply, false);
    w.config.dt = 0.001;
    let cell = &mut w.cells[0];
    cell.inventory.fill(0.);
    cell.energy = 100.;
    cell.damage = 0.;
    cell.action.transport.fill(1.);
    w
}
pub(super) fn step(exchange: &mut Exchange, w: &mut crate::world::World) {
    let sites: Vec<_> = w
        .cells
        .iter()
        .map(|c| crate::footprint::sites(c, &w.config, &w.field))
        .collect();
    exchange.advance(
        &mut w.cells,
        &w.config,
        &mut w.field,
        &w.chemistry,
        &sites,
        (&mut w.ledger, None),
    );
}

#[test]
fn repeated_exchange_keeps_material_and_payment_accounts() {
    let mut w = fixture(true);
    let mut exchange = Exchange::default();
    let before = w.held();
    step(&mut exchange, &mut w);
    step(&mut exchange, &mut w);
    assert!(w.cells[0].flows.imported > 0.);
    let after = w.held();
    assert!((before.0 - after.0 - w.ledger.numerical_material).abs() < 1e-10);
    assert!(
        (before.1 - after.1 - w.cells[0].flows.transport - w.ledger.numerical_energy).abs() < 1e-10
    );
}

#[test]
fn reduced_inward_effort_reduces_current_uptake() {
    let mut w = fixture(true);
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut w);
    let mut full_effort = w.clone();
    let imported = w.cells[0].flows.imported;
    w.cells[0].action.transport.fill(0.8);
    step(&mut exchange, &mut w);
    step(&mut Exchange::default(), &mut full_effort);
    assert!(w.cells[0].flows.imported > imported);
    assert!(w.cells[0].flows.imported < full_effort.cells[0].flows.imported);
}

#[test]
fn damage_reduces_uptake_and_complete_damage_stops_it() {
    let mut w = fixture(true);
    w.cells[0].damage = 1e-9;
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut w);
    let mut intact = w.clone();
    let imported = w.cells[0].flows.imported;
    w.cells[0].damage = 0.5;
    step(&mut exchange, &mut w);
    step(&mut Exchange::default(), &mut intact);
    assert!(w.cells[0].flows.imported > imported);
    assert!(w.cells[0].flows.imported < intact.cells[0].flows.imported);
    w.cells[0].damage = 1.;
    let imported = w.cells[0].flows.imported;
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].flows.imported, imported);
}

#[test]
fn unrelated_birth_death_and_reordering_preserve_existing_receiver_uptake() {
    let mut w = fixture(true);
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut w);
    let mut isolated = w.clone();
    let mut child = w.cells[0].clone();
    child.id = 2;
    child.x = 2.;
    child.y = 2.;
    child.action.transport.fill(0.5);
    w.cells.push(child);
    w.cells.reverse();
    step(&mut exchange, &mut w);
    step(&mut Exchange::default(), &mut isolated);
    assert!((w.cells[1].flows.imported - isolated.cells[0].flows.imported).abs() < 1e-12);
    w.cells.remove(0);
    step(&mut exchange, &mut w);
    step(&mut Exchange::default(), &mut isolated);
    assert!((w.cells[0].flows.imported - isolated.cells[0].flows.imported).abs() < 1e-12);
}

#[test]
fn removed_contact_donor_cannot_supply_its_replacement() {
    let mut w = fixture(false);
    let mut donor = w.cells[0].clone();
    donor.id = 2;
    donor.x += 0.01;
    donor.damage = 0.1;
    donor.action.transport.fill(0.5);
    let s = donor.operators.as_ref().unwrap().transporters[0][0].species;
    donor.inventory.set(s, 0.01);
    w.cells.push(donor);
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut w);
    assert!(w.cells[0].flows.contact_imported > 0.);
    w.cells.pop();
    let received = w.cells[0].flows.contact_imported;
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].flows.contact_imported, received);
    let mut child = w.cells[0].clone();
    child.id = 3;
    child.x += 0.01;
    child.inventory.fill(0.);
    child.damage = 0.1;
    child.action.transport.fill(0.5);
    w.cells.push(child);
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].flows.contact_imported, received);
    w.cells
        .iter()
        .for_each(|cell| cell.inventory.validate().unwrap());
}

#[test]
fn empty_requests_wake_on_new_field_material_work_and_headroom() {
    let mut w = fixture(false);
    let mut exchange = Exchange::default();
    let s = w.cells[0].operators.as_ref().unwrap().transporters[0][0].species;
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].flows.imported, 0.);
    let site = crate::footprint::sites(&w.cells[0], &w.config, &w.field);
    let node = site.iter().max_by(|a, b| a.1.total_cmp(&b.1)).unwrap().0;
    let tiny = crate::execution::RESOLUTION * w.config.receptor_k * w.field.spacing.powi(2) / 10.;
    w.field.add(node, s, tiny, &w.chemistry);
    w.cells[0].energy = 0.;
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].flows.imported, 0.);
    w.cells[0].energy = 1.;
    step(&mut exchange, &mut w);
    assert!(w.cells[0].flows.imported > 0.);
    let capacity = w.cells[0].capacity(&w.config);
    w.cells[0].inventory.fill(capacity / 256.);
    step(&mut exchange, &mut w);
    let before = w.cells[0].flows.imported;
    w.cells[0].inventory.fill(0.);
    step(&mut exchange, &mut w);
    assert!(w.cells[0].flows.imported > before);
}

#[test]
fn intact_contact_owner_replacement_preserves_material_requests_and_crowding() {
    let mut w = fixture(false);
    let mut donor = w.cells[0].clone();
    donor.id = 2;
    donor.x += 0.01;
    donor.action.transport.fill(0.5);
    donor.inventory.set(17, 0.01);
    w.cells.push(donor);
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut w);
    let access = w.cells[0].interface.field;
    assert!(access < 1.);
    w.cells[1].id = 3;
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].interface.field, access);
    assert_eq!(w.cells[0].flows.contact_imported, 0.);
}

#[test]
fn intact_material_donor_activates_immediately_on_damage_and_healing_removes_it() {
    let mut w = fixture(false);
    let mut donor = w.cells[0].clone();
    donor.id = 2;
    donor.x += 0.01;
    donor.action.transport.fill(0.5);
    let s = donor.operators.as_ref().unwrap().transporters[0][0].species;
    donor.inventory.set(s, 0.01);
    w.cells.push(donor);
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].flows.contact_imported, 0.);
    w.cells[1].damage = 0.1;
    let material = w.cells.iter().map(Cell::material).sum::<f64>();
    let paid = w.cells[0].flows.transport;
    step(&mut exchange, &mut w);
    let imported = w.cells[0].flows.contact_imported;
    assert!(imported > 0.);
    assert!(
        (w.cells[0].flows.transport - paid - imported * w.config.transport_energy).abs() < 1e-12
    );
    assert!((w.cells.iter().map(Cell::material).sum::<f64>() - material).abs() < 1e-12);
    w.cells[1].damage = 0.;
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].flows.contact_imported, imported);
}

#[test]
fn new_contact_material_wakes_below_bulk_threshold_and_healing_closes_access() {
    let mut w = fixture(false);
    let mut donor = w.cells[0].clone();
    donor.id = 2;
    donor.x += 0.01;
    donor.damage = 0.1;
    donor.action.transport.fill(0.5);
    w.cells.push(donor);
    let s = w.cells[0].operators.as_ref().unwrap().transporters[0][0].species;
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].flows.contact_imported, 0.);
    w.cells[1].inventory.set(s, 0.001);
    let before = w.cells.iter().map(Cell::material).sum::<f64>();
    step(&mut exchange, &mut w);
    assert!(w.cells[0].flows.contact_imported > 0.);
    assert!((w.cells.iter().map(Cell::material).sum::<f64>() - before).abs() < 1e-12);
    w.cells[1].damage = 0.;
    let before = w.cells[0].flows.contact_imported;
    step(&mut exchange, &mut w);
    assert_eq!(w.cells[0].flows.contact_imported, before);
}

#[test]
fn changing_shared_donor_and_competition_cannot_exceed_held_receiver_budgets() {
    let mut w = fixture(false);
    w.config.dt = 0.8;
    w.config.transporter_turnover = 1e6;
    let s = w.cells[0].operators.as_ref().unwrap().transporters[0]
        .iter()
        .max_by(|a, b| a.value.total_cmp(&b.value))
        .unwrap()
        .species;
    let capacity = w.cells[0].capacity(&w.config);
    let room = 0.002;
    w.cells[0].inventory.fill((capacity - room) / 256.);
    w.cells[0].energy = room * w.config.transport_energy;
    let held_inventory = w.cells[0].inventory.clone();
    let held_energy = w.cells[0].energy;
    let mut donor = w.cells[0].clone();
    donor.id = 2;
    donor.x += 0.01;
    donor.damage = 0.1;
    donor.action.transport.fill(0.5);
    donor.inventory.fill(0.);
    donor.inventory.set(s, 0.01);
    donor.energy = 0.;
    let mut competitor = w.cells[0].clone();
    competitor.id = 3;
    competitor.x -= 0.01;
    competitor.inventory.fill(0.);
    competitor.energy = 100.;
    w.cells.extend([donor, competitor]);
    let mut exchange = Exchange::default();
    step(&mut exchange, &mut w);
    assert!(w.cells[0].flows.contact_imported > 0.);
    w.cells[0].inventory = held_inventory;
    w.cells[0].energy = held_energy;
    w.cells[1].inventory.set(s, 0.010001);
    w.cells[2].action.transport.fill(0.5);
    let (imported, paid) = (w.cells[0].flows.imported, w.cells[0].flows.transport);
    let material = w.cells.iter().map(Cell::material).sum::<f64>();
    step(&mut exchange, &mut w);
    let cell = &w.cells[0];
    assert!(cell.material() <= capacity + 1e-12);
    let uptake = cell.flows.imported - imported;
    assert!(uptake > 0.);
    assert!((cell.flows.transport - paid - uptake * w.config.transport_energy).abs() < 1e-12);
    assert!((w.cells.iter().map(Cell::material).sum::<f64>() - material).abs() < 1e-12);
}

#[test]
fn field_and_contact_imports_share_one_headroom_and_payment_budget() {
    let mut w = fixture(false);
    w.config.dt = 0.8;
    w.config.transporter_turnover = 1e6;
    let s = w.cells[0].operators.as_ref().unwrap().transporters[0][0].species;
    let capacity = w.cells[0].capacity(&w.config);
    let room = 0.002;
    w.cells[0].inventory.fill((capacity - room) / 256.);
    w.cells[0].energy = room * w.config.transport_energy;
    let mut donor = w.cells[0].clone();
    donor.id = 2;
    donor.x += 0.01;
    donor.damage = 0.5;
    donor.action.transport.fill(0.5);
    donor.inventory.fill(0.);
    donor.inventory.set(s, 0.1);
    donor.energy = 0.;
    w.cells.push(donor);
    for &(node, _) in &crate::footprint::sites(&w.cells[0], &w.config, &w.field) {
        w.field.add(node, s, 0.1, &w.chemistry);
    }
    let material = w.held().0;
    let energy = w.cells[0].energy;
    step(&mut Exchange::default(), &mut w);
    let cell = &w.cells[0];
    assert!(cell.flows.contact_imported > 0.);
    assert!(cell.flows.imported > cell.flows.contact_imported);
    assert!(cell.material() <= capacity + 1e-12);
    assert!(cell.flows.imported <= room + 1e-12);
    assert!((energy - cell.energy - cell.flows.imported * w.config.transport_energy).abs() < 1e-12);
    assert!((material - w.held().0 - w.ledger.numerical_material).abs() < 1e-10);
}
