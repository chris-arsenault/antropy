use crate::{config::Config, field::Field, organism::Cell};
#[path = "contact_geometry.rs"]
pub mod geometry;
#[cfg(test)]
#[path = "contact_geometry_tests.rs"]
mod geometry_tests;
#[path = "prepared_movement.rs"]
pub(crate) mod prepared;
#[cfg(test)]
#[path = "prepared_spatial_tests.rs"]
mod prepared_tests;
pub fn delta(x: f64, width: f64) -> f64 {
    let half = width * 0.5;
    if x >= -half && x < half {
        x
    } else if x >= half && x < width + half {
        x - width
    } else if x < -half && x >= -width - half {
        x + width
    } else {
        (x + half).rem_euclid(width) - half
    }
}
pub fn distance_squared(a: [f64; 2], b: [f64; 2], c: &Config) -> f64 {
    delta(a[0] - b[0], c.width).powi(2) + delta(a[1] - b[1], c.height).powi(2)
}
pub fn distance(a: [f64; 2], b: [f64; 2], c: &Config) -> f64 {
    distance_squared(a, b, c).sqrt()
}
pub fn mobility(load: f64, scale: f64) -> f64 {
    crate::field::mobility(load, scale)
}
/// Work-limited propulsion through a constitutive drag, with body extent in the drag area.
pub fn motor_limits(cell: &Cell, c: &Config, mobility: f64) -> (f64, f64) {
    let power = cell.body[1] * c.motor_power_density * (1. - cell.damage);
    let drag = c.viscosity * cell.radius(c).max(0.01) * 8.;
    ((power * c.motor_efficiency * mobility / drag).sqrt(), power)
}
/// Efforts specify velocity fractions; their squared norm prices the requested motion.
pub fn motor_work_rate(
    body: &crate::organism::Body,
    damage: f64,
    swim: f64,
    turn: f64,
    c: &Config,
) -> f64 {
    body[1] * c.motor_power_density * (1. - damage) * (swim * swim + 0.25 * turn * turn)
}
pub fn passive(
    profile: [f64; 3],
    gradient: [[f64; 3]; 2],
    load: f64,
    mobility: f64,
    drift: f64,
) -> [f64; 2] {
    let force = crate::medium_response::force(profile, gradient, load);
    let bound = drift * mobility / (1. + force[0].hypot(force[1]));
    force.map(|f| bound * f)
}
pub fn advance(cells: &mut [Cell], c: &Config, field: &Field, sites: &[crate::footprint::Row]) {
    advance_cached(cells, c, field, sites, &mut geometry::Cache::default());
}
pub fn advance_cached(
    cells: &mut [Cell],
    c: &Config,
    field: &Field,
    sites: &[crate::footprint::Row],
    cache: &mut geometry::Cache,
) {
    cache.prepare_local(cells, c);
    advance_prepared(cells, c, field, sites, cache);
}
/// Integrate one explicit step with contact coefficients frozen before motion.
pub fn advance_prepared(
    cells: &mut [Cell],
    c: &Config,
    field: &Field,
    sites: &[crate::footprint::Row],
    cache: &mut geometry::Cache,
) {
    cache.motion.advance(cells, c, field, sites);
    cache.motion.contacts(cells, c, &mut cache.local);
}
pub struct Spatial {
    nx: usize,
    ny: usize,
    width: f64,
    height: f64,
    bins: Vec<Vec<usize>>,
}
impl Spatial {
    pub fn for_observation(c: &Config, cells: &[Cell], reach: f64) -> Self {
        let nx = (c.width / reach).floor().max(1.) as usize;
        let ny = (c.height / reach).floor().max(1.) as usize;
        let mut result = Self {
            nx,
            ny,
            width: c.width,
            height: c.height,
            bins: vec![vec![]; nx * ny],
        };
        for (i, cell) in cells.iter().enumerate() {
            let (x, y) = result.bin(cell.x, cell.y);
            result.bins[y * nx + x].push(i);
        }
        result
    }
    fn bin(&self, x: f64, y: f64) -> (usize, usize) {
        (
            (x.rem_euclid(self.width) / self.width * self.nx as f64) as usize,
            (y.rem_euclid(self.height) / self.height * self.ny as f64) as usize,
        )
    }
    pub fn near(&self, x: f64, y: f64, out: &mut Vec<usize>) {
        out.clear();
        let (x, y) = self.bin(x, y);
        let mut visited = [usize::MAX; 9];
        let mut count = 0;
        for dy in -1..=1 {
            for dx in -1..=1 {
                let j = (y as isize + dy).rem_euclid(self.ny as isize) as usize * self.nx
                    + (x as isize + dx).rem_euclid(self.nx as isize) as usize;
                if !visited[..count].contains(&j) {
                    visited[count] = j;
                    count += 1;
                    out.extend(&self.bins[j]);
                }
            }
        }
    }
}
pub fn pairs(cells: &[Cell], c: &Config) -> Vec<(usize, usize)> {
    geometry::Contacts::new(cells, c)
        .edges
        .iter()
        .map(|e| (e.i, e.j))
        .collect()
}
