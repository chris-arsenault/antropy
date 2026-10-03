//! Registered ordinary-world comparison; shared World and existing step-level study facts.
//! budget ROOT [LAMBDA TICKS]; run ROOT ARM TICKS WALL_SECONDS; pilot ROOT ARM
//! fork ROOT CHECKPOINT CELL FAMILY SLOT LOCUS VALUE
use antropy_engine::{commands, config::Config, footprint, movement, observation, world::World};
use serde_json::{Value, json};
use std::{fs, io::Write, path::Path, time::Instant};

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
const CADENCE: u64 = 200;
const DISK_LIMIT: u64 = 2 * 1024 * 1024 * 1024;

fn save(path: &Path, value: &Value) -> Result<()> {
    fs::write(path, serde_json::to_vec(value)?)?;
    Ok(())
}
fn row(out: &mut fs::File, value: &Value) -> Result<()> {
    serde_json::to_writer(&mut *out, value)?;
    out.write_all(b"\n")?;
    Ok(())
}
fn sparse(values: impl Iterator<Item = f64>) -> Vec<(usize, f64)> {
    values.enumerate().filter(|(_, q)| *q != 0.).collect()
}
fn account_close(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => {
            let (x, y) = (x.as_f64().unwrap(), y.as_f64().unwrap());
            (x - y).abs() <= 1e-12 * (1. + x.abs().max(y.abs()))
        }
        (Value::Object(x), Value::Object(y)) => {
            x.len() == y.len()
                && x.iter()
                    .all(|(k, v)| y.get(k).is_some_and(|other| account_close(v, other)))
        }
        _ => a == b,
    }
}
fn surroundings(w: &World) -> Value {
    let cells: Vec<_> = w
        .cells
        .iter()
        .map(|c| {
            let sites = footprint::sites(c, &w.config, &w.field);
            let source = w
                .sources
                .iter()
                .enumerate()
                .min_by(|(_, a), (_, b)| {
                    movement::distance([c.x, c.y], [a.habitat.x, a.habitat.y], &w.config).total_cmp(
                        &movement::distance([c.x, c.y], [b.habitat.x, b.habitat.y], &w.config),
                    )
                })
                .map(|(i, s)| {
                    json!({"site":i,"distance":movement::distance([c.x,c.y],
            [s.habitat.x,s.habitat.y],&w.config)})
                });
            json!({"id":c.id,"parent":c.parent,"genome":c.genome,"born":c.born,
            "generation":c.generation,"x":c.x,"y":c.y,"mass":c.mass(),
            "energy":c.energy,"damage":c.damage,"body":c.body,"action":c.action,
            "inputs":c.inputs,"source":source,
            "local":sparse((0..256).map(|s| w.field.sample(s,&sites))),
            "inventory":sparse(c.inventory.iter()),
            "imports":sparse(c.chemical_flows.imported.iter()),
            "exports":sparse(c.chemical_flows.exported.iter()),
            "consumed":sparse(c.chemical_flows.consumed.iter()),
            "produced":sparse(c.chemical_flows.produced.iter())})
        })
        .collect();
    let sources: Vec<_> = w.sources.iter().enumerate().map(|(i,s)| json!({
        "site":i,"x":s.habitat.x,"y":s.habitat.y,"amount":s.amount,
        "wait":s.wait,"released":s.total_released,"mixture":sparse(s.mixture.iter().copied())
    })).collect();
    json!({"tick":w.tick,"summary":observation::summary(w),"cells":cells,"sources":sources})
}
fn budget(root: &Path, lambda: f64, ticks: u64) -> Result<()> {
    if ticks == 0 || ticks > 24000 {
        return Err("Outside registered budget".into());
    }
    fs::create_dir(root)?;
    fs::copy(std::env::current_exe()?, root.join("runner"))?;
    let mut rows = Vec::new();
    for arm in ["keyed", "radial"] {
        let mut w = World::new(
            27,
            Config {
                radial_founders: arm == "radial",
                binding_lambda: lambda,
                ..Config::ecology()
            },
        )?;
        let before = w.snapshot()?;
        let ids: Vec<_> = w.cells.iter().take(4).map(|c| c.id).collect();
        let budgets: Vec<_> = ids
            .into_iter()
            .map(|cell| commands::execute(&mut w, &json!({"op":"bindingBudget","cell":cell})))
            .collect::<std::result::Result<_, _>>()?;
        rows.push(json!({"arm":arm,"config":w.config,"budget":budgets,
            "execution":commands::execute(&mut w,&json!({"op":"executionBudget"}))?,
            "initial":surroundings(&w)}));
        assert_eq!(
            before,
            w.snapshot()?,
            "Zero-tick observation changed physics"
        );
        fs::write(root.join(format!("{arm}.bin")), before)?;
    }
    // Recognition changes only the genotype and observation, not the initial physical world.
    let physical = |row: &Value| {
        let mut initial = row["initial"].clone();
        for cell in initial["cells"].as_array_mut().unwrap() {
            // Receptor readings are an intended consequence of the changed law.
            cell.as_object_mut().unwrap().remove("inputs");
        }
        initial
    };
    if physical(&rows[0]) != physical(&rows[1]) {
        return Err("Initial physical surroundings differ between recognition arms".into());
    }
    save(
        &root.join("budget.json"),
        &json!({
            "registration":"docs/plans/RUGGED-ECOLOGY-PLAN.md#registered-first-ordinary-world-comparison",
        "seed":27,"lambda":lambda,"cadence":CADENCE,"ticksPerArm":ticks,"wallSecondsPerArm":600,
            "maxRssBytes":3_u64*1024*1024*1024,"maxDiskBytes":DISK_LIMIT,"rows":rows
        }),
    )?;
    println!("Budget saved: {}", root.display());
    Ok(())
}
fn pilot(root: &Path, arm: &str) -> Result<()> {
    let mut observed = World::restore(&fs::read(root.join(format!("{arm}.bin")))?)?;
    let mut control = observed.clone();
    commands::execute(&mut observed, &json!({"op":"traceStart","study":true}))?;
    let start = Instant::now();
    let mut generated = 0;
    for _ in 0..400 {
        observed.step();
        if observed.tick % CADENCE == 0 {
            generated += serde_json::to_vec(&surroundings(&observed))?.len();
            generated += serde_json::to_vec(&commands::execute(
                &mut observed,
                &json!({"op":"studyDrain"}),
            )?)?
            .len();
        }
    }
    let observed_seconds = start.elapsed().as_secs_f64();
    for _ in 0..400 {
        control.step();
    }
    // Trace selects serial cell-account reduction; normal parallel reduction can
    // round the global ledger differently while leaving every physical value exact.
    let exact_checkpoint = observed.snapshot()? == control.snapshot()?;
    let mut physical = observed.clone();
    physical.ledger = control.ledger.clone();
    let transparent = physical.snapshot()? == control.snapshot()?
        && account_close(
            &serde_json::to_value(&observed.ledger)?,
            &serde_json::to_value(&control.ledger)?,
        );
    if !transparent {
        fs::write(
            root.join(format!("pilot-{arm}-observed.bin")),
            observed.snapshot()?,
        )?;
        fs::write(
            root.join(format!("pilot-{arm}-control.bin")),
            control.snapshot()?,
        )?;
        save(
            &root.join(format!("pilot-{arm}-difference.json")),
            &json!({
                "observed":surroundings(&observed),"control":surroundings(&control)
            }),
        )?;
        return Err(format!("Recorder comparison differs for {arm}; checkpoints retained").into());
    }
    save(
        &root.join(format!("pilot-{arm}.json")),
        &json!({"arm":arm,"ticks":400,
        "observedSeconds":observed_seconds,"sampleBytes":generated,
        "population":observed.cells.len(),"physicalTransparency":true,
        "exactCheckpoint":exact_checkpoint,"ledgerRelativeTolerance":1e-12}),
    )?;
    println!("{arm}: 400 ticks in {observed_seconds:.3}s; {generated} sampled bytes; transparent");
    Ok(())
}
fn directory_bytes(path: &Path) -> Result<u64> {
    let mut bytes = 0;
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        bytes += if entry.file_type()?.is_dir() {
            directory_bytes(&entry.path())?
        } else {
            entry.metadata()?.len()
        };
    }
    Ok(bytes)
}
fn rss() -> Result<u64> {
    let status = fs::read_to_string("/proc/self/status")?;
    let line = status
        .lines()
        .find(|l| l.starts_with("VmRSS:"))
        .ok_or("Missing Linux RSS")?;
    Ok(line
        .split_whitespace()
        .nth(1)
        .ok_or("Missing RSS value")?
        .parse::<u64>()?
        * 1024)
}
fn fork(root: &Path, args: &[String]) -> Result<()> {
    if args.len() != 6 {
        return Err("Expected CHECKPOINT CELL FAMILY SLOT LOCUS VALUE".into());
    }
    let mut baseline = World::restore(&fs::read(&args[0])?)?;
    let id: u64 = args[1].parse()?;
    let index = baseline
        .cells
        .iter()
        .position(|c| c.id == id)
        .ok_or("Selected cell is no longer alive")?;
    let slot: usize = args[3].parse()?;
    let locus: usize = args[4].parse()?;
    let value: f64 = args[5].parse()?;
    if !value.is_finite() || locus > 8 {
        return Err("Invalid scalar intervention".into());
    }
    // Freeze new genetic changes equally; retain every living cell's private experience.
    baseline.config.mutation_rate = 0.;
    baseline.config.physical_mutation_rate = 0.;
    baseline.config.learning_retention = 0.;
    let mut restored = baseline.clone();
    let old = restored.cells[index].genome;
    let mut genotype = restored.genomes[&old].clone();
    genotype.id = restored.next_genome;
    genotype.parent = Some(old);
    genotype.born = restored.tick;
    for chromosome in &mut genotype.chromosomes {
        let keys = chromosome
            .chemistry
            .keys
            .as_mut()
            .ok_or("Requires keyed recognition")?;
        let key = match args[2].as_str() {
            "receptors" => keys.receptors.get_mut(slot),
            "transporters" => keys.transporters.get_mut(slot),
            "enzymes" => keys.enzymes.get_mut(slot),
            "membrane" if slot == 0 => Some(&mut keys.membrane),
            _ => None,
        }
        .ok_or("Invalid recognition site")?;
        if locus == 8 {
            key.bias = value;
        } else {
            key.weights[locus] = value;
        }
    }
    genotype.validate(&restored.config)?;
    genotype.compile(&restored.config, &restored.chemistry);
    restored.cells[index].genome = genotype.id;
    antropy_engine::physiology::express(
        &mut restored.cells[index],
        genotype.compiled.as_ref().unwrap(),
    );
    antropy_engine::ancestry::get_mut(&mut restored.ancestry, id)
        .unwrap()
        .genome = genotype.id;
    restored.next_genome += 1;
    restored.genomes.insert(genotype.id, genotype);
    // Only recognition, genotype identity and the subsequent endogenous response change.
    let state = |w: &World| {
        json!({"brain":w.cells[index].brain,"body":w.cells[index].body,
        "bound":w.cells[index].bound_material,"inventory":w.cells[index].inventory,
        "energy":w.cells[index].energy,"position":[w.cells[index].x,w.cells[index].y]})
    };
    if state(&baseline) != state(&restored) {
        return Err("Intervention reset private or physical state".into());
    }
    fs::create_dir(root)?;
    fs::copy(std::env::current_exe()?, root.join("runner"))?;
    let mut budgets = Vec::new();
    for (arm, w) in [("baseline", &mut baseline), ("restored", &mut restored)] {
        let before = w.snapshot()?;
        budgets.push(json!({"arm":arm,"budget":commands::execute(w,&json!({"op":"bindingBudget","cell":id}))?}));
        if before != w.snapshot()? {
            return Err("Budget mutated counterfactual".into());
        }
        fs::write(root.join(format!("{arm}.bin")), before)?;
    }
    save(
        &root.join("budget.json"),
        &json!({"source":args[0],"cell":id,"family":args[2],
        "slot":slot,"locus":locus,"restoredValue":value,"privateStatePreserved":true,
        "mutation":false,"privateLearning":"unchanged","inheritedLearning":false,"budgets":budgets}),
    )?;
    println!("Counterfactual budgets saved: {}", root.display());
    Ok(())
}
fn run(root: &Path, arm: &str, ticks: u64, wall: f64) -> Result<()> {
    if ticks == 0 || ticks > 24000 || wall <= 0. || wall > 600. {
        return Err("Outside registered budget".into());
    }
    let directory = root.join(arm);
    fs::create_dir(&directory)?;
    let mut w = World::restore(&fs::read(root.join(format!("{arm}.bin")))?)?;
    let start_tick = w.tick;
    let target = start_tick + ticks;
    let start = Instant::now();
    commands::execute(&mut w, &json!({"op":"traceStart","study":true}))?;
    let mut samples = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(directory.join("samples.jsonl"))?;
    let mut facts = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(directory.join("facts.jsonl"))?;
    row(&mut samples, &surroundings(&w))?;
    let mut stop = "horizon";
    let mut peak_rss = 0;
    while w.tick < target {
        if start.elapsed().as_secs_f64() >= wall {
            stop = "wall cap";
            break;
        }
        if w.cells.is_empty() {
            stop = "extinction";
            break;
        }
        if w.stop_reason.is_some() {
            stop = "runtime failure";
            break;
        }
        w.step();
        if w.tick % CADENCE == 0 {
            row(
                &mut facts,
                &commands::execute(&mut w, &json!({"op":"studyDrain"}))?,
            )?;
            row(&mut samples, &surroundings(&w))?;
            peak_rss = peak_rss.max(rss()?);
            if peak_rss >= 3 * 1024 * 1024 * 1024 {
                stop = "RSS cap";
                break;
            }
            if directory_bytes(&directory)? >= DISK_LIMIT {
                stop = "disk cap";
                break;
            }
        }
        if w.tick % 2000 == 0 {
            fs::write(directory.join(format!("t{}.bin", w.tick)), w.snapshot()?)?;
            println!(
                "{arm}: tick={} population={} elapsed={:.1}s",
                w.tick,
                w.cells.len(),
                start.elapsed().as_secs_f64()
            );
        }
    }
    row(
        &mut facts,
        &commands::execute(&mut w, &json!({"op":"studyDrain"}))?,
    )?;
    row(&mut samples, &surroundings(&w))?;
    fs::write(directory.join("checkpoint.bin"), w.snapshot()?)?;
    let result = json!({"arm":arm,"startTick":start_tick,"ticksRequested":ticks,"wallSeconds":wall,"stop":stop,
        "elapsedSeconds":start.elapsed().as_secs_f64(),"peakRssBytes":peak_rss,
        "summary":observation::summary(&w),"config":w.config,
        "trace":commands::execute(&mut w,&json!({"op":"trace"}))?});
    save(&directory.join("result.json"), &result)?;
    println!(
        "{arm}: {stop} at tick={} population={}",
        w.tick,
        w.cells.len()
    );
    Ok(())
}
fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    let pool = rayon::ThreadPoolBuilder::new().num_threads(4).build()?;
    pool.install(|| -> std::result::Result<(), String> {
        let task = || -> Result<()> {
            let root = Path::new(args.get(1).ok_or("Expected stage ROOT [ARM TICKS WALL]")?);
            match args.first().map(String::as_str) {
                Some("budget") => budget(
                    root,
                    args.get(2)
                        .map(|v| v.parse())
                        .transpose()?
                        .unwrap_or(Config::ecology().binding_lambda),
                    args.get(3).map(|v| v.parse()).transpose()?.unwrap_or(24000),
                ),
                Some("pilot") => pilot(root, args.get(2).ok_or("Missing arm")?),
                Some("run") => run(
                    root,
                    args.get(2).ok_or("Missing arm")?,
                    args.get(3).ok_or("Missing ticks")?.parse()?,
                    args.get(4).ok_or("Missing wall")?.parse()?,
                ),
                Some("fork") => fork(root, &args[2..]),
                _ => Err("Expected budget, pilot or run".into()),
            }
        };
        task().map_err(|e| e.to_string())
    })?;
    Ok(())
}
