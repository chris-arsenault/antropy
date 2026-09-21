use crate::{
    config::Config,
    illumination::{Illumination, phases, response},
};
use std::f64::consts::TAU;

#[test]
fn scalar_light_preserves_chemical_direction_under_basis_changes() {
    let w = crate::initial_ecology::probe(1, true).unwrap();
    let basis = |v: [f64; 2]| [2. * v[0] - v[1], v[0] + 3. * v[1]];
    for signal in [[0., 0.], [1., -0.3], [-0.4, 0.7]] {
        for light in [0., 0.2, 1., 1.8] {
            let medium = crate::reaction_medium::Medium::illuminated(signal, light);
            assert_eq!(medium.signal, signal);
            let transformed = crate::illumination::drive(basis(signal), light);
            for (a, b) in basis(medium.drive).into_iter().zip(transformed) {
                assert!((a - b).abs() < 1e-12);
            }
            assert!((signal[0] * medium.drive[1] - signal[1] * medium.drive[0]).abs() < 1e-12);
            if light == 0. {
                assert_eq!(medium.drive, [0.; 2]);
            }
            for enzyme in &w.cells[0].operators.as_ref().unwrap().enzymes {
                for row in &enzyme.conversions {
                    let uniform = row.energy(&w.config, signal)[2];
                    let lit = row.energy(&w.config, medium.drive)[2];
                    assert!((lit - light * uniform).abs() < 1e-12);
                }
            }
        }
    }
}

#[test]
fn periodic_light_matches_law_bounds_mean_and_all_phases() {
    let mut c = Config {
        illumination_contrast: 0.8,
        ..Config::default()
    };
    let mut field = Illumination::default();
    for tick in [0, 317, 6000, 200001] {
        field.prepare(27, tick, &c, 16, 12);
        let p = phases(27, tick as f64 * c.dt, [6000., 18000., 62000.]);
        let mut mean = 0.;
        for n in 0..192 {
            let u = TAU * ((n % 16) as f64 + 0.5) / 16. - p[0];
            let v = TAU * ((n / 16) as f64 + 0.5) / 12. - p[1];
            let expected = 1. + 0.4 * (u.cos() * (v - p[2]).cos() + v.cos() * (u - p[2]).cos());
            let actual = field.node(n);
            assert!((actual - expected).abs() < 1e-12);
            assert!((0.2 - 1e-12..=1.8 + 1e-12).contains(&actual));
            mean += actual / 192.;
        }
        assert!((mean - 1.).abs() < 1e-12);
    }
    let before = field.node(19);
    c.illumination_modulation_period = 21000.;
    field.prepare(27, 200001, &c, 16, 12);
    assert_ne!(field.node(19), before);
    c.illumination_contrast = 0.;
    field.prepare(27, 1, &c, 16, 12);
    assert_eq!(field.node(19), 1.);
    c.illumination_contrast = 0.8;
    field.prepare(28, 1, &c, 8, 8);
    assert!(field.node(63).is_finite());
}

#[test]
fn cross_axis_gates_sweep_and_composite_retains_modulation() {
    let circle = |a: f64| [a.cos(), a.sin()];
    let mean = |u, v, m| response(circle(u), circle(v), circle(m), 0.8);
    // A cross-axis quadrature suppresses the sweep; its opposite reverses it.
    for i in 0..32 {
        let u = TAU * i as f64 / 32.;
        assert!((mean(u, TAU / 4., 0.) - 1.).abs() < 1e-12);
        assert!((mean(u, 0., 0.) + mean(u, TAU / 2., 0.) - 2.).abs() < 1e-12);
    }
    // An additive X+Y image has zero mixed difference. The displayed mean must not.
    let interaction = mean(0., 0., 0.) - mean(TAU / 4., 0., 0.) - mean(0., TAU / 4., 0.)
        + mean(TAU / 4., TAU / 4., 0.);
    assert!((interaction - 0.8).abs() < 1e-12);
    assert!((mean(0., 0., 0.) - mean(0., 0., TAU / 4.)).abs() > 0.7);
    let c = Config::default();
    let periods = [
        c.illumination_fast_period,
        c.illumination_slow_period,
        c.illumination_modulation_period,
    ];
    assert!(periods.iter().all(|p| p / c.dt >= 30_000.));
    // Products introduce sum frequencies; bound the fastest resulting harmonic too.
    assert!(1. / periods.iter().map(|p| c.dt / p).sum::<f64>() > 20_000.);
}

#[test]
fn forcing_transforms_with_frames_and_invalid_periods_fail() {
    // Reflect both spatial angles and their phase offsets: cosines are unchanged.
    let circle = |a: f64| [a.cos(), a.sin()];
    let original = response(circle(0.7), circle(2.3), circle(1.1), 0.8);
    let reflected = response(circle(-0.7), circle(-2.3), circle(-1.1), 0.8);
    assert_eq!(original, reflected);
    // Translation changes coordinates and matching phase by the same amount.
    let translated = response(
        circle((0.7 + 1.2) - 1.2),
        circle((2.3 + 0.8) - 0.8),
        circle(1.1),
        0.8,
    );
    assert!((original - translated).abs() < 1e-12);
    for bad in [0., f64::NAN, 0.1] {
        let c = Config {
            illumination_fast_period: bad,
            ..Config::default()
        };
        assert!(c.validate().is_err());
    }
}

#[test]
fn illuminated_abiotic_work_closes_without_scaling_affordable_rates() {
    let c = Config::default();
    let chemistry = crate::chemistry::Chemistry::new(101).unwrap();
    let op = crate::weathering::Operators::new(&chemistry);
    let signal = crate::weathering::signal([1., -1.]);
    let dark = crate::reaction_medium::Medium::illuminated(signal, 0.);
    let bright = crate::reaction_medium::Medium::illuminated(signal, 1.8);
    let mut admitted = 0;
    for s in 0..256 {
        for j in 0..crate::weathering::BRANCHES {
            let (r0, _, w0) = op.local(s, j, dark);
            let (r1, heat, work) = op.local(s, j, bright);
            let delta = chemistry.properties[s].potential
                - chemistry.properties[op.destination[s][j]].potential;
            assert_eq!(w0, 0.);
            if delta < 0. {
                assert_eq!(r0, 0.);
            }
            if r0 > 0. {
                assert_eq!(r0, r1);
            }
            if r1 > 0. {
                assert!((delta + work - heat).abs() < 1e-12);
                assert!(op.possible(s, j, 1.8));
                admitted += usize::from(r0 == 0.);
            }
        }
    }
    assert!(admitted > 0);
    let mut climate = crate::climate::Climate::new(&c, &chemistry);
    climate.prepare(&c);
    let mut field = vec![0.004f32; 256];
    let mut reservoir: Vec<_> = field.iter().map(|q| *q as f64).collect();
    let account = op
        .inventory_active(
            &mut reservoir,
            bright,
            c.weathering_rate * 0.8,
            0.,
            u64::MAX,
        )
        .0;
    climate.convert_lit(&mut field, u64::MAX, ([1., -1.], 0.), 0.8, 1.8);
    assert!(
        field
            .iter()
            .zip(reservoir)
            .all(|(&a, b)| (a as f64 - b).abs() < 1e-8)
    );
    assert!((account[2] - climate.work).abs() < 1e-10);
    assert!((account[1] - climate.heat).abs() < 1e-10);
}

#[test]
fn ordinary_world_uses_light_and_restores_without_observer_state() {
    let mut w = crate::initial_ecology::probe(2, true).unwrap();
    let mut reference = w.clone();
    reference.config.illumination_contrast = 0.;
    w.config.illumination_contrast = 0.8;
    for _ in 0..40 {
        w.step();
        reference.step();
    }
    assert!((w.ledger.flows.external_work - reference.ledger.flows.external_work).abs() > 1e-5);
    let summary = crate::observation::summary(&w);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-6);
    let mut restored = crate::world::World::restore(&w.snapshot().unwrap()).unwrap();
    for _ in 0..8 {
        w.step();
        restored.step();
    }
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
}
