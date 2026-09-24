use crate::{config::Config, source_medium, world::World};

fn fixture() -> World {
    let mut w = World::new(
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
            source_gap: 0.5,
            source_species: vec![0, 80],
            dt: 0.25,
            ..Config::default()
        },
    )
    .unwrap();
    w.sources[0].rate = 2.;
    w.sources[0].amount = 0.75;
    w.sources[0].mixture.fill(0.);
    w.sources[0].mixture[0] = 0.2;
    w.sources[0].mixture[80] = 0.8;
    crate::diagnostics::initialize(&mut w);
    w
}

#[test]
fn finite_release_depletes_then_waits_and_refills_with_accounted_composition() {
    let mut w = fixture();
    let before = w.held();
    source_medium::advance(&mut w);
    assert_eq!(w.sources[0].amount, 0.25);
    assert_eq!(w.ledger.source_released, 0.5);
    source_medium::advance(&mut w);
    assert_eq!(w.sources[0].amount, 0.);
    assert!(w.sources[0].wait.is_finite() && w.sources[0].wait >= 0.);
    assert_eq!(w.ledger.source_released, 0.75);
    // The emptied deposit still exposes its composition; it holds no releasable material.
    assert!(w.field.source_load().iter().any(|v| *v > 0.));
    assert!(
        source_medium::observe(&w)[0]["outputRate"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    let wait_steps = (w.sources[0].wait / w.config.dt).ceil().max(1.) as usize;
    for _ in 1..wait_steps {
        source_medium::advance(&mut w);
        assert_eq!(w.sources[0].amount, 0.);
        assert_eq!(w.ledger.supplied, 0.);
    }
    source_medium::advance(&mut w);
    assert_eq!(w.sources[0].amount, 1.5);
    assert_eq!(w.sources[0].rate, 2.);
    assert_eq!(w.sources[0].wait, 0.);
    assert_eq!(w.ledger.supplied, 2.);
    let potential =
        0.2 * w.chemistry.properties[0].potential + 0.8 * w.chemistry.properties[80].potential;
    assert!((w.ledger.supplied_energy - 2. * potential).abs() < 1e-12);
    let after = w.held();
    assert!((after.0 + w.ledger.numerical_material - before.0 - 2.).abs() < 1e-10);
    assert!((after.1 + w.ledger.numerical_energy - before.1 - 2. * potential).abs() < 1e-10);
    w.validate().unwrap();
}

#[test]
fn simultaneous_exhaustion_schedules_independent_renewals_each_cycle() {
    let mut w = fixture();
    w.config.source_gap = 10.;
    w.sources = vec![w.sources[0].clone(); 128];
    let mut previous = vec![0.; w.sources.len()];
    for _ in 0..2 {
        for source in &mut w.sources {
            source.amount = source.rate * w.config.dt;
        }
        source_medium::advance(&mut w);
        let waits: Vec<_> = w.sources.iter().map(|s| s.wait).collect();
        assert!(w.sources.iter().all(|s| s.amount == 0.));
        assert!(waits.iter().all(|w| w.is_finite() && *w >= 0.));
        assert!(waits.iter().any(|wait| *wait < w.config.source_gap));
        assert!(waits.iter().any(|wait| *wait > w.config.source_gap));
        assert!(waits.windows(2).all(|pair| pair[0] != pair[1]));
        assert!(waits.iter().zip(&previous).all(|(a, b)| a != b));
        let mean = waits.iter().sum::<f64>() / waits.len() as f64;
        assert!((0.7..1.3).contains(&(mean / w.config.source_gap)));
        previous = waits;
    }
}

#[test]
fn empty_reservoir_keeps_its_structural_projection_and_response() {
    let mut w = fixture();
    w.config.source_drift = 4.;
    for n in 0..w.field.nx * w.field.ny {
        w.field
            .add(n, 15, 1. + (n % w.field.nx) as f64, &w.chemistry);
    }
    source_medium::project(&mut w);
    let occupied = source_medium::response(&w.sources[0], 0, &w.config, &w.field, &w.chemistry);
    let load: Vec<f64> = w.field.source_load().iter().copied().collect();
    assert!(occupied.velocity[0].hypot(occupied.velocity[1]) > 1e-8);
    w.sources[0].amount = 0.;
    w.sources[0].wait = 10.;
    source_medium::project(&mut w);
    // Exposure follows composition and interface, not fill: emptying changes neither.
    let empty = source_medium::response(&w.sources[0], 0, &w.config, &w.field, &w.chemistry);
    assert_eq!(empty.velocity, occupied.velocity);
    assert!(w.field.source_load().iter().copied().eq(load));
    let position = [w.sources[0].habitat.x, w.sources[0].habitat.y];
    source_medium::advance(&mut w);
    assert_ne!(position, [w.sources[0].habitat.x, w.sources[0].habitat.y]);
}

#[test]
fn composition_conversion_matches_the_shared_operator_on_actual_material() {
    let mut w = fixture();
    w.config.source_processing = 1.;
    let operators = crate::weathering::Operators::new(&w.chemistry);
    let response = source_medium::Response {
        velocity: [0.; 2],
        shift: [0.; 2],
        signal: [0.2, -0.1],
        light: 0.7,
        load: 0.,
    };
    let step = source_medium::Step {
        tick: 0,
        config: &w.config,
        chemistry: &w.chemistry,
        operators: &operators,
        exposure: 1.,
        response,
        release: true,
    };
    for amount in [0., 0.01, 2., 1000.] {
        let mut s = w.sources[0].clone();
        s.amount = amount;
        s.rate = 0.;
        let mut actual: Vec<_> = s.inventory().collect();
        let expected = operators
            .inventory_active(
                &mut actual,
                crate::reaction_medium::Medium::illuminated(response.signal, response.light),
                w.config.dt * w.config.weathering_rate,
                amount * f32::EPSILON as f64,
                u64::MAX,
            )
            .0;
        let mut ledger = crate::accounting::Ledger::default();
        s.advance(&step, &mut w.environment_rng, &mut w.field, &mut ledger);
        for (a, b) in actual.iter().zip(s.inventory()) {
            assert!((a - b).abs() < 1e-11);
        }
        assert_eq!(s.amount, amount);
        assert!((s.mixture.iter().sum::<f64>() - 1.).abs() < 1e-12);
        assert_ne!(s.mixture, w.sources[0].mixture);
        for (a, b) in expected.into_iter().zip([
            ledger.source_converted,
            ledger.source_heat,
            ledger.source_work,
        ]) {
            assert!((a - b).abs() < 1e-11);
        }
    }
}

#[test]
fn explicit_boundary_override_changes_only_the_next_empty_batch() {
    let mut w = fixture();
    w.config.source_zones = Some(vec![vec![0., 1.]]);
    source_medium::advance(&mut w);
    assert_eq!(w.sources[0].mixture[0], 0.2);
    source_medium::advance(&mut w);
    assert_eq!(w.sources[0].amount, 0.);
    let wait_steps = (w.sources[0].wait / w.config.dt).ceil().max(1.) as usize;
    for _ in 0..wait_steps {
        source_medium::advance(&mut w);
    }
    assert_eq!(w.sources[0].mixture[0], 0.);
    assert_eq!(w.sources[0].mixture[80], 1.);
    assert!((w.ledger.supplied_energy - 2. * w.chemistry.properties[80].potential).abs() < 1e-12);
}
