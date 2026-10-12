//! Optional diagnostic accounts. No physical operation reads this state.
use crate::{
    accounting::Ledger, ancestry::Cause, observation_records::Records, organism::Cell, world::World,
};
use serde::Serialize;
use serde_json::{Value, json};
use std::collections::{BTreeMap, HashMap};
#[path = "ecology_observation_context.rs"]
mod context;
#[cfg(test)]
#[path = "ecology_observation_tests.rs"]
mod tests;

pub const WINDOW: u64 = 250;
pub const END_COUNT: usize = 64;
pub const END_BYTES: usize = 4 * 1024 * 1024;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Window {
    pub from_tick: u64,
    pub to_tick: u64,
    pub energy_at_start: f64,
    pub ledger: Ledger,
}
impl Window {
    fn new(cell: &Cell, tick: u64) -> Self {
        Self {
            from_tick: tick,
            to_tick: tick,
            energy_at_start: cell.energy,
            ledger: Ledger::default(),
        }
    }
}
#[derive(Clone, Debug)]
pub struct Active {
    pub birth: Value,
    pub current: Window,
    pub previous: Option<Window>,
}
#[derive(Clone, Debug)]
pub struct Observer {
    pub started: u64,
    pub active: HashMap<u64, Active>,
    pub endings: Records,
    pub endings_seen: u64,
    pub endings_unsampled: u64,
    pub local_endings: BTreeMap<usize, [u64; 2]>,
    last_sample: Option<u64>,
}
impl Observer {
    pub fn new(w: &World) -> Self {
        let mut observer = Self {
            started: w.tick,
            active: HashMap::new(),
            endings: Records::new(END_COUNT, END_BYTES),
            endings_seen: 0,
            endings_unsampled: 0,
            local_endings: BTreeMap::new(),
            last_sample: None,
        };
        for cell in &w.cells {
            observer.insert(cell, w.tick, Value::Null);
        }
        observer
    }
    fn insert(&mut self, cell: &Cell, tick: u64, birth: Value) {
        self.active.insert(
            cell.id,
            Active {
                birth,
                current: Window::new(cell, tick),
                previous: None,
            },
        );
    }
    pub fn birth(&mut self, cell: &Cell, tick: u64) {
        self.insert(
            cell,
            tick,
            json!({"tick":tick,"energy":cell.energy,"mass":cell.mass(),
            "body":cell.body,"inventory":cell.inventory,"damage":cell.damage,
            "position":[cell.x,cell.y],"heading":cell.heading}),
        );
    }
    pub fn before(&mut self, cells: &[Cell], tick: u64) {
        for cell in cells {
            if let Some(active) = self.active.get_mut(&cell.id)
                && tick.saturating_sub(active.current.from_tick) >= WINDOW
            {
                active.previous = Some(std::mem::replace(
                    &mut active.current,
                    Window::new(cell, tick),
                ));
            }
        }
    }
    pub fn capture(&mut self, cell: &Cell, tick: u64) {
        let Some(active) = self.active.get_mut(&cell.id) else {
            return;
        };
        active.current.to_tick = tick;
        active.current.ledger.accumulate(&cell.flows);
    }
    fn end(&mut self, w: &World, cell: &Cell, cause: Cause, body_fraction: f64) {
        let population = self.active.len();
        let active = if matches!(cause, Cause::Division) && w.config.reproduction == "budding" {
            self.active.get(&cell.id).cloned()
        } else {
            self.active.remove(&cell.id)
        };
        self.endings_seen += 1;
        if let Some(source) = nearest_source(w, [cell.x, cell.y]) {
            let local = self.local_endings.entry(source).or_default();
            local[usize::from(!matches!(cause, Cause::Division))] += 1;
        }
        if population > END_COUNT
            && self
                .last_sample
                .is_some_and(|t| w.tick.saturating_sub(t) < WINDOW)
        {
            self.endings_unsampled += 1;
            return;
        }
        self.last_sample = Some(w.tick);
        let (birth, recent, previous) = active
            .map_or((Value::Null, Value::Null, Value::Null), |a| {
                (a.birth, json!(a.current), json!(a.previous))
            });
        self.endings.push(json!({"tick":w.tick,"cause":cause,"cell":cell,"body":cell.body,
            "genotype":w.genomes[&cell.genome],"birth":birth,"recent":recent,"previous":previous,
            "divisionRequirements":if matches!(cause,Cause::Division) {
                Some(crate::accounting::division_requirements(cell,&w.config,w.tick))
            } else {None},
            "mortality":w.mortality,"recoveryEnabled":w.config.mortality_recovery,
            "recoveryResponse":w.mortality.response(&w.config),
            "recoveredBody":if matches!(cause,Cause::Division) {0.} else {cell.mass()*(1.-body_fraction)},
            "context":context::capture(w,cell)}));
    }
}

pub fn nearest_source(w: &World, position: [f64; 2]) -> Option<usize> {
    w.sources
        .iter()
        .enumerate()
        .min_by(|(_, a), (_, b)| {
            let distance = |s: &crate::sources::Source| {
                crate::movement::distance_squared(position, [s.habitat.x, s.habitat.y], &w.config)
            };
            distance(a).total_cmp(&distance(b))
        })
        .map(|(i, _)| i)
}
pub(crate) fn end(w: &mut World, cell: &Cell, cause: Cause, body_fraction: f64) {
    if let Some(mut observer) = w.ecology.take() {
        observer.end(w, cell, cause, body_fraction);
        w.ecology = Some(observer);
    }
}
