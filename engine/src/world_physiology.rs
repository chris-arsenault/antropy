//! Disjoint cell chemistry; observers reduce only accepted flows after the join.
use super::*;

#[derive(Clone, Debug, Default)]
pub(super) struct Job {
    executor: crate::metabolism::Executor,
    interval: Option<crate::phenotype_activity::Interval>,
    overflow: f64,
}

struct Context<'a> {
    config: &'a Config,
    chemistry: &'a Chemistry,
    field: &'a Field,
    genomes: &'a GenotypeStore,
    dt: f64,
}
impl Context<'_> {
    fn advance<'a>(
        &self,
        cell: &mut Cell,
        (signal, exposure): ([f64; 2], crate::optics::Exposure),
        executor: &'a mut crate::metabolism::Executor,
        observer: Option<(&mut crate::phenotype_activity::Interval, u8)>,
        record: bool,
    ) -> (f64, &'a crate::metabolism::Work) {
        let g = self.genomes[&cell.genome].compiled.as_ref().unwrap();
        let load = crate::sensing::stress_load(cell, g, self.config, self.field, self.chemistry);
        let damage = self.dt * self.config.damage_rate * load / (self.config.stress_k + load);
        cell.damage = (cell.damage + damage).min(1.);
        cell.flows.exposure += load * self.dt;
        cell.flows.damage += damage;
        let before = cell.flows.external_work;
        let work = executor.react_interval(
            cell,
            self.config,
            self.chemistry,
            self.dt,
            record,
            observer,
            crate::illumination::drive(signal, exposure.drive()),
        );
        let paid = (cell.flows.external_work - before) * exposure.paid_fraction();
        cell.flows.external_work -= paid;
        cell.flows.recycled_work += paid;
        crate::metabolism::repair(cell, self.config, self.chemistry, self.dt);
        crate::metabolism::grow(cell, g, self.config, self.chemistry, self.dt);
        let excess = (cell.energy - cell.energy_capacity(self.config)).max(0.);
        cell.energy -= excess;
        crate::sensing::observe_physiology(cell, g, self.config);
        (excess, work)
    }
}

impl World {
    pub(super) fn physiology(&mut self, dt: f64, signals: &[([f64; 2], crate::optics::Exposure)]) {
        let context = Context {
            config: &self.config,
            chemistry: &self.chemistry,
            field: &self.field,
            genomes: &self.genomes,
            dt,
        };
        let observer = self.observer.as_deref_mut().filter(|o| o.active());
        // Detailed experiment traces retain their existing serial stream. Live reduced
        // observations use per-job interval accounts, never per-cell route frame copies.
        let grain =
            crate::parallel::grain(self.cells.len(), crate::parallel::cost::CELL_PHYSIOLOGY);
        if grain.is_none() || self.trace.is_some() {
            let mut observer = observer;
            for (cell, &signal) in self.cells.iter_mut().zip(signals) {
                let recording = observer.as_deref_mut().map(|o| {
                    let mask = o.reaction_mask(cell.id);
                    (&mut o.current, mask)
                });
                let (excess, work) = context.advance(
                    cell,
                    signal,
                    &mut self.reactions,
                    recording,
                    self.trace.is_some(),
                );
                if let Some(t) = &mut self.trace {
                    t.reactions(cell, work);
                }
                self.ledger.overflow_heat += excess;
                if let Some(o) = observer.as_deref_mut() {
                    o.overflow(cell, excess);
                }
            }
            return;
        }
        // Each job owns an executor; tasks carry at least one grain of estimated work.
        let chunk = self
            .cells
            .len()
            .div_ceil(rayon::current_num_threads() * 2)
            .max(grain.unwrap_or(1));
        let jobs = self.cells.len().div_ceil(chunk);
        self.physiology_jobs.resize_with(jobs, Job::default);
        for job in &mut self.physiology_jobs {
            job.overflow = 0.;
            if observer.is_some() {
                job.interval
                    .get_or_insert_with(|| crate::phenotype_activity::Interval::new(0))
                    .reset(0);
            } else {
                job.interval = None;
            }
        }
        let membership = observer.as_deref();
        self.cells
            .par_chunks_mut(chunk)
            .zip(self.physiology_jobs.par_iter_mut())
            .enumerate()
            .for_each(|(batch, (cells, job))| {
                for (offset, cell) in cells.iter_mut().enumerate() {
                    let mask = membership.map_or(0, |o| o.reaction_mask(cell.id));
                    let recording = job.interval.as_mut().map(|interval| (interval, mask));
                    let (excess, _) = context.advance(
                        cell,
                        signals[batch * chunk + offset],
                        &mut job.executor,
                        recording,
                        false,
                    );
                    job.overflow += excess;
                    if let Some(interval) = &mut job.interval {
                        interval.each(mask, |g| g.ledger.overflow_heat += excess);
                    }
                }
            });
        let mut observer = observer;
        for job in &mut self.physiology_jobs {
            self.ledger.overflow_heat += job.overflow;
            job.executor.drain_counts_to(&mut self.reactions);
            if let (Some(target), Some(source)) = (observer.as_deref_mut(), &job.interval) {
                for (to, from) in target.current.groups.iter_mut().zip(&source.groups) {
                    for &key in &from.touched {
                        to.reaction(key / 256, key % 256, from.routes[key]);
                    }
                    to.ledger.overflow_heat += from.ledger.overflow_heat;
                }
            }
        }
    }
}
