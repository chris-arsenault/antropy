//! Shared property rows for material projection and rounded field commits.
use crate::chemistry::{Chemistry, SPECIES};

pub struct Rows([[f64; SPECIES]; 5]);

impl Rows {
    pub fn new(chemistry: &Chemistry) -> Self {
        Self(std::array::from_fn(|k| {
            std::array::from_fn(|s| {
                let p = &chemistry.properties[s];
                [
                    p.potential,
                    p.impedance,
                    p.stress,
                    p.interaction[0],
                    p.interaction[1],
                ][k]
            })
        }))
    }
}

#[cfg(target_arch = "wasm32")]
pub(crate) mod lanes {
    use std::arch::wasm32::*;
    pub type Pair = v128;
    pub fn zero() -> Pair {
        f64x2_splat(0.)
    }
    pub fn splat(a: f64) -> Pair {
        f64x2_splat(a)
    }
    pub fn nonzero(a: Pair) -> Pair {
        v128_bitselect(splat(1.), a, f64x2_eq(a, zero()))
    }
    pub fn div(a: Pair, b: Pair) -> Pair {
        f64x2_div(a, b)
    }
    pub fn min(a: Pair, b: Pair) -> Pair {
        f64x2_min(a, b)
    }
    pub fn nonnegative(a: Pair) -> Pair {
        v128_bitselect(splat(1.), zero(), f64x2_ge(a, zero()))
    }
    pub fn store(a: &mut [f64], value: Pair) {
        assert!(a.len() >= 2);
        unsafe {
            v128_store(a.as_mut_ptr().cast(), value);
        }
    }
    pub fn add(a: Pair, b: Pair) -> Pair {
        f64x2_add(a, b)
    }
    pub fn sub(a: Pair, b: Pair) -> Pair {
        f64x2_sub(a, b)
    }
    pub fn mul(a: Pair, b: Pair) -> Pair {
        f64x2_mul(a, b)
    }
    pub fn positive(a: Pair) -> Pair {
        f64x2_max(a, zero())
    }
    pub fn load(a: &[f64]) -> Pair {
        assert!(a.len() >= 2);
        unsafe { v128_load(a.as_ptr().cast()) }
    }
    pub fn load_material(a: &[f32]) -> Pair {
        assert!(a.len() >= 2);
        unsafe { f64x2_promote_low_f32x4(v128_load64_zero(a.as_ptr().cast())) }
    }
    pub fn store_material(a: &mut [f32], value: Pair) -> Pair {
        assert!(a.len() >= 2);
        let rounded = f32x4_demote_f64x2_zero(value);
        unsafe {
            v128_store64_lane::<0>(rounded, a.as_mut_ptr().cast());
        }
        f64x2_promote_low_f32x4(rounded)
    }
    pub fn total(a: Pair) -> f64 {
        f64x2_extract_lane::<0>(a) + f64x2_extract_lane::<1>(a)
    }
}

#[cfg(not(target_arch = "wasm32"))]
pub(crate) mod lanes {
    pub type Pair = [f64; 2];
    pub fn zero() -> Pair {
        [0.; 2]
    }
    pub fn splat(a: f64) -> Pair {
        [a; 2]
    }
    pub fn nonzero(a: Pair) -> Pair {
        a.map(|x| if x == 0. { 1. } else { x })
    }
    pub fn div(a: Pair, b: Pair) -> Pair {
        [a[0] / b[0], a[1] / b[1]]
    }
    pub fn min(a: Pair, b: Pair) -> Pair {
        [a[0].min(b[0]), a[1].min(b[1])]
    }
    pub fn nonnegative(a: Pair) -> Pair {
        a.map(|v| if v >= 0. { 1. } else { 0. })
    }
    pub fn store(a: &mut [f64], value: Pair) {
        a[..2].copy_from_slice(&value);
    }
    pub fn add(a: Pair, b: Pair) -> Pair {
        [a[0] + b[0], a[1] + b[1]]
    }
    pub fn sub(a: Pair, b: Pair) -> Pair {
        [a[0] - b[0], a[1] - b[1]]
    }
    pub fn mul(a: Pair, b: Pair) -> Pair {
        [a[0] * b[0], a[1] * b[1]]
    }
    pub fn positive(a: Pair) -> Pair {
        [a[0].max(0.), a[1].max(0.)]
    }
    pub fn load(a: &[f64]) -> Pair {
        [a[0], a[1]]
    }
    pub fn load_material(a: &[f32]) -> Pair {
        [a[0] as f64, a[1] as f64]
    }
    pub fn store_material(a: &mut [f32], value: Pair) -> Pair {
        a[0] = value[0] as f32;
        a[1] = value[1] as f32;
        load_material(a)
    }
    pub fn total(a: Pair) -> f64 {
        a[0] + a[1]
    }
}

fn accumulate(values: &mut [lanes::Pair; 6], amount: lanes::Pair, rows: &Rows, s: usize) {
    values[0] = lanes::add(values[0], amount);
    for k in 0..5 {
        values[k + 1] = lanes::add(
            values[k + 1],
            lanes::mul(amount, lanes::load(&rows.0[k][s..])),
        );
    }
}

pub fn project(material: &[f32], rows: &Rows) -> [f64; 6] {
    project_active(material, rows, u64::MAX)
}

/// Account physical washout separately from rounded commits and numerical culling.
pub fn decay(
    material: &mut [f32],
    rows: &Rows,
    mask: u64,
    retained: f64,
    floor: f32,
) -> (u64, [f64; 2]) {
    let mut loss = [lanes::zero(); 2];
    let mut active = 0;
    for s in crate::field_activity::pairs(mask) {
        let before = lanes::load_material(&material[s..]);
        let removed = lanes::mul(before, lanes::splat(1. - retained));
        loss[0] = lanes::add(loss[0], removed);
        loss[1] = lanes::add(loss[1], lanes::mul(removed, lanes::load(&rows.0[0][s..])));
        lanes::store_material(
            &mut material[s..],
            lanes::mul(before, lanes::splat(retained)),
        );
        for (i, q) in material[s..s + 2].iter_mut().enumerate() {
            if *q < floor {
                *q = 0.;
            } else if *q > 0. {
                active |= 1 << ((s + i) / 4);
            }
        }
    }
    (active, loss.map(lanes::total))
}

pub fn project_active(material: &[f32], rows: &Rows, mut mask: u64) -> [f64; 6] {
    assert_eq!(material.len(), SPECIES);
    let mut values = [lanes::zero(); 6];
    while mask != 0 {
        let s = mask.trailing_zeros() as usize * 4;
        mask &= mask - 1;
        accumulate(&mut values, lanes::load_material(&material[s..]), rows, s);
        accumulate(
            &mut values,
            lanes::load_material(&material[s + 2..]),
            rows,
            s + 2,
        );
    }
    values.map(lanes::total)
}

pub fn commit(
    material: &mut [f32],
    changes: &mut [f64],
    rows: &Rows,
    mask: u64,
) -> ([f64; 6], [f64; 2]) {
    assert_eq!(material.len(), SPECIES);
    assert_eq!(changes.len(), SPECIES);
    let mut values = [lanes::zero(); 6];
    let mut rounding = [lanes::zero(); 2];
    for s in crate::field_activity::pairs(mask) {
        let before = lanes::load_material(&material[s..]);
        let requested = lanes::load(&changes[s..]);
        let after = lanes::store_material(
            &mut material[s..],
            lanes::positive(lanes::add(before, requested)),
        );
        let actual = lanes::sub(after, before);
        let loss = lanes::sub(requested, actual);
        rounding[0] = lanes::add(rounding[0], loss);
        rounding[1] = lanes::add(rounding[1], lanes::mul(loss, lanes::load(&rows.0[0][s..])));
        accumulate(&mut values, actual, rows, s);
    }
    changes.fill(0.);
    (values.map(lanes::total), rounding.map(lanes::total))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dense_projection_and_rounded_commit_close_each_account() {
        let chemistry = Chemistry::new(101).unwrap();
        let rows = Rows::new(&chemistry);
        let mut material: [f32; SPECIES] = std::array::from_fn(|s| (s as f32 + 0.3) / 11.);
        let mut changes: [f64; SPECIES] = std::array::from_fn(|s| {
            if s % 3 == 0 {
                -2. * material[s] as f64
            } else {
                0.123456789 / (s + 1) as f64
            }
        });
        let before = material;
        let requested = changes;
        let scalar = |amounts: &[f32]| {
            let mut values = [0.; 6];
            for (s, p) in chemistry.properties.iter().enumerate() {
                let weights = [
                    1.,
                    p.potential,
                    p.impedance,
                    p.stress,
                    p.interaction[0],
                    p.interaction[1],
                ];
                for k in 0..6 {
                    values[k] += amounts[s] as f64 * weights[k];
                }
            }
            values
        };
        let initial = scalar(&material);
        for (actual, expected) in project(&material, &rows).into_iter().zip(initial) {
            assert!((actual - expected).abs() < 1e-10);
        }
        let (change, loss) = commit(&mut material, &mut changes, &rows, u64::MAX);
        assert!(changes.iter().all(|q| *q == 0.));
        let mut expected_loss = [0.; 2];
        for s in 0..SPECIES {
            assert_eq!(
                material[s],
                (before[s] as f64 + requested[s]).max(0.) as f32
            );
            let error = requested[s] - (material[s] as f64 - before[s] as f64);
            expected_loss[0] += error;
            expected_loss[1] += error * chemistry.properties[s].potential;
        }
        for k in 0..2 {
            assert!((loss[k] - expected_loss[k]).abs() < 1e-10);
        }
        for ((start, delta), end) in initial.into_iter().zip(change).zip(scalar(&material)) {
            assert!((start + delta - end).abs() < 1e-10);
        }
    }
}
