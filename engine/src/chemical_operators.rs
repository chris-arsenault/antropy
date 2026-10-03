//! Immutable local operators. Coordinates select coefficients once, never a reaction search.
use crate::{
    chemical_products::Transform,
    chemistry::{self, Affinity, Chemistry},
    config::Config,
    genetics::Machinery,
};
use std::sync::Arc;
#[path = "reaction_products.rs"]
mod product_storage;
use product_storage::ProductPool;
#[path = "reaction_rows.rs"]
mod rows;
use rows::CompiledRow;
pub use rows::{Conversion, Conversions};
#[path = "reaction_batch.rs"]
mod batch;
#[derive(Clone, Debug, Default)]
pub struct EnzymeOperator {
    pub conversions: Conversions,
    pub engagement: Vec<Affinity>,
    pub primary: Option<crate::chemical_roles::Route>,
    pub(crate) definition: Option<chemistry::PropertyTable>,
}
#[derive(Clone, Debug)]
pub struct Operators {
    scales: [f64; 2],
    configuration: Arc<Machinery>,
    pub receptors: [Arc<Vec<Affinity>>; 4],
    pub transporters: [Arc<Vec<Affinity>>; 4],
    pub enzymes: [Arc<EnzymeOperator>; crate::organism::MAX_ENZYMES],
    pub membrane: Arc<Vec<Affinity>>,
    pub profile: [f64; 3],
}
fn recognition(m: &Machinery, site: usize, point: [f64; 2], c: &Config) -> Vec<Affinity> {
    match &m.keys {
        Some(keys) => keys.site(site).compile(c.binding_lambda),
        None => chemistry::compile_affinity(point, c.affinity_radius),
    }
}
fn profile(membrane: &[Affinity], chemistry: &Chemistry) -> [f64; 3] {
    let total = membrane.iter().map(|a| a.value).sum::<f64>();
    std::array::from_fn(|k| {
        if total == 0. {
            return 0.;
        }
        membrane
            .iter()
            .map(|a| a.value * crate::medium_response::profile(&chemistry.properties[a.species])[k])
            .sum::<f64>()
            / total
    })
}
fn enzyme(
    e: crate::genetics::Enzyme,
    affinities: Vec<Affinity>,
    c: &Config,
    chemistry: &Chemistry,
) -> EnzymeOperator {
    let transform = Transform::new(e);
    let (product_data, ranges) =
        ProductPool::compile(&transform, affinities.iter().map(|a| a.species));
    let product_data = Arc::new(product_data);
    let mut occupancy = [0.; 256];
    let mut conversions = Vec::with_capacity(affinities.len());
    for (a, range) in affinities.into_iter().zip(ranges) {
        let products = product_data.view(range.clone());
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
        conversions.push(CompiledRow {
            substrate: a.species,
            products: range,
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
    let conversions = Conversions::new(conversions, product_data);
    EnzymeOperator {
        primary: crate::chemical_roles::strongest(&conversions),
        conversions,
        engagement,
        definition: Some(chemistry.properties.clone()),
    }
}
impl Operators {
    pub fn chemistry(&self) -> &Machinery {
        &self.configuration
    }
    pub fn compile(m: &Machinery, c: &Config, chemistry: &Chemistry) -> Self {
        let membrane = Arc::new(recognition(m, 16, m.membrane.point(), c));
        let profile = profile(&membrane, chemistry);
        Self {
            scales: [c.affinity_radius, c.binding_lambda],
            configuration: Arc::new(m.clone()),
            receptors: std::array::from_fn(|i| {
                Arc::new(recognition(m, i, m.receptors[i].point(), c))
            }),
            transporters: std::array::from_fn(|i| {
                Arc::new(recognition(
                    m,
                    4 + i,
                    [m.transporters[i].x, m.transporters[i].y],
                    c,
                ))
            }),
            enzymes: std::array::from_fn(|i| {
                Arc::new(if m.programs[i] {
                    enzyme(
                        m.enzymes[i],
                        recognition(m, 8 + i, [m.enzymes[i].x, m.enzymes[i].y], c),
                        c,
                        chemistry,
                    )
                } else {
                    EnzymeOperator::default()
                })
            }),
            membrane,
            profile,
        }
    }
    /// Birth compilation shares every unchanged operator with the parent genotype.
    pub fn update(
        &mut self,
        before: &Machinery,
        after: &Machinery,
        c: &Config,
        chemistry: &Chemistry,
    ) {
        if self.scales != [c.affinity_radius, c.binding_lambda] {
            *self = Self::compile(after, c, chemistry);
            return;
        }
        let key_changed = |site| {
            before.keys.as_ref().map(|k| k.site(site)) != after.keys.as_ref().map(|k| k.site(site))
        };
        self.configuration = Arc::new(after.clone());
        for i in 0..4 {
            if before.receptors[i] != after.receptors[i] || key_changed(i) {
                self.receptors[i] = Arc::new(recognition(after, i, after.receptors[i].point(), c));
            }
            if before.transporters[i] != after.transporters[i] || key_changed(4 + i) {
                self.transporters[i] = Arc::new(recognition(
                    after,
                    4 + i,
                    [after.transporters[i].x, after.transporters[i].y],
                    c,
                ));
            }
        }
        for i in 0..crate::organism::MAX_ENZYMES {
            if before.programs[i] != after.programs[i]
                || (after.programs[i] && before.enzymes[i] != after.enzymes[i])
                || (after.programs[i] && key_changed(8 + i))
            {
                self.enzymes[i] = Arc::new(if after.programs[i] {
                    enzyme(
                        after.enzymes[i],
                        recognition(after, 8 + i, [after.enzymes[i].x, after.enzymes[i].y], c),
                        c,
                        chemistry,
                    )
                } else {
                    EnzymeOperator::default()
                });
            }
        }
        if before.membrane != after.membrane || key_changed(16) {
            self.membrane = Arc::new(recognition(after, 16, after.membrane.point(), c));
            self.profile = profile(&self.membrane, chemistry);
        }
    }
}
