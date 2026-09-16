//! Actual coordinates approach inherited targets only through paid changes to funded stock.
use crate::{
    chemistry::Chemistry,
    config::Config,
    genetics::{Compiled, Target},
    organism::Cell,
};
fn distance(a: Target, b: Target) -> f64 {
    (a.x - b.x).abs() + (a.y - b.y).abs()
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
    let mut reach = distance(old.membrane, target.membrane);
    let mut cost = cell.body[0] * distance(old.membrane, target.membrane);
    for i in 0..4 {
        reach = reach.max(distance(old.receptors[i], target.receptors[i]));
        cost += cell.body[3 + i] * distance(old.receptors[i], target.receptors[i]);
        let (a, b) = (old.transporters[i], target.transporters[i]);
        reach = reach.max((a.x - b.x).abs() + (a.y - b.y).abs());
        cost += cell.body[7 + i] * ((a.x - b.x).abs() + (a.y - b.y).abs());
        let (a, b) = (old.enzymes[i], target.enzymes[i]);
        reach = reach
            .max((a.x - b.x).abs() + (a.y - b.y).abs() + (a.dx - b.dx).abs() + (a.dy - b.dy).abs());
        cost += cell.body[11 + i]
            * ((a.x - b.x).abs() + (a.y - b.y).abs() + (a.dx - b.dx).abs() + (a.dy - b.dy).abs());
    }
    cost *= c.construction_energy;
    let fraction = (dt * 0.25 / reach).min(1.);
    let surplus = (cell.energy - crate::accounting::interval_reserve(cell, &cell.body, c)).max(0.);
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
        a.dx = move_coordinate(a.dx, b.dx, fraction);
        a.dy = move_coordinate(a.dy, b.dy, fraction);
    }
    cell.machinery_revision += 1;
    if cell.installed == *target {
        cell.operators
            .as_mut()
            .unwrap()
            .complete_refit(&old, target, &g.operators);
        cell.machinery_genome = cell.genome;
    } else {
        cell.operators
            .as_mut()
            .unwrap()
            .update(&old, &cell.installed, c, chemistry);
    }
}
