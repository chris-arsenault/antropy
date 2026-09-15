//! SIMD execution of the same exponentially fitted conservative face operation.
pub fn face(
    a: &[f32; 256],
    b: &[f32; 256],
    out_a: &mut [f64; 256],
    out_b: &mut [f64; 256],
    properties: &[[f64; 256]; 3],
    drift: [f64; 3],
    scale: [f64; 2],
) -> f64 {
    let mut largest = 0_f64;
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let mut maximum = f64x2_splat(0.);
        for i in (0..256).step_by(2) {
            let v = f64x2_add(
                f64x2_add(
                    f64x2_mul(
                        v128_load(properties[0].as_ptr().add(i).cast()),
                        f64x2_splat(drift[0]),
                    ),
                    f64x2_mul(
                        v128_load(properties[1].as_ptr().add(i).cast()),
                        f64x2_splat(drift[1]),
                    ),
                ),
                f64x2_splat(drift[2]),
            );
            if v128_any_true(f64x2_gt(f64x2_abs(v), f64x2_splat(0.5))) {
                for j in i..i + 2 {
                    largest = largest.max(scalar(j, a, b, out_a, out_b, properties, drift, scale));
                }
                continue;
            }
            let z = f64x2_mul(v, v);
            let mut p = f64x2_splat(7. / (6. * 87178291200.));
            for coefficient in [
                -691. / (2730. * 479001600.),
                1. / 47900160.,
                -1. / 1209600.,
                1. / 30240.,
                -1. / 720.,
                1. / 12.,
            ] {
                p = f64x2_add(f64x2_mul(p, z), f64x2_splat(coefficient));
            }
            let even = f64x2_add(f64x2_splat(1.), f64x2_mul(z, p));
            let half = f64x2_mul(v, f64x2_splat(0.5));
            let k = f64x2_mul(
                v128_load(properties[2].as_ptr().add(i).cast()),
                f64x2_splat(scale[0]),
            );
            let forward = f64x2_mul(k, f64x2_sub(even, half));
            let backward = f64x2_mul(k, f64x2_add(even, half));
            maximum = f64x2_max(maximum, f64x2_max(forward, backward));
            let qa = f64x2_promote_low_f32x4(v128_load64_zero(a.as_ptr().add(i).cast()));
            let qb = f64x2_promote_low_f32x4(v128_load64_zero(b.as_ptr().add(i).cast()));
            let flux = f64x2_mul(
                f64x2_splat(scale[1]),
                f64x2_sub(f64x2_mul(forward, qa), f64x2_mul(backward, qb)),
            );
            v128_store(
                out_a.as_mut_ptr().add(i).cast(),
                f64x2_sub(v128_load(out_a.as_ptr().add(i).cast()), flux),
            );
            v128_store(
                out_b.as_mut_ptr().add(i).cast(),
                f64x2_add(v128_load(out_b.as_ptr().add(i).cast()), flux),
            );
        }
        largest = largest
            .max(f64x2_extract_lane::<0>(maximum))
            .max(f64x2_extract_lane::<1>(maximum));
    }
    #[cfg(not(target_arch = "wasm32"))]
    for i in 0..256 {
        largest = largest.max(scalar(i, a, b, out_a, out_b, properties, drift, scale));
    }
    largest
}

#[allow(clippy::too_many_arguments)]
fn scalar(
    i: usize,
    a: &[f32; 256],
    b: &[f32; 256],
    out_a: &mut [f64; 256],
    out_b: &mut [f64; 256],
    properties: &[[f64; 256]; 3],
    drift: [f64; 3],
    scale: [f64; 2],
) -> f64 {
    let v = properties[0][i] * drift[0] + properties[1][i] * drift[1] + drift[2];
    let k = properties[2][i] * scale[0];
    let (forward, backward) = if v.abs() <= 0.5 {
        let even = crate::spatial_numeric::bernoulli_even(v);
        (k * (even - v / 2.), k * (even + v / 2.))
    } else {
        (
            k * crate::spatial_step::bernoulli(v),
            k * crate::spatial_step::bernoulli(-v),
        )
    };
    let flux = scale[1] * (forward * a[i] as f64 - backward * b[i] as f64);
    out_a[i] -= flux;
    out_b[i] += flux;
    forward.max(backward)
}
