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
            let reserve = crate::accounting::interval_reserve(cell, &cell.body, c);
            let affordable = (cell.energy - reserve).max(0.) / c.construction_energy;
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
    let mut changes = BTreeMap::<usize, [f64; 256]>::new();
    for (i, cell) in w.cells.iter_mut().enumerate() {
        if requests[i] == 0. {
            continue;
        }
        let mut moved = [0.; 256];
        let depositing = cell.action.cover >= 0.;
        for &(n, weight) in &sites[i] {
            if weight == 0. {
                continue;
            }
            let change = changes.entry(n).or_insert([0.; 256]);
            let mass = w.cover.amounts().site(n).2[0];
            let fraction = if depositing {
                requests[i] * weight / cell.material().max(1e-30)
            } else {
                requests[i] * weight / demand[&n].max(mass).max(1e-30)
            };
            for s in 0..256 {
                let q = if depositing {
                    cell.inventory.value(s)
                } else {
                    -(w.cover.amounts().row(n)[s] as f64)
                };
                let amount = fraction * q;
                change[s] += amount;
                moved[s] += amount;
            }
        }
        let amount = moved.iter().sum::<f64>();
        cell.inventory.apply(&moved.map(|q| -q));
        for (s, &q) in moved.iter().enumerate() {
            if q == 0. {
                continue;
            }
            let (incoming, outgoing) = ((-q).max(0.), q.max(0.));
            cell.chemical_flows.imported.add(s, incoming);
            cell.chemical_flows.exported.add(s, outgoing);
            if let Some(observer) = w.observer.as_mut().filter(|o| o.active()) {
                observer.transfer(cell.id, s, incoming, outgoing);
            }
        }
        cell.flows.construction += cell.pay(amount.abs() * c.construction_energy);
        cell.flows.cover_deposited += amount.max(0.);
        cell.flows.cover_recovered += (-amount).max(0.);
    }
    let nodes: Vec<_> = changes.keys().map(|&n| (n, u64::MAX)).collect();
    let mut deltas: Vec<_> = changes.into_values().flatten().collect();
    let loss = w.cover.apply_rows(&mut deltas, &nodes, &w.chemistry);
    w.ledger.numerical_material += loss[0];
    w.ledger.numerical_energy += loss[1];
    refresh(w);
}
