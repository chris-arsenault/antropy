//! Selected-cell investment bounds, without advancing or editing physical state.
use crate::{
    organism::{BUILDER_STOCK, Cell, EMITTER_STOCK, PHOTO_STOCK},
    world::World,
};
use serde_json::{Value, json};

pub fn cell(w: &World, cell: &Cell) -> Value {
    let c = &w.config;
    let sites = crate::footprint::sites(cell, c, &w.field);
    // Uniform half-transmission over every supported node, not a tuned target outcome.
    let half_column = std::f64::consts::LN_2 * c.mesh.powi(2) * c.optical_column;
    let material = half_column * sites.len() as f64;
    let capacity = c.growth_rate * cell.body[BUILDER_STOCK] * (1. - cell.damage);
    let power = c.motor_power_density * cell.body[EMITTER_STOCK] * (1. - cell.damage);
    json!({"ticksAdvanced":0,"supportNodes":sites.len(),
        "halfTransmissionMaterial":material,"depositionWork":material*c.growth_energy,
        "fullEffortDepositionSeconds":if capacity>0. {Some(material/capacity)} else {None},
        "washoutReplacementPerSecond":material*c.washout,
        "builderCapacityPerSecond":capacity,"emitterPower":power,
        "maximumRadiatedPower":power*c.conversion_efficiency,
        "lateralReach":c.optical_reach,"photoreceptorBody":cell.body[PHOTO_STOCK],
        "limits":"Column assumes uniform footprint coverage; transport and photochemical conversion add replacement demand. Radiated power is an upper bound, not recipient capture or investment return."})
}
