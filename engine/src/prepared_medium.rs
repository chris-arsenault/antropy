//! Coefficient dependencies are queried at occupied footprints, never discovered by a map scan.
use crate::{config::Config, execution::changed, field::Field};

#[derive(Clone, Debug, Default)]
pub(super) struct Medium {
    anchors: Vec<[f64; 4]>,
    revisions: Vec<u64>,
    sampled: Vec<u64>,
    clock: u64,
    configuration: Option<[f64; 3]>,
}
impl Medium {
    pub fn prepare(&mut self, field: &Field, c: &Config) {
        self.clock += 1;
        let configuration = [field.spacing, c.pressure_strength, c.movement_impedance];
        if self.configuration != Some(configuration) || self.anchors.len() != field.nx * field.ny {
            self.anchors = vec![[f64::NAN; 4]; field.nx * field.ny];
            self.revisions = vec![0; self.anchors.len()];
            self.sampled = vec![0; self.anchors.len()];
            self.configuration = Some(configuration);
        }
    }
    fn node(&mut self, n: usize, field: &Field, c: &Config) -> u64 {
        if self.sampled[n] == self.clock {
            return self.revisions[n];
        }
        self.sampled[n] = self.clock;
        let current = [
            field.attractive(n) / field.spacing,
            field.medium_signal(n)[1] / field.spacing,
            c.pressure_strength.sqrt() * field.mechanical_load(n),
            c.movement_impedance * (field.impedance[n] + field.source_load[n]),
        ];
        if current
            .iter()
            .zip(self.anchors[n])
            .any(|(&a, b)| changed(a, b, 1.) || (a == 0.) != (b == 0.) || a * b < 0.)
        {
            self.anchors[n] = current;
            self.revisions[n] = self.clock;
        }
        self.revisions[n]
    }
    pub fn revision(&mut self, sites: &[(usize, f64)], field: &Field, c: &Config) -> u64 {
        let mut revision = 0;
        for &(n, _) in sites {
            revision = revision.max(self.node(n, field, c));
            for adjacent in field.neighbors[n] {
                revision = revision.max(self.node(adjacent, field, c));
            }
        }
        revision
    }
}
