//! Finite-support mechanical convolution over owned carrier support.
#[path = "attraction_intervals.rs"]
mod intervals;
#[derive(Clone, Debug, Default)]
struct Support {
    values: Vec<f64>,
    nodes: Vec<usize>,
    listed: Vec<bool>,
}
impl Support {
    fn reset(&mut self, count: usize) {
        for n in self.nodes.drain(..) {
            self.values[n] = 0.;
            self.listed[n] = false;
        }
        self.values.resize(count, 0.);
        self.listed.resize(count, false);
    }
    fn add(&mut self, node: usize, value: f64) {
        if !self.listed[node] {
            self.listed[node] = true;
            self.nodes.push(node);
        }
        self.values[node] += value;
    }
}
#[derive(Clone, Debug, Default)]
pub struct Attraction {
    geometry: (usize, usize, f64, f64),
    anchors: [u64; 3],
    input: Support,
    temporary: Support,
    events: intervals::Events,
    pub output: Vec<f64>,
    output_nodes: Vec<usize>,
    pub revisions: u64,
    pub visited: usize,
}

impl Attraction {
    pub fn prepare(
        &mut self,
        geometry: (usize, usize, f64, f64),
        rows: [&crate::spatial_signal::Signal; 3],
    ) {
        let (nx, ny, spacing, length) = geometry;
        let revisions = rows.map(|row| row.revision);
        if self.geometry == geometry && self.anchors == revisions {
            return;
        }
        self.anchors = revisions;
        self.geometry = geometry;
        self.revisions += 1;
        self.visited = 0;
        for n in self.output_nodes.drain(..) {
            self.output[n] = 0.;
        }
        self.output.resize(nx * ny, 0.);
        if length == 0. {
            return;
        }
        self.input.reset(nx * ny);
        for row in rows {
            for &n in &row.nodes {
                self.input.add(n, row[n][0]);
            }
        }
        for direction in [0, 0, 0, 1, 1, 1] {
            self.visited += self.input.nodes.len();
            self.events.axis(
                &mut self.temporary,
                &self.input,
                [nx, ny],
                length / spacing,
                direction,
            );
            std::mem::swap(&mut self.input, &mut self.temporary);
        }
        for &n in &self.input.nodes {
            self.output[n] = self.input.values[n];
            self.output_nodes.push(n);
        }
    }
}

impl crate::field::Field {
    /// Every carrier write records support and a revision, including explicit interventions.
    pub fn prepare_attraction(&mut self) {
        if self.mechanical_frozen {
            return;
        }
        self.signal.compact();
        self.source_signal.compact();
        self.body_signal.compact();
        let rows = [&self.signal, &self.source_signal, &self.body_signal];
        self.attraction.prepare(
            (self.nx, self.ny, self.spacing, self.attraction_length),
            rows,
        );
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
