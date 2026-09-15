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
        thermal_energy: 0.,
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
}

pub fn retarget(g: &mut crate::genetics::Genotype, slot: usize, from: usize, to: usize) {
    let a = Target::species(from);
    let b = Target::species(to);
    for ch in &mut g.chromosomes {
        ch.chemistry.receptors[slot] = a;
        ch.chemistry.transporters[slot] = crate::genetics::Transporter {
            x: a.x,
            y: a.y,
            export: false,
        };
        ch.chemistry.enzymes[slot] = crate::genetics::Enzyme {
            x: a.x,
            y: a.y,
            dx: (b.x - a.x) as i8,
            dy: (b.y - a.y) as i8,
        };
    }
}
