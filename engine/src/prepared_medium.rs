//! Carrier changes wake geographic coefficients locally, before body advancement.
use crate::{config::Config, execution::changed, field::Field};
use rayon::prelude::*;

#[derive(Clone, Debug, Default)]
pub(super) struct Medium {
    anchors: Vec<[f64; 4]>,
    revisions: Vec<u64>,
    dirty: Vec<usize>,
    dirty_flags: Vec<bool>,
    clock: u64,
    configuration: Option<[f64; 3]>,
}
impl Medium {
    pub fn prepare(&mut self, field: &Field, c: &Config) {
        self.clock += 1;
        let configuration = [field.spacing, c.pressure_strength, c.movement_impedance];
        let reset =
            self.configuration != Some(configuration) || self.anchors.len() != field.nx * field.ny;
        self.configuration = Some(configuration);
        self.anchors.resize(field.nx * field.ny, [0.; 4]);
        self.revisions.resize(self.anchors.len(), 0);
        self.dirty.clear();
        self.dirty_flags.resize(self.anchors.len(), false);
        let update = |(n, (anchor, dirty)): (usize, (&mut [f64; 4], &mut bool))| {
            // Normalize by the existing force and mobility saturation scales. These
            // projections are dependencies, not new public fields or material stocks.
            let current = [
                field.attractive(n) / field.spacing,
                field.medium_signal(n)[1] / field.spacing,
                c.pressure_strength.sqrt() * field.mechanical_load(n),
                c.movement_impedance * (field.impedance[n] + field.source_load[n]),
            ];
            *dirty = reset
                || current
                    .iter()
                    .zip(anchor.iter())
                    .any(|(&a, &b)| changed(a, b, 1.) || (a == 0.) != (b == 0.) || a * b < 0.);
            if *dirty {
                *anchor = current;
            }
        };
        if crate::parallel::enabled(self.anchors.len(), 65536) {
            self.anchors
                .par_iter_mut()
                .zip(self.dirty_flags.par_iter_mut())
                .enumerate()
                .for_each(update);
        } else {
            self.anchors
                .iter_mut()
                .zip(self.dirty_flags.iter_mut())
                .enumerate()
                .for_each(update);
        }
        self.dirty.extend(
            self.dirty_flags
                .iter()
                .enumerate()
                .filter_map(|(n, &dirty)| dirty.then_some(n)),
        );
        for &n in &self.dirty {
            self.revisions[n] = self.clock;
            for neighbor in field.neighbors[n] {
                self.revisions[neighbor] = self.clock;
            }
        }
    }
    pub fn revision(&self, sites: &[(usize, f64)]) -> u64 {
        sites
            .iter()
            .map(|&(n, _)| self.revisions[n])
            .max()
            .unwrap_or(0)
    }
}
