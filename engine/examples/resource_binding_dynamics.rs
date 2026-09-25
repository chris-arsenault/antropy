//! Bounded cell-free source dynamics; proposed attraction acts on sources only in this assay.
use antropy_engine::{config::Config, field::Field, source_medium, weathering, world::World};
use serde_json::{Value, json};
#[path = "resource_binding/kernel.rs"]
mod kernel;

fn fixture() -> World {
    let c = Config {
        width: 128.,
        height: 128.,
        founders: 0,
        source_count: 7,
        source_species: vec![0, 136],
        source_priming: 0.,
        attraction_length: 0., // Historical source-only prototype installs its own field.
        ..Config::default()
    };
    let mut w = World::new(27, c).unwrap();
    for (j, s) in w.sources.iter_mut().enumerate() {
        let angle = (j as f64 - 1.) * std::f64::consts::TAU / 6.;
        let radius = if j == 0 { 0. } else { 16. + (j % 2) as f64 };
        s.habitat.x = 64.3 + radius * angle.cos();
        s.habitat.y = 63.1 + radius * angle.sin();
        s.habitat.radius = 3.;
        s.rebuild(&w.config, &w.field);
    }
    // One finite source is near depletion; others retain ordinary default batches.
    let q = w.sources[0].amount;
    w.sources[0].rate = q / 40.;
    source_medium::project(&mut w);
    w
}

struct Scratch {
    combined: Vec<f64>,
    filter: kernel::Kernel,
    climate: antropy_engine::climate::Climate,
}
impl Scratch {
    fn new(w: &World) -> Self {
        let f = &w.field;
        Self {
            combined: vec![0.; f.nx * f.ny],
            filter: kernel::Kernel::new(f.nx, f.ny, f.spacing, 6.),
            climate: antropy_engine::climate::Climate::new(&w.config, &w.chemistry),
        }
    }
    fn prepare(&mut self, f: &Field) {
        for (n, value) in self.combined.iter_mut().enumerate() {
            *value = f.medium_signal(n)[0];
        }
        self.filter.apply(&self.combined, f.nx, f.ny);
    }
    fn gradient(&self, f: &Field, sites: &[(usize, f64)]) -> [[f64; 3]; 2] {
        let mut gradient = f.gradient(sites);
        gradient[0][0] = 0.;
        gradient[1][0] = 0.;
        for &(n, weight) in sites {
            let x = n % f.nx;
            let adjacent = [
                n - x + (x + 1) % f.nx,
                n - x + (x + f.nx - 1) % f.nx,
                (n + f.nx) % (f.nx * f.ny),
                (n + f.nx * f.ny - f.nx) % (f.nx * f.ny),
            ];
            for (axis, (a, b)) in [(adjacent[0], adjacent[1]), (adjacent[2], adjacent[3])]
                .into_iter()
                .enumerate()
            {
                gradient[axis][0] +=
                    weight * (self.filter.output[a] - self.filter.output[b]) / (2. * f.spacing);
            }
        }
        gradient
    }
}

fn advance(w: &mut World, scratch: &mut Scratch, candidate: bool) {
    let mut responses: Vec<_> = w
        .sources
        .iter()
        .map(|s| source_medium::response(s, w.tick, &w.config, &w.field, &w.chemistry))
        .collect();
    if candidate {
        scratch.prepare(&w.field);
        for (s, r) in w.sources.iter().zip(&mut responses) {
            r.velocity = source_medium::response_with_gradient(
                s,
                &w.config,
                &w.field,
                &w.chemistry,
                scratch.gradient(&w.field, &s.footprint),
                Default::default(),
            )
            .velocity;
        }
    }
    for (s, r) in w.sources.iter_mut().zip(responses) {
        let exposure = weathering::exposure(
            1.,
            r.load,
            w.config.habitat_feedback,
            w.config.diffusion_impedance,
        );
        s.advance(
            &source_medium::Step {
                tick: w.tick,
                config: &w.config,
                chemistry: &w.chemistry,
                operators: scratch.climate.operators.as_ref().unwrap(),
                exposure,
                response: r,
                release: true,
                chemical_dt: w.config.dt,
            },
            &mut w.environment_rng,
            &mut w.field,
            &mut w.ledger,
        );
    }
    source_medium::project(w);
    if (w.tick + 1).is_multiple_of(4) {
        scratch.climate.prepare(&w.config);
        let b = w.field.advance_weathered(
            &w.chemistry,
            w.config.physiology_interval,
            w.config.washout,
            w.config.diffusion_impedance,
            Some(&mut scratch.climate),
        );
        w.ledger.washed_out += b.matter;
        w.ledger.washout_energy += b.energy;
        w.ledger.numerical_material += b.roundoff_matter;
        w.ledger.numerical_energy += b.roundoff_energy;
        w.ledger.weathering_heat += b.weathering_heat;
        w.ledger.weathering_work += b.weathering_work;
        w.ledger.weathered_material += b.weathered_material;
        w.ledger.sheltered_conversion += b.sheltered_conversion;
    }
    w.tick += 1;
}

fn pulse(w: &mut World, species: usize) {
    // Accounted local material perturbation, representing a product patch, not evolved cells.
    for &(n, a) in &w.sources[1].footprint {
        let rounding = w.field.add(n, species, 12. * a, &w.chemistry);
        w.ledger.rounding(rounding, species, &w.chemistry);
    }
    w.ledger.supplied += 12.;
    w.ledger.supplied_energy += 12. * w.chemistry.properties[species].potential;
}

fn sample(w: &World) -> Value {
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
    json!({"tick":w.tick,"positions":positions,"medianPairDistance":pairs[pairs.len()/2],
        "maxPairDistance":pairs.last(),"empty":w.sources.iter().filter(|s|s.material.total==0.).count(),
        "sources":w.sources,"summary":summary})
}

fn run(candidate: bool, product: Option<usize>, ticks: u64, renewal: bool) -> Value {
    let mut w = fixture();
    if renewal {
        w.sources[2].amount = 0.;
        w.sources[2].wait = 120.;
        source_medium::project(&mut w);
    }
    let initial = w.held();
    w.ledger.initial_material = initial.0;
    w.ledger.initial_energy = initial.1;
    let mut scratch = Scratch::new(&w);
    let mut samples = vec![sample(&w)];
    let start = std::time::Instant::now();
    for _ in 0..ticks {
        if start.elapsed().as_secs() > 120 {
            break;
        }
        if w.tick == 1000 {
            if let Some(s) = product {
                pulse(&mut w, s);
            }
        }
        advance(&mut w, &mut scratch, candidate);
        if w.tick.is_multiple_of(100) {
            samples.push(sample(&w));
        }
    }
    json!({"candidate":candidate,"product":product,"renewalFixture":renewal,"ticks":w.tick,
        "wallMs":start.elapsed().as_secs_f64()*1000.,"samples":samples})
}

fn main() {
    let pilot = std::env::args().any(|x| x == "pilot");
    let renewal = std::env::args().any(|x| x == "renewal");
    let cases = if renewal {
        vec![run(false, None, 3000, true), run(true, None, 3000, true)]
    } else if pilot {
        vec![run(true, None, 100, false)]
    } else {
        vec![
            run(false, None, 3000, false),
            run(true, None, 3000, false),
            run(true, Some(8), 3000, false),
            run(true, Some(128), 3000, false),
        ]
    };
    println!(
        "{}",
        json!({"registration":"docs/design/resource-binding-proposal.md",
        "scope":"cell-free source-motion diagnostic; dissolved field retains current transport",
        "cases":cases,"filterBenchmark":kernel::benchmark()})
    );
}
