//! Persistent diameter-class membership; large bodies do not widen small-body queries.
use super::{Body, Contacts, Edge};
use crate::{config::Config, organism::Cell, spatial::Geometry, spatial_members::Members};
use rayon::prelude::*;
use std::collections::BTreeMap;
#[derive(Clone, Debug)]
struct Level {
    members: Members,
    geometry: Geometry,
    scale: [f64; 2],
    radius: f64,
}
impl Level {
    fn new(class: i32, c: &Config, capacity: usize) -> Self {
        let bound = 2_f64.powi(class);
        let shape =
            [c.width, c.height].map(|v| (v / bound).floor().clamp(1., capacity as f64) as usize);
        Self {
            members: Members::default(),
            geometry: Geometry::new(shape[0], shape[1]),
            scale: [c.width / shape[0] as f64, c.height / shape[1] as f64],
            radius: 0.,
        }
    }
    fn node(&self, position: [f64; 2]) -> usize {
        let x = (position[0] / self.scale[0]) as usize;
        let y = (position[1] / self.scale[1]) as usize;
        y.min(self.geometry.ny - 1) * self.geometry.nx + x.min(self.geometry.nx - 1)
    }
}
#[derive(Clone, Debug, Default)]
pub(super) struct Search {
    levels: BTreeMap<i32, Level>,
    jobs: Vec<(i32, usize)>,
    configuration: Option<(f64, f64, usize)>,
}
impl Search {
    pub fn update(&mut self, cells: &[Cell], c: &Config, contacts: &mut Contacts) {
        let capacity = cells.len().max(1).next_power_of_two();
        if self.configuration != Some((c.width, c.height, capacity)) {
            self.levels.clear();
            self.configuration = Some((c.width, c.height, capacity));
        }
        contacts.bodies.clear();
        for level in self.levels.values_mut() {
            level.members.begin(level.geometry);
            level.radius = 0.;
        }
        for (i, cell) in cells.iter().enumerate() {
            let body = Body {
                position: [cell.x.rem_euclid(c.width), cell.y.rem_euclid(c.height)],
                radius: cell.radius(c),
            };
            let class = (2. * body.radius).log2().ceil() as i32;
            let level = self.levels.entry(class).or_insert_with(|| {
                let mut level = Level::new(class, c, capacity);
                level.members.begin(level.geometry);
                level
            });
            level.members.update(cell.id, i, level.node(body.position));
            level.radius = level.radius.max(body.radius);
            contacts.bodies.push(body);
        }
        for level in self.levels.values_mut() {
            level.members.finish();
        }
        self.levels.retain(|_, level| level.radius > 0.);
        self.jobs.clear();
        for (&class, level) in &self.levels {
            self.jobs
                .extend(level.members.occupied().map(|n| (class, n)));
        }
        self.visit(c, contacts);
    }
    fn visit(&self, c: &Config, contacts: &mut Contacts) {
        contacts.edges.clear();
        contacts.candidates = 0;
        if let Some(grain) =
            crate::parallel::grain(self.jobs.len(), crate::parallel::cost::CONTACT_BIN)
        {
            let results: Vec<_> = self
                .jobs
                .par_chunks(grain)
                .map(|jobs| {
                    let mut edges = Vec::new();
                    let count = jobs
                        .iter()
                        .map(|&job| self.query(job, &contacts.bodies, c, &mut edges))
                        .sum::<usize>();
                    (count, edges)
                })
                .collect();
            for (count, edges) in results {
                contacts.candidates += count;
                contacts.edges.extend(edges);
            }
        } else {
            for &job in &self.jobs {
                contacts.candidates += self.query(job, &contacts.bodies, c, &mut contacts.edges);
            }
        }
    }
    fn query(
        &self,
        (source_class, source_node): (i32, usize),
        bodies: &[Body],
        c: &Config,
        edges: &mut Vec<Edge>,
    ) -> usize {
        let mut checks = 0;
        let source = &self.levels[&source_class];
        let owners = source.members.indices(source_node);
        let mut low = [f64::INFINITY; 2];
        let mut high = [f64::NEG_INFINITY; 2];
        for &i in owners {
            for k in 0..2 {
                low[k] = low[k].min(bodies[i].position[k]);
                high[k] = high[k].max(bodies[i].position[k]);
            }
        }
        for (&class, level) in self.levels.range(source_class..) {
            let reach = source.radius + level.radius;
            let start: [isize; 2] =
                std::array::from_fn(|k| ((low[k] - reach) / level.scale[k]).floor() as isize);
            let end: [isize; 2] =
                std::array::from_fn(|k| ((high[k] + reach) / level.scale[k]).floor() as isize);
            let g = level.geometry;
            let count = [
                (end[0] - start[0] + 1).min(g.nx as isize),
                (end[1] - start[1] + 1).min(g.ny as isize),
            ];
            for dy in 0..count[1] {
                let y = (start[1] + dy).rem_euclid(g.ny as isize) as usize;
                for dx in 0..count[0] {
                    let x = (start[0] + dx).rem_euclid(g.nx as isize) as usize;
                    let target = y * g.nx + x;
                    if class == source_class && target < source_node {
                        continue;
                    }
                    let neighbors = level.members.indices(target);
                    for &i in owners {
                        for &j in neighbors {
                            if class == source_class && target == source_node && j <= i {
                                continue;
                            }
                            checks += 1;
                            if let Some(edge) = overlap(i, j, bodies, c) {
                                edges.push(edge);
                            }
                        }
                    }
                }
            }
        }
        checks
    }
}

fn overlap(i: usize, j: usize, bodies: &[Body], c: &Config) -> Option<Edge> {
    let (i, j) = (i.min(j), i.max(j));
    let (a, b) = (bodies[i], bodies[j]);
    let extent = a.radius + b.radius;
    let x = crate::movement::delta(b.position[0] - a.position[0], c.width);
    if x.abs() >= extent {
        return None;
    }
    let y = crate::movement::delta(b.position[1] - a.position[1], c.height);
    let squared = x * x + y * y;
    if y.abs() >= extent || squared >= extent * extent {
        return None;
    }
    let length = squared.sqrt();
    if length >= extent {
        return None;
    }
    Some(Edge {
        i,
        j,
        displacement: [x, y],
        length,
        extent,
    })
}
