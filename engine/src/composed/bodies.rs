use super::{Accounts, DRIFT, field::Kernel};
use crate::{chemistry::Chemistry, config::Config, field::Field, organism::Cell};

/// Material projection is independent of geographic position.
#[derive(Clone, Copy, Debug)]
pub struct Material {
    pub profile: [f64; 2],
    pub mass: f64,
    radius: f64,
}
impl Material {
    pub fn project(cell: &Cell, membrane: [f64; 2], rows: &[[f64; 256]; 2], c: &Config) -> Self {
        let internal = super::numeric::project_pair(
            cell.inventory.iter().as_slice().try_into().unwrap(),
            rows,
        );
        Self {
            profile: std::array::from_fn(|k| membrane[k] * cell.mass() + internal[k]),
            mass: cell.mass() + cell.material(),
            radius: cell.radius(c),
        }
    }
}
#[derive(Clone, Debug)]
pub struct Cloud {
    pub weights: Vec<(usize, f64)>,
    pub profile: [f64; 2],
    pub mass: f64,
}
impl Cloud {
    pub fn new(
        cell: &Cell,
        membrane: [f64; 2],
        field: &Field,
        chemistry: &Chemistry,
        c: &Config,
    ) -> Self {
        Self::from_profile(
            cell,
            chemistry.profiles.evaluate(membrane),
            field,
            chemistry,
            c,
        )
    }
    pub fn from_profile(
        cell: &Cell,
        membrane_profile: [f64; 2],
        field: &Field,
        chemistry: &Chemistry,
        c: &Config,
    ) -> Self {
        let rows = std::array::from_fn(|k| {
            std::array::from_fn(|s| chemistry.properties[s].interaction[k])
        });
        let material = Material::project(cell, membrane_profile, &rows, c);
        Self::from_material(cell, &material, field)
    }
    pub fn from_material(cell: &Cell, material: &Material, field: &Field) -> Self {
        let r = material.radius;
        let mut weights: Vec<(usize, f64)> = Vec::with_capacity(20);
        for (dx, dy, share) in [
            (0., 0., 0.5),
            (r, 0., 0.125),
            (-r, 0., 0.125),
            (0., r, 0.125),
            (0., -r, 0.125),
        ] {
            for (i, w) in field.stencil(cell.x + dx, cell.y + dy) {
                if let Some(entry) = weights.iter_mut().find(|entry| entry.0 == i) {
                    entry.1 += w * share;
                } else {
                    weights.push((i, w * share));
                }
            }
        }
        Self {
            weights,
            profile: material.profile,
            mass: material.mass,
        }
    }
    pub fn sample(&self, field: &Field, species: usize) -> f64 {
        self.weights
            .iter()
            .map(|&(i, w)| w * field.amounts[i * 256 + species] as f64)
            .sum::<f64>()
            / field.spacing.powi(2)
    }
}

/// Return passive and motor displacement separately. Neither contact nor drift credits work.
pub fn motion(
    cell: &mut Cell,
    cloud: &Cloud,
    field: &Field,
    kernel: &Kernel,
    force: [f64; 2],
    dt: f64,
    books: &mut Accounts,
) -> ([f64; 2], [f64; 2]) {
    let resistance: f64 = cloud
        .weights
        .iter()
        .map(|&(i, w)| w * kernel.resistance[i])
        .sum();
    let mobility = 1. / (cloud.mass.max(f64::MIN_POSITIVE) * resistance);
    let gradient = kernel.gradient(field, cloud);
    let drive = gradient.map(|v| {
        (v[0] * cloud.profile[0] + v[1] * cloud.profile[1]) / cloud.mass.max(f64::MIN_POSITIVE)
    });
    let passive = drive.map(|v| dt * DRIFT * mobility * v / (1. + drive[0].abs() + drive[1].abs()));
    let requested = dt * mobility * (force[0] * force[0] + force[1] * force[1]);
    let funded = if requested > 0. {
        (cell.energy / requested).min(1.).sqrt()
    } else {
        0.
    };
    let mut motor = force.map(|f| dt * mobility * f * funded);
    let limit = field.spacing * 0.25;
    let length = (motor[0] + passive[0]).hypot(motor[1] + passive[1]);
    let scale = (limit / length.max(f64::MIN_POSITIVE)).min(1.);
    let passive = passive.map(|v| v * scale);
    motor = motor.map(|v| v * scale);
    books.heat += cell.pay(requested * funded * funded * scale * scale);
    cell.x = (cell.x + passive[0] + motor[0]).rem_euclid(field.nx as f64 * field.spacing);
    cell.y = (cell.y + passive[1] + motor[1]).rem_euclid(field.ny as f64 * field.spacing);
    (passive, motor)
}

pub fn separate(a: &mut Cell, b: &mut Cell, c: &Config) -> f64 {
    let dx = crate::movement::delta(b.x - a.x, c.width);
    let dy = crate::movement::delta(b.y - a.y, c.height);
    let d = dx.hypot(dy);
    let overlap = (a.radius(c) + b.radius(c) - d).max(0.);
    let direction = if d > 0. { [dx / d, dy / d] } else { [1., 0.] };
    let ma = a.mass() + a.material();
    let mb = b.mass() + b.material();
    let share = mb / (ma + mb).max(f64::MIN_POSITIVE);
    a.x = (a.x - direction[0] * overlap * share).rem_euclid(c.width);
    a.y = (a.y - direction[1] * overlap * share).rem_euclid(c.height);
    b.x = (b.x + direction[0] * overlap * (1. - share)).rem_euclid(c.width);
    b.y = (b.y + direction[1] * overlap * (1. - share)).rem_euclid(c.height);
    overlap
}
