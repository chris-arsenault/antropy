//! Vector arithmetic for the selected functional; no alternative physical laws.
//! Log uses exponent/mantissa reduction and a short, bounded log1p remainder.
use std::f64::consts::LN_2;

fn log_table() -> &'static [(f64, f64); 1024] {
    static TABLE: std::sync::OnceLock<[(f64, f64); 1024]> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        std::array::from_fn(|i| {
            let center = 1. + (i as f64 + 0.5) / 1024.;
            (center.ln(), 1. / center)
        })
    })
}

pub fn log_positive(x: f64) -> f64 {
    if x < f64::MIN_POSITIVE {
        return x.ln();
    }
    let bits = x.to_bits();
    let e = ((bits >> 52) & 2047) as i32 - 1023;
    let m = f64::from_bits((bits & ((1_u64 << 52) - 1)) | (1023_u64 << 52));
    let index = ((bits >> 42) & 1023) as usize;
    let center = 1. + (index as f64 + 0.5) / 1024.;
    let (log, inverse) = log_table()[index];
    let r = (m - center) * inverse;
    // |r| <= 1/2048: the omitted r^6/6 term is less than 3e-21.
    let remainder = r * (1. + r * (-0.5 + r * (1. / 3. + r * (-0.25 + r / 5.))));
    (log + remainder) + e as f64 * LN_2
}

#[cfg(target_arch = "wasm32")]
unsafe fn logs(
    value: std::arch::wasm32::v128,
    table: &[(f64, f64); 1024],
) -> std::arch::wasm32::v128 {
    use std::arch::wasm32::*;
    let exponent = i64x2_sub(u64x2_shr(value, 52), i64x2_splat(1023));
    let exponent = i32x4_shuffle::<0, 2, 0, 2>(exponent, exponent);
    let e = f64x2_convert_low_i32x4(exponent);
    let m = v128_or(
        v128_and(value, i64x2_splat((1_i64 << 52) - 1)),
        i64x2_splat(1023_i64 << 52),
    );
    let indices = v128_and(u64x2_shr(value, 42), i64x2_splat(1023));
    let a = u64x2_extract_lane::<0>(indices) as usize;
    let b = u64x2_extract_lane::<1>(indices) as usize;
    let center = f64x2(1. + (a as f64 + 0.5) / 1024., 1. + (b as f64 + 0.5) / 1024.);
    let r = f64x2_mul(f64x2_sub(m, center), f64x2(table[a].1, table[b].1));
    let mut p = f64x2_splat(0.2);
    for c in [-0.25, 1. / 3., -0.5, 1.] {
        p = f64x2_add(f64x2_mul(p, r), f64x2_splat(c));
    }
    f64x2_add(
        f64x2_add(f64x2(table[a].0, table[b].0), f64x2_mul(r, p)),
        f64x2_mul(e, f64x2_splat(LN_2)),
    )
}

/// n, reference energy, ideal free energy, impedance/12, two profiles and stress.
pub fn project<T: Copy + Into<f64>>(
    node: &[T],
    properties: &[[f64; 256]; 5],
    area: f64,
) -> [f64; 7] {
    let mut lanes = [[0.; 2]; 7];
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let table = log_table();
        let mut sums = [f64x2_splat(0.); 7];
        for i in (0..256).step_by(2) {
            let a = node[i].into();
            let b = node[i + 1].into();
            let q = f64x2(a, b);
            let log = if a >= f64::MIN_POSITIVE * area && b >= f64::MIN_POSITIVE * area {
                logs(f64x2_div(q, f64x2_splat(area)), table)
            } else {
                f64x2(
                    if a == 0. { 0. } else { log_positive(a / area) },
                    if b == 0. { 0. } else { log_positive(b / area) },
                )
            };
            sums[0] = f64x2_add(sums[0], q);
            sums[2] = f64x2_add(sums[2], f64x2_mul(q, f64x2_sub(log, f64x2_splat(1.))));
            for (j, output) in [1, 3, 4, 5, 6].into_iter().enumerate() {
                sums[output] = f64x2_add(
                    sums[output],
                    f64x2_mul(q, v128_load(properties[j].as_ptr().add(i).cast())),
                );
            }
        }
        for j in 0..7 {
            v128_store(lanes[j].as_mut_ptr().cast(), sums[j]);
        }
    }
    #[cfg(not(target_arch = "wasm32"))]
    for i in 0..256 {
        let q = node[i].into();
        let lane = i % 2;
        lanes[0][lane] += q;
        lanes[2][lane] += if q == 0. {
            0.
        } else {
            q * (log_positive(q / area) - 1.)
        };
        for (j, output) in [1, 3, 4, 5, 6].into_iter().enumerate() {
            lanes[output][lane] += q * properties[j][i];
        }
    }
    lanes.map(|v| v[0] + v[1])
}

/// Even part of B(v), through v^14; error below 1e-17 for |v|<=0.5 before rounding.
pub fn bernoulli_even(v: f64) -> f64 {
    let z = v * v;
    let mut p = 7. / (6. * 87178291200.);
    for c in [
        -691. / (2730. * 479001600.),
        1. / 47900160.,
        -1. / 1209600.,
        1. / 30240.,
        -1. / 720.,
        1. / 12.,
    ] {
        p = p * z + c;
    }
    1. + z * p
}

/// Runs in the loaded WASM binary too, comparing vector reduction to independent scalar ln.
pub fn audit() -> Result<f64, String> {
    let properties = std::array::from_fn(|j| std::array::from_fn(|s| (s + j + 1) as f64 / 256.));
    let mut maximum = 0_f64;
    for scale in [1e-24, 1e-6, 1., 1e6] {
        let values: [f32; 256] = std::array::from_fn(|s| {
            if s % 7 == 0 {
                0.
            } else {
                (scale * (s + 1) as f64) as f32
            }
        });
        let mut expected = [[0.; 2]; 7];
        for (i, value) in values.iter().enumerate() {
            let n = *value as f64;
            let lane = i % 2;
            expected[0][lane] += n;
            expected[2][lane] += if n == 0. {
                0.
            } else {
                n * ((n / 4.).ln() - 1.)
            };
            for (j, output) in [1, 3, 4, 5, 6].into_iter().enumerate() {
                expected[output][lane] += n * properties[j][i];
            }
        }
        let expected = expected.map(|v| v[0] + v[1]);
        for actual in [
            project(&values, &properties, 4.),
            project(&values.map(f64::from), &properties, 4.),
        ] {
            for (a, b) in actual.into_iter().zip(expected) {
                let error = (a - b).abs() / b.abs().max(f64::MIN_POSITIVE);
                maximum = maximum.max(error);
                if !error.is_finite() || error > 32. * f64::EPSILON {
                    return Err("Spatial SIMD reduction disagrees with scalar reference".into());
                }
            }
        }
    }
    Ok(maximum)
}
