//! One immutable numerical layout serves both paired execution and borrowed row views.
use super::product_storage::{ProductPool, ProductView};
use crate::config::Config;
use std::{ops::Range, sync::Arc};

#[derive(Clone, Copy, Debug, Default)]
pub(crate) struct Batch {
    pub catalytic: [f64; 2],
    pub changed: [f64; 2],
    pub drop: [f64; 2],
    pub coefficient: [[f64; 2]; 2],
}

#[derive(Clone, Debug)]
pub(crate) struct CompiledRow {
    pub substrate: usize,
    pub products: Range<usize>,
    pub binding: f64,
    pub catalytic: f64,
    pub changed: f64,
    pub work: f64,
    pub heat: f64,
    pub potential_drop: f64,
    pub work_coefficient: [f64; 2],
}

#[derive(Clone, Debug)]
struct Metadata {
    substrate: usize,
    products: Range<usize>,
    binding: f64,
    work: f64,
    heat: f64,
}

#[derive(Clone, Copy, Debug)]
pub struct Conversion<'a> {
    pub substrate: usize,
    pub products: ProductView<'a>,
    pub binding: f64,
    pub catalytic: f64,
    pub changed: f64,
    pub work: f64,
    pub heat: f64,
    pub potential_drop: f64,
    pub work_coefficient: [f64; 2],
}
impl Conversion<'_> {
    pub fn energy(&self, c: &Config, signal: [f64; 2]) -> [f64; 3] {
        let supplied = c.environmental_work
            * crate::transformation_work::engagement(self.work_coefficient, signal);
        crate::transformation_work::cellular(
            self.potential_drop,
            supplied,
            self.changed,
            c.conversion_efficiency,
        )
    }
}

#[derive(Clone, Debug, Default)]
pub struct Conversions {
    batches: Vec<Batch>,
    metadata: Vec<Metadata>,
    products: Arc<ProductPool>,
}
impl Conversions {
    pub(super) fn new(rows: Vec<CompiledRow>, products: Arc<ProductPool>) -> Self {
        let mut out = Self {
            products,
            ..Self::default()
        };
        out.batches.resize(rows.len().div_ceil(2), Batch::default());
        out.metadata = Vec::with_capacity(rows.len());
        for (i, row) in rows.into_iter().enumerate() {
            let batch = &mut out.batches[i / 2];
            let lane = i % 2;
            batch.catalytic[lane] = row.catalytic;
            batch.changed[lane] = row.changed;
            batch.drop[lane] = row.potential_drop;
            for k in 0..2 {
                batch.coefficient[k][lane] = row.work_coefficient[k];
            }
            out.metadata.push(Metadata {
                substrate: row.substrate,
                products: row.products,
                binding: row.binding,
                work: row.work,
                heat: row.heat,
            });
        }
        out
    }
    pub fn len(&self) -> usize {
        self.metadata.len()
    }
    pub fn is_empty(&self) -> bool {
        self.metadata.is_empty()
    }
    /// Product payload only; excludes row metadata and the shared allocation header.
    pub fn product_storage_bytes(&self) -> usize {
        self.products.storage_bytes()
    }
    pub fn product_weight_classes(&self) -> usize {
        self.products.weight_classes()
    }
    pub fn get(&self, row: usize) -> Conversion<'_> {
        let m = &self.metadata[row];
        let b = &self.batches[row / 2];
        let lane = row % 2;
        Conversion {
            substrate: m.substrate,
            products: self.products.view(m.products.clone()),
            binding: m.binding,
            catalytic: b.catalytic[lane],
            changed: b.changed[lane],
            work: m.work,
            heat: m.heat,
            potential_drop: b.drop[lane],
            work_coefficient: b.coefficient.map(|v| v[lane]),
        }
    }
    pub fn iter(&self) -> Iter<'_> {
        Iter {
            rows: self,
            next: 0,
        }
    }
    pub(crate) fn batches(&self) -> &[Batch] {
        &self.batches
    }
}
pub struct Iter<'a> {
    rows: &'a Conversions,
    next: usize,
}
impl<'a> Iterator for Iter<'a> {
    type Item = Conversion<'a>;
    fn next(&mut self) -> Option<Self::Item> {
        if self.next == self.rows.len() {
            return None;
        }
        let row = self.rows.get(self.next);
        self.next += 1;
        Some(row)
    }
    fn size_hint(&self) -> (usize, Option<usize>) {
        let n = self.rows.len() - self.next;
        (n, Some(n))
    }
}
impl ExactSizeIterator for Iter<'_> {}
impl<'a> IntoIterator for &'a Conversions {
    type Item = Conversion<'a>;
    type IntoIter = Iter<'a>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}
