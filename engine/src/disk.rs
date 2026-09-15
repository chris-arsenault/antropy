//! Integrate the normalized soft disk against the periodic bilinear grid basis.
//! The same weights and their derivatives drive deposition, response and self subtraction.
use crate::field::Field;
use std::f64::consts::PI;

#[derive(Clone, Copy, Debug)]
pub struct Weight {
    pub node: usize,
    pub value: f64,
    pub dx: f64,
    pub dy: f64,
    pub dr: f64,
}

const GAUSS: [(f64, f64); 6] = [
    (0.1252334085114689, 0.2491470458134028),
    (0.3678314989981802, 0.2334925365383548),
    (0.5873179542866175, 0.2031674267230659),
    (0.7699026741943047, 0.1600783285433462),
    (0.9041172563704749, 0.1069393259953184),
    (0.9815606342467192, 0.0471753363865118),
];

fn hat(x: f64, h: f64) -> f64 {
    (1. - x.abs() / h).max(0.)
}

fn y_integral(x: f64, center: [f64; 2], h: f64, r: f64) -> [f64; 4] {
    let edge = (r * r - x * x).max(0.).sqrt();
    let mut result = [0.; 4];
    for segment in [-1., 0.] {
        let low = (-edge).max(center[1] + segment * h);
        let high = edge.min(center[1] + (segment + 1.) * h);
        if high <= low {
            continue;
        }
        for (abscissa, weight) in [
            (0., 8. / 9.),
            (-(3_f64 / 5.).sqrt(), 5. / 9.),
            ((3_f64 / 5.).sqrt(), 5. / 9.),
        ] {
            let y = (low + high) / 2. + abscissa * (high - low) / 2.;
            let t = (1. - (x * x + y * y) / (r * r)).max(0.);
            let factor =
                weight * (high - low) / 2. * hat(x - center[0], h) * hat(y - center[1], h) * 3.
                    / (PI * r * r);
            result[0] += factor * t * t;
            result[1] += factor * 4. * x * t / (r * r);
            result[2] += factor * 4. * y * t / (r * r);
            result[3] += factor * (4. * t - 6. * t * t) / r;
        }
    }
    result
}

fn integrated(center: [f64; 2], h: f64, r: f64) -> [f64; 4] {
    let low = (-r).max(center[0] - h);
    let high = r.min(center[0] + h);
    if low >= high {
        return [0.; 4];
    }
    // Split at both basis knots and circle/rectangle intersections. Inner integration is
    // polynomial-exact; outer Gaussian quadrature resolves the remaining smooth arcs.
    let mut breaks = vec![low, high];
    if center[0] > low && center[0] < high {
        breaks.push(center[0]);
    }
    for y in [center[1] - h, center[1], center[1] + h] {
        if y.abs() < r {
            let x = (r * r - y * y).sqrt();
            for point in [-x, x] {
                if point > low && point < high {
                    breaks.push(point);
                }
            }
        }
    }
    breaks.sort_by(f64::total_cmp);
    let mut result = [0.; 4];
    for pair in breaks.windows(2) {
        let (low, high) = (
            (pair[0] / r).clamp(-1., 1.).asin(),
            (pair[1] / r).clamp(-1., 1.).asin(),
        );
        let half = (high - low) / 2.;
        for (a, w) in GAUSS {
            for sign in [-1., 1.] {
                let angle = (low + high) / 2. + sign * a * half;
                let x = r * angle.sin();
                let value = y_integral(x, center, h, r);
                for k in 0..4 {
                    result[k] += w * half * r * angle.cos() * value[k];
                }
            }
        }
    }
    result
}

pub fn weights(field: &Field, x: f64, y: f64, r: f64) -> Vec<Weight> {
    assert!(r > 0. && r.is_finite());
    let h = field.spacing;
    let (gx, gy) = (x / h - 0.5, y / h - 0.5);
    let (fx, fy) = (gx - gx.floor(), gy - gy.floor());
    if r < h * fx.min(1. - fx).min(fy).min(1. - fy) {
        // A whole disk inside one bilinear piece has exactly its center's mean value.
        return field
            .stencil(x, y)
            .into_iter()
            .enumerate()
            .map(|(i, (node, value))| {
                let sx = if i % 2 == 0 { -1. } else { 1. };
                let sy = if i < 2 { -1. } else { 1. };
                Weight {
                    node,
                    value,
                    dx: sx * if i < 2 { 1. - fy } else { fy } / h,
                    dy: sy * if i % 2 == 0 { 1. - fx } else { fx } / h,
                    dr: 0.,
                }
            })
            .collect();
    }
    let mut result: Vec<Weight> = vec![];
    for iy in (gy - r / h - 1.).ceil() as isize..=(gy + r / h + 1.).floor() as isize {
        for ix in (gx - r / h - 1.).ceil() as isize..=(gx + r / h + 1.).floor() as isize {
            let center = [(ix as f64 + 0.5) * h - x, (iy as f64 + 0.5) * h - y];
            let v = integrated(center, h, r);
            if v[0] == 0. {
                continue;
            }
            let node = iy.rem_euclid(field.ny as isize) as usize * field.nx
                + ix.rem_euclid(field.nx as isize) as usize;
            if let Some(w) = result.iter_mut().find(|w| w.node == node) {
                w.value += v[0];
                w.dx += v[1];
                w.dy += v[2];
                w.dr += v[3];
            } else {
                result.push(Weight {
                    node,
                    value: v[0],
                    dx: v[1],
                    dy: v[2],
                    dr: v[3],
                });
            }
        }
    }
    let sums = result.iter().fold([0.; 4], |mut a, w| {
        for (i, v) in [w.value, w.dx, w.dy, w.dr].into_iter().enumerate() {
            a[i] += v;
        }
        a
    });
    for w in &mut result {
        w.value /= sums[0];
        w.dx = (w.dx - w.value * sums[1]) / sums[0];
        w.dy = (w.dy - w.value * sums[2]) / sums[0];
        w.dr = (w.dr - w.value * sums[3]) / sums[0];
    }
    result
}
