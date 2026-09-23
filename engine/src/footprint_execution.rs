//! Prepared W and incremental W-transpose body projection share one geographic epoch.
//! Each cell decides its own footprint update in parallel; the carrier owner applies all
//! resulting contribution changes with one job per region.
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
impl Owner {
    fn carried(&self, area: f64) -> [f64; 3] {
        self.profile.map(|p| self.mass * p / area)
    }
}

#[derive(Clone, Debug, Default)]
pub struct Projection {
    owners: Vec<Owner>,
    configuration: Option<[f64; 5]>,
    pub preparations: u64,
    pub reuses: u64,
    pub material_updates: u64,
}

/// A cell's previous contribution when its footprint or carried profile changed.
/// Held once per cell for one tick; boxing the row would allocate per moved cell.
#[allow(clippy::large_enum_variant)]
#[derive(Clone, Debug, Default)]
enum Update {
    #[default]
    Unchanged,
    Moved(Row, [f64; 3]),
    Material([f64; 3]),
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
        let area = field.spacing.powi(2);
        let mut removed = Vec::new();
        if self.owners.len() != cells.len()
            || self
                .owners
                .iter()
                .zip(cells)
                .any(|(owner, cell)| owner.id != cell.id)
        {
            self.align(cells, rows, &mut removed, area);
        }
        let mut updates = vec![Update::Unchanged; cells.len()];
        let geography: &Field = field;
        let mut jobs: Vec<_> = self
            .owners
            .iter_mut()
            .zip(rows.iter_mut())
            .zip(cells)
            .zip(updates.iter_mut())
            .collect();
        let cost = crate::parallel::cost::CELL_PREPARE;
        crate::parallel::for_each(&mut jobs, cost, |_, (((owner, row), cell), update)| {
            **update = refresh(owner, row, cell, c, geography, area);
        });
        drop(jobs);
        let mut changes: Vec<_> = removed
            .iter()
            .map(|(row, carried)| crate::spatial_carriers::Change {
                kind: 0,
                old: (row.as_slice(), *carried),
                new: (&[], [0.; 3]),
            })
            .collect();
        for ((update, row), owner) in updates.iter().zip(rows.iter()).zip(&self.owners) {
            let old = match update {
                Update::Unchanged => {
                    self.reuses += 1;
                    continue;
                }
                Update::Material(carried) => {
                    self.reuses += 1;
                    self.material_updates += 1;
                    (row.as_slice(), *carried)
                }
                Update::Moved(previous, carried) => {
                    self.preparations += 1;
                    (previous.as_slice(), *carried)
                }
            };
            changes.push(crate::spatial_carriers::Change {
                kind: 0,
                old,
                new: (row.as_slice(), owner.carried(area)),
            });
        }
        field.apply_carriers(&changes);
    }

    fn align(
        &mut self,
        cells: &[Cell],
        rows: &mut Vec<Row>,
        removed: &mut Vec<(Row, [f64; 3])>,
        area: f64,
    ) {
        if self.owners.windows(2).all(|p| p[0].id < p[1].id)
            && cells.windows(2).all(|p| p[0].id < p[1].id)
        {
            self.align_ordered(cells, rows, removed, area);
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
        let mut gone: Vec<_> = previous.into_values().collect();
        gone.sort_unstable_by_key(|(owner, _)| owner.id);
        removed.extend(
            gone.into_iter()
                .map(|(owner, row)| (row, owner.carried(area))),
        );
    }

    fn align_ordered(
        &mut self,
        cells: &[Cell],
        rows: &mut Vec<Row>,
        removed: &mut Vec<(Row, [f64; 3])>,
        area: f64,
    ) {
        let owners = std::mem::take(&mut self.owners);
        let previous_rows = std::mem::take(rows);
        self.owners.reserve(cells.len());
        rows.reserve(cells.len());
        let mut previous = owners.into_iter().zip(previous_rows).peekable();
        for cell in cells {
            while previous.peek().is_some_and(|(owner, _)| owner.id < cell.id) {
                let (owner, row) = previous.next().unwrap();
                removed.push((row, owner.carried(area)));
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
        removed.extend(previous.map(|(owner, row)| (row, owner.carried(area))));
    }
}

/// One cell's footprint decision; reads only the frozen field.
fn refresh(
    owner: &mut Owner,
    row: &mut Row,
    cell: &Cell,
    c: &Config,
    field: &Field,
    area: f64,
) -> Update {
    let profile = cell.operators.as_ref().unwrap().profile;
    let radius = cell.radius(c);
    let mass = cell.mass();
    let previous = owner.carried(area);
    let geometric = row.is_empty() || expired(owner, cell, radius, c, field.spacing);
    if !geometric {
        if mass == owner.mass && profile == owner.profile {
            return Update::Unchanged;
        }
        owner.mass = mass;
        owner.profile = profile;
        return Update::Material(previous);
    }
    let old = std::mem::take(row);
    *owner = Owner {
        id: cell.id,
        position: [cell.x, cell.y],
        radius,
        mass,
        profile,
    };
    *row = sites(cell, c, field);
    row.revision = old.revision + 1;
    Update::Moved(old, previous)
}

fn expired(owner: &Owner, cell: &Cell, radius: f64, c: &Config, spacing: f64) -> bool {
    // A bilinear row is 2/h Lipschitz per axis. Averaging the four offsets
    // ±r/sqrt(2) gives ||ΔW||₁ <= 2sqrt(2)/h * (|Δcenter| + |Δr|/2).
    let margin = execution::RESOLUTION * spacing / (2. * std::f64::consts::SQRT_2)
        - (radius - owner.radius).abs() * 0.5;
    margin < 0.
        || crate::movement::distance_squared(owner.position, [cell.x, cell.y], c) > margin * margin
}

#[cfg(test)]
#[path = "footprint_execution_tests.rs"]
mod tests;
