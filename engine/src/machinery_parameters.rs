//! Fixed-width instructions and actual installed coordinates have separate owners.
use crate::genetics::Target;
use serde::{Deserialize, Serialize};

pub const PARAMETER_VERSION: u32 = 2;

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TransportParameters {
    pub center: Target,
}

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EnzymeParameters {
    pub center: Target,
    pub offset: [f64; 2],
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MachineryParameters {
    pub version: u32,
    pub receptors: [Target; 4],
    pub transporters: [TransportParameters; 4],
    pub enzymes: [EnzymeParameters; 4],
    pub membrane: Target,
}

/// A value snapshot, not a grant of funded stock or an active cell schema.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct InstalledParameters {
    pub revision: u64,
    pub parameters: MachineryParameters,
}

fn bounded(value: f64, low: f64, high: f64) -> bool {
    value.is_finite() && (low..=high).contains(&value)
}
fn valid_center(center: Target) -> bool {
    center.point().iter().all(|v| bounded(*v, 0., 15.))
}

impl MachineryParameters {
    /// Call at deserialization and compilation boundaries; never repair inherited values.
    pub fn validate(&self) -> Result<(), String> {
        if self.version != PARAMETER_VERSION {
            return Err("Unsupported machinery parameter version".into());
        }
        if !valid_center(self.membrane) || !self.receptors.iter().all(|t| valid_center(*t)) {
            return Err("Invalid receptor or membrane coordinate".into());
        }
        if !self.transporters.iter().all(|t| valid_center(t.center)) {
            return Err("Invalid transporter parameters".into());
        }
        if !self
            .enzymes
            .iter()
            .all(|e| valid_center(e.center) && e.offset.iter().all(|v| bounded(*v, -15., 15.)))
        {
            return Err("Invalid enzyme parameters".into());
        }
        Ok(())
    }
}
