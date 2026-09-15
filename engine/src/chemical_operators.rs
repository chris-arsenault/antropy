//! Canonical compiled coefficients for the selected computable chemistry laws.
use crate::{
    chemical_products::{ProductWeight, RECOGNITION_RADIUS, product_neighborhood},
    chemistry::{self, Affinity, Chemistry, SPECIES, compile_affinity},
    composed::{EFFICIENCY, WORK_PRICE},
    machinery_parameters::{EnzymeParameters, InstalledParameters, MachineryParameters},
};
use std::sync::Arc;

pub const OPERATOR_VERSION: u32 = 3;
pub const MAX_SUPPORT: usize = 36;
pub const MAX_CONVERSIONS: usize = 4 * MAX_SUPPORT;
pub const MAX_PRODUCTS: usize = 4 * MAX_CONVERSIONS;

/// Exact definition bytes are shared once; live amounts and budgets never enter a key.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct OperatorKey {
    pub operator_version: u32,
    pub definition_version: u32,
    pub definition: Arc<[u8]>,
    pub parameters: Box<[u8]>,
    pub installed_revision: Option<u64>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Conversion {
    pub substrate: usize,
    pub binding: f64,
    pub attenuation: f64,
    pub products: Box<[ProductWeight]>,
    pub work: f64,
    pub heat: f64,
}

#[derive(Clone, Debug, PartialEq)]
pub struct CompiledOperators {
    pub key: OperatorKey,
    pub receptors: [Box<[Affinity]>; 4],
    pub transporters: [Box<[Affinity]>; 4],
    pub enzymes: [Box<[Conversion]>; 4],
    pub engagement: [Box<[Affinity]>; 4],
    pub membrane: [f64; 2],
    pub profile: [f64; 2],
    pub stress: [f64; SPECIES],
}

fn bindings(point: [f64; 2]) -> Box<[Affinity]> {
    compile_affinity(point, RECOGNITION_RADIUS).into_boxed_slice()
}
fn enzyme(parameters: EnzymeParameters, chemistry: &Chemistry) -> Box<[Conversion]> {
    let offset = parameters.offset;
    bindings(parameters.center.point())
        .iter()
        .map(|a| {
            let products = product_neighborhood(a.species, offset).into_boxed_slice();
            let output = products
                .iter()
                .map(|p| p.weight * chemistry.properties[p.species].potential)
                .sum();
            let (work, heat) = chemistry::reaction_energy(
                chemistry.properties[a.species].potential,
                output,
                EFFICIENCY,
            );
            Conversion {
                substrate: a.species,
                binding: a.value,
                attenuation: 1. / (1. + (offset[0] * offset[0] + offset[1] * offset[1]) / 9.),
                products,
                work: work - WORK_PRICE,
                heat: heat + WORK_PRICE,
            }
        })
        .collect()
}

/// Compose substrate recognition with the transpose of the product map once.
fn engagement(maps: &[Conversion]) -> Box<[Affinity]> {
    let mut coefficients = [0.; SPECIES];
    for map in maps {
        coefficients[map.substrate] += map.binding;
        for p in &map.products {
            coefficients[p.species] += map.binding * p.weight;
        }
    }
    coefficients
        .into_iter()
        .enumerate()
        .filter(|(_, value)| *value > 0.)
        .map(|(species, value)| Affinity { species, value })
        .collect()
}

/// Validate/serialize one borrowed definition once, including during installed-state rebuilding.
pub struct OperatorCompiler<'a> {
    chemistry: &'a Chemistry,
    definition: Arc<[u8]>,
}
impl<'a> OperatorCompiler<'a> {
    pub fn new(chemistry: &'a Chemistry) -> Result<Self, String> {
        chemistry.validate()?;
        let definition = postcard::to_stdvec(chemistry)
            .map_err(|e| e.to_string())?
            .into();
        Ok(Self {
            chemistry,
            definition,
        })
    }
    pub fn compile_target(
        &self,
        parameters: &MachineryParameters,
    ) -> Result<CompiledOperators, String> {
        self.compile(parameters, None)
    }
    pub fn compile_installed(
        &self,
        installed: &InstalledParameters,
    ) -> Result<CompiledOperators, String> {
        self.compile(&installed.parameters, Some(installed.revision))
    }
    /// Rebuild only coefficients whose installed inputs changed; retain other allocations.
    pub fn refresh_installed(
        &self,
        operators: &mut CompiledOperators,
        installed: &InstalledParameters,
    ) -> Result<(), String> {
        let p = &installed.parameters;
        p.validate()?;
        if operators.key.operator_version != OPERATOR_VERSION
            || !(Arc::ptr_eq(&operators.key.definition, &self.definition)
                || operators.key.definition == self.definition)
        {
            *operators = self.compile_installed(installed)?;
            return Ok(());
        }
        let previous: MachineryParameters =
            postcard::from_bytes(&operators.key.parameters).map_err(|e| e.to_string())?;
        let parameters = postcard::to_stdvec(p)
            .map_err(|e| e.to_string())?
            .into_boxed_slice();
        for slot in 0..4 {
            if p.receptors[slot] != previous.receptors[slot] {
                operators.receptors[slot] = bindings(p.receptors[slot].point());
            }
            if p.transporters[slot] != previous.transporters[slot] {
                operators.transporters[slot] = bindings(p.transporters[slot].center.point());
            }
            if p.enzymes[slot] != previous.enzymes[slot] {
                operators.enzymes[slot] = enzyme(p.enzymes[slot], self.chemistry);
                operators.engagement[slot] = engagement(&operators.enzymes[slot]);
            }
        }
        if p.membrane != previous.membrane {
            operators.membrane = p.membrane.point();
            operators.profile = self.chemistry.profiles.evaluate(operators.membrane);
            operators.stress = std::array::from_fn(|s| {
                self.chemistry.properties[s].stress
                    * (1. - 0.95 * chemistry::affinity(operators.membrane, s, 3.))
            });
        }
        operators.key.parameters = parameters;
        operators.key.installed_revision = Some(installed.revision);
        Ok(())
    }
    fn compile(
        &self,
        p: &MachineryParameters,
        revision: Option<u64>,
    ) -> Result<CompiledOperators, String> {
        p.validate()?;
        let membrane = p.membrane.point();
        let enzymes = p.enzymes.map(|e| enzyme(e, self.chemistry));
        let engagement = enzymes.each_ref().map(|maps| engagement(maps));
        Ok(CompiledOperators {
            key: OperatorKey {
                operator_version: OPERATOR_VERSION,
                definition_version: self.chemistry.version,
                definition: Arc::clone(&self.definition),
                parameters: postcard::to_stdvec(p)
                    .map_err(|e| e.to_string())?
                    .into_boxed_slice(),
                installed_revision: revision,
            },
            receptors: p.receptors.map(|t| bindings(t.point())),
            transporters: p.transporters.map(|t| bindings(t.center.point())),
            enzymes,
            engagement,
            membrane,
            profile: self.chemistry.profiles.evaluate(membrane),
            stress: std::array::from_fn(|s| {
                self.chemistry.properties[s].stress
                    * (1. - 0.95 * chemistry::affinity(membrane, s, 3.))
            }),
        })
    }
}
impl CompiledOperators {
    /// Owned structs/payloads; shared definition and allocator metadata are counted separately.
    pub fn owned_bytes(&self) -> usize {
        let bindings = self
            .receptors
            .iter()
            .chain(&self.transporters)
            .chain(&self.engagement)
            .map(|a| a.len())
            .sum::<usize>();
        let conversions = self.enzymes.iter().map(|e| e.len()).sum::<usize>();
        let products = self
            .enzymes
            .iter()
            .flat_map(|e| e.iter())
            .map(|e| e.products.len())
            .sum::<usize>();
        size_of::<Self>()
            + self.key.parameters.len()
            + bindings * size_of::<Affinity>()
            + conversions * size_of::<Conversion>()
            + products * size_of::<ProductWeight>()
    }
    pub fn maximum_owned_bytes() -> usize {
        // Version varint <=5 bytes, 34 f64 coordinates; fixed arrays have no length prefix.
        size_of::<Self>()
            + 5
            + 34 * size_of::<f64>()
            + (8 * MAX_SUPPORT + 4 * SPECIES) * size_of::<Affinity>()
            + MAX_CONVERSIONS * size_of::<Conversion>()
            + MAX_PRODUCTS * size_of::<ProductWeight>()
    }
}
