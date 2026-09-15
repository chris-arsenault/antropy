use super::support::*;

#[derive(Clone, Copy)]
pub struct Point {
    pub n: f64,
    pub x: [f64; 2],
    pub q: [f64; 2],
}
pub fn point(n: f64, x: [f64; 2], q: [f64; 2]) -> Point {
    Point { n, x, q }
}
pub fn kernel1(x: f64, range: f64) -> f64 {
    if x.abs() >= range {
        0.
    } else {
        (1. + (std::f64::consts::PI * x / range).cos()) / (2. * range)
    }
}
pub fn kernel1_prime(x: f64, range: f64) -> f64 {
    if x.abs() >= range {
        0.
    } else {
        -std::f64::consts::PI * (std::f64::consts::PI * x / range).sin() / (2. * range * range)
    }
}
fn displacement(a: &Point, b: &Point) -> [f64; 2] {
    std::array::from_fn(|k| (a.x[k] - b.x[k] + 8.).rem_euclid(16.) - 8.)
}
fn pair(a: &Point, b: &Point) -> f64 {
    let d = displacement(a, b);
    (-a.q[0] * b.q[0] + a.q[1] * b.q[1]) * kernel1(d[0], 4.) * kernel1(d[1], 4.)
}
pub fn stored(points: &[Point], crowding: f64) -> f64 {
    points
        .iter()
        .map(|a| {
            2. * a.n
                + crowding * a.n.powi(3) / 3.
                + 0.5 * a.n * points.iter().map(|b| b.n * pair(a, b)).sum::<f64>()
        })
        .sum()
}
pub fn free(points: &[Point], crowding: f64) -> f64 {
    stored(points, crowding) + points.iter().map(|a| ideal_term(a.n, 1.)).sum::<f64>()
}
pub fn mu(points: &[Point], i: usize, crowding: f64) -> f64 {
    let a = &points[i];
    2. + a.n.ln() + crowding * a.n * a.n + points.iter().map(|b| b.n * pair(a, b)).sum::<f64>()
}
pub fn force_x(points: &[Point], i: usize) -> f64 {
    let a = &points[i];
    -a.n * points
        .iter()
        .map(|b| {
            let d = displacement(a, b);
            b.n * (-a.q[0] * b.q[0] + a.q[1] * b.q[1]) * kernel1_prime(d[0], 4.) * kernel1(d[1], 4.)
        })
        .sum::<f64>()
}

#[test]
fn amounts_positions_and_reciprocity() {
    let mut points = vec![
        point(0.7, [0.2, 0.3], [0.8, -0.3]),
        point(1.1, [1.3, 0.8], [-0.4, 0.6]),
    ];
    for eps in [1e-4, 1e-5, 1e-6] {
        let n = points[0].n;
        points[0].n = n + eps;
        let up = free(&points, 0.4);
        points[0].n = n - eps;
        let down = free(&points, 0.4);
        points[0].n = n;
        close((up - down) / (2. * eps), mu(&points, 0, 0.4), 2e-8);
        let x = points[0].x[0];
        points[0].x[0] = x + eps;
        let up = free(&points, 0.4);
        points[0].x[0] = x - eps;
        let down = free(&points, 0.4);
        points[0].x[0] = x;
        close(-(up - down) / (2. * eps), force_x(&points, 0), 2e-8);
        points[1].n += eps;
        let a = mu(&points, 0, 0.4);
        points[1].n -= 2. * eps;
        let b = mu(&points, 0, 0.4);
        points[1].n += eps;
        points[0].n += eps;
        let c = mu(&points, 1, 0.4);
        points[0].n -= 2. * eps;
        let d = mu(&points, 1, 0.4);
        points[0].n += eps;
        close((a - b) / (2. * eps), (c - d) / (2. * eps), 2e-8);
    }
}

#[test]
fn translation_self_force_and_ideal_limit() {
    let mut p = vec![
        point(1., [0.1, 0.3], [1., 0.]),
        point(2., [15.8, 0.4], [0.5, 0.8]),
    ];
    let before = free(&p, 0.4);
    for a in &mut p {
        a.x[0] += 7.;
        a.x[1] -= 18.;
    }
    close(free(&p, 0.4), before, 1e-13);
    close(force_x(&p, 0) + force_x(&p, 1), 0., 1e-14);
    close(force_x(&p[..1], 0), 0., 0.);
    for a in &mut p {
        a.q = [0.; 2];
    }
    close(
        free(&p, 0.),
        ideal_free(&[1., 2.], &[1., 1.], &[2., 2.], 1.),
        1e-14,
    );
    let mut empty = point(0., [0., 0.], [1., 0.]);
    assert!(free(&[empty], 0.4).is_finite());
    assert_eq!(mu(&[empty], 0, 0.4), f64::NEG_INFINITY);
    empty.n = 1e-100;
    assert!(mu(&[empty], 0, 0.4).is_finite());
}

#[test]
fn normalized_kernel_and_coercive_crowding() {
    // Trapezoid quadrature is exact to roundoff for the single cosine mode.
    let mut integral = 0.;
    for i in 0..128 {
        integral += kernel1(-4. + (i as f64 + 0.5) / 16., 4.) / 16.;
    }
    close(integral, 1., 2e-14);
    close(kernel1(4., 4.), 0., 0.);
    close(kernel1_prime(4., 4.), 0., 0.);
    // Young's bound: -g rho² + gamma rho³/3, g=1, gamma=0.4.
    let lower = |rho: f64| -rho * rho + 0.4 * rho.powi(3) / 3.;
    for rho in [0., 1., 3., 5., 10., 100.] {
        assert!(lower(rho) >= -25. / 3. - 1e-12);
    }
    assert!(lower(100.) / 100. > lower(10.) / 10.);
}
