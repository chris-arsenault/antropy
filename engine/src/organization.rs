//! One core-funded handling budget for construction and decommission, with frozen donors.
use crate::{
    config::Config,
    genetics::Compiled,
    organism::{Body, Cell},
};

pub fn remodel(cell: &mut Cell, g: &Compiled, c: &Config, dt: f64) {
    let target = crate::genetics::repertoire::desired(g, cell);
    let mut growth: Body = std::array::from_fn(|i| (target[i] - cell.body[i]).max(0.));
    let mut retired: Body =
        std::array::from_fn(|i| (cell.body[i] - target[i]).max(0.) * cell.action.retirement);
    let capacity = dt * c.growth_rate * cell.body[0] * (1. - cell.damage);
    let grow_total = growth.iter().sum::<f64>();
    let retire_total = retired.iter().sum::<f64>();
    if capacity == 0. || grow_total + retire_total == 0. {
        return;
    }
    let material = cell.material();
    let grow_limit = (material - cell.capacity(c) * c.protected_inventory_fraction).max(0.);
    let grow_fraction = (grow_limit / grow_total.max(1e-30)).min(1.);
    // Released material needs storage after retiring storage, without using new construction.
    let headroom = (cell.capacity(c) - material).max(0.);
    let retire_fraction = (headroom / (retire_total + retired[2] * c.storage_capacity).max(1e-30))
        .min(1.)
        .min(cell.bound_material.material() / retire_total.max(1e-30));
    growth.iter_mut().for_each(|q| *q *= grow_fraction);
    retired.iter_mut().for_each(|q| *q *= retire_fraction);
    let requested = growth.iter().sum::<f64>() + retired.iter().sum::<f64>();
    let handling = (capacity / requested.max(1e-30)).min(1.);
    let proposed = std::array::from_fn(|i| cell.body[i] + growth[i] * handling);
    let reserve = crate::accounting::interval_reserve(cell, &proposed, c);
    let fraction = handling
        .min((cell.energy - reserve).max(0.) / (c.construction_energy * requested).max(1e-30));
    let built = growth.iter().sum::<f64>() * fraction;
    let removed = retired.iter().sum::<f64>() * fraction;
    if built + removed == 0. {
        return;
    }
    let free_fraction = built / material.max(1e-30);
    let bound_fraction = removed / cell.bound_material.material().max(1e-30);
    // One simultaneous transfer uses both frozen compositions; no released donor is reused.
    if removed == 0. {
        cell.inventory.transfer_to(&mut cell.bound_material, built);
    } else if built == 0. {
        cell.bound_material
            .transfer_to(&mut cell.inventory, removed);
    } else {
        for s in 0..256 {
            let into_body = cell.inventory[s] * free_fraction;
            let into_free = cell.bound_material[s] * bound_fraction;
            cell.inventory
                .set(s, (cell.inventory[s] - into_body) + into_free);
            cell.bound_material
                .set(s, (cell.bound_material[s] - into_free) + into_body);
        }
    }
    for i in 0..cell.body.len() {
        cell.body[i] = (cell.body[i] - retired[i] * fraction) + growth[i] * fraction;
    }
    cell.flows.constructed += built;
    cell.flows.retired += removed;
    cell.flows.construction += cell.pay((built + removed) * c.construction_energy);
}
