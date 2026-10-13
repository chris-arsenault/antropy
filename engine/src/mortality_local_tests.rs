use crate::{config::Config, diagnostics, mortality_recovery, world::World};
use serde_json::json;

fn neighborhoods() -> World {
    let mut w = World::new(
        27,
        Config {
            width: 64.,
            height: 48.,
            founders: 8,
            source_count: 2,
            source_priming: 0.,
            source_drift: 0.,
            source_processing: 0.,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..Config::default()
        },
    )
    .unwrap();
    for (i, cell) in w.cells.iter_mut().enumerate() {
        cell.x = if i < 4 { 8. } else { 40. };
        cell.y = 12.;
    }
    for (i, source) in w.sources.iter_mut().enumerate() {
        source.habitat.x = if i == 0 { 8. } else { 40. };
        source.habitat.y = 12.;
        source.habitat.radius = 3.;
        source.amount = 0.;
        source.rebase_supply();
        source.wait = 100.;
        source.rebuild(&w.config, &w.field);
    }
    diagnostics::initialize(&mut w);
    w
}

#[test]
fn unrelated_growth_cannot_mask_local_loss_but_balanced_local_turnover_stays_weak() {
    // Causal severity check: matched physical neighborhoods with recorded growth impulses.
    // It does not claim that the synthetic history impulse is newly funded cell growth.
    for remote in [true, false] {
        let mut local = neighborhoods();
        let dead = local.cells[..2].iter().map(|c| c.mass()).sum::<f64>();
        local.mortality.grow(dead, local.config.mortality_memory);
        let index = if remote { 4 } else { 0 };
        local.cells[index].flows.grown = dead;
        local
            .local_mortality
            .grow(&local.cells, &local.config, &local.field, 0.);
        local.cells[index].flows.grown = 0.;
        let mut global = local.clone();
        global.config.mortality_local = false;
        let initial = local.held();
        mortality_recovery::assay(&mut local, &[1, 2]).unwrap();
        mortality_recovery::assay(&mut global, &[1, 2]).unwrap();
        assert_eq!(global.mortality.response(&global.config), 0.);
        assert_eq!(global.mortality.recovered, 0.);
        assert_eq!(local.mortality.recovered > 0., remote);
        if remote {
            assert!(local.sources[0].amount > 0.);
            assert_eq!(local.sources[1].amount, 0.);
        }
        let after = local.held();
        assert!((initial.0 - after.0 - local.ledger.numerical_material).abs() < 1e-6);
        assert!(
            (initial.1 - after.1 - local.ledger.death_heat - local.ledger.numerical_energy).abs()
                < 1e-6
        );
        local.validate().unwrap();
    }
}

#[test]
fn moving_source_samples_its_new_support_and_observation_does_not_advance_history() {
    let mut w = neighborhoods();
    mortality_recovery::assay(&mut w, &[1, 2]).unwrap();
    let old = crate::recovery_observation::source(&w, 0).unwrap();
    assert!(old["localResponse"].as_f64().unwrap() > 0.);
    w.sources[0].habitat.x = 40.;
    w.sources[0].rebuild(&w.config, &w.field);
    let before = w.snapshot().unwrap();
    let new = crate::recovery_observation::source(&w, 0).unwrap();
    assert_eq!(new["localResponse"], 0.);
    assert_eq!(w.snapshot().unwrap(), before);
    let restored = World::restore(&before).unwrap();
    assert_eq!(
        crate::recovery_observation::source(&restored, 0).unwrap(),
        new
    );
}

#[test]
fn local_history_delivers_actual_corpse_inventory_without_rewriting_external_supply() {
    let mut w = neighborhoods();
    let boundaries: Vec<_> = w
        .sources
        .iter()
        .map(|s| s.supply_condition.clone())
        .collect();
    mortality_recovery::assay(&mut w, &[1, 2]).unwrap();
    let admitted = w.mortality.recovered;
    let before = w.ledger.source_released;
    for _ in 0..40 {
        w.step();
    }
    assert!(admitted > 0. && w.ledger.source_released > before);
    assert!(w.ledger.flows.imported > 0.);
    assert!(w.ledger.flows.transport > 0.);
    assert_eq!(w.ledger.supplied, 0.);
    assert_eq!(
        w.sources
            .iter()
            .map(|s| s.supply_condition.clone())
            .collect::<Vec<_>>(),
        boundaries
    );
    let summary = crate::observation::summary(&w);
    println!(
        "local recovery admitted={} release={} intake={} captured={} growth={}",
        admitted,
        w.ledger.source_released,
        w.ledger.flows.imported,
        w.ledger.flows.captured,
        w.ledger.flows.grown
    );
    assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-6);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-6);
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    crate::run_control::configure(&mut restored, &json!({"patch":{"mortalityLocal":false}}))
        .unwrap();
}
