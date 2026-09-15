//! One discrete functional supplies extracellular potentials and embodied responses.
use crate::{
    chemistry::{Chemistry, SPECIES, affinity},
    config::Config,
    disk::{self, Weight},
    field::Field,
    genetics::Genotype,
    organism::Cell,
    spatial_energy::{self, Energy, SpatialLaw, Sum},
    spatial_kernel::Kernel,
};
use std::collections::BTreeMap;

#[derive(Clone, Debug)]
pub struct Body {
    pub weights: Vec<Weight>,
    pub profile: [f64; 2],
    pub self_potential: Vec<f64>,
    pub self_energy: f64,
    key: [f64; 3],
}

#[derive(Clone, Debug)]
pub struct Interaction {
    pub law: SpatialLaw,
    pub density: Vec<f64>,
    pub resistance: Vec<f64>,
    pub potential: Vec<[f64; 2]>,
    pub bodies: Vec<Body>,
    projection: Vec<[f64; 2]>,
    scratch: Vec<[f64; 2]>,
    kernel: Kernel,
    internal: Energy,
}

impl Interaction {
    pub fn new(field: &Field, law: SpatialLaw) -> Self {
        let n = field.nx * field.ny;
        Self {
            law,
            density: vec![0.; n],
            resistance: vec![1.; n],
            potential: vec![[0.; 2]; n],
            bodies: vec![],
            projection: vec![[0.; 2]; n],
            scratch: vec![[0.; 2]; n],
            kernel: Kernel::new(field.nx, field.ny, field.spacing, law.range),
            internal: Energy::default(),
        }
    }
    pub fn prepare_bodies(
        &mut self,
        field: &Field,
        cells: &[Cell],
        genomes: &BTreeMap<u64, Genotype>,
        chemistry: &Chemistry,
        c: &Config,
    ) {
        self.bodies.truncate(cells.len());
        self.internal = Energy::default();
        for (i, cell) in cells.iter().enumerate() {
            self.internal.add(spatial_energy::internal(
                cell,
                chemistry,
                c,
                self.law.crowding,
            ));
            let key = [cell.x, cell.y, cell.radius(c)];
            if i == self.bodies.len() {
                self.bodies.push(Body {
                    weights: vec![],
                    profile: [0.; 2],
                    self_potential: vec![],
                    self_energy: 0.,
                    key: [f64::NAN; 3],
                });
            }
            let b = &mut self.bodies[i];
            if b.key != key {
                b.weights = disk::weights(field, key[0], key[1], key[2]);
                b.self_potential = b
                    .weights
                    .iter()
                    .map(|a| {
                        b.weights
                            .iter()
                            .map(|v| v.value * self.kernel.pair(a.node, v.node))
                            .sum()
                    })
                    .collect();
                b.key = key;
            }
            let membrane = genomes[&cell.machinery_genome]
                .compiled
                .as_ref()
                .unwrap()
                .chromosome
                .chemistry
                .membrane
                .point();
            b.profile = chemistry
                .profiles
                .evaluate(membrane)
                .map(|q| q * cell.mass());
            for (s, amount) in cell.inventory.iter().enumerate() {
                let exposure = 0.05 + 0.95 * affinity(membrane, s, 3.);
                for k in 0..2 {
                    b.profile[k] += amount * exposure * chemistry.properties[s].interaction[k];
                }
            }
            b.self_energy = 0.5
                * self.law.metric(b.profile, b.profile)
                * b.weights
                    .iter()
                    .zip(&b.self_potential)
                    .map(|(w, p)| w.value * p)
                    .sum::<f64>();
        }
    }
    /// Reuse buffers for either committed f32 amounts or the exact f64 proposal.
    pub fn evaluate<T: Copy + Into<f64>>(
        &mut self,
        amounts: &[T],
        chemistry: &Chemistry,
        cells: &[Cell],
        c: &Config,
    ) -> Energy {
        let properties = crate::field_reductions::properties(chemistry);
        let area = self.kernel.area;
        let reductions = amounts
            .chunks_exact(SPECIES)
            .map(|node| crate::spatial_numeric::project(node, &properties, area));
        self.evaluate_nodes(reductions, cells, c)
    }
    pub fn evaluate_cached(
        &mut self,
        field: &Field,
        chemistry: &Chemistry,
        cells: &[Cell],
        c: &Config,
    ) -> Energy {
        let nodes = field.thermodynamics(chemistry);
        self.evaluate_nodes(nodes.iter().copied(), cells, c)
    }
    pub fn evaluate_nodes(
        &mut self,
        nodes: impl Iterator<Item = crate::field_reductions::Node>,
        cells: &[Cell],
        c: &Config,
    ) -> Energy {
        let area = self.kernel.area;
        let mut result = Energy::default();
        let mut totals = [Sum::default(); 3];
        for (i, [n, u, entropy, resistance, vx, vy, _]) in nodes.enumerate() {
            self.density[i] = n / area;
            self.resistance[i] = 1. + resistance / area;
            self.projection[i] = [vx / area, vy / area];
            let physical = u + self.law.crowding * n.powi(3) / (3. * area * area);
            totals[0].add(n);
            totals[1].add(physical);
            totals[2].add(physical + entropy);
        }
        result.material = totals[0].get();
        result.physical = totals[1].get();
        result.free = totals[2].get();
        for b in &self.bodies {
            for w in &b.weights {
                for k in 0..2 {
                    self.projection[w.node][k] += b.profile[k] * w.value / area;
                }
            }
        }
        self.kernel
            .convolve(&self.projection, &mut self.scratch, &mut self.potential);
        let mut interaction = Sum::default();
        for (v, p) in self.projection.iter().zip(&self.potential) {
            interaction.add(0.5 * area * self.law.metric(*v, *p));
        }
        for b in &self.bodies {
            interaction.add(-b.self_energy);
        }
        result.stored(interaction.get());
        result.add(self.internal);
        result.stored(self.contact_energy(cells, c));
        result
    }
    pub fn excess(&self, node: usize, profile: [f64; 2]) -> f64 {
        self.law.metric(profile, self.potential[node])
            + self.law.crowding * self.density[node].powi(2)
    }
    pub fn response(&self, i: usize) -> ([f64; 2], f64, [f64; 2]) {
        let b = &self.bodies[i];
        let (mut force, mut radial, mut sampled) = ([0.; 2], 0., [0.; 2]);
        for (w, own) in b.weights.iter().zip(&b.self_potential) {
            let outside = [
                self.potential[w.node][0] - b.profile[0] * own,
                self.potential[w.node][1] - b.profile[1] * own,
            ];
            let e = self.law.metric(b.profile, outside);
            force[0] -= w.dx * e;
            force[1] -= w.dy * e;
            radial += w.dr * e;
            for k in 0..2 {
                sampled[k] += w.value * outside[k];
            }
        }
        (force, radial, sampled)
    }
    pub fn body_resistance(&self, i: usize) -> f64 {
        self.bodies[i]
            .weights
            .iter()
            .map(|w| w.value * self.resistance[w.node])
            .sum()
    }
    pub fn contact_energy(&self, cells: &[Cell], c: &Config) -> f64 {
        let index = crate::movement::Spatial::new(c, cells);
        let mut near = vec![];
        let mut result = Sum::default();
        for (i, a) in cells.iter().enumerate() {
            index.near(a.x, a.y, &mut near);
            for &j in &near {
                if j <= i {
                    continue;
                }
                let b = &cells[j];
                let d = crate::movement::distance([a.x, a.y], [b.x, b.y], c);
                let overlap = (index.radii[i] + index.radii[j] - d).max(0.);
                result.add(0.5 * self.law.contact * overlap * overlap);
            }
        }
        result.get()
    }
}
