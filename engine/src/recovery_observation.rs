//! Bounded read-only recovery reductions. Stored material is not survivor intake.
use crate::world::World;
use serde_json::{Value, json};

pub fn summary(w: &World) -> Value {
    json!({"enabled":w.config.mortality_recovery,
        "severity":w.mortality.severity(&w.config),"response":w.mortality.response(&w.config),
        "deadBody":w.mortality.dead_body,"recovered":w.mortality.recovered,"spill":w.mortality.spill,
        "recentBiomass":w.mortality.biomass,"deathRate":w.mortality.death_rate,"growthRate":w.mortality.growth_rate,
        "storedMaterial":w.sources.iter().map(|s|s.amount).sum::<f64>(),
        "recentRecovery":w.sources.iter().map(|s|s.recent_recovery).sum::<f64>(),
        "releasedMaterial":w.ledger.source_released})
}
pub fn source(w: &World, index: usize) -> Result<Value, String> {
    let s = w.sources.get(index).ok_or("Reservoir is unavailable")?;
    Ok(
        json!({"tick":w.tick,"source":index,"position":[s.habitat.x,s.habitat.y],
        "storedMaterial":s.amount,"recentRecovery":s.recent_recovery,
        "recentOutputRate":s.recent_output/w.config.mortality_memory,
        "releasedMaterial":s.total_released,"emptyElapsed":s.empty_elapsed,
        "nominalRate":s.rate,"season":w.shade.geography.season([s.habitat.x,s.habitat.y],w.tick as f64*w.config.dt)}),
    )
}
