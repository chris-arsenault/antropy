use crate::{ancestry::Cause, config::Config, mortality_recovery, world::World};

fn fixture(enabled: bool) -> World {
    let mut w = World::new(
        27,
        Config {
            width: 48.,
            height: 48.,
            founders: 4,
            source_count: 2,
            source_priming: 0.,
            source_drift: 0.,
            source_processing: 0.,
            mortality_recovery: enabled,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..Config::default()
        },
    )
    .unwrap();
    for c in &mut w.cells {
        c.x = 0.1;
        c.y = 47.9;
        c.bound_material.fill(0.);
        c.bound_material.set(8, 1.);
        c.inventory.fill(0.);
        c.inventory.set(0, 0.3);
    }
    for s in &mut w.sources {
        s.habitat.x = 0.1;
        s.habitat.y = 47.9;
        s.habitat.radius = 1.;
        s.amount = 0.;
        s.rebase_supply();
        s.wait = 100.;
        s.rebuild(&w.config, &w.field);
    }
    crate::source_medium::project(&mut w);
    crate::diagnostics::initialize(&mut w);
    w
}

fn species(w: &World, id: usize) -> f64 {
    w.field
        .amounts()
        .rows()
        .map(|(_, row)| row[id] as f64)
        .sum::<f64>()
        + w.sources
            .iter()
            .map(|s| s.amount * s.mixture[id])
            .sum::<f64>()
        + w.cells
            .iter()
            .map(|c| c.bound_material.value(id) + c.inventory.value(id))
            .sum::<f64>()
}

#[test]
fn finite_body_recovers_at_periodic_overlap_without_free_inventory_or_work_grants() {
    let mut w = fixture(true);
    let before = w.held();
    let chemical = [species(&w, 0), species(&w, 8)];
    mortality_recovery::assay(&mut w, &[1, 2]).unwrap();
    let recovered = 2. * 0.5_f64.powi(2) / (0.5_f64.powi(2) + 0.25_f64.powi(2));
    assert!(
        (w.mortality.recovered - recovered).abs() < 1e-12,
        "actual={} expected={} biomass={} deaths={}",
        w.mortality.recovered,
        recovered,
        w.mortality.biomass,
        w.mortality.dead_body
    );
    for s in &w.sources {
        assert!((s.amount - recovered / 2.).abs() < 1e-12);
    }
    assert!(
        w.sources
            .iter()
            .all(|s| s.mixture[0] == 0. && s.wait == 100.)
    );
    assert_eq!(w.ledger.supplied, 0.);
    for (id, value) in [0, 8].into_iter().zip(chemical) {
        assert!((species(&w, id) - value).abs() < 1e-7);
    }
    let after = w.held();
    assert!((before.0 - after.0 - w.ledger.numerical_material).abs() < 1e-7);
    assert!((before.1 - after.1 - w.ledger.death_heat - w.ledger.numerical_energy).abs() < 1e-7);
    w.validate().unwrap();
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    mortality_recovery::assay(&mut w, &[3]).unwrap();
    mortality_recovery::assay(&mut restored, &[3]).unwrap();
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
}

#[test]
fn shuffled_death_order_worker_count_and_observation_do_not_select_recipients() {
    let mut a = fixture(true);
    let mut b = a.clone();
    b.cells.reverse();
    for (w, threads) in [(&mut a, 1), (&mut b, 4)] {
        rayon::ThreadPoolBuilder::new()
            .num_threads(threads)
            .build()
            .unwrap()
            .install(|| {
                mortality_recovery::assay(w, &[2, 1]).unwrap();
            });
    }
    assert_eq!(a.sources[0].amount, b.sources[0].amount);
    assert_eq!(a.mortality.recovered, b.mortality.recovered);
    b.cells.sort_unstable_by_key(|c| c.id);
    assert_eq!(a.snapshot().unwrap(), b.snapshot().unwrap());
    let before = a.snapshot().unwrap();
    crate::observation::summary(&a);
    crate::observation::environment(&a);
    let inspection = crate::commands::execute(
        &mut a,
        &serde_json::json!({"op":"inspectReservoir","source":0}),
    )
    .unwrap();
    assert_eq!(inspection["storedMaterial"], a.sources[0].amount);
    assert!(inspection.to_string().len() < 1024);
    assert!(inspection.get("wait").is_none());
    assert!(
        crate::commands::execute(
            &mut a,
            &serde_json::json!({"op":"inspectReservoir","source":999}),
        )
        .is_err()
    );
    let mut render = crate::render::Buffers::default();
    render.prepare(&a, 0, 0, 0, true, 0).unwrap();
    let source = render
        .markers
        .chunks_exact(crate::render::STRIDE)
        .find(|row| row[8] == 0.)
        .unwrap();
    assert_eq!(source[7], 1.);
    assert!(source[10] > 0.);
    assert_eq!(source[9], -1.);
    assert_eq!(a.snapshot().unwrap(), before);
    crate::source_medium::advance(&mut a);
    let after = a.snapshot().unwrap();
    render.prepare(&a, 0, 0, 0, true, 0).unwrap();
    assert!(
        render
            .markers
            .chunks_exact(crate::render::STRIDE)
            .filter(|row| row[8] == 0.)
            .all(|row| row[9] < -1.)
    );
    assert_eq!(a.snapshot().unwrap(), after);
}

#[test]
fn absent_recipients_and_disabled_feedback_spill_and_interventions_rebase() {
    for enabled in [false, true] {
        let mut w = fixture(enabled);
        if enabled {
            for s in &mut w.sources {
                s.habitat.x = 24.;
                s.habitat.y = 24.;
                s.rebuild(&w.config, &w.field);
            }
        }
        mortality_recovery::assay(&mut w, &[1]).unwrap();
        assert_eq!(w.mortality.recovered, 0.);
        assert!((w.mortality.spill - 1.3).abs() < 1e-12);
        crate::commands::execute(
            &mut w,
            &serde_json::json!({"op":"intervene","cell":2,"kill":true}),
        )
        .unwrap();
        assert_eq!(w.mortality.death_rate, 0.);
        assert!((w.mortality.biomass - 2.).abs() < 1e-12);
    }
}

#[test]
fn natural_and_disturbance_deaths_share_one_response_before_mixing() {
    let mut w = fixture(true);
    w.cells[0].energy = 0.;
    w.config.disturbance = Some(crate::config::Disturbance {
        mean_interval: 1e-10,
        radius: 100.,
        mortality: 1.,
        mixing: 1.,
    });
    crate::lifecycle::advance(&mut w);
    assert!((w.mortality.dead_body - 4.).abs() < 1e-12);
    assert_eq!(w.ledger.deaths, 4);
    assert_eq!(w.ledger.disturbance_deaths, 3);
    assert!((w.mortality.recovered - 4. / (1. + 0.25_f64.powi(2))).abs() < 1e-12);
    assert!(matches!(
        crate::ancestry::get(&w.ancestry, 1).unwrap().cause,
        Cause::Starvation
    ));
}

#[test]
fn funded_growth_is_counted_once_only_on_physiology_ticks() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., true, false);
    let mut expected = 0.;
    for _ in 0..24 {
        let before = w.ledger.flows.grown;
        w.step();
        expected = expected * (-w.config.dt / w.config.mortality_memory).exp()
            + (w.ledger.flows.grown - before) / w.config.mortality_memory;
        assert!((w.mortality.growth_rate - expected).abs() < 1e-12);
    }
    assert!(expected > 0.);
    assert_eq!(w.mortality.death_rate, 0.);
}

#[test]
fn division_does_not_create_loss_and_corrupt_feedback_is_rejected() {
    let mut w = fixture(true);
    for cell in &mut w.cells {
        cell.set_fixture_body(cell.body.map(|q| q * 4.));
        cell.energy = 10.;
        cell.inventory.set(0, 2.);
    }
    crate::diagnostics::initialize(&mut w);
    crate::lifecycle::reproduce(&mut w);
    assert!(w.ledger.divisions > 0);
    assert_eq!(w.mortality.death_rate, 0.);
    assert_eq!(w.mortality.dead_body, 0.);
    w.mortality.growth_rate = f64::NAN;
    assert!(World::restore(&w.snapshot().unwrap()).is_err());
    w.mortality.growth_rate = 0.;
    w.sources[0].allowance = -1.;
    assert!(World::restore(&w.snapshot().unwrap()).is_err());
}
