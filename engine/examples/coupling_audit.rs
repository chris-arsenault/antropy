//! Zero-world-tick audit of current operators; no alternative physics or evolving population.
use antropy_engine::{
    config::Config,
    diagnostics, economy,
    genetics::Genotype,
    metabolism, movement,
    organism::{Cell, maintenance_rate},
    sensing,
    world::World,
};
use serde_json::{Value, json};

fn cell(w: &World, scale: f64) -> Cell {
    let g = w.genomes[&1].compiled.as_ref().unwrap();
    let mut c = Cell::new(1, 1, g, &w.config, &w.chemistry, [12., 12.], 0.);
    c.set_fixture_body(c.body.map(|q| q * scale));
    c.inventory.fill(0.);
    c.inventory.set(w.chemistry.decomposition, 0.4 * scale);
    c.energy = c.energy_capacity(&w.config);
    c
}

fn scaling(w: &World) -> Vec<Value> {
    [0.25, 0.5, 1., 2., 4.]
        .into_iter()
        .map(|scale| {
            let mut c = cell(w, scale);
            let (speed, power) = movement::motor_limits(&c, &w.config, 1.);
            let baseline = maintenance_rate(&c.body, 0., &w.config);
            c.damage = 0.2;
            c.action.repair = 1.;
            metabolism::repair(&mut c, &w.config, &w.chemistry, 1.);
            json!({"scale":scale,"bodyMass":c.mass(),"radius":c.radius(&w.config),
            "maxSwimSpeed":speed,"maxTurnRate":speed/(2.*c.radius(&w.config)),
            "motorPower":power,"maintenance":baseline,
            "repairFraction":c.flows.repaired,"repairWork":c.flows.repair,
            "repairWorkPerBodyMass":c.flows.repair/c.mass(),
            "inventoryCapacity":c.capacity(&w.config),
            "energyCapacity":c.energy_capacity(&w.config)})
        })
        .collect()
}

fn motors(w: &World) -> Vec<Value> {
    let reference = cell(w, 1.);
    let target_speed = movement::motor_limits(&reference, &w.config, 1.).0;
    [1., 4.]
        .into_iter()
        .map(|scale| {
            let mut c = reference.clone();
            c.body[1] *= scale;
            c.set_fixture_body(c.body);
            let (maximum, power) = movement::motor_limits(&c, &w.config, 1.);
            let effort = target_speed / maximum;
            c.action.swim = effort;
            let row = w.field.stencil(c.x, c.y).to_vec();
            let start = [c.x, c.y];
            let mut cells = vec![c];
            movement::advance(
                &mut cells,
                &w.config,
                &w.field,
                &[antropy_engine::footprint::Row::from_slice(&row)],
            );
            let c = &cells[0];
            let measured = movement::distance(start, [c.x, c.y], &w.config) / w.config.dt;
            assert!((measured - target_speed).abs() < 1e-10);
            assert!((c.flows.motors / w.config.dt - power * effort * effort).abs() < 1e-12);
            json!({"motorScale":scale,"maximumSpeed":maximum,"effort":effort,
            "measuredSpeed":measured,"operatingPower":c.flows.motors/w.config.dt,
            "maintenance":maintenance_rate(&c.body,0.,&w.config),
            "additionalBuiltStock":c.body[1]-reference.body[1]})
        })
        .collect()
}

fn reactions(w: &World) -> Vec<Value> {
    let mut rows = vec![];
    for product in [64, 80, 128, 178, 186, 240] {
        let mut g = w.genomes[&1].clone();
        diagnostics::retarget(&mut g, 0, 0, product);
        g.compile(&w.config, &w.chemistry);
        for accumulated in [false, true] {
            let compiled = g.compiled.as_ref().unwrap();
            let mut c = Cell::new(1, 1, compiled, &w.config, &w.chemistry, [12., 12.], 0.);
            c.body[12..].fill(0.);
            c.set_fixture_body(c.body);
            c.inventory.fill(0.);
            c.inventory.set(0, 0.4);
            c.inventory
                .set(if accumulated { product } else { 255 }, 0.4);
            c.energy = c.energy_capacity(&w.config);
            let load = sensing::stress_load(&c, compiled, &w.config, &w.field, &w.chemistry);
            let edge = compiled.operators.enzymes[0]
                .conversions
                .iter()
                .find(|edge| edge.substrate == 0)
                .unwrap();
            let energy_before = c.energy;
            let _ = metabolism::react(&mut c, &w.config, &w.chemistry, 1.);
            assert!((c.material() - 0.8).abs() < 1e-12);
            rows.push(
                json!({"substrate":0,"product":product,"accumulatedProduct":accumulated,
                "potential":w.chemistry.properties[product].potential,
                "stress":w.chemistry.properties[product].stress,"inputInternalLoad":load,
                "attenuation":edge.catalytic / edge.binding,
                "workPerUnit":edge.work,"consumed":c.chemical_flows.consumed.value(0),
                "netWork":c.energy-energy_before,"captured":c.flows.captured}),
            );
        }
    }
    rows
}

fn investments(w: &World) -> Vec<Value> {
    let mut rows = vec![];
    for source in &w.config.source_species {
        let mut local = [0.; 256];
        local[*source] = 0.1;
        for locus in [7, 8, 11, 12] {
            for change in [0., 0.12] {
                let mut g: Genotype = w.genomes[&1].clone();
                g.chromosomes[0].physical[locus] += change;
                g.compile(&w.config, &w.chemistry);
                let b = economy::budget(
                    &w.config,
                    &w.chemistry,
                    g.compiled.as_ref().unwrap(),
                    1.,
                    &local,
                    0.4,
                    0.5,
                );
                rows.push(json!({"source":source,"locus":locus,"change":change,
                    "importRate":b.imports.iter().sum::<f64>(),"maintenance":b.maintenance,
                    "importOnlySurplus":b.surplus,"processingSurplus":b.processing_surplus,
                    "processingWork":b.processing_work}));
            }
        }
    }
    rows
}

fn stress(w: &World) -> Vec<Value> {
    let mut rows = vec![];
    for compatible in [false, true] {
        let mut g = w.genomes[&1].clone();
        if compatible {
            for ch in &mut g.chromosomes {
                ch.chemistry.membrane = antropy_engine::genetics::Target::species(120);
            }
        }
        g.compile(&w.config, &w.chemistry);
        for scale in [0.25, 1., 4.] {
            let compiled = g.compiled.as_ref().unwrap();
            let mut c = Cell::new(1, 1, compiled, &w.config, &w.chemistry, [12., 12.], 0.);
            c.set_fixture_body(c.body.map(|q| q * scale));
            c.inventory.fill(0.);
            c.inventory.set(120, 0.4 * scale);
            let load = sensing::stress_load(&c, compiled, &w.config, &w.field, &w.chemistry);
            let injury = w.config.damage_rate * load / (w.config.stress_k + load);
            rows.push(json!({"compatible":compatible,"scale":scale,"load":load,
                "injuryPerSecond":injury,"maxRepairPerSecond":w.config.repair_rate,
                "repairCanBalance":injury<=w.config.repair_rate}));
        }
    }
    rows
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 1 {
        return Err("Usage: coupling_audit <new-report.json>".into());
    }
    let w = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 0,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            learning_retention: 0.,
            ..Config::default()
        },
    )?;
    let result = json!({"schemaVersion":2,"physicalVersion":w.version,"worldTicksAdvanced":w.tick,"seed":27,
        "chemistrySeed":w.chemistry.seed,"config":w.config,
        "scaling":scaling(&w),"equalSpeedMotors":motors(&w),"reactions":reactions(&w),
        "investments":investments(&w),"internalStress":stress(&w),
        "limits":["Direct calls to shared production operators, not a population or fitness assay",
            "Scaled stocks and inventory are constructed funded bodies, not birth mutations",
            "Movement uses the field point stencil in empty uniform medium, where footprint choice is immaterial; one operator interval and zero World ticks",
            "Repair acts for one second on clones with 20% damage and decomposition-only inventory",
            "Reactions use one funded enzyme, equal substrate and total material; product replaces unrelated ID255",
            "Economy investment returns omit product buildup, repair, learning, geography and shared delivery",
            "No changes to production equations or coefficients; no controller or parent selection"]});
    let file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&args[0])?;
    serde_json::to_writer_pretty(file, &result)?;
    println!("{}: production-operator audit, zero world ticks", args[0]);
    Ok(())
}
