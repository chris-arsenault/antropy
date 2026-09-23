//! W-transposed material rows and W donor fractions share contiguous pair arithmetic.
use crate::chemical_projection::lanes as v;

pub fn deposit(
    demand: &mut [f64],
    exports: &mut [f64],
    incoming: &[f64; 256],
    outgoing: &[f64; 256],
    weight: f64,
    mask: u64,
) {
    let weight = v::splat(weight);
    for s in crate::field_activity::pairs(mask) {
        let d = v::add(
            v::load(&demand[s..]),
            v::mul(weight, v::load(&incoming[s..])),
        );
        let e = v::add(
            v::load(&exports[s..]),
            v::mul(weight, v::load(&outgoing[s..])),
        );
        v::store(&mut demand[s..], d);
        v::store(&mut exports[s..], e);
    }
}

pub fn donors(demand: &mut [f64], changes: &mut [f64], material: &[f32], mask: u64) {
    for s in crate::field_activity::pairs(mask) {
        let wanted = v::load(&demand[s..]);
        let available = v::load_material(&material[s..]);
        let taken = v::min(wanted, available);
        // Exactly zero demand has no recipient; substitute its denominator without a cutoff.
        let denominator = v::nonzero(wanted);
        let fraction = v::min(v::splat(1.), v::div(available, denominator));
        v::store(&mut demand[s..], fraction);
        let delta = v::sub(v::load(&changes[s..]), taken);
        v::store(&mut changes[s..], delta);
    }
}

pub fn gather(
    ratios: &[f64],
    sites: &[(usize, f64)],
    slots: &crate::spatial_slots::Slots,
    requests: &[f64; 256],
    mask: u64,
) -> [f64; 256] {
    let mut result = [0.; 256];
    if mask == 0 {
        return result;
    }
    for &(node, weight) in sites {
        if weight == 0. {
            continue;
        }
        let slot = slots.get(node);
        let row = &ratios[slot * 256..(slot + 1) * 256];
        let weight = v::splat(weight);
        for s in crate::field_activity::pairs(mask) {
            let amount = v::add(v::load(&result[s..]), v::mul(weight, v::load(&row[s..])));
            v::store(&mut result[s..], amount);
        }
    }
    for s in crate::field_activity::pairs(mask) {
        let accepted = v::mul(v::load(&result[s..]), v::load(&requests[s..]));
        v::store(&mut result[s..], accepted);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shared_donor_exports_do_not_feed_same_stage_imports() {
        let mut demand = [0.; 256];
        let mut changes = [0.; 256];
        let mut imports = [0.; 256];
        let mut exports = [0.; 256];
        let mut material = [0.; 256];
        imports[3] = 2.;
        imports[4] = 1.;
        exports[3] = 7.;
        exports[4] = 3.;
        material[3] = 1.;
        let mask = 3;
        deposit(&mut demand, &mut changes, &imports, &exports, 1., mask);
        deposit(&mut demand, &mut changes, &imports, &[0.; 256], 1., mask);
        donors(&mut demand, &mut changes, &material, mask);
        let slots = crate::spatial_slots::Slots::new(crate::spatial::Geometry::new(1, 1));
        slots.set(0, 0);
        let received = gather(&demand, &[(0, 1.)], &slots, &imports, mask);
        assert_eq!(received[3], 0.5);
        assert_eq!(received[4], 0.);
        assert!(received.iter().all(|q| q.is_finite()));
        assert_eq!(changes[3], 6.);
        assert_eq!(changes[4], 3.);
        assert_eq!(2. * received[3] + changes[3], exports[3]);
    }
}
