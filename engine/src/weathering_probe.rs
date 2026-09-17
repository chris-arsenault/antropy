//! Bounded cell-free assay of the production field operator; never used by browser rendering.
use crate::{climate::Climate, config::Config, field::Field, world::World};
use serde_json::{Value, json};

pub fn run(w: &World) -> Value {
    let mut results = vec![];
    for (medium, enabled) in [(240, true), (255, true), (240, false), (255, false)] {
        let config = Config {
            width: 24.,
            height: 24.,
            mesh: 2.,
            habitat_feedback: false, // Isolate chemical direction from impedance attenuation.
            weathering_rate: if enabled {
                w.config.weathering_rate
            } else {
                0.
            },
            ..w.config.clone()
        };
        let mut field = Field::new(24., 24., 2.);
        let mut climate = Climate::new(&config, &w.chemistry);
        for node in [26, 27, 38, 39] {
            field.add(node, 88, 1., &w.chemistry);
            field.add(node, medium, 4., &w.chemistry);
        }
        let initial = field.totals(&w.chemistry);
        let (mut matter_loss, mut energy_loss, mut heat, mut converted) = (0., 0., 0., 0.);
        let mut samples = vec![];
        for step in 0..75 {
            climate.prepare(&config);
            let b = field.advance_weathered(
                &w.chemistry,
                0.8,
                config.washout,
                config.diffusion_impedance,
                Some(&mut climate),
            );
            matter_loss += b.matter + b.roundoff_matter;
            energy_loss += b.energy + b.roundoff_energy;
            heat += b.weathering_heat;
            converted += b.weathered_material;
            if (step + 1) % 15 == 0 {
                samples.push(json!({"seconds":(step+1) as f64*0.8,
                    "species":totals(&field),"converted":converted,"active":field.work_counts()}));
            }
        }
        let final_state = field.totals(&w.chemistry);
        let species = totals(&field);
        results.push(
            json!({"medium":medium,"enabled":enabled,"species":species,"samples":samples,
            "heat":heat,"converted":converted,"initial":initial,"final":final_state,
            "materialResidual":initial.0-final_state.0-matter_loss,
            "energyResidual":initial.1-final_state.1-energy_loss-heat}),
        );
    }
    json!({"modelSeconds":60,"steps":75,"seed":w.seed,"chemistrySeed":w.chemistry.seed,
        "substrate":88,"substrateAmount":4,"mediumAmount":16,"habitatFeedback":false,
        "registration":"ENVIRONMENTAL-ECOLOGY-PLAN.md#weathering-redesign","results":results})
}

fn totals(field: &Field) -> Vec<f64> {
    let mut species = vec![0.; 256];
    for row in field.amounts.as_chunks::<256>().0 {
        for (total, q) in species.iter_mut().zip(row) {
            *total += *q as f64;
        }
    }
    species
}
