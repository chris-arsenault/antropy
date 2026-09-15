//! Shared physical functional. Biological event funding is integrated in M3/M4.
use crate::{chemistry::Chemistry, config::Config, organism::Cell};
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct SpatialLaw {
    pub coupling: f64,
    pub crowding: f64,
    pub range: f64,
    pub contact: f64,
}
impl Default for SpatialLaw {
    fn default() -> Self {
        Self {
            coupling: 1.,
            crowding: 0.4,
            range: 4.,
            contact: 10.,
        }
    }
}
impl SpatialLaw {
    pub fn validate(&self) -> Result<(), String> {
        if [self.coupling, self.crowding, self.contact]
            .iter()
            .any(|v| !v.is_finite() || *v < 0.)
            || !self.range.is_finite()
            || self.range <= 0.
            || (self.coupling > 0. && self.crowding == 0.)
        {
            return Err("Invalid spatial law: attraction requires positive crowding".into());
        }
        Ok(())
    }
    pub fn metric(&self, a: [f64; 2], b: [f64; 2]) -> f64 {
        self.coupling * (-a[0] * b[0] + a[1] * b[1])
    }
}

#[derive(Clone, Copy, Debug, Default, Serialize, Deserialize)]
pub struct Sum {
    value: f64,
    correction: f64,
}
impl Sum {
    pub fn add(&mut self, x: f64) {
        let next = self.value + x;
        self.correction += if self.value.abs() >= x.abs() {
            (self.value - next) + x
        } else {
            (x - next) + self.value
        };
        self.value = next;
    }
    pub fn get(self) -> f64 {
        self.value + self.correction
    }
}

#[derive(Clone, Copy, Debug, Default, Serialize, Deserialize)]
pub struct Energy {
    pub material: f64,
    pub physical: f64,
    pub free: f64,
    pub work: f64,
}
impl Energy {
    pub fn total_free(self) -> f64 {
        self.free + self.work
    }
    pub fn total_energy(self) -> f64 {
        self.physical + self.work
    }
    pub fn add(&mut self, other: Self) {
        self.material += other.material;
        self.physical += other.physical;
        self.free += other.free;
        self.work += other.work;
    }
    pub fn stored(&mut self, energy: f64) {
        self.physical += energy;
        self.free += energy;
    }
}

pub fn ideal(amount: f64, area: f64) -> f64 {
    if amount == 0. {
        0.
    } else {
        amount * (crate::spatial_numeric::log_positive(amount / area) - 1.)
    }
}

pub fn mixture(values: impl Iterator<Item = (f64, f64)>, area: f64, gamma: f64) -> Energy {
    let (mut n, mut u, mut ideal_sum) = (Sum::default(), Sum::default(), Sum::default());
    for (amount, potential) in values {
        n.add(amount);
        u.add(amount * potential);
        ideal_sum.add(ideal(amount, area));
    }
    let material = n.get();
    let physical = u.get() + gamma * material.powi(3) / (3. * area * area);
    Energy {
        material,
        physical,
        free: physical + ideal_sum.get(),
        work: 0.,
    }
}

pub fn internal(cell: &Cell, chemistry: &Chemistry, config: &Config, gamma: f64) -> Energy {
    let mut e = mixture(
        cell.inventory
            .iter()
            .zip(&chemistry.properties)
            .map(|(n, p)| (*n, p.potential)),
        cell.volume(config),
        gamma,
    );
    let built = cell.mass();
    e.material += built;
    e.stored(built * chemistry.properties[chemistry.decomposition].potential);
    e.work = cell.energy;
    e
}

/// Chemical derivative of internal reference, ideal and crowding terms at variable area.
/// The spatial owner adds profile and disk-extent derivatives from the same discrete energy.
pub fn internal_local_mu(
    cell: &Cell,
    s: usize,
    chemistry: &Chemistry,
    c: &Config,
    gamma: f64,
) -> f64 {
    let (n, area) = (cell.material(), cell.volume(c));
    chemistry.properties[s].potential + (cell.inventory[s] / area).ln()
        - n / (area * c.inventory_density)
        + gamma * (n / area).powi(2)
        - 2. * gamma * n.powi(3) / (3. * area.powi(3) * c.inventory_density)
}

/// Accepted spatial events only; this does not certify legacy biological energy closure.
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpatialLedger {
    pub bath: Sum,
    pub dissipation: Sum,
    pub boundary_work: Sum,
    pub carried_energy: Sum,
    pub carried_material: Sum,
    pub numerical_material: Sum,
    pub numerical_energy: Sum,
    pub numerical_free: Sum,
    pub accepted: u64,
    pub rejected: u64,
}
impl SpatialLedger {
    pub fn closed(&mut self, before: Energy, after: Energy) {
        self.bath.add(before.total_energy() - after.total_energy());
        self.dissipation
            .add(before.total_free() - after.total_free());
        self.accepted += 1;
    }
    pub fn boundary(&mut self, before: Energy, after: Energy, carried: f64) {
        let work = after.total_free() - before.total_free() - carried;
        self.boundary_work.add(work);
        self.carried_energy.add(carried);
        self.carried_material.add(after.material - before.material);
        self.bath
            .add(carried + work - (after.total_energy() - before.total_energy()));
    }
    pub fn rounding(&mut self, exact: Energy, stored: Energy, material_loss: f64) {
        self.numerical_material.add(material_loss);
        self.numerical_energy
            .add(exact.total_energy() - stored.total_energy());
        self.numerical_free
            .add(exact.total_free() - stored.total_free());
    }
}
