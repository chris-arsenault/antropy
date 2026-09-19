//! Commit compact cell exchange rows into the sole material owner.
use super::*;

impl Field {
    /// Only requested chemical groups need changes and incremental reductions.
    pub fn apply_rows(
        &mut self,
        changes: &mut [f64],
        nodes: &[(usize, u64)],
        chemistry: &Chemistry,
    ) -> [f64; 2] {
        let mut rounding = [0.; 2];
        let area = self.spacing * self.spacing;
        let rows = crate::chemical_projection::Rows::new(chemistry);
        for (slot, &(node, mask)) in nodes.iter().enumerate() {
            let range = node * SPECIES..(node + 1) * SPECIES;
            let (reduction, loss) = crate::chemical_projection::commit(
                &mut self.amounts[range],
                &mut changes[slot * SPECIES..(slot + 1) * SPECIES],
                &rows,
                mask,
            );
            let mut occupied = self.activity.masks[node] & !mask;
            for s in crate::field_activity::pairs(mask) {
                if self.amounts[node * SPECIES + s..node * SPECIES + s + 2]
                    .iter()
                    .any(|q| *q > 0.)
                {
                    occupied |= 1 << (s / 4);
                }
            }
            self.activity.set(node, occupied);
            rounding[0] += loss[0];
            rounding[1] += loss[1];
            self.totals[0] += reduction[0];
            self.totals[1] += reduction[1];
            self.impedance[node] += reduction[2] / area;
            self.stress[node] += reduction[3] / area;
            self.signal[node][0] += reduction[4] / area;
            self.signal[node][1] += reduction[5] / area;
        }
        rounding
    }
}
