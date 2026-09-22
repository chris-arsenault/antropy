//! Commit exchange and reservoir rows through the material owner's region-parallel batch.
use super::*;

/// One reservoir release: weighted footprint, mixture shares and released amount.
pub type Release<'a> = (&'a [(usize, f64)], &'a [f64], f64);

impl Field {
    /// Only requested chemical groups change; requested groups are cleared afterwards.
    pub fn apply_rows(
        &mut self,
        changes: &mut [f64],
        nodes: &[(usize, u64)],
        chemistry: &Chemistry,
    ) -> [f64; 2] {
        let rows = self.projection_rows(chemistry);
        let requested: &[f64] = changes;
        let batch = self.amounts.commit_batch(
            nodes,
            |i, row| {
                for s in crate::field_activity::pairs(nodes[i].1) {
                    row[s..s + 2].copy_from_slice(&requested[i * SPECIES + s..i * SPECIES + s + 2]);
                }
            },
            &rows,
        );
        crate::parallel::for_each(
            &mut changes.chunks_mut(SPECIES).collect::<Vec<_>>(),
            crate::parallel::cost::ROW_CLEAR,
            |i, row| {
                for s in crate::field_activity::pairs(nodes[i].1) {
                    row[s..s + 2].fill(0.);
                }
            },
        );
        self.record_batch(batch)
    }

    /// Several mixtures spread over weighted footprints; one row commit per footprint node.
    /// `releases` holds (footprint, mixture, amount) for each releasing reservoir.
    pub fn release_mixtures(
        &mut self,
        releases: &[Release<'_>],
        chemistry: &Chemistry,
    ) -> [f64; 2] {
        let mut entries = Vec::new();
        let mut owners = Vec::new();
        for (k, &(footprint, mixture, amount)) in releases.iter().enumerate() {
            let mut mask = 0_u64;
            for (s, &share) in mixture.iter().enumerate() {
                if amount * share > 0. {
                    mask |= 1 << (s / 4);
                }
            }
            if mask == 0 {
                continue;
            }
            for &(node, w) in footprint {
                entries.push((node, mask));
                owners.push((k, w));
            }
        }
        let rows = self.projection_rows(chemistry);
        let batch = self.amounts.commit_batch(
            &entries,
            |i, row| {
                let (k, w) = owners[i];
                let (_, mixture, amount) = releases[k];
                for s in crate::field_activity::GroupLanes::<1>::new(entries[i].1) {
                    let q = amount * mixture[s];
                    row[s] = if q > 0. { q * w } else { 0. };
                }
            },
            &rows,
        );
        self.record_batch(batch)
    }

    fn record_batch(&mut self, batch: crate::spatial_material::Batch) -> [f64; 2] {
        self.totals[0] += batch.reduction[0];
        self.totals[1] += batch.reduction[1];
        for r in batch.changed {
            self.signal_changes.insert(r);
        }
        batch.loss
    }
}
