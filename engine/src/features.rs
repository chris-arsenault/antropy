//! Run-start ablations. Inactive capacities have no body allocation or actuator cost.
use crate::organism::{BUILDER_STOCK, Body, EAR_STOCK, EMITTER_STOCK, MOUTH_STOCK, PHOTO_STOCK};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct Features {
    pub photoreception: bool,
    pub cover: bool,
    pub emission: bool,
    pub vocalization: bool,
    pub strategy: bool,
}

impl Default for Features {
    fn default() -> Self {
        Self {
            photoreception: true,
            cover: true,
            emission: true,
            vocalization: true,
            strategy: true,
        }
    }
}

impl Features {
    pub fn constrain_body(&self, body: &mut Body) {
        for (enabled, stock) in [
            (self.photoreception, PHOTO_STOCK),
            (self.cover, BUILDER_STOCK),
            (self.emission, EMITTER_STOCK),
            (self.vocalization, MOUTH_STOCK),
            (self.vocalization, EAR_STOCK),
        ] {
            if !enabled {
                body[stock] = 0.;
            }
        }
    }

    /// Removing strategy restores the ordinary reflex learning rate, rather than freezing it.
    pub fn reflex_learning_gain(&self, strategic_gain: f64) -> f64 {
        if self.strategy { strategic_gain } else { 1. }
    }
}

#[cfg(test)]
#[path = "feature_tests.rs"]
mod tests;
