use antropy_engine::{config::Config, terrain_config::Placement};

pub const CASES: &[&str] = &[
    "reference",
    "no-photo",
    "no-cover",
    "no-emission",
    "no-vocalization",
    "no-strategy",
    "radial",
    "no-elevation",
    "no-movement-conductance",
    "no-transport-conductance",
    "no-processing-conductance",
    "no-transmission",
    "ceiling",
    "no-seasons",
    "no-motor-feedback",
    "uniform-placement",
    "older-placement",
    "no-source-motion",
    "no-source-repulsion",
    "no-source-processing",
    "no-adhesion",
    "no-attraction",
    "no-pressure",
    "no-public-conversion",
    "no-habitat-feedback",
    "diploid-clonal",
    "diploid-selfing",
    "one-point-selfing",
    "budding",
    "no-new-mutation",
];

pub fn configuration(name: &str) -> Result<Config, String> {
    let mut c = Config::ecology();
    match name {
        "reference" => {}
        "no-photo" => c.features.photoreception = false,
        "no-cover" => c.features.cover = false,
        "no-emission" => c.features.emission = false,
        "no-vocalization" => c.features.vocalization = false,
        "no-strategy" => c.features.strategy = false,
        "radial" => c.radial_founders = true,
        "no-elevation" => c.terrain.elevation = false,
        "no-movement-conductance" => c.terrain.movement = false,
        "no-transport-conductance" => c.terrain.transport = false,
        "no-processing-conductance" => c.terrain.processing = false,
        "no-transmission" => c.terrain.transmission = false,
        "ceiling" => c.terrain.ceiling = true,
        "no-seasons" => c.terrain.seasons = false,
        "no-motor-feedback" => c.terrain.feedback = false,
        "uniform-placement" => c.terrain.placement = Placement::Uniform,
        "older-placement" => c.terrain.placement = Placement::Current,
        "no-source-motion" => c.source_drift = 0.,
        "no-source-repulsion" => c.reservoir_repulsion = 0.,
        "no-source-processing" => c.source_processing = 0.,
        "no-adhesion" => c.adhesion = 0.,
        "no-attraction" => c.attraction_length = 0.,
        "no-pressure" => c.pressure_strength = 0.,
        "no-public-conversion" => c.weathering_rate = 0.,
        "no-habitat-feedback" => c.habitat_feedback = false,
        "diploid-clonal" => c.ploidy = "diploid".into(),
        "diploid-selfing" => {
            c.ploidy = "diploid".into();
            c.transmission = "selfing".into();
        }
        "one-point-selfing" => {
            c.ploidy = "diploid".into();
            c.transmission = "selfing".into();
            c.crossover = "one-point".into();
        }
        "budding" => c.reproduction = "budding".into(),
        "no-new-mutation" => {
            c.mutation_rate = 0.;
            c.physical_mutation_rate = 0.;
        }
        _ => return Err(format!("Unknown startup case {name}")),
    }
    c.validate()?;
    Ok(c)
}
