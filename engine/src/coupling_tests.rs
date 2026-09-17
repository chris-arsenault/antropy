use crate::{accounting, config::Config, metabolism, movement, organism::Cell, world::World};

fn world() -> World {
    World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 0,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..Config::default()
        },
    )
    .unwrap()
}

fn value(cell: &Cell, w: &World) -> f64 {
    cell.energy
        + cell.mass() * w.chemistry.properties[w.chemistry.decomposition].potential
        + cell
            .inventory
            .iter()
            .zip(&w.chemistry.properties)
            .map(|(q, p)| q * p.potential)
            .sum::<f64>()
}

#[test]
fn repair_tracks_funded_mass_and_closes_uphill_and_downhill_accounts() {
    let w = world();
    for species in [0, 240, w.chemistry.decomposition] {
        let mut expense: Option<f64> = None;
        for scale in [0.25, 1., 4.] {
            let mut cell = w.cells[0].clone();
            cell.body = cell.body.map(|q| q * scale);
            cell.inventory.fill(0.);
            cell.inventory.set(species, 0.4 * scale);
            cell.energy = cell.energy_capacity(&w.config);
            cell.damage = 0.2;
            cell.action.repair = 1.;
            let before = (cell.material(), value(&cell, &w), cell.energy);
            metabolism::repair(&mut cell, &w.config, &w.chemistry, 1.);
            assert!((cell.flows.repaired - w.config.repair_rate).abs() < 1e-12);
            assert!((cell.material() - before.0).abs() < 1e-12);
            assert!((value(&cell, &w) + cell.flows.repair - before.1).abs() < 1e-12);
            let per_mass = (before.2 - cell.energy) / cell.mass();
            if let Some(previous) = expense {
                assert!((per_mass - previous).abs() < 1e-12);
            }
            expense = Some(per_mass);
            cell.energy = 1e-6 * scale;
            cell.flows = Default::default();
            metabolism::repair(&mut cell, &w.config, &w.chemistry, 1.);
            assert!(cell.flows.repaired > 0. && cell.flows.repaired < w.config.repair_rate);
            assert!(cell.energy >= 0.);
        }
    }
}

#[test]
fn smaller_bodies_and_storage_can_divide_with_capacity_scaled_reserves() {
    for (scale, storage) in [(0.1_f64, 1_f32), (1., 0.1), (4., 1.)] {
        let mut w = world();
        let g = w.genomes.get_mut(&1).unwrap();
        g.chromosomes[0].physical[0] = scale.ln() as f32;
        g.chromosomes[0].physical[2] = storage - 1.;
        g.compile(&w.config, &w.chemistry);
        w.cells[0].body = g.compiled.as_ref().unwrap().body.map(|q| 2. * q);
        let (material, energy, cost) = accounting::division_requirements(&w.cells[0], &w.config);
        assert!(material < w.cells[0].capacity(&w.config));
        assert!(energy < w.cells[0].energy_capacity(&w.config));
        if scale < 1. || storage < 1. {
            assert!(w.cells[0].capacity(&w.config) < 0.6);
        }
        w.cells[0].inventory.fill(0.);
        w.cells[0]
            .inventory
            .set(w.chemistry.decomposition, material * 0.99);
        w.cells[0].energy = energy;
        crate::lifecycle::reproduce(&mut w);
        assert_eq!(w.cells.len(), 1);
        w.cells[0]
            .inventory
            .set(w.chemistry.decomposition, material);
        w.cells[0].energy = energy * 0.99;
        crate::lifecycle::reproduce(&mut w);
        assert_eq!(w.cells.len(), 1);
        w.cells[0].energy = energy;
        let before = w.held();
        crate::lifecycle::reproduce(&mut w);
        assert_eq!(w.cells.len(), 2);
        let after = w.held();
        assert!((before.0 - after.0).abs() < 1e-12);
        assert!((before.1 - after.1 - cost).abs() < 1e-12);
        for cell in &w.cells {
            assert!(
                cell.energy + 1e-12 >= accounting::interval_reserve(cell, &cell.body, &w.config)
            );
        }
        w.validate().unwrap();
    }
}

#[test]
fn small_body_growth_protects_a_fraction_of_its_own_storage() {
    let mut w = world();
    let g = w.genomes.get_mut(&1).unwrap();
    g.chromosomes[0].physical[0] = 0.1_f64.ln() as f32;
    g.compile(&w.config, &w.chemistry);
    let g = g.compiled.as_ref().unwrap();
    let cell = &mut w.cells[0];
    cell.body = g.body;
    cell.inventory.fill(0.);
    cell.inventory
        .set(w.chemistry.decomposition, cell.capacity(&w.config) * 0.5);
    cell.energy = cell.energy_capacity(&w.config);
    let before = cell.mass();
    assert!(cell.material() < 0.2);
    let reserve = cell.capacity(&w.config) * w.config.protected_inventory_fraction;
    metabolism::grow(cell, g, &w.config, &w.chemistry, 1.);
    assert!(cell.mass() > before);
    assert!(cell.material() >= reserve);
}

fn move_once(mut cell: Cell, w: &World) -> Cell {
    cell.x = 12.;
    cell.y = 12.;
    cell.heading = 0.;
    cell.flows = Default::default();
    let row = w.field.stencil(cell.x, cell.y).to_vec();
    let mut cells = vec![cell];
    movement::advance(&mut cells, &w.config, &w.field, &[row]);
    cells.remove(0)
}

#[test]
fn motion_prices_actual_velocity_and_scales_funding_consistently() {
    let w = world();
    let mut cell = w.cells[0].clone();
    cell.action.swim = 1.;
    let full = move_once(cell.clone(), &w);
    cell.action.swim = 0.5;
    let half = move_once(cell.clone(), &w);
    assert!((half.flows.distance / full.flows.distance - 0.5).abs() < 1e-12);
    assert!((half.flows.motors / full.flows.motors - 0.25).abs() < 1e-12);
    cell.action.swim = 1.;
    cell.energy = full.flows.motors * 0.25;
    let limited = move_once(cell.clone(), &w);
    assert!((limited.flows.distance / full.flows.distance - 0.5).abs() < 1e-12);
    assert_eq!(limited.energy, 0.);
    cell.energy = 0.5;
    cell.body[0] -= 3. * cell.body[1];
    cell.body[1] *= 4.; // Hold area fixed to isolate installed motor capacity from drag.
    cell.action.swim = 0.5;
    let large = move_once(cell, &w);
    assert!((large.flows.distance - full.flows.distance).abs() < 1e-12);
    assert!((large.flows.motors - full.flows.motors).abs() < 1e-12);
    assert!(
        crate::organism::maintenance_rate(&large.body, 0., &w.config)
            > crate::organism::maintenance_rate(&full.body, 0., &w.config)
    );
}

#[test]
fn unfunded_slot_cannot_delay_paid_refit_or_grant_material() {
    let w = world();
    let mut a = w.cells[0].clone();
    a.body[4] = 0.;
    a.energy = 1.;
    let mut g = w.genomes[&1].clone();
    g.chromosomes[0].chemistry.transporters[0].x += 1.;
    g.compile(&w.config, &w.chemistry);
    let mut b = a.clone();
    crate::refitting::advance(
        &mut a,
        g.compiled.as_ref().unwrap(),
        &w.config,
        &w.chemistry,
        1.,
    );
    g.chromosomes[0].chemistry.receptors[1].x += 10.;
    g.compile(&w.config, &w.chemistry);
    let target = g.compiled.as_ref().unwrap();
    let before = value(&b, &w);
    let stock = b.body;
    crate::refitting::advance(&mut b, target, &w.config, &w.chemistry, 1.);
    assert_eq!(a.installed.transporters[0], b.installed.transporters[0]);
    assert_eq!(a.flows.refitting, b.flows.refitting);
    assert_eq!(b.body, stock);
    assert!((value(&b, &w) + b.flows.refitting - before).abs() < 1e-12);
    let installed = b.installed.clone();
    b.energy = 0.;
    crate::refitting::advance(&mut b, target, &w.config, &w.chemistry, 1.);
    assert_eq!(b.installed, installed);
}

#[test]
fn capacity_fractions_and_retired_absolute_allowances_are_validated() {
    for key in [
        "daughterInventory",
        "daughterEnergy",
        "divisionCost",
        "protectedReserve",
    ] {
        assert!(serde_json::from_value::<Config>(serde_json::json!({key:0.2})).is_err());
    }
    for key in [
        "daughterInventoryFraction",
        "daughterEnergyFraction",
        "protectedInventoryFraction",
    ] {
        let c: Config = serde_json::from_value(serde_json::json!({key:1.1})).unwrap();
        assert!(c.validate().is_err());
    }
}

#[test]
fn growth_reserve_covers_damaged_combined_motion_and_upkeep() {
    let w = world();
    let mut cell = w.cells[0].clone();
    cell.damage = 0.3;
    cell.action.swim = 0.6;
    cell.action.turn = -0.8;
    cell.energy = accounting::interval_reserve(&cell, &cell.body, &w.config);
    let ticks = ((w.config.physiology_interval + w.config.dt) / w.config.dt).round() as usize;
    for _ in 0..ticks {
        cell = move_once(cell, &w);
        let due = cell.basal(&w.config);
        assert!((cell.pay(due) - due).abs() < 1e-12);
    }
    assert!(cell.energy < 1e-12);
}

#[test]
fn construction_budget_cannot_spend_unprocessed_imports() {
    let mut w = world();
    let g = w.genomes.get_mut(&1).unwrap();
    g.chromosomes[0].physical[11..].fill(-1.);
    g.compile(&w.config, &w.chemistry);
    let mut local = [0.; 256];
    local[0] = 0.1;
    let budget = crate::economy::budget(
        &w.config,
        &w.chemistry,
        g.compiled.as_ref().unwrap(),
        1.,
        &local,
        0.4,
        0.5,
    );
    assert!(budget.surplus > 0.);
    assert_eq!(budget.processing_work, 0.);
    assert_eq!(budget.construction_ceiling, 0.);
}
