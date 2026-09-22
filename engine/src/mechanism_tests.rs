use crate::{
    chemistry::{Chemistry, affinity},
    config::{Config, Disturbance},
    genetics::{Genotype, Target},
    organism::Cell,
    sensing, transport,
    world::World,
};

fn fixture(c: Config) -> World {
    World::new(
        101,
        Config {
            width: 24.,
            height: 24.,
            source_count: 0,
            founders: 2,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..c
        },
    )
    .unwrap()
}

#[test]
fn sparse_compatibility_correction_equals_full_chemical_exposure() {
    let mut w = fixture(Config::default());
    for s in 0..256 {
        w.field.deposit(6., 6., s, 0.01, &w.chemistry);
        w.cells[0].inventory.set(s, (s + 1) as f64 * 1e-5);
    }
    w.cells[0].x = 6.;
    w.cells[0].y = 6.;
    let cell = &w.cells[0];
    let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
    let sites = crate::footprint::sites(cell, &w.config, &w.field);
    let expected = (0..256)
        .map(|s| {
            let chi = 1.
                - (1. - w.config.susceptibility_floor)
                    * affinity(
                        g.chromosome.chemistry.membrane.point(),
                        s,
                        w.config.affinity_radius,
                    );
            (w.field.sample(s, &sites)
                + w.config.internal_exposure * cell.inventory.value(s) / cell.volume(&w.config))
                * w.chemistry.properties[s].stress
                * chi
        })
        .sum::<f64>();
    assert!(
        (sensing::stress_load(cell, g, &w.config, &w.field, &w.chemistry) - expected).abs() < 1e-12
    );
}

#[test]
fn shared_uptake_is_funded_conservative_and_order_independent() {
    let mut a = fixture(Config {
        transport_energy: 0.05,
        ..Config::default()
    });
    let s = a.config.source_species[0];
    a.field.deposit(6., 6., s, 0.001, &a.chemistry);
    let installed = a.cells[0].chemistry().clone();
    for cell in &mut a.cells {
        cell.operators = Some(crate::chemical_operators::Operators::compile(
            &installed,
            &a.config,
            &a.chemistry,
        ));
        cell.x = 6.;
        cell.y = 6.;
        cell.inventory.fill(0.);
        cell.action.transport = [1.; 4];
        cell.body[7..11].fill(10.);
        cell.set_fixture_body(cell.body);
        cell.energy = 1.;
    }
    let mut b = a.clone();
    b.cells.reverse();
    let before = a.held();
    for w in [&mut a, &mut b] {
        let sites = w
            .cells
            .iter()
            .map(|c| crate::footprint::sites(c, &w.config, &w.field))
            .collect::<Vec<_>>();
        transport::Exchange::default().advance(
            &mut w.cells,
            &w.config,
            &mut w.field,
            &w.chemistry,
            &sites,
            (&mut w.ledger, None),
        );
    }
    for cell in &a.cells {
        let other = b.cells.iter().find(|c| c.id == cell.id).unwrap();
        assert!((cell.flows.imported - other.flows.imported).abs() < 1e-15);
        assert!(cell.flows.imported > 0.);
        assert!(
            (cell.flows.transport - cell.flows.imported * a.config.transport_energy).abs() < 1e-15
        );
    }
    let after = a.held();
    let heat = a.cells.iter().map(|c| c.flows.transport).sum::<f64>();
    assert!((before.0 - after.0 - a.ledger.numerical_material).abs() < 1e-8);
    assert!((before.1 - after.1 - a.ledger.numerical_energy - heat).abs() < 1e-8);
}

#[test]
fn disturbance_conserves_chemistry_and_death_releases_resources() {
    let mut w = fixture(Config {
        disturbance: Some(Disturbance {
            mean_interval: 1e-10,
            radius: 100.,
            mortality: 1.,
            mixing: 1.,
        }),
        ..Config::default()
    });
    w.field.deposit(6., 6., 17, 10., &w.chemistry);
    let before = w.held();
    let numerical = w.ledger.numerical_material;
    let numerical_energy = w.ledger.numerical_energy;
    crate::lifecycle::disturb(&mut w);
    let after = w.held();
    assert_eq!(w.cells.len(), 0);
    assert_eq!(w.ledger.disturbance_deaths, 2);
    assert!((before.0 - after.0 - (w.ledger.numerical_material - numerical)).abs() < 1e-8);
    assert!(
        (before.1 - after.1 - w.ledger.death_heat - (w.ledger.numerical_energy - numerical_energy))
            .abs()
            < 1e-8
    );
}

#[test]
fn optional_selfing_and_budding_keep_funding_and_parentage() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut c = Config {
        width: 24.,
        height: 24.,
        source_count: 0,
        founders: 2,
        ploidy: "diploid".into(),
        transmission: "selfing".into(),
        reproduction: "budding".into(),
        learning: "static".into(),
        mutation_rate: 0.,
        physical_mutation_rate: 0.,
        ..Config::default()
    };
    c.source_species = chemistry.source_species();
    let mut w = World::new(101, c).unwrap();
    let original: Vec<_> = w.cells.iter().map(|c| c.id).collect();
    for cell in &mut w.cells {
        cell.set_fixture_body(cell.body.map(|q| q * 2.));
        cell.energy = 1.;
        cell.inventory.set(w.config.source_species[0], 1.);
    }
    let before = w.held();
    crate::lifecycle::reproduce(&mut w);
    let after = w.held();
    assert!(w.ledger.divisions > 0);
    assert!(
        original
            .iter()
            .all(|id| w.cells.iter().any(|c| c.id == *id))
    );
    w.validate().unwrap();
    assert!((before.0 - after.0 - w.ledger.numerical_material).abs() < 1e-8);
    assert!((before.1 - after.1 - w.ledger.numerical_energy - w.ledger.division_heat).abs() < 1e-8);
}

#[test]
fn newborn_receptors_do_not_get_a_false_temporal_spike() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut c = Config::default();
    c.source_species = chemistry.source_species();
    let g = Genotype::seed(&c, &chemistry);
    let compiled = g.compiled.as_ref().unwrap();
    let mut field = crate::field::Field::new(24., 24., 2.);
    field.deposit(6., 6., c.source_species[0], 10., &chemistry);
    let mut cell = Cell::new(1, 1, compiled, &c, &chemistry, [6., 6.], 0.);
    sensing::initialize(&mut cell, compiled, &c, &field);
    sensing::observe(&mut cell, compiled, &c, &field);
    for i in [1, 5, 9, 13] {
        assert_eq!(cell.inputs[i], 0.);
    }
}

#[test]
fn membrane_mutation_is_local_and_not_universal_immunity() {
    let w = fixture(Config::default());
    let mut cell = w.cells[0].clone();
    let mut g = w.genomes[&cell.genome].clone();
    let s = w
        .chemistry
        .properties
        .iter()
        .position(|p| p.stress >= 0.8)
        .unwrap();
    cell.inventory.fill(0.);
    cell.inventory.set(s, 1.);
    let p = Target::species(s);
    for a in &mut g.chromosomes {
        a.chemistry.membrane = p;
    }
    g.compile(&w.config, &w.chemistry);
    cell.operators = Some(g.compiled.as_ref().unwrap().operators.clone());
    let tolerant = sensing::stress_load(
        &cell,
        g.compiled.as_ref().unwrap(),
        &w.config,
        &w.field,
        &w.chemistry,
    );
    for a in &mut g.chromosomes {
        a.chemistry.membrane = Target {
            x: if p.x < 8. { 15. } else { 0. },
            y: if p.y < 8. { 15. } else { 0. },
        };
    }
    g.compile(&w.config, &w.chemistry);
    cell.operators = Some(g.compiled.as_ref().unwrap().operators.clone());
    let sensitive = sensing::stress_load(
        &cell,
        g.compiled.as_ref().unwrap(),
        &w.config,
        &w.field,
        &w.chemistry,
    );
    assert!(tolerant > 0. && sensitive > tolerant * 10.);
}

#[test]
fn checkpoint_preserves_state_and_continues_at_every_integration_phase() {
    let mut w = World::new(
        101,
        Config {
            width: 24.,
            height: 24.,
            founders: 2,
            source_count: 2,
            ..Config::default()
        },
    )
    .unwrap();
    for _ in 0..8 {
        w.step();
        let mut a = w.clone();
        let mut b = crate::boundary_tests::restored_state(&w);
        for _ in 0..5 {
            a.step();
            b.step();
        }
        crate::boundary_tests::usable_continuation(&a, w.tick + 5);
        crate::boundary_tests::usable_continuation(&b, w.tick + 5);
    }
}

#[test]
fn rejected_intervention_has_no_partial_effect() {
    let mut w = fixture(Config::default());
    let before = w.snapshot().unwrap();
    let request = serde_json::json!({"op":"intervene","cell":1,"energy":100.,"deposit":{"species":256,"x":1.,"y":1.,"amount":1.}});
    assert!(crate::commands::execute(&mut w, &request).is_err());
    assert_eq!(w.snapshot().unwrap(), before);
}

#[test]
fn incremental_field_reductions_survive_restore_and_reject_corruption() {
    let mut w = fixture(Config::default());
    for s in 0..256 {
        for k in 1..9 {
            w.field.deposit(6., 6., s, 0.01 / k as f64, &w.chemistry);
        }
    }
    let restored = World::restore(&w.snapshot().unwrap()).unwrap();
    let nodes = w.field.nx * w.field.ny;
    let close = |a: f64, b: f64| (a - b).abs() <= 1e-12 * (1. + b.abs());
    for n in 0..nodes {
        assert!(close(
            w.field.impedance_at(n),
            restored.field.impedance_at(n)
        ));
        assert!(close(w.field.stress_at(n), restored.field.stress_at(n)));
    }
    let (a, b) = (
        w.field.totals(&w.chemistry),
        restored.field.totals(&restored.chemistry),
    );
    assert!(close(a.0, b.0) && close(a.1, b.1));
    // Features are derived from material on restore; the snapshot round-trips unchanged.
    assert_eq!(restored.snapshot().unwrap(), w.snapshot().unwrap());
}

#[test]
fn explicit_death_is_accounted_as_release_and_heat_not_a_resource_grant() {
    let mut w = fixture(Config::default());
    crate::diagnostics::initialize(&mut w);
    crate::commands::execute(
        &mut w,
        &serde_json::json!({"op":"intervene","cell":1,"kill":true}),
    )
    .unwrap();
    assert!(w.ledger.supplied.abs() < 1e-9);
    assert!(w.ledger.supplied_energy.abs() < 1e-9);
    let (m, e) = w.held();
    assert!((w.ledger.initial_material - m - w.ledger.numerical_material).abs() < 1e-9);
    assert!(
        (w.ledger.initial_energy - e - w.ledger.heat() - w.ledger.numerical_energy).abs() < 1e-9
    );
}
