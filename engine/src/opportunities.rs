//! Small constructed chemical opportunities; no fixture-specific advancement rules.
use crate::{
    config::Config,
    controller, diagnostics,
    genetics::{Genotype, Target, Transporter},
    world::World,
};

fn base(count: usize) -> World {
    base_mesh(count, 4.)
}
fn base_mesh(count: usize, mesh: f64) -> World {
    let mut w = World::new(
        101,
        Config {
            width: 24.,
            height: 24.,
            mesh,
            founders: count,
            source_count: 0,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            division_work_per_core: 100.,
            ..Config::default()
        },
    )
    .unwrap();
    for i in 0..count {
        let mut g = w.genomes[&1].clone();
        g.id = (i + 1) as u64;
        g.parent = None;
        for a in &mut g.chromosomes {
            a.behavior = stationary();
        }
        w.genomes.insert(g.id, g);
        let c = &mut w.cells[i];
        c.x = 12. + (i as f64 - (count - 1) as f64 / 2.) * 1.4;
        c.y = 12.;
        c.heading = 0.;
        c.genome = (i + 1) as u64;
        w.ancestry[i].genome = c.genome;
        c.inventory.fill(0.);
        c.inventory.set(240, 0.8);
    }
    w.next_genome = count as u64 + 1;
    w
}
fn stationary() -> controller::Genome {
    controller::diagnostic([0., 0., 2., 0., -1., 2., 2., -2., -2.], None)
}
fn export(g: &mut Genotype, slot: usize, s: usize) {
    let p = Target::species(s);
    for a in &mut g.chromosomes {
        a.chemistry.transporters[slot] = Transporter { x: p.x, y: p.y };
    }
}
fn membrane(g: &mut Genotype, s: usize) {
    for a in &mut g.chromosomes {
        a.chemistry.membrane = Target::species(s);
    }
}
fn pathway(g: &mut Genotype, from: usize, to: usize) {
    for slot in 0..4 {
        diagnostics::retarget(g, slot, from, to);
    }
    export(g, 2, to);
    export(g, 3, to);
    membrane(g, to);
}
pub fn patch(w: &mut World, s: usize, amount: f64, sigma: f64) {
    let h = w.field.spacing;
    let mut sites = vec![];
    let mut total = 0.;
    for i in 0..w.field.nx * w.field.ny {
        let x = (i % w.field.nx) as f64 * h + h / 2. - 12.;
        let y = (i / w.field.nx) as f64 * h + h / 2. - 12.;
        let q = (-(x * x + y * y) / (2. * sigma * sigma)).exp();
        total += q;
        sites.push((i, q));
    }
    for (i, q) in sites {
        w.field.add(i, s, amount * q / total, &w.chemistry);
    }
}
fn finish(mut w: World) -> World {
    for g in w.genomes.values_mut() {
        g.compile(&w.config, &w.chemistry);
    }
    diagnostics::initialize(&mut w);
    w
}

pub fn create(name: &str) -> Result<World, String> {
    if name.starts_with("circuit-delivery") {
        return crate::initial_ecology::delivery(!name.contains("-off"), name.ends_with("-swap"));
    }
    if name.starts_with("circuit-community") {
        return crate::initial_ecology::community(name.ends_with("-swap"));
    }
    if let Some(value) = name.strip_prefix("regenerative-") {
        let role = value
            .split('-')
            .next()
            .and_then(|s| s.parse::<usize>().ok())
            .filter(|r| *r < 4)
            .ok_or("Invalid circuit role")?;
        return crate::initial_ecology::probe(role, !name.ends_with("-off"));
    }
    if name.starts_with("sensing-") {
        return sensing(name);
    }
    match name {
        "crossfeeding"
        | "crossfeeding-export-off"
        | "crossfeeding-processing-off"
        | "emission"
        | "emission-off" => chain(name),
        "exposure-external-compatible"
        | "exposure-external-distant"
        | "exposure-internal-compatible"
        | "exposure-internal-distant" => Ok(exposure(name)),
        "detoxification" | "detoxification-off" => Ok(detox(name)),
        "corpse-capture" | "corpse-capture-off" => Ok(corpse(name)),
        "barrier" => Ok(barrier()),
        "degradation" | "degradation-off" => Ok(degradation(name)),
        _ => Err("Unknown chemical opportunity".into()),
    }
}
fn sensing(name: &str) -> Result<World, String> {
    let mesh = if name.ends_with("-h4") {
        4.
    } else if name.ends_with("-h2") {
        2.
    } else {
        return Err("Unregistered sensing mesh".into());
    };
    let mut w = base_mesh(1, mesh);
    let g = w.genomes.get_mut(&1).unwrap();
    pathway(g, 0, 240);
    let connected = !name.contains("-off-");
    for a in &mut g.chromosomes {
        a.behavior = controller::diagnostic(
            [0.5, 0., 2., 0., -1., 2., 2., -2., -2.],
            connected.then_some((3, 1, 4.)),
        );
    }
    w.cells[0].x = 9.;
    w.cells[0].y = if name.contains("-right-") { 15. } else { 9. };
    patch(&mut w, 0, 48., 2.);
    Ok(finish(w))
}
fn chain(name: &str) -> Result<World, String> {
    let mut w = base(2);
    let donor = w.genomes.get_mut(&1).unwrap();
    pathway(donor, 0, 128);
    if name.ends_with("export-off") || name == "emission-off" {
        for a in &mut donor.chromosomes {
            a.behavior = controller::diagnostic([0., 0., 2., 0., -1., 2., 2., 0., 0.], None);
        }
    }
    let recipient = w.genomes.get_mut(&2).unwrap();
    pathway(recipient, 128, 240);
    if name.ends_with("processing-off") {
        for a in &mut recipient.chromosomes {
            for e in &mut a.chemistry.enzymes {
                e.center_x = 0.;
                e.center_y = 0.;
            }
        }
    }
    if name.starts_with("emission") {
        for a in &mut recipient.chromosomes {
            a.behavior =
                controller::diagnostic([0., 0., 2., 0., -1., 0., 0., 2., 2.], Some((0, 5, 3.)));
        }
    }
    patch(&mut w, 0, 48., 2.);
    Ok(finish(w))
}
fn exposure(name: &str) -> World {
    let mut w = base(1);
    let g = w.genomes.get_mut(&1).unwrap();
    pathway(g, 0, 240);
    membrane(
        g,
        if name.ends_with("compatible") {
            120
        } else {
            240
        },
    );
    w.cells[0].inventory.fill(0.);
    w.cells[0].inventory.set(0, 0.8);
    if name.contains("internal") {
        w.cells[0].inventory.set(0, 0.6);
        w.cells[0].inventory.set(120, 0.2);
    } else {
        let amount = 0.1 * w.field.spacing.powi(2);
        for i in 0..w.field.nx * w.field.ny {
            w.field.add(i, 120, amount, &w.chemistry);
        }
    }
    finish(w)
}
fn detox(name: &str) -> World {
    let mut w = base(1);
    let g = w.genomes.get_mut(&1).unwrap();
    pathway(g, 0, 240);
    diagnostics::retarget(g, 1, 120, if name.ends_with("off") { 120 } else { 240 });
    patch(&mut w, 0, 48., 2.);
    patch(&mut w, 120, 2., 2.);
    finish(w)
}
fn corpse(name: &str) -> World {
    let mut w = base(2);
    let g = w.genomes.get_mut(&1).unwrap();
    pathway(g, 128, 240);
    if name.ends_with("off") {
        for a in &mut g.chromosomes {
            a.behavior = controller::diagnostic([0., 0., 2., 0., -1., 0., 0., 2., 2.], None);
        }
    }
    w.cells[1].inventory.fill(0.);
    w.cells[1].inventory.set(128, 0.8);
    let mut w = finish(w);
    let cell = w.cells.pop().unwrap();
    w.release_cell(&cell, crate::ancestry::Cause::ConstructedCorpse);
    w
}
fn barrier() -> World {
    let mut w = base(1);
    let g = w.genomes.get_mut(&1).unwrap();
    pathway(g, 0, 240);
    diagnostics::retarget(g, 1, 0, 15);
    export(g, 2, 15);
    patch(&mut w, 0, 48., 2.);
    finish(w)
}
fn degradation(name: &str) -> World {
    let mut w = base(1);
    let g = w.genomes.get_mut(&1).unwrap();
    pathway(g, 0, 240);
    diagnostics::retarget(g, 1, 15, if name.ends_with("off") { 15 } else { 0 });
    patch(&mut w, 0, 24., 2.);
    patch(&mut w, 15, 1., 1.);
    finish(w)
}

/// A read-only diagnostic using the same field operator. Subtract evolved background
/// to measure transport of the added tracer, rather than pre-existing chemical matter.
pub fn diffusion_probe(w: &World) -> serde_json::Value {
    let center = [w.config.width / 2., w.config.height / 2.];
    let mut results = vec![];
    for removal in [false, true] {
        let mut background = w.field.clone();
        if removal {
            for i in 0..background.nx * background.ny {
                background.add(
                    i,
                    15,
                    -(background.amounts[i * 256 + 15] as f64),
                    &w.chemistry,
                );
            }
        }
        let mut tracer = background.clone();
        tracer.deposit(center[0], center[1], 240, 1., &w.chemistry);
        for _ in 0..10 {
            for field in [&mut background, &mut tracer] {
                field.advance(
                    &w.chemistry,
                    0.2,
                    w.config.washout,
                    w.config.diffusion_impedance,
                );
            }
        }
        let (mut amount, mut moment) = (0., 0.);
        for i in 0..tracer.nx * tracer.ny {
            let added =
                tracer.amounts[i * 256 + 240] as f64 - background.amounts[i * 256 + 240] as f64;
            let point = [
                (i % tracer.nx) as f64 * tracer.spacing + tracer.spacing / 2.,
                (i / tracer.nx) as f64 * tracer.spacing + tracer.spacing / 2.,
            ];
            amount += added;
            moment += added * crate::movement::distance_squared(point, center, &w.config);
        }
        results.push(serde_json::json!({"removed15":removal,"tracerRemaining":amount,"secondMoment":moment/amount}));
    }
    serde_json::json!({"tick":w.tick,"modelSeconds":2.,"steps":10,"results":results})
}
