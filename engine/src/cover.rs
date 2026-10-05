//! A mobile extracellular film above the cell plane; sparse material, never a bond graph.
use crate::{organism::BUILDER_STOCK, world::World};
use std::{collections::BTreeMap, sync::Arc};

pub fn refresh(w: &mut World) {
    let column = w.config.optical_column * w.config.mesh.powi(2);
    let depth = w
        .cover
        .amounts()
        .rows()
        .filter_map(|(n, _)| {
            let mass = w.cover.amounts().site(n).2[0];
            (mass > 0.).then_some((n, mass / column))
        })
        .collect();
    let depth = Arc::new(depth);
    w.field.illumination.cover = Arc::clone(&depth);
    w.cover.illumination = w.field.illumination.clone();
    w.cover.illumination.cover = depth;
    w.cover.illumination.film = true;
    crate::optics::bind(w);
}

pub fn advance(w: &mut World) {
    refresh(w);
    w.cover.pressure_strength = w.config.pressure_strength;
    w.cover.attraction_length = w.config.attraction_length;
    w.climate.prepare(&w.config);
    let b = w.cover.advance_weathered(
        &w.chemistry,
        w.field_elapsed,
        w.config.washout,
        w.config.diffusion_impedance,
        None,
    );
    w.ledger.washed_out += b.matter;
    w.ledger.washout_energy += b.energy;
    w.ledger.numerical_material += b.roundoff_matter;
    w.ledger.numerical_energy += b.roundoff_energy;
    w.ledger.weathering_heat += b.weathering_heat;
    w.ledger.weathering_work += b.weathering_work;
    w.ledger.weathered_material += b.weathered_material;
    w.ledger.sheltered_conversion += b.sheltered_conversion;
    refresh(w);
}

/// All donors and headroom are frozen before any commitment. Deposits cannot fund recovery
/// in this interval. A recovery cell requests a footprint-weighted amount from each node;
/// a common node fraction handles contention without priority or producer identity.
pub fn exchange(w: &mut World, sites: &[crate::footprint::Row], dt: f64) {
    if !w.config.features.cover {
        return;
    }
    let c = &w.config;
    let requests: Vec<_> = w
        .cells
        .iter()
        .map(|cell| {
            let handling = dt
                * c.growth_rate
                * cell.body[BUILDER_STOCK]
                * (1. - cell.damage)
                * cell.action.cover.abs();
            if handling == 0. {
                return 0.;
            }
            let reserve = crate::accounting::interval_reserve(cell, &cell.body, c, w.tick);
            let affordable = (cell.energy - reserve).max(0.) / c.growth_energy;
            let material = if cell.action.cover >= 0. {
                (cell.material() - cell.capacity(c) * c.protected_inventory_fraction).max(0.)
            } else {
                (cell.capacity(c) - cell.material()).max(0.)
            };
            handling.min(affordable).min(material)
        })
        .collect();
    let mut demand = BTreeMap::<usize, f64>::new();
    for (i, cell) in w.cells.iter().enumerate() {
        if cell.action.cover < 0. && requests[i] > 0. {
            for &(n, weight) in &sites[i] {
                *demand.entry(n).or_default() += requests[i] * weight;
            }
        }
    }
    let mut changes = BTreeMap::<usize, (u64, [f64; 256])>::new();
    for (i, cell) in w.cells.iter_mut().enumerate() {
        let capacity = dt * c.growth_rate * cell.body[BUILDER_STOCK];
        cell.activity.add(crate::activity::BUILDER, 0., capacity);
        if requests[i] == 0. {
            continue;
        }
        let mut moved = [0.; 256];
        let depositing = cell.action.cover >= 0.;
        let material = cell.material().max(1e-30);
        for &(n, weight) in &sites[i] {
            if weight == 0. {
                continue;
            }
            let mass = w.cover.amounts().site(n).2[0];
            if !depositing && mass == 0. {
                continue;
            }
            let (mask, change) = changes.entry(n).or_insert((0, [0.; 256]));
            let fraction = if depositing {
                requests[i] * weight / material
            } else {
                requests[i] * weight / demand[&n].max(mass).max(1e-30)
            };
            let donor = w.cover.amounts().row(n);
            for s in 0..256 {
                let q = if depositing {
                    cell.inventory.value(s)
                } else {
                    -(donor[s] as f64)
                };
                let amount = fraction * q;
                if amount != 0. {
                    *mask |= 1 << (s / 4);
                }
                change[s] += amount;
                moved[s] += amount;
            }
        }
        let amount = moved.iter().sum::<f64>();
        if amount == 0. {
            continue;
        }
        cell.inventory.apply(&moved.map(|q| -q));
        let mut mask = 0;
        for (s, &q) in moved.iter().enumerate() {
            if q == 0. {
                continue;
            }
            let (incoming, outgoing) = ((-q).max(0.), q.max(0.));
            cell.chemical_flows.imported.add(s, incoming);
            cell.chemical_flows.exported.add(s, outgoing);
            mask |= 1 << (s / 4);
        }
        if let Some(observer) = w.observer.as_mut().filter(|o| o.active()) {
            observer.transfers(cell.id, mask, |s| ((-moved[s]).max(0.), moved[s].max(0.)));
        }
        cell.activity.add(crate::activity::BUILDER, amount, 0.);
        cell.flows.cover_work += cell.pay(amount.abs() * c.growth_energy);
        cell.flows.cover_deposited += amount.max(0.);
        cell.flows.cover_recovered += (-amount).max(0.);
    }
    let nodes: Vec<_> = changes.iter().map(|(&n, &(mask, _))| (n, mask)).collect();
    let mut deltas: Vec<_> = changes.into_values().flat_map(|(_, row)| row).collect();
    let loss = w.cover.apply_rows(&mut deltas, &nodes, &w.chemistry);
    w.ledger.numerical_material += loss[0];
    w.ledger.numerical_energy += loss[1];
    refresh(w);
}
