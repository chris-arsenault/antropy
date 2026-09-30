//! Bounded extinction diagnosis using the ordinary World; see docs/extinction-correction.md.
use antropy_engine::{config::Config, movement::distance, organism, world::World};
use serde_json::json;
use std::{fs, io::Write, path::Path, time::Instant};

fn sample(w: &World) -> serde_json::Value {
    let cells: Vec<_> = w.cells.iter().map(|c| {
        let local = w.field.stencil(c.x, c.y);
        let concentration: f64 = (0..256).map(|s| w.field.sample(s, &local)).sum();
        let nearest = |active: bool| w.sources.iter().enumerate()
            .filter(|(_, s)| !active || s.amount > 0.)
            .map(|(i, s)| (i, (distance([c.x,c.y], [s.habitat.x,s.habitat.y], &w.config)
                - s.habitat.radius - c.radius(&w.config)).max(0.)))
            .min_by(|a,b| a.1.total_cmp(&b.1));
        let basal = organism::maintenance_rate(&c.body, c.damage, c.age(&w.config,w.tick), &w.config);
        json!({"id":c.id,"position":[c.x,c.y],"energy":c.energy,
            "energyFraction":c.energy/c.energy_capacity(&w.config),"inventory":c.inventory.material(),
            "mass":c.mass(),"damage":c.damage,"age":c.age(&w.config,w.tick),
            "basalPower":basal,"storedEnergyBasalSeconds":c.energy/basal,
            "localMaterial":concentration,"nearest":nearest(false),"nearestActive":nearest(true),
            "flows":c.flows})
    }).collect();
    let sources: Vec<_> = w
        .sources
        .iter()
        .map(|s| {
            json!({
        "position":[s.habitat.x,s.habitat.y],"amount":s.amount,"wait":s.wait,
        "rate":s.rate,"radius":s.habitat.radius})
        })
        .collect();
    json!({"tick":w.tick,"population":w.cells.len(),"ledger":w.ledger,
        "cells":cells,"sources":sources})
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 5 {
        return Err("Usage: supply_cycles NEW_DIR ABSOLUTE_TICKS WALL_SECONDS CYCLE_SCALE CHECKPOINT_OR_new_OR_fresh_OR_gap".into());
    }
    let output = Path::new(&args[0]);
    let ticks: u64 = args[1].parse()?;
    let wall: f64 = args[2].parse()?;
    let scale: f64 = args[3].parse()?;
    if !(wall > 0. && wall.is_finite() && scale > 0. && scale.is_finite()) {
        return Err("Positive finite wall and cycle scale required".into());
    }
    fs::create_dir(output)?;
    rayon::ThreadPoolBuilder::new()
        .num_threads(4)
        .build()?
        .install(|| run(output, ticks, wall, scale, &args[4]))?;
    Ok(())
}

fn initial(input: &str, scale: f64) -> Result<World, String> {
    // Freeze the failed world's source times, even after production defaults change.
    let mut config = Config {
        source_lifetime: 600.,
        source_gap: 2400.,
        ..Config::ecology()
    };
    if input == "gap" {
        config.source_gap *= scale;
    } else if input == "fresh" {
        config.source_lifetime *= scale;
        config.source_gap *= scale;
    }
    let mut w = if matches!(input, "new" | "fresh" | "gap") {
        World::new(27, config)?
    } else {
        World::restore(&fs::read(input).map_err(|e| e.to_string())?)?
    };
    // Future cycles only: preserve existing stocks, waits, food and cellular funding.
    if !matches!(input, "fresh" | "gap") {
        w.config.source_lifetime *= scale;
        w.config.source_gap *= scale;
    }
    w.config.validate()?;
    Ok(w)
}

fn run(output: &Path, ticks: u64, wall: f64, scale: f64, input: &str) -> Result<(), String> {
    let mut w = initial(input, scale)?;
    if ticks < w.tick {
        return Err("Horizon precedes initial checkpoint".into());
    }
    let save =
        |name: &str, bytes: Vec<u8>| fs::write(output.join(name), bytes).map_err(|e| e.to_string());
    save("initial.bin", w.snapshot()?)?;
    save("config.json", serde_json::to_vec_pretty(&w.config).unwrap())?;
    let mut samples = fs::File::create(output.join("samples.jsonl")).map_err(|e| e.to_string())?;
    let emit = |w: &World, file: &mut fs::File| -> Result<(), String> {
        writeln!(file, "{}", sample(w)).map_err(|e| e.to_string())
    };
    emit(&w, &mut samples)?;
    let started = Instant::now();
    let start_tick = w.tick;
    while w.tick < ticks
        && !w.cells.is_empty()
        && w.stop_reason.is_none()
        && started.elapsed().as_secs_f64() < wall
    {
        w.step();
        if w.tick.is_multiple_of(500) {
            emit(&w, &mut samples)?;
            println!(
                "tick={} population={} wall={:.1}",
                w.tick,
                w.cells.len(),
                started.elapsed().as_secs_f64()
            );
        }
    }
    if !w.tick.is_multiple_of(500) {
        emit(&w, &mut samples)?;
    }
    let seconds = started.elapsed().as_secs_f64();
    let stop = if w.cells.is_empty() {
        "extinction"
    } else if w.stop_reason.is_some() {
        "physical stop"
    } else if w.tick >= ticks {
        "horizon"
    } else {
        "wall cap"
    };
    save("final.bin", w.snapshot()?)?;
    let report = json!({"registration":"docs/extinction-correction.md","input":input,
        "seed":w.seed,"version":w.version,"startTick":start_tick,"tick":w.tick,
        "population":w.cells.len(),"stop":stop,"physicalStop":w.stop_reason,
        "wallSeconds":seconds,"threads":4,"cycleScale":scale,"config":w.config,
        "ticksPerSecond":(w.tick-start_tick) as f64/seconds,"ledger":w.ledger});
    save("result.json", serde_json::to_vec_pretty(&report).unwrap())?;
    println!(
        "tick={} population={} stop={stop} wall={seconds:.1}",
        w.tick,
        w.cells.len()
    );
    Ok(())
}
