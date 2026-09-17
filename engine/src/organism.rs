use crate::{
    chemistry::SPECIES,
    config::Config,
    controller::{Action, INPUTS, State},
    genetics::Compiled,
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cell {
    pub id: u64,
    pub parent: Option<u64>,
    pub lineage: u64,
    pub generation: u64,
    pub genome: u64,
    pub machinery_genome: u64,
    pub installed: crate::genetics::Machinery,
    pub machinery_revision: u64,
    #[serde(skip)]
    pub operators: Option<crate::chemical_operators::Operators>,
    pub born: u64,
    pub x: f64,
    pub y: f64,
    pub heading: f64,
    pub body: [f64; 15],
    pub bound_material: crate::inventory::Inventory,
    pub inventory: crate::inventory::Inventory,
    pub energy: f64,
    pub damage: f64,
    pub brain: State,
    pub receptors: [f64; 4],
    pub contacts: [f64; 4],
    pub inputs: Vec<f32>,
    pub action: Action,
    pub flows: Flows,
    pub chemical_flows: ChemicalFlows,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ChemicalFlows {
    pub imported: Vec<f64>,
    pub exported: Vec<f64>,
    pub consumed: Vec<f64>,
    pub produced: Vec<f64>,
}
impl Default for ChemicalFlows {
    fn default() -> Self {
        Self {
            imported: vec![0.; SPECIES],
            exported: vec![0.; SPECIES],
            consumed: vec![0.; SPECIES],
            produced: vec![0.; SPECIES],
        }
    }
}
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Flows {
    pub imported: f64,
    pub exported: f64,
    pub reacted: f64,
    pub captured: f64,
    pub constructed: f64,
    pub maintenance: f64,
    pub motors: f64,
    pub learning: f64,
    pub transport: f64,
    pub reaction_heat: f64,
    pub construction: f64,
    pub refitting: f64,
    pub repair: f64,
    pub repaired: f64,
    pub exposure: f64,
    pub damage: f64,
    pub distance: f64,
}
impl Cell {
    pub fn new(
        id: u64,
        genome: u64,
        compiled: &Compiled,
        c: &Config,
        chemistry: &crate::chemistry::Chemistry,
        position: [f64; 2],
        heading: f64,
    ) -> Self {
        let mut inventory = vec![0.; SPECIES];
        for &s in &c.source_species {
            inventory[s] += c.founder_inventory / c.source_species.len() as f64;
        }
        // Explicit initial matter, retained from the earlier founder condition.
        // Descendants inherit actual bound mixtures instead of calling this constructor.
        let mut bound_material = vec![0.; SPECIES];
        bound_material[chemistry.decomposition] = compiled.body.iter().sum();
        Self {
            id,
            parent: None,
            lineage: id,
            generation: 0,
            genome,
            machinery_genome: genome,
            installed: compiled.chromosome.chemistry.clone(),
            machinery_revision: 0,
            operators: Some(compiled.operators.clone()),
            born: 0,
            x: position[0],
            y: position[1],
            heading,
            body: compiled.body,
            bound_material: bound_material.into(),
            inventory: inventory.into(),
            energy: c.founder_energy,
            damage: 0.,
            brain: State::default(),
            receptors: [0.; 4],
            contacts: [0.; 4],
            inputs: vec![0.; INPUTS],
            action: Action::default(),
            flows: Flows::default(),
            chemical_flows: ChemicalFlows::default(),
        }
    }
    pub fn material(&self) -> f64 {
        self.inventory.material()
    }
    pub fn mass(&self) -> f64 {
        self.body.iter().sum()
    }
    /// Explicit diagnostic grant/removal, preserving the existing material proportions.
    /// Ordinary growth and inheritance must transfer actual funded mixtures instead.
    pub fn set_fixture_body(&mut self, body: [f64; 15]) {
        self.bound_material
            .scale(body.iter().sum::<f64>() / self.bound_material.material().max(1e-30));
        self.body = body;
    }
    pub fn volume(&self, c: &Config) -> f64 {
        self.mass() / c.body_density + self.material() / c.inventory_density
    }
    pub fn radius(&self, c: &Config) -> f64 {
        (self.volume(c) / std::f64::consts::PI).sqrt()
    }
    pub fn capacity(&self, c: &Config) -> f64 {
        self.body[2] * c.storage_capacity
    }
    pub fn energy_capacity(&self, c: &Config) -> f64 {
        self.body[0] * c.energy_capacity
    }
    pub fn basal(&self, c: &Config) -> f64 {
        c.dt * maintenance_rate(&self.body, self.damage, c)
    }
    pub fn pay(&mut self, requested: f64) -> f64 {
        let amount = requested.max(0.).min(self.energy);
        self.energy -= amount;
        amount
    }
    pub fn validate(&self, c: &Config) -> Result<(), String> {
        self.installed.validate()?;
        self.inventory.validate()?;
        self.bound_material.validate()?;
        if (self.bound_material.material() - self.mass()).abs() > 1e-10 * (1. + self.mass()) {
            return Err("Bound material does not fund body stocks".into());
        }
        if self.inventory.len() != SPECIES
            || self.inputs.len() != INPUTS
            || self.brain.hidden.len() != 24
            || self.brain.traces.len() != 576
        {
            return Err("Invalid cell dimensions".into());
        }
        for values in [
            &self.chemical_flows.imported,
            &self.chemical_flows.exported,
            &self.chemical_flows.consumed,
            &self.chemical_flows.produced,
        ] {
            if values.len() != SPECIES || values.iter().any(|q| !q.is_finite() || *q < 0.) {
                return Err("Invalid chemical flow history".into());
            }
        }
        if self
            .inventory
            .iter()
            .chain(&self.body)
            .chain([&self.energy, &self.damage])
            .any(|q| !q.is_finite() || *q < 0.)
            || !self.x.is_finite()
            || !self.y.is_finite()
            || self.x < 0.
            || self.x >= c.width
            || self.y < 0.
            || self.y >= c.height
            || !self.heading.is_finite()
            || self.damage > 1.
            || self
                .brain
                .hidden
                .iter()
                .chain(&self.brain.traces)
                .chain(&self.inputs)
                .any(|x| !x.is_finite())
        {
            return Err("Invalid cell state".into());
        }
        if self.receptors.iter().any(|x| !x.is_finite() || *x < 0.)
            || self.contacts.iter().any(|x| !(0. ..=1.).contains(x))
            || self.brain.last_energy.is_some_and(|x| !x.is_finite())
            || self
                .action
                .transport
                .iter()
                .chain([&self.action.swim, &self.action.repair])
                .any(|x| !(0. ..=1.).contains(x))
            || !(-1. ..=1.).contains(&self.action.turn)
        {
            return Err("Invalid controller state".into());
        }
        crate::world_validation::numeric_record(&self.flows)
    }
}

pub fn maintenance_rate(body: &[f64; 15], damage: f64, c: &Config) -> f64 {
    (1. + damage)
        * (body[0] * c.maintenance
            + body[1] * c.motor_maintenance
            + body[2] * c.storage_maintenance
            + body[3..].iter().sum::<f64>() * c.machinery_maintenance
            + c.controller_cost)
}
