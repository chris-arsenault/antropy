//! Paid information-only batches. Dyadic emitter bins bound queries without listener quotas.
use crate::{
    config::Config,
    organism::{Cell, EAR_STOCK, MOUTH_STOCK},
    spatial::Geometry,
    spatial_members::Members,
};
use std::collections::BTreeMap;

#[derive(Clone, Debug)]
struct Event {
    id: u64,
    position: [f64; 2],
    byte: u8,
    radius: f64,
}

#[derive(Clone, Debug)]
struct Level {
    geometry: Geometry,
    scale: [f64; 2],
    members: Members,
    radius: f64,
}
impl Level {
    fn new(class: i32, c: &Config, count: usize) -> Self {
        let maximum = (count.max(1).next_power_of_two() as f64).sqrt().ceil();
        let shape = [c.width, c.height]
            .map(|size| (size / 2_f64.powi(class)).floor().clamp(1., maximum) as usize);
        Self {
            geometry: Geometry::new(shape[0], shape[1]),
            scale: [c.width / shape[0] as f64, c.height / shape[1] as f64],
            members: Members::default(),
            radius: 0.,
        }
    }
    fn node(&self, position: [f64; 2]) -> usize {
        let x = (position[0] / self.scale[0]) as usize;
        let y = (position[1] / self.scale[1]) as usize;
        y.min(self.geometry.ny - 1) * self.geometry.nx + x.min(self.geometry.nx - 1)
    }
    fn visit(&self, position: [f64; 2], mut each: impl FnMut(usize)) {
        let start: [isize; 2] = std::array::from_fn(|axis| {
            ((position[axis] - self.radius) / self.scale[axis]).floor() as isize
        });
        let end: [isize; 2] = std::array::from_fn(|axis| {
            ((position[axis] + self.radius) / self.scale[axis]).floor() as isize
        });
        let size = [self.geometry.nx, self.geometry.ny];
        let count: [isize; 2] =
            std::array::from_fn(|axis| (end[axis] - start[axis] + 1).min(size[axis] as isize));
        for dy in 0..count[1] {
            for dx in 0..count[0] {
                let x = (start[0] + dx).rem_euclid(size[0] as isize) as usize;
                let y = (start[1] + dy).rem_euclid(size[1] as isize) as usize;
                for &event in self.members.indices(y * size[0] + x) {
                    each(event);
                }
            }
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct Delivery {
    levels: BTreeMap<i32, Level>,
    configuration: Option<(f64, f64, usize)>,
    events: Vec<Event>,
}
impl Delivery {
    pub fn advance(&mut self, cells: &mut [Cell], c: &Config, tick: u64) {
        self.events.clear();
        if !c.features.vocalization {
            for cell in cells {
                cell.brain.pending_speech = None;
                cell.brain.hearing = Default::default();
            }
            return;
        }
        for cell in cells.iter_mut() {
            if let Some(event) = emit(cell, c, tick) {
                self.events.push(event);
            }
        }
        if self.events.is_empty() {
            return;
        }
        self.prepare(c);
        let events = &self.events;
        let levels = &self.levels;
        crate::parallel::for_each(cells, crate::parallel::cost::CELL_READ, |_, cell| {
            let stock = cell.body[EAR_STOCK] * (1. - cell.damage);
            if stock == 0. || cell.energy <= 0. {
                return;
            }
            let gain = stock / (stock + c.receptor_ratio * cell.body[0]).max(1e-30);
            let position = [cell.x, cell.y];
            for level in levels.values() {
                level.visit(position, |index| receive(cell, &events[index], gain, c));
            }
        });
    }
    fn prepare(&mut self, c: &Config) {
        let configuration = (
            c.width,
            c.height,
            self.events.len().max(1).next_power_of_two(),
        );
        if self.configuration != Some(configuration) {
            self.levels.clear();
            self.configuration = Some(configuration);
        }
        let class_of = |event: &Event| event.radius.log2().ceil() as i32;
        for event in &self.events {
            self.levels
                .entry(class_of(event))
                .or_insert_with(|| Level::new(class_of(event), c, self.events.len()));
        }
        let mut entries: Vec<_> = self
            .events
            .iter()
            .enumerate()
            .map(|(i, event)| {
                let class = class_of(event);
                (class, self.levels[&class].node(event.position), i)
            })
            .collect();
        entries.sort_unstable();
        for (&class, level) in &mut self.levels {
            let start = entries.partition_point(|e| e.0 < class);
            let end = entries.partition_point(|e| e.0 <= class);
            let slice = &entries[start..end];
            level.radius = slice
                .iter()
                .map(|e| self.events[e.2].radius)
                .fold(0., f64::max);
            level
                .members
                .rebuild(level.geometry, slice.len(), |i| (slice[i].1, slice[i].2));
        }
        self.levels.retain(|_, level| level.radius > 0.);
    }
}

/// Basal, future motor and learning reservations precede optional speech; future income cannot fund it.
fn emit(cell: &mut Cell, c: &Config, tick: u64) -> Option<Event> {
    let (byte, effort) = cell.brain.pending_speech.take()?;
    if cell.energy <= 0. || cell.damage >= 1. {
        return None;
    }
    let area = c.birth_mass / c.body_density;
    let maximum = c.width.min(c.height) / 2.;
    let reserve = crate::accounting::interval_reserve(cell, &cell.body, c, tick);
    let work = (effort
        * c.motor_power_density
        * cell.body[MOUTH_STOCK]
        * (1. - cell.damage)
        * c.physiology_interval)
        .min((cell.energy - reserve).max(0.))
        .min(c.utterance_work_density * (area + std::f64::consts::PI * maximum.powi(2)));
    if work <= c.utterance_work_density * area {
        return None;
    }
    let radius = ((work / c.utterance_work_density - area) / std::f64::consts::PI).sqrt();
    cell.flows.speech_work += cell.pay(work);
    cell.flows.utterances += 1.;
    Some(Event {
        id: cell.id,
        position: [cell.x, cell.y],
        byte,
        radius,
    })
}

fn receive(cell: &mut Cell, event: &Event, gain: f64, c: &Config) {
    if event.id == cell.id {
        return;
    }
    let d = [
        crate::movement::delta(event.position[0] - cell.x, c.width),
        crate::movement::delta(event.position[1] - cell.y, c.height),
    ];
    if d[0].hypot(d[1]) > event.radius {
        return;
    }
    let direction = crate::controller::hearing::direction(d, cell.heading, [c.width, c.height]);
    cell.brain.hearing.receive(event.byte, direction, gain);
    cell.flows.heard += 1.;
}

#[cfg(test)]
#[path = "utterance_tests.rs"]
mod tests;
