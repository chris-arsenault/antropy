//! Isolated operator/proposal controls; never advances World or selects live parents.
pub use antropy_engine::*;
#[path = "../src/genetics/mutation.rs"]
#[allow(dead_code)] // Historical proposal probe exercises only scalar/vector mutation.
mod mutation;
#[path = "symmetry_causality/old_refitting.rs"]
mod old_refitting;
#[path = "../src/refitting.rs"]
mod refitting;
use serde_json::{Value, json};

fn score(chem: &chemistry::Chemistry, source: usize, offset: [f64; 2], new: bool) -> [f64; 3] {
    let products = chemical_products::product_neighborhood(source, offset);
    let potential: f64 = products
        .iter()
        .map(|p| p.weight * chem.properties[p.species].potential)
        .sum();
    let changed = 1.
        - products
            .iter()
            .filter(|p| p.species == source)
            .map(|p| p.weight)
            .sum::<f64>();
    let distance = if new {
        products
            .iter()
            .map(|p| {
                p.weight
                    * chemistry::distance_squared(
                        chemistry::coordinate(source),
                        chemistry::coordinate(p.species),
                    )
            })
            .sum()
    } else {
        offset[0].powi(2) + offset[1].powi(2)
    };
    let work = chemistry::reaction_energy(chem.properties[source].potential, potential, 0.8).0
        - 0.05 * changed;
    let retained = products
        .iter()
        .filter(|p| p.species == 186)
        .map(|p| p.weight)
        .sum();
    [work / (1. + distance / 9.), retained, work]
}

fn landscape(w: &world::World, source: usize) -> Vec<Value> {
    let input = chemistry::coordinate(source);
    (0..256)
        .map(|target| {
            let point = chemistry::coordinate(target);
            let offset = [point[0] - input[0], point[1] - input[1]];
            let mut m = w.cells[0].installed.clone();
            m.enzymes[0] = genetics::Enzyme {
                x: input[0],
                y: input[1],
                dx: offset[0],
                dy: offset[1],
                angle: 0.,
            };
            let operators = chemical_operators::Operators::compile(&m, &w.config, &w.chemistry);
            let edge = operators.enzymes[0]
                .conversions
                .iter()
                .find(|e| e.substrate == source)
                .unwrap();
            let old = score(&w.chemistry, source, offset, false);
            let new = score(&w.chemistry, source, offset, true);
            assert!((new[0] - edge.work * edge.catalytic).abs() < 1e-12);
            json!({"target":target,"old":old,"new":new})
        })
        .collect()
}

fn proposals(w: &world::World, source: usize, vector: bool) -> Value {
    let start = chemistry::coordinate(source);
    let product = chemistry::coordinate(186);
    let original = [product[0] - start[0], product[1] - start[1]];
    let baseline = score(&w.chemistry, source, original, true)[0];
    let n = 200000;
    let mut rng = random::Random::new(27);
    let mut counts = [[0usize; 5]; 2];
    let mut gains = [0.; 2];
    for _ in 0..n {
        let mut offset = original;
        if vector {
            let [x, y] = &mut offset;
            mutation::mutate_pairs([[x, y]], &mut rng, 0.1, 0.12, -15., 15.);
        } else {
            mutation::mutate(&mut offset, &mut rng, 0.1, 0.12, -15., 15.);
        }
        for (i, new) in [false, true].into_iter().enumerate() {
            let value = score(&w.chemistry, source, offset, new);
            counts[i][0] += usize::from(offset != original);
            counts[i][1] += usize::from(value[0] > baseline * 1.01);
            counts[i][2] += usize::from(value[0] > baseline * 1.05);
            counts[i][3] += usize::from(value[1] < 0.5);
            counts[i][4] += usize::from(value[1] < 0.5 && value[0] > baseline * 1.01);
            gains[i] += (value[0] / baseline - 1.).max(0.);
        }
    }
    json!({"source":source,"vector":vector,"samples":n,"baseline":baseline,
        "countColumns":["changed","gain1percent","gain5percent","lessHalf186","lessHalf186AndGain1percent"],
        "rateOrder":["old","new"],"counts":counts,"positiveRelativeGainSum":gains})
}

fn install(
    w: &world::World,
    source: usize,
    product: usize,
    energy: f64,
    competing: bool,
    new: bool,
) -> Value {
    let slot = usize::from(source == 80);
    let mut g = w.genomes[&1].clone();
    diagnostics::retarget(&mut g, slot, source, product);
    if competing {
        g.chromosomes[0].chemistry.receptors[3].x += 3.;
    }
    g.compile(&w.config, &w.chemistry);
    let target = g.compiled.as_ref().unwrap();
    let mut cell = w.cells[0].clone();
    cell.energy = energy;
    let mut steps = 0;
    while steps < 1000 && cell.installed != target.chromosome.chemistry {
        let before = cell.installed.clone();
        if new {
            refitting::advance(&mut cell, target, &w.config, &w.chemistry, 0.8);
        } else {
            old_refitting::advance(&mut cell, target, &w.config, &w.chemistry, 0.8);
        }
        steps += 1;
        if before == cell.installed {
            break;
        }
    }
    json!({"source":source,"product":product,"new":new,"energy":energy,"competing":competing,
        "steps":steps,"completed":cell.installed == target.chromosome.chemistry,
        "enzymeCompleted":cell.installed.enzymes[slot] == target.chromosome.chemistry.enzymes[slot],
        "work":cell.flows.refitting,"remainingEnergy":cell.energy})
}

fn feedback(w: &world::World) -> Vec<Value> {
    let mut rows = vec![];
    for target in [186, 218, 233] {
        for accumulated in [0., 0.4] {
            for compatible in [false, true] {
                let mut g = w.genomes[&1].clone();
                diagnostics::retarget(&mut g, 2, 0, target);
                if compatible {
                    g.chromosomes[0].chemistry.membrane = genetics::Target::species(target);
                }
                g.compile(&w.config, &w.chemistry);
                let g = g.compiled.as_ref().unwrap();
                let mut cell =
                    organism::Cell::new(1, 1, g, &w.config, &w.chemistry, [12., 12.], 0.);
                cell.body[11] = 0.;
                cell.body[12] = 0.;
                cell.body[14] = 0.;
                cell.set_fixture_body(cell.body);
                cell.inventory.fill(0.);
                cell.inventory.set(0, 0.4);
                cell.inventory.set(186, accumulated);
                cell.energy = 0.5;
                let before = sensing::stress_load(&cell, g, &w.config, &w.field, &w.chemistry);
                metabolism::react(&mut cell, &w.config, &w.chemistry, 0.8);
                let after = sensing::stress_load(&cell, g, &w.config, &w.field, &w.chemistry);
                rows.push(
                    json!({"target":target,"accumulated186":accumulated,"compatible":compatible,
                    "consumed":cell.chemical_flows.consumed[0],"work":cell.energy-0.5,
                    "stressBefore":before,"stressAfter":after}),
                );
            }
        }
    }
    rows
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if !(2..=3).contains(&args.len()) {
        return Err("Expected definition.json new-report.json [feedback]".into());
    }
    let definition: Value = serde_json::from_slice(&std::fs::read(&args[0])?)?;
    let mut config: config::Config = serde_json::from_value(definition["config"].clone())?;
    config.width = 24.;
    config.height = 24.;
    config.founders = 1;
    config.source_count = 0;
    let mut w = world::World::new(27, config)?;
    w.chemistry = serde_json::from_value(definition["chemistry"].clone())?;
    for g in w.genomes.values_mut() {
        g.compile(&w.config, &w.chemistry);
    }
    diagnostics::initialize(&mut w);
    if args.get(2).is_some_and(|v| v == "feedback") {
        let file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&args[1])?;
        serde_json::to_writer_pretty(file, &json!({"worldTicks":w.tick,"feedback":feedback(&w)}))?;
        println!(
            "{}: twelve production reaction/stress intervals, zero World ticks",
            args[1]
        );
        return Ok(());
    }
    let mut mutation = vec![];
    let mut refits = vec![];
    for source in [0, 80] {
        for vector in [false, true] {
            mutation.push(proposals(&w, source, vector));
        }
        for product in [202, 218, 233, 234] {
            for energy in [0.02, 0.5] {
                for competing in [false, true] {
                    for new in [false, true] {
                        refits.push(install(&w, source, product, energy, competing, new));
                    }
                }
            }
        }
    }
    let result = json!({"worldTicks":w.tick,"landscape0":landscape(&w,0),"landscape80":landscape(&w,80),
        "mutation":mutation,"refits":refits});
    let file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&args[1])?;
    serde_json::to_writer_pretty(file, &result)?;
    println!(
        "{}: 800000 proposal samples, 64 refit fixtures, zero World ticks",
        args[1]
    );
    Ok(())
}
