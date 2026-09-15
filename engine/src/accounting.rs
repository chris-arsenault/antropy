use crate::{chemistry::Chemistry, organism::Flows};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ledger {
    pub initial_material: f64,
    pub initial_energy: f64,
    pub supplied: f64,
    pub supplied_energy: f64,
    pub washed_out: f64,
    pub washout_energy: f64,
    pub numerical_material: f64,
    pub numerical_energy: f64,
    pub flows: Flows,
    pub division_heat: f64,
    pub death_heat: f64,
    pub overflow_heat: f64,
    pub births: u64,
    pub divisions: u64,
    pub deaths: u64,
    pub damage_deaths: u64,
    pub mutations: u64,
    pub learned_births: u64,
    pub recombinations: u64,
    pub transfers: u64,
    pub disturbances: u64,
    pub disturbance_deaths: u64,
    pub blocked_divisions: u64,
    pub task_writes: u64,
    pub organism_time: f64,
}
impl Ledger {
    pub fn rounding(&mut self, q: f64, s: usize, chemistry: &Chemistry) {
        self.numerical_material += q;
        self.numerical_energy += q * chemistry.properties[s].potential;
    }
    pub fn accumulate(&mut self, f: &Flows) {
        self.flows.imported += f.imported;
        self.flows.exported += f.exported;
        self.flows.reacted += f.reacted;
        self.flows.captured += f.captured;
        self.flows.constructed += f.constructed;
        self.flows.maintenance += f.maintenance;
        self.flows.motors += f.motors;
        self.flows.learning += f.learning;
        self.flows.transport += f.transport;
        self.flows.reaction_heat += f.reaction_heat;
        self.flows.construction += f.construction;
        self.flows.refitting += f.refitting;
        self.flows.repair += f.repair;
        self.flows.repaired += f.repaired;
        self.flows.exposure += f.exposure;
        self.flows.damage += f.damage;
        self.flows.distance += f.distance;
    }
    pub fn heat(&self) -> f64 {
        let f = &self.flows;
        f.maintenance
            + f.motors
            + f.learning
            + f.transport
            + f.reaction_heat
            + f.construction
            + f.refitting
            + f.repair
            + self.division_heat
            + self.death_heat
            + self.overflow_heat
    }
}
