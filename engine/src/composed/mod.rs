//! Computable chemistry arithmetic. M0 diagnostics call these kernels; World integration is M2–M4.
pub mod bodies;
pub(crate) mod capacity;
pub mod events;
pub mod exchange;
pub mod field;
mod local_matrix;
pub mod machinery;
mod numeric;

pub const DRIFT: f64 = 0.25;
pub const EFFICIENCY: f64 = 0.8;
pub const WORK_PRICE: f64 = 0.05;

#[derive(Clone, Copy, Debug, Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Accounts {
    pub heat: f64,
    pub material_error: f64,
    pub energy_error: f64,
    pub boundary_material: f64,
    pub boundary_energy: f64,
}

impl Accounts {
    pub fn rounding(&mut self, loss: f64, potential: f64) {
        self.material_error += loss;
        self.energy_error += loss * potential;
    }
}
