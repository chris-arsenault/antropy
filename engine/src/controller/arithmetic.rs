//! Contiguous neural contractions. Private state and the ordinary recurrence clock are retained.
use crate::numeric::dot;

#[cfg(target_arch = "wasm32")]
#[inline]
unsafe fn sum(v: std::arch::wasm32::v128) -> f32 {
    use std::arch::wasm32::*;
    f32x4_extract_lane::<0>(v)
        + f32x4_extract_lane::<1>(v)
        + f32x4_extract_lane::<2>(v)
        + f32x4_extract_lane::<3>(v)
}

pub(super) fn project(weights: &[f32], input: &[f32], bias: &[f32], output: &mut [f32]) {
    debug_assert_eq!(weights.len(), output.len() * input.len());
    debug_assert_eq!(bias.len(), output.len());
    let width = input.len();
    #[cfg(target_arch = "wasm32")]
    let first = unsafe {
        use std::arch::wasm32::*;
        let mut first = 0;
        while first + 4 <= output.len() {
            let mut accumulators = [f32x4_splat(0.); 4];
            let aligned = width / 4 * 4;
            for j in (0..aligned).step_by(4) {
                let x = v128_load(input.as_ptr().add(j).cast());
                for (row, accumulator) in accumulators.iter_mut().enumerate() {
                    let w = v128_load(weights.as_ptr().add((first + row) * width + j).cast());
                    *accumulator = f32x4_add(*accumulator, f32x4_mul(w, x));
                }
            }
            for (row, accumulator) in accumulators.into_iter().enumerate() {
                let mut value = sum(accumulator);
                for j in aligned..width {
                    value += weights[(first + row) * width + j] * input[j];
                }
                output[first + row] = value + bias[first + row];
            }
            first += 4;
        }
        first
    };
    #[cfg(not(target_arch = "wasm32"))]
    let first = 0;
    // The final two output rows and native execution use the same fixed-lane reduction.
    for row in first..output.len() {
        output[row] = dot(&weights[row * width..(row + 1) * width], input) + bias[row];
    }
}

pub(super) fn recurrent(weights: &[f32], traces: &[f32], hidden: &[f32], alpha: f32) -> f32 {
    if alpha == 0. {
        return dot(weights, hidden);
    }
    debug_assert_eq!(weights.len(), hidden.len());
    debug_assert_eq!(traces.len(), hidden.len());
    debug_assert_eq!(hidden.len() % 4, 0);
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let gain = f32x4_splat(alpha);
        let mut total = f32x4_splat(0.);
        for i in (0..hidden.len()).step_by(4) {
            let w = v128_load(weights.as_ptr().add(i).cast());
            let h = v128_load(traces.as_ptr().add(i).cast());
            let x = v128_load(hidden.as_ptr().add(i).cast());
            total = f32x4_add(total, f32x4_mul(f32x4_add(w, f32x4_mul(gain, h)), x));
        }
        sum(total)
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        let mut lanes = [0.; 4];
        for i in (0..hidden.len()).step_by(4) {
            for (lane, sum) in lanes.iter_mut().enumerate() {
                let j = i + lane;
                *sum += (weights[j] + alpha * traces[j]) * hidden[j];
            }
        }
        lanes.into_iter().sum()
    }
}

pub(super) fn trace_row(trace: &mut [f32], hidden: &[f32], decay: f32, gain: f32, offset: f32) {
    debug_assert_eq!(trace.len(), hidden.len());
    debug_assert_eq!(trace.len() % 4, 0);
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let decay = f32x4_splat(decay);
        let gain = f32x4_splat(gain);
        let offset = f32x4_splat(offset);
        for i in (0..trace.len()).step_by(4) {
            let h = v128_load(trace.as_ptr().add(i).cast());
            let x = v128_load(hidden.as_ptr().add(i).cast());
            let value = f32x4_add(f32x4_add(f32x4_mul(decay, h), f32x4_mul(gain, x)), offset);
            let bounded = f32x4_min(f32x4_splat(1.), f32x4_max(f32x4_splat(-1.), value));
            v128_store(trace.as_mut_ptr().add(i).cast(), bounded);
        }
    }
    #[cfg(not(target_arch = "wasm32"))]
    for (h, x) in trace.iter_mut().zip(hidden) {
        *h = (decay * *h + gain * x + offset).clamp(-1., 1.);
    }
}

#[cfg(test)]
#[path = "arithmetic_tests.rs"]
mod tests;
