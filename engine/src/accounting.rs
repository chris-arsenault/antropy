//! Linear material value and usable-work accounts. Spatial signals store no spendable work.
use crate::{chemistry::Chemistry, organism::Flows};
use serde::{Deserialize, Serialize};
/// Automatic construction/refitting protects already funded work until the next physiology event.
pub fn interval_reserve(
    cell: &crate::organism::Cell,
    body: &[f64; 15],
    c: &crate::config::Config,
) -> f64 {
    let maintenance = crate::organism::maintenance_rate(body, cell.damage, c);
    let motors =
        body[1] * c.motor_power_density * (cell.action.swim + 0.25 * cell.action.turn.abs());
    let learning = if c.learning == "plastic" {
        body[0] * c.plasticity_cost
    } else {
        0.
    };
    (c.physiology_interval + c.dt) * (maintenance + motors + learning)
}
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
    pub death_heat: f64,
    pub division_heat: f64,
    pub overflow_heat: f64,
    pub births: u64,
    pub divisions: u64,
    pub deaths: u64,
    pub disturbance_deaths: u64,
    pub transfers: u64,
    pub flows: Flows,
}
impl Ledger {
    pub fn rounding(&mut self, loss: f64, species: usize, chemistry: &Chemistry) {
        self.numerical_material += loss;
        self.numerical_energy += loss * chemistry.properties[species].potential;
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
            + self.death_heat
            + self.division_heat
            + self.overflow_heat
    }
    pub fn accumulate(&mut self, f: &Flows) {
        macro_rules! add { ($($name:ident),*) => { $(self.flows.$name += f.$name;)* }; }
        add!(
            imported,
            exported,
            reacted,
            captured,
            constructed,
            maintenance,
            motors,
            learning,
            transport,
            reaction_heat,
            construction,
            refitting,
            repair,
            repaired,
            exposure,
            damage,
            distance
        );
    }
}
