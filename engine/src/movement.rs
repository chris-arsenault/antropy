use crate::{config::Config, field::Field, organism::Cell};
pub fn delta(x: f64, width: f64) -> f64 {
    (x + width * 0.5).rem_euclid(width) - width * 0.5
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
pub fn advance(cells: &mut [Cell], c: &Config, field: &Field, sites: &[Vec<(usize, f64)>]) {
    for (cell, row) in cells.iter_mut().zip(sites) {
        let mobility = mobility(field.medium_load(row), c.movement_impedance);
        let (speed, _) = motor_limits(cell, c, mobility);
        let cost = motor_work_rate(
            &cell.body,
            cell.damage,
            cell.action.swim,
            cell.action.turn,
            c,
        ) * c.dt;
        let paid = cell.pay(cost);
        cell.flows.motors += paid;
        let fraction = if cost > 0. { (paid / cost).sqrt() } else { 0. };
        cell.heading = (cell.heading
            + cell.action.turn * speed / (2. * cell.radius(c).max(0.01)) * c.dt * fraction)
            .rem_euclid(std::f64::consts::TAU);
        let gradient = field.gradient(row);
        let profile = cell.operators.as_ref().unwrap().profile;
        let self_load =
            crate::medium_response::self_load(cell.mass() * profile[2], field.spacing.powi(2), row);
        let passive = passive(
            profile,
            gradient,
            c.pressure_strength * (field.pressure_load(row) - self_load).max(0.),
            mobility,
            field.drift,
        );
        let swimming = speed * cell.action.swim * fraction;
        let dx = (swimming * cell.heading.cos() + passive[0]) * c.dt;
        let dy = (swimming * cell.heading.sin() + passive[1]) * c.dt;
        cell.x = (cell.x + dx).rem_euclid(c.width);
        cell.y = (cell.y + dy).rem_euclid(c.height);
        cell.flows.distance += dx.hypot(dy);
        cell.contacts = [0.; 4];
    }
    contacts(cells, c);
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
    let radius = cells.iter().map(|b| b.radius(c)).fold(0.1, f64::max);
    let index = Spatial::for_observation(c, cells, 2. * radius);
    let mut near = vec![];
    let mut result = vec![];
    for (i, a) in cells.iter().enumerate() {
        index.near(a.x, a.y, &mut near);
        for &j in &near {
            if j > i
                && distance([a.x, a.y], [cells[j].x, cells[j].y], c)
                    < a.radius(c) + cells[j].radius(c)
            {
                result.push((i, j));
            }
        }
    }
    result.sort_unstable();
    result
}
fn contacts(cells: &mut [Cell], c: &Config) {
    let mut shifts = vec![[0.; 2]; cells.len()];
    for (i, j) in pairs(cells, c) {
        let a = &cells[i];
        let b = &cells[j];
        let d = [delta(b.x - a.x, c.width), delta(b.y - a.y, c.height)];
        let length = d[0].hypot(d[1]);
        let unit = if length > 0. {
            [d[0] / length, d[1] / length]
        } else {
            let direction = [
                b.heading.cos() - a.heading.cos(),
                b.heading.sin() - a.heading.sin(),
            ];
            let norm = direction[0].hypot(direction[1]);
            if norm > 1e-12 {
                direction.map(|v| v / norm)
            } else {
                [0.; 2]
            }
        };
        let correction = ((a.radius(c) + b.radius(c) - length) * 0.25).min(c.dt * 0.5);
        for k in 0..2 {
            shifts[i][k] -= unit[k] * correction;
            shifts[j][k] += unit[k] * correction;
        }
        let headings = [a.heading, b.heading];
        for (index, heading, sign) in [(i, headings[0], 1.), (j, headings[1], -1.)] {
            let forward = sign * (unit[0] * heading.cos() + unit[1] * heading.sin());
            let left = sign * (-unit[0] * heading.sin() + unit[1] * heading.cos());
            let reads = [
                forward.max(0.),
                left.max(0.),
                (-forward).max(0.),
                (-left).max(0.),
            ];
            for (v, r) in cells[index].contacts.iter_mut().zip(reads) {
                *v = v.max(r);
            }
        }
    }
    for (cell, d) in cells.iter_mut().zip(shifts) {
        cell.x = (cell.x + d[0]).rem_euclid(c.width);
        cell.y = (cell.y + d[1]).rem_euclid(c.height);
    }
}
