//! Historical v20 refit arithmetic for frozen comparisons only; current cache-refresh API.
use antropy_engine::{
    chemistry::Chemistry,
    config::Config,
    genetics::{Compiled, Machinery, Target},
    organism::Cell,
};
fn distance(a: Target, b: Target) -> f64 {
    (a.x - b.x).abs() + (a.y - b.y).abs()
}
fn distances(a: &Machinery, b: &Machinery) -> [f64; 13] {
    let mut result = [0.; 13];
    result[12] = distance(a.membrane, b.membrane);
    for i in 0..4 {
        result[i] = distance(a.receptors[i], b.receptors[i]);
        let (x, y) = (a.transporters[i], b.transporters[i]);
        result[4 + i] = (x.x - y.x).abs() + (x.y - y.y).abs();
        let (x, y) = (a.enzymes[i], b.enzymes[i]);
        result[8 + i] = (x.x - y.x).abs()
            + (x.y - y.y).abs()
            + (x.center_x - y.center_x).abs()
            + (x.center_y - y.center_y).abs();
    }
    result
}
fn move_target(a: &mut Target, b: Target, f: f64) {
    a.x = move_coordinate(a.x, b.x, f);
    a.y = move_coordinate(a.y, b.y, f);
}
fn move_coordinate(a: f64, b: f64, f: f64) -> f64 {
    if f == 1. { b } else { a + (b - a) * f }
}
pub fn advance(cell: &mut Cell, g: &Compiled, c: &Config, chemistry: &Chemistry, dt: f64) {
    let target = &g.chromosome.chemistry;
    if cell.installed == *target {
        return;
    }
    let old = cell.installed.clone();
    let distances = distances(&old, target);
    let stocks = cell.body[3..].iter().chain([&cell.body[0]]);
    let (reach, cost) = distances
        .iter()
        .zip(stocks)
        .filter(|(_, stock)| **stock > 0.)
        .fold((0_f64, 0.), |(reach, cost), (distance, stock)| {
            (
                reach.max(*distance),
                cost + distance * stock * c.construction_energy,
            )
        });
    let fraction = if reach > 0. {
        (dt * 0.25 / reach).min(1.)
    } else {
        1.
    };
    let surplus =
        (cell.energy - antropy_engine::accounting::interval_reserve(cell, &cell.body, c)).max(0.);
    let paid = cell.pay((cost * fraction).min(surplus));
    let fraction = if cost > 0. { paid / cost } else { fraction };
    if fraction == 0. {
        return;
    }
    cell.flows.refitting += paid;
    move_target(&mut cell.installed.membrane, target.membrane, fraction);
    for i in 0..4 {
        move_target(
            &mut cell.installed.receptors[i],
            target.receptors[i],
            fraction,
        );
        let (a, b) = (&mut cell.installed.transporters[i], target.transporters[i]);
        a.x = move_coordinate(a.x, b.x, fraction);
        a.y = move_coordinate(a.y, b.y, fraction);
        let (a, b) = (&mut cell.installed.enzymes[i], target.enzymes[i]);
        a.x = move_coordinate(a.x, b.x, fraction);
        a.y = move_coordinate(a.y, b.y, fraction);
        a.center_x = move_coordinate(a.center_x, b.center_x, fraction);
        a.center_y = move_coordinate(a.center_y, b.center_y, fraction);
    }
    cell.machinery_revision += 1;
    cell.operators.as_mut().unwrap().refit(
        &old,
        &cell.installed,
        (target, &g.operators),
        c,
        chemistry,
    );
    if cell.installed == *target {
        cell.machinery_genome = cell.genome;
    }
}
