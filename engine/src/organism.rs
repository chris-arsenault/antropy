use crate::{
    chemistry::SPECIES,
    config::Config,
    controller::{Action, INPUTS, State},
    genetics::Compiled,
};
use serde::{Deserialize, Serialize};
#[path = "chemical_flow_counter.rs"]
mod chemical_flow_counter;
use chemical_flow_counter::Counter;

pub const MAX_ENZYMES: usize = 8;
pub const STOCKS: usize = 16 + MAX_ENZYMES;
pub const PHOTO_STOCK: usize = 15;
pub const BUILDER_STOCK: usize = 20;
pub const EMITTER_STOCK: usize = 21;
pub const MOUTH_STOCK: usize = 22;
pub const EAR_STOCK: usize = 23;
pub const fn enzyme_stock(slot: usize) -> usize {
    if slot < 4 { 11 + slot } else { 12 + slot }
}
pub type Body = [f64; STOCKS];

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cell {
    pub id: u64,
    pub parent: Option<u64>,
    pub lineage: u64,
    pub generation: u64,
    pub genome: u64,
    #[serde(skip)]
    pub operators: Option<crate::chemical_operators::Operators>,
    pub born: u64,
    pub x: f64,
    pub y: f64,
    pub heading: f64,
    /// Derived projection of birth genetics at current biomass; rebuilt on restore.
    #[serde(skip)]
    pub body: Body,
    pub bound_material: crate::inventory::Inventory,
    pub inventory: crate::inventory::Inventory,
    pub energy: f64,
    pub damage: f64,
    pub brain: State,
    pub receptors: [f64; 4],
    pub inward_receptors: [f64; 4],
    pub photoreceptor: f64,
    pub contacts: [f64; 4],
    /// Last paid motor load, a local physical signal rather than a terrain map reading.
    pub motor_load: f64,
    /// Accepted actuator effects since the last physiology publication.
    pub activity: crate::activity::Activity,
    #[serde(skip)]
    pub interface: crate::interfaces::Reading,
    pub inputs: Vec<f32>,
    pub action: Action,
    pub flows: Flows,
    pub chemical_flows: ChemicalFlows,
}
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ChemicalFlows {
    pub imported: Counter,
    pub exported: Counter,
    pub consumed: Counter,
    pub produced: Counter,
}
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Flows {
    pub imported: f64,
    pub exported: f64,
    pub reacted: f64,
    pub captured: f64,
    pub external_work: f64,
    pub grown: f64,
    pub cover_deposited: f64,
    pub cover_recovered: f64,
    pub emission: f64,
    pub speech_work: f64,
    pub utterances: f64,
    pub heard: f64,
    pub recycled_work: f64,
    pub contact_imported: f64,
    pub contact_lost: f64,
    pub maintenance: f64,
    pub motors: f64,
    pub learning: f64,
    pub transport: f64,
    pub reaction_heat: f64,
    pub growth: f64,
    pub cover_work: f64,
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
            inward_receptors: [0.; 4],
            photoreceptor: 0.,
            contacts: [0.; 4],
            motor_load: 0.,
            activity: Default::default(),
            interface: Default::default(),
            inputs: vec![0.; INPUTS],
            action: Action::default(),
            flows: Flows::default(),
            chemical_flows: ChemicalFlows::default(),
        }
    }
    /// Derived from the immutable birth genotype, never independently persisted.
    pub fn chemistry(&self) -> &crate::genetics::Machinery {
        self.operators.as_ref().unwrap().chemistry()
    }
    pub fn material(&self) -> f64 {
        self.inventory.material()
    }
    pub fn mass(&self) -> f64 {
        self.body.iter().sum()
    }
    /// Explicit diagnostic grant/removal, preserving the existing material proportions.
    /// Ordinary growth and inheritance must transfer actual funded mixtures instead.
    pub fn set_fixture_body(&mut self, body: Body) {
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
    pub fn age(&self, c: &Config, tick: u64) -> f64 {
        tick.saturating_sub(self.born) as f64 * c.dt
    }
    pub fn basal(&self, c: &Config, tick: u64) -> f64 {
        c.dt * maintenance_rate(&self.body, self.damage, self.age(c, tick) + c.dt / 2., c)
    }
    pub fn pay(&mut self, requested: f64) -> f64 {
        let amount = requested.max(0.).min(self.energy);
        self.energy -= amount;
        amount
    }
    pub fn validate(&self, c: &Config) -> Result<(), String> {
        crate::controller::validate_state(&self.brain)?;
        self.inventory.validate()?;
        self.bound_material.validate()?;
        if (self.bound_material.material() - self.mass()).abs() > 1e-10 * (1. + self.mass()) {
            return Err("Bound material does not fund body stocks".into());
        }
        if self.brain.strategy.elapsed >= crate::controller::strategic::interval(c)
            || self.inventory.len() != SPECIES
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
            if values.len() != SPECIES || values.iter().any(|q| !q.is_finite() || q < 0.) {
                return Err("Invalid chemical flow history".into());
            }
        }
        if self
            .inventory
            .iter()
            .chain(self.body.iter().copied())
            .chain([self.energy, self.damage])
            .any(|q| !q.is_finite() || q < 0.)
            || !self.x.is_finite()
            || !self.y.is_finite()
            || self.x < 0.
            || self.x >= c.width
            || self.y < 0.
            || self.y >= c.height
            || !self.heading.is_finite()
            || self.damage > 1.
            || !self.motor_load.is_finite()
            || !(0. ..=1.).contains(&self.motor_load)
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
        if self
            .receptors
            .iter()
            .chain(&self.inward_receptors)
            .chain([&self.photoreceptor])
            .any(|x| !x.is_finite() || *x < 0.)
            || self.contacts.iter().any(|x| !(0. ..=1.).contains(x))
            || !self.activity.validate()
            || self.brain.last_energy.is_some_and(|x| !x.is_finite())
            || self
                .action
                .transport
                .iter()
                .chain(&self.action.activity)
                .chain([&self.action.emission])
                .chain([&self.action.speech_effort])
                .chain([&self.action.swim, &self.action.repair])
                .any(|x| !(0. ..=1.).contains(x))
            || !(-1. ..=1.).contains(&self.action.turn)
            || !(-1. ..=1.).contains(&self.action.cover)
        {
            return Err("Invalid controller state".into());
        }
        crate::world_validation::numeric_record(&self.flows)
    }
}

/// Linear wear per unit support capacity; age is model seconds since this cell's birth.
pub fn aging_multiplier(body: &Body, age: f64, c: &Config) -> f64 {
    let mass = body.iter().sum::<f64>();
    1. + age / c.aging_time * mass / body[0].max(1e-30)
}

pub fn maintenance_rate(body: &Body, damage: f64, age: f64, c: &Config) -> f64 {
    let mass = body.iter().sum::<f64>();
    (1. + damage)
        * (mass * c.maintenance * aging_multiplier(body, age, c)
            + c.controller_cost * crate::controller::strategic::upkeep_multiplier())
}

#[cfg(test)]
#[path = "aging_tests.rs"]
mod aging_tests;
