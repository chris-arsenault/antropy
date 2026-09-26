//! Prepare actual saved physiology for the ordinary quick runner; never advances ticks.
use antropy_engine::{accounting::Ledger, controller, fixtures, footprint, world::World};
use serde_json::json;
use std::{fs, io::Write, path::Path};

fn save(path: &Path, bytes: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
    fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?
        .write_all(bytes)?;
    Ok(())
}

fn prepare(source: &World, selections: &[usize], clustered: bool) -> Result<World, String> {
    let mut config = source.config.clone();
    config.width = 32.;
    config.height = 32.;
    config.founders = selections.len();
    config.source_count = 0;
    config.source_zones = None;
    config.source_epochs = None;
    config.illumination_contrast = 0.;
    config.shade_strength = 0.;
    config.mutation_rate = 0.;
    config.physical_mutation_rate = 0.;
    config.learning_retention = 0.;
    config.transmission = "clonal".into();
    // Keep the saved plastic controller and acquired traces; private learning remains paid.
    let mut w = World::new(27, config)?;
    for (i, &index) in selections.iter().enumerate() {
        let original = &source.cells[index];
        let mut g = source.genomes[&original.genome].clone();
        g.id = if original.id == 421509 { 1 } else { 2 };
        g.parent = None;
        g.born = 0;
        let mut c = original.clone();
        c.id = i as u64 + 1;
        c.parent = None;
        c.lineage = c.id;
        c.genome = g.id;
        c.born = 0;
        c.generation = 0;
        let spacing = if clustered { 0.45 } else { 6. };
        c.x = 16.
            + if selections.len() == 1 {
                0.
            } else {
                (i as f64 % 4. - 1.5) * spacing
            };
        c.y = 16.
            + if selections.len() == 1 {
                0.
            } else {
                ((i / 4) as f64 - 1.5) * spacing
            };
        c.heading = i as f64 % 4. * std::f64::consts::FRAC_PI_2;
        c.flows = Default::default();
        c.chemical_flows = Default::default();
        c.contacts = [0.; 4];
        c.interface = Default::default();
        controller::invalidate(&mut c.brain);
        w.ancestry[i].genome = g.id;
        w.genomes.insert(g.id, g);
        w.cells[i] = c;
    }
    w.next_genome = w.next_genome.max(3);
    let (initial_material, initial_energy) = w.held();
    w.ledger = Ledger {
        initial_material,
        initial_energy,
        ..Ledger::default()
    };
    w.validate()?;
    Ok(w)
}

fn mixtures(source: &World, indices: &[usize]) -> [Vec<(usize, f64)>; 3] {
    let homes: Vec<Vec<(usize, f64)>> = indices
        .iter()
        .map(|&i| {
            let sites = footprint::sites(&source.cells[i], &source.config, &source.field);
            (0..256)
                .filter_map(|s| {
                    let density = source.field.sample(s, &sites);
                    (density > 0.).then_some((s, density * 1024.))
                })
                .collect()
        })
        .collect();
    [
        vec![(0, 51.2), (136, 51.2)],
        homes[0].clone(),
        homes[1].clone(),
    ]
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 2 {
        return Err("Expected checkpoint and NEW output directory".into());
    }
    let source = World::restore(&fs::read(&args[0])?)?;
    let output = Path::new(&args[1]);
    fs::create_dir(output)?;
    let indices: Vec<_> = [421509, 439026]
        .iter()
        .map(|id| {
            source
                .cells
                .iter()
                .position(|c| c.id == *id)
                .expect("Registered cell missing")
        })
        .collect();
    let mixtures = mixtures(&source, &indices);
    let mut records = vec![];
    for (habitat, mixture) in mixtures.iter().enumerate() {
        for variant in 0..2 {
            let mut w = prepare(&source, &[indices[variant]], false)?;
            fixtures::pulse(&mut w, &json!({"mixture":mixture}))?;
            let name = format!("probe-v{variant}-h{habitat}");
            records.push(json!({"name":name,"variant":variant,"habitat":habitat,
                "sourceCell":source.cells[indices[variant]].id,"mixture":mixture,
                "inventory":w.cells[0].material(),"capacity":w.cells[0].capacity(&w.config),
                "summary":antropy_engine::observation::summary(&w)}));
            save(&output.join(format!("{name}.bin")), &w.snapshot()?)?;
        }
        for clustered in [false, true] {
            let selections: Vec<_> = (0..16).map(|i| indices[(i / 4) % 2]).collect();
            let mut w = prepare(&source, &selections, clustered)?;
            fixtures::pulse(&mut w, &json!({"mixture":mixture}))?;
            let name = format!(
                "population-h{habitat}-{}",
                if clustered { "close" } else { "spread" }
            );
            save(&output.join(format!("{name}.bin")), &w.snapshot()?)?;
        }
    }
    save(
        &output.join("preparation.json"),
        &serde_json::to_vec(&json!({
            "source":args[0],"tick":source.tick,"records":records,
            "learning":"Saved plastic learning remains enabled and paid; mutation and assimilation disabled",
            "provisioning":"Actual copied physiology booked as initial matter/work; no assembly, excess starter inventory or repeated state override"
        }))?,
    )?;
    Ok(())
}
