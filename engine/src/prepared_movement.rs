//! Held local constitutive and contact operators; physical time and work always advance.
use crate::{config::Config, execution, field::Field, footprint::Row, organism::Cell};
use std::collections::HashMap;
#[path = "prepared_medium.rs"]
mod medium;

#[derive(Clone, Debug, Default)]
struct Coefficients {
    position: [f64; 2],
    physical: [f64; 7],
    medium_revision: u64,
    footprint_revision: u64,
    speed: f64,
    passive: [f64; 2],
}
#[derive(Clone, Debug, Default)]
pub(crate) struct Motion {
    ids: Vec<u64>,
    coefficients: Vec<Coefficients>,
    medium: medium::Medium,
    configuration: Option<[f64; 9]>,
    pub preparations: u64,
    pub contact_preparations: u64,
}
fn physical(cell: &Cell, c: &Config) -> [f64; 7] {
    let profile = cell.operators.as_ref().unwrap().profile;
    [
        cell.radius(c),
        cell.body[1],
        cell.damage,
        cell.mass(),
        profile[0],
        profile[1],
        profile[2],
    ]
}
impl Motion {
    pub fn prepare(&mut self, cells: &[Cell], c: &Config, field: &Field) {
        let configuration = [
            c.width,
            c.height,
            c.mesh,
            c.viscosity,
            c.motor_power_density,
            c.motor_efficiency,
            c.pressure_strength,
            c.movement_impedance,
            field.drift,
        ];
        if self.configuration != Some(configuration) {
            self.ids.clear();
            self.coefficients.clear();
            self.configuration = Some(configuration);
        }
        if !self
            .ids
            .iter()
            .copied()
            .eq(cells.iter().map(|cell| cell.id))
        {
            let ordered = self.ids.is_sorted() && cells.is_sorted_by_key(|cell| cell.id);
            let previous = std::mem::take(&mut self.coefficients);
            let ids = std::mem::take(&mut self.ids);
            if ordered {
                // Ascending ids merge in one pass: births append and deaths only remove.
                let mut old = ids.into_iter().zip(previous).peekable();
                for cell in cells {
                    while old.next_if(|(id, _)| *id < cell.id).is_some() {}
                    let kept = old.next_if(|(id, _)| *id == cell.id).map(|(_, c)| c);
                    self.ids.push(cell.id);
                    self.coefficients.push(kept.unwrap_or_default());
                }
            } else {
                let mut previous: HashMap<_, _> = ids.into_iter().zip(previous).collect();
                for cell in cells {
                    self.ids.push(cell.id);
                    self.coefficients
                        .push(previous.remove(&cell.id).unwrap_or_default());
                }
            }
        }
        self.medium.prepare(field, c);
    }
    pub fn advance(&mut self, cells: &mut [Cell], c: &Config, field: &Field, sites: &[Row]) {
        self.prepare_all(cells, c, field, sites);
        for (i, cell) in cells.iter_mut().enumerate() {
            self.advance_prepared(i, cell, c);
        }
    }
    /// Refreshes shared footprint dependencies by region, then each cell's coefficients.
    pub(crate) fn prepare_all(&mut self, cells: &[Cell], c: &Config, field: &Field, sites: &[Row]) {
        self.prepare(cells, c, field);
        self.medium.evaluate(sites, field, c);
        let medium = &self.medium;
        let mut jobs: Vec<_> = self.coefficients.iter_mut().zip(cells).zip(sites).collect();
        let prepared = std::sync::atomic::AtomicU64::new(0);
        let cost = crate::parallel::cost::CELL_PREPARE;
        crate::parallel::for_each(&mut jobs, cost, |_, ((coefficients, cell), row)| {
            if Self::prepare_one(coefficients, cell, c, field, row, medium) {
                prepared.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
            }
        });
        self.preparations += prepared.into_inner();
    }
    fn prepare_one(
        coefficients: &mut Coefficients,
        cell: &Cell,
        c: &Config,
        field: &Field,
        row: &Row,
        medium: &medium::Medium,
    ) -> bool {
        let current = physical(cell, c);
        let revision = medium.revision(row, field);
        let moved = super::distance([cell.x, cell.y], coefficients.position, c)
            > execution::RESOLUTION * c.mesh;
        let changed = current
            .iter()
            .zip(coefficients.physical)
            .enumerate()
            .any(|(k, (&a, b))| {
                execution::changed(a, b, if k >= 2 && k != 3 { 1. } else { 0. })
                    || (a == 0.) != (b == 0.)
            });
        if revision != coefficients.medium_revision
            || row.revision() != coefficients.footprint_revision
            || moved
            || changed
        {
            let gradient = medium.gradient(row);
            Self::prepare_cell(coefficients, cell, c, field, row, gradient);
            coefficients.physical = current;
            coefficients.medium_revision = revision;
            coefficients.footprint_revision = row.revision();
            return true;
        }
        false
    }
    pub(crate) fn advance_prepared(&self, i: usize, cell: &mut Cell, c: &Config) {
        Self::advance_cell(&self.coefficients[i], cell, c);
    }
    fn prepare_cell(
        coefficients: &mut Coefficients,
        cell: &Cell,
        c: &Config,
        field: &Field,
        row: &Row,
        gradient: [[f64; 3]; 2],
    ) {
        let mobility = super::mobility(field.medium_load(row), c.movement_impedance);
        coefficients.speed = super::motor_limits(cell, c, mobility).0;
        let profile = cell.operators.as_ref().unwrap().profile;
        let self_load =
            crate::medium_response::self_load(cell.mass() * profile[2], field.spacing.powi(2), row);
        coefficients.passive = super::passive(
            profile,
            gradient,
            c.pressure_strength * (field.pressure_load(row) - self_load).max(0.),
            mobility,
            field.drift,
        );
        coefficients.position = [cell.x, cell.y];
    }
    fn advance_cell(coefficients: &Coefficients, cell: &mut Cell, c: &Config) {
        let cost = super::motor_work_rate(
            &cell.body,
            cell.damage,
            cell.action.swim,
            cell.action.turn,
            c,
        ) * c.dt;
        let paid = cell.pay(cost);
        cell.flows.motors += paid;
        let fraction = if cost > 0. { (paid / cost).sqrt() } else { 0. };
        let speed = coefficients.speed;
        cell.heading = (cell.heading
            + cell.action.turn * speed / (2. * cell.radius(c).max(0.01)) * c.dt * fraction)
            .rem_euclid(std::f64::consts::TAU);
        let swimming = speed * cell.action.swim * fraction;
        let (sin, cos) = cell.heading.sin_cos();
        let dx = (swimming * cos + coefficients.passive[0]) * c.dt;
        let dy = (swimming * sin + coefficients.passive[1]) * c.dt;
        cell.x = (cell.x + dx).rem_euclid(c.width);
        cell.y = (cell.y + dy).rem_euclid(c.height);
        cell.flows.distance += dx.hypot(dy);
    }
    pub fn contacts(
        &mut self,
        cells: &mut [Cell],
        c: &Config,
        local: &mut super::geometry::prepared::Local,
    ) {
        let rows = local.pressure_at(c.dt);
        for (cell, row) in cells.iter_mut().zip(rows) {
            self.contact_one(cell, c, row);
        }
    }
    pub(crate) fn contact_one(
        &mut self,
        cell: &mut Cell,
        c: &Config,
        row: &super::geometry::prepared::pressure::Row,
    ) {
        self.contact_preparations += 1;
        cell.contacts = row.contacts();
        cell.x = (cell.x + row.shift[0] * c.dt).rem_euclid(c.width);
        cell.y = (cell.y + row.shift[1] * c.dt).rem_euclid(c.height);
    }
}
