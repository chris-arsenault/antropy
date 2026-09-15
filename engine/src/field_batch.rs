//! Commit a geographic chemical vector once, retaining owned reductions and explicit roundoff.
use super::{Field, FieldBalance};
use crate::chemistry::Chemistry;

impl Field {
    pub fn apply_row(
        &mut self,
        node: usize,
        delta: &[f64; 256],
        chemistry: &Chemistry,
    ) -> FieldBalance {
        let mut balance = FieldBalance::default();
        let mut impedance = 0.;
        let mut stress = 0.;
        for (s, requested) in delta.iter().enumerate() {
            let at = node * 256 + s;
            let previous = self.amounts[at] as f64;
            let next = (previous + requested).max(0.) as f32;
            let actual = next as f64 - previous;
            let p = &chemistry.properties[s];
            self.amounts[at] = next;
            balance.matter += actual;
            balance.energy += actual * p.potential;
            balance.roundoff_matter += requested - actual;
            balance.roundoff_energy += (requested - actual) * p.potential;
            impedance += actual * p.impedance;
            stress += actual * p.stress;
        }
        self.matter += balance.matter;
        self.energy += balance.energy;
        self.impedance[node] += impedance / self.spacing.powi(2);
        self.stress[node] += stress / self.spacing.powi(2);
        self.reductions.get_mut().invalidate();
        balance
    }
}
