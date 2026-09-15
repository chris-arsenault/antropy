use super::{Accounts, EFFICIENCY, WORK_PRICE, bodies::Cloud};
use crate::{
    chemistry::{self, Chemistry},
    config::Config,
    field::Field,
    organism::Cell,
};

pub fn assemble(
    cell: &mut Cell,
    species: usize,
    stock: usize,
    requested: f64,
    chemistry: &Chemistry,
    books: &mut Accounts,
) -> f64 {
    let u = chemistry.properties[species].potential;
    let body = chemistry.properties[chemistry.decomposition].potential;
    let (price, heat) = chemistry::assembly_cost(u, body, WORK_PRICE, EFFICIENCY);
    let q = requested
        .max(0.)
        .min(cell.inventory[species])
        .min(cell.energy / price);
    cell.inventory.set(species, cell.inventory[species] - q);
    cell.body[stock] += q;
    cell.energy -= q * price;
    books.heat += q * heat;
    q
}
pub fn spend(cell: &mut Cell, requested: f64, books: &mut Accounts) -> f64 {
    let paid = cell.pay(requested);
    books.heat += paid;
    paid
}
pub fn remodel(
    cell: &mut Cell,
    actual: &mut [f64; 2],
    target: [f64; 2],
    stock: usize,
    maximum: f64,
    books: &mut Accounts,
) -> f64 {
    let delta = [target[0] - actual[0], target[1] - actual[1]];
    let distance = delta[0].hypot(delta[1]);
    if distance == 0. || cell.body[stock] == 0. {
        return 0.;
    }
    let cost = WORK_PRICE * cell.body[stock];
    let length = distance.min(maximum.max(0.)).min(cell.energy / cost);
    for k in 0..2 {
        actual[k] += delta[k] * length / distance;
    }
    spend(cell, length * cost, books);
    length
}
pub fn injure(
    cell: &mut Cell,
    membrane: [f64; 2],
    cloud: &Cloud,
    field: &Field,
    chemistry: &Chemistry,
    c: &Config,
) -> f64 {
    let local = std::array::from_fn(|s| cloud.sample(field, s));
    let stress = std::array::from_fn(|s| {
        chemistry.properties[s].stress * (1. - 0.95 * chemistry::affinity(membrane, s, 3.))
    });
    injure_local(cell, &stress, &local, c)
}
pub fn injure_local(cell: &mut Cell, stress: &[f64; 256], local: &[f64; 256], c: &Config) -> f64 {
    let volume = cell.volume(c).max(f64::MIN_POSITIVE);
    let exposure: f64 = stress
        .iter()
        .enumerate()
        .map(|(s, p)| p * (local[s] + cell.inventory[s] / volume))
        .sum();
    let injury = (c.dt * c.damage_rate * exposure).min(1. - cell.damage);
    cell.damage += injury;
    injury
}
pub fn repair(
    cell: &mut Cell,
    species: usize,
    requested: f64,
    field: &mut Field,
    chemistry: &Chemistry,
    books: &mut Accounts,
) -> f64 {
    let mass = cell.mass();
    if mass == 0. {
        return 0.;
    }
    let u = chemistry.properties[species].potential;
    let body = chemistry.properties[chemistry.decomposition].potential;
    let (assembly, heat) = chemistry::assembly_cost(u, body, WORK_PRICE, EFFICIENCY);
    let price = assembly + WORK_PRICE;
    let q = requested
        .max(0.)
        .min(cell.damage * mass)
        .min(cell.inventory[species])
        .min(cell.energy / price);
    cell.inventory.set(species, cell.inventory[species] - q);
    cell.damage = (cell.damage - q / mass).max(0.);
    cell.energy -= q * price;
    books.heat += q * (heat + WORK_PRICE);
    let error = field.deposit(cell.x, cell.y, chemistry.decomposition, q, chemistry);
    books.rounding(error, body);
    q
}
pub fn split_material(cell: &mut Cell, books: &mut Accounts) -> Option<Cell> {
    // The caller owns birth permission and genealogical identity; this only divides funded state.
    let overhead = WORK_PRICE * cell.mass();
    if cell.energy < overhead || cell.mass() == 0. {
        return None;
    }
    spend(cell, overhead, books);
    for b in &mut cell.body {
        *b *= 0.5;
    }
    cell.inventory.scale(0.5);
    cell.energy *= 0.5;
    Some(cell.clone())
}
pub fn release(cell: &mut Cell, field: &mut Field, chemistry: &Chemistry, books: &mut Accounts) {
    for s in 0..256 {
        let q = cell.inventory[s];
        let error = field.deposit(cell.x, cell.y, s, q, chemistry);
        books.rounding(error, chemistry.properties[s].potential);
    }
    let body = cell.mass();
    let error = field.deposit(cell.x, cell.y, chemistry.decomposition, body, chemistry);
    books.rounding(
        error,
        chemistry.properties[chemistry.decomposition].potential,
    );
    books.heat += cell.energy;
    cell.inventory.fill(0.);
    cell.body.fill(0.);
    cell.energy = 0.;
}
pub fn washout(field: &mut Field, chemistry: &Chemistry, rate: f64, dt: f64, books: &mut Accounts) {
    let before = field.totals(chemistry);
    let factor = (-rate * dt).exp();
    for q in &mut field.amounts {
        *q = (*q as f64 * factor) as f32;
    }
    field.refresh(chemistry);
    let after = field.totals(chemistry);
    books.boundary_material -= before.0 * (1. - factor);
    books.boundary_energy -= before.1 * (1. - factor);
    books.material_error += before.0 * factor - after.0;
    books.energy_error += before.1 * factor - after.1;
}
