//! Isolate embodied chemical influence on the ordinary public reservoir operator.
use antropy_engine::{
    config::Config, footprint, observation, optics::Exposure, source_medium, weathering,
    world::World,
};
use serde_json::json;
use std::path::Path;

pub fn run(root: &Path) -> super::Result<()> {
    std::fs::create_dir(root)?;
    super::save(
        &root.join("registration.json"),
        &json!({
        "question":"Can ordinary cell chemical projections alter held reservoir chemistry and its future supply condition independently of abiotic self-influence?",
        "initialConditions":"Four ordinary seed27 cells, one168 reservoir, circuit32/160/168/40, default physical prices and exposure. One frozen physiology interval; no organism removal or food substitution.",
        "competingExplanations":["Reservoir self-influence alone determines conversion","Cell chemical contributions change public conversion"],
        "control":"Omit only the body chemical vector in the source conversion signal. Keep body material, exposure/load, light, source stock and schedule identical.",
        "decision":"Whether a missing cell-to-reservoir chemical coupling needs repair in addition to secondary-input recognition.",
        "limits":"A frozen causal operator check, not evolved advantageous reservoir modification or a consumer replacement experiment."}),
    )?;
    let mut w = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 4,
            source_count: 1,
            source_species: vec![168],
            founder_circuit: [32, 160, 168, 40],
            source_priming: 0.,
            radial_founders: false,
            ..Config::default()
        },
    )?;
    w.sources[0].habitat.x = 12.;
    w.sources[0].habitat.y = 12.;
    w.sources[0].rebuild(&w.config, &w.field);
    for (i, c) in w.cells.iter_mut().enumerate() {
        c.x = 11. + (i % 2) as f64 * 2.;
        c.y = 11. + (i / 2) as f64 * 2.;
    }
    source_medium::project(&mut w);
    let rows: Vec<_> = w
        .cells
        .iter()
        .map(|c| footprint::sites(c, &w.config, &w.field))
        .collect();
    footprint::deposit_profiles(&w.cells, &w.config, &mut w.field, &rows);
    let source = &w.sources[0];
    let mut bodies = vec![[0.; 2]; w.field.nx * w.field.ny];
    footprint::visit_current(&w, |n, p| {
        for k in 0..2 {
            bodies[n][k] += p[k];
        }
    });
    let body: [f64; 2] = std::array::from_fn(|k| {
        source
            .footprint
            .iter()
            .map(|&(n, a)| a * bodies[n][k])
            .sum()
    });
    let total = w.field.signal_sample(&source.footprint);
    let absent = std::array::from_fn(|k| total[k] - body[k]);
    let normal = source_medium::response(source, 0, &w.config, &w.field, &w.chemistry);
    let initial = source.supply_condition.clone();
    let mut results = Vec::new();
    for (name, signal) in [
        ("ordinary", weathering::signal(total)),
        (
            "without-body-chemical-influence",
            weathering::signal(absent),
        ),
    ] {
        let mut arm = w.clone();
        source_medium::photochemistry(
            &mut arm,
            w.config.physiology_interval,
            &[(
                signal,
                normal.load,
                Exposure {
                    solar: normal.light,
                    emitted: 0.,
                    funded: 0.,
                },
            )],
        );
        let deltas: Vec<_> = arm.sources[0]
            .supply_condition
            .iter()
            .zip(&initial)
            .map(|(a, b)| a - b)
            .collect();
        results.push(json!({"arm":name,"signal":signal,"boundaryChanges":deltas,
            "stock":arm.sources[0].amount,"inventory":arm.sources[0].inventory().collect::<Vec<_>>(),
            "summary":observation::summary(&arm)}));
        arm.validate()?;
    }
    let result = json!({"modelSeconds":w.config.physiology_interval,"bodySignal":body,"totalSignal":total,
        "source":w.sources[0],"initialBoundary":initial,"arms":results});
    super::save(&root.join("result.json"), &result)?;
    println!("reservoir causal operator check saved");
    Ok(())
}
