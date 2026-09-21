//! Exclusive destination strips over frozen material. No atomic chemical updates.
use super::*;
use rayon::prelude::*;

const STRIP: usize = 64;

#[derive(Clone, Default)]
struct RowResult {
    mask: u64,
    projection: [f64; 6],
}

struct Pass<'a> {
    field: &'a Field,
    rows: &'a [[f32; SPECIES]; 4],
    projection: &'a crate::chemical_projection::Rows,
    dt: f64,
    step_dt: f64,
    final_step: bool,
    washout: f64,
    impedance: f64,
    maximum_impedance: f64,
    floor: f32,
}

impl Pass<'_> {
    fn row(
        &self,
        n: usize,
        next: &mut [f32],
        weather: &mut Option<crate::climate::Climate>,
    ) -> (RowResult, [f64; 2]) {
        let f = self.field;
        let coefficients = f.coefficients(n, self.step_dt, self.impedance, self.maximum_impedance);
        let inputs = f.neighbors[n].map(|j| &f.amounts[j * SPECIES..(j + 1) * SPECIES]);
        let mut mask = crate::field_vector::redistribute(
            &f.amounts[n * SPECIES..(n + 1) * SPECIES],
            inputs,
            next,
            self.rows,
            coefficients,
            1.,
            crate::field_vector::Work {
                mask: f.activity.candidates[n],
                floor: self.floor,
            },
        );
        let mut lost = [0.; 2];
        if self.final_step && self.washout > 0. {
            let decay = (-self.washout * self.dt * f.retention(n, self.impedance)).exp();
            (mask, lost) =
                crate::chemical_projection::decay(next, self.projection, mask, decay, self.floor);
        }
        if self.final_step
            && let Some(weather) = weather
        {
            mask = weather.convert_lit(
                next,
                mask,
                (f.medium_signal(n), f.impedance[n] + f.source_load[n]),
                self.dt,
                f.illumination.node(n),
            );
        }
        (
            RowResult {
                mask,
                projection: crate::chemical_projection::project_active(next, self.projection, mask),
            },
            lost,
        )
    }
}

impl Field {
    #[allow(clippy::too_many_arguments)]
    pub(super) fn advance_partitioned(
        &mut self,
        rows: &[[f32; SPECIES]; 4],
        projection: &crate::chemical_projection::Rows,
        dt: f64,
        steps: usize,
        step: usize,
        washout: f64,
        impedance: f64,
        maximum_impedance: f64,
        floor: f32,
        climate: Option<&crate::climate::Climate>,
    ) -> [f64; 6] {
        // Taking the destination owner makes disjoint writes expressible without unsafe aliases.
        let mut next = std::mem::take(&mut self.next);
        let mut results = vec![RowResult::default(); self.nx * self.ny];
        let pass = Pass {
            field: self,
            rows,
            projection,
            dt,
            step_dt: dt / steps as f64,
            final_step: step + 1 == steps,
            washout,
            impedance,
            maximum_impedance,
            floor,
        };
        let process = |(chunk, (dest, output)): (usize, (&mut [f32], &mut [RowResult]))| {
            let first = chunk * STRIP;
            let end = first + output.len();
            let range = self.activity.work.partition_point(|&n| n < first)
                ..self.activity.work.partition_point(|&n| n < end);
            if range.is_empty() {
                return [0.; 6];
            }
            let mut weather = climate.cloned();
            if let Some(w) = &mut weather {
                w.heat = 0.;
                w.work = 0.;
                w.converted = 0.;
                w.prevented = 0.;
            }
            let mut account = [0.; 6];
            for &n in &self.activity.work[range] {
                let offset = n - first;
                let (result, loss) = pass.row(
                    n,
                    &mut dest[offset * SPECIES..(offset + 1) * SPECIES],
                    &mut weather,
                );
                output[offset] = result;
                account[0] += loss[0];
                account[1] += loss[1];
            }
            if let Some(w) = weather {
                account[2..].copy_from_slice(&[w.heat, w.work, w.converted, w.prevented]);
            }
            account
        };
        let add = |mut a: [f64; 6], b: [f64; 6]| {
            for k in 0..6 {
                a[k] += b[k];
            }
            a
        };
        let account = if crate::parallel::enabled(self.activity.work.len(), 256) {
            next.par_chunks_mut(STRIP * SPECIES)
                .zip(results.par_chunks_mut(STRIP))
                .enumerate()
                .map(process)
                .reduce(|| [0.; 6], add)
        } else {
            next.chunks_mut(STRIP * SPECIES)
                .zip(results.chunks_mut(STRIP))
                .enumerate()
                .map(process)
                .fold([0.; 6], add)
        };
        std::mem::swap(&mut self.amounts, &mut next);
        let candidates = &self.activity.candidates;
        let clear =
            |(n, row): (usize, &mut [f32])| crate::field_activity::clear(row, candidates[n]);
        if crate::parallel::enabled(self.activity.work.len(), 256) {
            next.par_chunks_mut(SPECIES).enumerate().for_each(clear);
        } else {
            for &n in &self.activity.work {
                clear((n, &mut next[n * SPECIES..(n + 1) * SPECIES]));
            }
        }
        self.next = next;
        self.totals = [0.; 2];
        for i in 0..self.activity.work.len() {
            let n = self.activity.work[i];
            let result = &results[n];
            self.last_groups += self.activity.candidates[n].count_ones() as usize;
            self.activity.set(n, result.mask);
            let v = result.projection;
            self.totals[0] += v[0];
            self.totals[1] += v[1];
            let area = self.spacing.powi(2);
            self.impedance[n] = v[2] / area;
            self.stress[n] = v[3] / area;
            self.signal[n] = [v[4] / area, v[5] / area];
        }
        account
    }
}
