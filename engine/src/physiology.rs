//! Genetic proportions expressed directly at the cell's current biomass.
use crate::{
    config::Config,
    genetics::Compiled,
    organism::{Body, Cell},
};

pub fn body(g: &Compiled, mass: f64) -> Body {
    let reference: f64 = g.body.iter().sum();
    g.body.map(|q| mass * (q / reference))
}

/// Refresh derived capacities without transferring matter or spending work.
pub fn express(cell: &mut Cell, g: &Compiled) {
    cell.body = body(g, cell.bound_material.material());
    cell.operators = Some(g.operators.clone());
}

/// Automatic whole-body growth. No capability has its own construction request or inventory.
pub fn grow(cell: &mut Cell, g: &Compiled, c: &Config, dt: f64, tick: u64) {
    let mass = cell.mass();
    let deficit = (2. * g.body.iter().sum::<f64>() - mass).max(0.);
    let available = (cell.material() - cell.capacity(c) * c.protected_inventory_fraction).max(0.);
    let requested = deficit
        .min(dt * c.growth_rate * mass * (1. - cell.damage))
        .min(available);
    let proposed = body(g, mass + requested);
    let reserve = crate::accounting::interval_reserve(cell, &proposed, c, tick);
    let grown = requested.min((cell.energy - reserve).max(0.) / c.growth_energy);
    if grown <= 0. {
        return;
    }
    cell.inventory.transfer_to(&mut cell.bound_material, grown);
    cell.flows.grown += grown;
    cell.flows.growth += cell.pay(grown * c.growth_energy);
    express(cell, g);
}

#[cfg(test)]
#[path = "physiology_tests.rs"]
mod tests;
