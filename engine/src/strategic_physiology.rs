//! Accepted flow history and paid slow inference; physical state remains in the owning World.
use crate::{config::Config, controller::strategic, genetics::Compiled, organism::Cell};

pub fn capture(cell: &mut Cell, g: &Compiled, c: &Config, tick: u64, start: [f64; 2]) {
    crate::strategic_local::self_readings(cell, c, tick);
    let history = history(cell, c);
    let displacement = [
        crate::movement::delta(cell.x - start[0], c.width),
        crate::movement::delta(cell.y - start[1], c.height),
    ];
    let mut remaining = c.dt;
    while remaining > 0. {
        let span = remaining.min(strategic::interval(c) - cell.brain.strategy.elapsed);
        cell.brain.strategy.accumulate(
            history,
            displacement.map(|v| v * span / c.dt),
            cell.flows.distance * span / c.dt,
            span,
        );
        remaining -= span;
        if cell.brain.strategy.elapsed + 1e-12 >= strategic::interval(c) {
            let cost = if c.learning == "plastic" {
                cell.body[0] * c.plasticity_cost * c.physiology_interval
            } else {
                0.
            };
            let paid = cell.energy >= cost;
            if paid {
                let spent = cell.pay(cost);
                cell.flows.learning += spent;
                cell.brain.strategy.integral[0] -=
                    spent * strategic::interval(c) / cell.energy_capacity(c).max(1e-30);
            }
            strategic::evaluate(
                &g.chromosome.behavior.strategy,
                &mut cell.brain.strategy,
                c,
                paid,
            );
        }
    }
}

fn history(cell: &Cell, c: &Config) -> [f64; strategic::HISTORY] {
    let f = &cell.flows;
    let work = f.maintenance
        + f.motors
        + f.learning
        + f.transport
        + f.growth
        + f.cover_work
        + f.repair
        + f.emission
        + f.speech_work;
    let time = strategic::interval(c) / c.dt;
    let contacts = cell.contacts.iter().sum::<f64>();
    let activity = cell.brain.hearing.last[0] as f64;
    let diversity = if activity > 0. {
        (1..9)
            .map(|i| {
                let bit = cell.brain.hearing.last[i * 3] as f64 / activity;
                1. - bit * bit
            })
            .sum::<f64>()
            / 8.
    } else {
        0.
    };
    [
        (f.captured - work) / cell.energy_capacity(c).max(1e-30) * time,
        (cell.energy / cell.energy_capacity(c).max(1e-30)).clamp(0., 1.),
        cell.damage,
        f.grown / cell.mass().max(1e-30) * time,
        (0..4).map(|i| cell.inputs[i * 4] as f64).sum::<f64>() / 4.,
        (f.imported - f.exported) / cell.capacity(c).max(1e-30) * time,
        contacts / (1. + contacts),
        if cell.action.swim > 0. {
            cell.motor_load / cell.action.swim
        } else {
            0.
        },
        cell.inputs[crate::controller::LIGHT_INPUT] as f64,
        activity,
        diversity.clamp(0., 1.),
    ]
}
