//! One output-row lesion in a captured neighborhood with exact descendant-cohort accounts.
use antropy_engine::{
    accounting::Ledger,
    ancestry, controller, observation,
    phenotype::{Observer, Pin, Selection},
    world::World,
};
use serde_json::{Value, json};
use std::{collections::BTreeSet, fs, io::Write, path::Path, time::Instant};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

fn save(path: &Path, value: &Value) -> Result<()> {
    let mut f = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    serde_json::to_writer(&mut f, value)?;
    f.write_all(b"\n")?;
    Ok(())
}

fn lesion(w: &mut World, id: u64, slot: usize, key: Option<(usize, f64)>) -> Result<()> {
    let cell = w
        .cells
        .iter_mut()
        .find(|c| c.id == id)
        .ok_or("Missing focal")?;
    let original = cell.genome;
    let mut g = w.genomes[&original].clone();
    for ch in &mut g.chromosomes {
        if let Some((coordinate, value)) = key {
            ch.chemistry
                .keys
                .as_mut()
                .ok_or("Key intervention needs keyed genetics")?
                .enzymes[slot]
                .weights[coordinate] = value;
        } else {
            ch.behavior = controller::diagnostics::silence_enzyme(&ch.behavior, slot)?;
        }
    }
    g.id = w.next_genome;
    g.parent = Some(original);
    g.born = w.tick;
    g.validate(&w.config)?;
    g.compile(&w.config, &w.chemistry);
    let prior = json!({"cell":cell,"body":cell.body});
    antropy_engine::physiology::express(cell, g.compiled.as_ref().unwrap());
    if json!({"cell":cell,"body":cell.body}) != prior {
        return Err("Output lesion changed funded assets".into());
    }
    cell.genome = g.id;
    ancestry::get_mut(&mut w.ancestry, id)
        .ok_or("Missing ancestry")?
        .genome = g.id;
    w.next_genome += 1;
    w.genomes.insert(g.id, g);
    Ok(())
}

fn sample(w: &World, ledger: &Ledger, initial_energy: f64, initial_mass: f64) -> Value {
    let pin = w.observer.as_ref().unwrap().pin.as_ref().unwrap();
    let cells: Vec<_> = w
        .cells
        .iter()
        .filter(|c| pin.live.contains(&c.id))
        .map(|c| {
            json!({"id":c.id,"parent":c.parent,"mass":c.mass(),"inventory":c.material(),
            "energy":c.energy,"damage":c.damage,"action":c.action,
            "allocation":controller::observed_state(&c.brain).allocation,"inputs":c.inputs,
            "inventoryMixture":c.inventory,"chemicalFlows":c.chemical_flows})
        })
        .collect();
    let energy: f64 = w
        .cells
        .iter()
        .filter(|c| pin.live.contains(&c.id))
        .map(|c| c.energy)
        .sum();
    let mass: f64 = w
        .cells
        .iter()
        .filter(|c| pin.live.contains(&c.id))
        .map(|c| c.mass())
        .sum();
    json!({"tick":w.tick,"cells":cells,"population":pin.live.len(),"mass":mass,"energy":energy,
        "netBiomass":mass-initial_mass,"netFundedWork":energy+ledger.flows.growth-initial_energy,
        "ledger":ledger})
}

fn run(
    input: &Path,
    root: &Path,
    id: u64,
    slot: usize,
    altered: bool,
    key: Option<(usize, f64)>,
) -> Result<()> {
    let mut w = World::restore(&fs::read(input)?)?;
    w.config.mutation_rate = 0.;
    w.config.physical_mutation_rate = 0.;
    w.config.learning_retention = 0.;
    w.trace = None;
    if altered {
        lesion(&mut w, id, slot, key)?;
    }
    // Both arms prepare the same ordinary inference boundary without dropping private memory.
    for cell in &mut w.cells {
        controller::invalidate(&mut cell.brain);
    }
    let focal = w.cells.iter().find(|c| c.id == id).ok_or("Missing focal")?;
    let (initial_energy, initial_mass) = (focal.energy, focal.mass());
    let before = w.snapshot()?;
    let budget =
        antropy_engine::commands::execute(&mut w, &json!({"op":"bindingBudget","cell":id}))?;
    if w.snapshot()? != before {
        return Err("Budget changed physical state".into());
    }
    let mut observer = Observer::new(w.tick);
    observer.selection = Selection::Pin;
    observer.pin = Some(Pin {
        id: "enzyme-lesion".into(),
        label: "Focal descendants".into(),
        started: w.tick,
        roots: BTreeSet::from([id]),
        live: BTreeSet::from([id]),
    });
    w.observer = Some(Box::new(observer));
    let arm = match (altered, key.is_some()) {
        (false, _) => "reference",
        (true, false) => "silenced",
        (true, true) => "key",
    };
    let dir = root.join(format!("{id}-{slot}-{arm}"));
    fs::create_dir(&dir)?;
    fs::write(dir.join("initial.bin"), before)?;
    save(
        &dir.join("initial.json"),
        &json!({"cell":w.cells.iter().find(|c|c.id==id),
        "genotype":w.genomes[&w.cells.iter().find(|c|c.id==id).unwrap().genome],"budget":budget}),
    )?;
    let start = w.tick;
    let timer = Instant::now();
    let mut ledger = Ledger::default();
    let (mut imports, mut exports) = ([0.; 256], [0.; 256]);
    let mut samples = vec![sample(&w, &ledger, initial_energy, initial_mass)];
    let mut reason = "horizon";
    while (w.tick - start) as f64 * w.config.dt < 80. {
        if timer.elapsed().as_secs_f64() > 240. {
            reason = "wall cap";
            break;
        }
        if w.stop_reason.is_some() {
            return Err(format!("Runtime failure: {:?}", w.stop_reason).into());
        }
        w.step();
        let o = w.observer.as_mut().unwrap();
        let group = &o.current.groups[2];
        ledger.accumulate(&group.ledger.flows);
        ledger.overflow_heat += group.ledger.overflow_heat;
        ledger.division_heat += group.ledger.division_heat;
        for s in 0..256 {
            imports[s] += group.imports[s];
            exports[s] += group.exports[s];
        }
        let extinct = o.pin.as_ref().unwrap().live.is_empty();
        let cohort_size = o.pin.as_ref().unwrap().live.len();
        o.reset(w.tick);
        if (w.tick - start).is_multiple_of(20)
            || ((w.tick - start) <= 16 && (w.tick - start).is_multiple_of(4))
            || extinct
        {
            samples.push(sample(&w, &ledger, initial_energy, initial_mass));
        }
        if extinct {
            reason = "cohort extinction";
            break;
        }
        if cohort_size > 64 {
            reason = "cohort cap";
            break;
        }
    }
    w.validate()?;
    save(
        &dir.join("result.json"),
        &json!({"arm":arm,"focal":id,"slot":slot,
        "start":start,"end":w.tick,"modelSeconds":(w.tick-start) as f64*w.config.dt,
        "wallSeconds":timer.elapsed().as_secs_f64(),"reason":reason,
        "final":sample(&w,&ledger,initial_energy,initial_mass),"samples":samples,
        "imports":imports.as_slice(),"exports":exports.as_slice(),
        "ending":ancestry::get(&w.ancestry,id),"summary":observation::summary(&w)}),
    )?;
    println!(
        "focal={id} slot={slot} arm={arm} seconds={} reason={reason}",
        (w.tick - start) as f64 * w.config.dt
    );
    Ok(())
}

fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 4 && args.len() != 6 {
        return Err(
            "Usage: enzyme_counterfactual CHECKPOINT NEW_ROOT FOCAL SLOT [KEY_COORDINATE VALUE]"
                .into(),
        );
    }
    let root = Path::new(&args[1]);
    let id = args[2].parse()?;
    let slot: usize = args[3].parse()?;
    let key = if args.len() == 6 {
        Some((args[4].parse::<usize>()?, args[5].parse::<f64>()?))
    } else {
        None
    };
    if slot >= 8 || key.is_some_and(|(j, v)| j >= 8 || !v.is_finite() || v.abs() > 1.) {
        return Err("Outside inherited enzyme/key domain".into());
    }
    fs::create_dir(root)?;
    save(
        &root.join("registration.json"),
        &json!({"checkpoint":args[0],"focal":id,"slot":slot,
        "keyIntervention":key,
        "question":"Does a marginally harmful active enzyme remain harmful through ordinary local uptake, response and replacement; can selective recognition preserve its useful conversions?",
        "competingExplanations":["Donor competition or uphill conversion wastes usable work","Immediate loss is investment in a useful downstream product"],
        "prediction":"Silencing raises usable reserves and funded growth if the reaction loss is wasteful; a reversal retains the downstream-investment explanation.",
        "decision":"Whether accepted activity alone supplies a useful specialization target, and whether chemistry or controller allocation needs further design.",
        "modelSecondsPerArm":80,"wallSecondsPerArm":240,"maxCohort":64,
        "newMutation":false,"birthAssimilation":false,"privateLearning":"ordinary paid",
        "controls":"All starting physical assets and neighbors retained; intervention changes one inherited output row or one declared enzyme-key scalar, common inference invalidation; no granted supply, price or work."}),
    )?;
    rayon::ThreadPoolBuilder::new()
        .num_threads(4)
        .build()?
        .install(|| {
            run(Path::new(&args[0]), root, id, slot, false, key)
                .and_then(|()| run(Path::new(&args[0]), root, id, slot, true, key))
                .map_err(|e| e.to_string())
        })?;
    Ok(())
}
