use crate::{
    config::Config,
    genetics::Genotype,
    observation,
    organism::Cell,
    random::Random,
    sensing,
    world::{Ancestor, World},
};
use serde_json::{Value, json};

fn number(v: &Value, name: &str) -> Result<u64, String> {
    v.get(name)
        .and_then(Value::as_u64)
        .ok_or_else(|| format!("Missing unsigned integer: {name}"))
}
pub fn configuration(v: &Value) -> Result<Value, String> {
    let mut config: Config = serde_json::from_value(v.get("config").cloned().unwrap_or(json!({})))
        .map_err(|e| e.to_string())?;
    config.validate()?;
    let chemistry = crate::chemistry::Chemistry::new(config.chemistry_seed)?;
    if config.source_species.is_empty() {
        config.source_species = chemistry.source_species();
    }
    let genotype = Genotype::seed(&config, &chemistry);
    Ok(
        json!({"config":config,"chemistry":chemistry,"genotype":genotype,"stationary":crate::controller::diagnostic([0.,0.,3.,0.,-1.,3.,3.,-3.,-3.],None)}),
    )
}
pub fn execute(w: &mut World, v: &Value) -> Result<Value, String> {
    match v
        .get("op")
        .and_then(Value::as_str)
        .ok_or("Missing operation")?
    {
        "step" => {
            let count = v.get("count").and_then(Value::as_u64).unwrap_or(1);
            if count > 10000 {
                return Err("Step batch exceeds 10000".into());
            }
            for _ in 0..count {
                w.step();
                if w.stop_reason.is_some() {
                    break;
                }
            }
            Ok(json!({"tick":w.tick,"stopReason":w.stop_reason}))
        }
        "stepStatus" => Ok(json!({"tick":w.tick,"stopReason":w.stop_reason})),
        "frame" => Ok(observation::frame(w)),
        "assayFrame" => Ok(crate::trace::frame(w)),
        "summary" => Ok(observation::summary(w)),
        "chemicalOverview" => Ok(crate::chemical_observation::overview(w)),
        "historyFixture" => crate::storage_diagnostics::history(w, number(v, "count")? as usize),
        "fieldFixture" => crate::storage_diagnostics::field(
            w,
            v.get("kind")
                .and_then(Value::as_str)
                .ok_or("Missing field kind")?,
        ),
        "environment" => Ok(observation::environment(w)),
        "census" => crate::census::observe(w, v),
        "traceStart" => {
            let target: Option<[f64; 3]> =
                serde_json::from_value(v.get("target").cloned().unwrap_or(Value::Null))
                    .map_err(|e| e.to_string())?;
            if target.is_some_and(|t| t.iter().any(|x| !x.is_finite()) || t[2] < 0.) {
                return Err("Invalid observation target".into());
            }
            w.trace = Some(crate::trace::Trace::new(&w.cells, target));
            if v.get("study").and_then(Value::as_bool) == Some(true) {
                let mut study = crate::study_trace::Study::new(w.tick);
                study.genomes(&w.genomes);
                w.trace.as_mut().unwrap().study = Some(study);
            }
            Ok(json!({}))
        }
        "studyDrain" => Ok(w
            .trace
            .as_mut()
            .and_then(|t| t.study.as_mut())
            .ok_or("Study trace is not enabled")?
            .drain(w.tick)),
        "trace" => Ok(json!(
            w.trace
                .as_ref()
                .ok_or("Assay trace is not enabled")?
                .groups
                .values()
                .collect::<Vec<_>>()
        )),
        "traceStop" => {
            w.trace = None;
            Ok(json!({}))
        }
        "profile" => Ok(json!(w.step_measured(crate::abi::clock))),
        "fieldActivity" => Ok(json!(w.field.work_counts())),
        "composedCapacity" => {
            Err("Retired standalone core benchmark; use production capacity".into())
        }
        "diffusionProbe" => Ok(crate::opportunities::diffusion_probe(w)),
        "field" => observation::field_view(
            w,
            v.get("kind").and_then(Value::as_str).unwrap_or("material"),
            v.get("species").and_then(Value::as_u64).unwrap_or(0) as usize,
        ),
        "inspect" => observation::inspect(w, number(v, "cell")?),
        "inspectSelected" => observation::selected(w, number(v, "cell")?, v),
        "genotype" => {
            Ok(json!(w.genomes.get(&number(v, "id")?).ok_or(
                "Genotype is unavailable; it may have been pruned"
            )?))
        }
        "genotypeFacts" => {
            let g = w
                .genomes
                .get(&number(v, "id")?)
                .ok_or("Genotype unavailable")?;
            let compiled = g.compiled.as_ref().unwrap();
            let capacity: Vec<f64> = w
                .config
                .source_species
                .iter()
                .map(|s| {
                    (0..4)
                        .map(|i| {
                            compiled.body[7 + i]
                                * compiled.operators.transporters[i]
                                    .iter()
                                    .filter(|a| a.species == *s)
                                    .map(|a| a.value)
                                    .sum::<f64>()
                        })
                        .sum()
                })
                .collect();
            Ok(
                json!({"expressed":compiled.chromosome,"blueprint":compiled.body,"sourceImportCapacity":capacity}),
            )
        }
        "assimilatedGenotype" => {
            let cell = w
                .cells
                .iter()
                .find(|c| c.id == number(v, "cell").unwrap_or(0))
                .ok_or("Living source cell required")?;
            let mut g = w.genomes[&cell.genome].clone();
            let expressed = g.compiled.as_ref().unwrap().chromosome.behavior.clone();
            for a in &mut g.chromosomes {
                a.behavior =
                    crate::controller::assimilate(&a.behavior, &expressed, &cell.brain, 1.);
            }
            Ok(json!(g))
        }
        "installFixture" => crate::fixtures::install(w, v.get("fixture").ok_or("Missing fixture")?),
        "pulse" => crate::fixtures::pulse(w, v.get("pulse").ok_or("Missing pulse")?),
        "pick" => {
            let read = |key: &str| {
                v.get(key)
                    .and_then(Value::as_f64)
                    .filter(|x| x.is_finite())
                    .ok_or_else(|| format!("Invalid picking {key}"))
            };
            let (x, y, padding) = (read("x")?, read("y")?, read("padding")?);
            if !(0. ..=10.).contains(&padding) {
                return Err("Invalid picking tolerance".into());
            }
            let id = w
                .cells
                .iter()
                .filter_map(|cell| {
                    let d = crate::movement::distance_squared([x, y], [cell.x, cell.y], &w.config);
                    (d <= (cell.radius(&w.config) + padding).powi(2)).then_some((cell.id, d))
                })
                .min_by(|a, b| a.1.total_cmp(&b.1))
                .map(|p| p.0);
            Ok(json!(id))
        }
        "diagnosticController" => {
            let logits: [f32; 9] = serde_json::from_value(
                v.get("logits")
                    .cloned()
                    .ok_or("Missing diagnostic logits")?,
            )
            .map_err(|e| e.to_string())?;
            if logits.iter().any(|x| !x.is_finite() || x.abs() > 16.) {
                return Err("Invalid diagnostic logits".into());
            }
            Ok(json!(crate::controller::diagnostic(logits, None)))
        }
        "definition" => Ok(
            json!({"seed":w.seed,"version":w.version,"config":w.config,"chemistry":w.chemistry,"sources":w.sources.iter().map(|s| &s.habitat).collect::<Vec<_>>(),"patchCenters":w.patch_centers}),
        ),
        "ancestry" => {
            let start = v.get("start").and_then(Value::as_u64).unwrap_or(0) as usize;
            let count = v
                .get("count")
                .and_then(Value::as_u64)
                .unwrap_or(1000)
                .min(10000) as usize;
            Ok(json!(
                &w.ancestry[start.min(w.ancestry.len())
                    ..(start.saturating_add(count)).min(w.ancestry.len())]
            ))
        }
        "task" => {
            w.intervention_budget()?;
            let id = number(v, "cell")?;
            let value = number(v, "value")?;
            if value > 255 {
                return Err("Task byte exceeds 255".into());
            }
            let cell = w
                .cells
                .iter_mut()
                .find(|c| c.id == id)
                .ok_or("Cell is no longer alive")?;
            let before = cell.brain.task;
            cell.brain.task = value as u8;
            w.event("override", id, vec![before as u64, value]);
            Ok(json!({"tick":w.tick}))
        }
        "intervene" => {
            w.intervention_budget()?;
            intervene(w, v)
        }
        "studyPolicy" => crate::study_commands::policy(w, v),
        "appendCatalog" => crate::catalog::append(w, v),
        "studySample" => Ok(crate::study_commands::sample(w)),
        "studyBranches" => Ok(crate::study_commands::branches(
            w,
            v.get("lineage").and_then(Value::as_u64).unwrap_or(0),
        )),
        "replaceLineage" => crate::study_commands::replace(w, v),
        "scheduledSource" => crate::study_commands::source(w, v),
        "retireSources" => {
            // Ordinary advancement releases the final inventory before retirement.
            w.sources
                .retain(|s| s.remaining > 0. || s.inventory.iter().any(|q| *q > 0.));
            Ok(json!({}))
        }
        "loadFixture" => {
            let count = number(v, "population")? as usize;
            load_fixture(w, count)?;
            if v.get("growth").and_then(Value::as_bool) == Some(true) {
                for (i, cell) in w.cells.iter_mut().enumerate() {
                    cell.body = cell.body.map(|q| q * if i % 10 == 0 { 2. } else { 1.8 });
                    cell.energy = cell.energy_capacity(&w.config);
                    cell.inventory.fill(0.004);
                }
                crate::diagnostics::initialize(w);
                w.event("growth-load-fixture", 0, vec![count as u64]);
            }
            Ok(observation::summary(w))
        }
        _ => Err("Unknown engine operation".into()),
    }
}
/// Explicit assay interventions are accounted as external grants/removals, never hidden physics.
fn intervene(w: &mut World, v: &Value) -> Result<Value, String> {
    let remove_species = if v.get("removeSpecies").is_some() {
        let s = number(v, "removeSpecies")? as usize;
        if s >= 256 {
            return Err("Invalid removed chemical".into());
        }
        Some(s)
    } else {
        None
    };
    let deposit = if let Some(d) = v.get("deposit") {
        let s = number(d, "species")? as usize;
        let x = d
            .get("x")
            .and_then(Value::as_f64)
            .ok_or("Missing deposit x")?;
        let y = d
            .get("y")
            .and_then(Value::as_f64)
            .ok_or("Missing deposit y")?;
        let q = d
            .get("amount")
            .and_then(Value::as_f64)
            .ok_or("Missing deposit amount")?;
        if s >= 256 || !x.is_finite() || !y.is_finite() || !q.is_finite() || q < 0. {
            return Err("Invalid deposit".into());
        }
        Some((s, x, y, q))
    } else {
        None
    };
    let before = w.held();
    let heat_before = w.ledger.heat();
    let rounding_before = (w.ledger.numerical_material, w.ledger.numerical_energy);
    let target = v.get("cell").and_then(Value::as_u64);
    if let Some(id) = target {
        let index = w
            .cells
            .iter()
            .position(|c| c.id == id)
            .ok_or("Unknown intervention cell")?;
        let mut cell = w.cells[index].clone();
        let mut genotype = None;
        if let Some(value) = v.get("genotype") {
            let mut g: Genotype =
                serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
            g.id = w.next_genome;
            g.parent = Some(cell.genome);
            g.born = w.tick;
            g.validate(&w.config)?;
            g.compile(&w.config, &w.chemistry);
            cell.genome = g.id;
            cell.machinery_genome = g.id;
            cell.installed = g.compiled.as_ref().unwrap().chromosome.chemistry.clone();
            cell.operators = Some(g.compiled.as_ref().unwrap().operators.clone());
            cell.machinery_revision += 1;
            genotype = Some(g);
        }
        if let Some(value) = v.get("inventory") {
            let amounts: Vec<f64> =
                serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
            cell.inventory = amounts.into();
        }
        if let Some(value) = v.get("body") {
            cell.body = serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
        }
        for (name, slot) in [
            ("x", &mut cell.x),
            ("y", &mut cell.y),
            ("heading", &mut cell.heading),
            ("energy", &mut cell.energy),
            ("damage", &mut cell.damage),
        ] {
            if let Some(value) = v.get(name) {
                *slot = value.as_f64().ok_or("Invalid intervention scalar")?;
            }
        }
        if v.get("rebuild").and_then(Value::as_bool) == Some(true) {
            let g = genotype
                .as_ref()
                .unwrap_or_else(|| &w.genomes[&cell.genome]);
            cell.body = g.compiled.as_ref().unwrap().body;
        }
        cell.validate(&w.config)?;
        if let Some(g) = genotype {
            w.next_genome += 1;
            w.genomes.insert(g.id, g);
        }
        if v.get("resetMemory").and_then(Value::as_bool) == Some(true) {
            cell.brain = crate::controller::State::default();
        }
        let compiled = w.genomes[&cell.genome].compiled.as_ref().unwrap();
        sensing::initialize(&mut cell, compiled, &w.config, &w.field);
        w.ancestry[id as usize - 1].genome = cell.genome;
        w.cells[index] = cell;
        if v.get("kill").and_then(Value::as_bool) == Some(true) {
            let cell = w.cells.remove(index);
            w.release_cell(&cell, crate::ancestry::Cause::ConstructedDeath);
        }
    }
    if let Some((s, x, y, q)) = deposit {
        w.field.deposit(x, y, s, q, &w.chemistry);
    }
    if v.get("clearField").and_then(Value::as_bool) == Some(true) {
        w.field.amounts.fill(0.);
        w.field.refresh(&w.chemistry);
    }
    if let Some(s) = remove_species {
        for i in 0..w.field.nx * w.field.ny {
            w.field
                .add(i, s, -(w.field.amounts[i * 256 + s] as f64), &w.chemistry);
        }
    }
    if v.get("clearSources").and_then(Value::as_bool) == Some(true) {
        w.sources.clear();
    }
    let after = w.held();
    w.ledger.supplied += after.0 - before.0 + w.ledger.numerical_material - rounding_before.0;
    w.ledger.supplied_energy += after.1 - before.1 + w.ledger.heat() - heat_before
        + w.ledger.numerical_energy
        - rounding_before.1;
    w.event("intervention", target.unwrap_or(0), vec![]);
    Ok(observation::summary(w))
}
pub fn load_fixture(w: &mut World, population: usize) -> Result<(), String> {
    if w.tick != 0
        || population > w.config.max_population
        || population > w.config.max_ancestry_records
    {
        return Err("Load fixture requires tick zero and valid capacity".into());
    }
    w.cells.clear();
    w.ancestry.clear();
    w.sources.clear();
    w.genomes.retain(|id, _| *id == 1);
    w.next_cell = 1;
    w.next_genome = 2;
    let mut rng = Random::new(w.seed ^ 0x10ad_u64);
    let cols = (population as f64 * w.config.width / w.config.height)
        .sqrt()
        .ceil()
        .max(1.) as usize;
    let rows = population.div_ceil(cols).max(1);
    for i in 0..population {
        let mut g = w.genomes[&1].clone();
        g.id = w.next_genome;
        g.parent = Some(1);
        g.compiled = None;
        for a in &mut g.chromosomes {
            for e in &mut a.chemistry.enzymes {
                e.x = rng.unit() * 15.;
                e.y = rng.unit() * 15.;
                e.dx = rng.unit() * 30. - 15.;
                e.dy = rng.unit() * 30. - 15.;
            }
            for t in &mut a.chemistry.transporters {
                t.x = rng.unit() * 15.;
                t.y = rng.unit() * 15.;
            }
            for r in &mut a.chemistry.receptors {
                r.x = rng.unit() * 15.;
                r.y = rng.unit() * 15.;
            }
            a.chemistry.membrane.x = rng.unit() * 15.;
            a.chemistry.membrane.y = rng.unit() * 15.;
            crate::controller::diagnostics::perturb_weights(&mut a.behavior, &mut rng);
        }
        g.compile(&w.config, &w.chemistry);
        let x =
            (i % cols) as f64 / cols as f64 * w.config.width + w.config.width / (2. * cols as f64);
        let y = (i / cols) as f64 / rows as f64 * w.config.height
            + w.config.height / (2. * rows as f64);
        let mut cell = Cell::new(
            w.next_cell,
            g.id,
            g.compiled.as_ref().unwrap(),
            &w.config,
            x,
            y,
            rng.unit() * std::f64::consts::TAU,
        );
        cell.energy = cell.energy_capacity(&w.config);
        cell.inventory.fill(0.001);
        w.ancestry.push(Ancestor {
            id: cell.id,
            parent: 0,
            lineage: cell.id,
            genome: g.id,
            born: 0,
            ended: crate::ancestry::ALIVE,
            cause: crate::ancestry::Cause::Alive,
        });
        w.genomes.insert(g.id, g);
        w.cells.push(cell);
        w.next_cell += 1;
        w.next_genome += 1;
    }
    for (i, q) in w.field.amounts.iter_mut().enumerate() {
        *q = (1e-5 * (1. + 0.2 * ((i % 997) as f64).sin())) as f32;
    }
    w.field.refresh(&w.chemistry);
    for cell in &mut w.cells {
        sensing::initialize(
            cell,
            w.genomes[&cell.genome].compiled.as_ref().unwrap(),
            &w.config,
            &w.field,
        );
    }
    w.ledger = crate::accounting::Ledger::default();
    let (matter, energy) = w.held();
    w.ledger.initial_material = matter;
    w.ledger.initial_energy = energy;
    w.event("load-fixture", 0, vec![population as u64]);
    Ok(())
}
pub fn create(v: &Value) -> Result<World, String> {
    if let Some(d) = v.get("diagnostic") {
        let name = d
            .get("name")
            .and_then(Value::as_str)
            .ok_or("Missing diagnostic name")?;
        if name == "isolated-source" {
            return crate::startup_probe::isolated(
                d.get("seed").and_then(Value::as_u64).unwrap_or(101),
                d.get("second").and_then(Value::as_bool).unwrap_or(false),
                d.get("founders").and_then(Value::as_u64).unwrap_or(1) as usize,
            );
        }
        if name != "nutrition" {
            return crate::opportunities::create(name);
        }
        let interval = d.get("interval").and_then(Value::as_f64).unwrap_or(0.8);
        let mesh = d.get("mesh").and_then(Value::as_f64).unwrap_or(2.);
        if ![0.2, 0.4, 0.8].contains(&interval) || ![1., 2., 4.].contains(&mesh) {
            return Err("Unregistered diagnostic resolution".into());
        }
        return Ok(crate::diagnostics::nutrition(
            interval,
            mesh,
            d.get("supply").and_then(Value::as_bool).unwrap_or(true),
            d.get("moving").and_then(Value::as_bool).unwrap_or(false),
        ));
    }
    let seed = v.get("seed").and_then(Value::as_u64).unwrap_or(27);
    let config: Config = serde_json::from_value(v.get("config").cloned().unwrap_or(json!({})))
        .map_err(|e| e.to_string())?;
    World::new(seed, config)
}
