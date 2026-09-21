//! Observer membership and bounded windows. Skipped by physical serialization.
use crate::{
    organism::Cell,
    phenotype_activity::{Coverage, Interval, WINDOW},
    world::World,
};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeSet, HashMap};

#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum Selection {
    #[default]
    All,
    Role {
        input: usize,
        output: usize,
    },
    Region {
        id: u64,
    },
    Pin,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Pin {
    pub id: String,
    pub label: String,
    pub started: u64,
    pub roots: BTreeSet<u64>,
    #[serde(skip)]
    pub live: BTreeSet<u64>,
}
#[derive(Clone, Debug)]
pub struct Observer {
    pub enabled: bool,
    pub highlight: bool,
    pub selection: Selection,
    pub region: BTreeSet<u64>,
    pub pin: Option<Pin>,
    pub current: Interval,
    pub previous: Interval,
    masks: HashMap<u64, u8>,
}
impl Observer {
    pub fn new(tick: u64) -> Self {
        Self {
            enabled: false,
            highlight: false,
            selection: Selection::All,
            region: BTreeSet::new(),
            pin: None,
            current: Interval::new(tick),
            previous: Interval::new(tick),
            masks: HashMap::new(),
        }
    }
    pub fn active(&self) -> bool {
        self.enabled || self.pin.is_some()
    }
    pub fn selected(&self, cell: &Cell) -> bool {
        match self.selection {
            Selection::All => true,
            Selection::Role { input, output } => crate::chemical_roles::primary(cell)
                .is_some_and(|r| r.input == input && r.output == output),
            Selection::Region { .. } => self.region.contains(&cell.id),
            Selection::Pin => self.pinned(cell.id),
        }
    }
    pub fn pinned(&self, id: u64) -> bool {
        self.pin.as_ref().is_some_and(|p| p.live.contains(&id))
    }
    pub fn reset(&mut self, tick: u64) {
        self.current.reset(tick);
        self.previous.reset(tick);
    }
    pub fn begin(&mut self, cells: &[Cell]) {
        self.masks.clear();
        for cell in cells {
            let mask =
                1 | (u8::from(self.selected(cell)) << 1) | (u8::from(self.pinned(cell.id)) << 2);
            self.masks.insert(cell.id, mask);
        }
    }
    pub fn transfer(&mut self, id: u64, species: usize, incoming: f64, outgoing: f64) {
        let mask = self.masks.get(&id).copied().unwrap_or(1);
        self.current.each(mask, |g| {
            g.imports[species] += incoming;
            g.exports[species] += outgoing;
        });
    }
    pub fn reactions(&mut self, cell: &Cell, work: &crate::metabolism::Work) {
        let mask = self.masks.get(&cell.id).copied().unwrap_or(1);
        self.current.accepted(mask, work);
    }
    pub fn capture(&mut self, cell: &Cell, dt: f64) {
        let mask = self.masks.get(&cell.id).copied().unwrap_or(1);
        self.current.capture(mask, cell, dt);
    }
    pub fn overflow(&mut self, cell: &Cell, amount: f64) {
        let mask = self.masks.get(&cell.id).copied().unwrap_or(1);
        self.current
            .each(mask, |g| g.ledger.overflow_heat += amount);
    }
    pub fn division(&mut self, cell: &Cell, amount: f64) {
        let mask = self.masks.get(&cell.id).copied().unwrap_or(1);
        self.current
            .each(mask, |g| g.ledger.division_heat += amount);
    }
    pub fn birth(&mut self, cell: &Cell) {
        if let Some(parent) = cell.parent {
            if let Some(pin) = &mut self.pin
                && pin.live.contains(&parent)
            {
                pin.live.insert(cell.id);
            }
            if self.region.contains(&parent) {
                self.region.insert(cell.id);
            }
        }
    }
    pub fn ended(&mut self, id: u64) {
        if let Some(pin) = &mut self.pin {
            pin.live.remove(&id);
        }
        self.region.remove(&id);
    }
    pub fn finish(&mut self, tick: u64) {
        self.current.end = tick;
        if tick - self.current.start >= WINDOW {
            std::mem::swap(&mut self.current, &mut self.previous);
            self.current.reset(tick);
        }
    }
    pub fn interval(&self) -> &Interval {
        if self.previous.end > self.previous.start {
            &self.previous
        } else {
            &self.current
        }
    }
    pub fn coverage(&self, dt: f64) -> Coverage {
        let v = self.interval();
        Coverage {
            start: v.start,
            end: v.end,
            seconds: (v.end - v.start) as f64 * dt,
            complete: v.end - v.start >= WINDOW,
        }
    }
    pub(crate) fn reaction_mask(&self, id: u64) -> u8 {
        self.masks.get(&id).copied().unwrap_or(1)
    }
}

pub fn restore_pin(w: &World, mut pin: Pin) -> Result<Pin, String> {
    if pin.id.is_empty()
        || pin.id.len() > 64
        || pin.label.len() > 120
        || pin.started > w.tick
        || pin.roots.is_empty()
        || pin.roots.len() > 100_000
    {
        return Err("Invalid pinned cohort".into());
    }
    if pin.roots.iter().any(|&id| {
        id == 0
            || id as usize > w.ancestry.len()
            || w.ancestry[id as usize - 1].born > pin.started
            || w.ancestry[id as usize - 1].ended <= pin.started
    }) {
        return Err("Pinned roots were not alive at the pin tick".into());
    }
    let mut inherited = vec![false; w.ancestry.len() + 1];
    for a in &w.ancestry {
        inherited[a.id as usize] = pin.roots.contains(&a.id) || inherited[a.parent as usize];
    }
    pin.live = w
        .cells
        .iter()
        .filter(|c| inherited[c.id as usize])
        .map(|c| c.id)
        .collect();
    Ok(pin)
}
