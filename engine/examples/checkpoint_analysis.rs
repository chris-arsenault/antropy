//! Local registered studies through the ordinary World; no runtime laws or server endpoints.
use antropy_engine::{commands, controller, economy, movement, observation, world::World};
use serde_json::{Value, json};
use std::{
    collections::HashSet,
    fs,
    hash::{Hash, Hasher},
    io::Write,
    path::Path,
    time::Instant,
};
#[path = "analysis/cases.rs"]
mod cases;
#[path = "analysis/continuation.rs"]
mod continuation;
#[path = "analysis/frozen.rs"]
mod frozen;

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

fn save(path: &Path, value: &Value) -> Result<()> {
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    serde_json::to_writer(&mut file, value)?;
    file.write_all(b"\n")?;
    Ok(())
}

fn row(file: &mut fs::File, value: &Value) -> Result<()> {
    serde_json::to_writer(&mut *file, value)?;
    file.write_all(b"\n")?;
    Ok(())
}

fn fingerprint<'a>(values: impl Iterator<Item = &'a f64>) -> u64 {
    let mut h = std::collections::hash_map::DefaultHasher::new();
    for value in values {
        value.to_bits().hash(&mut h);
    }
    h.finish()
}

fn maps(w: &World) -> Value {
    let g = &w.shade.geography;
    json!({"height":fingerprint(g.height.iter()),"conductance":fingerprint(g.conductance.iter()),
        "transmission":fingerprint(w.shade.transmission.iter()),
        "ceiling":fingerprint(w.shade.ceiling.iter()),
        "season":fingerprint(g.seasons.iter().flatten())})
}

fn nearest(w: &World, x: f64, y: f64) -> Value {
    w.sources
        .iter()
        .enumerate()
        .map(|(i, s)| {
            (
                i,
                movement::distance([x, y], [s.habitat.x, s.habitat.y], &w.config),
            )
        })
        .min_by(|a, b| a.1.total_cmp(&b.1))
        .map_or(Value::Null, |(i, d)| json!([i, d]))
}

fn frame(w: &World, tracked: &HashSet<u64>) -> Value {
    let cells: Vec<_> = w
        .cells
        .iter()
        .filter(|c| tracked.contains(&c.id))
        .take(512)
        .map(|c| {
            let private = controller::observed_state(&c.brain);
            json!({"id":c.id,"parent":c.parent,"born":c.born,"genome":c.genome,
            "position":[c.x,c.y],"heading":c.heading,"body":c.body,"energy":c.energy,
            "damage":c.damage,"inventory":c.inventory.material(),"action":c.action,
            "inputs":c.inputs,"allocation":private.allocation,"context":private.strategy.context,
            "gain":private.strategy.learning_gain,"nearestSource":nearest(w,c.x,c.y),
            "flows":c.flows,"chemicalFlows":{"imported":c.chemical_flows.imported,"exported":c.chemical_flows.exported,
                "consumed":c.chemical_flows.consumed,"produced":c.chemical_flows.produced}})
        })
        .collect();
    let sources: Vec<_> = w
        .sources
        .iter()
        .enumerate()
        .map(|(i, s)| {
            json!({
        "id":i,"position":[s.habitat.x,s.habitat.y],"radius":s.habitat.radius,
        "stock":s.amount,"wait":s.wait,"allowance":s.allowance,"released":s.total_released,
        "recentRecovery":s.recent_recovery,"recentOutput":s.recent_output})
        })
        .collect();
    json!({"tick":w.tick,"summary":observation::summary(w),"cells":cells,"sources":sources,
        "trackedIds":tracked.len(),"livingTracked":w.cells.iter().filter(|c| tracked.contains(&c.id)).count()})
}

fn rss() -> Result<u64> {
    let status = fs::read_to_string("/proc/self/status")?;
    let line = status
        .lines()
        .find(|s| s.starts_with("VmRSS:"))
        .ok_or("No VmRSS")?;
    Ok(line
        .split_whitespace()
        .nth(1)
        .ok_or("No RSS value")?
        .parse::<u64>()?
        * 1024)
}

fn cohort_window(w: &World, previous: bool) -> Value {
    let observer = w.observer.as_ref().unwrap();
    let interval = if previous {
        &observer.previous
    } else {
        &observer.current
    };
    let group = &interval.groups[2];
    json!({"start":interval.start,"end":interval.end,"activity":{
        "flows":group.ledger.flows,"division":group.ledger.division_heat,
        "overflow":group.ledger.overflow_heat,"imports":group.imports.as_slice(),
        "exports":group.exports.as_slice(),"organismSeconds":group.organism_seconds}})
}

fn prepare(
    w: &mut World,
    output: &Path,
    seconds: f64,
    wall: f64,
    cadence: u64,
    focal: Option<u64>,
) -> Result<HashSet<u64>> {
    if rss()? > 6 * 1024 * 1024 * 1024 {
        return Err("Insufficient registered memory headroom for checkpoint export".into());
    }
    fs::create_dir(output)?;
    let before = w.snapshot()?;
    let initial_maps = maps(w);
    let stride = (w.cells.len() / 32).max(1);
    let mut ids: Vec<_> = w
        .cells
        .iter()
        .step_by(stride)
        .take(32)
        .map(|c| c.id)
        .collect();
    if let Some(id) = focal {
        if !w.cells.iter().any(|c| c.id == id) {
            return Err("Registered focal cell is absent".into());
        }
        ids.retain(|other| *other != id);
        ids.insert(0, id);
        let c = w.cells.iter().find(|c| c.id == id).unwrap();
        let mut neighbors: Vec<_> = w
            .cells
            .iter()
            .filter(|other| other.id != id)
            .map(|other| {
                (
                    movement::distance([c.x, c.y], [other.x, other.y], &w.config),
                    other.id,
                )
            })
            .collect();
        neighbors.sort_unstable_by(|a, b| a.0.total_cmp(&b.0).then(a.1.cmp(&b.1)));
        for (_, neighbor) in neighbors.into_iter().take(4) {
            if !ids.contains(&neighbor) {
                ids.push(neighbor);
            }
        }
    }
    let mut budgets = Vec::new();
    for id in ids.iter().take(4) {
        budgets.push(commands::execute(
            w,
            &json!({"op":"bindingBudget","cell":id}),
        )?);
    }
    let probes: Vec<_> = ids
        .iter()
        .filter_map(|id| w.cells.iter().find(|c| c.id == *id))
        .map(|c| frozen::cell(w, c))
        .collect();
    if let Some(id) = focal {
        commands::execute(
            w,
            &json!({"op":"phenotype","action":"restorePin",
            "pin":{"id":"registered-focal","label":"Registered focal descendants",
                "started":w.tick,"roots":[id]}}),
        )?;
        commands::execute(
            w,
            &json!({"op":"phenotype","action":"configure",
            "enabled":false,"highlight":false,"selection":{"kind":"pin"}}),
        )?;
    }
    if w.snapshot()? != before {
        return Err("Budget inspection changed the physical checkpoint".into());
    }
    fs::write(output.join("initial.bin"), before)?;
    save(&output.join("frozen.json"), &json!(probes))?;
    save(
        &output.join("registration.json"),
        &json!({"seed":w.seed,"version":w.version,
        "config":w.config,"startTick":w.tick,"modelSeconds":seconds,"wallSeconds":wall,
        "cadenceTicks":cadence,"focalIds":ids,"budgets":budgets,"mapFingerprints":initial_maps,
        "maxRssBytes":8_u64*1024*1024*1024,
        "question":"Declared isolated native startup or restored-control contrast; policy-specific effects, not automatic adaptation or founding"}),
    )?;
    Ok(ids.into_iter().collect())
}

fn run(
    mut w: World,
    output: &Path,
    seconds: f64,
    wall: f64,
    cadence: u64,
    focal: Option<u64>,
) -> Result<()> {
    let mut tracked = prepare(&mut w, output, seconds, wall, cadence, focal)?;
    let mut samples = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(output.join("samples.jsonl"))?;
    let mut births = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(output.join("births.jsonl"))?;
    let mut cohort = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(output.join("cohort-windows.jsonl"))?;
    row(&mut samples, &frame(&w, &tracked))?;
    let from = w.tick;
    let target = from + (seconds / w.config.dt).ceil() as u64;
    let started = Instant::now();
    let mut reason = "model-time window";
    let mut peak = rss()?;
    while w.tick < target {
        if started.elapsed().as_secs_f64() >= wall {
            reason = "wall cap";
            break;
        }
        if w.cells.is_empty() {
            reason = "extinction";
            break;
        }
        if w.stop_reason.is_some() {
            reason = "runtime failure";
            break;
        }
        w.step();
        if focal.is_some()
            && let Some(observer) = &w.observer
            && observer.previous.end == w.tick
            && observer.previous.end > observer.previous.start
        {
            row(&mut cohort, &cohort_window(&w, true))?;
        }
        for cell in &w.cells {
            if cell.parent.is_some_and(|id| tracked.contains(&id)) && tracked.insert(cell.id) {
                row(
                    &mut births,
                    &json!({"id":cell.id,"parent":cell.parent,"born":cell.born,
                    "observedTick":w.tick,"position":[cell.x,cell.y],"source":nearest(&w,cell.x,cell.y)}),
                )?;
            }
        }
        if (w.tick - from).is_multiple_of(cadence) {
            peak = peak.max(rss()?);
            if peak > 8 * 1024 * 1024 * 1024 {
                reason = "RSS cap";
                break;
            }
            row(&mut samples, &frame(&w, &tracked))?;
            if tracked.len() > 4096 {
                reason = "focal descendant cap";
                break;
            }
        }
    }
    row(&mut samples, &frame(&w, &tracked))?;
    if focal.is_some()
        && let Some(observer) = &w.observer
        && observer.current.end > observer.current.start
    {
        row(&mut cohort, &cohort_window(&w, false))?;
    }
    w.validate()?;
    fs::write(output.join("final.bin"), w.snapshot()?)?;
    let summary = observation::summary(&w);
    save(
        &output.join("result.json"),
        &json!({"fromTick":from,"toTick":w.tick,
        "actualModelSeconds":(w.tick-from) as f64*w.config.dt,"wallSeconds":started.elapsed().as_secs_f64(),
        "peakRssBytes":peak,"reason":reason,"summary":summary,"config":w.config,
        "focalEnding":focal.and_then(|id| antropy_engine::ancestry::get(&w.ancestry,id))}),
    )?;
    println!(
        "{}: {} ticks={} population={} reason={} wall={:.2}s",
        output.display(),
        w.version,
        w.tick - from,
        w.cells.len(),
        reason,
        started.elapsed().as_secs_f64()
    );
    if w.stop_reason.is_some() {
        return Err("Physical runtime failure retained in result.json".into());
    }
    Ok(())
}

fn startup(root: &Path) -> Result<()> {
    fs::create_dir(root)?;
    for name in cases::CASES {
        let config = cases::configuration(name)?;
        let budget = economy::report(27, config.clone())?;
        save(&root.join(format!("{name}-economy.json")), &budget)?;
        run(
            World::new(27, config)?,
            &root.join(name),
            120.,
            120.,
            100,
            None,
        )?;
    }
    Ok(())
}

fn inventory(input: &Path, output: &Path) -> Result<()> {
    use std::io::Read;
    let encoded = fs::read(input)?;
    let raw = if encoded.starts_with(&[0x1f, 0x8b]) {
        let mut raw = Vec::new();
        flate2::read::GzDecoder::new(encoded.as_slice())
            .take(2 * 1024 * 1024 * 1024 + 1)
            .read_to_end(&mut raw)?;
        raw
    } else {
        encoded
    };
    if raw.len() > 2 * 1024 * 1024 * 1024 {
        return Err("Inventory checkpoint exceeds input cap".into());
    }
    let w = World::restore(&raw)?;
    let sources: Vec<_> = w
        .sources
        .iter()
        .map(|s| {
            json!({"habitat":s.habitat,
        "amount":s.amount,"mixture":s.mixture,"rate":s.rate,"rng":s.renewal_rng.0})
        })
        .collect();
    let cells: Vec<_> = w
        .cells
        .iter()
        .map(|c| {
            json!({"id":c.id,"position":[c.x,c.y],
        "heading":c.heading,"body":c.body,"energy":c.energy,"inventory":c.inventory,
        "boundMaterial":c.bound_material,"strategyRng":c.brain.strategy.noise.0})
        })
        .collect();
    save(
        output,
        &json!({"tick":w.tick,"ticksAdvanced":0,"seed":w.seed,"config":w.config,
        "rng":{"physical":w.rng.0,"genetic":w.genetic_rng.0,"environment":w.environment_rng.0},
        "sources":sources,"cells":cells,"maps":maps(&w),"summary":observation::summary(&w)}),
    )
}

fn main() -> Result<()> {
    let a: Vec<_> = std::env::args().skip(1).collect();
    let pool = rayon::ThreadPoolBuilder::new().num_threads(4).build()?;
    pool.install(|| -> std::result::Result<(),String> {
        let task=|| -> Result<()> {
            match a.first().map(String::as_str) {
                Some("continuation") => continuation::run(&a[1..]),
                Some("startup") if a.len()==2 => startup(Path::new(&a[1])),
                Some("inventory") if a.len()==3 => inventory(Path::new(&a[1]),Path::new(&a[2])),
                Some("replay") if a.len()==6 || a.len()==7 => {
                    if fs::metadata(&a[1])?.len()>2*1024*1024*1024 {
                        return Err("Checkpoint exceeds registered input limit".into());
                    }
                    let raw=fs::read(&a[1])?;
                    let mut w=World::restore(&raw)?;
                    drop(raw);
                    let patch:Value=serde_json::from_slice(&fs::read(&a[2])?)?;
                    commands::execute(&mut w,&json!({"op":"configure","patch":patch}))?;
                    for _ in 0..32 {if w.run_control.pending.is_none(){break;} w.step();}
                    if w.run_control.pending.is_some(){return Err("Unsettled patch".into());}
                    let seconds:f64=a[4].parse()?;
                    let wall:f64=a[5].parse()?;
                    if !(seconds>0. && seconds<=3600. && wall>0. && wall<=900.) {
                        return Err("Outside replay registration ceilings".into());
                    }
                    let focal=a.get(6).map(|id| id.parse()).transpose()?;
                    run(w,Path::new(&a[3]),seconds,wall,4,focal)
                },
                _=>Err("Usage: checkpoint_analysis startup NEW_ROOT | inventory CHECKPOINT NEW_JSON | replay CHECKPOINT PATCH NEW_OUTPUT MODEL_SECONDS WALL_SECONDS [FOCAL_ID]".into()),
            }
        };
        task().map_err(|e|e.to_string())
    })?;
    Ok(())
}
