//! Own the dense mixture and its material reduction together. Mutable slices are deliberately
//! unavailable: every mutation updates the reduction that body geometry and storage use.
use crate::chemistry::{Chemistry, Properties, PropertyTable};
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

#[derive(Clone, Copy, Debug, Default)]
pub struct Projection {
    pub potential: f64,
    pub stress: f64,
    pub interaction: [f64; 2],
}
impl Projection {
    fn add(&mut self, q: f64, p: &Properties) {
        self.potential += q * p.potential;
        self.stress += q * p.stress;
        self.interaction[0] += q * p.interaction[0];
        self.interaction[1] += q * p.interaction[1];
    }
    fn scaled(self, factor: f64) -> Self {
        Self {
            potential: self.potential * factor,
            stress: self.stress * factor,
            interaction: self.interaction.map(|q| q * factor),
        }
    }
    fn accumulate(&mut self, other: Self) {
        self.potential += other.potential;
        self.stress += other.stress;
        self.interaction[0] += other.interaction[0];
        self.interaction[1] += other.interaction[1];
    }
}

#[derive(Clone, Debug)]
struct CachedProjection {
    properties: PropertyTable,
    value: Projection,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Inventory {
    amounts: Vec<f64>,
    material: f64,
    #[serde(skip)]
    projection: OnceLock<CachedProjection>,
}
impl From<Vec<f64>> for Inventory {
    fn from(amounts: Vec<f64>) -> Self {
        let material = amounts.iter().sum();
        Self {
            amounts,
            material,
            projection: OnceLock::default(),
        }
    }
}
impl FromIterator<f64> for Inventory {
    fn from_iter<T: IntoIterator<Item = f64>>(iter: T) -> Self {
        Vec::from_iter(iter).into()
    }
}
impl Inventory {
    pub fn value(&self, s: usize) -> f64 {
        self.amounts[s]
    }
    pub fn iter(&self) -> impl ExactSizeIterator<Item = f64> + DoubleEndedIterator + '_ {
        self.amounts.iter().copied()
    }
    pub fn len(&self) -> usize {
        self.amounts.len()
    }
    pub fn is_empty(&self) -> bool {
        self.amounts.is_empty()
    }
    pub fn material(&self) -> f64 {
        self.material
    }
    /// Derived sums retain their immutable definition. A chemistry edit detaches its
    /// table, so even same-seed diagnostic changes cannot reuse stale projections.
    pub fn projection(&self, chemistry: &Chemistry) -> Projection {
        if let Some(cache) = self.projection.get()
            && cache.properties.same_definition(&chemistry.properties)
        {
            return cache.value;
        }
        let mut value = Projection::default();
        for (q, p) in self.amounts.iter().zip(&chemistry.properties) {
            value.add(*q, p);
        }
        let _ = self.projection.set(CachedProjection {
            properties: chemistry.properties.clone(),
            value,
        });
        value
    }
    pub fn set(&mut self, s: usize, q: f64) {
        let delta = q - self.value(s);
        if delta == 0. {
            return;
        }
        self.material += delta;
        if let Some(cache) = self.projection.get_mut() {
            cache.value.add(delta, &cache.properties[s]);
        }
        self.amounts[s] = q;
    }
    pub fn fill(&mut self, q: f64) {
        self.amounts.fill(q);
        self.material = q * self.amounts.len() as f64;
        self.projection.take();
    }
    pub fn scale(&mut self, factor: f64) {
        for q in &mut self.amounts {
            *q *= factor;
        }
        self.material *= factor;
        if let Some(cache) = self.projection.get_mut() {
            cache.value = cache.value.scaled(factor);
        }
    }
    pub fn apply(&mut self, delta: &[f64; 256]) {
        let mut cache = self.projection.get_mut();
        for (s, (q, d)) in self.amounts.iter_mut().zip(delta).enumerate() {
            let next = (*q + d).max(0.);
            if next == *q {
                continue;
            }
            self.material += next - *q;
            if let Some(cache) = cache.as_mut() {
                cache.value.add(next - *q, &cache.properties[s]);
            }
            *q = next;
        }
    }
    /// Commit accepted component changes without allocating or scanning absent species.
    pub fn apply_sparse(&mut self, delta: impl IntoIterator<Item = (usize, f64)>) {
        let mut cache = self.projection.get_mut();
        for (s, d) in delta {
            let q = &mut self.amounts[s];
            let next = (*q + d).max(0.);
            if next == *q {
                continue;
            }
            self.material += next - *q;
            if let Some(cache) = cache.as_mut() {
                cache.value.add(next - *q, &cache.properties[s]);
            }
            *q = next;
        }
    }
    pub fn half(&self) -> Self {
        let mut result = Self::from(self.iter().map(|q| q * 0.5).collect::<Vec<_>>());
        result.material = self.material() * 0.5;
        if let Some(mut cache) = self.projection.get().cloned() {
            cache.value = cache.value.scaled(0.5);
            let _ = result.projection.set(cache);
        }
        result
    }
    /// Move a proportional mixture without changing chemical identity.
    pub fn transfer_to(&mut self, other: &mut Self, amount: f64) {
        if amount <= 0. || self.material() <= 0. {
            return;
        }
        let amount = amount.min(self.material);
        let fraction = amount / self.material;
        for s in 0..self.amounts.len() {
            let donor = self.amounts[s];
            let recipient = other.amounts[s];
            let moved = donor * fraction;
            self.amounts[s] = donor - moved;
            other.amounts[s] = recipient + moved;
        }
        self.material -= amount;
        other.material += amount;
        let mut donor = self.projection.get_mut();
        let mut recipient = other.projection.get_mut();
        match (donor.as_mut(), recipient.as_mut()) {
            (Some(left), Some(right)) if left.properties.same_definition(&right.properties) => {
                right.value.accumulate(left.value.scaled(fraction));
            }
            _ => {
                other.projection.take();
            }
        }
        if let Some(cache) = donor {
            cache.value = cache.value.scaled(1. - fraction);
        }
    }
    /// Exchange equal amounts from the two frozen mixtures; returned material cannot
    /// supply replacement in the same operation.
    pub fn exchange_with(&mut self, other: &mut Self, amount: f64) {
        let amount = amount.min(self.material()).min(other.material());
        if amount <= 0. {
            return;
        }
        let a = amount / self.material;
        let b = amount / other.material;
        for s in 0..self.amounts.len() {
            let left = self.amounts[s];
            let right = other.amounts[s];
            let out = left * a;
            let back = right * b;
            self.amounts[s] = (left - out) + back;
            other.amounts[s] = (right - back) + out;
        }
        let mut left = self.projection.get_mut();
        let mut right = other.projection.get_mut();
        match (left.as_mut(), right.as_mut()) {
            (Some(l), Some(r)) if l.properties.same_definition(&r.properties) => {
                let out = l.value.scaled(a);
                let back = r.value.scaled(b);
                l.value = l.value.scaled(1. - a);
                l.value.accumulate(back);
                r.value = r.value.scaled(1. - b);
                r.value.accumulate(out);
            }
            _ => {
                self.projection.take();
                other.projection.take();
            }
        }
    }
    pub fn validate(&self) -> Result<(), String> {
        if self.amounts.len() != 256
            || self.iter().any(|q| !q.is_finite() || q < 0.)
            || !self.material().is_finite()
            || (self.material() - self.iter().sum::<f64>()).abs()
                > 1e-10 * (1. + self.material().abs())
        {
            return Err("Invalid intracellular mixture or material reduction".into());
        }
        Ok(())
    }
}

#[cfg(test)]
#[path = "inventory_tests.rs"]
mod tests;
