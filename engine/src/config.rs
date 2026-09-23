use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SourceSchedule {
    pub phase_ticks: u64,
    pub mixtures: Vec<Vec<f64>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Disturbance {
    pub mean_interval: f64,
    pub radius: f64,
    pub mortality: f64,
    pub mixing: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct Config {
    pub chemistry_seed: u64,
    pub width: f64,
    pub height: f64,
    pub mesh: f64,
    pub dt: f64,
    pub physiology_interval: f64,
    pub founders: usize,
    pub max_ancestry_records: usize,
    pub source_count: usize,
    pub landscape_regions: usize,
    pub landscape_spread: f64,
    pub source_priming: f64,
    pub source_rate: f64,
    pub source_radius: f64,
    /// Nominal refill amount divided by release rate; not an independent expiry clock.
    pub source_lifetime: f64,
    pub source_gap: f64,
    /// Reservoir passive mobility (the reservoir class's own drift scale).
    pub source_drift: f64,
    /// Long-range like-charge repulsion strength between reservoirs, relative to cohesion.
    pub reservoir_repulsion: f64,
    /// Gaussian range of reservoir charge repulsion; the sum is cut at three ranges.
    pub reservoir_range: f64,
    pub source_processing: f64,
    pub source_species: Vec<usize>,
    pub source_epochs: Option<SourceSchedule>,
    pub source_zones: Option<Vec<Vec<f64>>>,
    pub disturbance: Option<Disturbance>,
    pub washout: f64,
    pub weathering_rate: f64,
    pub habitat_feedback: bool,
    pub affinity_radius: f64,
    pub movement_impedance: f64,
    pub diffusion_impedance: f64,
    pub susceptibility_floor: f64,
    pub internal_exposure: f64,
    pub stress_k: f64,
    pub damage_rate: f64,
    pub repair_rate: f64,
    pub repair_material: f64,
    pub repair_energy: f64,
    pub receptor_k: f64,
    pub receptor_tau: f64,
    pub birth_mass: f64,
    pub motor_ratio: f64,
    pub storage_ratio: f64,
    pub receptor_ratio: f64,
    pub transporter_ratio: f64,
    pub enzyme_ratio: f64,
    pub body_density: f64,
    pub inventory_density: f64,
    pub storage_capacity: f64,
    pub energy_capacity: f64,
    pub founder_inventory: f64,
    pub founder_energy: f64,
    pub maintenance: f64,
    pub motor_maintenance: f64,
    pub storage_maintenance: f64,
    pub machinery_maintenance: f64,
    pub controller_cost: f64,
    pub transporter_turnover: f64,
    pub transport_energy: f64,
    pub enzyme_turnover: f64,
    pub conversion_efficiency: f64,
    pub environmental_work: f64,
    pub illumination_contrast: f64,
    pub illumination_fast_period: f64,
    pub illumination_slow_period: f64,
    pub illumination_modulation_period: f64,
    pub pressure_strength: f64,
    pub attraction_length: f64,
    pub growth_rate: f64,
    pub construction_energy: f64,
    pub protected_inventory_fraction: f64,
    pub division_work_per_core: f64,
    pub daughter_inventory_fraction: f64,
    pub daughter_energy_fraction: f64,
    pub viscosity: f64,
    /// Contact adhesion: weight per unit membrane compatibility when blending contact motion.
    pub adhesion: f64,
    pub motor_power_density: f64,
    pub motor_efficiency: f64,
    pub mutation_rate: f64,
    pub mutation_scale: f64,
    pub physical_mutation_rate: f64,
    pub physical_mutation_scale: f64,
    pub mutation_kind: String,
    pub ploidy: String,
    pub transmission: String,
    pub crossover: String,
    pub reproduction: String,
    pub learning: String,
    pub plasticity_cost: f64,
    pub learning_retention: f64,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            chemistry_seed: 101,
            width: 720.,
            height: 540.,
            mesh: 2.,
            dt: 0.2,
            physiology_interval: 0.8,
            founders: 48,
            max_ancestry_records: 2000000,
            source_count: 240,
            landscape_regions: 35,
            landscape_spread: 18.,
            source_priming: 0.1,
            source_rate: 0.2,
            source_radius: 3.,
            source_lifetime: 600.,
            source_gap: 2400.,
            source_drift: 1.,
            reservoir_repulsion: 20.,
            reservoir_range: 30.,
            source_processing: 0.25,
            source_species: vec![0, 136],
            source_epochs: None,
            source_zones: None,
            disturbance: None,
            washout: 0.001,
            weathering_rate: crate::weathering::DEFAULT_RATE,
            habitat_feedback: true,
            affinity_radius: 3.,
            movement_impedance: 0.5,
            diffusion_impedance: 1.,
            susceptibility_floor: 0.05,
            internal_exposure: 1.,
            stress_k: 0.3,
            damage_rate: 0.01,
            repair_rate: 0.008,
            repair_material: 0.3,
            repair_energy: 0.8,
            receptor_k: 0.1,
            receptor_tau: 2.,
            birth_mass: 1.,
            motor_ratio: 0.08,
            storage_ratio: 0.08,
            receptor_ratio: 0.01,
            transporter_ratio: 0.04,
            enzyme_ratio: 0.04,
            body_density: 4.,
            inventory_density: 4.,
            storage_capacity: 20.,
            energy_capacity: 0.8,
            founder_inventory: 0.8,
            founder_energy: 0.5,
            maintenance: 0.006,
            motor_maintenance: 0.02,
            storage_maintenance: 0.005,
            machinery_maintenance: 0.01,
            controller_cost: 0.001,
            transporter_turnover: 2.5,
            transport_energy: 0.05,
            enzyme_turnover: 2.5,
            conversion_efficiency: 0.8,
            environmental_work: crate::transformation_work::DEFAULT_STRENGTH,
            illumination_contrast: 0.8,
            illumination_fast_period: 6000.,
            illumination_slow_period: 18000.,
            illumination_modulation_period: 62000.,
            pressure_strength: crate::medium_response::DEFAULT_PRESSURE_STRENGTH,
            attraction_length: 6.,
            growth_rate: 0.06,
            construction_energy: 0.5,
            protected_inventory_fraction: 0.125,
            division_work_per_core: 0.04,
            daughter_inventory_fraction: 0.1875,
            daughter_energy_fraction: 0.125,
            viscosity: 0.004,
            adhesion: 4.,
            motor_power_density: 0.2,
            motor_efficiency: 0.5,
            mutation_rate: 0.0015,
            mutation_scale: 0.08,
            physical_mutation_rate: 0.1,
            physical_mutation_scale: 0.12,
            mutation_kind: "gaussian".into(),
            ploidy: "haploid".into(),
            transmission: "clonal".into(),
            crossover: "uniform".into(),
            reproduction: "fission".into(),
            learning: "plastic".into(),
            plasticity_cost: 0.002,
            learning_retention: 1.,
        }
    }
}

impl Config {
    pub fn validate(&self) -> Result<(), String> {
        let json = serde_json::to_value(self).map_err(|e| e.to_string())?;
        for (name, value) in json.as_object().unwrap() {
            if value.is_null()
                && !["sourceEpochs", "sourceZones", "disturbance"].contains(&name.as_str())
            {
                return Err(format!("Non-finite configuration: {name}"));
            }
            if value.is_number() && !value.as_f64().is_some_and(|x| x.is_finite() && x >= 0.) {
                return Err(format!("Invalid nonnegative configuration: {name}"));
            }
        }
        for (name, x) in [
            ("width", self.width),
            ("height", self.height),
            ("mesh", self.mesh),
            ("dt", self.dt),
            ("physiologyInterval", self.physiology_interval),
            ("affinityRadius", self.affinity_radius),
            ("stressK", self.stress_k),
            ("receptorK", self.receptor_k),
            ("receptorTau", self.receptor_tau),
            ("birthMass", self.birth_mass),
            ("bodyDensity", self.body_density),
            ("inventoryDensity", self.inventory_density),
            ("viscosity", self.viscosity),
            ("storageCapacity", self.storage_capacity),
            ("energyCapacity", self.energy_capacity),
            ("conversionEfficiency", self.conversion_efficiency),
            ("transportEnergy", self.transport_energy),
            ("constructionEnergy", self.construction_energy),
            ("sourceLifetime", self.source_lifetime),
            ("illuminationFastPeriod", self.illumination_fast_period),
            ("illuminationSlowPeriod", self.illumination_slow_period),
            (
                "illuminationModulationPeriod",
                self.illumination_modulation_period,
            ),
        ] {
            if x <= 0. {
                return Err(format!("Positive configuration required: {name}"));
            }
        }
        if self.width < 8.
            || self.height < 8.
            || self.width / self.mesh < 4.
            || self.height / self.mesh < 4.
            || (self.width / self.mesh).fract() != 0.
            || (self.height / self.mesh).fract() != 0.
            || (self.width / self.mesh) * (self.height / self.mesh)
                > crate::memory_budget::MAX_FIELD_NODES as f64
        {
            return Err("Invalid chemical mesh; dimensions must be integral multiples and fit the 2 GiB geographic memory reservation".into());
        }
        if self.dt > 1.
            || self.weathering_rate > 1.
            || self.source_drift > 4.
            || self.source_processing > 16.
            || self.physiology_interval < self.dt
            || self.physiology_interval > 2.
            || self.mesh < 0.5
            || self.attraction_length > self.width.min(self.height) / 2.
            || self.reservoir_range <= 0.
            || [
                self.illumination_fast_period,
                self.illumination_slow_period,
                self.illumination_modulation_period,
            ]
            .iter()
            .any(|p| *p < 100. * self.physiology_interval)
        {
            return Err("Unsupported numerical resolution or update interval".into());
        }
        for x in [
            self.source_priming,
            self.illumination_contrast,
            self.susceptibility_floor,
            self.conversion_efficiency,
            self.protected_inventory_fraction,
            self.daughter_inventory_fraction,
            self.daughter_energy_fraction,
            self.motor_efficiency,
            self.mutation_rate,
            self.physical_mutation_rate,
            self.learning_retention,
        ] {
            if !(0. ..=1.).contains(&x) {
                return Err("Invalid configuration fraction".into());
            }
        }
        if self.conversion_efficiency >= 1.
            || self.affinity_radius > 6.
            || self.max_ancestry_records < self.founders
            || self.max_ancestry_records > 5000000
            || self.landscape_regions == 0
            || self.landscape_regions > 10000
            || self.source_count > 10000
            || self.source_species.iter().any(|s| *s >= 256)
        {
            return Err("Invalid physical or operating limits".into());
        }
        for (value, allowed) in [
            (&self.ploidy, &["haploid", "diploid"][..]),
            (&self.transmission, &["clonal", "selfing"]),
            (&self.reproduction, &["fission", "budding"]),
            (&self.crossover, &["uniform", "one-point"]),
            (&self.mutation_kind, &["uniform", "gaussian"]),
            (&self.learning, &["static", "plastic"]),
        ] {
            if !allowed.contains(&value.as_str()) {
                return Err(format!("Unknown policy: {value}"));
            }
        }
        if self.transmission == "selfing" && self.ploidy != "diploid" {
            return Err("Selfing requires diploidy".into());
        }
        self.validate_sources()
    }
    fn validate_sources(&self) -> Result<(), String> {
        if self.source_epochs.is_some() && self.source_zones.is_some() {
            return Err("Epochs and zones are alternatives".into());
        }
        let mixtures = self
            .source_epochs
            .as_ref()
            .map(|x| &x.mixtures)
            .or(self.source_zones.as_ref());
        if self
            .source_epochs
            .as_ref()
            .is_some_and(|x| x.phase_ticks == 0)
        {
            return Err("Epoch duration is zero".into());
        }
        if let Some(mixes) = mixtures {
            let count = if self.source_species.is_empty() {
                2
            } else {
                self.source_species.len()
            };
            if mixes.is_empty()
                || mixes.iter().any(|m| {
                    m.len() != count
                        || m.iter().any(|v| !v.is_finite() || *v < 0.)
                        || (m.iter().sum::<f64>() - 1.).abs() > 1e-8
                })
            {
                return Err("Invalid source mixtures".into());
            }
        }
        if let Some(d) = &self.disturbance
            && (!d.mean_interval.is_finite()
                || d.mean_interval <= 0.
                || !d.radius.is_finite()
                || d.radius < 0.
                || !(0. ..=1.).contains(&d.mortality)
                || !(0. ..=1.).contains(&d.mixing))
        {
            return Err("Invalid disturbance".into());
        }
        Ok(())
    }
}
