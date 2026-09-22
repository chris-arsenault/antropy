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
#[cfg(test)]
pub fn mixture(field: &crate::field::Field, sites: &[(usize, f64)]) -> [f32; 256] {
    mixture_masked(field, sites, u64::MAX)
}

/// Gather requested four-species groups from the same finite geographic footprint.
pub fn mixture_masked(
    field: &crate::field::Field,
    sites: &[(usize, f64)],
    requested: u64,
) -> [f32; 256] {
    if requested == 0 {
        return [0.; 256];
    }
    let amounts = &field.amounts();
    let area = field.spacing.powi(2);
    let mut result = [0.; 256];
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        for &(node, weight) in sites {
            let mut mask = field.active_groups(node) & requested;
            if mask == 0 {
                continue;
            }
            let row = amounts.row(node);
            let gain = f32x4_splat((weight / area) as f32);
            while mask != 0 {
                let s = mask.trailing_zeros() as usize * 4;
                mask &= mask - 1;
                let previous = v128_load(result.as_ptr().add(s).cast());
                let q = v128_load(row.as_ptr().add(s).cast());
                v128_store(
                    result.as_mut_ptr().add(s).cast(),
                    f32x4_add(previous, f32x4_mul(q, gain)),
                );
            }
        }
    }
    #[cfg(not(target_arch = "wasm32"))]
    for &(node, weight) in sites {
        let mut mask = field.active_groups(node) & requested;
        if mask == 0 {
            continue;
        }
        let row = amounts.row(node);
        let gain = (weight / area) as f32;
        while mask != 0 {
            let start = mask.trailing_zeros() as usize * 4;
            mask &= mask - 1;
            for s in start..start + 4 {
                result[s] += row[s] * gain;
            }
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{chemistry::Chemistry, field::Field};

    #[test]
    fn requested_groups_preserve_gather_and_leave_other_species_zero() {
        let chemistry = Chemistry::new(101).unwrap();
        let mut field = Field::new(8., 8., 2.);
        for (node, species, amount) in [
            (0, 0, 8.),
            (3, 3, 4.),
            (12, 4, 32.),
            (15, 127, 16.),
            (0, 252, 12.),
            (15, 255, 20.),
        ] {
            field.add(node, species, amount, &chemistry);
        }
        let sites = field.stencil(0., 0.);
        let before = field.amounts().clone();
        let mut expected = [0.; 256];
        for &(node, weight) in &sites {
            let gain = (weight / field.spacing.powi(2)) as f32;
            for (species, value) in expected.iter_mut().enumerate() {
                *value += field.amounts()[node * 256 + species] * gain;
            }
        }
        assert_eq!(mixture(&field, &sites), expected);
        let requested = 1 | (1 << 8) | (1 << 31) | (1 << 63);
        let actual = mixture_masked(&field, &sites, requested);
        for (species, value) in expected.iter_mut().enumerate() {
            if requested & (1 << (species / 4)) == 0 {
                *value = 0.;
            }
        }
        assert_eq!(actual, expected);
        assert_eq!(mixture_masked(&field, &sites, 0), [0.; 256]);
        assert_eq!(field.amounts(), &before);
    }
}
