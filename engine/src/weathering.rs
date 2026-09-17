//! Sparse chemical-space redistribution shared by exposed field and reservoir inventory.
use crate::{
    chemical_products::product_neighborhood,
    chemical_projection::lanes,
    chemistry::{Chemistry, SPECIES},
};

pub const DEFAULT_RATE: f64 = 0.025;

#[derive(Clone, Debug)]
pub struct Operators {
    pub destination: [[usize; 4]; SPECIES],
    pub coefficients: [[[f64; SPECIES]; 2]; 4],
    pub heat: [[f64; SPECIES]; 4],
    pub active_groups: u64,
    pub reactive: [bool; SPECIES],
}

impl Operators {
    pub fn new(chemistry: &Chemistry) -> Self {
        let destination = std::array::from_fn(|s| {
            [[1., 0.], [-1., 0.], [0., 1.], [0., -1.]]
                .map(|offset| product_neighborhood(s, offset)[0].species)
        });
        let heat: [[f64; 4]; SPECIES] = std::array::from_fn(|s| {
            destination[s].map(|t| {
                (chemistry.properties[s].potential - chemistry.properties[t].potential).max(0.)
            })
        });
        let rows: [[[f64; 2]; 4]; SPECIES] = std::array::from_fn(|s| {
            let p = &chemistry.properties[s];
            std::array::from_fn(|j| {
                let target = &chemistry.properties[destination[s][j]];
                // The medium favors stronger interaction; reference value gates unfunded work.
                let weight = if heat[s][j] > 0. { 0.25 } else { 0. };
                [
                    weight * (target.interaction[0] - p.interaction[0]),
                    -weight * (target.interaction[1] - p.interaction[1]),
                ]
            })
        });
        let coefficients = std::array::from_fn(|j| {
            std::array::from_fn(|k| std::array::from_fn(|s| rows[s][j][k]))
        });
        Self {
            destination,
            coefficients,
            heat: std::array::from_fn(|j| std::array::from_fn(|s| heat[s][j])),
            active_groups: heat.iter().enumerate().fold(0, |mask, (s, row)| {
                mask | if row.iter().any(|v| *v > 0.) {
                    1 << (s / 4)
                } else {
                    0
                }
            }),
            reactive: heat.map(|row| row.iter().any(|v| *v > 0.)),
        }
    }

    /// Two shared mixture coefficients; no conversion independent of the medium.
    pub fn fractions(&self, s: usize, signal: [f64; 2], exposure_time: f64) -> [f64; 4] {
        let rates = self
            .coefficients
            .each_ref()
            .map(|c| exposure_time * (c[0][s] * signal[0] + c[1][s] * signal[1]).max(0.));
        let denominator = 1. + rates.iter().sum::<f64>();
        rates.map(|r| r / denominator)
    }

    pub(crate) fn engagement_pair(&self, s: usize, signal: [f64; 2]) -> [lanes::Pair; 4] {
        self.coefficients.each_ref().map(|c| {
            lanes::positive(lanes::add(
                lanes::mul(lanes::load(&c[0][s..]), lanes::splat(signal[0])),
                lanes::mul(lanes::load(&c[1][s..]), lanes::splat(signal[1])),
            ))
        })
    }

    #[cfg(test)]
    pub fn inventory(&self, row: &mut [f64], signal: [f64; 2], exposure_time: f64) -> [f64; 2] {
        self.inventory_active(row, signal, exposure_time, 0., u64::MAX)
            .0
    }

    pub fn inventory_active(
        &self,
        row: &mut [f64],
        signal: [f64; 2],
        exposure_time: f64,
        floor: f64,
        mut mask: u64,
    ) -> ([f64; 2], u64) {
        let mut active = mask;
        mask &= self.active_groups;
        if exposure_time == 0. || mask == 0 || strength(signal) == 0. {
            return ([0.; 2], active);
        }
        let minimum = minimum_donor(floor, exposure_time * strength(signal));
        let mut delta = [0.; SPECIES];
        let mut account = [0.; 2];
        while mask != 0 {
            let start = mask.trailing_zeros() as usize * 4;
            mask &= mask - 1;
            for (s, &q) in row
                .iter()
                .enumerate()
                .skip(start)
                .take(4)
                .filter(|(_, q)| **q > minimum)
            {
                if !self.reactive[s] {
                    continue;
                }
                for (j, fraction) in self
                    .fractions(s, signal, exposure_time)
                    .into_iter()
                    .enumerate()
                {
                    let amount = q * fraction;
                    if amount == 0. {
                        continue;
                    }
                    delta[s] -= amount;
                    delta[self.destination[s][j]] += amount;
                    active |= 1 << (self.destination[s][j] / 4);
                    account[0] += amount;
                    account[1] += amount * self.heat[j][s];
                }
            }
        }
        let mut changed = active;
        while changed != 0 {
            let start = changed.trailing_zeros() as usize * 4;
            changed &= changed - 1;
            for s in start..start + 4 {
                row[s] += delta[s];
            }
        }
        (account, active)
    }
}

/// Total engagement is at most two; skipping this donor moves less than one local floor.
pub fn minimum_donor(floor: f64, elapsed: f64) -> f64 {
    floor / (2. * elapsed).min(1.)
}

pub(crate) fn allocate_pair(engagement: [lanes::Pair; 4], elapsed: f64) -> [lanes::Pair; 4] {
    let rates = engagement.map(|e| lanes::mul(e, lanes::splat(elapsed)));
    let sum = rates.iter().fold(lanes::zero(), |a, &b| lanes::add(a, b));
    let denominator = lanes::add(lanes::splat(1.), sum);
    let inverse = lanes::div(lanes::splat(1.), denominator);
    rates.map(|r| lanes::mul(r, inverse))
}

pub fn signal(values: [f64; 2]) -> [f64; 2] {
    let scale = 1. / (1. + values[0].abs() + values[1].abs());
    values.map(|v| v * scale)
}

pub fn strength(signal: [f64; 2]) -> f64 {
    signal[0].abs() + signal[1].abs()
}

pub fn exposure(ambient: f64, impedance: f64, feedback: bool, scale: f64) -> f64 {
    ambient * crate::field::mobility(if feedback { impedance.max(0.) } else { 0. }, scale)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn local_medium_changes_products_and_dilution_stops_conversion() {
        let chemistry = Chemistry::new(101).unwrap();
        let op = Operators::new(&chemistry);
        let mut outcomes = vec![];
        for medium in [[1., 1.], [1., -1.], [0., 0.], [1e-12, -1e-12]] {
            let mut row = [0.; SPECIES];
            row[88] = 4.;
            let account = op.inventory(&mut row, signal(medium), 1.);
            let reference: f64 = row
                .iter()
                .zip(&chemistry.properties)
                .map(|(q, p)| q * p.potential)
                .sum();
            assert!(
                (reference + account[1] - 4. * chemistry.properties[88].potential).abs() < 1e-12
            );
            assert!((row.iter().sum::<f64>() - 4.).abs() < 1e-12);
            assert_eq!(row[120], 0.); // Products cannot react during this update.
            outcomes.push(row);
        }
        assert_eq!(outcomes[0][87], 0.);
        assert!(outcomes[1][87] > 0.01);
        assert!(outcomes[0][104] > 0. && outcomes[1][104] > 0.);
        assert_eq!(outcomes[2][88], 4.);
        assert!(outcomes[3][87] < 1e-11);
    }

    #[test]
    fn reaction_shares_do_not_depend_on_diffusion_or_reference_value_magnitude() {
        let mut chemistry = Chemistry::new(101).unwrap();
        let before = Operators::new(&chemistry);
        for (s, p) in chemistry.properties.iter_mut().enumerate() {
            p.diffusion = 1. + s as f64;
            p.potential *= 7.;
        }
        let after = Operators::new(&chemistry);
        assert_eq!(before.coefficients, after.coefficients);
        assert_eq!(before.destination, after.destination);
        for s in 0..SPECIES {
            for j in 0..4 {
                assert!((after.heat[j][s] - 7. * before.heat[j][s]).abs() < 1e-13);
            }
        }
    }

    #[test]
    fn zero_exposure_inert_and_negligible_inventory_do_not_execute_conversion() {
        let chemistry = Chemistry::new(101).unwrap();
        let op = Operators::new(&chemistry);
        let s = op.reactive.iter().position(|v| *v).unwrap();
        let inert = op.reactive.iter().position(|v| !*v).unwrap();
        let floor = crate::field_activity::CONCENTRATION_FLOOR as f64 * 4.;
        let mut row = [0.; SPECIES];
        row[s] = floor / 2.;
        row[inert] = 1.;
        let before = row;
        let mask = (1 << (s / 4)) | (1 << (inert / 4));
        let (accounts, after_mask) = op.inventory_active(&mut row, [0.; 2], 1., floor, mask);
        assert_eq!(accounts, [0.; 2]);
        assert_eq!(after_mask, mask);
        assert_eq!(row, before); // Owned tiny material is retained, not discarded.
        row[s] = 1.;
        let before = row;
        assert_eq!(
            op.inventory_active(&mut row, [f64::NAN; 2], 0., floor, mask)
                .0,
            [0.; 2]
        );
        assert_eq!(row, before);
        let neutral = row;
        assert_eq!(
            op.inventory_active(&mut row, [0.; 2], 1., floor, mask).0,
            [0.; 2]
        );
        assert_eq!(row, neutral);
        let j = (0..4).find(|&j| op.heat[j][s] > 0.).unwrap();
        let medium = signal([op.coefficients[j][0][s], op.coefficients[j][1][s]]);
        assert!(op.inventory_active(&mut row, medium, 1., floor, mask).0[0] > 0.);
    }

    #[test]
    fn paired_compilation_matches_scalar_branches_and_retains_passive_bounds() {
        for seed in [1, 27, 101] {
            let chemistry = Chemistry::new(seed).unwrap();
            let op = Operators::new(&chemistry);
            for medium in [[0., 0.], [100., -25.], [-100., 25.]] {
                let signal = signal(medium);
                for dt in [0., 0.2, 60., 1e6] {
                    for s in (0..SPECIES).step_by(2) {
                        let actual = allocate_pair(op.engagement_pair(s, signal), dt);
                        for lane in 0..2 {
                            let expected = op.fractions(s + lane, signal, dt);
                            assert!(expected.iter().sum::<f64>() < 1.);
                            for j in 0..4 {
                                let mut pair = [0.; 2];
                                lanes::store(&mut pair, actual[j]);
                                assert!((pair[lane] - expected[j]).abs() < 1e-14);
                                assert!(pair[lane] >= 0.);
                                if pair[lane] > 0. {
                                    assert!(
                                        chemistry.properties[op.destination[s + lane][j]].potential
                                            < chemistry.properties[s + lane].potential
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
