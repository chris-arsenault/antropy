//! Full-factor canonical checkpoint diagnostics. No simulation clock advances.
use antropy_engine::{controller, footprint, world::World};
use serde_json::{Value, json};
use std::collections::BTreeMap;

fn rms(values: &[f32]) -> f64 {
    (values.iter().map(|v| (*v as f64).powi(2)).sum::<f64>() / values.len().max(1) as f64).sqrt()
}

fn action_vector(a: controller::Action) -> Vec<f64> {
    let mut row = vec![
        a.swim,
        a.turn,
        a.repair,
        a.cover,
        a.emission,
        a.speech_effort,
    ];
    row.extend(a.transport);
    row.extend(a.activity);
    row
}

fn sensitivities(w: &World, c: &antropy_engine::organism::Cell) -> Value {
    let g = &w.genomes[&c.genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .behavior;
    let forward = |inputs: &[f32], hearing: bool, acquired: bool| {
        let mut state = controller::observed_state(&c.brain);
        state.epoch = None;
        if !acquired {
            state.traces.fill(0.);
        }
        if !hearing {
            state.hearing.pending.fill(0.);
        }
        let mut config = w.config.clone();
        config.dt = config.physiology_interval;
        action_vector(controller::act(g, inputs, &mut state, &config, false))
    };
    let baseline = forward(&c.inputs, true, true);
    let mut probes = serde_json::Map::new();
    for (name, range) in [
        ("chemical", 0..16),
        ("light", 37..41),
        ("inward", 41..49),
        ("context", 79..83),
    ] {
        let mut inputs = c.inputs.clone();
        inputs[range].fill(0.);
        let row = forward(&inputs, true, true);
        probes.insert(
            name.into(),
            json!(
                row.iter()
                    .zip(&baseline)
                    .map(|(a, b)| (a - b).powi(2))
                    .sum::<f64>()
                    .sqrt()
            ),
        );
    }
    for (name, hearing, acquired) in [
        ("pendingHearing", false, true),
        ("acquiredLearning", true, false),
    ] {
        let row = forward(&c.inputs, hearing, acquired);
        probes.insert(
            name.into(),
            json!(
                row.iter()
                    .zip(&baseline)
                    .map(|(a, b)| (a - b).powi(2))
                    .sum::<f64>()
                    .sqrt()
            ),
        );
    }
    json!({"baselineEfforts":baseline,"effortDifferenceNorm":probes,
        "meaning":"two frozen reflex forward evaluations, no learning or physical stepping; sensitivity is not fitness"})
}

pub fn inspect(w: &World) -> Value {
    let geo = &w.shade.geography;
    let cells: Vec<_> = w
        .cells
        .iter()
        .map(|c| {
            let sites = footprint::sites(c, &w.config, &w.field);
            let mixture: Vec<_> = (0..256).map(|s| w.field.sample(s, &sites)).collect();
            let g = w.genomes[&c.genome].compiled.as_ref().unwrap();
            let state = controller::observed_state(&c.brain);
            let private =
                controller::observation::inspect(&g.chromosome.behavior, &state, &w.config);
            json!({"id":c.id,"energy":c.energy,"capacity":c.energy_capacity(&w.config),
            "radius":c.radius(&w.config),"storageCapacity":c.capacity(&w.config),
            "localMixture":mixture,"terrain":geo.sample([c.x,c.y]),
            "season":geo.season([c.x,c.y],w.tick as f64*w.config.dt),
            "processingConductance":geo.processing(&sites),"motorLoad":c.motor_load,
            "activity":c.inputs[16..28].iter().copied().chain([c.inputs[49],c.inputs[50]]).collect::<Vec<_>>(),
            "activitySincePublication":(0..14).map(|i| c.activity.reading(i)).collect::<Vec<_>>(),
            "private":private,"sensitivity":sensitivities(w,c),"reflexHiddenRms":rms(&state.hidden),
            "reflexTraceRms":rms(&state.traces),"task":state.task,
            "pendingSpeech":state.pending_speech,"strategicHidden":state.strategy.hidden,
            "strategicLong":state.strategy.long,"strategicVolatility":state.strategy.volatility,
            "strategicTraceRms":rms(&state.strategy.traces),
            "reflexEvaluations":controller::expiry_counts(&c.brain)})
        })
        .collect();
    let genomes: BTreeMap<_, _> = w
        .genomes
        .iter()
        .filter(|(id, _)| w.cells.iter().any(|c| c.genome == **id))
        .map(|(id, g)| {
            let compiled = g.compiled.as_ref().unwrap();
            let op = &compiled.operators;
            let rows: Vec<_> = op
                .receptors
                .iter()
                .chain(&op.transporters)
                .map(|r| {
                    r.iter()
                        .map(|a| [a.species as f64, a.value])
                        .collect::<Vec<_>>()
                })
                .chain(op.enzymes.iter().map(|e| {
                    e.conversions
                        .iter()
                        .map(|r| [r.substrate as f64, r.binding])
                        .collect()
                }))
                .chain([op
                    .membrane
                    .iter()
                    .map(|a| [a.species as f64, a.value])
                    .collect()])
                .collect();
            (
                *id,
                json!({"parent":g.parent,"born":g.born,"mutated":g.mutated,"learned":g.learned,
            "recognitionRows":rows,"physical":compiled.chromosome.physical,
            "plasticity":compiled.chromosome.behavior.plasticity,
            "strategyLoci":compiled.chromosome.behavior.strategy.loci,
            "strategyPlasticity":compiled.chromosome.behavior.strategy.plasticity}),
            )
        })
        .collect();
    let sources: Vec<_> = w
        .sources
        .iter()
        .enumerate()
        .map(|(id, s)| {
            json!({
        "id":id,"allowance":s.allowance,"recentRecovery":s.recent_recovery,
        "recentOutput":s.recent_output,"totalReleased":s.total_released,
        "emptyElapsed":s.empty_elapsed,"pending":s.pending,"admissionPending":s.admission_pending,
        "season":geo.season([s.habitat.x,s.habitat.y],w.tick as f64*w.config.dt)})
        })
        .collect();
    let light: Vec<_> = (0..w.field.nx * w.field.ny)
        .map(|n| w.field.illumination.node(n))
        .collect();
    json!({"version":2,"cells":cells,"genomes":genomes,"sources":sources,
        "terrain":{"height":geo.height,"conductance":geo.conductance,"transmission":w.shade.transmission},
        "light":light,"cover":w.field.illumination.cover})
}
