//! Zero-tick upper bounds from the same recognition coefficients and funded stocks as World.
pub use crate::economy_report::report;
use crate::{
    chemistry::{self, Chemistry},
    config::Config,
    genetics::Compiled,
    organism::{Cell, maintenance_rate},
};
use serde::Serialize;
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Budget {
    pub radius: f64,
    pub maintenance: f64,
    pub transport: f64,
    pub motor: f64,
    pub gross_work: f64,
    pub surplus: f64,
    pub imports: Vec<f64>,
    pub processing_capacity: Vec<f64>,
    pub processing_work: f64,
    pub processing_surplus: f64,
    pub construction_ceiling: f64,
}
pub fn budget(
    c: &Config,
    chemistry: &Chemistry,
    g: &Compiled,
    scale: f64,
    local: &[f64; 256],
    inventory: f64,
    swim: f64,
) -> Budget {
    let mut cell = Cell::new(0, 0, g, c, 0., 0., 0.);
    cell.body = cell.body.map(|v| v * scale);
    cell.inventory.fill(inventory / 256.);
    let mut imports = vec![0.; 256];
    for slot in 0..4 {
        let r = &g.operators.transporters[slot];
        let total = r.iter().map(|a| a.value * local[a.species]).sum::<f64>();
        for a in r.iter() {
            imports[a.species] +=
                cell.body[7 + slot] * c.transporter_turnover * a.value * local[a.species]
                    / (c.receptor_k + total);
        }
    }
    let gross_work = imports
        .iter()
        .enumerate()
        .map(|(s, q)| {
            q * chemistry::reaction_energy(
                chemistry.properties[s].potential,
                chemistry.properties[chemistry.decomposition].potential,
                c.conversion_efficiency,
            )
            .0
            .max(0.)
        })
        .sum::<f64>();
    let maintenance = maintenance_rate(&cell.body, 0., c);
    let transport = imports.iter().sum::<f64>() * c.transport_energy;
    let motor = cell.body[1] * c.motor_power_density * swim;
    let surplus = gross_work - maintenance - transport - motor;
    // Conditional internal mixture: the imported proportions, with no accumulated products.
    // Product feedback in a live cell can lower this bound further.
    let total_import = imports.iter().sum::<f64>();
    let inside: Vec<_> = imports
        .iter()
        .map(|q| {
            if total_import > 0. {
                inventory * q / total_import
            } else {
                0.
            }
        })
        .collect();
    let mut processing_capacity = vec![0.; 256];
    let mut processing_value = vec![0.; 256];
    for (slot, e) in g.operators.enzymes.iter().enumerate() {
        let occupancy = e
            .engagement
            .iter()
            .map(|a| a.value * inside[a.species])
            .sum::<f64>();
        let rate = cell.body[11 + slot] * c.enzyme_turnover * e.attenuation
            / (c.receptor_k * cell.volume(c) + occupancy).max(1e-30);
        for edge in &e.conversions {
            let q = rate * edge.binding * inside[edge.substrate];
            processing_capacity[edge.substrate] += q;
            processing_value[edge.substrate] += q * edge.work;
        }
    }
    let processing_work = processing_capacity
        .iter()
        .enumerate()
        .map(|(s, q)| {
            if *q > 0. {
                processing_value[s] * (imports[s] / q).min(1.)
            } else {
                0.
            }
        })
        .sum::<f64>();
    let processing_surplus = processing_work - maintenance - transport - motor;
    Budget {
        radius: cell.radius(c),
        maintenance,
        transport,
        motor,
        gross_work,
        surplus,
        processing_capacity,
        processing_work,
        processing_surplus,
        construction_ceiling: (surplus / c.construction_energy)
            .max(0.)
            .min(imports.iter().sum()),
        imports,
    }
}
