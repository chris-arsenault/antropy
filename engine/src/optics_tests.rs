use crate::{config::Config, controller, world::World};

fn emitting_world() -> World {
    let c = Config {
        width: 24.,
        height: 24.,
        founders: 2,
        source_count: 2,
        source_rate: 0.,
        source_drift: 0.,
        shade_strength: 0.,
        illumination_contrast: 0.,
        mutation_rate: 0.,
        physical_mutation_rate: 0.,
        learning: "static".into(),
        division_work_per_core: 100.,
        ..Config::default()
    };
    let mut w = World::new(27, c).unwrap();
    std::sync::Arc::make_mut(&mut w.shade).transmission.fill(0.);
    w.field.illumination.shade = w.shade.clone();
    for g in w.genomes.values_mut() {
        for ch in &mut g.chromosomes {
            ch.behavior = controller::diagnostic([0., 0., 0., 0., -1., 0., 0., 0., 0.], None);
            controller::programs::optical(&mut ch.behavior, 0., 3., None);
        }
        g.compile(&w.config, &w.chemistry);
    }
    for cell in &mut w.cells {
        cell.x = 12.;
        cell.y = 12.;
    }
    for source in &mut w.sources {
        source.habitat.x = 12.;
        source.habitat.y = 12.;
        source.amount = 1.;
        source.rebuild(&w.config, &w.field);
    }
    w.field.add(6 * 12 + 6, 0, 2., &w.chemistry);
    w.cover.add(6 * 12 + 6, 0, 0.4, &w.chemistry);
    crate::source_medium::project(&mut w);
    crate::cover::refresh(&mut w);
    crate::diagnostics::initialize(&mut w);
    w
}

#[test]
fn every_chemical_coefficient_obeys_the_shared_material_bound() {
    let w = emitting_world();
    let bound = crate::optics::work_bound(&w);
    for s in 0..256 {
        for t in 0..256 {
            let coefficient = crate::transformation_work::coefficient(
                &w.chemistry,
                s,
                [crate::chemical_products::ProductWeight {
                    species: t,
                    weight: 1.,
                }],
            );
            for signal in [[1., 0.], [-1., 0.], [0., 1.], [0., -1.]] {
                let work = w.config.environmental_work
                    * crate::transformation_work::engagement(coefficient, signal);
                assert!(work <= bound + 1e-12);
            }
        }
    }
}

#[test]
fn shared_world_emission_closes_accounts_and_survives_mid_interval_restore() {
    let mut w = emitting_world();
    for _ in 0..9 {
        w.step();
    }
    assert!(w.ledger.flows.emission > 0.);
    assert!(w.ledger.optical_captured > 0.);
    assert!(
        w.ledger.optical_captured
            <= w.ledger.flows.emission * w.config.conversion_efficiency + 1e-12
    );
    assert!(w.ledger.optical_heat >= 0.);
    assert_eq!(w.ledger.weathering_work, 0.);
    assert_eq!(w.ledger.source_work, 0.);
    assert!(w.ledger.flows.external_work.abs() < 1e-12);
    let summary = crate::observation::summary(&w);
    assert!(
        summary["energyResidual"].as_f64().unwrap().abs() < 1e-7,
        "{summary}"
    );
    assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-7);
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    assert_eq!(*restored.incident.lateral, *w.incident.lateral);
    let spent = restored.ledger.flows.emission;
    restored.step(); // tick 10, before the next optical boundary
    assert_eq!(restored.ledger.flows.emission, spent);
    for _ in 0..7 {
        restored.step();
    }
    let summary = crate::observation::summary(&restored);
    assert!(
        summary["energyResidual"].as_f64().unwrap().abs() < 1e-7,
        "{summary}"
    );
    restored.validate().unwrap();
}

#[test]
fn depleted_emitters_cannot_keep_spending_held_light() {
    let mut w = emitting_world();
    for _ in 0..4 {
        w.step();
    }
    assert!(!w.incident.lateral.is_empty());
    for cell in &mut w.cells {
        cell.energy = 0.;
        cell.inventory.fill(0.);
    }
    let spent = w.ledger.flows.emission;
    // Invoke the optical boundary directly: ordinary lifecycle would stop this all-dead
    // fixture before another interval. A held display sample must supply no chemical work.
    let sites: Vec<_> = w
        .cells
        .iter()
        .map(|c| crate::footprint::sites(c, &w.config, &w.field))
        .collect();
    let dt = w.config.physiology_interval;
    crate::optics::prepare(&mut w, &sites, dt);
    assert_eq!(w.ledger.flows.emission, spent);
    assert!(w.incident.lateral.is_empty());
}

#[test]
fn optical_reservation_caps_work_without_capping_the_observed_signal() {
    let light = crate::optics::Exposure::reserve(0.2, 10., 0.03, 3.);
    assert_eq!(light.light(), 10.2);
    assert!((light.funded - 0.01).abs() < 1e-12);
    assert!((light.drive() - 0.21).abs() < 1e-12);
    let empty = crate::optics::Exposure::reserve(0., 10., 0., 3.);
    assert_eq!(empty.drive(), 0.);
    assert_eq!(empty.light(), 10.);
}
