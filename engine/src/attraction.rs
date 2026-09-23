//! Region-local finite convolution; input anchors bound accumulated approximation.
//! Input anchors, the x pass and the output are dense region-major planes, so every
//! pending region job reads committed neighbors and writes only its own slot.
use crate::spatial::{Geometry, SITES, Work};
use rayon::prelude::*;

pub(crate) type Plane = Vec<[f64; SITES]>;

/// Filtered attraction, indexed by node.
#[derive(Clone, Debug, Default)]
pub struct Output {
    geometry: Geometry,
    values: Plane,
}
impl Output {
    pub fn len(&self) -> usize {
        self.geometry.nx * self.geometry.ny
    }
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
    pub fn iter(&self) -> impl Iterator<Item = &f64> {
        (0..self.len()).map(move |n| &self[n])
    }
}
impl std::ops::Index<usize> for Output {
    type Output = f64;
    fn index(&self, n: usize) -> &f64 {
        let (r, s) = self.geometry.address(n);
        &self.values[r][s]
    }
}
impl<'a> IntoIterator for &'a Output {
    type Item = &'a f64;
    type IntoIter = Box<dyn Iterator<Item = &'a f64> + 'a>;
    fn into_iter(self) -> Self::IntoIter {
        Box::new(self.iter())
    }
}
impl IntoIterator for Output {
    type Item = f64;
    type IntoIter = std::vec::IntoIter<f64>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter().copied().collect::<Vec<_>>().into_iter()
    }
}

#[derive(Clone, Debug, Default)]
pub struct Attraction {
    geometry: (usize, usize, f64, f64),
    input: Plane,
    /// The three-box x pass; the three-box y pass writes `output`.
    stage: Plane,
    pub output: Output,
    pub revisions: u64,
    pub visited: usize,
    pub dirty_regions: usize,
    pending: Work,
}

/// Runs `job` on the listed region slots of `plane` in parallel and returns (region, result)
/// in ascending region order. Only listed regions are visited.
fn each_listed<R: Send>(
    plane: &mut Plane,
    regions: &[usize],
    job: impl Fn(usize, &mut [f64; SITES]) -> R + Sync,
) -> Vec<(usize, R)> {
    let mut sorted = regions.to_vec();
    sorted.sort_unstable();
    let mut slots = crate::spatial::select_mut(plane, &sorted);
    let run = |(r, values): &mut (usize, &mut [f64; SITES])| (*r, job(*r, values));
    let cost = crate::parallel::cost::FILTER_REGION;
    match crate::parallel::grain(sorted.len(), cost) {
        Some(grain) => slots.par_iter_mut().with_min_len(grain).map(run).collect(),
        None => slots.iter_mut().map(run).collect(),
    }
}

impl Attraction {
    #[cfg(test)]
    pub fn prepare(&mut self, geometry: (usize, usize, f64, f64), input: &[f64]) {
        let g = Geometry::new(geometry.0, geometry.1);
        let mut work = Work::default();
        work.reset(g.count());
        for n in 0..g.nx * g.ny {
            work.insert(g.address(n).0);
        }
        let input = |r: usize, values: &mut [f64; SITES]| {
            for (s, n) in g.sites(r) {
                values[s] = input[n];
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
            self.input = vec![[0.; SITES]; g.count()];
            self.stage = vec![[0.; SITES]; g.count()];
            self.output = Output {
                geometry: g,
                values: vec![[0.; SITES]; g.count()],
            };
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
        // Each pending region compares its current input with its own anchors in place.
        let check = |r: usize, anchors: &mut [f64; SITES]| {
            let mut current = [0.; SITES];
            let mut different = false;
            input(r, &mut current);
            for (s, _) in g.sites(r) {
                let (current, previous) = (current[s], anchors[s]);
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
                    anchors[s] = current;
                    different = true;
                }
            }
            different
        };
        let dirty = each_listed(&mut self.input, &pending.regions, check);
        let mut changed = Work::default();
        changed.reset(g.count());
        for (r, dirty) in dirty {
            if dirty {
                changed.insert(r);
            }
        }
        self.dirty_regions = changed.regions.len();
        if changed.regions.is_empty() {
            self.pending = pending;
            return;
        }
        self.revisions += 1;
        let width = geometry.3 / geometry.2;
        let radius = (width + 0.5).floor() as usize;
        for axis in [0, 1] {
            pending.reset(g.count());
            for &r in &changed.regions {
                pending.halo(g, r, 3 * radius, axis);
            }
            self.visited += pending
                .regions
                .iter()
                .map(|&r| g.sites(r).count())
                .sum::<usize>();
            let (source, target) = if axis == 0 {
                (&self.input, &mut self.stage)
            } else {
                (&self.stage, &mut self.output.values)
            };
            each_listed(target, &pending.regions, |r, values| {
                *values = crate::spatial_filter::region(source, g, r, width, axis);
            });
            std::mem::swap(&mut pending, &mut changed);
        }
        self.pending = pending;
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
        let geometry = Geometry::new(self.nx, self.ny);
        let mut changes = std::mem::take(&mut self.attraction.pending);
        changes.reset(geometry.count());
        for &r in self
            .signal_changes
            .regions
            .iter()
            .chain(&self.carriers.changed.regions)
        {
            changes.insert(r);
        }
        self.signal_changes.reset(geometry.count());
        self.carriers.changed.reset(geometry.count());
        let exact = self.material_exact || self.carriers.exact;
        self.material_exact = false;
        self.carriers.exact = false;
        let area = self.spacing * self.spacing;
        let (amounts, carriers) = (&self.amounts, &self.carriers);
        let input = |r: usize, values: &mut [f64; SITES]| {
            let material = amounts.regions.get(r);
            let carried = carriers.region(r);
            for (s, _) in geometry.sites(r) {
                let own = material.map_or(0., |m| m.projection[s][4] / area);
                values[s] = own + carried[s].signal[1][0] + carried[s].signal[0][0];
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
