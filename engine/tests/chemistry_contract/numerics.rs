use super::{
    interactions::{free, point},
    support::*,
    transport::flux,
};

fn energy(n: [f64; 2], crowding: f64) -> f64 {
    free(
        &[
            point(n[0], [0., 0.], [0.; 2]),
            point(n[1], [1., 0.], [0.; 2]),
        ],
        crowding,
    )
}
fn step(n: [f64; 2], dt: f64, crowding: f64) -> Option<[f64; 2]> {
    let jump = crowding * (n[1] * n[1] - n[0] * n[0]);
    let outgoing = super::transport::bernoulli(jump).max(super::transport::bernoulli(-jump));
    if dt * outgoing > 0.5 {
        return None;
    }
    let q = dt * flux(n[0], n[1], jump, 1.);
    let next = [n[0] - q, n[1] + q];
    if next.iter().any(|n| *n < 0.) || energy(next, crowding) > energy(n, crowding) {
        None
    } else {
        Some(next)
    }
}

#[test]
fn positivity_conservation_and_passive_dissipation() {
    for initial in [[2., 0.], [1.8, 0.2], [1.1, 0.9]] {
        let next = step(initial, 0.1, 0.4).unwrap();
        close(next.iter().sum(), initial.iter().sum(), 1e-14);
        assert!(next.iter().all(|q| *q >= 0.));
        assert!(energy(next, 0.4) <= energy(initial, 0.4));
    }
    assert!(step([2., 0.], 10., 0.4).is_none());
}

#[test]
fn fixed_horizon_refinement_matches_closed_form() {
    let exact = 1. + (-2_f64).exp(); // n0'=-(n0-n1), total 2, t=1
    let mut errors = vec![];
    for count in [10, 20, 40] {
        let mut n = [2., 0.];
        for _ in 0..count {
            n = step(n, 1. / count as f64, 0.).unwrap();
        }
        errors.push((n[0] - exact).abs());
        assert!(n[0] > n[1]);
    }
    assert!(errors[0] / errors[1] > 1.8 && errors[1] / errors[2] > 1.8);
    println!("first-order errors: {errors:?}");
}

#[test]
fn rounding_is_measured_separately_from_physics() {
    for scale in [1e-24, 1., 1e6] {
        let initial = [1.3 * scale, 0.7 * scale];
        let transfer = 0.001 * scale;
        let exact = [initial[0] - transfer, initial[1] + transfer];
        let stored = exact.map(|n| n as f32 as f64);
        let loss: f64 = exact.iter().zip(stored).map(|(n, q)| n - q).sum();
        close(
            initial.iter().sum::<f64>() - stored.iter().sum::<f64>(),
            loss,
            1e-15 * scale,
        );
        assert!(loss.abs() <= 2_f64.powi(-24) * exact.iter().sum::<f64>());
        assert!(loss.abs() < transfer * 0.001);
    }
    let nodes = (320 / 2) * (240 / 2);
    assert_eq!(nodes, 19200);
    assert_eq!(nodes * 256 * 4, 19660800);
    close(30. * 0.2, 6., 0.);
}
