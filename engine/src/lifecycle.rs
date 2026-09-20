use crate::{
    ancestry::{ALIVE, Ancestor, Cause},
    controller,
    organism::Cell,
    world::World,
};
pub fn release(w: &mut World, cell: &Cell, cause: Cause) {
    let row = crate::footprint::sites(cell, &w.config, &w.field);
    for s in 0..256 {
        let q = cell.inventory[s] + cell.bound_material[s];
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
    let a = &mut w.ancestry[cell.id as usize - 1];
    a.ended = w.tick;
    a.cause = cause;
    if let Some(t) = &mut w.trace {
        t.life(cell, cause.as_str(), w.tick);
    }
    w.event(cause.as_str(), cell.id, vec![]);
}
fn child(w: &mut World, parent: &Cell, sign: f64) -> Cell {
    let genotype = &w.genomes[&parent.genome];
    let g = genotype.inherit(
        w.next_genome,
        w.tick,
        &parent.brain,
        &mut w.genetic_rng,
        &w.config,
        &w.chemistry,
    );
    let same = g.chromosomes == genotype.chromosomes;
    let genome = if same { parent.genome } else { g.id };
    if !same {
        w.next_genome += 1;
        w.genomes.insert(g.id, g);
    }
    let mut cell = parent.clone();
    cell.id = w.next_cell;
    w.next_cell += 1;
    cell.parent = Some(parent.id);
    cell.genome = genome;
    cell.born = w.tick;
    cell.generation += 1;
    cell.body = cell.body.map(|q| q * 0.5);
    cell.bound_material.scale(0.5);
    cell.inventory = cell.inventory.half();
    cell.energy *= 0.5;
    cell.brain = controller::State::default();
    cell.action = controller::Action::default();
    cell.contacts = [0.; 4];
    cell.flows = Default::default();
    cell.chemical_flows = Default::default();
    let radius = cell.radius(&w.config);
    cell.x = (cell.x + sign * radius * parent.heading.cos()).rem_euclid(w.config.width);
    cell.y = (cell.y + sign * radius * parent.heading.sin()).rem_euclid(w.config.height);
    crate::sensing::initialize(
        &mut cell,
        w.genomes[&genome].compiled.as_ref().unwrap(),
        &w.config,
        &w.field,
    );
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
) -> Option<f64> {
    if !cell
        .body
        .iter()
        .zip(target)
        .all(|(q, t)| *q + 1e-12 >= 2. * t)
    {
        return None;
    }
    let (material, energy, cost) = crate::accounting::division_requirements(cell, config);
    (cell.material() >= material && cell.energy >= energy).then_some(cost)
}
pub fn reproduce(w: &mut World) {
    let parents = std::mem::take(&mut w.cells);
    let original = parents.len();
    let mut divisions = 0;
    for mut cell in parents {
        let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
        let Some(division) = division_cost(&cell, &g.body, &w.config) else {
            w.cells.push(cell);
            continue;
        };
        let fission = w.config.reproduction == "fission";
        let records = if fission { 2 } else { 1 };
        if original + divisions >= w.config.max_population
            || w.ancestry.len() + records > w.config.max_ancestry_records
        {
            w.stop_reason = Some(
                if w.ancestry.len() + records > w.config.max_ancestry_records {
                    "ancestry-limit"
                } else {
                    "population-limit"
                }
                .into(),
            );
            w.cells.push(cell);
            continue;
        }
        let paid = cell.pay(division);
        if let Some(study) = w.trace.as_mut().and_then(|t| t.study.as_mut()) {
            study.flow(&cell, "division", None, None, paid);
        }
        w.ledger.division_heat += paid;
        if let Some(o) = w.observer.as_mut().filter(|o| o.active()) {
            o.division(&cell, paid);
        }
        w.ledger.divisions += 1;
        divisions += 1;
        if let Some(t) = &mut w.trace {
            t.life(&cell, "division", w.tick);
        }
        let a = child(w, &cell, 1.);
        if fission {
            let b = child(w, &cell, -1.);
            let record = &mut w.ancestry[cell.id as usize - 1];
            record.ended = w.tick;
            record.cause = Cause::Division;
            if let Some(o) = &mut w.observer {
                o.ended(cell.id);
            }
            w.cells.push(b);
        } else {
            cell.body = cell.body.map(|q| q * 0.5);
            cell.bound_material.scale(0.5);
            cell.inventory.scale(0.5);
            cell.energy *= 0.5;
            w.cells.push(cell);
        }
        w.cells.push(a);
    }
    w.cells.sort_unstable_by_key(|c| c.id);
}
pub fn transfer(w: &mut World) {
    if w.config.transfer_rate <= 0. {
        return;
    }
    let contacts = crate::movement::pairs(&w.cells, &w.config);
    let targets: Vec<_> = w.cells.iter().map(|c| c.genome).collect();
    for (i, j) in contacts {
        if w.genetic_rng.unit() >= 1. - (-w.config.transfer_rate * w.config.dt).exp() {
            continue;
        }
        let (recipient, donor) = if w.genetic_rng.unit() < 0.5 {
            (i, j)
        } else {
            (j, i)
        };
        let mut g = w.genomes[&targets[recipient]].clone();
        let donor_cell = w.cells[donor].id;
        let donor = &w.genomes[&targets[donor]];
        let slot = w.genetic_rng.index(13);
        for (a, b) in g.chromosomes.iter_mut().zip(&donor.chromosomes) {
            match slot {
                0..=3 => a.chemistry.receptors[slot] = b.chemistry.receptors[slot],
                4..=7 => a.chemistry.transporters[slot - 4] = b.chemistry.transporters[slot - 4],
                8..=11 => a.chemistry.enzymes[slot - 8] = b.chemistry.enzymes[slot - 8],
                _ => a.chemistry.membrane = b.chemistry.membrane,
            }
        }
        if g.chromosomes == w.genomes[&targets[recipient]].chromosomes {
            continue;
        }
        g.parent = Some(g.id);
        g.id = w.next_genome;
        g.born = w.tick;
        g.mutated = false;
        g.learned = 0.;
        g.compile(&w.config, &w.chemistry);
        w.next_genome += 1;
        let cell = &mut w.cells[recipient];
        cell.genome = g.id;
        w.ancestry[cell.id as usize - 1].genome = g.id;
        w.genomes.insert(g.id, g);
        w.ledger.transfers += 1;
        w.event(
            "transfer",
            w.cells[recipient].id,
            vec![
                donor_cell,
                targets[recipient],
                w.cells[recipient].genome,
                slot as u64,
            ],
        );
    }
}
pub fn disturb(w: &mut World) {
    let Some(d) = w.config.disturbance.clone() else {
        return;
    };
    if w.environment_rng.unit() >= 1. - (-w.config.dt / d.mean_interval).exp() {
        return;
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
            release(w, &cell, Cause::Disturbance);
        } else {
            w.cells.push(cell);
        }
    }
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
                .map(|i| w.field.amounts[i * 256 + s] as f64)
                .sum::<f64>()
                / nodes.len() as f64;
            for &i in &nodes {
                let loss = w.field.add(
                    i,
                    s,
                    d.mixing * (mean - w.field.amounts[i * 256 + s] as f64),
                    &w.chemistry,
                );
                w.ledger.rounding(loss, s, &w.chemistry);
            }
        }
    }
}
pub fn advance(w: &mut World) {
    let cells = std::mem::take(&mut w.cells);
    for cell in cells {
        if cell.energy <= 0. || cell.damage >= 1. {
            let cause = if cell.damage >= 1. {
                Cause::Damage
            } else {
                Cause::Starvation
            };
            release(w, &cell, cause);
        } else {
            w.cells.push(cell);
        }
    }
    disturb(w);
    transfer(w);
    reproduce(w);
    if w.cells.is_empty() && !w.ancestry.is_empty() {
        w.stop_reason = Some("extinction".into());
    }
}
