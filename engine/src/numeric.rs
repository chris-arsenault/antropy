//! Fixed four-lane arithmetic shared by native and WASM execution.
pub fn dot(a: &[f32], b: &[f32]) -> f32 {
    debug_assert_eq!(a.len(), b.len());
    let n = a.len() / 4 * 4;
    #[cfg(target_arch = "wasm32")]
    let lanes = unsafe {
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
        [
            f32x4_extract_lane::<0>(sum),
            f32x4_extract_lane::<1>(sum),
            f32x4_extract_lane::<2>(sum),
            f32x4_extract_lane::<3>(sum),
        ]
    };
    #[cfg(not(target_arch = "wasm32"))]
    let lanes = {
        let mut sum = [0.; 4];
        for i in (0..n).step_by(4) {
            for k in 0..4 {
                sum[k] += a[i + k] * b[i + k];
            }
        }
        sum
    };
    let mut total = lanes.into_iter().sum::<f32>();
    for i in n..a.len() {
        total += a[i] * b[i];
    }
    total
}
pub fn mixture(field: &crate::field::Field, sites: &[(usize, f64)]) -> [f32; 256] {
    let amounts = &field.amounts;
    let area = field.spacing.powi(2);
    let mut result = [0.; 256];
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        for &(node, weight) in sites {
            let gain = f32x4_splat((weight / area) as f32);
            let mut mask = field.active_groups(node);
            while mask != 0 {
                let s = mask.trailing_zeros() as usize * 4;
                mask &= mask - 1;
                let previous = v128_load(result.as_ptr().add(s).cast());
                let q = v128_load(amounts.as_ptr().add(node * 256 + s).cast());
                v128_store(
                    result.as_mut_ptr().add(s).cast(),
                    f32x4_add(previous, f32x4_mul(q, gain)),
                );
            }
        }
    }
    #[cfg(not(target_arch = "wasm32"))]
    for &(node, weight) in sites {
        let gain = (weight / area) as f32;
        let mut mask = field.active_groups(node);
        while mask != 0 {
            let start = mask.trailing_zeros() as usize * 4;
            mask &= mask - 1;
            for s in start..start + 4 {
                result[s] += amounts[node * 256 + s] * gain;
            }
        }
    }
    result
}
