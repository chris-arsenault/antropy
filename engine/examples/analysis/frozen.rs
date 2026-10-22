//! Frozen private-state and contact-display masks; no physical or paid-time update.
use antropy_engine::{controller, organism::Cell, world::World};
use serde_json::{Value, json};

fn efforts(a: controller::Action) -> Vec<f64> {
    let mut values = vec![
        a.swim,
        a.turn,
        a.repair,
        a.cover,
        a.emission,
        a.speech_effort,
    ];
    values.extend(a.transport);
    values.extend(a.activity);
    values
}

pub fn cell(w: &World, c: &Cell) -> Value {
    let genome = &w.genomes[&c.genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .behavior;
    let mut config = w.config.clone();
    config.dt = config.physiology_interval;
    let forward = |mask: &str| {
        let mut state = controller::observed_state(&c.brain);
        state.epoch = None;
        let mut inputs = c.inputs.clone();
        match mask {
            "privateByte" => state.task = 0,
            "reflexHidden" => state.hidden.fill(0.),
            "reflexAcquiredWeights" => state.traces.fill(0.),
            "acquiredAllocation" => state.allocation.fill(0.),
            "hearing" => {
                state.hearing.pending.fill(0.);
                inputs[controller::HEARING_INPUT..controller::CONTEXT_INPUT].fill(0.);
            }
            _ => {}
        }
        efforts(controller::act(genome, &inputs, &mut state, &config, false))
    };
    let baseline = forward("reference");
    let mut differences = serde_json::Map::new();
    for mask in [
        "privateByte",
        "reflexHidden",
        "reflexAcquiredWeights",
        "acquiredAllocation",
        "hearing",
    ] {
        let values = forward(mask);
        let norm = values
            .iter()
            .zip(&baseline)
            .map(|(a, b)| (a - b).powi(2))
            .sum::<f64>()
            .sqrt();
        differences.insert(mask.into(), json!(norm));
    }
    let slow = |mask: &str| {
        let mut state = controller::observed_state(&c.brain).strategy;
        // Evaluate the retained partial interval; zero elapsed has no accumulated observation.
        if state.elapsed <= 0. {
            return None;
        }
        if mask == "contactDisplays" {
            let start = controller::strategic::HISTORY + 22;
            state.integral[start..start + 4].fill(0.);
        }
        if mask == "storedLongState" {
            state.hidden.fill(0.);
            state.long.fill(0.);
            state.volatility.fill(0.);
        }
        controller::strategic::evaluate(&genome.strategy, &mut state, &config, false);
        Some([
            state.context[0] as f64,
            state.context[1] as f64,
            state.context[2] as f64,
            state.context[3] as f64,
            state.learning_gain,
        ])
    };
    let slow_baseline = slow("reference");
    let mut slow_differences = serde_json::Map::new();
    for mask in ["contactDisplays", "storedLongState"] {
        let norm = slow_baseline.zip(slow(mask)).map(|(a, b)| {
            a.iter()
                .zip(b)
                .map(|(a, b)| (a - b).powi(2))
                .sum::<f64>()
                .sqrt()
        });
        slow_differences.insert(mask.into(), json!(norm));
    }
    json!({"id":c.id,"baselineEfforts":baseline,"effortDifferenceNorm":differences,
        "slowReference":slow_baseline,"slowDifferenceNorm":slow_differences,
        "meaning":"Frozen forward sensitivity with learning unpaid; masks do not estimate survival, sender return or a newborn lifecycle"})
}
