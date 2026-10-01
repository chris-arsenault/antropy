//! Cell-local execution between frozen spatial and material exchange barriers.
use super::World;
use crate::{config::Config, footprint::Row, genetics::Compiled, organism::Cell};

#[cfg(test)]
#[path = "world_base_tests.rs"]
mod tests;

impl World {
    pub(super) fn advance_local(&mut self, sites: &[Row], physiology: bool) {
        crate::strategic_local::publish(self, physiology);
        self.step_positions.clear();
        self.step_positions
            .extend(self.cells.iter().map(|cell| [cell.x, cell.y]));
        if !self.cells.is_empty() {
            self.field.prepare_attraction();
        }
        self.contact_cache
            .motion
            .prepare_all(&self.cells, &self.config, &self.field, sites);
        let dt = self.config.dt;
        self.contact_cache.local.pressure_at(dt);
        let local = &self.contact_cache.local;
        let pressure = &local.pressure.rows;
        let motion = &self.contact_cache.motion;
        let genomes = &self.genomes;
        let config = &self.config;
        let mut displacements = vec![[0.; 4]; self.cells.len()];
        let mut jobs: Vec<_> = self.cells.iter_mut().zip(&mut displacements).collect();
        let cost = crate::parallel::cost::CELL_STEP;
        crate::parallel::for_each(&mut jobs, cost, |i, (cell, d)| {
            cell.flows = Default::default();
            cell.contacts = pressure[i].contacts();
            let g = genomes[&cell.genome].compiled.as_ref().unwrap();
            control(cell, g, config);
            **d = motion.displacement(i, cell, config);
        });
        drop(jobs);
        self.utterances.advance(&mut self.cells, config, self.tick);
        let geography = &self.field.illumination.shade.geography;
        crate::movement::prepared::blend_apply(
            &mut self.cells,
            displacements,
            &local.contacts,
            config,
            geography,
        );
        let cost = crate::parallel::cost::CELL_READ;
        crate::parallel::for_each(&mut self.cells, cost, |i, cell| {
            crate::movement::prepared::passive_apply(
                cell,
                pressure[i].shift.map(|v| v * dt),
                config,
                geography,
            );
        });
        self.contact_cache.motion.contact_preparations += self.cells.len() as u64;
        if !physiology {
            self.finish_cells();
        }
    }

    /// Basal maintenance is cell-local; ledger, observer and trace records keep cell order.
    pub(super) fn finish_cells(&mut self) {
        let config = &self.config;
        let tick = self.tick;
        let cost = crate::parallel::cost::CELL_READ;
        crate::parallel::for_each(&mut self.cells, cost, |_, cell| {
            let paid = cell.pay(cell.basal(config, tick));
            cell.flows.maintenance += paid;
        });
        for (i, cell) in self.cells.iter_mut().enumerate() {
            let start = self
                .step_positions
                .get(i)
                .copied()
                .unwrap_or([cell.x, cell.y]);
            let g = self.genomes[&cell.genome].compiled.as_ref().unwrap();
            crate::strategic_physiology::capture(cell, g, config, tick, start);
            record(
                cell,
                config.dt,
                &mut self.ledger,
                self.observer.as_deref_mut(),
                self.trace.as_mut(),
                self.tick,
            );
        }
    }
}

fn control(cell: &mut Cell, g: &Compiled, c: &Config) {
    if !crate::controller::owns_inputs(&cell.brain, cell.genome) {
        crate::sensing::observe_physiology(cell, g, c);
    }
    crate::sensing::observe_base(cell, c);
    cell.inputs[crate::controller::CONTEXT_INPUT..]
        .copy_from_slice(&cell.brain.strategy.displayed());
    let cost = if c.learning == "plastic" {
        c.plasticity_cost * c.dt * cell.body[0] * cell.brain.strategy.learning_gain
    } else {
        0.
    };
    let learn = cell.energy >= cost;
    let paid = if learn { cell.pay(cost) } else { 0. };
    cell.flows.learning += paid;
    cell.action = crate::controller::act_published(
        &g.chromosome.behavior,
        &cell.inputs,
        &mut cell.brain,
        c,
        learn,
        cell.genome,
    );
    crate::sensing::adapt(cell, c, c.dt);
}

fn record(
    cell: &mut Cell,
    dt: f64,
    ledger: &mut crate::accounting::Ledger,
    observer: Option<&mut crate::phenotype::Observer>,
    trace: Option<&mut crate::trace::Trace>,
    tick: u64,
) {
    ledger.accumulate(&cell.flows);
    if let Some(o) = observer.filter(|o| o.active()) {
        o.capture(cell, dt);
    }
    if let Some(t) = trace {
        t.capture(cell, tick);
    }
}
