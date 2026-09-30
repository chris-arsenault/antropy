//! Registered fixture preparation only; the ordinary quick runner owns advancement and data.
use antropy_engine::{config::Config, controller, diagnostics, organism, world::World};
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

fn isolated(dark: bool) -> Result<World, String> {
    let c = Config {
        width: 32.,
        height: 32.,
        founders: 1,
        source_count: 0,
        source_zones: None,
        source_epochs: None,
        illumination_contrast: 0.,
        shade_strength: 0.,
        learning: "static".into(),
        mutation_rate: 0.,
        physical_mutation_rate: 0.,
        learning_retention: 0.,
        ..Config::default()
    };
    let mut w = World::new(701, c)?;
    let g = w.genomes.get_mut(&1).unwrap();
    for (slot, (from, to)) in [(0, 128), (128, 136), (136, 8), (8, 0)]
        .into_iter()
        .enumerate()
    {
        diagnostics::retarget(g, slot, from, to);
    }
    for ch in &mut g.chromosomes {
        let mut logits = vec![0.; controller::TOTAL_OUTPUTS];
        logits[2] = 3.; // ordinary repair
        logits[4] = -1.;
        logits[controller::ACTIVITY..controller::COVER].fill(3.);
        ch.behavior = controller::diagnostics::authored(logits, None)?;
    }
    g.compile(&w.config, &w.chemistry);
    let cell = &mut w.cells[0];
    cell.x = 16.;
    cell.y = 16.;
    cell.heading = 0.;
    cell.inventory.fill(0.);
    for s in [0, 128, 136, 8] {
        cell.inventory.set(s, 0.2);
    }
    if dark {
        std::sync::Arc::make_mut(&mut w.shade).transmission.fill(0.);
        w.field.illumination.shade = w.shade.clone();
    }
    diagnostics::initialize(&mut w);
    w.validate()?;
    Ok(w)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = std::env::args()
        .nth(1)
        .ok_or("Expected new output directory")?;
    let output = Path::new(&root);
    fs::create_dir(output)?;
    let mut records = vec![];
    let cases = [
        "isolated-light",
        "isolated-dark",
        "avoidance",
        "straight",
        "growth-light",
        "growth-dark",
    ];
    for name in cases {
        let mut w = isolated(name.ends_with("dark"))?;
        if matches!(name, "avoidance" | "straight") {
            avoidance(&mut w, name == "avoidance")?;
        }
        if name.starts_with("growth") {
            growth(&mut w)?;
        }
        let cell = &w.cells[0];
        records.push(json!({"name":name,"body":cell.body,
            "inventory":cell.material(),"energy":cell.energy,
            "maintenancePerSecond":organism::maintenance_rate(&cell.body,cell.damage,cell.age(&w.config,w.tick),&w.config),
            "motorPower":cell.body[1]*w.config.motor_power_density,
            "summary":antropy_engine::observation::summary(&w)}));
        save(&output.join(format!("{name}.bin")), &w.snapshot()?)?;
    }
    save(
        &output.join("preparation.json"),
        &serde_json::to_vec(&json!({
            "registration":"docs/plans/archive/ECOLOGICAL-INCENTIVES-PLAN.md",
            "records":records,"learning":"static; mutation and assimilation disabled",
            "provisioning":"Ordinary founder stocks; four declared cyclic enzymes, total free matter 0.8"
        }))?,
    )?;
    if std::env::args().nth(2).as_deref() == Some("capacity") {
        for count in [48, 2000] {
            let mut w = World::new(701, Config::default())?;
            if count > 48 {
                antropy_engine::commands::load_fixture(&mut w, count)?;
            }
            save(
                &output.join(format!("capacity-{count}.bin")),
                &w.snapshot()?,
            )?;
        }
    }
    if std::env::args().nth(2).as_deref() == Some("colonies") {
        for crowded in [false, true] {
            let w = colony(crowded)?;
            let name = if crowded { "crowded" } else { "spread" };
            save(&output.join(format!("{name}.bin")), &w.snapshot()?)?;
        }
    }
    Ok(())
}

fn colony(crowded: bool) -> Result<World, String> {
    let mut base = isolated(false)?;
    growth(&mut base)?;
    let mut config = base.config.clone();
    config.founders = 16;
    let mut w = World::new(701, config)?;
    let g = base.genomes[&1].clone();
    let compiled = g.compiled.as_ref().unwrap();
    for i in 0..16 {
        let spacing = if crowded { 0.45 } else { 4. };
        let position = [
            16. + (i % 4) as f64 * spacing - 1.5 * spacing,
            16. + (i / 4) as f64 * spacing - 1.5 * spacing,
        ];
        w.cells[i] = organism::Cell::new(
            i as u64 + 1,
            1,
            compiled,
            &w.config,
            &w.chemistry,
            position,
            (i % 4) as f64 * std::f64::consts::FRAC_PI_2,
        );
        w.cells[i].inventory = base.cells[0].inventory.clone();
        w.ancestry[i].genome = 1;
    }
    w.genomes.insert(1, g);
    antropy_engine::fixtures::pulse(&mut w, &json!({"mixture":[[0,51.2]]}))?;
    diagnostics::initialize(&mut w);
    w.validate()?;
    Ok(w)
}

fn growth(w: &mut World) -> Result<(), String> {
    let g = w.genomes.get_mut(&1).unwrap();
    for ch in &mut g.chromosomes {
        let mut logits = vec![0.; controller::TOTAL_OUTPUTS];
        logits[0] = 0.5;
        logits[2] = 3.;
        logits[4] = -1.;
        logits[5] = 3.;
        logits[controller::ACTIVITY..controller::COVER].fill(3.);
        ch.behavior = controller::diagnostics::authored(logits, None)?;
    }
    g.compile(&w.config, &w.chemistry);
    antropy_engine::fixtures::pulse(w, &json!({"mixture":[[0,51.2]]}))?;
    diagnostics::initialize(w);
    Ok(())
}

fn avoidance(w: &mut World, respond: bool) -> Result<(), String> {
    let g = w.genomes.get_mut(&1).unwrap();
    for ch in &mut g.chromosomes {
        ch.chemistry.receptors[0] = antropy_engine::genetics::Target::species(136);
        let mut logits = vec![0.; controller::TOTAL_OUTPUTS];
        logits[0] = 0.5;
        logits[2] = 3.;
        logits[4] = -1.;
        logits[controller::ACTIVITY..controller::COVER].fill(3.);
        ch.behavior = controller::diagnostics::authored(
            logits,
            if respond { Some((3, 1, -16.)) } else { None },
        )?;
    }
    g.compile(&w.config, &w.chemistry);
    w.cells[0].x = 20.;
    w.cells[0].heading = std::f64::consts::FRAC_PI_2;
    antropy_engine::fixtures::pulse(
        w,
        &json!({"mixture":[[136,96.]],"center":[16.,16.],"sigma":3.}),
    )?;
    diagnostics::initialize(w);
    Ok(())
}
