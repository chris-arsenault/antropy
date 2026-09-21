//! Registered short ordinary-World assays; see docs/design/light-ecology.md.
use antropy_engine::{footprint, illumination, initial_ecology, world::World};
use serde_json::{Value, json};
use std::{path::Path, time::Instant};

fn positions() -> [[f64; 2]; 2] {
    let mut w = initial_ecology::probe(1, true).unwrap();
    w.config.illumination_contrast = 0.8;
    let mut values = Vec::new();
    for y in 0..w.field.ny {
        for x in 0..w.field.nx {
            let p = [x as f64 * w.config.mesh, y as f64 * w.config.mesh];
            let l = illumination::at(&w, p[0], p[1]);
            values.push((l, p));
        }
    }
    values.sort_by(|a, b| a.0.total_cmp(&b.0));
    [values[0].1, values.last().unwrap().1]
}

fn fixture(role: usize, p: [f64; 2], contrast: f64) -> World {
    let mut w = initial_ecology::probe(role, true).unwrap();
    w.config.illumination_contrast = contrast;
    w.cells[0].x = p[0];
    w.cells[0].y = p[1];
    for s in &mut w.sources {
        s.habitat.x = p[0];
        s.habitat.y = p[1];
        s.rebuild(&w.config, &w.field);
    }
    antropy_engine::source_medium::project(&mut w);
    let sites: Vec<_> = w
        .cells
        .iter()
        .map(|c| footprint::sites(c, &w.config, &w.field))
        .collect();
    footprint::deposit_profiles(&w.cells, &w.config, &mut w.field, &sites);
    antropy_engine::diagnostics::initialize(&mut w);
    w
}

fn budget(w: &World) -> Value {
    let cell = &w.cells[0];
    let sites = footprint::sites(cell, &w.config, &w.field);
    let local = std::array::from_fn(|s| w.field.sample(s, &sites));
    let signal = antropy_engine::weathering::signal(std::array::from_fn(|k| {
        sites
            .iter()
            .map(|&(n, a)| a * w.field.medium_signal(n)[k])
            .sum()
    }));
    let light = w.field.illumination.sample(&sites);
    let drive = illumination::drive(signal, light);
    let mut clone = cell.clone();
    antropy_engine::metabolism::react_observed(
        &mut clone,
        &w.config,
        &w.chemistry,
        w.config.physiology_interval,
        false,
        drive,
    );
    let maintenance =
        antropy_engine::organism::maintenance_rate(&cell.body, cell.damage, &w.config);
    let rows: Vec<_> = cell
        .operators
        .as_ref()
        .unwrap()
        .enzymes
        .iter()
        .flat_map(|e| &e.conversions)
        .filter(|e| cell.inventory[e.substrate] > 0.)
        .map(|e| {
            json!({"substrate":e.substrate,"coefficient":e.work_coefficient,
            "work":e.energy(&w.config, drive),"changed":e.changed})
        })
        .collect();
    json!({"signal":signal,"light":light,"drive":drive,"rows":rows,
        "maintenancePerSecond":maintenance,"reserveEnduranceSeconds":cell.energy/maintenance,
        "initialIntervalFlows":clone.flows,"initialIntervalEnergyChange":clone.energy-cell.energy,
        "uniformFreeMixtureBudget":antropy_engine::economy::budget(&w.config,&w.chemistry,
            w.genomes[&cell.genome].compiled.as_ref().unwrap(),1.,&local,cell.material(),0.)})
}

fn sample(w: &World) -> Value {
    let summary = antropy_engine::observation::summary(w);
    assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-6);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-5);
    let cells: Vec<_> = w
        .cells
        .iter()
        .map(|c| {
            json!({"id":c.id,"position":[c.x,c.y],
        "energy":c.energy,"mass":c.mass(),"damage":c.damage,"body":c.body,
        "action":c.action,"light":illumination::at(w,c.x,c.y)})
        })
        .collect();
    json!({"summary":summary,"cells":cells})
}

fn run(mut w: World, name: &str, out: &Path) -> Value {
    std::fs::write(
        out.join(format!("{name}-initial.bin")),
        w.snapshot().unwrap(),
    )
    .unwrap();
    let mut samples = vec![sample(&w)];
    let start = Instant::now();
    for _ in 0..300 {
        if w.cells.is_empty() || w.stop_reason.is_some() || start.elapsed().as_secs() >= 120 {
            break;
        }
        w.step();
        if w.tick.is_multiple_of(20) {
            samples.push(sample(&w));
        }
    }
    if !w.tick.is_multiple_of(20) {
        samples.push(sample(&w));
    }
    std::fs::write(out.join(format!("{name}-final.bin")), w.snapshot().unwrap()).unwrap();
    json!({"name":name,"ticks":w.tick,"config":w.config,"samples":samples,
        "wallMs":start.elapsed().as_secs_f64()*1000.,"stop":w.stop_reason.unwrap_or(
            if w.cells.is_empty() {"extinction"} else if w.tick==300 {"horizon"} else {"wall cap"}.into())})
}

fn evaluator_cost() -> Vec<Value> {
    let c = antropy_engine::config::Config {
        illumination_contrast: 0.8,
        ..Default::default()
    };
    let mut results = Vec::new();
    for [nx, ny] in [[160, 120], [640, 480]] {
        for support in [12, nx * ny] {
            let mut light = illumination::Illumination::default();
            light.prepare(27, 0, &c, nx, ny);
            let start = Instant::now();
            for tick in 1..=200 {
                light.prepare(27, tick, &c, nx, ny);
                for node in 0..support {
                    std::hint::black_box(light.node(std::hint::black_box(node)));
                }
            }
            results.push(json!({"nx":nx,"ny":ny,"support":support,
                "millisecondsPerTick":start.elapsed().as_secs_f64()*5.}));
        }
    }
    results
}

fn forcing_samples() -> Vec<Value> {
    let c = antropy_engine::config::Config::default();
    let mut light = illumination::Illumination::default();
    [0, 7500, 15000, 30000, 90000, 155000]
        .map(|tick| {
            light.prepare(27, tick, &c, 64, 48);
            let nodes: Vec<_> = (0..64 * 48).map(|node| light.node(node)).collect();
            json!({"tick":tick,"nx":64,"ny":48,"responses":nodes})
        })
        .to_vec()
}

fn main() {
    let args: Vec<_> = std::env::args().collect();
    let out = Path::new(args.get(1).expect("new output directory"));
    std::fs::create_dir(out).unwrap();
    let execute = args.get(2).is_some_and(|v| v == "run");
    let positions = positions();
    let mut budgets = Vec::new();
    let mut cases = Vec::new();
    for role in [1, 2] {
        for (region, p) in positions.into_iter().enumerate() {
            for contrast in [0., 0.8] {
                let w = fixture(role, p, contrast);
                let name = format!("role{role}-region{region}-contrast{contrast}");
                budgets.push(json!({"name":name,"position":p,"budget":budget(&w)}));
                if execute {
                    cases.push(run(w, &name, out));
                }
            }
        }
    }
    let report = json!({"registration":"docs/design/light-ecology.md#scalar-correction-verification-registration",
        "physicalVersion":antropy_engine::world::VERSION,"budgets":budgets,"cases":cases,
        "evaluatorCost":evaluator_cost(),"forcingSamples":forcing_samples()});
    std::fs::write(
        out.join("report.json"),
        serde_json::to_vec_pretty(&report).unwrap(),
    )
    .unwrap();
    println!("{}", out.display());
}
