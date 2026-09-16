//! The species loop contains only vector arithmetic; face bounds were computed on shared signals.
pub struct Work {
    pub mask: u64,
    pub floor: f32,
}

pub fn redistribute(
    center: &[f32],
    adjacent: [&[f32]; 4],
    out: &mut [f32],
    rows: &[[f32; 256]; 3],
    coefficients: [[f32; 3]; 4],
    decay: f32,
    Work { mut mask, floor }: Work,
) -> u64 {
    let mut active = 0;
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        let c = coefficients.map(|r| r.map(|v| f32x4_splat(v)));
        let zero = f32x4_splat(0.);
        while mask != 0 {
            let group = mask.trailing_zeros();
            mask &= mask - 1;
            let s = group as usize * 4;
            let amount = v128_load(center.as_ptr().add(s).cast());
            let prop = rows.each_ref().map(|r| v128_load(r.as_ptr().add(s).cast()));
            let mut incoming = zero;
            let mut outgoing = zero;
            for face in 0..4 {
                let diffusion = f32x4_mul(prop[0], c[face][0]);
                let drift = f32x4_add(
                    f32x4_mul(prop[1], c[face][1]),
                    f32x4_mul(prop[2], c[face][2]),
                );
                outgoing = f32x4_add(outgoing, f32x4_add(diffusion, f32x4_max(zero, drift)));
                incoming = f32x4_add(
                    incoming,
                    f32x4_mul(
                        v128_load(adjacent[face].as_ptr().add(s).cast()),
                        f32x4_add(diffusion, f32x4_max(zero, f32x4_neg(drift))),
                    ),
                );
            }
            let next = f32x4_mul(
                f32x4_add(
                    f32x4_mul(amount, f32x4_sub(f32x4_splat(1.), outgoing)),
                    incoming,
                ),
                f32x4_splat(decay),
            );
            let next = v128_and(next, f32x4_ge(next, f32x4_splat(floor)));
            if v128_any_true(next) {
                active |= 1 << group;
            }
            v128_store(out.as_mut_ptr().add(s).cast(), next);
        }
    }
    #[cfg(not(target_arch = "wasm32"))]
    while mask != 0 {
        let group = mask.trailing_zeros();
        mask &= mask - 1;
        for s in group as usize * 4..group as usize * 4 + 4 {
            let mut incoming = 0.;
            let mut outgoing = 0.;
            for face in 0..4 {
                let c = coefficients[face];
                let diffusion = rows[0][s] * c[0];
                let drift = rows[1][s] * c[1] + rows[2][s] * c[2];
                outgoing += diffusion + drift.max(0.);
                incoming += adjacent[face][s] * (diffusion + (-drift).max(0.));
            }
            out[s] = (center[s] * (1. - outgoing) + incoming) * decay;
            if out[s] < floor {
                out[s] = 0.;
            }
            if out[s] > 0. {
                active |= 1 << group;
            }
        }
    }
    active
}
