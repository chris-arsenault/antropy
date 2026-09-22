//! Cell-local execution between frozen spatial and material exchange barriers.
use super::World;
use crate::{config::Config, footprint::Row, genetics::Compiled, organism::Cell};

#[cfg(test)]
#[path = "world_base_tests.rs"]
mod tests;

impl World {
    pub(super) fn advance_local(&mut self, sites: &[Row], physiology: bool) {
        if !self.cells.is_empty() {
            self.field.prepare_attraction();
        }
        self.contact_cache
            .motion
            .prepare_all(&self.cells, &self.config, &self.field, sites);
        let pressure = self.contact_cache.local.pressure_at(self.config.dt);
        let motion = &self.contact_cache.motion;
        let genomes = &self.genomes;
        let config = &self.config;
        let cost = crate::parallel::cost::CELL_STEP;
        crate::parallel::for_each(&mut self.cells, cost, |i, cell| {
            cell.flows = Default::default();
            cell.contacts = pressure[i].contacts();
            let g = genomes[&cell.genome].compiled.as_ref().unwrap();
            control(cell, g, config);
            motion.advance_prepared(i, cell, config);
            cell.x = (cell.x + pressure[i].shift[0] * config.dt).rem_euclid(config.width);
            cell.y = (cell.y + pressure[i].shift[1] * config.dt).rem_euclid(config.height);
        });
        self.contact_cache.motion.contact_preparations += self.cells.len() as u64;
        if !physiology {
            self.finish_cells();
        }
    }

    /// Basal maintenance is cell-local; ledger, observer and trace records keep cell order.
    pub(super) fn finish_cells(&mut self) {
        let config = &self.config;
        let cost = crate::parallel::cost::CELL_READ;
        crate::parallel::for_each(&mut self.cells, cost, |_, cell| {
            let paid = cell.pay(cell.basal(config));
            cell.flows.maintenance += paid;
        });
        for cell in &mut self.cells {
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
    let cost = if c.learning == "plastic" {
        c.plasticity_cost * c.dt * cell.body[0]
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
