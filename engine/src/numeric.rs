//! Small numeric primitives. Physical rules have one caller implementation; SIMD only
//! changes how vector arithmetic executes, with the same lane reduction order.

pub fn dot(a: &[f32], b: &[f32]) -> f32 {
    assert_eq!(a.len(), b.len());
    let n = a.len() / 4 * 4;
    let mut lanes = [0.; 4];
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let mut sum = f32x4_splat(0.);
        for i in (0..n).step_by(4) {
            sum = f32x4_add(
                sum,
                f32x4_mul(
                    v128_load(a.as_ptr().add(i).cast()),
                    v128_load(b.as_ptr().add(i).cast()),
                ),
            );
        }
        v128_store(lanes.as_mut_ptr().cast(), sum);
    }
    #[cfg(not(target_arch = "wasm32"))]
    for i in (0..n).step_by(4) {
        for lane in 0..4 {
            lanes[lane] += a[i + lane] * b[i + lane];
        }
    }
    let mut sum = (lanes[0] + lanes[1]) + (lanes[2] + lanes[3]);
    for i in n..a.len() {
        sum += a[i] * b[i];
    }
    sum
}

pub fn exchange(
    a: &[f32; 256],
    b: &[f32; 256],
    out_a: &mut [f32; 256],
    out_b: &mut [f32; 256],
    diffusion: &[f32; 256],
    conductance: f32,
) {
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let k = f32x4_splat(conductance);
        for i in (0..256).step_by(4) {
            let difference = f32x4_sub(
                v128_load(a.as_ptr().add(i).cast()),
                v128_load(b.as_ptr().add(i).cast()),
            );
            let flux = f32x4_mul(
                f32x4_mul(difference, v128_load(diffusion.as_ptr().add(i).cast())),
                k,
            );
            let x = f32x4_sub(v128_load(out_a.as_ptr().add(i).cast()), flux);
            let y = f32x4_add(v128_load(out_b.as_ptr().add(i).cast()), flux);
            v128_store(out_a.as_mut_ptr().add(i).cast(), x);
            v128_store(out_b.as_mut_ptr().add(i).cast(), y);
        }
    }
    #[cfg(not(target_arch = "wasm32"))]
    for i in 0..256 {
        let flux = (a[i] - b[i]) * diffusion[i] * conductance;
        out_a[i] -= flux;
        out_b[i] += flux;
    }
}

pub fn scale(input: &[f32], output: &mut [f32], factor: f32) {
    assert_eq!(input.len(), output.len());
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let f = f32x4_splat(factor);
        let n = input.len() / 4 * 4;
        for i in (0..n).step_by(4) {
            v128_store(
                output.as_mut_ptr().add(i).cast(),
                f32x4_mul(v128_load(input.as_ptr().add(i).cast()), f),
            );
        }
        for i in n..input.len() {
            output[i] = input[i] * factor;
        }
    }
    #[cfg(not(target_arch = "wasm32"))]
    for (a, b) in input.iter().zip(output) {
        *b = *a * factor;
    }
}

pub fn reductions(q: &[f32; 256], properties: &[[f64; 256]; 3]) -> [f64; 4] {
    let mut lanes = [[0.; 2]; 4];
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let mut sums = [f64x2_splat(0.); 4];
        for i in (0..256).step_by(2) {
            let amount = f64x2_promote_low_f32x4(v128_load64_zero(q.as_ptr().add(i).cast()));
            sums[0] = f64x2_add(sums[0], amount);
            for j in 0..3 {
                sums[j + 1] = f64x2_add(
                    sums[j + 1],
                    f64x2_mul(amount, v128_load(properties[j].as_ptr().add(i).cast())),
                );
            }
        }
        for j in 0..4 {
            v128_store(lanes[j].as_mut_ptr().cast(), sums[j]);
        }
    }
    #[cfg(not(target_arch = "wasm32"))]
    for i in 0..256 {
        let amount = q[i] as f64;
        lanes[0][i % 2] += amount;
        for j in 0..3 {
            lanes[j + 1][i % 2] += amount * properties[j][i];
        }
    }
    lanes.map(|v| v[0] + v[1])
}
