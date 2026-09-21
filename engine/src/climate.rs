//! Compiled local chemical response; material and configuration determine conversion.
use crate::{chemical_projection::lanes, chemistry::Chemistry, config::Config, weathering};

#[derive(Clone, Debug, Default)]
pub struct Climate {
    pub operators: Option<weathering::Operators>,
    changes: Vec<f64>,
    impedance_scale: f64,
    rate: f64,
    feedback: bool,
    floor: f64,
    pub heat: f64,
    pub work: f64,
    pub converted: f64,
    pub prevented: f64,
}

impl Climate {
    pub fn new(config: &Config, chemistry: &Chemistry) -> Self {
        Self {
            operators: Some(weathering::Operators::with_radius(
                chemistry,
                config.environmental_work,
                config.affinity_radius,
            )),
            changes: vec![0.; 256],
            floor: crate::field_activity::CONCENTRATION_FLOOR as f64 * config.mesh.powi(2),
            ..Self::default()
        }
    }

    pub fn prepare(&mut self, config: &Config) {
        self.operators.as_mut().unwrap().work_strength = config.environmental_work;
        self.rate = config.weathering_rate;
        self.feedback = config.habitat_feedback;
        self.impedance_scale = config.diffusion_impedance;
        self.heat = 0.;
        self.work = 0.;
        self.converted = 0.;
        self.prevented = 0.;
    }

    pub fn convert(&mut self, row: &mut [f32], mask: u64, medium: ([f64; 2], f64), dt: f64) -> u64 {
        self.convert_lit(row, mask, medium, dt, 1.)
    }

    // Keep this chemical loop separate from the already large geographic stencil in WASM.
    #[inline(never)]
    pub fn convert_lit(
        &mut self,
        row: &mut [f32],
        mut mask: u64,
        medium: ([f64; 2], f64),
        dt: f64,
        light: f64,
    ) -> u64 {
        if self.rate == 0. || mask == 0 {
            return mask;
        }
        let mut active = mask;
        mask &= self.operators.as_ref().unwrap().active_groups;
        if mask == 0 {
            return active;
        }
        let exposure = weathering::exposure(1., medium.1, self.feedback, self.impedance_scale);
        let signal = weathering::signal(medium.0);
        let elapsed = [self.rate * dt * exposure, self.rate * dt];
        if elapsed[0] == 0. || weathering::strength(signal) == 0. {
            return active;
        }
        let minimum =
            weathering::minimum_donor(self.floor, elapsed[0] * weathering::strength(signal));
        let medium = crate::reaction_medium::Medium::illuminated(signal, light);
        while mask != 0 {
            let start = mask.trailing_zeros() as usize * 4;
            mask &= mask - 1;
            active |= self.convert_pair(row, start, medium, elapsed, minimum);
            active |= self.convert_pair(row, start + 2, medium, elapsed, minimum);
        }
        // One rounded commit after every donor has reserved against the original row.
        let mut changed = active;
        active = 0;
        // The least f32 at or above the f64 floor preserves the scalar comparison exactly.
        let floor = material_floor(self.floor);
        while changed != 0 {
            let s = changed.trailing_zeros() as usize * 4;
            changed &= changed - 1;
            if commit_group(&mut row[s..s + 4], &mut self.changes[s..s + 4], floor) {
                active |= 1 << (s / 4);
            }
        }
        active
    }
    fn convert_pair(
        &mut self,
        row: &[f32],
        s: usize,
        signal: crate::reaction_medium::Medium,
        elapsed: [f64; 2],
        minimum: f64,
    ) -> u64 {
        if row[s] as f64 <= minimum && row[s + 1] as f64 <= minimum {
            return 0;
        }
        let operators = self.operators.as_ref().unwrap();
        if !operators.reactive[s] && !operators.reactive[s + 1] {
            return 0;
        }
        let local = std::array::from_fn::<_, { weathering::BRANCHES }, _>(|j| {
            operators.local_pair(s, j, signal)
        });
        let engagement = local.map(|e| e.0);
        let total = engagement
            .iter()
            .fold(lanes::zero(), |a, &b| lanes::add(a, b));
        if lanes::total(total) == 0. {
            return 0;
        }
        let fractions = weathering::allocate_pair(engagement, elapsed[0]);
        let hazard = lanes::mul(total, lanes::splat(elapsed[1]));
        let bare = lanes::div(hazard, lanes::add(lanes::splat(1.), hazard));
        let q = lanes::load_material(&row[s..]);
        let mut active = 0;
        let mut converted = lanes::zero();
        let mut heat = lanes::zero();
        let mut work = lanes::zero();
        for (j, fraction) in fractions.into_iter().enumerate() {
            let loss = lanes::mul(q, fraction);
            converted = lanes::add(converted, loss);
            heat = lanes::add(heat, lanes::mul(loss, local[j].1));
            work = lanes::add(work, lanes::mul(loss, local[j].2));
            let mut amounts = [0.; 2];
            lanes::store(&mut amounts, loss);
            for (lane, amount) in amounts.into_iter().enumerate() {
                if amount == 0. {
                    continue;
                }
                let donor = s + lane;
                let target = operators.destination[donor][j];
                self.changes[target] += amount;
                active |= 1 << (target / 4);
            }
        }
        let retained = lanes::sub(lanes::load(&self.changes[s..]), converted);
        lanes::store(&mut self.changes[s..], retained);
        self.converted += lanes::total(converted);
        self.heat += lanes::total(heat);
        self.work += lanes::total(work);
        if elapsed[0] < elapsed[1] {
            self.prevented += lanes::total(lanes::sub(lanes::mul(q, bare), converted));
        }
        active
    }
}

fn material_floor(floor: f64) -> f32 {
    let rounded = floor as f32;
    if (rounded as f64) < floor {
        rounded.next_up()
    } else {
        rounded
    }
}

/// Four independent rounded updates; unchanged groups need no f64 conversion or write.
fn commit_group(row: &mut [f32], changes: &mut [f64], floor: f32) -> bool {
    #[cfg(target_arch = "wasm32")]
    unsafe {
        use std::arch::wasm32::*;
        assert_eq!(row.len(), 4);
        assert_eq!(changes.len(), 4);
        let old = v128_load(row.as_ptr().cast());
        let lo = v128_load(changes.as_ptr().cast());
        let hi = v128_load(changes.as_ptr().add(2).cast());
        let changed = v128_any_true(v128_or(lo, hi));
        let rounded = if changed {
            let first = f32x4_demote_f64x2_zero(f64x2_add(f64x2_promote_low_f32x4(old), lo));
            let second = f32x4_demote_f64x2_zero(f64x2_add(
                f64x2_promote_low_f32x4(i32x4_shuffle::<2, 3, 2, 3>(old, old)),
                hi,
            ));
            i32x4_shuffle::<0, 1, 4, 5>(first, second)
        } else {
            old
        };
        let next = v128_and(rounded, f32x4_ge(rounded, f32x4_splat(floor)));
        if changed || v128_any_true(v128_xor(old, next)) {
            v128_store(row.as_mut_ptr().cast(), next);
        }
        changes.fill(0.);
        v128_any_true(next)
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        let mut active = false;
        for (q, change) in row.iter_mut().zip(changes) {
            *q = (*q as f64 + *change) as f32;
            if *q < floor {
                *q = 0.;
            }
            active |= *q > 0.;
            *change = 0.;
        }
        active
    }
}

pub fn local(w: &crate::world::World, x: f64, y: f64) -> [f64; 3] {
    let sites = w.field.stencil(x, y);
    let mut medium: [f64; 2] = std::array::from_fn(|k| {
        sites
            .iter()
            .map(|&(n, a)| a * (w.field.signal[n][k] + w.field.source_signal[n][k]))
            .sum()
    });
    crate::footprint::visit_current(w, |node, profile| {
        if let Some((_, weight)) = sites.iter().find(|(n, _)| *n == node) {
            for k in 0..2 {
                medium[k] += weight * profile[k];
            }
        }
    });
    let ambient = weathering::strength(weathering::signal(medium));
    let load = w.field.medium_load(&sites);
    let effective = weathering::exposure(
        ambient,
        load,
        w.config.habitat_feedback,
        w.config.diffusion_impedance,
    );
    [
        ambient,
        effective,
        if ambient > 0. {
            1. - effective / ambient
        } else {
            0.
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn grouped_commit_preserves_scalar_rounding_floor_and_scratch_reuse() {
        for floor in [1e-9, 4e-9, 9e-9, 0.000000003141592653589793] {
            let rounded = floor as f32;
            for amount in [0., rounded.next_down(), rounded, rounded.next_up(), 0.01] {
                for delta in [0_f64, 1e-12, -1e-12, 0.001, -0.1] {
                    let mut row = [amount, 0., amount * 2., 0.01];
                    let mut changes = [delta, delta.max(0.), -delta, 0.];
                    let expected = std::array::from_fn::<_, 4, _>(|i| {
                        let q = (row[i] as f64 + changes[i]) as f32;
                        if (q as f64) < floor { 0. } else { q }
                    });
                    let active = commit_group(&mut row, &mut changes, material_floor(floor));
                    assert_eq!(row, expected);
                    assert_eq!(active, expected.iter().any(|q| *q > 0.));
                    assert_eq!(changes, [0.; 4]);
                    commit_group(&mut row, &mut changes, material_floor(floor));
                    assert_eq!(row, expected);
                }
            }
        }
    }
}
