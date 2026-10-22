//! Snapshot-neutral, current-law marginal enzyme and biomass-resource diagnostics.
use antropy_engine::{accounting, controller, metabolism, optics, organism::Cell, world::World};
use serde_json::{Value, json};
use std::{fs, io::Write, path::Path};
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

fn reaction(w: &World, original: &Cell, drive: [f64; 2], omitted: Option<usize>) -> Value {
    let mut cell = original.clone();
    cell.flows = Default::default();
    if let Some(slot) = omitted {
        cell.action.activity[slot] = 0.;
    }
    metabolism::react_observed(
        &mut cell,
        &w.config,
        &w.chemistry,
        w.config.physiology_interval,
        false,
        drive,
    );
    let net = cell.energy - original.energy;
    json!({"netReactionWork":net,"grossCaptured":cell.flows.captured,
        "uphillWork":cell.flows.captured-net,"reacted":cell.flows.reacted,
        "externalWork":cell.flows.external_work})
}

fn census(w: &World) -> Value {
    let sites: Vec<_> = w
        .cells
        .iter()
        .map(|c| antropy_engine::footprint::sites(c, &w.config, &w.field))
        .collect();
    let exposures = optics::observed_cell_exposures(w, &sites);
    let cells: Vec<_> = w
        .cells
        .iter()
        .zip(exposures)
        .map(|(cell, (signal, exposure))| {
            let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
            let drive = antropy_engine::illumination::drive(signal, exposure.drive());
            let baseline = reaction(w, cell, drive, None);
            let omitted: Vec<_> = (0..8)
                .map(|slot| reaction(w, cell, drive, Some(slot)))
                .collect();
            let target = 2. * g.body.iter().sum::<f64>();
            let material = cell.material();
            let protected = cell.capacity(&w.config) * w.config.protected_inventory_fraction;
            let requested = (target - cell.mass())
                .max(0.)
                .min(
                    w.config.physiology_interval
                        * w.config.growth_rate
                        * cell.mass()
                        * (1. - cell.damage),
                )
                .min((material - protected).max(0.));
            let proposed = antropy_engine::physiology::body(g, cell.mass() + requested);
            let reserve = accounting::interval_reserve(cell, &proposed, &w.config, w.tick);
            json!({"id":cell.id,"genome":cell.genome,"generation":cell.generation,
            "position":[cell.x,cell.y],"age":cell.age(&w.config,w.tick),
            "mass":cell.mass(),"targetMass":target,"body":cell.body,"inventory":cell.inventory,
            "material":material,"capacity":cell.capacity(&w.config),"protected":protected,
            "growthRequest":requested,"growthReserve":reserve,
            "energy":cell.energy,"energyCapacity":cell.energy_capacity(&w.config),
            "divisionRequirements":accounting::division_requirements(cell,&w.config,w.tick),
            "damage":cell.damage,"action":cell.action,"inputs":cell.inputs,
            "allocation":controller::observed_state(&cell.brain).allocation,
            "chemicalFlows":{"imported":cell.chemical_flows.imported,
                "exported":cell.chemical_flows.exported},
            "flows":cell.flows,"solar":exposure.solar,"drive":drive,
            "baseline":baseline,"omitEnzyme":omitted})
        })
        .collect();
    json!({"tick":w.tick,"config":w.config,"cells":cells,"ticksAdvanced":0,
        "limitations":"Fixed current private mixture, efforts and snapshot light; one ordinary physiological reaction solve per clone. Omitting an enzyme changes donor competition. Excludes subsequent uptake, action response, repair, growth, births and neighborhood feedback. A marginal reaction benefit is not lifecycle benefit."})
}

fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 2 {
        return Err("Usage: resource_bottlenecks CHECKPOINT NEW_JSON".into());
    }
    let w = World::restore(&fs::read(&args[0])?)?;
    let before = w.snapshot()?;
    let result = census(&w);
    if w.snapshot()? != before {
        return Err("Census altered physical state".into());
    }
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(Path::new(&args[1]))?;
    serde_json::to_writer(&mut file, &result)?;
    file.write_all(b"\n")?;
    println!("tick={} cells={} snapshot-neutral", w.tick, w.cells.len());
    Ok(())
}
