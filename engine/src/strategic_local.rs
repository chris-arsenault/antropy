//! Present local signals; remaining refill waits and global statistics are never exposed.
use crate::{config::Config, field::Field, organism::Cell, sources::Source, world::World};
#[cfg(test)]
#[path = "strategic_local_tests.rs"]
mod tests;

#[derive(Clone, Debug, Default)]
pub struct Reservoirs {
    rows: Vec<[f64; 3]>,
    touched: Vec<usize>,
}
impl Reservoirs {
    fn ready(&self) -> bool {
        !self.rows.is_empty()
    }
    pub fn prepare(&mut self, sources: &[Source], field: &Field, c: &Config) {
        for node in self.touched.drain(..) {
            self.rows[node] = [0.; 3];
        }
        self.rows.resize(field.nx * field.ny, [0.; 3]);
        for source in sources {
            let stocked = f64::from(source.amount > 0.);
            let elapsed = if source.amount == 0. {
                source.empty_elapsed / (c.source_gap + source.empty_elapsed).max(1e-30)
            } else {
                0.
            };
            for &(node, weight) in &source.footprint {
                if self.rows[node][2] == 0. {
                    self.touched.push(node);
                }
                self.rows[node][0] += weight * stocked;
                self.rows[node][1] += weight * elapsed;
                self.rows[node][2] += weight;
            }
        }
    }
    pub fn read(&self, sites: [(usize, f64); 4]) -> [f64; 3] {
        let mut result = [0.; 3];
        for (node, weight) in sites {
            if let Some(row) = self.rows.get(node) {
                for i in 0..3 {
                    result[i] += weight * row[i];
                }
            }
        }
        let coverage = result[2];
        if coverage > 0. {
            result[0] /= coverage;
            result[1] /= coverage;
            result[2] = coverage / (1. + coverage);
        }
        result
    }
}

pub fn publish(w: &mut World, physiology: bool) {
    if physiology || w.tick == 0 || !w.strategy_sources.ready() {
        w.strategy_sources.prepare(&w.sources, &w.field, &w.config);
    }
    if !physiology && w.tick != 0 && w.cells.iter().all(|c| c.born != w.tick) {
        return;
    }
    let displays: Vec<_> = w
        .cells
        .iter()
        .map(|cell| cell.brain.strategy.displayed())
        .collect();
    let mut neighbors = vec![[0.; 5]; w.cells.len()];
    for edge in &w.contact_cache.local.contacts.edges {
        let weight = edge.weight();
        for (to, from) in [(edge.i, edge.j), (edge.j, edge.i)] {
            for k in 0..4 {
                neighbors[to][k] += weight * displays[from][k] as f64;
            }
            neighbors[to][4] += weight;
        }
    }
    let phases = crate::illumination::phases(
        w.seed,
        w.tick as f64 * w.config.dt,
        [
            w.config.illumination_fast_period,
            w.config.illumination_slow_period,
            w.config.illumination_modulation_period,
        ],
    );
    let c = &w.config;
    let reservoirs = &w.strategy_sources;
    let field = &w.field;
    let geography = &w.shade.geography;
    let tick = w.tick;
    crate::parallel::for_each(&mut w.cells, crate::parallel::cost::CELL_READ, |i, cell| {
        if !physiology && tick != 0 && cell.born != tick {
            return;
        }
        let position = [cell.x, cell.y];
        let angles = [
            std::f64::consts::TAU * cell.x / c.width - phases[0],
            std::f64::consts::TAU * cell.y / c.height - phases[1],
            phases[2],
        ];
        for (axis, angle) in angles.into_iter().enumerate() {
            let (sin, cos) = angle.sin_cos();
            cell.brain.strategy.extra[11 + axis * 2] = cos as f32;
            cell.brain.strategy.extra[12 + axis * 2] = sin as f32;
        }
        let season = season(geography, position, tick as f64 * c.dt);
        cell.brain.strategy.extra[17..19].copy_from_slice(&season.map(|v| v as f32));
        let source = reservoirs.read(field.stencil(cell.x, cell.y));
        cell.brain.strategy.extra[19..22].copy_from_slice(&source.map(|v| v as f32));
        let neighbor = neighbors[i];
        for k in 0..4 {
            cell.brain.strategy.extra[22 + k] = if neighbor[4] > 0. {
                (neighbor[k] / neighbor[4]) as f32
            } else {
                0.
            };
        }
        cell.brain.strategy.extra[26] = (neighbor[4] / (1. + neighbor[4])) as f32;
    });
}

fn season(g: &crate::geography::Geography, position: [f64; 2], seconds: f64) -> [f64; 2] {
    if !g.config.seasons {
        return [0.; 2];
    }
    let sample = g.sample(position);
    let (sin, cos) = (std::f64::consts::TAU * seconds / g.config.season_period + g.phase).sin_cos();
    [
        sample[2] * cos - sample[3] * sin,
        sample[2] * sin + sample[3] * cos,
    ]
}

pub fn self_readings(cell: &mut Cell, c: &Config, tick: u64) {
    let mass = cell.mass();
    let age = cell.age(c, tick);
    let scaled_age = age / (c.aging_time * cell.body[0] / mass).max(1e-30);
    let since = (age - cell.brain.strategy.last_division_age).max(0.);
    let divisions = cell.brain.strategy.divisions as f64;
    let enzymes = (0..crate::organism::MAX_ENZYMES)
        .map(|i| cell.body[crate::organism::enzyme_stock(i)])
        .sum::<f64>();
    let values = [
        scaled_age / (1. + scaled_age),
        divisions / (divisions + 4.),
        since / (since + crate::controller::strategic::interval(c) * 16.),
        0.,
        cell.brain.task as f64 / 255.,
        cell.body[1] / mass,
        cell.body[7..11].iter().sum::<f64>() / mass,
        enzymes / mass,
        cell.action.swim,
        cell.action.turn.abs(),
        cell.action.repair,
    ];
    cell.brain.strategy.extra[..11].copy_from_slice(&values.map(|v| v as f32));
}
