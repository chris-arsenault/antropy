//! Chemical vector projections and geographic redistribution with matching scalar/WASM lanes.
pub fn project_pair(input: &[f64; 256], rows: &[[f64; 256]; 2]) -> [f64; 2] {
    let mut sums = [[0.; 2]; 2];
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let mut values = [f64x2_splat(0.); 2];
        for s in (0..256).step_by(2) {
            let amount = v128_load(input.as_ptr().add(s).cast());
            for k in 0..2 {
                values[k] = f64x2_add(
                    values[k],
                    f64x2_mul(amount, v128_load(rows[k].as_ptr().add(s).cast())),
                );
            }
        }
        for k in 0..2 {
            v128_store(sums[k].as_mut_ptr().cast(), values[k]);
        }
    }
    #[cfg(not(target_arch = "wasm32"))]
    for s in 0..256 {
        for k in 0..2 {
            sums[k][s % 2] += input[s] * rows[k][s];
        }
    }
    sums.map(|v| v[0] + v[1])
}
pub fn add_scaled(input: &[f64; 256], factor: f64, out: &mut [f64; 256]) {
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let factor = f64x2_splat(factor);
        for s in (0..256).step_by(2) {
            let value = f64x2_mul(v128_load(input.as_ptr().add(s).cast()), factor);
            v128_store(
                out.as_mut_ptr().add(s).cast(),
                f64x2_add(v128_load(out.as_ptr().add(s).cast()), value),
            );
        }
    }
    #[cfg(not(target_arch = "wasm32"))]
    for s in 0..256 {
        out[s] += factor * input[s];
    }
}

/// Apply one row of the factored geographic transport matrix to a chemical vector.
pub fn transport(
    center: &[f32],
    neighbors: [&[f32]; 4],
    out: &mut [f32],
    rows: &[[f32; 256]; 3],
    coefficients: [[f32; 3]; 4],
    decay: f32,
) -> bool {
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let zero = f32x4_splat(0.);
        let mut valid = i32x4_splat(-1);
        let k = coefficients.map(|row| row.map(|v| f32x4_splat(v)));
        let decay = f32x4_splat(decay);
        for s in (0..256).step_by(4) {
            let amount = v128_load(center.as_ptr().add(s).cast());
            let basis = rows
                .each_ref()
                .map(|row| v128_load(row.as_ptr().add(s).cast()));
            let mut value = amount;
            for j in 0..4 {
                let bias = f32x4_add(f32x4_mul(k[j][1], basis[1]), f32x4_mul(k[j][2], basis[2]));
                let diffusion = f32x4_mul(k[j][0], basis[0]);
                let outward = f32x4_mul(f32x4_add(diffusion, f32x4_max(bias, zero)), amount);
                let inward = f32x4_mul(
                    f32x4_add(diffusion, f32x4_max(f32x4_neg(bias), zero)),
                    v128_load(neighbors[j].as_ptr().add(s).cast()),
                );
                value = f32x4_add(value, f32x4_sub(inward, outward));
            }
            value = f32x4_mul(value, decay);
            valid = v128_and(
                valid,
                v128_and(
                    f32x4_ge(value, zero),
                    f32x4_le(value, f32x4_splat(f32::MAX)),
                ),
            );
            v128_store(out.as_mut_ptr().add(s).cast(), value);
        }
        i32x4_all_true(valid)
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        let mut valid = true;
        for s in 0..256 {
            let mut value = center[s];
            for j in 0..4 {
                let k = coefficients[j];
                let bias = k[1] * rows[1][s] + k[2] * rows[2][s];
                let diffusion = k[0] * rows[0][s];
                value += (diffusion + (-bias).max(0.)) * neighbors[j][s]
                    - (diffusion + bias.max(0.)) * center[s];
            }
            out[s] = value * decay;
            valid &= out[s].is_finite() && out[s] >= 0.;
        }
        valid
    }
}
pub fn audit() -> f64 {
    let a: [f32; 256] = std::array::from_fn(|s| 0.01 * (1 + s) as f32);
    let neighbors: [[f32; 256]; 4] =
        std::array::from_fn(|j| std::array::from_fn(|s| a[255 - s] * (j + 1) as f32 * 0.1));
    let rows = std::array::from_fn(|k| {
        std::array::from_fn(|s| {
            if k == 0 {
                0.005 + s as f32 / 512.
            } else {
                (s as f32 - 128.) / 128.
            }
        })
    });
    let coefficients = [[0.05, 0.006, -0.014]; 4];
    let mut out = [0.; 256];
    assert!(transport(
        &a,
        neighbors.each_ref().map(|n| n.as_slice()),
        &mut out,
        &rows,
        coefficients,
        1.
    ));
    (0..256)
        .map(|s| {
            let mut expected = a[s] as f64;
            for (j, k) in coefficients.iter().enumerate() {
                let bias = k[1] as f64 * rows[1][s] as f64 + k[2] as f64 * rows[2][s] as f64;
                let d = k[0] as f64 * rows[0][s] as f64;
                expected += (d + (-bias).max(0.)) * neighbors[j][s] as f64
                    - (d + bias.max(0.)) * a[s] as f64;
            }
            (out[s] as f64 - expected).abs()
                / (a[s] as f64 + neighbors.iter().map(|n| n[s] as f64).sum::<f64>())
        })
        .fold(0., f64::max)
}
