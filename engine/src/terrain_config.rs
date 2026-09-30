//! World-start geographic controls; generator constants stay in the generator.
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Placement {
    #[default]
    Current,
    Fractal,
    Uniform,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct TerrainConfig {
    pub elevation: bool,
    pub movement: bool,
    pub transport: bool,
    pub processing: bool,
    pub transmission: bool,
    pub ceiling: bool,
    pub seasons: bool,
    pub feedback: bool,
    pub slope_resistance: f64,
    pub minimum_conductance: f64,
    pub ceiling_min: f64,
    pub ceiling_max: f64,
    pub season_amplitude: f64,
    pub season_period: f64,
    pub placement: Placement,
    pub placement_contrast: f64,
}
impl Default for TerrainConfig {
    fn default() -> Self {
        Self {
            elevation: false,
            movement: false,
            transport: false,
            processing: false,
            transmission: true,
            ceiling: false,
            seasons: false,
            feedback: false,
            slope_resistance: 1.,
            minimum_conductance: 0.25,
            ceiling_min: 0.25,
            ceiling_max: 1.,
            season_amplitude: 1.,
            season_period: 3000.,
            placement: Placement::Current,
            placement_contrast: 6.,
        }
    }
}
impl TerrainConfig {
    pub fn integrated() -> Self {
        Self {
            elevation: true,
            movement: true,
            transport: true,
            processing: true,
            seasons: true,
            feedback: true,
            placement: Placement::Fractal,
            ..Self::default()
        }
    }
    pub fn validate(&self) -> Result<(), String> {
        let finite = [
            self.slope_resistance,
            self.minimum_conductance,
            self.ceiling_min,
            self.ceiling_max,
            self.season_amplitude,
            self.season_period,
            self.placement_contrast,
        ];
        if finite.iter().any(|v| !v.is_finite() || *v < 0.)
            || self.minimum_conductance <= 0.
            || self.minimum_conductance > 1.
            || self.ceiling_min > self.ceiling_max
            || self.season_amplitude > 1.
            || self.season_period <= 0.
            || self.placement_contrast > 40.
        {
            return Err("Invalid terrain configuration".into());
        }
        Ok(())
    }
}
