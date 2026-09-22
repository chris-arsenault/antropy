//! Immutable feature reads; only Field commits and carrier ownership publish changes.
use super::*;
impl super::Field {
    pub fn validate(&self) -> Result<(), String> {
        let n = self
            .nx
            .checked_mul(self.ny)
            .ok_or("Invalid field dimensions")?;
        if self.nx < 4
            || self.ny < 4
            || n > crate::memory_budget::MAX_FIELD_NODES
            || self.spacing <= 0.
            || !self.spacing.is_finite()
            || self.amounts.len() != n * SPECIES
            || self.amounts.iter().any(|q| !q.is_finite() || *q < 0.)
            || !self.drift.is_finite()
            || !(0. ..=1.).contains(&self.drift)
        {
            return Err("Invalid field state".into());
        }
        Ok(())
    }
    /// Incrementally committed projections and totals must agree with their material.
    pub fn validate_reductions(&self, c: &Chemistry) -> Result<(), String> {
        let rows = crate::chemical_projection::Rows::new(c);
        let close = |a: f64, b: f64| a.is_finite() && (a - b).abs() <= 1e-9 * (1. + b.abs());
        let mut totals = [0.; 2];
        for (n, row) in self.amounts.rows() {
            let (_, mask, stored) = self.amounts.site(n);
            let expected = crate::chemical_projection::project(row, &rows);
            if mask != crate::field_activity::mask(row)
                || !stored.iter().zip(expected).all(|(&a, b)| close(a, b))
            {
                return Err("Field reductions disagree with material".into());
            }
            totals[0] += expected[0];
            totals[1] += expected[1];
        }
        if !self.totals.iter().zip(totals).all(|(&a, b)| close(a, b)) {
            return Err("Field reductions disagree with material".into());
        }
        Ok(())
    }
    pub fn body_signal(&self) -> &crate::spatial_signal::Signal {
        &self.body_signal
    }
    #[cfg(test)]
    pub(crate) fn test_body_signal(&mut self) -> &mut crate::spatial_signal::Signal {
        &mut self.body_signal
    }
    pub fn body_load(&self) -> &[f64] {
        &self.body_load
    }
    #[cfg(test)]
    pub(crate) fn test_body_load(&mut self) -> &mut [f64] {
        &mut self.body_load
    }
    pub fn source_signal(&self) -> &crate::spatial_signal::Signal {
        &self.source_signal
    }
    #[cfg(test)]
    pub(crate) fn test_source_signal(&mut self) -> &mut crate::spatial_signal::Signal {
        &mut self.source_signal
    }
    pub fn source_load(&self) -> &[f64] {
        &self.source_load
    }
    #[cfg(test)]
    pub(crate) fn test_source_load(&mut self) -> &mut [f64] {
        &mut self.source_load
    }
}
