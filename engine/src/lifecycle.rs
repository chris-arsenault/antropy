use crate::{
    ancestry::{ALIVE, Ancestor, Cause},
    controller,
    organism::Cell,
    world::World,
};
pub fn release(w: &mut World, cell: &Cell, cause: Cause) {
    release_fraction(w, cell, cause, 1.);
}
pub(crate) fn release_fraction(w: &mut World, cell: &Cell, cause: Cause, body_fraction: f64) {
    let row = crate::footprint::sites(cell, &w.config, &w.field);
    for s in 0..256 {
        let q = cell.inventory.value(s) + body_fraction * cell.bound_material.value(s);
        for &(node, weight) in &row {
            let loss = w.field.add(node, s, q * weight, &w.chemistry);
            w.ledger.rounding(loss, s, &w.chemistry);
        }
    }
    w.ledger.death_heat += cell.energy;
    if let Some(o) = &mut w.observer {
        o.ended(cell.id);
    }
    w.ledger.deaths += 1;
    if matches!(cause, Cause::Disturbance) {
        w.ledger.disturbance_deaths += 1;
    }
    let a = crate::ancestry::get_mut(&mut w.ancestry, cell.id).unwrap();
    a.ended = w.tick;
    a.cause = cause;
    if let Some(t) = &mut w.trace {
        t.life(cell, cause.as_str(), w.tick);
    }
    w.event(cause.as_str(), cell.id, vec![]);
}
fn child(w: &mut World, parent: &Cell, offset: [f64; 2]) -> Cell {
    let genotype = &w.genomes[&parent.genome];
    let mut g = genotype.inherit(
        w.next_genome,
        w.tick,
        &parent.brain,
        &mut w.genetic_rng,
        &w.config,
        &w.chemistry,
    );
    let mut cell = parent.clone();
    cell.bound_material.scale(0.5);
    cell.inventory = cell.inventory.half();
    cell.energy *= 0.5;
    crate::genetics::repertoire::mutate(&mut g, &mut w.genetic_rng, &w.config, &w.chemistry);
    let same = g.chromosomes == genotype.chromosomes;
    let genome = if same { parent.genome } else { g.id };
    if !same {
        w.next_genome += 1;
        w.genomes.insert(g.id, g);
    }
    cell.id = w.next_cell;
    w.next_cell += 1;
    cell.parent = Some(parent.id);
    cell.genome = genome;
    let compiled = w.genomes[&genome].compiled.as_ref().unwrap();
    crate::physiology::express(&mut cell, compiled);
    cell.born = w.tick;
    cell.generation += 1;
    cell.brain = controller::strategic::daughter(&parent.brain, w.environment_rng.next_u64());
    cell.action = controller::Action::default();
    cell.contacts = [0.; 4];
    cell.activity = Default::default();
    cell.interface = Default::default();
    cell.flows = Default::default();
    cell.chemical_flows = Default::default();
    cell.heading = w.rng.unit() * std::f64::consts::TAU;
    let radius = cell.radius(&w.config);
    cell.x = (cell.x + radius * offset[0]).rem_euclid(w.config.width);
    cell.y = (cell.y + radius * offset[1]).rem_euclid(w.config.height);
    crate::sensing::initialize(&mut cell, compiled, &w.config, &w.field);
    w.ancestry.push(Ancestor {
        id: cell.id,
        parent: parent.id,
        lineage: cell.lineage,
        genome,
        born: w.tick,
        ended: ALIVE,
        cause: Cause::Alive,
    });
    w.ledger.births += 1;
    if let Some(o) = &mut w.observer {
        o.birth(&cell);
    }
    if let Some(t) = &mut w.trace {
        t.life(&cell, "birth", w.tick);
    }
    cell
}
fn division_cost(
    cell: &Cell,
    target: &crate::organism::Body,
    config: &crate::config::Config,
    tick: u64,
) -> Option<f64> {
    if cell.mass() + 1e-12 < 2. * target.iter().sum::<f64>() {
        return None;
    }
    let (material, energy, cost) = crate::accounting::division_requirements(cell, config, tick);
    (cell.material() >= material && cell.energy >= energy).then_some(cost)
}
pub fn reproduce(w: &mut World) {
    let mut parents = std::mem::take(&mut w.cells);
    parents.retain_mut(|cell| {
        let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
        let Some(division) = division_cost(cell, &g.body, &w.config, w.tick) else {
            return true;
        };
        let fission = w.config.reproduction == "fission";
        let paid = cell.pay(division);
        if let Some(study) = w.trace.as_mut().and_then(|t| t.study.as_mut()) {
            study.flow(cell, "division", None, None, paid);
        }
        w.ledger.division_heat += paid;
        if let Some(o) = w.observer.as_mut().filter(|o| o.active()) {
            o.division(cell, paid);
        }
        w.ledger.divisions += 1;
        cell.brain.strategy.divisions += 1;
        cell.brain.strategy.last_division_age = cell.age(&w.config, w.tick);
        if let Some(t) = &mut w.trace {
            t.life(cell, "division", w.tick);
        }
        let (sin, cos) = (w.rng.unit() * std::f64::consts::TAU).sin_cos();
        let a = child(w, cell, [cos, sin]);
        if fission {
            let b = child(w, cell, [-cos, -sin]);
            let record = crate::ancestry::get_mut(&mut w.ancestry, cell.id).unwrap();
            record.ended = w.tick;
            record.cause = Cause::Division;
            if let Some(o) = &mut w.observer {
                o.ended(cell.id);
            }
            w.cells.push(b);
        } else {
            cell.bound_material.scale(0.5);
            cell.inventory.scale(0.5);
            cell.energy *= 0.5;
            crate::physiology::express(cell, w.genomes[&cell.genome].compiled.as_ref().unwrap());
        }
        w.cells.push(a);
        !fission
    });
    parents.append(&mut w.cells);
    w.cells = parents;
    w.cells.sort_unstable_by_key(|c| c.id);
    crate::ancestry::compact(w);
}
fn select_disturbance(w: &mut World, dead: &mut Vec<(Cell, Cause)>) -> Option<[f64; 2]> {
    let d = w.config.disturbance.clone()?;
    if w.environment_rng.unit() >= 1. - (-w.config.dt / d.mean_interval).exp() {
        return None;
    }
    let center = [
        w.environment_rng.unit() * w.config.width,
        w.environment_rng.unit() * w.config.height,
    ];
    let cells = std::mem::take(&mut w.cells);
    for cell in cells {
        if crate::movement::distance([cell.x, cell.y], center, &w.config) < d.radius
            && w.environment_rng.unit() < d.mortality
        {
            dead.push((cell, Cause::Disturbance));
        } else {
            w.cells.push(cell);
        }
    }
    Some(center)
}
fn mix_disturbance(w: &mut World, center: [f64; 2]) {
    let d = w.config.disturbance.as_ref().unwrap();
    let nodes: Vec<_> = (0..w.field.nx * w.field.ny)
        .filter(|i| {
            crate::movement::distance(
                [
                    (*i % w.field.nx) as f64 * w.field.spacing + w.field.spacing / 2.,
                    (*i / w.field.nx) as f64 * w.field.spacing + w.field.spacing / 2.,
                ],
                center,
                &w.config,
            ) < d.radius
        })
        .collect();
    if !nodes.is_empty() {
        for s in 0..256 {
            let mean = nodes
                .iter()
                .map(|i| w.field.amounts()[i * 256 + s] as f64)
                .sum::<f64>()
                / nodes.len() as f64;
            for &i in &nodes {
                let loss = w.field.add(
                    i,
                    s,
                    d.mixing * (mean - w.field.amounts()[i * 256 + s] as f64),
                    &w.chemistry,
                );
                w.ledger.rounding(loss, s, &w.chemistry);
            }
        }
    }
}
pub fn advance(w: &mut World) {
    let reference = w.cells.iter().map(|c| c.mass()).sum();
    let mut dead = vec![];
    let cells = std::mem::take(&mut w.cells);
    for cell in cells {
        if cell.energy <= 0. || cell.damage >= 1. {
            let cause = if cell.damage >= 1. {
                Cause::Damage
            } else {
                Cause::Starvation
            };
            dead.push((cell, cause));
        } else {
            w.cells.push(cell);
        }
    }
    let disturbance = select_disturbance(w, &mut dead);
    crate::mortality_recovery::batch(w, dead, reference);
    if let Some(center) = disturbance {
        mix_disturbance(w, center);
    }
    reproduce(w);
}

/// Isolated disturbance checks use the same batch and mixing path as ordinary lifecycle.
pub fn disturb(w: &mut World) {
    let reference = w.cells.iter().map(|c| c.mass()).sum();
    let mut dead = vec![];
    let center = select_disturbance(w, &mut dead);
    crate::mortality_recovery::batch(w, dead, reference);
    if let Some(center) = center {
        mix_disturbance(w, center);
    }
}
