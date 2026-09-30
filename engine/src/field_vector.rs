//! The species loop contains only vector arithmetic; face bounds were computed on shared signals.
pub struct Work {
    pub mask: u64,
    pub floor: f32,
    /// Per face: [mobility toward the neighbor, mobility from the neighbor]. Each face uses
    /// the mobility of its net exchange direction, so uphill net exchange is slowed while level
    /// or downhill exchange keeps the substrate rate. Choosing by donor instead would give a
    /// per-face drift whose strength grows as the mesh is refined. Both nodes of a face see
    /// opposite nets and therefore choose the same mobility, so commits stay antisymmetric.
    pub geography: [[f32; 2]; 4],
}

pub fn redistribute(
    center: &[f32],
    adjacent: [&[f32]; 4],
    out: &mut [f32],
    rows: &[[f32; 256]; 4],
    coefficients: [[f32; 4]; 4],
    decay: f32,
    Work {
        mut mask,
        floor,
        geography,
    }: Work,
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
                let chemical_drift = f32x4_add(
                    f32x4_mul(prop[1], c[face][1]),
                    f32x4_mul(prop[2], c[face][2]),
                );
                let drift = f32x4_add(chemical_drift, f32x4_mul(prop[3], c[face][3]));
                // Face construction bounds drift to finite values. Masking gives max(0,d)
                // with canonical positive zero, without general NaN-aware SIMD max work.
                let forward = v128_and(drift, f32x4_gt(drift, zero));
                let reverse = f32x4_neg(drift);
                let backward = v128_and(reverse, f32x4_gt(reverse, zero));
                let leaving = f32x4_add(diffusion, forward);
                let arriving = f32x4_mul(
                    v128_load(adjacent[face].as_ptr().add(s).cast()),
                    f32x4_add(diffusion, backward),
                );
                let away = f32x4_gt(f32x4_mul(amount, leaving), arriving);
                let mobility = v128_bitselect(
                    f32x4_splat(geography[face][0]),
                    f32x4_splat(geography[face][1]),
                    away,
                );
                outgoing = f32x4_add(outgoing, f32x4_mul(leaving, mobility));
                incoming = f32x4_add(incoming, f32x4_mul(arriving, mobility));
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
                let drift = rows[1][s] * c[1] + rows[2][s] * c[2] + rows[3][s] * c[3];
                let leaving = diffusion + drift.max(0.);
                let arriving = adjacent[face][s] * (diffusion + (-drift).max(0.));
                let mobility = if center[s] * leaving > arriving {
                    geography[face][0]
                } else {
                    geography[face][1]
                };
                outgoing += leaving * mobility;
                incoming += arriving * mobility;
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
