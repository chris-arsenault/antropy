//! Opt-in accepted-flow reductions; no physical rule reads these accounts.
use crate::{accounting::Ledger, organism::Cell};
use serde::Serialize;

pub const WINDOW: u64 = 250;

#[derive(Clone, Debug)]
pub struct Flux {
    pub routes: Vec<f64>,
    pub touched: Vec<usize>,
    pub imports: [f64; 256],
    pub exports: [f64; 256],
    pub ledger: Ledger,
    pub organism_seconds: f64,
}
impl Default for Flux {
    fn default() -> Self {
        Self {
            routes: vec![0.; 65536],
            touched: vec![],
            imports: [0.; 256],
            exports: [0.; 256],
            ledger: Ledger::default(),
            organism_seconds: 0.,
        }
    }
}
impl Flux {
    pub fn clear(&mut self) {
        for key in self.touched.drain(..) {
            self.routes[key] = 0.;
        }
        self.imports.fill(0.);
        self.exports.fill(0.);
        self.ledger = Ledger::default();
        self.organism_seconds = 0.;
    }
    pub fn reaction(&mut self, input: usize, output: usize, amount: f64) {
        let key = input * 256 + output;
        if self.routes[key] == 0. {
            self.touched.push(key);
        }
        self.routes[key] += amount;
    }
}

#[derive(Clone, Debug)]
pub struct Interval {
    pub start: u64,
    pub end: u64,
    pub groups: [Flux; 3],
}
impl Interval {
    pub fn new(tick: u64) -> Self {
        Self {
            start: tick,
            end: tick,
            groups: std::array::from_fn(|_| Flux::default()),
        }
    }
    pub fn reset(&mut self, tick: u64) {
        self.start = tick;
        self.end = tick;
        for group in &mut self.groups {
            group.clear();
        }
    }
    pub fn each(&mut self, mask: u8, mut action: impl FnMut(&mut Flux)) {
        for (i, group) in self.groups.iter_mut().enumerate() {
            if mask & (1 << i) != 0 {
                action(group);
            }
        }
    }
    pub fn capture(&mut self, mask: u8, cell: &Cell, dt: f64) {
        self.each(mask, |g| {
            g.ledger.accumulate(&cell.flows);
            g.organism_seconds += dt;
        });
    }
}

#[derive(Serialize)]
pub struct Coverage {
    pub start: u64,
    pub end: u64,
    pub seconds: f64,
    pub complete: bool,
}
