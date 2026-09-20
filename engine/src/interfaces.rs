//! Shared compact contact geometry. No lineage labels or new encounter radius.
use crate::{chemistry::Chemistry, config::Config, movement, organism::Cell};

#[derive(Clone, Debug)]
pub struct Reading {
    pub field: f64,
    pub recognition: [[f64; 5]; 4],
    pub stress: f64,
}
impl Default for Reading {
    fn default() -> Self {
        Self {
            field: 1.,
            recognition: [[0.; 5]; 4],
            stress: 0.,
        }
    }
}
#[derive(Clone, Debug)]
pub struct Neighbor {
    pub donor: usize,
    pub weight: f64,
    pub direction: [f64; 4],
}
#[derive(Default, Debug, Clone)]
pub struct Graph {
    pub neighbors: Vec<Vec<Neighbor>>,
    pub field: Vec<f64>,
}
fn directions(a: &Cell, b: &Cell, c: &Config) -> [f64; 4] {
    let x = movement::delta(b.x - a.x, c.width);
    let y = movement::delta(b.y - a.y, c.height);
    let norm = x.hypot(y);
    if norm == 0. {
        return [0.25; 4];
    }
    let forward = (x * a.heading.cos() + y * a.heading.sin()) / norm;
    let left = (-x * a.heading.sin() + y * a.heading.cos()) / norm;
    [
        forward.max(0.),
        left.max(0.),
        (-forward).max(0.),
        (-left).max(0.),
    ]
}
impl Graph {
    pub fn new(cells: &[Cell], c: &Config) -> Self {
        let mut graph = Self {
            neighbors: vec![vec![]; cells.len()],
            field: vec![1.; cells.len()],
        };
        for (i, j) in movement::pairs(cells, c) {
            let (a, b) = (&cells[i], &cells[j]);
            let contact = (1.
                - movement::distance([a.x, a.y], [b.x, b.y], c) / (a.radius(c) + b.radius(c)))
            .max(0.);
            if contact == 0. {
                continue;
            }
            for (i, j) in [(i, j), (j, i)] {
                graph.field[i] += contact;
                graph.neighbors[i].push(Neighbor {
                    donor: j,
                    weight: contact,
                    direction: directions(&cells[i], &cells[j], c),
                });
            }
        }
        for (i, row) in graph.neighbors.iter_mut().enumerate() {
            graph.field[i] = 1. / graph.field[i];
            for n in row {
                n.weight *= graph.field[i];
            }
        }
        graph
    }
    pub fn prepare(&self, cells: &mut [Cell], c: &Config, chemistry: &Chemistry) {
        let readings: Vec<_> = (0..cells.len())
            .map(|i| self.reading(i, cells, c, chemistry))
            .collect();
        for (i, (cell, reading)) in cells.iter_mut().zip(readings).enumerate() {
            cell.interface = reading;
            cell.contacts = [0.; 4];
            for n in &self.neighbors[i] {
                for k in 0..4 {
                    cell.contacts[k] += n.weight * n.direction[k];
                }
            }
        }
    }
    pub fn reading(&self, i: usize, cells: &[Cell], c: &Config, chemistry: &Chemistry) -> Reading {
        let cell = &cells[i];
        let mut reading = Reading {
            field: self.field[i],
            ..Reading::default()
        };
        let operators = cell.operators.as_ref().unwrap();
        for n in &self.neighbors[i] {
            let donor = &cells[n.donor];
            let exposed = n.weight * donor.damage / donor.volume(c).max(1e-30);
            if exposed == 0. {
                continue;
            }
            for (slot, receptor) in operators.receptors.iter().enumerate() {
                let local = exposed
                    * receptor
                        .iter()
                        .map(|a| a.value * donor.inventory[a.species])
                        .sum::<f64>();
                reading.recognition[slot][0] += local;
                for k in 0..4 {
                    reading.recognition[slot][k + 1] += local * n.direction[k];
                }
            }
            let mut stress = donor
                .inventory
                .iter()
                .zip(&chemistry.properties)
                .map(|(q, p)| q * p.stress)
                .sum::<f64>();
            for a in operators.membrane.iter() {
                stress -= (1. - c.susceptibility_floor)
                    * a.value
                    * chemistry.properties[a.species].stress
                    * donor.inventory[a.species];
            }
            reading.stress += exposed * stress.max(0.);
        }
        reading
    }
    pub fn local(&self, i: usize, cells: &[Cell], c: &Config, field: &[f32; 256]) -> [f64; 256] {
        let mut result = field.map(|q| q as f64 * self.field[i]);
        for n in &self.neighbors[i] {
            let donor = &cells[n.donor];
            let gain = n.weight * donor.damage / donor.volume(c).max(1e-30);
            if gain == 0. {
                continue;
            }
            for (s, q) in donor.inventory.iter().enumerate() {
                result[s] += gain * q;
            }
        }
        result
    }
}
