use crate::{config::Config, world::World};
fn world() -> World {
    World::new(
        101,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 0,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..Default::default()
        },
    )
    .unwrap()
}
#[test]
fn composed_field_preserves_every_species_and_accounts_its_numeric_error() {
    let mut w = world();
    for (i, q) in w.field.amounts.iter_mut().enumerate() {
        *q = (0.01 + (i % 197) as f32 * 0.0001) * (1. + (i % 11) as f32);
    }
    w.field.refresh(&w.chemistry);
    let totals = |w: &World| {
        std::array::from_fn::<_, 256, _>(|s| {
            w.field
                .amounts
                .chunks_exact(256)
                .map(|n| n[s] as f64)
                .sum::<f64>()
        })
    };
    let before = totals(&w);
    let initial = w.field.totals(&w.chemistry);
    let balance = w
        .field
        .advance(&w.chemistry, 0.8, 0., w.config.diffusion_impedance);
    let after = totals(&w);
    let final_total = w.field.totals(&w.chemistry);
    for (a, b) in before.into_iter().zip(after) {
        assert!((a - b).abs() < 1e-6 * (1. + a));
    }
    assert!(w.field.amounts.iter().all(|q| *q >= 0.));
    assert!((initial.0 - final_total.0 - balance.roundoff_matter).abs() < 1e-10);
    assert!((initial.1 - final_total.1 - balance.roundoff_energy).abs() < 1e-10);
}
#[test]
fn an_isolated_body_has_no_self_propulsion_but_a_foreign_profile_moves_it() {
    let mut w = world();
    w.cells[0].x = 8.37;
    w.cells[0].y = 9.13;
    w.cells[0].action = Default::default();
    let sites = vec![crate::footprint::sites(&w.cells[0], &w.config, &w.field)];
    crate::footprint::deposit_profiles(&w.cells, &w.config, &mut w.field, &sites);
    let (x, y, energy) = (w.cells[0].x, w.cells[0].y, w.cells[0].energy);
    crate::movement::advance(&mut w.cells, &w.config, &w.field, &sites);
    assert!((w.cells[0].x - x).abs() + (w.cells[0].y - y).abs() < 1e-12);
    w.field.deposit(x + 4., y, 0, 100., &w.chemistry);
    crate::movement::advance(&mut w.cells, &w.config, &w.field, &sites);
    assert!((w.cells[0].x - x).abs() + (w.cells[0].y - y).abs() > 1e-8);
    assert_eq!(w.cells[0].energy, energy);
}
#[test]
fn birth_splits_installed_material_without_expressing_the_new_target() {
    let mut w = world();
    let mut g = w.genomes[&1].clone();
    g.id = 2;
    g.parent = Some(1);
    g.chromosomes[0].chemistry.enzymes[0].dx += 0.3;
    g.compile(&w.config, &w.chemistry);
    w.genomes.insert(2, g);
    w.next_genome = 3;
    let cell = &mut w.cells[0];
    cell.genome = 2;
    cell.set_fixture_body(cell.body.map(|q| q * 2.));
    cell.energy = 1.;
    cell.contacts = [1.; 4];
    w.ancestry[0].genome = 2;
    let installed = cell.installed.clone();
    let stock = cell.body;
    let initial = w.held();
    crate::lifecycle::reproduce(&mut w);
    assert_eq!(w.cells.len(), 2);
    for cell in &w.cells {
        assert_eq!(cell.installed, installed);
        assert_eq!(cell.body, stock.map(|q| q * 0.5));
        assert_eq!(cell.genome, 2);
        assert_eq!(cell.contacts, [0.; 4]);
        assert_eq!(cell.action.transport, [0.5; 4]);
    }
    let after = w.held();
    assert!((initial.0 - after.0).abs() < 1e-12);
    assert!((initial.1 - after.1 - w.ledger.division_heat).abs() < 1e-12);
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    w.step();
    restored.step();
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
}

#[test]
fn extinction_stops_without_reseeding_and_survives_restore() {
    let mut w = world();
    w.cells[0].energy = 0.;
    w.cells[0].inventory.fill(0.);
    w.step();
    assert!(w.cells.is_empty());
    assert_eq!(w.stop_reason.as_deref(), Some("extinction"));
    let bytes = w.snapshot().unwrap();
    let mut restored = World::restore(&bytes).unwrap();
    restored.step();
    assert_eq!(restored.snapshot().unwrap(), bytes);
}
#[test]
fn production_work_and_material_close_with_sources_bodies_and_boundary_losses() {
    let mut w = world();
    for s in 0..256 {
        w.field.deposit(12., 12., s, 0.001, &w.chemistry);
    }
    crate::diagnostics::initialize(&mut w);
    for _ in 0..40 {
        w.step();
    }
    let summary = crate::observation::summary(&w);
    assert!(
        summary["materialResidual"].as_f64().unwrap().abs() < 1e-8,
        "{summary}"
    );
    assert!(
        summary["energyResidual"].as_f64().unwrap().abs() < 1e-8,
        "{summary}"
    );
    w.validate().unwrap();
}

#[test]
fn growth_keeps_funded_upkeep_until_the_next_metabolic_update() {
    for interval in [0.2, 0.4, 0.8] {
        let mut w = world();
        w.config.physiology_interval = interval;
        let cell = &mut w.cells[0];
        cell.inventory.fill(0.);
        cell.inventory.set(w.chemistry.decomposition, 1.);
        cell.energy = 0.02;
        let initial = cell.energy;
        crate::metabolism::grow(
            cell,
            w.genomes[&1].compiled.as_ref().unwrap(),
            &w.config,
            &w.chemistry,
            interval,
        );
        assert!(cell.energy < initial);
        let expense = (interval + w.config.dt)
            * crate::organism::maintenance_rate(&cell.body, cell.damage, &w.config);
        assert!(cell.energy >= expense - 1e-12);
        let at_growth = cell.energy;
        for _ in 0..(interval / w.config.dt).round() as usize {
            cell.pay(cell.basal(&w.config));
        }
        assert!(cell.energy > 0.);
        assert!(cell.energy < at_growth);
    }
}

#[test]
fn pruning_keeps_live_installations_catalogs_and_complete_parent_records() {
    let mut w = world();
    for id in 2..80 {
        let mut g = w.genomes[&1].clone();
        g.id = id;
        g.parent = Some(1);
        w.genomes.insert(id, g);
    }
    w.next_genome = 80;
    w.cells[0].genome = 2;
    w.cells[0].machinery_genome = 3;
    w.ancestry[0].genome = 2;
    w.event("catalog", 0, vec![4]);
    // Keep an ended ancestor whose full genotype is no longer needed by any live owner.
    let mut ancestor = w.ancestry[0].clone();
    ancestor.id = 2;
    ancestor.parent = 1;
    ancestor.genome = 5;
    ancestor.ended = 0;
    ancestor.cause = crate::ancestry::Cause::Starvation;
    w.ancestry.push(ancestor);
    w.next_cell = 3;
    w.tick = 127;
    w.cells[0].energy = 1.;
    w.step();
    assert_eq!(
        w.genomes.keys().copied().collect::<Vec<_>>(),
        vec![1, 2, 3, 4]
    );
    assert_eq!(w.ancestry[1].genome, 5);
    assert_eq!(w.ancestry[1].parent, 1);
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    w.step();
    restored.step();
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
}
