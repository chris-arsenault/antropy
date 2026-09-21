//! Merged product destinations share one table of exact component-subset weights.
use crate::chemical_products::{ProductWeight, Transform};
use std::ops::Range;

#[derive(Clone, Copy, Debug)]
struct Entry {
    species: u8,
    weight: u8,
}

#[derive(Clone, Debug, Default)]
pub(super) struct ProductPool {
    entries: Box<[Entry]>,
    weights: Box<[f64]>,
}
impl ProductPool {
    pub(super) fn compile(
        transform: &Transform,
        substrates: impl IntoIterator<Item = usize>,
    ) -> (Self, Vec<Range<usize>>) {
        let components = transform.components();
        assert!(components.len() <= 8);
        let mut classes = [None; 256];
        let mut weights = Vec::new();
        let mut entries = Vec::new();
        let mut ranges = Vec::new();
        for substrate in substrates {
            let mut row = [(0_u8, 0_u8); 8];
            let mut count = 0;
            for (k, component) in components.iter().enumerate() {
                let destination = component.action.apply(substrate) as u8;
                if let Some((_, mask)) = row[..count].iter_mut().find(|(s, _)| *s == destination) {
                    *mask |= 1 << k;
                } else {
                    row[count] = (destination, 1 << k);
                    count += 1;
                }
            }
            row[..count].sort_unstable_by_key(|&(s, _)| s);
            let start = entries.len();
            for &(species, mask) in &row[..count] {
                let weight = *classes[mask as usize].get_or_insert_with(|| {
                    let index = weights.len() as u8;
                    let value = components
                        .iter()
                        .enumerate()
                        .filter(|(k, _)| mask & (1 << k) != 0)
                        .map(|(_, c)| c.weight)
                        .reduce(|a, b| a + b)
                        .unwrap();
                    weights.push(value);
                    index
                });
                entries.push(Entry { species, weight });
            }
            ranges.push(start..entries.len());
        }
        (
            Self {
                entries: entries.into(),
                weights: weights.into(),
            },
            ranges,
        )
    }
    pub(super) fn view(&self, range: Range<usize>) -> ProductView<'_> {
        ProductView {
            entries: &self.entries[range],
            weights: &self.weights,
        }
    }
    pub(super) fn storage_bytes(&self) -> usize {
        std::mem::size_of_val(&*self.entries) + std::mem::size_of_val(&*self.weights)
    }
    pub(super) fn weight_classes(&self) -> usize {
        self.weights.len()
    }
    #[cfg(test)]
    pub(super) fn from_products(rows: &[Vec<ProductWeight>]) -> (Self, Vec<Range<usize>>) {
        let mut entries = Vec::new();
        let mut weights = Vec::<f64>::new();
        let mut ranges = Vec::new();
        for row in rows {
            let start = entries.len();
            for product in row {
                let weight = weights
                    .iter()
                    .position(|w| w.to_bits() == product.weight.to_bits())
                    .unwrap_or_else(|| {
                        weights.push(product.weight);
                        weights.len() - 1
                    });
                assert!(weight < 256 && product.species < 256);
                entries.push(Entry {
                    species: product.species as u8,
                    weight: weight as u8,
                });
            }
            ranges.push(start..entries.len());
        }
        (
            Self {
                entries: entries.into(),
                weights: weights.into(),
            },
            ranges,
        )
    }
}

#[derive(Clone, Copy, Debug)]
pub struct ProductView<'a> {
    entries: &'a [Entry],
    weights: &'a [f64],
}
impl<'a> ProductView<'a> {
    pub fn len(&self) -> usize {
        self.entries.len()
    }
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
    pub fn get(&self, index: usize) -> ProductWeight {
        let entry = self.entries[index];
        ProductWeight {
            species: entry.species as usize,
            weight: self.weights[entry.weight as usize],
        }
    }
    pub fn iter(&self) -> Iter<'a> {
        Iter {
            entries: self.entries.iter(),
            weights: self.weights,
        }
    }
}
pub struct Iter<'a> {
    entries: std::slice::Iter<'a, Entry>,
    weights: &'a [f64],
}
impl Iterator for Iter<'_> {
    type Item = ProductWeight;
    fn next(&mut self) -> Option<Self::Item> {
        self.entries.next().map(|entry| ProductWeight {
            species: entry.species as usize,
            weight: self.weights[entry.weight as usize],
        })
    }
    fn size_hint(&self) -> (usize, Option<usize>) {
        self.entries.size_hint()
    }
}
impl ExactSizeIterator for Iter<'_> {}
impl<'a> IntoIterator for &ProductView<'a> {
    type Item = ProductWeight;
    type IntoIter = Iter<'a>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}
impl PartialEq<Vec<ProductWeight>> for ProductView<'_> {
    fn eq(&self, other: &Vec<ProductWeight>) -> bool {
        self.iter().eq(other.iter().copied())
    }
}
impl PartialEq for ProductView<'_> {
    fn eq(&self, other: &Self) -> bool {
        self.iter().eq(other.iter())
    }
}

#[cfg(test)]
#[path = "reaction_product_tests.rs"]
mod tests;
