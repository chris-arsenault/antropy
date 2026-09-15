//! Static resource budgets. No stepping, fitness selection or browser publication.
use crate::{
    chemistry::{Chemistry, SPECIES},
    config::Config,
    genetics::Compiled,
    organism::maintenance_rate,
    transport::diffusive_supply,
};
use serde::Serialize;

pub use crate::economy_report::report;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Budget {
    pub body_mass: f64,
    pub inventory: f64,
    pub radius: f64,
    pub impedance: f64,
    pub imports: Vec<f64>,
    pub import_rate: f64,
    pub maintenance: f64,
    pub transport_cost: f64,
    pub motor_cost: f64,
    pub learning_cost: f64,
    pub perfect_processing_power: f64,
    pub maintenance_margin_upper_bound: f64,
    pub closure_power: Option<f64>,
    pub closure_growth_margin: Option<f64>,
    pub closure_net_growth: Option<f64>,
    pub repair_power: Option<f64>,
    pub repair_material_rate: Option<f64>,
    pub stress_load: Option<f64>,
    pub closure_limits: Vec<String>,
}

/// Exact unshared kinetic/diffusive request for fixed efforts, without funding/headroom limits.
pub fn imports(
    c: &Config,
    chemistry: &Chemistry,
    g: &Compiled,
    body: &[f64; 15],
    radius: f64,
    concentrations: &[f64; SPECIES],
    efforts: [f64; 4],
) -> [f64; SPECIES] {
    let mut rates = [0.; SPECIES];
    for (slot, effort) in efforts.iter().enumerate() {
        if g.chromosome.chemistry.transporters[slot].export {
            continue;
        }
        let capacity = body[7 + slot] * c.transporter_turnover * effort;
        let demand: f64 = g.transporters[slot]
            .iter()
            .map(|a| a.value * concentrations[a.species])
            .sum();
        for a in &g.transporters[slot] {
            rates[a.species] += capacity * a.value * concentrations[a.species] / demand.max(1.);
        }
    }
    let impedance = concentrations
        .iter()
        .zip(&chemistry.properties)
        .map(|(q, p)| q * p.impedance)
        .sum();
    for (s, rate) in rates.iter_mut().enumerate() {
        *rate = rate.min(diffusive_supply(
            radius,
            chemistry.properties[s].diffusion,
            concentrations[s],
            impedance,
            c,
        ));
    }
    rates
}

/// Retained terminal products and unsaturated unary enzymes; assembly mixes all internal matter.
fn closure(
    c: &Config,
    g: &Compiled,
    body: &[f64; 15],
    rates: &[f64; SPECIES],
    inventory: f64,
) -> (f64, f64, [f64; SPECIES], Vec<String>) {
    let total: f64 = rates.iter().sum();
    let mut enzyme = [0.; SPECIES];
    let mut power = [0.; SPECIES];
    let mut best_yield = [0_f64; SPECIES];
    let mut limits = vec![];
    for slot in 0..4 {
        for e in &g.enzymes[slot] {
            let k = body[11 + slot] * c.enzyme_turnover * e.affinity;
            enzyme[e.substrate] += k;
            power[e.substrate] += k * e.energy;
            if k > 0. {
                best_yield[e.substrate] = best_yield[e.substrate].max(e.energy);
            }
            if rates[e.substrate] > 0.
                && (e.energy < 0.
                    || g.enzymes
                        .iter()
                        .flatten()
                        .any(|next| next.substrate == e.product))
            {
                limits.push("Nonterminal or uphill reaction: closure unavailable".into());
            }
        }
    }
    let mut internal: [f64; SPECIES] =
        std::array::from_fn(|s| rates[s] / (enzyme[s] + total / inventory.max(1e-30)).max(1e-30));
    for edges in &g.enzymes {
        if edges
            .iter()
            .map(|e| e.affinity * internal[e.substrate])
            .sum::<f64>()
            > 1.
        {
            limits.push("Enzyme saturation: linear closure unavailable".into());
        }
    }
    limits.sort();
    limits.dedup();
    let captured = internal.iter().zip(power).map(|(x, k)| x * k).sum();
    let perfect = rates.iter().zip(best_yield).map(|(u, y)| u * y).sum();
    let substrates = internal;
    for slot in 0..4 {
        for e in &g.enzymes[slot] {
            if rates[e.substrate] > 0. && total > 0. {
                internal[e.product] += body[11 + slot]
                    * c.enzyme_turnover
                    * e.affinity
                    * substrates[e.substrate]
                    * inventory
                    / total;
            }
        }
    }
    (captured, perfect, internal, limits)
}

fn injury(
    c: &Config,
    chemistry: &Chemistry,
    g: &Compiled,
    local: &[f64; SPECIES],
    internal: &[f64; SPECIES],
    volume: f64,
) -> (f64, f64) {
    let mut susceptibility = [1.; SPECIES];
    for a in &g.membrane {
        susceptibility[a.species] -= (1. - c.susceptibility_floor) * a.value;
    }
    let load: f64 = (0..SPECIES)
        .map(|s| {
            chemistry.properties[s].stress
                * susceptibility[s]
                * (local[s] + c.internal_exposure * internal[s] / volume)
        })
        .sum();
    (load, c.damage_rate * load / (load + c.stress_k))
}

pub fn budget(
    c: &Config,
    chemistry: &Chemistry,
    g: &Compiled,
    scale: f64,
    concentrations: &[f64; SPECIES],
    inventory_fraction: f64,
    motor_effort: f64,
) -> Budget {
    let body = g.body.map(|x| x * scale);
    let body_mass: f64 = body.iter().sum();
    let inventory = body[2] * c.storage_capacity * inventory_fraction;
    let volume = body_mass / c.body_density + inventory / c.inventory_density;
    let radius = (volume / std::f64::consts::PI).sqrt();
    let rates = imports(c, chemistry, g, &body, radius, concentrations, [1.; 4]);
    let import_rate = rates.iter().sum::<f64>();
    let maintenance = maintenance_rate(&body, 0., c);
    let transport_cost = import_rate * c.transport_energy;
    let motor_cost = body[1] * c.motor_power_density * motor_effort.powi(2);
    let learning_cost = if c.learning == "plastic" {
        c.plasticity_cost * g.chromosome.behavior.plasticity[0].abs() as f64
    } else {
        0.
    };
    let (captured, perfect, internal, mut limits) = closure(c, g, &body, &rates, inventory);
    let (stress_load, injury_rate) = injury(c, chemistry, g, concentrations, &internal, volume);
    let repair_material = injury_rate * body_mass * c.repair_material;
    let repair_power = injury_rate * c.repair_energy;
    if injury_rate > c.repair_rate {
        limits.push("Injury exceeds maximum repair: healthy closure unavailable".into());
    }
    if import_rate > c.growth_rate * body_mass {
        limits.push("Construction rate cap: fixed-inventory closure unavailable".into());
    }
    let expenses = maintenance + transport_cost + motor_cost + learning_cost;
    Budget {
        body_mass,
        inventory,
        radius,
        impedance: concentrations
            .iter()
            .zip(&chemistry.properties)
            .map(|(q, p)| q * p.impedance)
            .sum(),
        imports: rates.to_vec(),
        import_rate,
        maintenance,
        transport_cost,
        motor_cost,
        learning_cost,
        perfect_processing_power: perfect,
        maintenance_margin_upper_bound: perfect - expenses,
        closure_power: limits.is_empty().then_some(captured),
        closure_growth_margin: limits
            .is_empty()
            .then_some(captured - expenses - c.construction_energy * import_rate - repair_power),
        closure_net_growth: limits.is_empty().then_some(import_rate - repair_material),
        repair_power: limits.is_empty().then_some(repair_power),
        repair_material_rate: limits.is_empty().then_some(repair_material),
        stress_load: limits.is_empty().then_some(stress_load),
        closure_limits: limits,
    }
}
