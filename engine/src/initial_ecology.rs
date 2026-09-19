//! Accounted initial material and ordinary mutable founders; no special advancement rules.
use crate::{config::Config, genetics, organism::Cell, world::World};
pub const CIRCUIT: [usize; 4] = [0, 128, 136, 8];

/// Initial byproducts only; their later replenishment must come from ordinary conversions.
pub fn prime(
    sources: &[crate::sources::Source],
    c: &Config,
    chemistry: &crate::chemistry::Chemistry,
    field: &mut crate::field::Field,
) {
    for source in sources {
        // The existing priming fraction sets a finite initial concentration at the footprint.
        for s in [128, 8] {
            for &(n, w) in &source.footprint {
                field.add(
                    n,
                    s,
                    0.5 * c.source_priming * source.interface * w,
                    chemistry,
                );
            }
        }
    }
}

pub fn fund(cell: &mut Cell, c: &Config, role: usize) {
    let from = CIRCUIT[role % 4];
    let to = CIRCUIT[(role + 1) % 4];
    let input = 0.4349583333333333 / 0.8;
    cell.inventory.fill(0.);
    cell.inventory.set(from, c.founder_inventory * input);
    cell.inventory.set(to, c.founder_inventory * (1. - input));
    cell.bound_material.fill(0.);
    cell.bound_material.set(from, cell.mass() * input);
    cell.bound_material.set(to, cell.mass() * (1. - input));
}

pub fn probe(role: usize, driven: bool) -> Result<World, String> {
    let config = Config {
        width: 24.,
        height: 24.,
        founders: 1,
        source_count: 4,
        source_species: vec![0, 136],
        source_priming: 0.,
        source_drift: 0.,
        weathering_rate: 0.,
        washout: 0.,
        source_processing: 0.,
        mutation_rate: 0.,
        physical_mutation_rate: 0.,
        learning: "static".into(),
        division_work_per_core: 100.,
        environmental_work: if driven {
            crate::transformation_work::DEFAULT_STRENGTH
        } else {
            0.
        },
        ..Config::default()
    };
    let mut w = World::new(27, config)?;
    let mut g = genetics::founder::circuit(&w.config, &w.chemistry, role);
    g.id = 1;
    for a in &mut g.chromosomes {
        a.behavior =
            crate::controller::diagnostic([0., 0., 3., 0., -1., 1.5, 1.5, -0.15, -0.15], None);
    }
    g.compile(&w.config, &w.chemistry);
    w.cells[0] = Cell::new(
        1,
        1,
        g.compiled.as_ref().unwrap(),
        &w.config,
        &w.chemistry,
        [12., 12.],
        0.,
    );
    fund(&mut w.cells[0], &w.config, role);
    w.cells[0].damage = 0.2;
    w.genomes.insert(1, g);
    for source in &mut w.sources {
        source.habitat.x = 12.;
        source.habitat.y = 12.;
        source.habitat.radius = 3.;
        source.inventory.fill(0.);
        source.inventory[0] = 1000.;
        source.inventory[136] = 1000.;
        source.rate = 0.;
        source.remaining = 1e6;
        source.rebuild(&w.config, &w.field);
    }
    w.field.drift = 0.;
    for n in 0..w.field.nx * w.field.ny {
        for s in CIRCUIT {
            w.field
                .add(n, s, 0.02 * w.config.mesh.powi(2), &w.chemistry);
        }
    }
    crate::source_medium::project(&mut w);
    crate::diagnostics::initialize(&mut w);
    Ok(w)
}

pub fn delivery(enabled: bool, swap: bool) -> Result<World, String> {
    let mut w = probe(2, true)?;
    w.cells.clear();
    w.genomes.clear();
    w.ancestry.clear();
    for (i, role) in [2, 3].into_iter().enumerate() {
        let mut g = genetics::founder::circuit(&w.config, &w.chemistry, role);
        g.id = i as u64 + 1;
        for a in &mut g.chromosomes {
            a.behavior =
                crate::controller::diagnostic([0., 0., 3., 0., -1., 1.5, 1.5, -0.15, -0.15], None);
            if i == 0 && !enabled {
                for e in &mut a.chemistry.enzymes {
                    e.center_x = 0.;
                    e.center_y = 0.;
                }
            }
        }
        g.compile(&w.config, &w.chemistry);
        let dx = (i as f64 - 0.5) * 1.2 * if swap { -1. } else { 1. };
        let mut cell = Cell::new(
            g.id,
            g.id,
            g.compiled.as_ref().unwrap(),
            &w.config,
            &w.chemistry,
            [12. + dx, 12.],
            0.,
        );
        let s = if i == 0 { 136 } else { 0 };
        cell.inventory.fill(0.);
        cell.inventory.set(s, 0.8);
        cell.bound_material.fill(0.);
        cell.bound_material.set(s, cell.mass());
        w.ancestry.push(crate::ancestry::Ancestor {
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
    }
    w.next_cell = 3;
    w.next_genome = 3;
    for n in 0..w.field.nx * w.field.ny {
        for s in [8, 128] {
            let q = w.field.amounts[n * 256 + s] as f64;
            w.field.add(n, s, -q, &w.chemistry);
        }
    }
    crate::diagnostics::initialize(&mut w);
    Ok(w)
}

pub fn community(swap: bool) -> Result<World, String> {
    let mut w = World::new(
        27,
        Config {
            width: 48.,
            height: 48.,
            founders: 8,
            source_count: 8,
            landscape_regions: 2,
            landscape_spread: 3.,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..Config::default()
        },
    )?;
    if swap {
        let positions: Vec<_> = w
            .cells
            .iter()
            .map(|c| (c.x, c.y, c.heading))
            .rev()
            .collect();
        for (cell, (x, y, h)) in w.cells.iter_mut().zip(positions) {
            cell.x = x;
            cell.y = y;
            cell.heading = h;
        }
    }
    crate::diagnostics::initialize(&mut w);
    Ok(w)
}
