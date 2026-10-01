//! Local recipient lookup and one chemical aggregate per receiving source.
use crate::{ancestry::Cause, organism::Cell, world::World};
use std::collections::BTreeMap;

#[derive(Clone, Debug, Default)]
pub struct Recipients {
    members: crate::spatial_members::Members,
    entries: Vec<(usize, usize, f64)>,
}
impl Recipients {
    fn prepare(&mut self, w: &World) {
        self.entries.clear();
        for (source, s) in w.sources.iter().enumerate() {
            self.entries
                .extend(s.footprint.iter().map(|&(n, weight)| (n, source, weight)));
        }
        self.entries.sort_unstable_by_key(|&(n, s, _)| (n, s));
        self.members
            .rebuild(w.field.amounts().geometry(), self.entries.len(), |k| {
                (self.entries[k].0, k)
            });
    }
    fn weights(&self, row: &[(usize, f64)]) -> BTreeMap<usize, f64> {
        let mut weights = BTreeMap::new();
        for &(node, cell_weight) in row {
            for &entry in self.members.indices(node) {
                let (_, source, source_weight) = self.entries[entry];
                *weights.entry(source).or_default() += cell_weight * source_weight;
            }
        }
        let total: f64 = weights.values().sum();
        for weight in weights.values_mut() {
            *weight /= total;
        }
        weights
    }
}

pub fn batch(w: &mut World, mut deaths: Vec<(Cell, Cause)>, reference: f64) {
    if deaths.is_empty() {
        return;
    }
    deaths.sort_unstable_by_key(|(cell, _)| cell.id);
    let amount = deaths.iter().map(|(cell, _)| cell.mass()).sum();
    let fraction = w.mortality.deaths(amount, reference, &w.config);
    let mut recipients = std::mem::take(&mut w.recovery_recipients);
    if fraction > 0. {
        recipients.prepare(w);
    }
    let mut incoming = BTreeMap::<usize, Vec<f64>>::new();
    for (cell, cause) in deaths {
        let row = crate::footprint::sites(&cell, &w.config, &w.field);
        let weights = if fraction > 0. {
            recipients.weights(&row)
        } else {
            BTreeMap::new()
        };
        let recovered = if weights.is_empty() { 0. } else { fraction };
        for (source, weight) in weights {
            let vector = incoming.entry(source).or_insert_with(|| vec![0.; 256]);
            for (s, q) in vector.iter_mut().enumerate() {
                *q += cell.bound_material.value(s) * recovered * weight;
            }
        }
        w.mortality.recovered += cell.mass() * recovered;
        w.mortality.spill += cell.material() + cell.mass() * (1. - recovered);
        crate::lifecycle::release_fraction(w, &cell, cause, 1. - recovered);
    }
    for (source, vector) in incoming {
        let q = w.sources[source].admit(&vector);
        w.sources[source].recent_recovery += q;
        w.sources[source].refresh_material(&w.chemistry);
    }
    w.recovery_recipients = recipients;
    crate::source_medium::project_current(w);
    w.mortality.living = w.cells.iter().map(|c| c.mass()).sum();
}

/// Declared research mortality, unlike an ordinary explicit removal/replacement.
pub fn assay(w: &mut World, ids: &[u64]) -> Result<(), String> {
    if ids.is_empty()
        || ids.len() > w.cells.len()
        || ids
            .iter()
            .enumerate()
            .any(|(i, id)| ids[..i].contains(id) || !w.cells.iter().any(|c| c.id == *id))
    {
        return Err("Mortality assay requires distinct living cells".into());
    }
    let reference = w.cells.iter().map(|c| c.mass()).sum();
    let mut dead = vec![];
    let cells = std::mem::take(&mut w.cells);
    for cell in cells {
        if ids.contains(&cell.id) {
            dead.push((cell, Cause::ConstructedDeath));
        } else {
            w.cells.push(cell);
        }
    }
    batch(w, dead, reference);
    Ok(())
}
