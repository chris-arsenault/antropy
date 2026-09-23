//! Persistent destination regions read one frozen material epoch. Each region job derives
//! its own work from neighboring masks and commits its masks, projections and totals.
use super::*;
use crate::spatial_material::Projection;
use rayon::prelude::*;

struct Pass<'a> {
    field: &'a Field,
    rows: &'a [[f32; SPECIES]; 4],
    projection: &'a crate::chemical_projection::Rows,
    dt: f64,
    step_dt: f64,
    final_step: bool,
    decay: f64,
    impedance: f64,
    maximum_impedance: f64,
    floor: f32,
}

/// One destination row: new groups and projection, the previous projection, washout loss
/// and the candidate groups that were evaluated.
struct RowResult {
    mask: u64,
    projection: Projection,
    previous: Projection,
    lost: [f64; 2],
    candidates: u64,
}

impl Pass<'_> {
    fn row(
        &self,
        n: usize,
        next: &mut [f32],
        weather: &mut Option<crate::climate::Climate>,
    ) -> Option<RowResult> {
        let f = self.field;
        let (center, center_mask, previous) = f.amounts.site(n);
        let neighbors = f.neighbors[n];
        let adjacent = neighbors.map(|j| f.amounts.site(j));
        let candidates = adjacent.iter().fold(center_mask, |m, s| m | s.1);
        if candidates == 0 {
            return None;
        }
        let features = f.features(n, &previous);
        let coefficients = f.face_coefficients(
            features,
            std::array::from_fn(|k| f.features(neighbors[k], &adjacent[k].2)),
            self.step_dt,
            self.impedance,
            self.maximum_impedance,
        );
        let mut mask = crate::field_vector::redistribute(
            center,
            adjacent.map(|s| s.0),
            next,
            self.rows,
            coefficients,
            1.,
            crate::field_vector::Work {
                mask: candidates,
                floor: self.floor,
            },
        );
        let mut lost = [0.; 2];
        if self.final_step && self.decay < 1. {
            (mask, lost) = crate::chemical_projection::decay(
                next,
                self.projection,
                mask,
                self.decay,
                self.floor,
            );
        }
        if self.final_step
            && let Some(weather) = weather
        {
            let area = f.spacing * f.spacing;
            let carried = f.carriers.site(n);
            let signal = [
                previous[4] / area + carried.signal[0][0] + carried.signal[1][0],
                previous[5] / area + carried.signal[0][1] + carried.signal[1][1],
            ];
            mask = weather.convert_lit(
                next,
                mask,
                (signal, features[3]),
                self.dt,
                f.illumination.node(n),
            );
        }
        Some(RowResult {
            mask,
            projection: crate::chemical_projection::project_active(next, self.projection, mask),
            previous,
            lost,
            candidates,
        })
    }
}

/// Region job totals: washout and weathering accounts, material totals, evaluated groups
/// and whether any signal projection changed.
#[derive(Clone, Copy, Default)]
struct Job {
    account: [f64; 6],
    totals: [f64; 2],
    groups: usize,
    changed: bool,
}

impl Field {
    #[allow(clippy::too_many_arguments)]
    pub(super) fn advance_partitioned(
        &mut self,
        rows: &[[f32; SPECIES]; 4],
        projection: &crate::chemical_projection::Rows,
        (dt, steps, step): (f64, usize, usize),
        washout: f64,
        impedance: f64,
        maximum_impedance: f64,
        floor: f32,
        climate: Option<&crate::climate::Climate>,
    ) -> [f64; 6] {
        #[cfg(not(target_arch = "wasm32"))]
        let started = self.profile.then(std::time::Instant::now);
        // Taking the destination owner makes disjoint writes expressible without unsafe aliases.
        let mut next = std::mem::take(&mut self.next);
        next.prepare_destinations(&self.amounts);
        let geometry = next.geometry();
        let pass = Pass {
            field: self,
            rows,
            projection,
            dt,
            step_dt: dt / steps as f64,
            final_step: step + 1 == steps,
            decay: (-washout * dt).exp(),
            impedance,
            maximum_impedance,
            floor,
        };
        let process =
            |entry: &mut crate::spatial_regions::Entry<crate::spatial_material::Region>| {
                let dest = &mut entry.value;
                dest.clear();
                let mut weather = climate.cloned();
                if let Some(w) = &mut weather {
                    w.heat = 0.;
                    w.work = 0.;
                    w.converted = 0.;
                    w.prevented = 0.;
                }
                let mut job = Job::default();
                for (site, n) in geometry.sites(dest.id) {
                    let Some(result) = pass.row(n, dest.row_mut(site), &mut weather) else {
                        continue;
                    };
                    dest.masks[site] = result.mask;
                    dest.projection[site] = if result.mask == 0 {
                        [0.; 6]
                    } else {
                        result.projection
                    };
                    let p = dest.projection[site];
                    job.totals[0] += p[0];
                    job.totals[1] += p[1];
                    job.account[0] += result.lost[0];
                    job.account[1] += result.lost[1];
                    job.groups += result.candidates.count_ones() as usize;
                    job.changed |= p[4..] != result.previous[4..];
                }
                if let Some(w) = weather {
                    job.account[2..].copy_from_slice(&[w.heat, w.work, w.converted, w.prevented]);
                }
                (dest.id, job)
            };
        let cost = crate::parallel::cost::FIELD_REGION;
        let jobs: Vec<(usize, Job)> =
            if let Some(grain) = crate::parallel::grain(next.regions.entries.len(), cost) {
                next.regions
                    .entries
                    .par_iter_mut()
                    .with_min_len(grain)
                    .map(process)
                    .collect()
            } else {
                next.regions.entries.iter_mut().map(process).collect()
            };
        std::mem::swap(&mut self.amounts, &mut next);
        self.next = next;
        self.amounts.prune();
        let mut account = [0.; 6];
        self.totals = [0.; 2];
        for (region, job) in jobs {
            for (total, value) in account.iter_mut().zip(job.account) {
                *total += value;
            }
            self.totals[0] += job.totals[0];
            self.totals[1] += job.totals[1];
            self.last_groups += job.groups;
            if job.changed {
                self.signal_changes.insert(region);
            }
        }
        #[cfg(not(target_arch = "wasm32"))]
        if let Some(started) = started {
            self.profile_ms[1] += started.elapsed().as_secs_f64() * 1000.;
        }
        account
    }
}
