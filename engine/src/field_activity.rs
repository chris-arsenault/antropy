//! Shared chemical-group support; the regional material owner keeps each site's groups.
// Shared concentration resolution: 0.1% of the default recognition half-saturation.
// Discarded extracellular material remains explicit in FieldBalance numerical accounts.
pub const CONCENTRATION_FLOOR: f32 = 1e-4;

/// Four-chemical support, consumed two lanes at a time by f64 SIMD kernels.
pub fn pairs(mask: u64) -> GroupLanes<2> {
    GroupLanes::new(mask)
}

/// A compact state machine avoids nesting flatten iterators in the chemical hot loops.
pub struct GroupLanes<const STRIDE: usize> {
    mask: u64,
    next: usize,
    end: usize,
}
impl<const STRIDE: usize> GroupLanes<STRIDE> {
    pub fn new(mask: u64) -> Self {
        assert!(STRIDE == 1 || STRIDE == 2);
        Self {
            mask,
            next: 0,
            end: 0,
        }
    }
}
impl<const STRIDE: usize> Iterator for GroupLanes<STRIDE> {
    type Item = usize;
    #[inline]
    fn next(&mut self) -> Option<usize> {
        if self.next == self.end {
            if self.mask == 0 {
                return None;
            }
            self.next = self.mask.trailing_zeros() as usize * 4;
            self.end = self.next + 4;
            self.mask &= self.mask - 1;
        }
        let current = self.next;
        self.next += STRIDE;
        Some(current)
    }
}

pub fn mask(row: &[f32]) -> u64 {
    let mut bits = 0;
    for (i, group) in row.as_chunks::<4>().0.iter().enumerate() {
        if group.iter().any(|q| *q > 0.) {
            bits |= 1 << i;
        }
    }
    bits
}
