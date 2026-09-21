//! Shared numerical resolution for prepared local operators, separate from physical stocks.

/// A prepared coefficient expires after this normalized change in its physical dependencies.
pub const RESOLUTION: f64 = 0.1;

/// The reference is the operator's existing saturation or physical scale, not another knob.
pub fn changed(current: f64, anchor: f64, reference: f64) -> bool {
    !current.is_finite()
        || !anchor.is_finite()
        || (current - anchor).abs()
            > RESOLUTION * (reference.abs() + current.abs().max(anchor.abs()))
}
