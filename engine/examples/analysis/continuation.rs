//! Bounded global continuation of a captured world; no population or ancestry outcome filters.
use antropy_engine::{controller, observation, world::World};
use serde_json::{Value, json};
use std::{fs, io::Write, path::Path, time::Instant};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

fn genetic_summary(w: &World) -> Value {
    let mut weights = Vec::new();
    let mut generation = Vec::new();
    let mut body = vec![0.; 24];
    let mut allocation = 0.;
    for cell in &w.cells {
        let g = &w.genomes[&cell.genome]
            .compiled
            .as_ref()
            .unwrap()
            .chromosome
            .behavior;
        weights.extend(g.weights.iter().copied().map(f64::from));
        generation.push(cell.generation);
        for (sum, q) in body.iter_mut().zip(cell.body) {
            *sum += q;
        }
        allocation += controller::observed_state(&cell.brain)
            .allocation
            .iter()
            .map(|v| *v as f64)
            .sum::<f64>();
    }
    generation.sort_unstable();
    let n = weights.len().max(1) as f64;
    json!({"weightRms":(weights.iter().map(|v|v*v).sum::<f64>()/n).sqrt(),
        "saturatedWeightFraction":weights.iter().filter(|v|v.abs()>=15.99).count() as f64/n,
        "nonzeroWeightFraction":weights.iter().filter(|v|**v!=0.).count() as f64/n,
        "medianGeneration":generation.get(generation.len()/2),"body":body,
        "meanAllocation":allocation/(w.cells.len().max(1)*controller::allocation::CHANNELS) as f64})
}

fn write(path: &Path, value: &Value) -> Result<()> {
    let mut f = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    serde_json::to_writer(&mut f, value)?;
    f.write_all(b"\n")?;
    Ok(())
}

pub fn run(args: &[String]) -> Result<()> {
    if args.len() != 5 {
        return Err("continuation CHECKPOINT CASE NEW_OUTPUT SECONDS WALL_SECONDS".into());
    }
    let seconds: f64 = args[3].parse()?;
    let wall: f64 = args[4].parse()?;
    if !(seconds > 0. && seconds <= 30000. && wall > 0. && wall <= 1200.) {
        return Err("Outside registered continuation ceilings".into());
    }
    let mut w = if args[0] == "fresh" {
        World::new(27, antropy_engine::config::Config::ecology())?
    } else {
        World::restore(&fs::read(&args[0])?)?
    };
    match args[1].as_str() {
        "reference" => {}
        "mutation-off" => {
            w.config.mutation_rate = 0.;
            w.config.physical_mutation_rate = 0.;
        }
        "assimilation-off" => w.config.learning_retention = 0.,
        "physical-off" => w.config.physical_mutation_rate = 0.,
        "physical-one-event" => w.config.physical_mutation_rate = 1. / 206.,
        "inherited-frozen" => {
            w.config.mutation_rate = 0.;
            w.config.physical_mutation_rate = 0.;
            w.config.learning_retention = 0.;
        }
        _ => return Err("Unknown registered continuation case".into()),
    }
    w.config.validate()?;
    w.trace = None;
    w.observer = None;
    w.ecology = None;
    let output = Path::new(&args[2]);
    fs::create_dir(output)?;
    if args[0] == "fresh" {
        fs::write(output.join("initial.bin"), w.snapshot()?)?;
    }
    let from = w.tick;
    write(
        &output.join("registration.json"),
        &json!({"input":args[0],"case":args[1],
        "startTick":from,"seconds":seconds,"wallSeconds":wall,"config":w.config,
        "question":"Does inherited change or changing environment prevent ordinary birth/death replacement?",
        "prediction":"Recovery only with frozen inherited change implicates mutation/assimilation; continued decline there retains environmental and inherited-background explanations.",
        "decision":"Correct a demonstrated inheritance or resource mismatch rather than infer maladaptation from extinction alone.",
        "initialGenetics":genetic_summary(&w)}),
    )?;
    let mut samples = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(output.join("samples.jsonl"))?;
    let sample = |w: &World, f: &mut fs::File| -> Result<()> {
        serde_json::to_writer(&mut *f, &observation::summary(w))?;
        f.write_all(b"\n")?;
        Ok(())
    };
    sample(&w, &mut samples)?;
    let timer = Instant::now();
    let mut stop = "horizon";
    while (w.tick - from) as f64 * w.config.dt < seconds {
        if timer.elapsed().as_secs_f64() > wall {
            stop = "wall cap";
            break;
        }
        if w.cells.is_empty() {
            stop = "extinction";
            break;
        }
        if w.stop_reason.is_some() {
            return Err(format!("Runtime stop: {:?}", w.stop_reason).into());
        }
        w.step();
        if (w.tick - from).is_multiple_of(250) {
            sample(&w, &mut samples)?;
        }
    }
    sample(&w, &mut samples)?;
    w.validate()?;
    fs::write(output.join("final.bin"), w.snapshot()?)?;
    let result = json!({"fromTick":from,"toTick":w.tick,"modelSeconds":(w.tick-from) as f64*w.config.dt,
        "wallSeconds":timer.elapsed().as_secs_f64(),"reason":stop,
        "summary":observation::summary(&w),"genetics":genetic_summary(&w)});
    write(&output.join("result.json"), &result)?;
    println!(
        "{}",
        json!({"case":args[1],"tick":w.tick,"seconds":result["modelSeconds"],
        "population":w.cells.len(),"stop":stop,"wallSeconds":result["wallSeconds"]})
    );
    Ok(())
}
