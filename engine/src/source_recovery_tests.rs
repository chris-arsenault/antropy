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
        assert_eq!(a.supply_condition, b.supply_condition);
        assert_eq!(
            control.ledger.supplied_energy,
            recovered.ledger.supplied_energy
        );
    }
    assert!(recovered.ledger.source_released > control.ledger.source_released);
}

#[test]
fn recovered_chemistry_remains_finite_across_repeated_external_refills() {
    // A tiny deposit used to replace an empty source's profile and then be cloned at refill.
    // Test both sides of empty, a full source, and deposits spanning eleven orders of magnitude.
    for initial in [0., 1e-8, 10.] {
        for deposit in [1e-9, 0.001, 1., 100.] {
            let w = world();
            let mut s = w.sources[0].clone();
            s.amount = initial;
            s.rebase_supply();
            s.allowance = 0.;
            s.wait = 0.;
            s.rate = 2.;
            let condition = s.supply_condition.clone();
            let before: Vec<_> = s.inventory().collect();
            let mut incoming = vec![0.; 256];
            incoming[8] = deposit;
            s.admit(&incoming);
            s.refresh_material(&w.chemistry);
            let surface = s.material.composition;
            let operators = crate::weathering::Operators::new(&w.chemistry);
            let step = source_medium::Step {
                tick: 0,
                config: &w.config,
                chemistry: &w.chemistry,
                operators: &operators,
                exposure: 0.,
                response: source_medium::Response {
                    velocity: [0.; 2],
                    shift: [0.; 2],
                    signal: [0.; 2],
                    light: 0.,
                    load: 0.,
                },
                release: true,
                chemical_dt: 0.,
            };
            let mut released = vec![0.; 256];
            let mut supplied = [0.; 2];
            for _ in 0..200 {
                let outcome = s.advance_local(&step, &w.field);
                for (mix, amount) in outcome.parcels {
                    for (total, share) in released.iter_mut().zip(mix) {
                        *total += amount * share;
                    }
                }
                for (total, q) in supplied.iter_mut().zip(outcome.supplied) {
                    *total += q;
                }
                assert_eq!(s.supply_condition, condition);
                assert_eq!(s.material.composition, surface);
            }
            assert!(supplied[0] > 2. * w.config.source_lifetime * s.rate);
            let potential: f64 = condition
                .iter()
                .zip(&w.chemistry.properties)
                .map(|(q, p)| q * p.potential)
                .sum();
            assert!((supplied[1] - supplied[0] * potential).abs() < 1e-10);
            for (id, held) in s.inventory().enumerate() {
                let expected = before[id] + incoming[id] + supplied[0] * condition[id];
                assert!(
                    (held + released[id] - expected).abs() < 1e-10,
                    "initial={initial}, deposit={deposit}, species={id}"
                );
            }
            // Every unit of corpse chemistry is either still stored or released exactly once.
            assert!((s.amount * s.mixture[8] + released[8] - deposit).abs() < deposit * 1e-12);
        }
    }
}

#[test]
fn distinct_inventory_and_boundary_survive_restore_and_validate_independently() {
    let mut w = world();
    let mut incoming = vec![0.; 256];
    incoming[8] = 4.;
    w.sources[0].admit(&incoming);
    assert_ne!(w.sources[0].mixture, w.sources[0].supply_condition);
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    for _ in 0..100 {
        source_medium::advance(&mut w);
        source_medium::advance(&mut restored);
    }
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
    for bad in [vec![], vec![f64::NAN; 256], vec![-1.; 256], vec![1.; 256]] {
        w.sources[0].supply_condition = bad;
        assert!(World::restore(&w.snapshot().unwrap()).is_err());
    }
}

#[test]
fn boundary_weathering_never_adds_virtual_material_or_work_to_inventory_accounts() {
    let w = world();
    let mut s = w.sources[0].clone();
    s.amount = 0.;
    let mut incoming = vec![0.; 256];
    incoming[8] = 2.;
    s.admit(&incoming);
    let operators = crate::weathering::Operators::new(&w.chemistry);
    let medium = crate::reaction_medium::Medium::illuminated([0.4, -0.3], 1.);
    let mut expected = s.mixture.clone();
    let account = operators
        .inventory_active(&mut expected, medium, 1., f32::EPSILON as f64, u64::MAX)
        .0;
    let initial_boundary = s.supply_condition.clone();
    let initial_potential = 2. * w.chemistry.properties[8].potential;
    assert_eq!(s.convert_medium(&operators, medium, 1.), account);
    let total: f64 = expected.iter().sum();
    for q in &mut expected {
        *q /= total;
    }
    assert_eq!(s.mixture, expected);
    assert_ne!(s.supply_condition, initial_boundary);
    assert_ne!(s.supply_condition, s.mixture);
    assert_eq!(s.amount, 2.);
    let potential: f64 = s
        .inventory()
        .zip(&w.chemistry.properties)
        .map(|(q, p)| q * p.potential)
        .sum();
    assert!((initial_potential + 2. * account[2] - 2. * account[1] - potential).abs() < 1e-12);
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
