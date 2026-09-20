//! Immutable local operators. Coordinates select coefficients once, never a reaction search.
use crate::{
    chemical_products::{ProductWeight, Transform},
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
    pub catalytic: f64,
    pub changed: f64,
    pub work: f64,
    pub heat: f64,
    pub potential_drop: f64,
    pub work_coefficient: [f64; 2],
}
impl Conversion {
    pub fn energy(&self, c: &Config, signal: [f64; 2]) -> [f64; 3] {
        let supplied = c.environmental_work
            * crate::transformation_work::engagement(self.work_coefficient, signal);
        crate::transformation_work::cellular(
            self.potential_drop,
            supplied,
            self.changed,
            c.conversion_efficiency,
        )
    }
}
#[derive(Clone, Debug)]
pub struct EnzymeOperator {
    pub conversions: Vec<Conversion>,
    pub engagement: Vec<Affinity>,
    pub primary: Option<crate::chemical_roles::Route>,
}
#[derive(Clone, Debug)]
pub struct Operators {
    pub receptors: [Arc<Vec<Affinity>>; 4],
    pub transporters: [Arc<Vec<Affinity>>; 4],
    pub enzymes: [Arc<EnzymeOperator>; 4],
    pub membrane: Arc<Vec<Affinity>>,
    pub profile: [f64; 3],
}
fn enzyme(e: crate::genetics::Enzyme, c: &Config, chemistry: &Chemistry) -> EnzymeOperator {
    let transform = Transform::new(e);
    let mut occupancy = [0.; 256];
    let mut conversions = Vec::new();
    for a in chemistry::compile_affinity([e.x, e.y], c.affinity_radius) {
        let products = transform.products(a.species);
        let displacement: f64 = products
            .iter()
            .map(|p| {
                p.weight
                    * chemistry::distance_squared(
                        chemistry::coordinate(a.species),
                        chemistry::coordinate(p.species),
                    )
            })
            .sum();
        let changed = products
            .iter()
            .filter(|p| p.species != a.species)
            .map(|p| p.weight)
            .sum::<f64>();
        let potential = chemistry.properties[a.species].potential
            + products
                .iter()
                .map(|p| {
                    p.weight
                        * (chemistry.properties[p.species].potential
                            - chemistry.properties[a.species].potential)
                })
                .sum::<f64>();
        let (work, heat) = chemistry::reaction_energy(
            chemistry.properties[a.species].potential,
            potential,
            c.conversion_efficiency,
        );
        occupancy[a.species] += a.value;
        for p in &products {
            occupancy[p.species] += a.value * p.weight;
        }
        let work_coefficient =
            crate::transformation_work::coefficient(chemistry, a.species, &products);
        conversions.push(Conversion {
            substrate: a.species,
            products,
            binding: a.value,
            catalytic: a.value
                * crate::transformation_work::kinetic(displacement, c.affinity_radius),
            changed,
            work: work - 0.05 * changed,
            heat: heat + 0.05 * changed,
            potential_drop: chemistry.properties[a.species].potential - potential,
            work_coefficient,
        });
    }
    let engagement = occupancy
        .into_iter()
        .enumerate()
        .filter(|(_, v)| *v > 0.)
        .map(|(species, value)| Affinity { species, value })
        .collect();
    EnzymeOperator {
        primary: crate::chemical_roles::strongest(&conversions),
        conversions,
        engagement,
    }
}
impl Operators {
    /// Completed slots borrow target operators even while other slots remain partially installed.
    pub fn refit(
        &mut self,
        before: &Machinery,
        after: &Machinery,
        target: (&Machinery, &Self),
        c: &Config,
        chemistry: &Chemistry,
    ) {
        let (target, compiled) = target;
        let mut pending = before.clone();
        for i in 0..4 {
            if after.receptors[i] == target.receptors[i]
                && before.receptors[i] != after.receptors[i]
            {
                self.receptors[i] = compiled.receptors[i].clone();
                pending.receptors[i] = after.receptors[i];
            }
            if after.transporters[i] == target.transporters[i]
                && before.transporters[i] != after.transporters[i]
            {
                self.transporters[i] = compiled.transporters[i].clone();
                pending.transporters[i] = after.transporters[i];
            }
            if after.enzymes[i] == target.enzymes[i] && before.enzymes[i] != after.enzymes[i] {
                self.enzymes[i] = compiled.enzymes[i].clone();
                pending.enzymes[i] = after.enzymes[i];
            }
        }
        if after.membrane == target.membrane && before.membrane != after.membrane {
            self.membrane = compiled.membrane.clone();
            self.profile = compiled.profile;
            pending.membrane = after.membrane;
        }
        self.update(&pending, after, c, chemistry);
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
                .map(|a| {
                    a.value * crate::medium_response::profile(&chemistry.properties[a.species])[k]
                })
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
                    .map(|a| {
                        a.value
                            * crate::medium_response::profile(&chemistry.properties[a.species])[k]
                    })
                    .sum::<f64>()
                    / total
            });
        }
    }
}
