//! Immutable local operators. Coordinates select coefficients once, never a reaction search.
use crate::{
    chemical_products::{ProductWeight, product_neighborhood},
    chemistry::{self, Affinity, Chemistry},
    config::Config,
    genetics::Machinery,
};
use std::sync::Arc;

#[derive(Clone, Debug)]
pub struct Conversion {
    pub substrate: usize,
    pub products: Vec<ProductWeight>,
    pub binding: f64,
    pub changed: f64,
    pub work: f64,
    pub heat: f64,
}
#[derive(Clone, Debug)]
pub struct EnzymeOperator {
    pub conversions: Vec<Conversion>,
    pub engagement: Vec<Affinity>,
    pub attenuation: f64,
}
#[derive(Clone, Debug)]
pub struct Operators {
    pub receptors: [Arc<Vec<Affinity>>; 4],
    pub transporters: [Arc<Vec<Affinity>>; 4],
    pub enzymes: [Arc<EnzymeOperator>; 4],
    pub membrane: Arc<Vec<Affinity>>,
    pub profile: [f64; 2],
}
fn enzyme(e: crate::genetics::Enzyme, c: &Config, chemistry: &Chemistry) -> EnzymeOperator {
    let mut occupancy = [0.; 256];
    let mut conversions = Vec::new();
    for a in chemistry::compile_affinity([e.x, e.y], c.affinity_radius) {
        let products = product_neighborhood(a.species, [e.dx, e.dy]);
        let changed = 1.
            - products
                .iter()
                .filter(|p| p.species == a.species)
                .map(|p| p.weight)
                .sum::<f64>();
        let potential = products
            .iter()
            .map(|p| p.weight * chemistry.properties[p.species].potential)
            .sum();
        let (work, heat) = chemistry::reaction_energy(
            chemistry.properties[a.species].potential,
            potential,
            c.conversion_efficiency,
        );
        occupancy[a.species] += a.value;
        for p in &products {
            occupancy[p.species] += a.value * p.weight;
        }
        conversions.push(Conversion {
            substrate: a.species,
            products,
            binding: a.value,
            changed,
            work: work - 0.05 * changed,
            heat: heat + 0.05 * changed,
        });
    }
    let engagement = occupancy
        .into_iter()
        .enumerate()
        .filter(|(_, v)| *v > 0.)
        .map(|(species, value)| Affinity { species, value })
        .collect();
    EnzymeOperator {
        conversions,
        engagement,
        attenuation: 1. / (1. + (e.dx * e.dx + e.dy * e.dy) / 9.),
    }
}
impl Operators {
    /// A completed paid refit can borrow already compiled target slots; untouched slots stay shared.
    pub fn complete_refit(&mut self, before: &Machinery, target: &Machinery, compiled: &Self) {
        for i in 0..4 {
            if before.receptors[i] != target.receptors[i] {
                self.receptors[i] = compiled.receptors[i].clone();
            }
            if before.transporters[i] != target.transporters[i] {
                self.transporters[i] = compiled.transporters[i].clone();
            }
            if before.enzymes[i] != target.enzymes[i] {
                self.enzymes[i] = compiled.enzymes[i].clone();
            }
        }
        if before.membrane != target.membrane {
            self.membrane = compiled.membrane.clone();
            self.profile = compiled.profile;
        }
    }
    pub fn compile(m: &Machinery, c: &Config, chemistry: &Chemistry) -> Self {
        let membrane = Arc::new(chemistry::compile_affinity(
            m.membrane.point(),
            c.affinity_radius,
        ));
        let total = membrane.iter().map(|a| a.value).sum::<f64>();
        let profile = std::array::from_fn(|k| {
            membrane
                .iter()
                .map(|a| a.value * chemistry.properties[a.species].interaction[k])
                .sum::<f64>()
                / total
        });
        Self {
            receptors: std::array::from_fn(|i| {
                Arc::new(chemistry::compile_affinity(
                    m.receptors[i].point(),
                    c.affinity_radius,
                ))
            }),
            transporters: std::array::from_fn(|i| {
                Arc::new(chemistry::compile_affinity(
                    [m.transporters[i].x, m.transporters[i].y],
                    c.affinity_radius,
                ))
            }),
            enzymes: std::array::from_fn(|i| Arc::new(enzyme(m.enzymes[i], c, chemistry))),
            membrane,
            profile,
        }
    }
    /// Refit preserves every unaffected allocation, including across inherited target changes.
    pub fn update(
        &mut self,
        before: &Machinery,
        after: &Machinery,
        c: &Config,
        chemistry: &Chemistry,
    ) {
        for i in 0..4 {
            if before.receptors[i] != after.receptors[i] {
                self.receptors[i] = Arc::new(chemistry::compile_affinity(
                    after.receptors[i].point(),
                    c.affinity_radius,
                ));
            }
            if before.transporters[i] != after.transporters[i] {
                self.transporters[i] = Arc::new(chemistry::compile_affinity(
                    [after.transporters[i].x, after.transporters[i].y],
                    c.affinity_radius,
                ));
            }
            if before.enzymes[i] != after.enzymes[i] {
                self.enzymes[i] = Arc::new(enzyme(after.enzymes[i], c, chemistry));
            }
        }
        if before.membrane != after.membrane {
            self.membrane = Arc::new(chemistry::compile_affinity(
                after.membrane.point(),
                c.affinity_radius,
            ));
            let total = self.membrane.iter().map(|a| a.value).sum::<f64>();
            self.profile = std::array::from_fn(|k| {
                self.membrane
                    .iter()
                    .map(|a| a.value * chemistry.properties[a.species].interaction[k])
                    .sum::<f64>()
                    / total
            });
        }
    }
}
