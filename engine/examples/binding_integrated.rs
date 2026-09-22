//! Registered ordinary World assays for finite binding and cell-mediated force changes.
use antropy_engine::{config::Config, source_medium, world::World};
use serde_json::{Value, json};

fn neighborhood(length: f64) -> World {
    let mut w = World::new(
        27,
        Config {
            width: 128.,
            height: 128.,
            founders: 0,
            source_count: 7,
            source_priming: 0.,
            attraction_length: length,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..Config::default()
        },
    )
    .unwrap();
    for (j, s) in w.sources.iter_mut().enumerate() {
        let angle = (j as f64 - 1.) * std::f64::consts::TAU / 6.;
        let radius = if j == 0 { 0. } else { 16. + (j % 2) as f64 };
        s.habitat.x = 64.3 + radius * angle.cos();
        s.habitat.y = 63.1 + radius * angle.sin();
        s.habitat.radius = 3.;
        s.rebuild(&w.config, &w.field);
    }
    w.sources[0].rate = w.sources[0].amount / 40.;
    w.sources[2].amount = 0.;
    w.sources[2].wait = 120.;
    source_medium::project(&mut w);
    antropy_engine::diagnostics::initialize(&mut w);
    w
}

fn cell_work(active: bool) -> World {
    let mut w = antropy_engine::initial_ecology::probe(2, true).unwrap();
    // Retain this qualified physiological fixture; asymmetry permits a measurable force.
    w.sources[0].habitat.x = 18.;
    w.sources[0].rebuild(&w.config, &w.field);
    if !active {
        let g = w.genomes.get_mut(&1).unwrap();
        for chromosome in &mut g.chromosomes {
            for e in &mut chromosome.chemistry.enzymes {
                e.center_x = 0.;
                e.center_y = 0.;
            }
        }
        g.compile(&w.config, &w.chemistry);
    }
    source_medium::project(&mut w);
    antropy_engine::diagnostics::initialize(&mut w);
    antropy_engine::commands::execute(&mut w, &json!({"op":"traceStart"})).unwrap();
    w
}

fn sample(w: &mut World) -> Value {
    w.field.prepare_attraction();
    let positions: Vec<_> = w
        .sources
        .iter()
        .map(|s| [s.habitat.x, s.habitat.y])
        .collect();
    let mut pairs = vec![];
    for i in 0..positions.len() {
        for j in 0..i {
            pairs.push(antropy_engine::movement::distance(
                positions[i],
                positions[j],
                &w.config,
            ));
        }
    }
    pairs.sort_by(f64::total_cmp);
    let summary = antropy_engine::observation::summary(w);
    assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-6);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-5);
    let mut response_config = w.config.clone();
    response_config.source_drift = 4.;
    let response: Vec<_> = w
        .sources
        .iter()
        .map(|s| source_medium::response(s, w.tick, &response_config, &w.field, &w.chemistry))
        .collect();
    let chemical_response = if w.trace.is_some() {
        let mut field = w.field.clone();
        antropy_engine::footprint::deposit_profiles(&[], &w.config, &mut field, &[]);
        field.prepare_attraction();
        Some(source_medium::response(
            &w.sources[0],
            w.tick,
            &response_config,
            &field,
            &w.chemistry,
        ))
    } else {
        None
    };
    let sources: Vec<_> = w
        .sources
        .iter()
        .map(|s| {
            json!({"position":[s.habitat.x,s.habitat.y],"stock":s.material.total,
        "amount":s.amount,"wait":s.wait})
        })
        .collect();
    json!({"tick":w.tick,"sources":sources,"responseAtDrift4":response,
        "medianPairDistance":pairs[pairs.len()/2],"maxPairDistance":pairs.last(),
        "summary":summary,"flows":w.ledger.flows,"withoutBodies":chemical_response})
}

fn run(mut w: World, name: &str, ticks: u64, output: &std::path::Path) -> Value {
    std::fs::write(
        output.join(format!("{name}-initial.bin")),
        w.snapshot().unwrap(),
    )
    .unwrap();
    let mut samples = vec![sample(&mut w)];
    let started = std::time::Instant::now();
    for _ in 0..ticks {
        if w.stop_reason.is_some() || started.elapsed().as_secs() >= 120 {
            break;
        }
        w.step();
        if w.tick.is_multiple_of(100) {
            samples.push(sample(&mut w));
        }
    }
    if !w.tick.is_multiple_of(100) {
        samples.push(sample(&mut w));
    }
    std::fs::write(
        output.join(format!("{name}-final.bin")),
        w.snapshot().unwrap(),
    )
    .unwrap();
    let trace = if w.trace.is_some() {
        antropy_engine::commands::execute(&mut w, &json!({"op":"trace"})).unwrap()
    } else {
        Value::Null
    };
    json!({"name":name,"config":w.config,"ticks":w.tick,"samples":samples,"trace":trace,
        "stop":w.stop_reason.unwrap_or(if w.tick==ticks {"horizon"} else {"wall cap"}.into()),
        "wallMs":started.elapsed().as_secs_f64()*1000.})
}

fn main() {
    let output = std::env::args()
        .nth(1)
        .expect("New output directory required");
    let output = std::path::Path::new(&output);
    std::fs::create_dir(output).unwrap();
    let pilot = std::env::args().any(|s| s == "pilot");
    let matched = std::env::args().any(|s| s == "matched");
    let cases = if matched {
        vec![
            run(cell_work(true), "cell-active", 40, output),
            run(cell_work(false), "cell-identity", 40, output),
        ]
    } else if pilot {
        vec![run(neighborhood(6.), "pilot", 100, output)]
    } else {
        vec![
            run(neighborhood(0.), "local", 3000, output),
            run(neighborhood(6.), "extended", 3000, output),
            run(cell_work(true), "cell-active", 300, output),
            run(cell_work(false), "cell-identity", 300, output),
        ]
    };
    let report = json!({"registration":"docs/design/resource-binding-proposal.md",
        "physicalVersion":antropy_engine::world::VERSION,"driver":"native-ordinary-World","cases":cases});
    std::fs::write(
        output.join("results.json"),
        serde_json::to_vec_pretty(&report).unwrap(),
    )
    .unwrap();
    for case in report["cases"].as_array().unwrap() {
        println!(
            "{}",
            json!({"name":case["name"],"ticks":case["ticks"],"wallMs":case["wallMs"],
        "final":case["samples"].as_array().unwrap().last()})
        );
    }
}
