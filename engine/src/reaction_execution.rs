//! One frozen donor solve per physiological interval; installed rows stay shared.
use super::Work;
use crate::{chemistry::Chemistry, config::Config, organism::Cell, phenotype::Observer};
#[path = "reaction_application.rs"]
mod application;

struct Context<'a> {
    cell: &'a Cell,
    config: &'a Config,
    chemistry: &'a Chemistry,
    mixture: [f64; 2],
    signal: [f64; 2],
    floor: f64,
}

#[derive(Clone, Debug)]
struct Request {
    slot: u8,
    row: u16,
    substrate: usize,
    rate: f64,
    energy: [f64; 3],
}

#[derive(Clone, Debug)]
pub struct Executor {
    requests: Vec<Request>,
    rates: Box<[[f64; 2]; 256]>,
    scales: Box<[f64; 256]>,
    consumed: Box<[f64; 256]>,
    produced: Box<[f64; 256]>,
    consumed_error: Box<[f64; 256]>,
    produced_error: Box<[f64; 256]>,
    marked: [bool; 256],
    touched: Vec<usize>,
    work: Work,
    applications: u64,
    candidates: u64,
    accepted: u64,
}
impl Default for Executor {
    fn default() -> Self {
        Self {
            requests: Vec::new(),
            rates: Box::new([[0.; 2]; 256]),
            scales: Box::new([0.; 256]),
            consumed: Box::new([0.; 256]),
            produced: Box::new([0.; 256]),
            consumed_error: Box::new([0.; 256]),
            produced_error: Box::new([0.; 256]),
            marked: [false; 256],
            touched: Vec::new(),
            work: Work::default(),
            applications: 0,
            candidates: 0,
            accepted: 0,
        }
    }
}
impl Executor {
    fn clear(&mut self) {
        for s in self.touched.drain(..) {
            self.rates[s] = [0.; 2];
            self.consumed[s] = 0.;
            self.produced[s] = 0.;
            self.consumed_error[s] = 0.;
            self.produced_error[s] = 0.;
            self.marked[s] = false;
        }
        self.requests.clear();
        self.work.routes.clear();
        self.work.enzymes = None;
    }
    fn touch(&mut self, s: usize) {
        if !self.marked[s] {
            self.marked[s] = true;
            self.touched.push(s);
        }
    }
    fn request(&mut self, cell: &Cell, c: &Config, chemistry: &Chemistry, signal: [f64; 2]) {
        let volume = cell.volume(c);
        let context = Context {
            cell,
            config: c,
            chemistry,
            signal,
            floor: crate::field_activity::CONCENTRATION_FLOOR as f64 * volume,
            mixture: super::retained_response(cell, c, chemistry),
        };
        for (slot, enzyme) in cell.operators.as_ref().unwrap().enzymes.iter().enumerate() {
            let capacity = c.enzyme_turnover
                * cell.body[crate::organism::enzyme_stock(slot)]
                * cell.action.activity[slot]
                * (1. - cell.damage);
            if capacity == 0. || !cell.installed.programs[slot] {
                continue;
            }
            let occupied: f64 = enzyme
                .engagement
                .iter()
                .map(|a| a.value * cell.inventory.value(a.species))
                .sum();
            let factor = capacity / (c.receptor_k * volume + occupied).max(1e-30);
            self.request_rows(slot, enzyme, factor, &context);
        }
    }
    fn request_rows(
        &mut self,
        slot: usize,
        enzyme: &crate::chemical_operators::EnzymeOperator,
        factor: f64,
        context: &Context<'_>,
    ) {
        let rows = &enzyme.conversions;
        let current_definition = enzyme
            .definition
            .as_ref()
            .is_some_and(|p| p.same_definition(&context.chemistry.properties));
        for (pair, batch) in rows.batches().iter().enumerate() {
            let start = pair * 2;
            let end = (start + 2).min(rows.len());
            if (start..end)
                .all(|i| context.cell.inventory.value(rows.get(i).substrate) <= context.floor)
            {
                continue;
            }
            let values = batch.evaluate(factor, context.mixture, context.signal, context.config);
            for row in start..end {
                let edge = rows.get(row);
                if context.cell.inventory.value(edge.substrate) <= context.floor {
                    continue;
                }
                let (rate, energy) = if current_definition {
                    (values.rates[row % 2], values.energy[row % 2])
                } else {
                    cold_row(edge, factor, context)
                };
                if rate == 0. {
                    continue;
                }
                self.touch(edge.substrate);
                self.rates[edge.substrate][usize::from(energy[0] < 0.)] += rate;
                self.requests.push(Request {
                    slot: slot as u8,
                    row: row as u16,
                    substrate: edge.substrate,
                    rate,
                    energy,
                });
            }
        }
    }
    fn fund(&mut self, cell: &Cell, dt: f64) -> f64 {
        let requested: f64 = self
            .requests
            .iter()
            .map(|r| dt * cell.inventory.value(r.substrate) * r.rate * (-r.energy[0]).max(0.))
            .sum();
        let funding = if requested > 0. {
            (cell.energy / requested).min(1.)
        } else {
            1.
        };
        for &s in &self.touched {
            let rate = self.rates[s][0] + funding * self.rates[s][1];
            self.scales[s] = dt * cell.inventory.value(s) / (dt * rate).max(1.);
        }
        funding
    }
    pub fn react(
        &mut self,
        cell: &mut Cell,
        c: &Config,
        chemistry: &Chemistry,
        dt: f64,
        record: bool,
        signal: [f64; 2],
    ) -> &Work {
        self.react_observed(cell, c, chemistry, dt, (record, None), signal)
    }
    pub fn react_observed(
        &mut self,
        cell: &mut Cell,
        c: &Config,
        chemistry: &Chemistry,
        dt: f64,
        recording: (bool, Option<&mut Observer>),
        signal: [f64; 2],
    ) -> &Work {
        let observer = recording.1.map(|o| {
            let mask = o.reaction_mask(cell.id);
            (&mut o.current, mask)
        });
        self.react_interval(cell, c, chemistry, dt, recording.0, observer, signal)
    }
    #[allow(clippy::too_many_arguments)]
    pub(crate) fn react_interval(
        &mut self,
        cell: &mut Cell,
        c: &Config,
        chemistry: &Chemistry,
        dt: f64,
        record: bool,
        observer: Option<(&mut crate::phenotype_activity::Interval, u8)>,
        signal: [f64; 2],
    ) -> &Work {
        self.clear();
        if dt > 0. {
            self.request(cell, c, chemistry, signal);
            self.candidates += self.requests.len() as u64;
            let funding = self.fund(cell, dt);
            self.apply(cell, funding, record, observer);
            self.applications += 1;
        }
        &self.work
    }
    pub(crate) fn drain_counts_to(&mut self, other: &mut Self) {
        other.applications += std::mem::take(&mut self.applications);
        other.candidates += std::mem::take(&mut self.candidates);
        other.accepted += std::mem::take(&mut self.accepted);
    }
    pub fn counts(&self) -> serde_json::Value {
        serde_json::json!({"applications":self.applications,"candidateRoutes":self.candidates,
            "acceptedRoutes":self.accepted,"scratchBytes":self.requests.capacity()*std::mem::size_of::<Request>()
                +self.touched.capacity()*std::mem::size_of::<usize>()+7*256*8})
    }
    pub(super) fn into_work(self) -> Work {
        self.work
    }
}

fn cold_row(
    edge: crate::chemical_operators::Conversion<'_>,
    factor: f64,
    context: &Context<'_>,
) -> (f64, [f64; 3]) {
    let coefficient =
        crate::transformation_work::coefficient(context.chemistry, edge.substrate, &edge.products);
    let rate = factor * edge.catalytic * super::response(coefficient, context.mixture);
    let from = context.chemistry.properties[edge.substrate].potential;
    let drop = edge
        .products
        .iter()
        .map(|p| p.weight * (from - context.chemistry.properties[p.species].potential))
        .sum();
    let supplied = context.config.environmental_work
        * crate::transformation_work::engagement(coefficient, context.signal);
    (
        rate,
        crate::transformation_work::cellular(
            drop,
            supplied,
            edge.changed,
            context.config.conversion_efficiency,
        ),
    )
}

#[cfg(test)]
#[path = "reaction_execution_tests.rs"]
mod tests;
