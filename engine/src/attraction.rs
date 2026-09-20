//! Derived periodic attraction; material and chemical exposure remain local.
#[derive(Clone, Debug, Default)]
pub struct Attraction {
    geometry: (usize, usize, f64, f64),
    weights: Vec<f64>,
    input: Vec<f64>,
    temporary: Vec<f64>,
    pub output: Vec<f64>,
    pub revisions: u64,
}

fn add_pair(out: &mut [f64], input: &[f64], shift: usize, weight: f64) {
    let size = input.len();
    let (mut left, mut right, mut at) = (shift, (size - shift) % size, 0);
    while at < size {
        let count = (size - at).min(size - left).min(size - right);
        for ((q, a), b) in out[at..at + count]
            .iter_mut()
            .zip(&input[left..left + count])
            .zip(&input[right..right + count])
        {
            *q += weight * (a + b);
        }
        at += count;
        left = (left + count) % size;
        right = (right + count) % size;
    }
}

impl Attraction {
    pub fn prepare(&mut self, geometry: (usize, usize, f64, f64), rows: [&[[f64; 2]]; 3]) {
        let (nx, ny, spacing, length) = geometry;
        if length == 0. {
            return;
        }
        let mut changed = self.geometry != geometry;
        if changed {
            self.geometry = geometry;
            let radius = (3. * length / spacing).ceil() as isize;
            self.weights = (-radius..=radius)
                .map(|j| (-0.5 * (j as f64 * spacing / length).powi(2)).exp())
                .collect();
            let total: f64 = self.weights.iter().sum();
            for w in &mut self.weights {
                *w /= total;
            }
            self.input.resize(nx * ny, 0.);
            self.temporary.resize(nx * ny, 0.);
            self.output.resize(nx * ny, 0.);
        }
        let mut occupied = false;
        for (n, value) in self.input.iter_mut().enumerate() {
            let next = rows[0][n][0] + rows[1][n][0] + rows[2][n][0];
            changed |= *value != next;
            occupied |= next != 0.;
            *value = next;
        }
        if !changed {
            return;
        }
        self.revisions += 1;
        self.output.fill(0.);
        if !occupied {
            return;
        }
        let radius = self.weights.len() / 2;
        for (out, q) in self.temporary.iter_mut().zip(&self.input) {
            *out = self.weights[radius] * q;
        }
        // Even weights let opposite contributions share each output load and store.
        for (j, &weight) in self.weights[radius + 1..].iter().enumerate() {
            let shift = (j + 1) % nx;
            for (out, row) in self
                .temporary
                .chunks_exact_mut(nx)
                .zip(self.input.chunks_exact(nx))
            {
                add_pair(out, row, shift, weight);
            }
        }
        for (out, q) in self.output.iter_mut().zip(&self.temporary) {
            *out = self.weights[radius] * q;
        }
        for (j, &weight) in self.weights[radius + 1..].iter().enumerate() {
            let shift = (j + 1) % ny * nx;
            add_pair(&mut self.output, &self.temporary, shift, weight);
        }
    }
}

impl crate::field::Field {
    /// Compare actual combined input, including public diagnostic/intervention writes.
    pub fn prepare_attraction(&mut self) {
        self.attraction.prepare(
            (self.nx, self.ny, self.spacing, self.attraction_length),
            [&self.signal, &self.source_signal, &self.body_signal],
        );
        self.broad_attraction.prepare(
            (self.nx, self.ny, self.spacing, 2. * self.attraction_length),
            [&self.signal, &self.source_signal, &self.body_signal],
        );
    }

    pub(crate) fn attractive(&self, n: usize) -> f64 {
        if self.attraction_length == 0. {
            self.medium_signal(n)[0]
        } else {
            self.attraction_strength * (self.attraction.output[n] - self.broad_attraction.output[n])
        }
    }

    /// Material-supported cohesion; removing the supporting medium restores bare loss.
    pub(crate) fn retention(&self, n: usize, scale: f64) -> f64 {
        let [a, b] = self.medium_signal(n);
        let load = self.impedance[n] + self.source_load[n] + self.body_load[n];
        let cohesion = (a * self.attractive(n) - b * b).max(0.) / (1. + load.max(0.));
        crate::field::mobility(cohesion, scale)
    }
}
