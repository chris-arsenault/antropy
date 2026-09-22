//! Periodic parameter geometry shared by inheritance and observation.
use std::f64::consts::{PI, TAU};

pub fn wrap(angle: f64) -> f64 {
    (angle + PI).rem_euclid(TAU) - PI
}
pub fn difference(from: f64, to: f64) -> f64 {
    wrap(to - from)
}
pub fn interpolate(from: f64, to: f64, fraction: f64) -> f64 {
    if fraction == 0. || from == to {
        from
    } else if fraction == 1. {
        to
    } else {
        wrap(from + fraction * difference(from, to))
    }
}
pub fn mean(a: f64, b: f64) -> f64 {
    let x = a.cos() + b.cos();
    let y = a.sin() + b.sin();
    // Antipodal alleles have no unique circular mean. This explicit convention
    // only affects optional diploid expression, not the default haploid world.
    if x.hypot(y) <= 4. * f64::EPSILON {
        0.
    } else {
        wrap(y.atan2(x))
    }
}
