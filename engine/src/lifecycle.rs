use crate::{
    controller,
    genetics::Genotype,
    movement::{Spatial, distance},
    organism::{Cell, Flows},
    sensing,
    world::{Ancestor, World},
};
use std::collections::BTreeSet;

impl World {
    pub fn release_cell(&mut self, cell: &Cell, cause: crate::ancestry::Cause) {
        if let Some(trace) = &mut self.trace {
            trace.life(cell, cause.as_str(), self.tick);
        }
        for (s, q) in cell.inventory.iter().enumerate() {
            if *q <= 0. {
                continue;
            }
            let loss = self.field.deposit(cell.x, cell.y, s, *q, &self.chemistry);
            self.ledger.rounding(loss, s, &self.chemistry);
        }
        let s = self.chemistry.decomposition;
        let loss = self
            .field
            .deposit(cell.x, cell.y, s, cell.mass(), &self.chemistry);
        self.ledger.rounding(loss, s, &self.chemistry);
        self.ledger.death_heat += cell.energy;
        self.ledger.deaths += 1;
        if matches!(cause, crate::ancestry::Cause::Damage) {
            self.ledger.damage_deaths += 1;
        }
        let a = &mut self.ancestry[cell.id as usize - 1];
        a.ended = self.tick;
        a.cause = cause;
        self.event("death", cell.id, vec![]);
        self.events.last_mut().unwrap().location =
            Some([cell.x, cell.y, cell.radius(&self.config)]);
    }
    fn child(&mut self, parent: &Cell, point: [f64; 2], energy: f64) -> Cell {
        let candidate = self.genomes[&parent.genome].inherit(
            self.next_genome,
            self.tick,
            &parent.brain,
            &mut self.genetic_rng,
            &self.config,
            &self.chemistry,
        );
        let changed = candidate.chromosomes != self.genomes[&parent.genome].chromosomes;
        if candidate.mutated {
            self.ledger.mutations += 1;
        }
        if candidate.learned > 0. {
            self.ledger.learned_births += 1;
        }
        if self.config.transmission == "selfing" {
            self.ledger.recombinations += 1;
        }
        let genome = if changed {
            let id = self.next_genome;
            self.next_genome += 1;
            self.genomes.insert(id, candidate);
            id
        } else {
            parent.genome
        };
        let id = self.next_cell;
        self.next_cell += 1;
        let mut child = Cell {
            id,
            parent: Some(parent.id),
            lineage: parent.lineage,
            generation: parent.generation + 1,
            genome,
            machinery_genome: parent.machinery_genome,
            born: self.tick,
            x: point[0],
            y: point[1],
            heading: self.rng.unit() * std::f64::consts::TAU,
            body: parent.body.map(|q| q * 0.5),
            inventory: parent.inventory.half(),
            energy,
            damage: parent.damage,
            brain: controller::State::default(),
            receptors: [0.; 4],
            contacts: [0.; 4],
            inputs: vec![0.; controller::INPUTS],
            action: controller::Action::default(),
            flows: Flows::default(),
            chemical_flows: crate::organism::ChemicalFlows::default(),
        };
        sensing::initialize(
            &mut child,
            self.genomes[&parent.machinery_genome]
                .compiled
                .as_ref()
                .unwrap(),
            &self.config,
            &self.field,
        );
        self.ancestry.push(Ancestor {
            id,
            parent: parent.id,
            lineage: parent.lineage,
            genome,
            born: self.tick,
            ended: crate::ancestry::ALIVE,
            cause: crate::ancestry::Cause::Alive,
        });
        self.ledger.births += 1;
        if let Some(trace) = &mut self.trace {
            trace.life(&child, "birth", self.tick);
        }
        child
    }
    pub fn reproduce(&mut self) {
        let original = self.cells.len();
        let mut removed = BTreeSet::new();
        for i in 0..original {
            if self.cells[i].energy <= 1e-12 || self.cells[i].damage >= 1. {
                let cell = self.cells[i].clone();
                self.release_cell(
                    &cell,
                    if cell.damage >= 1. {
                        crate::ancestry::Cause::Damage
                    } else {
                        crate::ancestry::Cause::Starvation
                    },
                );
                removed.insert(i);
            }
        }
        let mut spatial = Spatial::new(&self.config, &self.cells);
        for &i in &removed {
            spatial.remove(i, &self.cells[i]);
        }
        let mut population = original - removed.len();
        for i in 0..original {
            if removed.contains(&i) {
                continue;
            }
            let cell = &self.cells[i];
            let target = &self.genomes[&cell.genome].compiled.as_ref().unwrap().body;
            if cell
                .body
                .iter()
                .zip(target)
                .any(|(q, t)| *q < 2. * t - 1e-12)
                || cell.material() < 2. * self.config.daughter_inventory
                || cell.energy < 2. * self.config.daughter_energy + self.config.division_cost
            {
                continue;
            }
            let budding = self.config.reproduction == "budding";
            let births = if budding { 1 } else { 2 };
            if population >= self.config.max_population
                || self.ancestry.len() + births > self.config.max_ancestry_records
            {
                self.stop_reason =
                    Some("Population or ancestry operating limit reached; export this run".into());
                break;
            }
            let child_radius = cell.radius(&self.config) * 0.5_f64.sqrt();
            let offset = child_radius * 1.001;
            let phase = self.rng.unit() * std::f64::consts::TAU;
            let mut placement = None;
            for attempt in 0..8 {
                let angle = phase + attempt as f64 * std::f64::consts::FRAC_PI_4;
                let at = |d: f64| {
                    [
                        (cell.x + angle.cos() * d).rem_euclid(self.config.width),
                        (cell.y + angle.sin() * d).rem_euclid(self.config.height),
                    ]
                };
                let points = if budding {
                    [at(0.), at(2. * offset)]
                } else {
                    [at(-offset), at(offset)]
                };
                if points
                    .iter()
                    .all(|p| spatial.free(*p, child_radius, i, &self.cells, &self.config))
                {
                    placement = Some(points);
                    break;
                }
            }
            let Some(points) = placement else {
                self.ledger.blocked_divisions += 1;
                continue;
            };
            let parent = self.cells[i].clone();
            let energy = (parent.energy - self.config.division_cost) / 2.;
            spatial.remove(i, &parent);
            let mut children = vec![];
            if budding {
                let kept = &mut self.cells[i];
                kept.body = kept.body.map(|q| q * 0.5);
                kept.inventory.scale(0.5);
                kept.energy = energy;
                spatial.add(i, kept, child_radius);
            } else {
                removed.insert(i);
                let a = &mut self.ancestry[parent.id as usize - 1];
                a.ended = self.tick;
                a.cause = crate::ancestry::Cause::Division;
                let child = self.child(&parent, points[0], energy);
                children.push(child);
            }
            children.push(self.child(&parent, points[1], energy));
            let ids = children.iter().map(|c| c.id).collect();
            for child in children {
                spatial.add(self.cells.len(), &child, child.radius(&self.config));
                self.cells.push(child);
            }
            population += 1;
            self.ledger.divisions += 1;
            if let Some(trace) = &mut self.trace {
                trace.life(&parent, "division", self.tick);
                if let Some(study) = &mut trace.study {
                    study.flow(&parent, "division", None, None, self.config.division_cost);
                }
            }
            self.ledger.division_heat += self.config.division_cost;
            self.event("division", parent.id, ids);
        }
        let mut i = 0;
        self.cells.retain(|_| {
            let keep = !removed.contains(&i);
            i += 1;
            keep
        });
        if self.cells.is_empty() && self.config.founders > 0 {
            self.stop_reason = Some("Population extinct".into());
        }
    }
    pub fn disturb(&mut self) {
        let Some(d) = self.config.disturbance.clone() else {
            return;
        };
        if self.environment_rng.unit() >= 1. - (-self.config.dt / d.mean_interval).exp() {
            return;
        }
        let center = [
            self.environment_rng.unit() * self.config.width,
            self.environment_rng.unit() * self.config.height,
        ];
        let nodes: Vec<_> = (0..self.field.nx * self.field.ny)
            .filter(|i| {
                distance(
                    [
                        ((*i % self.field.nx) as f64 + 0.5) * self.field.spacing,
                        ((*i / self.field.nx) as f64 + 0.5) * self.field.spacing,
                    ],
                    center,
                    &self.config,
                ) <= d.radius
            })
            .collect();
        if !nodes.is_empty() {
            for s in 0..256 {
                let mean = nodes
                    .iter()
                    .map(|i| self.field.amounts[i * 256 + s] as f64)
                    .sum::<f64>()
                    / nodes.len() as f64;
                for &i in &nodes {
                    let q = d.mixing * (mean - self.field.amounts[i * 256 + s] as f64);
                    let loss = self.field.add(i, s, q, &self.chemistry);
                    self.ledger.rounding(loss, s, &self.chemistry);
                }
            }
        }
        let mut victims = vec![];
        for (i, cell) in self.cells.iter().enumerate() {
            if distance([cell.x, cell.y], center, &self.config) <= d.radius
                && self.environment_rng.unit() < d.mortality
            {
                victims.push(i);
            }
        }
        for &i in &victims {
            let cell = self.cells[i].clone();
            self.release_cell(&cell, crate::ancestry::Cause::Disturbance);
        }
        self.ledger.disturbances += 1;
        self.ledger.disturbance_deaths += victims.len() as u64;
        let mut i = 0;
        self.cells.retain(|_| {
            let keep = !victims.contains(&i);
            i += 1;
            keep
        });
    }
    pub fn transfer(&mut self) {
        if self.config.transfer_rate <= 0. {
            return;
        }
        let spatial = Spatial::new(&self.config, &self.cells);
        let mut near = vec![];
        for i in 0..self.cells.len() {
            spatial.near(self.cells[i].x, self.cells[i].y, &mut near);
            for &j in &near {
                if i == j
                    || self.cells[i].genome == self.cells[j].genome
                    || distance(
                        [self.cells[i].x, self.cells[i].y],
                        [self.cells[j].x, self.cells[j].y],
                        &self.config,
                    ) > spatial.radii[i] + spatial.radii[j] + 0.05
                {
                    continue;
                }
                if self.genetic_rng.unit()
                    < 1. - (-self.config.transfer_rate * self.config.dt).exp()
                {
                    self.receive(i, j);
                }
            }
        }
    }
    fn receive(&mut self, recipient: usize, donor: usize) {
        let locus = self.genetic_rng.index(12);
        let previous = self.cells[recipient].genome;
        let offered = self.genomes[&self.cells[donor].genome]
            .compiled
            .as_ref()
            .unwrap()
            .chromosome
            .clone();
        let mut chromosomes = self.genomes[&previous].chromosomes.clone();
        for a in &mut chromosomes {
            a.physical[3 + locus] = offered.physical[3 + locus];
            match locus / 4 {
                0 => a.chemistry.receptors[locus] = offered.chemistry.receptors[locus],
                1 => {
                    a.chemistry.transporters[locus - 4] = offered.chemistry.transporters[locus - 4]
                }
                _ => a.chemistry.enzymes[locus - 8] = offered.chemistry.enzymes[locus - 8],
            }
        }
        let id = self.next_genome;
        self.next_genome += 1;
        let mut genotype = Genotype {
            id,
            parent: Some(previous),
            born: self.tick,
            learned: 0.,
            mutated: false,
            chromosomes,
            compiled: None,
        };
        genotype.compile(&self.config, &self.chemistry);
        let mut cell = self.cells[recipient].clone();
        cell.genome = id;
        self.cells[recipient] = cell;
        self.genomes.insert(id, genotype);
        self.ancestry[self.cells[recipient].id as usize - 1].genome = id;
        self.ledger.transfers += 1;
        self.event(
            "transfer",
            self.cells[recipient].id,
            vec![
                self.cells[donor].id,
                self.cells[donor].genome,
                locus as u64,
                previous,
                id,
            ],
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Config;
    fn small() -> World {
        World::new(
            101,
            Config {
                width: 24.,
                height: 24.,
                founders: 2,
                source_count: 2,
                mutation_rate: 0.,
                physical_mutation_rate: 0.,
                learning: "static".into(),
                ..Config::default()
            },
        )
        .unwrap()
    }
    #[test]
    fn full_cycle_balance_and_exact_continuation() {
        let mut w = small();
        for _ in 0..30 {
            w.step();
        }
        let (matter, energy) = w.held();
        let l = &w.ledger;
        assert!(
            (l.initial_material + l.supplied - matter - l.washed_out - l.numerical_material).abs()
                < 1e-7
        );
        assert!(
            (l.initial_energy + l.supplied_energy
                - energy
                - l.washout_energy
                - l.numerical_energy
                - l.heat())
            .abs()
                < 1e-7
        );
        let bytes = w.snapshot().unwrap();
        let mut restored = World::restore(&bytes).unwrap();
        for _ in 0..3 {
            w.step();
            restored.step();
        }
        let a = w.snapshot().unwrap();
        let b = restored.snapshot().unwrap();
        assert!(
            a == b,
            "Checkpoint differs at {:?}",
            a.iter().zip(&b).position(|(x, y)| x != y)
        );
    }
    #[test]
    fn funded_birth_preserves_material_and_damage() {
        let mut w = small();
        for cell in &mut w.cells {
            cell.body = cell.body.map(|q| q * 2.);
            cell.energy = 1.;
            cell.inventory.set(w.config.source_species[0], 1.);
            cell.damage = 0.2;
        }
        let before = w.held();
        w.reproduce();
        assert!(w.ledger.divisions > 0);
        let after = w.held();
        assert!((before.0 - after.0 - w.ledger.numerical_material).abs() < 1e-8);
        assert!(
            (before.1 - after.1 - w.ledger.division_heat - w.ledger.numerical_energy).abs() < 1e-8
        );
        assert!(w.cells.iter().all(|c| c.damage == 0.2));
        w.validate().unwrap();
    }
    #[test]
    fn dead_inventory_and_body_return_locally() {
        let mut w = small();
        let before = w.held();
        let cell = w.cells.remove(0);
        let numerical = w.ledger.numerical_material;
        w.release_cell(&cell, crate::ancestry::Cause::Damage);
        let after = w.held();
        assert!((before.0 - after.0 - (w.ledger.numerical_material - numerical)).abs() < 1e-8);
        assert!(
            (before.1 - after.1 - w.ledger.death_heat - w.ledger.numerical_energy).abs() < 1e-8
        );
    }
    #[test]
    fn mutated_daughters_inherit_installed_stock_and_pay_for_changed_function() {
        let mut w = small();
        w.config.physical_mutation_rate = 1.;
        for cell in &mut w.cells {
            cell.body = cell.body.map(|q| q * 2.);
            cell.energy = 1.;
            cell.inventory.set(w.config.source_species[0], 1.);
        }
        crate::diagnostics::initialize(&mut w);
        w.reproduce();
        assert!(w.cells.iter().all(|c| c.machinery_genome == 1));
        assert!(w.cells.iter().all(|c| c.body[7] > 0.));
        assert!(w.cells.iter().any(|c| c.genome != c.machinery_genome));
        let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
        for _ in 0..8 {
            w.step();
            restored.step();
        }
        assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
        assert!(w.ledger.flows.refitting > 0.);
        let (matter, energy) = w.held();
        let l = &w.ledger;
        assert!(
            (l.initial_material + l.supplied - matter - l.washed_out - l.numerical_material).abs()
                < 1e-7
        );
        assert!(
            (l.initial_energy + l.supplied_energy
                - energy
                - l.washout_energy
                - l.numerical_energy
                - l.heat())
            .abs()
                < 1e-7
        );
    }
}
