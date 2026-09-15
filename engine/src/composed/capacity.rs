//! Bounded arithmetic measurement, not an ecological run or an alternate World step.
use super::{
    Accounts,
    bodies::{self, Cloud},
    events,
    exchange::Exchange,
    field::Kernel,
    machinery::{self, ReactionWork},
};
use crate::{
    abi::clock,
    chemical_operators::{CompiledOperators, OperatorCompiler},
    chemistry::Chemistry,
    config::Config,
    field::Field,
    genetics::Target,
    machinery_parameters::{
        EnzymeParameters, InstalledParameters, MachineryParameters, PARAMETER_VERSION,
        TransportParameters,
    },
    organism::Cell,
    world::World,
};
use serde_json::{Value, json};

fn instructions(i: usize) -> InstalledParameters {
    let point = |j: usize| {
        [
            1. + ((i * 37 + j * 13) % 127) as f64 / 10.,
            1. + ((i * 53 + j * 17) % 127) as f64 / 10.,
        ]
    };
    InstalledParameters {
        revision: 0,
        parameters: MachineryParameters {
            version: PARAMETER_VERSION,
            receptors: std::array::from_fn(|j| {
                let [x, y] = point(j);
                Target { x, y }
            }),
            transporters: std::array::from_fn(|j| {
                let [x, y] = point(j + 4);
                TransportParameters {
                    center: Target { x, y },
                }
            }),
            enzymes: std::array::from_fn(|j| EnzymeParameters {
                center: {
                    let [x, y] = point(j + 8);
                    Target { x, y }
                },
                offset: [
                    2.25 * if (i + j).is_multiple_of(2) { 1. } else { -1. },
                    -1.5,
                ],
            }),
            membrane: {
                let [x, y] = point(12);
                Target { x, y }
            },
        },
    }
}
fn clouds(w: &World, materials: &[bodies::Material]) -> Vec<Cloud> {
    w.cells
        .iter()
        .zip(materials)
        .map(|(c, material)| Cloud::from_material(c, material, &w.field))
        .collect()
}
fn replenish(cells: &mut [Cell], chemistry: &Chemistry, config: &Config, books: &mut Accounts) {
    for cell in cells {
        for s in 0..256 {
            let addition = 0.001 - cell.inventory[s];
            books.boundary_material += addition;
            books.boundary_energy += addition * chemistry.properties[s].potential;
            cell.inventory.set(s, 0.001);
        }
        let energy = cell.energy_capacity(config);
        books.boundary_energy += energy - cell.energy;
        cell.energy = energy;
        cell.action.transport = [1., 0., 1., 0.];
    }
}
fn cellular(
    context: (&mut [Cell], &mut Field, &Config, &Chemistry),
    compiled: (
        &mut [CompiledOperators],
        &mut [InstalledParameters],
        &OperatorCompiler<'_>,
    ),
    local: &[[f64; 256]],
    work: &mut ReactionWork,
    books: &mut Accounts,
    tick: usize,
) -> Result<[f64; 5], String> {
    let (cells, field, config, chemistry) = context;
    let (operators, parameters, compiler) = compiled;
    let mut counts = [0.; 5];
    let mut physiology = config.clone();
    physiology.dt = config.physiology_interval;
    let scale = physiology.dt / config.dt;
    for (i, cell) in cells.iter_mut().enumerate() {
        cell.receptors = machinery::receptors(cell, &operators[i], &local[i]);
        events::injure_local(cell, &operators[i].stress, &local[i], &physiology);
        counts[0] += work.react(cell, &operators[i], &physiology, physiology.dt, books);
        let feed = operators[i].enzymes[0][0].substrate;
        counts[1] += events::repair(cell, feed, 0.00001 * scale, field, chemistry, books);
        counts[2] += events::assemble(cell, feed, 3, 0.00001 * scale, chemistry, books);
        events::spend(cell, 0.000001 * scale, books);
        if (i + tick).is_multiple_of(20) {
            let p = &mut parameters[i];
            let mut actual = p.parameters.membrane.point();
            let target = [
                actual[0] + if tick.is_multiple_of(2) { 0.01 } else { -0.01 },
                actual[1],
            ];
            let moved = events::remodel(cell, &mut actual, target, 0, 0.001 * scale, books);
            counts[3] += moved;
            if moved > 0. {
                p.parameters.membrane = Target {
                    x: actual[0],
                    y: actual[1],
                };
                p.revision = p
                    .revision
                    .checked_add(1)
                    .ok_or("Installed revision overflow")?;
                compiler.refresh_installed(&mut operators[i], p)?;
                counts[4] += 1.;
            }
        }
    }
    Ok(counts)
}
fn totals(w: &World) -> [f64; 2] {
    let (mut m, mut e) = w.field.totals(&w.chemistry);
    for c in &w.cells {
        m += c.mass() + c.material();
        e += c.energy + c.mass() * w.chemistry.properties[w.chemistry.decomposition].potential;
        e += c
            .inventory
            .iter()
            .zip(&w.chemistry.properties)
            .map(|(q, p)| q * p.potential)
            .sum::<f64>();
    }
    [m, e]
}
fn windows(values: &[f64]) -> Vec<f64> {
    values
        .chunks_exact(20)
        .map(|v| v.iter().sum::<f64>() / 20.)
        .collect()
}
fn mean(values: &[f64]) -> f64 {
    values.iter().sum::<f64>() / values.len().max(1) as f64
}
fn worst(values: &[f64]) -> f64 {
    windows(values).iter().copied().fold(0., f64::max)
}

pub fn run(w: &mut World, baseline: bool) -> Result<Value, String> {
    if w.tick != 0 || ![48, 2000].contains(&w.cells.len()) {
        return Err("Composed capacity requires the tick-zero registered fixture".into());
    }
    let numeric_error = super::numeric::audit();
    if numeric_error > 4e-7 {
        return Err("Composed SIMD arithmetic exceeds error bound".into());
    }
    // The fixture's original h=2 amounts are rescaled to retain concentration and world material.
    let area_scale = w.field.spacing.powi(2) / 4.;
    for q in &mut w.field.amounts {
        *q = (*q as f64 * area_scale) as f32;
    }
    w.field.refresh(&w.chemistry);
    let cold = clock();
    let compiler = OperatorCompiler::new(&w.chemistry)?;
    let mut parameters = (0..w.cells.len()).map(instructions).collect::<Vec<_>>();
    let mut operators = parameters
        .iter()
        .map(|p| compiler.compile_installed(p))
        .collect::<Result<Vec<_>, _>>()?;
    let mut kernel = Kernel::new(&w.field, &w.chemistry);
    let mut materials = w
        .cells
        .iter()
        .zip(&operators)
        .map(|(c, op)| kernel.material(c, op.profile, &w.config))
        .collect::<Vec<_>>();
    let mut material_dirty = false;
    let cold_ms = clock() - cold;
    let operator_bytes = operators
        .iter()
        .map(CompiledOperators::owned_bytes)
        .sum::<usize>();
    let mut exchange = Exchange::default();
    let mut reaction = ReactionWork::default();
    let mut books = Accounts::default();
    let initial = totals(w);
    let mut ticks = vec![];
    let mut spatial = vec![];
    let mut cellular_times = vec![];
    let mut counts = [0.; 10];
    counts[9] = w.cells.len() as f64;
    let start = clock();
    let mut stop = "horizon";
    let mut elapsed = 0.;
    let mut cellular_elapsed = 0.;
    let mut cellular_model_time = 0.;
    let mut cellular_steps = 0;
    for tick in 0..110 {
        if clock() - start >= 60000. {
            stop = "wall cap";
            break;
        }
        let at = clock();
        if baseline {
            let b = w.field.advance(
                &w.chemistry,
                w.config.dt,
                w.config.washout,
                w.config.diffusion_impedance,
            );
            books.boundary_material -= b.matter;
            books.boundary_energy -= b.energy;
            books.material_error += b.roundoff_matter;
            books.energy_error += b.roundoff_energy;
            if tick >= 10 {
                ticks.push(clock() - at);
                spatial.push(clock() - at);
                cellular_times.push(0.);
            }
        } else {
            cellular_elapsed += w.config.dt;
            let physiology_due = cellular_elapsed + 1e-12 >= w.config.physiology_interval;
            if physiology_due {
                replenish(&mut w.cells, &w.chemistry, &w.config, &mut books);
                material_dirty = true;
            }
            if material_dirty {
                for ((material, cell), op) in materials.iter_mut().zip(&w.cells).zip(&operators) {
                    *material = kernel.material(cell, op.profile, &w.config);
                    counts[9] += 1.;
                }
                material_dirty = false;
            }
            let mut geometry = clouds(w, &materials);
            let field_at = clock();
            counts[7] += kernel.advance_washout(
                &mut w.field,
                &w.chemistry,
                &geometry,
                w.config.dt,
                w.config.washout,
                &mut books,
            )? as f64;
            // Motion and field transport read the same frozen medium for this explicit step.
            for (cell, cloud) in w.cells.iter_mut().zip(&geometry) {
                let (passive, motor) = bodies::motion(
                    cell,
                    cloud,
                    &w.field,
                    &kernel,
                    [0.002, 0.001],
                    w.config.dt,
                    &mut books,
                );
                counts[5] += passive[0].hypot(passive[1]);
                counts[6] += motor[0].hypot(motor[1]);
            }
            let spatial_ms = clock() - field_at;
            let bio_at = clock();
            if physiology_due {
                geometry = clouds(w, &materials);
                let mut physiology = w.config.clone();
                physiology.dt = cellular_elapsed;
                counts[8] += exchange.advance(
                    &mut w.cells,
                    &operators,
                    &geometry,
                    &mut w.field,
                    (&w.chemistry, &physiology),
                    &mut books,
                );
                let used = cellular(
                    (&mut w.cells, &mut w.field, &w.config, &w.chemistry),
                    (&mut operators, &mut parameters, &compiler),
                    &exchange.local,
                    &mut reaction,
                    &mut books,
                    cellular_steps,
                )?;
                for k in 0..5 {
                    counts[k] += used[k];
                }
                if tick >= 10 {
                    cellular_model_time += cellular_elapsed;
                }
                cellular_elapsed = 0.;
                cellular_steps += 1;
                material_dirty = true;
            }
            let bio_ms = clock() - bio_at;
            if tick >= 10 {
                ticks.push(clock() - at);
                spatial.push(spatial_ms);
                cellular_times.push(bio_ms);
            }
        }
        elapsed += w.config.dt;
        w.tick += 1;
    }
    let final_state = totals(w);
    let residual = [
        initial[0] + books.boundary_material - final_state[0] - books.material_error,
        initial[1] + books.boundary_energy - final_state[1] - books.heat - books.energy_error,
    ];
    let balanced = residual
        .iter()
        .zip(initial)
        .all(|(r, initial)| r.is_finite() && r.abs() <= 2e-9 * (1. + initial.abs()));
    let active = baseline || counts.iter().all(|n| n.is_finite() && *n > 0.);
    let cost = ticks.len() == 100
        && balanced
        && active
        && worst(&spatial) <= 12.
        && worst(&cellular_times) <= 10.
        && worst(&ticks) <= 22.;
    let operations = json!({"reacted":counts[0],"repaired":counts[1],"assembled":counts[2],"remodeledDistance":counts[3],"changedInstalledSets":counts[4],"passiveDistance":counts[5],"motorDistance":counts[6],"fieldSubsteps":counts[7],"exchanged":counts[8],"materialProjections":counts[9]});
    Ok(
        json!({"scope":if baseline {"existing diffusion only; same model time"} else {"composed matrix arithmetic; excludes RNN, birth orchestration, contacts, GPU and observation/history"},
        "revision":7,"operatorVersion":crate::chemical_operators::OPERATOR_VERSION,"parameterVersion":PARAMETER_VERSION,"sharedDefinitionBytes":operators[0].key.definition.len(),"maximumOperatorBytes":CompiledOperators::maximum_owned_bytes(),"accountsBalanced":balanced,"workloadActive":active,"measuredCellularModelTime":cellular_model_time,"pendingCellularTime":cellular_elapsed,"config":w.config,"population":w.cells.len(),"channels":256,"warmup":10,"measuredTicks":ticks.len(),"modelTime":elapsed,"measuredModelTime":ticks.len() as f64*w.config.dt,
        "tickMs":ticks,"meanMs":mean(&ticks),"worstWindowMs":worst(&ticks),"spatialMeanMs":mean(&spatial),"spatialWorstMs":worst(&spatial),"cellularMeanMs":mean(&cellular_times),"cellularWorstMs":worst(&cellular_times),
        "coldCompileMs":cold_ms,"operatorBytes":operator_bytes,"scratchBytes":kernel.owned_bytes()+exchange.owned_bytes()+materials.capacity()*size_of::<bodies::Material>(),"accounts":books,"initial":initial,"final":final_state,"residual":residual,
        "operations":operations,
        "numericRelativeError":numeric_error,"stoppingReason":stop,"fitsAllocation":cost,"allocationMs":{"spatial":12,"cellular":10,"remaining":11.3}}),
    )
}
