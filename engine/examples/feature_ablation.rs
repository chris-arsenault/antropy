//! Bounded native startup with declared configuration; generated reports remain local.
use antropy_engine::{configuration, economy, observation, world::World};
use serde_json::{Value, json};
use std::{fs, io::Write, path::Path, time::Instant};

fn report(path: &Path, value: &Value) -> Result<(), Box<dyn std::error::Error>> {
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    serde_json::to_writer_pretty(&mut file, value)?;
    file.write_all(b"\n")?;
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 2 {
        return Err("Usage: feature_ablation CONFIG.json NEW_OUTPUT_DIRECTORY".into());
    }
    let config = configuration::text(&fs::read_to_string(&args[0])?)?;
    rayon::ThreadPoolBuilder::new()
        .num_threads(4)
        .build_global()?;
    let output = Path::new(&args[1]);
    fs::create_dir(output)?;
    report(
        &output.join("budget.json"),
        &economy::report(27, config.clone())?,
    )?;
    let mut w = World::new(27, config)?;
    let mut samples = vec![observation::summary(&w)];
    let started = Instant::now();
    let mut reason = "tick horizon";
    while w.tick < 12000 {
        if started.elapsed().as_secs() >= 180 {
            reason = "wall cap";
            break;
        }
        w.step();
        if w.tick.is_multiple_of(1000) {
            let summary = observation::summary(&w);
            println!(
                "tick={} population={} divisions={} deaths={}",
                w.tick,
                w.cells.len(),
                w.ledger.divisions,
                w.ledger.deaths
            );
            samples.push(summary);
        }
        if w.cells.is_empty() || w.stop_reason.is_some() {
            reason = "extinction or execution failure";
            break;
        }
    }
    let summary = observation::summary(&w);
    report(
        &output.join("run.json"),
        &json!({"seed":w.seed,"config":w.config,
        "physicalVersion":w.version,"wallSeconds":started.elapsed().as_secs_f64(),
        "stopReason":reason,"summary":summary,"samples":samples}),
    )?;
    let f = &w.ledger.flows;
    if w.stop_reason.is_some()
        || summary["materialResidual"].as_f64().unwrap().abs() > 1e-7
        || summary["energyResidual"].as_f64().unwrap().abs() > 1e-6
        || f.emission + f.cover_work + f.speech_work + f.utterances + f.heard != 0.
        || w.mortality.recovered != 0.
        || w.cells.iter().any(|c| c.brain.strategy.evaluations != 0)
    {
        return Err("All-off startup violated accounts or feature inactivity; see run.json".into());
    }
    println!(
        "{}: {} at tick {}, {} living cells",
        output.display(),
        reason,
        w.tick,
        w.cells.len()
    );
    Ok(())
}
