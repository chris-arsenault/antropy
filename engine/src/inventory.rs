//! Own the dense mixture and its material reduction together. Mutable slices are deliberately
//! unavailable: every mutation updates the reduction that body geometry and storage use.
use serde::{Deserialize, Serialize};
use std::ops::Index;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Inventory {
    amounts: Vec<f64>,
    material: f64,
}
impl From<Vec<f64>> for Inventory {
    fn from(amounts: Vec<f64>) -> Self {
        let material = amounts.iter().sum();
        Self { amounts, material }
    }
}
impl FromIterator<f64> for Inventory {
    fn from_iter<T: IntoIterator<Item = f64>>(iter: T) -> Self {
        Vec::from_iter(iter).into()
    }
}
impl Index<usize> for Inventory {
    type Output = f64;
    fn index(&self, i: usize) -> &f64 {
        &self.amounts[i]
    }
}
impl Inventory {
    pub fn iter(&self) -> std::slice::Iter<'_, f64> {
        self.amounts.iter()
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
    pub fn set(&mut self, s: usize, q: f64) {
        self.material += q - self.amounts[s];
        self.amounts[s] = q;
    }
    pub fn fill(&mut self, q: f64) {
        self.amounts.fill(q);
        self.material = q * self.amounts.len() as f64;
    }
    pub fn scale(&mut self, factor: f64) {
        for q in &mut self.amounts {
            *q *= factor;
        }
        self.material *= factor;
    }
    pub fn apply(&mut self, delta: &[f64; 256]) {
        for (q, d) in self.amounts.iter_mut().zip(delta) {
            let next = (*q + d).max(0.);
            self.material += next - *q;
            *q = next;
        }
    }
    pub fn half(&self) -> Self {
        Self {
            amounts: self.amounts.iter().map(|q| q * 0.5).collect(),
            material: self.material * 0.5,
        }
    }
    /// Move a proportional mixture without changing chemical identity.
    pub fn transfer_to(&mut self, other: &mut Self, amount: f64) {
        if amount <= 0. || self.material <= 0. {
            return;
        }
        let amount = amount.min(self.material);
        let fraction = amount / self.material;
        for (donor, recipient) in self.amounts.iter_mut().zip(&mut other.amounts) {
            let moved = *donor * fraction;
            *donor -= moved;
            *recipient += moved;
        }
        self.material -= amount;
        other.material += amount;
    }
    /// Exchange equal amounts from the two frozen mixtures; returned material cannot
    /// supply replacement in the same operation.
    pub fn exchange_with(&mut self, other: &mut Self, amount: f64) {
        let amount = amount.min(self.material).min(other.material);
        if amount <= 0. {
            return;
        }
        let a = amount / self.material;
        let b = amount / other.material;
        for (left, right) in self.amounts.iter_mut().zip(&mut other.amounts) {
            let out = *left * a;
            let back = *right * b;
            *left = (*left - out) + back;
            *right = (*right - back) + out;
        }
    }
    pub fn validate(&self) -> Result<(), String> {
        if self.amounts.len() != 256
            || self.amounts.iter().any(|q| !q.is_finite() || *q < 0.)
            || !self.material.is_finite()
            || (self.material - self.amounts.iter().sum::<f64>()).abs()
                > 1e-10 * (1. + self.material.abs())
        {
            return Err("Invalid intracellular mixture or material reduction".into());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn mutation_operations_preserve_owned_reduction() {
        let mut inventory = Inventory::from(vec![0.01; 256]);
        inventory.set(17, 3.);
        inventory.scale(0.2);
        let mut delta = [0.; 256];
        delta[17] = -0.2;
        delta[3] = 0.2;
        inventory.apply(&delta);
        inventory.validate().unwrap();
        let child = inventory.half();
        child.validate().unwrap();
        assert_eq!(inventory.material(), child.material() * 2.);
        let bytes = postcard::to_stdvec(&inventory).unwrap();
        let restored: Inventory = postcard::from_bytes(&bytes).unwrap();
        assert_eq!(inventory.material(), restored.material());
    }
}
