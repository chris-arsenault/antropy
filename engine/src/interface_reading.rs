//! One receiver boundary serves prepared stages and read-only selected-cell queries.
use super::{Cell, Chemistry, Config, Neighbor, Reading};
pub(super) struct Boundary<'a> {
    pub neighbors: &'a [Neighbor],
    pub field: f64,
}
impl Boundary<'_> {
    pub fn read<const CONTROL: bool, const STRESS: bool>(
        &self,
        i: usize,
        cells: &[Cell],
        c: &Config,
        chemistry: &Chemistry,
        stress: impl Fn(usize) -> f64,
        exposure: impl Fn(usize) -> f64,
    ) -> Reading {
        let cell = &cells[i];
        let mut reading = Reading {
            field: self.field,
            ..Reading::default()
        };
        let operators = cell.operators.as_ref().unwrap();
        let (sin, cos) = cell.heading.sin_cos();
        for n in self.neighbors {
            let donor = &cells[n.donor];
            let exposed = n.weight * exposure(n.donor);
            if exposed == 0. {
                continue;
            }
            if CONTROL {
                let directions = crate::movement::geometry::prepared::pressure::directions(
                    n.direction,
                    [cos, sin],
                );
                for (slot, receptor) in operators.receptors.iter().enumerate() {
                    if cell.body[3 + slot] == 0. || cell.installed.inward[slot] == 1. {
                        continue;
                    }
                    let local = exposed
                        * receptor
                            .iter()
                            .map(|a| a.value * donor.inventory.value(a.species))
                            .sum::<f64>();
                    reading.recognition[slot][0] += local;
                    for (k, direction) in directions.into_iter().enumerate() {
                        reading.recognition[slot][k + 1] += local * direction;
                    }
                }
            }
            if STRESS {
                let mut stress = stress(n.donor);
                for a in operators.membrane.iter() {
                    stress -= (1. - c.susceptibility_floor)
                        * a.value
                        * chemistry.properties[a.species].stress
                        * donor.inventory.value(a.species);
                }
                reading.stress += exposed * stress.max(0.);
            }
        }
        reading
    }
}

/// Inspect one receiver without building all pairs or mutating execution state.
pub fn selected(i: usize, cells: &[Cell], c: &Config, chemistry: &Chemistry) -> Reading {
    let cell = &cells[i];
    let radius = cell.radius(c);
    let mut weight = 0.;
    let mut neighbors = Vec::new();
    for (j, donor) in cells.iter().enumerate() {
        if i == j {
            continue;
        }
        // Canonical reciprocal direction also handles periodic antipodal ties.
        let sign = if i < j { 1. } else { -1. };
        let displacement = [
            crate::movement::delta(sign * (donor.x - cell.x), c.width) * sign,
            crate::movement::delta(sign * (donor.y - cell.y), c.height) * sign,
        ];
        let length = (displacement[0].powi(2) + displacement[1].powi(2)).sqrt();
        let overlap = (1. - length / (radius + donor.radius(c))).max(0.);
        weight += overlap;
        if overlap == 0. || donor.damage == 0. || donor.material() == 0. {
            continue;
        }
        neighbors.push(Neighbor {
            donor: j,
            weight: overlap,
            direction: if length > 0. {
                displacement.map(|x| x / length)
            } else {
                [0.; 2]
            },
        });
    }
    let field = 1. / (1. + weight);
    for n in &mut neighbors {
        n.weight *= field;
    }
    Boundary {
        neighbors: &neighbors,
        field,
    }
    .read::<true, true>(
        i,
        cells,
        c,
        chemistry,
        |j| super::donor_stress(&cells[j], chemistry),
        |j| cells[j].damage / cells[j].volume(c).max(1e-30),
    )
}
