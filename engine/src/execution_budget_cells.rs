//! Local finite-window probes on owned clones; no live controller or material changes.
use crate::{config::Config, controller, field::Field, organism::Cell, world::World};

fn action_change(a: controller::Action, b: controller::Action) -> f64 {
    [
        a.swim - b.swim,
        (a.turn - b.turn) / 2.,
        a.repair - b.repair,
        a.retirement - b.retirement,
    ]
    .into_iter()
    .chain(a.transport.into_iter().zip(b.transport).map(|(a, b)| a - b))
    .chain(a.activity.into_iter().zip(b.activity).map(|(a, b)| a - b))
    .chain(
        a.allocation
            .into_iter()
            .zip(b.allocation)
            .map(|(a, b)| a - b),
    )
    .map(f64::abs)
    .fold(0., f64::max)
}

pub(super) fn neural_rate(cell: &Cell, w: &World) -> f64 {
    let genome = &w.genomes[&cell.genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .behavior;
    let mut config = w.config.clone();
    config.dt = config.physiology_interval;
    let mut state = cell.brain.clone();
    let mut action = cell.action;
    let (mut maximum, mut energy) = (0_f64, cell.energy);
    for _ in 0..4 {
        let before = state.clone();
        let cost = if config.learning == "plastic" {
            config.plasticity_cost * config.dt * cell.body[0]
        } else {
            0.
        };
        let learn = energy >= cost;
        if learn {
            energy -= cost;
        }
        let next = controller::act(genome, &cell.inputs, &mut state, &config, learn);
        let before_traces = controller::current_traces(&before);
        let after_traces = controller::current_traces(&state);
        let change = before
            .hidden
            .iter()
            .chain(&before_traces)
            .zip(state.hidden.iter().chain(&after_traces))
            .map(|(a, b)| (*a as f64 - *b as f64).abs() / 2.)
            .fold(0., f64::max);
        maximum = maximum
            .max(change)
            .max(action_change(action, next))
            .max(before.task.abs_diff(state.task) as f64 / 255.);
        action = next;
    }
    maximum / config.dt
}

pub(super) fn motion_rate(
    cell: &Cell,
    c: &Config,
    field: &Field,
    row: &[(usize, f64)],
    contact: [f64; 2],
) -> f64 {
    let mobility = crate::movement::mobility(field.medium_load(row), c.movement_impedance);
    let (speed, _) = crate::movement::motor_limits(cell, c, mobility);
    let power = crate::movement::motor_work_rate(
        &cell.body,
        cell.damage,
        cell.action.swim,
        cell.action.turn,
        c,
    );
    let fraction = if power > 0. {
        (cell.energy / (power * c.dt)).min(1.).sqrt()
    } else {
        0.
    };
    let radius = cell.radius(c).max(0.01);
    let profile = cell.operators.as_ref().unwrap().profile;
    let passive = crate::movement::passive(profile, field.gradient(row), 0., mobility, field.drift);
    let turning = cell.action.turn * speed * fraction / (2. * radius);
    let heading = cell.heading + turning * c.dt;
    let swimming = speed * cell.action.swim * fraction;
    let vx = swimming * heading.cos() + passive[0] + contact[0];
    let vy = swimming * heading.sin() + passive[1] + contact[1];
    vx.hypot(vy) / radius.min(field.spacing) + turning.abs()
}

pub(super) fn transport_rates(
    cell: &Cell,
    c: &Config,
    local: &[f64; 256],
    field_access: f64,
) -> ([f64; 256], [f64; 256], usize) {
    let mut gross = [0.; 256];
    let mut net = [0.; 256];
    let mut weight = 0;
    let volume = cell.volume(c).max(1e-30);
    for (slot, support) in cell
        .operators
        .as_ref()
        .unwrap()
        .transporters
        .iter()
        .enumerate()
    {
        let effort = 2. * cell.action.transport[slot] - 1.;
        let capacity = c.transporter_turnover
            * cell.body[7 + slot]
            * (1. - cell.damage)
            * effort.abs()
            * if effort < 0. { field_access } else { 1. };
        if capacity == 0. {
            continue;
        }
        weight += support.len();
        let available = |s| {
            if effort >= 0. {
                local[s]
            } else {
                cell.inventory.value(s) / volume
            }
        };
        let occupancy: f64 = support.iter().map(|a| a.value * available(a.species)).sum();
        for a in support.iter() {
            let q = capacity * a.value * available(a.species) / (c.receptor_k + occupancy);
            gross[a.species] += q;
            net[a.species] += q * effort.signum();
        }
    }
    let demand: f64 = gross.iter().sum();
    let funding = (cell.energy / (c.dt * c.transport_energy * demand).max(1e-30)).min(1.);
    gross.iter_mut().for_each(|q| *q *= funding);
    net.iter_mut().for_each(|q| *q *= funding);
    (gross, net, weight)
}

pub(super) fn chemical_rate(cell: &Cell, c: &Config, gross: &[f64; 256]) -> (f64, f64) {
    let floor = crate::field_activity::CONCENTRATION_FLOOR as f64 * cell.volume(c);
    let maximum = gross
        .iter()
        .enumerate()
        .map(|(s, q)| q.abs() / (cell.inventory.value(s) + floor).max(1e-30))
        .fold(0., f64::max);
    let bulk = gross.iter().map(|q| q.abs()).sum::<f64>()
        / (cell.material() + c.receptor_k * cell.volume(c)).max(1e-30);
    (maximum, bulk)
}

pub(super) fn physiology_rates(
    cell: &Cell,
    w: &World,
    row: &[(usize, f64)],
    executor: &mut crate::metabolism::Executor,
) -> ([f64; 256], [f64; 256], f64, f64, usize) {
    let c = &w.config;
    let dt = c.dt;
    let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
    let mut probe = cell.clone();
    probe.flows = Default::default();
    let signal = crate::weathering::signal(std::array::from_fn(|k| {
        row.iter()
            .map(|&(n, a)| a * w.field.medium_signal(n)[k])
            .sum()
    }));
    let signal = crate::illumination::drive(signal, w.field.illumination.sample(row));
    let load = crate::sensing::stress_load(&probe, g, c, &w.field, &w.chemistry);
    probe.damage = (probe.damage + dt * c.damage_rate * load / (c.stress_k + load)).min(1.);
    let work = executor.react(&mut probe, c, &w.chemistry, dt, true, signal);
    let mut gross = [0.; 256];
    for (s, t, q) in work.reactions() {
        gross[s] += q / dt;
        gross[t] += q / dt;
    }
    let count = work.reactions().count();
    crate::metabolism::repair(&mut probe, c, &w.chemistry, dt);
    crate::metabolism::grow(&mut probe, g, c, &w.chemistry, dt);
    let stock = cell
        .body
        .iter()
        .zip(probe.body)
        .map(|(a, b)| (b - a).abs() / (a + c.receptor_k * cell.mass()).max(1e-30) / dt)
        .fold(0., f64::max);
    let damage = (probe.damage - cell.damage).abs() / dt;
    let motor = crate::movement::motor_work_rate(
        &cell.body,
        cell.damage,
        cell.action.swim,
        cell.action.turn,
        c,
    );
    let learning = if c.learning == "plastic" {
        c.plasticity_cost * cell.body[0]
    } else {
        0.
    };
    let spending = motor
        + cell.basal(c) / dt
        + learning
        + (probe.flows.repair + probe.flows.construction) / dt;
    let energy = spending / (cell.energy + c.receptor_k * cell.energy_capacity(c)).max(1e-30);
    let net = std::array::from_fn(|s| (probe.inventory.value(s) - cell.inventory.value(s)) / dt);
    (gross, net, stock.max(damage), energy, count)
}
