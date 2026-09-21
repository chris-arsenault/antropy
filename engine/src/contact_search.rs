//! Compact diameter-class bins are rebuilt from current bodies, without candidate lifetimes.
use super::{Body, Contacts, Edge};
use crate::{config::Config, organism::Cell};

#[derive(Clone, Copy, Debug, Default)]
struct Grid {
    shape: [usize; 2],
    size: [f64; 2],
}
impl Grid {
    fn new(diameter: f64, count: usize, c: &Config) -> Self {
        let extent = [c.width, c.height];
        let shape = extent.map(|v| (v / diameter).floor().clamp(1., count as f64) as usize);
        Self {
            shape,
            size: std::array::from_fn(|k| extent[k] / shape[k] as f64),
        }
    }
    fn key(&self, body: Body) -> usize {
        let bin: [usize; 2] = std::array::from_fn(|k| {
            ((body.position[k] / self.size[k]) as usize).min(self.shape[k] - 1)
        });
        bin[1] * self.shape[0] + bin[0]
    }
    fn neighbors(&self, key: usize) -> ([usize; 9], usize) {
        let [x, y] = [key % self.shape[0], key / self.shape[0]];
        let mut keys = [usize::MAX; 9];
        let mut count = 0;
        for dy in -1..=1 {
            for dx in -1..=1 {
                let key = (y as isize + dy).rem_euclid(self.shape[1] as isize) as usize
                    * self.shape[0]
                    + (x as isize + dx).rem_euclid(self.shape[0] as isize) as usize;
                if !keys[..count].contains(&key) {
                    keys[count] = key;
                    count += 1;
                }
            }
        }
        (keys, count)
    }
}

#[derive(Clone, Debug)]
struct Bin {
    key: usize,
    start: usize,
    end: usize,
}
#[derive(Clone, Debug, Default)]
struct Rows {
    entries: Vec<(usize, usize)>,
    bins: Vec<Bin>,
}
impl Rows {
    fn prepare(&mut self, owners: impl Iterator<Item = usize>, bodies: &[Body], grid: Grid) {
        self.entries.clear();
        self.entries
            .extend(owners.map(|i| (grid.key(bodies[i]), i)));
        self.entries.sort_unstable();
        self.bins.clear();
        for (position, &(key, _)) in self.entries.iter().enumerate() {
            if let Some(bin) = self.bins.last_mut()
                && bin.key == key
            {
                bin.end = position + 1;
            } else {
                self.bins.push(Bin {
                    key,
                    start: position,
                    end: position + 1,
                });
            }
        }
    }
    fn find(&self, key: usize) -> Option<&Bin> {
        self.bins
            .binary_search_by_key(&key, |b| b.key)
            .ok()
            .map(|i| &self.bins[i])
    }
}
#[derive(Clone, Debug, Default)]
struct Level {
    grid: Grid,
    rows: Rows,
}
#[derive(Clone, Debug, Default)]
pub(super) struct Search {
    classes: Vec<(i32, usize)>,
    levels: Vec<Level>,
    projected: Rows,
}
impl Search {
    pub fn update(&mut self, cells: &[Cell], c: &Config, contacts: &mut Contacts) {
        contacts.bodies.clear();
        contacts.bodies.extend(cells.iter().map(|cell| {
            let (sin, cos) = cell.heading.sin_cos();
            Body {
                position: [cell.x.rem_euclid(c.width), cell.y.rem_euclid(c.height)],
                radius: cell.radius(c),
                heading: [cos, sin],
            }
        }));
        self.prepare(&contacts.bodies, c);
        contacts.edges.clear();
        contacts.candidates = 0;
        for (class, level) in self.levels.iter().enumerate() {
            for (offset, target) in self.levels[class..].iter().enumerate() {
                let source = if offset == 0 {
                    &level.rows
                } else {
                    self.projected.prepare(
                        level.rows.entries.iter().map(|&(_, i)| i),
                        &contacts.bodies,
                        target.grid,
                    );
                    &self.projected
                };
                let checks = visit(source, target, offset == 0, contacts, c);
                contacts.candidates += checks;
            }
        }
    }
    fn prepare(&mut self, bodies: &[Body], c: &Config) {
        self.classes.clear();
        self.classes.extend(
            bodies
                .iter()
                .enumerate()
                .map(|(i, b)| ((2. * b.radius).log2().ceil() as i32, i)),
        );
        self.classes.sort_unstable();
        let mut start = 0;
        let mut count = 0;
        while start < self.classes.len() {
            let class = self.classes[start].0;
            let end = start + self.classes[start..].partition_point(|&(k, _)| k == class);
            if count == self.levels.len() {
                self.levels.push(Level::default());
            }
            let level = &mut self.levels[count];
            let diameter = self.classes[start..end]
                .iter()
                .map(|&(_, i)| 2. * bodies[i].radius)
                .fold(0., f64::max);
            level.grid = Grid::new(diameter, bodies.len(), c);
            level.rows.prepare(
                self.classes[start..end].iter().map(|&(_, i)| i),
                bodies,
                level.grid,
            );
            count += 1;
            start = end;
        }
        self.levels.truncate(count);
    }
}

fn visit(source: &Rows, target: &Level, same: bool, contacts: &mut Contacts, c: &Config) -> usize {
    use rayon::prelude::*;
    if !crate::parallel::enabled(source.entries.len(), 128) {
        return visit_bins(
            &source.bins,
            source,
            target,
            same,
            &contacts.bodies,
            c,
            &mut contacts.edges,
        );
    }
    let results: Vec<_> = source
        .bins
        .par_chunks(8)
        .map(|bins| {
            let mut edges = Vec::new();
            let count = visit_bins(bins, source, target, same, &contacts.bodies, c, &mut edges);
            (count, edges)
        })
        .collect();
    let mut total = 0;
    for (count, edges) in results {
        total += count;
        contacts.edges.extend(edges);
    }
    total
}

fn visit_bins(
    bins: &[Bin],
    source: &Rows,
    target: &Level,
    same: bool,
    bodies: &[Body],
    c: &Config,
    edges: &mut Vec<Edge>,
) -> usize {
    let mut count = 0;
    for bin in bins {
        let (keys, len) = target.grid.neighbors(bin.key);
        for &key in &keys[..len] {
            if same && key < bin.key {
                continue;
            }
            let Some(other) = target.rows.find(key) else {
                continue;
            };
            for &(_, i) in &source.entries[bin.start..bin.end] {
                for &(_, j) in &target.rows.entries[other.start..other.end] {
                    if same && key == bin.key && j <= i {
                        continue;
                    }
                    count += 1;
                    if let Some(edge) = overlap(i, j, bodies, c) {
                        edges.push(edge);
                    }
                }
            }
        }
    }
    count
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
