//! Evaluate exact proposals and their f32 representation with one canonical logarithm.
use crate::field_reductions::Node;

/// The ideal entropy difference uses a local series only within f32 rounding distance.
fn entropy_delta(exact: f64, stored: f64, log: f64, area: f64) -> f64 {
    let d = exact - stored;
    if stored > 0. && (d / stored).abs() <= 1e-6 {
        let r = d / stored;
        // d log(stored/A) + stored[(1+r)log(1+r)-r]. Omitted term < stored*1e-31.
        d * (log + r * (0.5 + r * (-1. / 6. + r / 12.)))
    } else {
        let ideal = |n: f64| {
            if n == 0. {
                0.
            } else {
                n * (crate::spatial_numeric::log_positive(n / area) - 1.)
            }
        };
        ideal(exact) - ideal(stored)
    }
}

pub fn project(node: &[f64], properties: &[[f64; 256]; 5], area: f64) -> (Node, Node, f64) {
    let mut stored = [[0.; 2]; 7];
    let mut delta = [[0.; 2]; 7];
    for i in 0..256 {
        let q = (node[i] as f32) as f64;
        let d = node[i] - q;
        let log = if q == 0. {
            0.
        } else {
            crate::spatial_numeric::log_positive(q / area)
        };
        let lane = i % 2;
        stored[0][lane] += q;
        stored[2][lane] += q * (log - 1.);
        delta[0][lane] += d;
        delta[2][lane] += entropy_delta(node[i], q, log, area);
        for (j, output) in [1, 3, 4, 5, 6].into_iter().enumerate() {
            stored[output][lane] += q * properties[j][i];
            delta[output][lane] += d * properties[j][i];
        }
    }
    let stored = stored.map(|v| v[0] + v[1]);
    let delta = delta.map(|v| v[0] + v[1]);
    (
        std::array::from_fn(|j| stored[j] + delta[j]),
        stored,
        delta[0],
    )
}
