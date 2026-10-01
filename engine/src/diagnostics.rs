//! Constructed, declared assay conditions. All advancement uses World::step.
use crate::{config::Config, controller, genetics::Target, sensing, world::World};

pub fn nutrition(interval: f64, mesh: f64, supply: bool, moving: bool) -> World {
    let c = Config {
        width: 24.,
        height: 24.,
        mesh,
        physiology_interval: interval,
        founders: 1,
        source_count: 0,
        learning: "static".into(),
        mutation_rate: 0.,
        physical_mutation_rate: 0.,
        ..Config::default()
    };
    let mut w = World::new(101, c).unwrap();
    let g = w.genomes.get_mut(&1).unwrap();
    for a in &mut g.chromosomes {
        a.behavior = if moving {
            controller::seed()
        } else {
            controller::diagnostic([0., 0., 2., 0., -1., 2., 2., 0., 0.], None)
        };
    }
    g.compile(&w.config, &w.chemistry);
    w.cells[0].x = 12.;
    w.cells[0].y = 12.;
    w.cells[0].heading = 0.;
    if supply {
        // A normalized finite patch; no replenishment or special food carrier.
        let mut sites = vec![];
        let mut total = 0.;
        for i in 0..w.field.nx * w.field.ny {
            let x = (i % w.field.nx) as f64 * mesh + mesh / 2.;
            let y = (i / w.field.nx) as f64 * mesh + mesh / 2.;
            let q = (-((x - 12.).powi(2) + (y - 12.).powi(2)) / 8.).exp();
            total += q;
            sites.push((i, q));
        }
        for (i, q) in sites {
            for &s in &w.config.source_species {
                w.field.add(i, s, 24. * q / total, &w.chemistry);
            }
        }
    }
    initialize(&mut w);
    w
}

pub fn initialize(w: &mut World) {
    for source in &mut w.sources {
        source.rebase_supply();
    }
    for cell in &mut w.cells {
        if w.tick == 0 {
            let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
            crate::physiology::express(cell, g);
        }
        sensing::initialize(
            cell,
            w.genomes[&cell.genome].compiled.as_ref().unwrap(),
            &w.config,
            &w.field,
        );
    }
    crate::mortality::rebase(w);
    w.ledger = crate::accounting::Ledger::default();
    let (matter, energy) = w.held();
    w.ledger.initial_material = matter;
    w.ledger.initial_energy = energy;
}

/// Registered operating stress: full film support and ordinary paid optical actions.
pub fn optical_load(w: &mut World) {
    let column = (w.config.mesh.powi(2) * w.config.optical_column) as f32;
    w.cover.replace_material(&w.chemistry, |i| {
        if i % 256 == (i / 256) % 256 {
            column
        } else {
            0.
        }
    });
    for g in w.genomes.values_mut() {
        for chromosome in &mut g.chromosomes {
            controller::programs::optical(&mut chromosome.behavior, 3., 3., None);
        }
        g.compile(&w.config, &w.chemistry);
    }
    crate::cover::refresh(w);
    initialize(w);
    w.event("optical-load-fixture", 0, vec![]);
}

/// Fixed operating fixture: every nth genotype speaks; zero selects a silent control.
pub fn speech_load(w: &mut World, every: usize) -> Result<serde_json::Value, String> {
    if w.tick != 0 || every > w.cells.len() {
        return Err("Speech load requires tick zero and a bounded stride".into());
    }
    for (i, g) in w.genomes.values_mut().enumerate() {
        for ch in &mut g.chromosomes {
            controller::programs::speech(
                &mut ch.behavior,
                i as u8,
                if every > 0 && i % every == 0 { 3. } else { -3. },
            );
        }
        g.compile(&w.config, &w.chemistry);
    }
    initialize(w);
    w.event("speech-load-fixture", 0, vec![every as u64]);
    Ok(crate::observation::summary(w))
}

pub fn retarget(g: &mut crate::genetics::Genotype, slot: usize, from: usize, to: usize) {
    let a = Target::species(from);
    let b = Target::species(to);
    for ch in &mut g.chromosomes {
        ch.chemistry.receptors[slot] = a;
        ch.chemistry.transporters[slot] = crate::genetics::Transporter { x: a.x, y: a.y };
        ch.chemistry.enzymes[slot] = crate::genetics::Enzyme::between(a.point(), b.point());
    }
}
