//! Registered paired public-food opportunity, using ordinary World stepping and diagnostic RNNs.
use antropy_engine::{chemistry, controller, diagnostics, weathering, world::World};
use serde_json::json;

fn route(w: &World) -> (usize, usize) {
    let op = weathering::Operators::new(&w.chemistry);
    (0..256)
        .flat_map(|s| (0..weathering::BRANCHES).map(move |j| (s, j)))
        .filter(|&(s, j)| {
            chemistry::distance_squared(
                chemistry::coordinate(s),
                chemistry::coordinate(op.destination[s][j]),
            ) >= 16.
        })
        .max_by(|&(s, j), &(t, k)| {
            let score = |s: usize, j: usize| {
                let signal =
                    weathering::signal(w.chemistry.properties[s].interaction.map(|v| v * 0.5));
                let (rate, _, _) = op.local(s, j, signal);
                rate * op.work[j][s]
            };
            score(s, j).total_cmp(&score(t, k))
        })
        .map(|(s, j)| (s, op.destination[s][j]))
        .unwrap()
}

fn fixture(enabled: bool, from: usize, to: usize) -> World {
    let mut w = diagnostics::nutrition(0.8, 2., false, false);
    w.config.weathering_rate = if enabled {
        weathering::DEFAULT_RATE
    } else {
        0.
    };
    w.config.illumination_contrast = 0.;
    let g = w.genomes.get_mut(&1).unwrap();
    for slot in 0..4 {
        diagnostics::retarget(g, slot, to, from);
    }
    for ch in &mut g.chromosomes {
        ch.behavior = controller::diagnostic([0., 0., 3., 0., -3., 3., 3., 3., 3.], None);
    }
    g.compile(&w.config, &w.chemistry);
    w.cells[0].inventory.fill(0.);
    for n in 0..w.field.nx * w.field.ny {
        w.field.add(n, from, 2., &w.chemistry);
    }
    diagnostics::initialize(&mut w);
    antropy_engine::commands::execute(&mut w, &json!({"op":"traceStart"})).unwrap();
    w
}

fn main() {
    let output = std::env::args()
        .nth(1)
        .expect("New output directory required");
    let output = std::path::Path::new(&output);
    std::fs::create_dir(output).unwrap();
    let basis = diagnostics::nutrition(0.8, 2., false, false);
    let (from, to) = route(&basis);
    let mut cases = vec![];
    for enabled in [false, true] {
        let mut w = fixture(enabled, from, to);
        std::fs::write(
            output.join(format!("{enabled}-initial.bin")),
            w.snapshot().unwrap(),
        )
        .unwrap();
        let start = std::time::Instant::now();
        let mut samples = vec![];
        while w.tick < 300 && w.stop_reason.is_none() && start.elapsed().as_secs() < 30 {
            w.step();
            if w.tick.is_multiple_of(20) {
                let summary = antropy_engine::observation::summary(&w);
                assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-6);
                assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-6);
                samples.push(json!({"tick":w.tick,"summary":summary,"flows":w.ledger.flows}));
            }
        }
        let trace = antropy_engine::commands::execute(&mut w, &json!({"op":"trace"})).unwrap();
        std::fs::write(
            output.join(format!("{enabled}-final.bin")),
            w.snapshot().unwrap(),
        )
        .unwrap();
        let result = json!({"enabled":enabled,"from":from,"to":to,"ticks":w.tick,
            "stop":w.stop_reason,"samples":samples,"trace":trace,"wallMs":start.elapsed().as_secs_f64()*1000.});
        println!(
            "{}",
            json!({"enabled":enabled,"from":from,"to":to,"ticks":w.tick,"flows":w.ledger.flows})
        );
        cases.push(result);
    }
    std::fs::write(output.join("results.json"), serde_json::to_vec_pretty(&json!({
        "registration":"MATERIAL-HABITATS-PLAN.md","cases":cases,
        "selection":"maximum predicted rate times potential gain from a pure 0.5-concentration donor; distance at least 4; no simulation search",
        "physicalVersion":antropy_engine::world::VERSION})).unwrap()).unwrap();
}
