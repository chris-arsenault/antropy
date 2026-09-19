//! Actual coordinates approach inherited targets only through paid changes to funded stock.
use crate::{
    chemistry::Chemistry,
    config::Config,
    genetics::{Compiled, Machinery, Target, angles},
    organism::Cell,
};
fn distance(a: Target, b: Target) -> f64 {
    crate::chemistry::distance_squared(a.point(), b.point()).sqrt()
}
fn distances(a: &Machinery, b: &Machinery, radius: f64) -> [f64; 13] {
    let mut result = [0.; 13];
    result[12] = distance(a.membrane, b.membrane);
    for i in 0..4 {
        result[i] = distance(a.receptors[i], b.receptors[i]);
        let (x, y) = (a.transporters[i], b.transporters[i]);
        result[4 + i] = crate::chemistry::distance_squared([x.x, x.y], [y.x, y.y]).sqrt();
        let (x, y) = (a.enzymes[i], b.enzymes[i]);
        result[8 + i] = crate::chemistry::distance_squared([x.x, x.y], [y.x, y.y]).sqrt()
            + crate::chemistry::distance_squared(
                [x.center_x, x.center_y],
                [y.center_x, y.center_y],
            )
            .sqrt()
            + radius * angles::difference(x.angle, y.angle).abs();
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
    let distances = distances(&old, target, c.affinity_radius);
    let stocks: [f64; 13] = std::array::from_fn(|i| {
        if i == 12 {
            cell.body[0]
        } else {
            cell.body[i + 3]
        }
    });
    let mut fractions: [f64; 13] = std::array::from_fn(|i| {
        if stocks[i] == 0. || distances[i] == 0. {
            1.
        } else {
            (dt * 0.25 / distances[i]).min(1.)
        }
    });
    let cost: f64 = (0..13)
        .map(|i| fractions[i] * distances[i] * stocks[i] * c.construction_energy)
        .sum();
    let surplus = (cell.energy - crate::accounting::interval_reserve(cell, &cell.body, c)).max(0.);
    let paid = cell.pay(cost.min(surplus));
    let funding = if cost > 0. { (paid / cost).min(1.) } else { 1. };
    for i in 0..13 {
        if stocks[i] > 0. {
            fractions[i] *= funding;
        }
    }
    cell.flows.refitting += paid;
    move_target(&mut cell.installed.membrane, target.membrane, fractions[12]);
    for i in 0..4 {
        move_target(
            &mut cell.installed.receptors[i],
            target.receptors[i],
            fractions[i],
        );
        let (a, b) = (&mut cell.installed.transporters[i], target.transporters[i]);
        a.x = move_coordinate(a.x, b.x, fractions[4 + i]);
        a.y = move_coordinate(a.y, b.y, fractions[4 + i]);
        let (a, b) = (&mut cell.installed.enzymes[i], target.enzymes[i]);
        a.x = move_coordinate(a.x, b.x, fractions[8 + i]);
        a.y = move_coordinate(a.y, b.y, fractions[8 + i]);
        a.center_x = move_coordinate(a.center_x, b.center_x, fractions[8 + i]);
        a.center_y = move_coordinate(a.center_y, b.center_y, fractions[8 + i]);
        a.angle = angles::interpolate(a.angle, b.angle, fractions[8 + i]);
    }
    if cell.installed == old {
        return;
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
