//! Admission budget for geography, independent of the number of compute workers.
// Per node: two 256-f32 material buffers (2048 bytes), scalar/neighbor/activity/motion
// scratch and render projections (1024 bytes reserved), one cold field snapshot (1024).
// This is an admission estimate, not a promise about organism or ancestry growth.
pub const FIELD_BYTES_PER_NODE: usize = 4096;
pub const FIELD_RESERVATION_BYTES: usize = 2 * 1024 * 1024 * 1024;
pub const MAX_FIELD_NODES: usize = FIELD_RESERVATION_BYTES / FIELD_BYTES_PER_NODE;

#[cfg(test)]
mod tests {
    #[test]
    fn twenty_times_area_fits_geographic_reservation_and_larger_meshes_fail() {
        let mut c = crate::config::Config {
            width: 1600.,
            height: 960.,
            ..Default::default()
        };
        c.validate().unwrap();
        c.width = 4096.;
        c.height = 4096.;
        assert!(c.validate().unwrap_err().contains("memory reservation"));
    }
}
