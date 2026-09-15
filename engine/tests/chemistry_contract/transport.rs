use super::support::*;

pub fn mobility(load: f64) -> f64 {
    1. / (1. + load)
}
pub fn bernoulli(x: f64) -> f64 {
    if x.abs() < 1e-5 {
        1. - x / 2. + x * x / 12.
    } else if x > 50. {
        x * (-x).exp() / (1. - (-x).exp())
    } else {
        x / x.exp_m1()
    }
}
pub fn flux(left: f64, right: f64, excess_jump: f64, conductance: f64) -> f64 {
    conductance * (bernoulli(excess_jump) * left - bernoulli(-excess_jump) * right)
}
fn serial(a: f64, b: f64) -> f64 {
    if a == 0. || b == 0. {
        0.
    } else {
        1. / (1. / a + 1. / b)
    }
}
pub fn funded_extent(request: f64, work_per_extent: f64, available: f64) -> f64 {
    assert!(request >= 0. && work_per_extent > 0. && available >= 0.);
    request.min(available / work_per_extent)
}

#[test]
fn conservative_flux_sign_equilibrium_and_fick_limit() {
    let j = flux(3., 1., 0., 0.2);
    close(j, 0.4, 1e-14);
    close(3. - 0.1 * j + 1. + 0.1 * j, 4., 1e-14);
    close(flux(1., (-2_f64).exp(), 2., 1.), 0., 1e-14);
    for jump in [-4., -0.2, 0., 0.2, 4.] {
        let mu_jump = (0.7_f64 / 1.3).ln() + jump;
        assert!(flux(1.3, 0.7, jump, 1.) * mu_jump <= 1e-14);
    }
    close(flux(0., 0., 2., 1.), 0., 0.);
    assert!(flux(1., 0., 2., 1.) > 0.);
    assert!(flux(1., 0., 2., mobility(1e9)) < 1e-8);
}

#[test]
fn serial_delivery_uses_each_resistance_once() {
    let (bulk, internal, gd, gm) = (3., 0.5, 0.4, 0.2);
    // Solve gd*(bulk-surface)=gm*(surface-internal), independently of serial().
    let surface = (gd * bulk + gm * internal) / (gd + gm);
    let steady = gd * (bulk - surface);
    close(serial(gd, gm) * (bulk - internal), steady, 1e-14);
    close(gm * (surface - internal), steady, 1e-14);
    close(serial(gd, 0.), 0., 0.);
    assert!(serial(gd, 1e12) <= gd);
}

#[test]
fn passive_motion_and_funded_uphill_work() {
    // F=x²/2; overdamped displacement down its exact gradient.
    let x = 2.;
    let next = x - 0.1 * mobility(3.) * x;
    assert!(0.5 * next * next < 0.5 * x * x);
    let desired_work = 0.5 * (3_f64.powi(2) - x * x);
    close(funded_extent(1., desired_work, 0.), 0., 0.);
    let extent = funded_extent(1., desired_work, 0.3);
    assert!(extent * desired_work <= 0.3 + 1e-14);
    close(funded_extent(0., desired_work, 10.), 0., 0.);
    // Pump uses the same complete potential difference, independent of chemical ID.
    let pumped = funded_extent(2., 4., 0.5);
    close(pumped * 4., 0.5, 1e-14);
}
