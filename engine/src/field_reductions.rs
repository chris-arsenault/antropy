//! Canonical derived node reductions. Every changed node is reduced from its stored amounts.
use crate::chemistry::{Chemistry, SPECIES};

pub type Node = [f64; 7]; // material, reference E, ideal F, impedance/12, q0, q1, stress

pub fn properties(chemistry: &Chemistry) -> [[f64; SPECIES]; 5] {
    std::array::from_fn(|j| {
        std::array::from_fn(|s| {
            let p = &chemistry.properties[s];
            match j {
                0 => p.potential,
                1 => p.impedance / 12.,
                2 | 3 => p.interaction[j - 2],
                _ => p.stress,
            }
        })
    })
}

#[derive(Clone, Debug, Default)]
pub struct Cache {
    pub nodes: Vec<Node>,
    dirty: Vec<bool>,
}
impl Cache {
    pub fn install(&mut self, nodes: &mut Vec<Node>) {
        std::mem::swap(&mut self.nodes, nodes);
        self.dirty.resize(self.nodes.len(), false);
        self.dirty.fill(false);
    }
    pub fn invalidate(&mut self) {
        self.dirty.fill(true);
    }
    pub fn changed(&mut self, i: usize) {
        if let Some(dirty) = self.dirty.get_mut(i) {
            *dirty = true;
        }
    }
    pub fn update(&mut self, amounts: &[f32], area: f64, chemistry: &Chemistry) {
        let n = amounts.len() / SPECIES;
        if self.nodes.len() != n {
            self.nodes.resize(n, [0.; 7]);
            self.dirty.resize(n, true);
        }
        let properties = properties(chemistry);
        for (i, dirty) in self.dirty.iter_mut().enumerate() {
            if *dirty {
                self.nodes[i] = crate::spatial_numeric::project(
                    &amounts[i * SPECIES..(i + 1) * SPECIES],
                    &properties,
                    area,
                );
                *dirty = false;
            }
        }
    }
}
