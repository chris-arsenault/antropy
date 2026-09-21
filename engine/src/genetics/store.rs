//! One dense genotype owner; ID addressing is independent of population order.
use super::Genotype;
use serde::{Deserialize, Deserializer, Serialize, Serializer, ser::SerializeMap};
use std::{collections::BTreeMap, ops::Index};

mod slots;

#[derive(Clone, Debug, Default)]
pub struct GenotypeStore {
    dense: Vec<Genotype>,
    ids: Vec<u64>,
    slots: slots::Slots,
}

impl GenotypeStore {
    pub fn len(&self) -> usize {
        self.dense.len()
    }
    pub fn is_empty(&self) -> bool {
        self.dense.is_empty()
    }
    pub fn get(&self, id: &u64) -> Option<&Genotype> {
        self.slots.get(*id).map(|slot| &self.dense[slot])
    }
    pub fn get_mut(&mut self, id: &u64) -> Option<&mut Genotype> {
        self.slots.get(*id).map(|slot| &mut self.dense[slot])
    }
    pub fn contains_key(&self, id: &u64) -> bool {
        self.slots.get(*id).is_some()
    }
    pub fn insert(&mut self, id: u64, genotype: Genotype) -> Option<Genotype> {
        if let Some(slot) = self.slots.get(id) {
            return Some(std::mem::replace(&mut self.dense[slot], genotype));
        }
        self.slots.insert(id, self.dense.len());
        self.ids.push(id);
        self.dense.push(genotype);
        None
    }
    pub fn remove(&mut self, id: &u64) -> Option<Genotype> {
        let slot = self.slots.remove(*id)?;
        self.ids.swap_remove(slot);
        let removed = self.dense.swap_remove(slot);
        if slot < self.dense.len() {
            self.slots.insert(self.ids[slot], slot);
        }
        Some(removed)
    }
    pub fn retain(&mut self, mut keep: impl FnMut(&u64, &mut Genotype) -> bool) {
        let mut slot = 0;
        while slot < self.dense.len() {
            let id = self.ids[slot];
            if keep(&id, &mut self.dense[slot]) {
                slot += 1;
            } else {
                self.remove(&id);
            }
        }
    }
    pub fn clear(&mut self) {
        self.dense.clear();
        self.ids.clear();
        self.slots = Default::default();
    }
    pub fn values(&self) -> std::slice::Iter<'_, Genotype> {
        self.dense.iter()
    }
    pub fn values_mut(&mut self) -> std::slice::IterMut<'_, Genotype> {
        self.dense.iter_mut()
    }
    /// Dense ownership order. Sort explicitly at an order-sensitive observation boundary.
    pub fn keys(&self) -> std::slice::Iter<'_, u64> {
        self.ids.iter()
    }
    pub fn iter(&self) -> Iter<'_> {
        self.ids.iter().zip(self.dense.iter())
    }
}

pub type Iter<'a> = std::iter::Zip<std::slice::Iter<'a, u64>, std::slice::Iter<'a, Genotype>>;

impl<'a> IntoIterator for &'a GenotypeStore {
    type Item = (&'a u64, &'a Genotype);
    type IntoIter = Iter<'a>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}
impl Index<&u64> for GenotypeStore {
    type Output = Genotype;
    fn index(&self, id: &u64) -> &Self::Output {
        self.get(id).expect("Missing genotype")
    }
}
impl FromIterator<(u64, Genotype)> for GenotypeStore {
    fn from_iter<T: IntoIterator<Item = (u64, Genotype)>>(values: T) -> Self {
        let mut result = Self::default();
        for (id, genotype) in values {
            result.insert(id, genotype);
        }
        result
    }
}
impl Serialize for GenotypeStore {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut entries: Vec<_> = self.iter().collect();
        entries.sort_unstable_by_key(|(id, _)| **id);
        let mut map = serializer.serialize_map(Some(entries.len()))?;
        for (id, genotype) in entries {
            map.serialize_entry(id, genotype)?;
        }
        map.end()
    }
}
impl<'de> Deserialize<'de> for GenotypeStore {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        // A cold map preserves the checkpoint shape. Values move into the sole live owner.
        Ok(BTreeMap::<u64, Genotype>::deserialize(deserializer)?
            .into_iter()
            .collect())
    }
}

#[cfg(test)]
mod tests;
