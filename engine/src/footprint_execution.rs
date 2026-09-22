//! Prepared W and incremental W-transpose body projection share one geographic epoch.
use super::{Row, sites};
use crate::{config::Config, execution, field::Field, organism::Cell};
use std::collections::HashMap;

#[derive(Clone, Debug, Default)]
struct Owner {
    id: u64,
    position: [f64; 2],
    radius: f64,
    mass: f64,
    profile: [f64; 3],
}

#[derive(Clone, Debug, Default)]
pub struct Projection {
    owners: Vec<Owner>,
    configuration: Option<[f64; 5]>,
    pub preparations: u64,
    pub reuses: u64,
    pub material_updates: u64,
}

impl Projection {
    pub fn prepare(&mut self, cells: &[Cell], c: &Config, field: &mut Field, rows: &mut Vec<Row>) {
        let configuration = [
            c.width,
            c.height,
            field.spacing,
            c.body_density,
            c.inventory_density,
        ];
        if self.configuration != Some(configuration) {
            field.reset_carriers(0);
            self.owners.clear();
            rows.clear();
            self.configuration = Some(configuration);
        }
        if self.owners.len() != cells.len()
            || self
                .owners
                .iter()
                .zip(cells)
                .any(|(owner, cell)| owner.id != cell.id)
        {
            self.align(cells, field, rows);
        }
        for ((owner, row), cell) in self.owners.iter_mut().zip(rows).zip(cells) {
            let profile = cell.operators.as_ref().unwrap().profile;
            let radius = cell.radius(c);
            let mass = cell.mass();
            let geometric = row.is_empty() || expired(owner, cell, radius, c, field.spacing);
            if !geometric {
                if mass != owner.mass || profile != owner.profile {
                    update_material(field, owner, row, mass, profile);
                    self.material_updates += 1;
                }
                self.reuses += 1;
                continue;
            }
            deposit(field, owner, row, -1.);
            *owner = Owner {
                id: cell.id,
                position: [cell.x, cell.y],
                radius,
                mass,
                profile,
            };
            let revision = row.revision + 1;
            *row = sites(cell, c, field);
            row.revision = revision;
            deposit(field, owner, row, 1.);
            self.preparations += 1;
        }
    }

    fn align(&mut self, cells: &[Cell], field: &mut Field, rows: &mut Vec<Row>) {
        if self.owners.windows(2).all(|p| p[0].id < p[1].id)
            && cells.windows(2).all(|p| p[0].id < p[1].id)
        {
            self.align_ordered(cells, field, rows);
            return;
        }
        let mut previous: HashMap<_, _> = self
            .owners
            .drain(..)
            .zip(rows.drain(..))
            .map(|(owner, row)| (owner.id, (owner, row)))
            .collect();
        self.owners.reserve(cells.len());
        rows.reserve(cells.len());
        for cell in cells {
            let (owner, row) = previous.remove(&cell.id).unwrap_or_else(|| {
                (
                    Owner {
                        id: cell.id,
                        ..Owner::default()
                    },
                    Row::default(),
                )
            });
            self.owners.push(owner);
            rows.push(row);
        }
        for (_, (owner, row)) in previous {
            deposit(field, &owner, &row, -1.);
        }
    }

    fn align_ordered(&mut self, cells: &[Cell], field: &mut Field, rows: &mut Vec<Row>) {
        let owners = std::mem::take(&mut self.owners);
        let previous_rows = std::mem::take(rows);
        self.owners.reserve(cells.len());
        rows.reserve(cells.len());
        let mut previous = owners.into_iter().zip(previous_rows).peekable();
        for cell in cells {
            while previous.peek().is_some_and(|(owner, _)| owner.id < cell.id) {
                let (owner, row) = previous.next().unwrap();
                deposit(field, &owner, &row, -1.);
            }
            let existing = previous
                .peek()
                .is_some_and(|(owner, _)| owner.id == cell.id);
            let (owner, row) = if existing {
                previous.next().unwrap()
            } else {
                (
                    Owner {
                        id: cell.id,
                        ..Owner::default()
                    },
                    Row::default(),
                )
            };
            self.owners.push(owner);
            rows.push(row);
        }
        for (owner, row) in previous {
            deposit(field, &owner, &row, -1.);
        }
    }
}

fn expired(owner: &Owner, cell: &Cell, radius: f64, c: &Config, spacing: f64) -> bool {
    // A bilinear row is 2/h Lipschitz per axis. Averaging the four offsets
    // ±r/sqrt(2) gives ||ΔW||₁ <= 2sqrt(2)/h * (|Δcenter| + |Δr|/2).
    let margin = execution::RESOLUTION * spacing / (2. * std::f64::consts::SQRT_2)
        - (radius - owner.radius).abs() * 0.5;
    margin < 0.
        || crate::movement::distance_squared(owner.position, [cell.x, cell.y], c) > margin * margin
}

fn update_material(field: &mut Field, owner: &mut Owner, row: &Row, mass: f64, profile: [f64; 3]) {
    field.carrier(
        0,
        owner.id,
        row,
        profile.map(|p| mass * p / field.spacing.powi(2)),
    );
    owner.mass = mass;
    owner.profile = profile;
}

fn deposit(field: &mut Field, owner: &Owner, row: &Row, sign: f64) {
    let profile = if sign < 0. {
        [0.; 3]
    } else {
        owner
            .profile
            .map(|p| owner.mass * p / field.spacing.powi(2))
    };
    field.carrier(0, owner.id, row, profile);
}

#[cfg(test)]
#[path = "footprint_execution_tests.rs"]
mod tests;
