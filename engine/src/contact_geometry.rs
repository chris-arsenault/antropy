//! Exact overlaps from sparse diameter classes. Geometry lives for one frozen pass only.
use crate::{config::Config, organism::Cell};
use std::collections::{BTreeMap, HashMap};

#[derive(Clone, Copy, Debug)]
pub struct Body {
    pub position: [f64; 2],
    pub radius: f64,
    pub heading: [f64; 2],
}
#[derive(Clone, Copy, Debug)]
pub struct Edge {
    pub i: usize,
    pub j: usize,
    pub displacement: [f64; 2],
    pub length: f64,
    pub extent: f64,
}
impl Edge {
    pub fn weight(&self) -> f64 {
        (1. - self.length / self.extent).max(0.)
    }
    pub fn direction(&self) -> [f64; 2] {
        if self.length > 0. {
            self.displacement.map(|v| v / self.length)
        } else {
            [0.; 2]
        }
    }
}
pub struct Contacts {
    pub bodies: Vec<Body>,
    pub edges: Vec<Edge>,
    pub candidates: usize,
}
struct Level {
    shape: [usize; 2],
    size: [f64; 2],
    bins: HashMap<usize, Vec<usize>>,
    members: Vec<usize>,
}
impl Level {
    fn new(members: Vec<usize>, bodies: &[Body], c: &Config) -> Self {
        let diameter = members
            .iter()
            .map(|&i| 2. * bodies[i].radius)
            .fold(0., f64::max);
        let size = [c.width, c.height];
        // Sparse storage depends on occupied bins, never on the area of the world.
        let shape = size.map(|v| (v / diameter).floor().clamp(1., bodies.len() as f64) as usize);
        let mut level = Self {
            shape,
            size,
            bins: HashMap::new(),
            members,
        };
        for &i in &level.members {
            let [x, y] = level.bin(bodies[i].position);
            level.bins.entry(y * shape[0] + x).or_default().push(i);
        }
        level
    }
    fn bin(&self, position: [f64; 2]) -> [usize; 2] {
        std::array::from_fn(|k| {
            ((position[k] / self.size[k] * self.shape[k] as f64) as usize).min(self.shape[k] - 1)
        })
    }
    fn nearby(&self, key: usize, mut visit: impl FnMut(usize, &[usize])) {
        let [x, y] = [key % self.shape[0], key / self.shape[0]];
        let mut visited = [usize::MAX; 9];
        let mut count = 0;
        for dy in -1..=1 {
            for dx in -1..=1 {
                let key = (y as isize + dy).rem_euclid(self.shape[1] as isize) as usize
                    * self.shape[0]
                    + (x as isize + dx).rem_euclid(self.shape[0] as isize) as usize;
                if visited[..count].contains(&key) {
                    continue;
                }
                visited[count] = key;
                count += 1;
                if let Some(indices) = self.bins.get(&key) {
                    visit(key, indices);
                }
            }
        }
    }
}
fn periodic_difference(value: f64, size: f64) -> f64 {
    if value >= size * 0.5 {
        value - size
    } else if value < -size * 0.5 {
        value + size
    } else {
        value
    }
}
fn overlap(i: usize, j: usize, bodies: &[Body], c: &Config) -> Option<Edge> {
    let (i, j) = (i.min(j), i.max(j));
    let (a, b) = (bodies[i], bodies[j]);
    let extent = a.radius + b.radius;
    let x = periodic_difference(b.position[0] - a.position[0], c.width);
    if x.abs() >= extent {
        return None;
    }
    let y = periodic_difference(b.position[1] - a.position[1], c.height);
    if y.abs() >= extent || x * x + y * y >= extent * extent {
        return None;
    }
    Some(Edge {
        i,
        j,
        displacement: [x, y],
        length: (x * x + y * y).sqrt(),
        extent,
    })
}
impl Contacts {
    pub fn new(cells: &[Cell], c: &Config) -> Self {
        let bodies: Vec<_> = cells
            .iter()
            .map(|cell| {
                let (sin, cos) = cell.heading.sin_cos();
                Body {
                    position: [cell.x.rem_euclid(c.width), cell.y.rem_euclid(c.height)],
                    radius: cell.radius(c),
                    heading: [cos, sin],
                }
            })
            .collect();
        let mut classes: BTreeMap<i32, Vec<usize>> = BTreeMap::new();
        for (i, body) in bodies.iter().enumerate() {
            classes
                .entry((2. * body.radius).log2().ceil() as i32)
                .or_default()
                .push(i);
        }
        let levels: Vec<_> = classes
            .into_values()
            .map(|m| Level::new(m, &bodies, c))
            .collect();
        let mut result = Self {
            bodies,
            edges: vec![],
            candidates: 0,
        };
        for (class, level) in levels.iter().enumerate() {
            for (offset, target) in levels[class..].iter().enumerate() {
                let projected;
                let bins = if offset == 0 {
                    &level.bins
                } else {
                    projected = project(&level.members, &result.bodies, target);
                    &projected
                };
                // Query each occupied bin once, then use its compact body lists. No per-cell
                // hashing of the same dense neighborhood, and no global contact sort.
                let mut keys: Vec<_> = bins.keys().copied().collect();
                keys.sort_unstable();
                for key in keys {
                    let members = &bins[&key];
                    target.nearby(key, |other, neighbors| {
                        if offset == 0 && other < key {
                            return;
                        }
                        for &i in members {
                            for &j in neighbors {
                                if offset == 0 && other == key && j <= i {
                                    continue;
                                }
                                result.candidates += 1;
                                if let Some(edge) = overlap(i, j, &result.bodies, c) {
                                    result.edges.push(edge);
                                }
                            }
                        }
                    });
                }
            }
        }
        result
    }
}

fn project(members: &[usize], bodies: &[Body], target: &Level) -> HashMap<usize, Vec<usize>> {
    let mut bins = HashMap::<_, Vec<_>>::new();
    for &i in members {
        let [x, y] = target.bin(bodies[i].position);
        bins.entry(y * target.shape[0] + x).or_default().push(i);
    }
    bins
}
