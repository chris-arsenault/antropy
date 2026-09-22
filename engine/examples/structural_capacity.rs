//! SCALING-PLAN.md registers this bounded whole-runtime engineering workload.
use antropy_engine::{config::Config, field::Field, world::World};
use std::time::Instant;

fn fixture(scale: usize, dense: bool) -> World {
    // Keep the registered area multipliers anchored to the original benchmark geometry.
    let mut w = World::new(
        101,
        Config {
            width: 320.,
            height: 240.,
            source_count: 48,
            landscape_regions: 7,
            ..Config::default()
        },
    )
    .unwrap();
    if dense {
        antropy_engine::commands::load_fixture(&mut w, 2000).unwrap();
        for (i, cell) in w.cells.iter_mut().enumerate() {
            cell.x = 150. + (i % 40) as f64 * 0.1;
            cell.y = 110. + (i / 40) as f64 * 0.1;
            cell.damage = 0.25;
        }
    }
    let old = w.field.clone();
    w.config.width *= match scale {
        10 => 5.,
        20 => 5.,
        _ => 1.,
    };
    w.config.height *= match scale {
        10 => 2.,
        20 => 4.,
        _ => 1.,
    };
    w.field = Field::new(w.config.width, w.config.height, w.config.mesh);
    for n in 0..old.nx * old.ny {
        for s in 0..256 {
            let q = old.amounts[n * 256 + s];
            if q != 0. {
                w.field.add(
                    n / old.nx * w.field.nx + n % old.nx,
                    s,
                    q as f64,
                    &w.chemistry,
                );
            }
        }
    }
    for source in &mut w.sources {
        source.rebuild(&w.config, &w.field);
    }
    antropy_engine::source_medium::project(&mut w);
    w
}
fn main() {
    let args: Vec<_> = std::env::args().collect();
    let scale: usize = args[1].parse().unwrap();
    let dense = args[2] == "dense";
    let workers: usize = args[3].parse().unwrap();
    let pool = rayon::ThreadPoolBuilder::new()
        .num_threads(workers)
        .build()
        .unwrap();
    let result = pool.install(|| {
        let mut w = fixture(scale, dense);
        for _ in 0..10 { w.step(); }
        let start = Instant::now();
        let mut ticks = 0;
        let mut phases = [0.; 9];
        while ticks < 100 && start.elapsed().as_secs_f64() < 60. {
            for (sum, value) in phases.iter_mut().zip(w.step_measured(|| start.elapsed().as_secs_f64() * 1000.)) {
                *sum += value;
            }
            ticks += 1;
        }
        let seconds = start.elapsed().as_secs_f64();
        let start=Instant::now();
        let geometry=antropy_engine::movement::geometry::Contacts::new(&w.cells,&w.config);
        let geometry_ms=start.elapsed().as_secs_f64()*1000.;
        let start=Instant::now();
        let graph=antropy_engine::interfaces::Graph::new(&w.cells,&w.config);
        let graph_ms=start.elapsed().as_secs_f64()*1000.;
        let mut probe=w.cells.clone();
        let start=Instant::now();
        graph.prepare(&mut probe,&w.config,&w.chemistry);
        let receptor_ms=start.elapsed().as_secs_f64()*1000.;
        let start=Instant::now();
        graph.prepare_exchange(&mut probe,&w.config,&w.chemistry);
        let boundary_ms=start.elapsed().as_secs_f64()*1000.;
        let mut render = antropy_engine::render::Buffers::default();
        let start = Instant::now();
        render.prepare(&w, 5, 0, 0, true, 0).unwrap();
        let render_ms = start.elapsed().as_secs_f64() * 1000.;
        let start = Instant::now();
        let chemistry = antropy_engine::observation::environment(&w);
        let observation_ms = start.elapsed().as_secs_f64() * 1000.;
        w.validate().unwrap();
        let peak_rss=std::fs::read_to_string("/proc/self/status").ok().and_then(|text|
            text.lines().find(|line|line.starts_with("VmHWM:")).and_then(|line|line.split_whitespace().nth(1)).and_then(|v|v.parse::<usize>().ok()));
        serde_json::json!({"area":scale,"dense":dense,"workers":workers,"ticks":ticks,
            "peakRssKiB":peak_rss,
            "seconds":seconds,"ticksPerSecond":ticks as f64/seconds,"phaseMs":phases.map(|x| x/ticks as f64),
            "renderMs":render_ms,"observationMs":observation_ms,"fieldWork":w.field.work_counts(),"execution":w.execution_work(),
            "contactProfile":{"geometryMs":geometry_ms,"graphMs":graph_ms,"receptorMs":receptor_ms,"boundaryMs":boundary_ms,
                "contacts":geometry.edges.len(),"candidateChecks":geometry.candidates},
            "chemistry":chemistry,"summary":antropy_engine::observation::summary(&w)})
    });
    std::fs::write(&args[4], serde_json::to_vec_pretty(&result).unwrap()).unwrap();
    println!(
        "area={scale} dense={dense}: {} ticks/s, render {} ms",
        result["ticksPerSecond"], result["renderMs"]
    );
}
