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
        let dt = self.config.dt;
        self.contact_cache.local.pressure_at(dt);
        let local = &self.contact_cache.local;
        let pressure = &local.pressure.rows;
        let motion = &self.contact_cache.motion;
        let genomes = &self.genomes;
        let config = &self.config;
        let mut displacements = vec![[0.; 2]; self.cells.len()];
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
        crate::adhesion::blend(
            &mut displacements,
            &self.cells,
            &local.contacts,
            config.adhesion,
        );
        let mut jobs: Vec<_> = self.cells.iter_mut().zip(&displacements).collect();
        let cost = crate::parallel::cost::CELL_READ;
        crate::parallel::for_each(&mut jobs, cost, |i, (cell, d)| {
            crate::movement::prepared::apply(cell, **d, config);
            cell.x = (cell.x + pressure[i].shift[0] * dt).rem_euclid(config.width);
            cell.y = (cell.y + pressure[i].shift[1] * dt).rem_euclid(config.height);
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
