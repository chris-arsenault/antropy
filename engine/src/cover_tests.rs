use crate::{config::Config, organism::BUILDER_STOCK, world::World};

fn sites() -> [crate::footprint::Row; 2] {
    std::array::from_fn(|_| crate::footprint::Row::from_slice(&[(0, 1.)]))
}

fn world() -> World {
    let c = Config {
        width: 24.,
        height: 24.,
        founders: 2,
        source_count: 0,
        shade_strength: 0.,
        illumination_contrast: 0.,
        washout: 0.,
        weathering_rate: 0.,
        growth_rate: 1.,
        construction_energy: 0.5,
        ..Config::default()
    };
    let mut w = World::new(27, c).unwrap();
    for cell in &mut w.cells {
        let mut body = cell.body;
        body[BUILDER_STOCK] = 1.;
        cell.set_fixture_body(body);
        cell.energy = 10.;
        cell.inventory.fill(0.);
        cell.action.cover = 1.;
    }
    w
}

#[test]
fn constructed_cover_preserves_identity_and_pays_for_real_attenuation() {
    let mut w = world();
    w.cells[0].inventory.set(128, 0.8);
    w.cells[1].action.cover = 0.;
    let before = w.held();
    crate::cover::exchange(&mut w, &sites(), 0.4);
    let deposited = w.cells[0].flows.cover_deposited;
    assert!((deposited - 0.4).abs() < 1e-12);
    assert!((w.cells[0].chemical_flows.exported.value(128) - deposited).abs() < 1e-12);
    assert!((w.cover.amounts().row(0)[128] as f64 - 0.4).abs() < 1e-7);
    let after = w.held();
    assert!((before.0 - after.0 - w.ledger.numerical_material).abs() < 1e-10);
    assert!(
        (before.1 - after.1 - w.ledger.numerical_energy - w.cells[0].flows.construction).abs()
            < 1e-10
    );
    assert!((w.field.illumination.node(0) - (-1_f64).exp()).abs() < 1e-7);
    assert!((w.cover.illumination.node(0) - (1. - (-1_f64).exp())).abs() < 1e-7);
    assert_eq!(w.field.illumination.node(1), 1.);
    let restored = World::restore(&w.snapshot().unwrap()).unwrap();
    assert!((restored.cover.totals(&w.chemistry).0 - deposited).abs() < 1e-7);
    assert_eq!(
        restored.field.illumination.node(0),
        w.field.illumination.node(0)
    );
}

#[test]
fn simultaneous_recovery_shares_frozen_material_and_respects_headroom() {
    let mut w = world();
    w.cover.add(0, 17, 0.3, &w.chemistry);
    w.cover.add(0, 42, 0.1, &w.chemistry);
    for cell in &mut w.cells {
        cell.action.cover = -1.;
    }
    let before = w.held();
    crate::cover::exchange(&mut w, &sites(), 1.);
    assert!(w.cover.totals(&w.chemistry).0.abs() < 1e-10);
    for cell in &w.cells {
        assert!((cell.inventory.value(17) - 0.15).abs() < 1e-7);
        assert!((cell.inventory.value(42) - 0.05).abs() < 1e-7);
        assert!((cell.chemical_flows.imported.value(17) - 0.15).abs() < 1e-7);
        assert!((cell.chemical_flows.imported.value(42) - 0.05).abs() < 1e-7);
    }
    let after = w.held();
    let cost = w.cells.iter().map(|c| c.flows.construction).sum::<f64>();
    assert!((before.0 - after.0 - w.ledger.numerical_material).abs() < 1e-10);
    assert!((before.1 - after.1 - w.ledger.numerical_energy - cost).abs() < 1e-10);
    w.cells[0].inventory.fill(0.);
    let capacity = w.cells[0].capacity(&w.config);
    w.cells[0].inventory.set(0, capacity);
    w.cover.add(0, 17, 0.4, &w.chemistry);
    crate::cover::exchange(&mut w, &sites(), 1.);
    assert_eq!(w.cells[0].inventory.value(17), 0.);
}

#[test]
fn new_deposits_cannot_be_recovered_in_the_same_stage() {
    let mut w = world();
    w.cells[0].inventory.set(128, 0.8);
    w.cells[1].action.cover = -1.;
    crate::cover::exchange(&mut w, &sites(), 0.4);
    assert_eq!(w.cells[1].material(), 0.);
    assert!(w.cover.totals(&w.chemistry).0 > 0.39);
    w.cells[0].action.cover = 0.;
    crate::cover::exchange(&mut w, &sites(), 0.4);
    assert!(w.cells[1].inventory.value(128) > 0.39);
}

#[test]
fn film_washout_and_transport_close_the_global_accounts() {
    let mut w = world();
    w.config.washout = 0.1;
    w.field_elapsed = 0.8;
    w.cover.add(0, 128, 0.4, &w.chemistry);
    let before = w.held();
    crate::cover::advance(&mut w);
    let after = w.held();
    assert!(w.ledger.washed_out > 0.);
    assert!(w.cover.amounts().rows().count() > 1);
    assert!((before.0 - after.0 - w.ledger.washed_out - w.ledger.numerical_material).abs() < 1e-8);
    assert!(
        (before.1 - after.1 - w.ledger.washout_energy - w.ledger.numerical_energy).abs() < 1e-8
    );
}
