use crate::{config::Config, source_medium, world::World};

fn world() -> World {
    World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 0,
            source_count: 1,
            source_priming: 0.,
            source_processing: 0.,
            source_drift: 0.,
            source_lifetime: 1.,
            source_gap: 10.,
            ..Config::default()
        },
    )
    .unwrap()
}

#[test]
fn recovered_stock_never_changes_nominal_schedule_or_rng() {
    let mut control = world();
    let mut recovered = control.clone();
    let mut material = vec![0.; 256];
    material[8] = 7.;
    recovered.sources[0].admit(&material);
    for _ in 0..100 {
        source_medium::advance(&mut control);
        source_medium::advance(&mut recovered);
        let (a, b) = (&control.sources[0], &recovered.sources[0]);
        assert_eq!(a.allowance, b.allowance);
        assert_eq!(a.wait, b.wait);
        assert_eq!(a.renewal_rng.0, b.renewal_rng.0);
        assert!((control.ledger.supplied - recovered.ledger.supplied).abs() < 1e-12);
    }
    assert!(recovered.ledger.source_released > control.ledger.source_released);
}

#[test]
fn waiting_stock_discharges_and_imports_mix_without_overwriting_or_misaccounting() {
    let mut w = world();
    let s = &mut w.sources[0];
    s.amount = 0.;
    s.rebase_supply();
    s.wait = 0.3;
    s.rate = 2.;
    w.config.source_zones = Some(vec![vec![1., 0.]]);
    let mut incoming = vec![0.; 256];
    incoming[8] = 4.;
    s.admit(&incoming);
    let before = w.held();
    source_medium::advance(&mut w);
    assert!((w.ledger.source_released - 0.4).abs() < 1e-12);
    assert!((w.sources[0].wait - 0.1).abs() < 1e-12);
    assert_eq!(w.sources[0].empty_elapsed, 0.);
    source_medium::advance(&mut w);
    assert_eq!(w.ledger.supplied, 2.);
    assert!((w.ledger.supplied_energy - 2. * w.chemistry.properties[0].potential).abs() < 1e-12);
    assert!(w.sources[0].mixture[8] > 0. && w.sources[0].mixture[0] > 0.);
    let after = w.held();
    assert!((after.0 + w.ledger.numerical_material - before.0 - 2.).abs() < 1e-6);
    assert!(
        (after.1 + w.ledger.numerical_energy - before.1 - w.ledger.supplied_energy).abs() < 1e-6
    );
    w.validate().unwrap();
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    source_medium::advance(&mut w);
    source_medium::advance(&mut restored);
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
}

#[test]
fn empty_duration_tracks_stock_and_priming_sets_initial_allowance() {
    let mut w = world();
    let s = &mut w.sources[0];
    s.amount = 0.;
    s.rebase_supply();
    s.wait = 10.;
    source_medium::advance(&mut w);
    assert_eq!(w.sources[0].empty_elapsed, w.config.dt);
    let mut material = vec![0.; 256];
    material[8] = 0.01;
    w.sources[0].admit(&material);
    assert_eq!(w.sources[0].empty_elapsed, 0.);
    source_medium::advance(&mut w);
    assert!((w.sources[0].empty_elapsed - (w.config.dt - 0.01 / w.sources[0].rate)).abs() < 1e-12);
    let c = Config {
        source_priming: 0.3,
        ..w.config.clone()
    };
    let primed = World::new(27, c).unwrap();
    assert_eq!(primed.sources[0].amount, primed.sources[0].allowance);
}

#[test]
fn admission_cannot_use_release_time_accrued_before_stock_arrived() {
    let mut w = world();
    let s = &mut w.sources[0];
    s.amount = 0.;
    s.rebase_supply();
    s.wait = 10.;
    crate::source_medium::advance_scheduled(&mut w, false);
    assert_eq!(w.sources[0].pending, w.config.dt);
    let mut incoming = vec![0.; 256];
    incoming[8] = 4.;
    w.sources[0].admit(&incoming);
    crate::source_medium::advance_scheduled(&mut w, true);
    assert!((w.ledger.source_released - w.sources[0].rate * w.config.dt).abs() < 1e-12);
    assert!((w.sources[0].wait - (10. - 2. * w.config.dt)).abs() < 1e-12);
    assert_eq!(w.sources[0].admission_pending, 0.);
}
