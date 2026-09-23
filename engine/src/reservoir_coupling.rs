//! Reservoir-to-reservoir coupling: long-range signed-repulsion charge and circle exclusion.
//! Short-range cohesion is the shared attraction response; this adds the opposing tension
//! that gives reservoir clusters a finite size and spacing. No position is remembered.
use crate::{chemistry::Chemistry, config::Config, source_medium::Material, sources::Source};

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Coupling {
    /// Long-range force, added to the chemical force before the saturating bound.
    pub force: [f64; 2],
    /// Soft circle separation velocity, applied like cell contact separation.
    pub shift: [f64; 2],
}

struct Owner {
    position: [f64; 2],
    radius: f64,
    /// Mean signed-repulsion property of the inventory (0 when empty).
    mean: f64,
    /// Exposed charge: interface-saturated inventory times its signed-repulsion property.
    charge: f64,
}

fn owner(s: &Source, chemistry: &Chemistry) -> Owner {
    let fresh;
    let material = if s.material.valid {
        &s.material
    } else {
        fresh = Material::read(s.inventory(), chemistry);
        &fresh
    };
    let (mean, charge) = if material.total > 0. {
        (
            material.moments[1] / material.total,
            material.moments[1] / (1. + material.total / s.interface.max(f64::MIN_POSITIVE)),
        )
    } else {
        (0., 0.)
    };
    Owner {
        position: [s.habitat.x, s.habitat.y],
        radius: s.habitat.radius,
        mean,
        charge,
    }
}

/// Periodic buckets at least one interaction reach wide, so each owner reads its 3×3 block.
struct Grid {
    size: [usize; 2],
    cell: [f64; 2],
    buckets: Vec<Vec<usize>>,
}
impl Grid {
    fn new(owners: &[Owner], reach: f64, c: &Config) -> Self {
        let size = [c.width, c.height].map(|extent| ((extent / reach).floor() as usize).max(1));
        let cell = [c.width / size[0] as f64, c.height / size[1] as f64];
        let mut grid = Self {
            size,
            cell,
            buckets: vec![Vec::new(); size[0] * size[1]],
        };
        for (i, o) in owners.iter().enumerate() {
            let b = grid.bucket(o.position);
            grid.buckets[b[1] * size[0] + b[0]].push(i);
        }
        grid
    }
    fn bucket(&self, p: [f64; 2]) -> [usize; 2] {
        [0, 1].map(|k| ((p[k] / self.cell[k]) as usize).min(self.size[k] - 1))
    }
    fn neighbours(&self, p: [f64; 2]) -> impl Iterator<Item = usize> + '_ {
        let b = self.bucket(p);
        let axis = |k: usize| {
            let mut v: Vec<usize> = [-1i64, 0, 1]
                .iter()
                .map(|d| (b[k] as i64 + d).rem_euclid(self.size[k] as i64) as usize)
                .collect();
            v.sort_unstable();
            v.dedup();
            v
        };
        let (xs, ys) = (axis(0), axis(1));
        ys.into_iter()
            .flat_map(move |y| xs.clone().into_iter().map(move |x| y * self.size[0] + x))
            .flat_map(|b| self.buckets[b].iter().copied())
    }
}

/// Couplings for every reservoir from current positions and inventories.
pub fn prepare(sources: &[Source], c: &Config, chemistry: &Chemistry) -> Vec<Coupling> {
    let owners: Vec<_> = sources.iter().map(|s| owner(s, chemistry)).collect();
    let range = c.reservoir_range;
    let contact = owners.iter().map(|o| 2. * o.radius).fold(0., f64::max);
    let reach = (3. * range).max(contact).max(f64::MIN_POSITIVE);
    let grid = Grid::new(&owners, reach, c);
    let rate = crate::movement::geometry::separation_rate(c.dt);
    let norm = 1. / (2. * std::f64::consts::PI * range * range);
    owners
        .iter()
        .enumerate()
        .map(|(i, a)| {
            let mut result = Coupling::default();
            for j in grid.neighbours(a.position) {
                if j == i {
                    continue;
                }
                let b = &owners[j];
                // Displacement from j to i on the periodic plane.
                let d = [
                    crate::movement::delta(a.position[0] - b.position[0], c.width),
                    crate::movement::delta(a.position[1] - b.position[1], c.height),
                ];
                let r2 = d[0] * d[0] + d[1] * d[1];
                if c.reservoir_repulsion > 0. && a.mean != 0. && r2 < 9. * range * range {
                    // -γ b_i ∇Φ with Φ = Σ q_j K_L: like signs push i away from j.
                    let k = norm * (-0.5 * r2 / (range * range)).exp() / (range * range);
                    let scale = c.reservoir_repulsion * a.mean * b.charge * k;
                    result.force[0] += scale * d[0];
                    result.force[1] += scale * d[1];
                }
                let extent = a.radius + b.radius;
                let length = r2.sqrt();
                if length < extent && length > 0. {
                    let speed = (extent - length) * rate / length;
                    result.shift[0] += speed * d[0];
                    result.shift[1] += speed * d[1];
                }
            }
            result
        })
        .collect()
}
