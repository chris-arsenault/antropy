//! Coefficient dependencies are queried at occupied footprints, never discovered by a map scan.
//! Footprint nodes are marked first; each region then refreshes its own anchors and gradients
//! in parallel, and cells read the results without mutation.
use crate::{config::Config, execution::changed, field::Field};
use crate::{
    spatial::{Geometry, SITES},
    spatial_regions::Regions,
};
use rayon::prelude::*;

#[derive(Clone, Debug)]
struct Region {
    anchors: [[f64; 4]; SITES],
    revisions: [u64; SITES],
    sampled: [u64; SITES],
    gradients: [[[f64; 3]; 2]; SITES],
    /// Sites read this epoch, and the subset whose gradient a footprint reads.
    requested: u64,
    footprint: u64,
}
impl Default for Region {
    fn default() -> Self {
        Self {
            anchors: [[f64::NAN; 4]; SITES],
            revisions: [0; SITES],
            sampled: [0; SITES],
            gradients: [[[0.; 3]; 2]; SITES],
            requested: 0,
            footprint: 0,
        }
    }
}

#[derive(Clone, Debug, Default)]
pub(super) struct Medium {
    geometry: Geometry,
    regions: Regions<Region>,
    clock: u64,
    configuration: Option<[f64; 3]>,
}
impl Medium {
    pub fn prepare(&mut self, field: &Field, c: &Config) {
        self.clock += 1;
        let configuration = [field.spacing, c.pressure_strength, c.movement_impedance];
        let geometry = Geometry::new(field.nx, field.ny);
        if self.configuration != Some(configuration) || self.geometry != geometry {
            self.geometry = geometry;
            self.regions = Regions::new(geometry.count());
            self.configuration = Some(configuration);
        }
        // A region absent from all consumers for a complete epoch owns no dependency cache.
        self.regions
            .retain(|r| r.value.sampled.iter().any(|&epoch| epoch + 1 >= self.clock));
    }
    /// Refreshes anchors at every footprint node and its neighbors, and gradients at
    /// footprint nodes, with one job per owning region.
    pub fn evaluate(&mut self, rows: &[crate::footprint::Row], field: &Field, c: &Config) {
        for row in rows {
            for &(n, _) in row.iter() {
                self.mark(n, true);
                for adjacent in field.neighbors[n] {
                    self.mark(adjacent, false);
                }
            }
        }
        let (geometry, clock) = (self.geometry, self.clock);
        let job = |entry: &mut crate::spatial_regions::Entry<Region>| {
            let state = &mut entry.value;
            let mut requested = std::mem::take(&mut state.requested);
            let footprint = std::mem::take(&mut state.footprint);
            while requested != 0 {
                let site = requested.trailing_zeros() as usize;
                requested &= requested - 1;
                let Some(n) = geometry.node(entry.id, site) else {
                    continue;
                };
                refresh(state, site, n, clock, field, c);
                if footprint & (1 << site) != 0 {
                    state.gradients[site] = field.gradient(&[(n, 1.)]);
                }
            }
        };
        let cost = crate::parallel::cost::DEPENDENCY_REGION;
        if let Some(grain) = crate::parallel::grain(self.regions.entries.len(), cost) {
            self.regions
                .entries
                .par_iter_mut()
                .with_min_len(grain)
                .for_each(job);
        } else {
            self.regions.entries.iter_mut().for_each(job);
        }
    }
    fn mark(&mut self, n: usize, footprint: bool) {
        let (region, site) = self.geometry.address(n);
        let state = self.regions.own(region, Region::default);
        state.requested |= 1 << site;
        state.footprint |= u64::from(footprint) << site;
    }
    fn site(&self, n: usize) -> Option<(&Region, usize)> {
        let (region, site) = self.geometry.address(n);
        self.regions.get(region).map(|r| (r, site))
    }
    /// Newest dependency revision among footprint nodes and their neighbors.
    pub fn revision(&self, sites: &[(usize, f64)], field: &Field) -> u64 {
        let mut revision = 0;
        for &(n, _) in sites {
            for m in std::iter::once(n).chain(field.neighbors[n]) {
                if let Some((r, s)) = self.site(m) {
                    revision = revision.max(r.revisions[s]);
                }
            }
        }
        revision
    }
    pub fn gradient(&self, sites: &[(usize, f64)]) -> [[f64; 3]; 2] {
        let mut result = [[0.; 3]; 2];
        for &(n, weight) in sites {
            if let Some((r, s)) = self.site(n) {
                for (out, value) in result
                    .iter_mut()
                    .flatten()
                    .zip(r.gradients[s].iter().flatten())
                {
                    *out += weight * value;
                }
            }
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn region_gradients_match_direct_reads_and_refresh_every_carrier() {
        let mut field = Field::new(16., 16., 2.);
        let chemistry = crate::chemistry::Chemistry::new(101).unwrap();
        let c = Config::default();
        let mut medium = Medium::default();
        let sites = field.stencil(0.25, 15.75);
        let rows = [crate::footprint::Row::from_slice(&sites)];
        for change in 0..5 {
            field.add(7, 43, 0.3, &chemistry);
            field.test_body_signal()[6] = [change as f64, -0.3];
            field.test_source_signal()[6] = [-0.2, change as f64];
            field.test_body_load()[63] = change as f64;
            field.test_source_load()[1] = change as f64;
            field.attraction_length = change as f64;
            field.prepare_attraction();
            medium.prepare(&field, &c);
            medium.evaluate(&rows, &field, &c);
            let actual = medium.gradient(&sites);
            let expected = field.gradient(&sites);
            for (a, b) in actual.iter().flatten().zip(expected.iter().flatten()) {
                assert!((a - b).abs() < 1e-12);
            }
            assert_eq!(medium.revision(&sites, &field), medium.clock);
        }
    }
}

fn refresh(state: &mut Region, site: usize, n: usize, clock: u64, field: &Field, c: &Config) {
    if state.sampled[site] == clock {
        return;
    }
    state.sampled[site] = clock;
    let current = [
        field.attractive(n) / field.spacing,
        field.medium_signal(n)[1] / field.spacing,
        c.pressure_strength.sqrt() * field.mechanical_load(n),
        c.movement_impedance * (field.impedance_at(n) + field.source_load()[n]),
    ];
    if current
        .iter()
        .zip(state.anchors[site])
        .any(|(&a, b)| changed(a, b, 1.) || (a == 0.) != (b == 0.) || a * b < 0.)
    {
        state.anchors[site] = current;
        state.revisions[site] = clock;
    }
}
