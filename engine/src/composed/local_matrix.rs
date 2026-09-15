//! Sparse geographic W, indexed by node for both sampling and transposed delivery.
use super::bodies::Cloud;
#[derive(Default)]
pub struct LocalMatrix {
    pub nodes: Vec<usize>,
    offsets: Vec<usize>,
    cursor: Vec<usize>,
    entries: Vec<(usize, f64)>,
}
impl LocalMatrix {
    pub fn rebuild(&mut self, clouds: &[Cloud], count: usize) {
        self.nodes.clear();
        self.offsets.resize(count + 1, 0);
        self.offsets.fill(0);
        for cloud in clouds {
            for &(node, weight) in &cloud.weights {
                if weight > 0. {
                    self.offsets[node + 1] += 1;
                }
            }
        }
        for node in 0..count {
            if self.offsets[node + 1] > 0 {
                self.nodes.push(node);
            }
            self.offsets[node + 1] += self.offsets[node];
        }
        self.entries.resize(self.offsets[count], (0, 0.));
        self.cursor.clone_from(&self.offsets);
        for (cell, cloud) in clouds.iter().enumerate() {
            for &(node, weight) in &cloud.weights {
                if weight > 0. {
                    self.entries[self.cursor[node]] = (cell, weight);
                    self.cursor[node] += 1;
                }
            }
        }
    }
    pub fn transpose(&self, node: usize, cells: &[[f64; 256]], out: &mut [f64; 256]) {
        out.fill(0.);
        for &(cell, weight) in &self.entries[self.offsets[node]..self.offsets[node + 1]] {
            super::numeric::add_scaled(&cells[cell], weight, out);
        }
    }
    pub fn gather(&self, node: usize, row: &[f64; 256], cells: &mut [[f64; 256]]) {
        for &(cell, weight) in &self.entries[self.offsets[node]..self.offsets[node + 1]] {
            super::numeric::add_scaled(row, weight, &mut cells[cell]);
        }
    }
    pub fn owned_bytes(&self) -> usize {
        (self.nodes.capacity() + self.offsets.capacity() + self.cursor.capacity())
            * size_of::<usize>()
            + self.entries.capacity() * size_of::<(usize, f64)>()
    }
}
