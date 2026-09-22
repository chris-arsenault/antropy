//! Region-local finite convolution; input anchors bound accumulated approximation.
use crate::{
    spatial::{Geometry, SITES, Work},
    spatial_regions::Plane,
};
use rayon::prelude::*;
#[derive(Clone, Debug, Default)]
pub struct Attraction {
    geometry: (usize, usize, f64, f64),
    input: Plane,
    /// The three-box x pass and the three-box y pass; each halo spans three box radii.
    stages: [Plane; 2],
    pub output: Vec<f64>,
    pub revisions: u64,
    pub visited: usize,
    pub dirty_regions: usize,
    pending: Work,
    spare: Work,
}
impl Attraction {
    #[cfg(test)]
    pub fn prepare(
        &mut self,
        geometry: (usize, usize, f64, f64),
        rows: [&crate::spatial_signal::Signal; 3],
    ) {
        let g = Geometry::new(geometry.0, geometry.1);
        let mut work = Work::default();
        work.reset(g.count());
        for n in 0..g.nx * g.ny {
            work.insert(g.address(n).0);
        }
        let input = |r: usize, values: &mut [f64; SITES]| {
            for (s, n) in g.sites(r) {
                values[s] = rows.iter().map(|row| row[n][0]).sum();
            }
        };
        self.update(geometry, input, work, false);
    }
    /// `input(region, values)` writes the current summed first signal axis of a region.
    pub fn update(
        &mut self,
        geometry: (usize, usize, f64, f64),
        input: impl Fn(usize, &mut [f64; SITES]) + Sync,
        mut pending: Work,
        approximate: bool,
    ) {
        let g = Geometry::new(geometry.0, geometry.1);
        let reset = self.geometry != geometry;
        if reset {
            self.geometry = geometry;
            self.input = Plane::new(g);
            self.stages = std::array::from_fn(|_| Plane::new(g));
            self.output = vec![0.; g.nx * g.ny];
            pending.reset(g.count());
            for r in 0..g.count() {
                pending.insert(r);
            }
        }
        self.visited = 0;
        self.dirty_regions = 0;
        if geometry.3 == 0. {
            self.pending = pending;
            return;
        }
        let mut changed = std::mem::take(&mut self.spare);
        changed.reset(g.count());
        let anchors = &self.input;
        let check = |&r: &usize| {
            let mut current = [0.; SITES];
            input(r, &mut current);
            let previous = anchors.region(r).copied().unwrap_or([0.; SITES]);
            let mut values = previous;
            let mut different = false;
            for (s, _) in g.sites(r) {
                let (current, previous) = (current[s], previous[s]);
                let significant = if approximate && !reset {
                    crate::execution::changed(
                        current,
                        previous,
                        crate::field_activity::CONCENTRATION_FLOOR as f64,
                    ) || (current == 0.) != (previous == 0.)
                        || current * previous < 0.
                } else {
                    current != previous
                };
                if significant {
                    values[s] = current;
                    different = true;
                }
            }
            different.then_some((r, values))
        };
        let cost = crate::parallel::cost::FILTER_REGION;
        let updates: Vec<_> =
            if let Some(grain) = crate::parallel::grain(pending.regions.len(), cost) {
                pending
                    .regions
                    .par_iter()
                    .with_min_len(grain)
                    .filter_map(check)
                    .collect()
            } else {
                pending.regions.iter().filter_map(check).collect()
            };
        for (r, values) in updates {
            self.input.set_region(r, values);
            changed.insert(r);
        }
        self.dirty_regions = changed.regions.len();
        if changed.regions.is_empty() {
            self.pending = pending;
            self.spare = changed;
            return;
        }
        self.revisions += 1;
        let width = geometry.3 / geometry.2;
        let radius = (width + 0.5).floor() as usize;
        for (stage, axis) in [0, 1].into_iter().enumerate() {
            pending.reset(g.count());
            for &r in &changed.regions {
                pending.halo(g, r, 3 * radius, axis);
            }
            let input = if stage == 0 {
                &self.input
            } else {
                &self.stages[stage - 1]
            };
            let calculate = |&r: &usize| crate::spatial_filter::region(input, g, r, width, axis);
            let results: Vec<_> =
                if let Some(grain) = crate::parallel::grain(pending.regions.len(), cost) {
                    pending
                        .regions
                        .par_iter()
                        .with_min_len(grain)
                        .map(calculate)
                        .collect()
                } else {
                    pending.regions.iter().map(calculate).collect()
                };
            self.visited += pending
                .regions
                .iter()
                .map(|&r| g.sites(r).count())
                .sum::<usize>();
            for (&r, values) in pending.regions.iter().zip(results) {
                if stage == 1 {
                    for (s, n) in g.sites(r) {
                        self.output[n] = values[s];
                    }
                }
                self.stages[stage].set_region(r, values);
            }
            std::mem::swap(&mut pending, &mut changed);
        }
        self.pending = pending;
        self.spare = changed;
    }
}

impl crate::field::Field {
    /// Carrier writes queue local changes, including explicit interventions.
    pub fn prepare_attraction(&mut self) {
        if self.mechanical_frozen {
            return;
        }
        #[cfg(not(target_arch = "wasm32"))]
        let started = self.profile.then(std::time::Instant::now);
        self.source_signal.compact();
        self.body_signal.compact();
        let geometry = Geometry::new(self.nx, self.ny);
        let mut changes = std::mem::take(&mut self.attraction.pending);
        changes.reset(geometry.count());
        for &r in &self.signal_changes.regions {
            changes.insert(r);
        }
        self.signal_changes.reset(geometry.count());
        self.source_signal.drain_changes(geometry, &mut changes);
        self.body_signal.drain_changes(geometry, &mut changes);
        let exact = self.material_exact || self.source_signal.exact || self.body_signal.exact;
        self.material_exact = false;
        self.source_signal.exact = false;
        self.body_signal.exact = false;
        let area = self.spacing * self.spacing;
        let (amounts, source, body) = (&self.amounts, &self.source_signal, &self.body_signal);
        let input = |r: usize, values: &mut [f64; SITES]| {
            let material = amounts.regions.get(r);
            for (s, n) in geometry.sites(r) {
                let own = material.map_or(0., |m| m.projection[s][4] / area);
                values[s] = own + source[n][0] + body[n][0];
            }
        };
        self.attraction.update(
            (self.nx, self.ny, self.spacing, self.attraction_length),
            input,
            changes,
            !exact,
        );
        #[cfg(not(target_arch = "wasm32"))]
        if let Some(started) = started {
            self.profile_ms[0] += started.elapsed().as_secs_f64() * 1000.;
        }
    }
    pub(crate) fn freeze_mechanical_stage(&mut self) {
        self.mechanical_frozen = false;
        self.prepare_attraction();
        self.mechanical_frozen = true;
    }
    pub(crate) fn finish_mechanical_stage(&mut self) {
        self.mechanical_frozen = false;
    }

    pub(crate) fn attractive(&self, n: usize) -> f64 {
        if self.attraction_length == 0. {
            self.medium_signal(n)[0]
        } else {
            self.attraction.output[n]
        }
    }
}
