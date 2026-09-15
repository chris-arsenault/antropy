use crate::{config::Config, field::Field, organism::Cell, random::Random};
pub fn delta(x: f64, size: f64) -> f64 {
    if x >= -size && x < size {
        if x >= size / 2. {
            x - size
        } else if x < -size / 2. {
            x + size
        } else {
            x
        }
    } else {
        (x + size / 2.).rem_euclid(size) - size / 2.
    }
}
pub fn distance(a: [f64; 2], b: [f64; 2], c: &Config) -> f64 {
    distance_squared(a, b, c).sqrt()
}
pub fn distance_squared(a: [f64; 2], b: [f64; 2], c: &Config) -> f64 {
    delta(a[0] - b[0], c.width).powi(2) + delta(a[1] - b[1], c.height).powi(2)
}

pub struct Spatial {
    nx: usize,
    ny: usize,
    width: f64,
    height: f64,
    buckets: Vec<Vec<usize>>,
    pub radii: Vec<f64>,
}
impl Spatial {
    pub fn new(c: &Config, cells: &[Cell]) -> Self {
        let radii: Vec<_> = cells.iter().map(|v| v.radius(c)).collect();
        let pitch = (2. * radii.iter().copied().fold(0.5, f64::max) + 0.1).max(c.mesh * 2.);
        Self::with_pitch(c, cells, radii, pitch)
    }
    pub fn for_observation(c: &Config, cells: &[Cell], reach: f64) -> Self {
        Self::with_pitch(c, cells, vec![0.; cells.len()], reach)
    }
    fn with_pitch(c: &Config, cells: &[Cell], radii: Vec<f64>, pitch: f64) -> Self {
        let nx = (c.width / pitch).floor().max(1.) as usize;
        let ny = (c.height / pitch).floor().max(1.) as usize;
        let mut result = Self {
            nx,
            ny,
            width: c.width,
            height: c.height,
            buckets: vec![vec![]; nx * ny],
            radii,
        };
        for (i, cell) in cells.iter().enumerate() {
            result.add(i, cell, result.radii[i]);
        }
        result
    }
    fn bucket(&self, x: f64, y: f64) -> usize {
        let ix = (canonical(x, self.width) / self.width * self.nx as f64) as usize;
        let iy = (canonical(y, self.height) / self.height * self.ny as f64) as usize;
        iy * self.nx + ix
    }
    pub fn add(&mut self, i: usize, cell: &Cell, radius: f64) {
        if i >= self.radii.len() {
            self.radii.resize(i + 1, 0.);
        }
        self.radii[i] = radius;
        let b = self.bucket(cell.x, cell.y);
        self.buckets[b].push(i);
    }
    pub fn remove(&mut self, i: usize, cell: &Cell) {
        let b = self.bucket(cell.x, cell.y);
        self.buckets[b].retain(|x| *x != i);
    }
    pub fn near(&self, x: f64, y: f64, result: &mut Vec<usize>) {
        result.clear();
        let center = self.bucket(x, y);
        let xs = neighbors(center % self.nx, self.nx);
        let ys = neighbors(center / self.nx, self.ny);
        for &y in &ys[..self.ny.min(3)] {
            for &x in &xs[..self.nx.min(3)] {
                result.extend(&self.buckets[y * self.nx + x]);
            }
        }
    }
    pub fn free(
        &self,
        p: [f64; 2],
        radius: f64,
        ignore: usize,
        cells: &[Cell],
        c: &Config,
    ) -> bool {
        let mut near = vec![];
        self.near(p[0], p[1], &mut near);
        near.iter().all(|&i| {
            i == ignore
                || distance_squared(p, [cells[i].x, cells[i].y], c)
                    >= (radius + self.radii[i]).powi(2)
        })
    }
}
fn canonical(x: f64, size: f64) -> f64 {
    if x >= 0. && x < size {
        x
    } else {
        x.rem_euclid(size)
    }
}
// Preserve the old -1, 0, +1 traversal order, visiting each bucket once on tiny tori.
fn neighbors(center: usize, size: usize) -> [usize; 3] {
    [
        if center == 0 { size - 1 } else { center - 1 },
        center,
        if center + 1 == size { 0 } else { center + 1 },
    ]
}
fn contact(cell: &mut Cell, dx: f64, dy: f64) {
    let angle = (dy.atan2(dx) - cell.heading + std::f64::consts::FRAC_PI_4)
        .rem_euclid(std::f64::consts::TAU);
    let sector = (angle / std::f64::consts::FRAC_PI_2) as usize;
    cell.contacts[[0, 3, 2, 1][sector]] = 1.;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn periodic_queries_preserve_candidates_and_order() {
        for nx in [1, 2, 3, 17] {
            for ny in [1, 2, 3, 13] {
                let index = Spatial {
                    nx,
                    ny,
                    width: nx as f64,
                    height: ny as f64,
                    buckets: (0..nx * ny).map(|i| vec![i]).collect(),
                    radii: vec![],
                };
                for cy in 0..ny {
                    for cx in 0..nx {
                        let mut expected = vec![];
                        for dy in -1_isize..=1 {
                            for dx in -1_isize..=1 {
                                if (nx == 1 && dx != 0)
                                    || (nx == 2 && dx == 1)
                                    || (ny == 1 && dy != 0)
                                    || (ny == 2 && dy == 1)
                                {
                                    continue;
                                }
                                let x = (cx as isize + dx).rem_euclid(nx as isize) as usize;
                                let y = (cy as isize + dy).rem_euclid(ny as isize) as usize;
                                expected.push(y * nx + x);
                            }
                        }
                        for shift in [-2., 0., 3.] {
                            let mut actual = vec![];
                            index.near(
                                cx as f64 + 0.5 + shift * nx as f64,
                                cy as f64 + 0.5 - shift * ny as f64,
                                &mut actual,
                            );
                            assert_eq!(actual, expected);
                        }
                    }
                }
            }
        }
    }
}
pub fn resolve(cells: &mut [Cell], c: &Config) {
    let mut index = Spatial::new(c, cells);
    let mut near = vec![];
    for _ in 0..4 {
        let mut moved = false;
        for i in 0..cells.len() {
            index.near(cells[i].x, cells[i].y, &mut near);
            for &j in &near {
                if j <= i {
                    continue;
                }
                let (left, right) = cells.split_at_mut(j);
                let (a, b) = (&mut left[i], &mut right[0]);
                let (dx, dy) = (delta(b.x - a.x, c.width), delta(b.y - a.y, c.height));
                let (ra, rb) = (index.radii[i], index.radii[j]);
                let squared = dx * dx + dy * dy;
                if squared > (ra + rb + 1e-8).powi(2) {
                    continue;
                }
                let d = squared.sqrt();
                let overlap = ra + rb - d;
                if overlap < -1e-8 {
                    continue;
                }
                contact(a, dx, dy);
                contact(b, -dx, -dy);
                if overlap <= 0. {
                    continue;
                }
                let (ux, uy) = if d > 1e-10 {
                    (dx / d, dy / d)
                } else {
                    let angle = (a.id + b.id) as f64 * 2.399963;
                    (angle.cos(), angle.sin())
                };
                index.remove(i, a);
                index.remove(j, b);
                let displacement = overlap / (ra + rb);
                a.x = (a.x - ux * displacement * rb).rem_euclid(c.width);
                a.y = (a.y - uy * displacement * rb).rem_euclid(c.height);
                b.x = (b.x + ux * displacement * ra).rem_euclid(c.width);
                b.y = (b.y + uy * displacement * ra).rem_euclid(c.height);
                index.add(i, a, ra);
                index.add(j, b, rb);
                moved = true;
            }
        }
        if !moved {
            break;
        }
    }
}
pub fn mobility(load: f64, k: f64) -> f64 {
    1. / (1. + k * load * load)
}
pub fn motor_limits(cell: &Cell, c: &Config, mobility: f64) -> (f64, f64, f64) {
    let r = cell.radius(c).max(1e-9);
    let power = cell.body[1] * c.motor_power_density;
    let translation = 6. * std::f64::consts::PI * c.viscosity * r / (mobility * mobility);
    let rotation = 8. * std::f64::consts::PI * c.viscosity * r.powi(3) / (mobility * mobility);
    (
        (1. - cell.damage) * (c.motor_efficiency * power / translation).sqrt(),
        (1. - cell.damage) * (c.motor_efficiency * power / rotation).sqrt(),
        rotation,
    )
}
pub fn move_cells(cells: &mut [Cell], c: &Config, field: &Field, rng: &mut Random) {
    let mut speeds = Vec::with_capacity(cells.len());
    let mut steps = 1;
    for cell in cells.iter_mut() {
        let sites = field.stencil(cell.x, cell.y);
        let load = field.scalar(&field.impedance, &sites);
        let mobility = mobility(load, c.movement_impedance);
        let r = cell.radius(c).max(1e-9);
        let power = cell.body[1] * c.motor_power_density;
        let (speed, turn_rate, rotation) = motor_limits(cell, c, mobility);
        let norm = cell.action.swim.hypot(cell.action.turn).max(1.);
        let swim = cell.action.swim / norm;
        let turn = cell.action.turn / norm;
        let requested = (swim.powi(2) + turn.powi(2)) * power * c.dt;
        let paid = cell.pay(requested.min((cell.energy - cell.basal(c)).max(0.)));
        let scale = (paid / requested.max(1e-300)).sqrt();
        cell.flows.motors += paid;
        cell.contacts.fill(0.);
        cell.heading = (cell.heading
            + turn * scale * turn_rate * c.dt
            + rng.signed() * (6. * c.thermal_energy / rotation * c.dt).sqrt())
        .rem_euclid(std::f64::consts::TAU);
        let length = swim * scale * speed * c.dt;
        steps = steps.max((length / (r * 0.5).min(0.25)).ceil() as usize);
        speeds.push(length);
        cell.flows.distance += length;
    }
    for _ in 0..steps {
        for (cell, length) in cells.iter_mut().zip(&speeds) {
            cell.x = (cell.x + cell.heading.cos() * length / steps as f64).rem_euclid(c.width);
            cell.y = (cell.y + cell.heading.sin() * length / steps as f64).rem_euclid(c.height);
        }
        resolve(cells, c);
    }
}
