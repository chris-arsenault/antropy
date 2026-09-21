//! Paired row arithmetic; funding and material commits remain outside this kernel.
use super::rows::Batch;
use crate::config::Config;

pub(crate) struct Evaluated {
    pub rates: [f64; 2],
    pub energy: [[f64; 3]; 2],
}

#[cfg(test)]
#[path = "reaction_batch_tests.rs"]
mod tests;

impl Batch {
    pub(crate) fn evaluate(
        &self,
        factor: f64,
        mixture: [f64; 2],
        signal: [f64; 2],
        c: &Config,
    ) -> Evaluated {
        #[cfg(target_arch = "wasm32")]
        unsafe {
            use std::arch::wasm32::*;
            let x = v128_load(self.coefficient[0].as_ptr().cast());
            let y = v128_load(self.coefficient[1].as_ptr().cast());
            let one = f64x2_splat(1.);
            let z = f64x2_mul(
                f64x2_splat(4.),
                f64x2_add(
                    f64x2_mul(x, f64x2_splat(mixture[0])),
                    f64x2_mul(y, f64x2_splat(mixture[1])),
                ),
            );
            let response = f64x2_add(one, f64x2_div(z, f64x2_add(one, f64x2_abs(z))));
            let rates = f64x2_mul(
                f64x2_mul(
                    f64x2_splat(factor),
                    v128_load(self.catalytic.as_ptr().cast()),
                ),
                response,
            );
            let supplied = f64x2_mul(
                f64x2_splat(c.environmental_work),
                f64x2_max(
                    f64x2_splat(0.),
                    f64x2_add(
                        f64x2_mul(x, f64x2_splat(signal[0])),
                        f64x2_mul(y, f64x2_splat(signal[1])),
                    ),
                ),
            );
            let available = f64x2_add(v128_load(self.drop.as_ptr().cast()), supplied);
            let efficiency = v128_bitselect(
                f64x2_splat(c.conversion_efficiency),
                f64x2_splat(1. / c.conversion_efficiency),
                f64x2_ge(available, f64x2_splat(0.)),
            );
            let work = f64x2_sub(
                f64x2_mul(available, efficiency),
                f64x2_mul(f64x2_splat(0.05), v128_load(self.changed.as_ptr().cast())),
            );
            let heat = f64x2_sub(available, work);
            Evaluated {
                rates: [
                    f64x2_extract_lane::<0>(rates),
                    f64x2_extract_lane::<1>(rates),
                ],
                energy: [
                    [
                        f64x2_extract_lane::<0>(work),
                        f64x2_extract_lane::<0>(heat),
                        f64x2_extract_lane::<0>(supplied),
                    ],
                    [
                        f64x2_extract_lane::<1>(work),
                        f64x2_extract_lane::<1>(heat),
                        f64x2_extract_lane::<1>(supplied),
                    ],
                ],
            }
        }
        #[cfg(not(target_arch = "wasm32"))]
        {
            let mut result = Evaluated {
                rates: [0.; 2],
                energy: [[0.; 3]; 2],
            };
            for i in 0..2 {
                let coefficient = self.coefficient.map(|v| v[i]);
                result.rates[i] =
                    factor * self.catalytic[i] * crate::metabolism::response(coefficient, mixture);
                let supplied = c.environmental_work
                    * crate::transformation_work::engagement(coefficient, signal);
                let available = self.drop[i] + supplied;
                let efficiency = if available >= 0. {
                    c.conversion_efficiency
                } else {
                    1. / c.conversion_efficiency
                };
                let work = available * efficiency - 0.05 * self.changed[i];
                result.energy[i] = [work, available - work, supplied];
            }
            result
        }
    }
}
