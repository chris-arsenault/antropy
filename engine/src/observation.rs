use crate::{chemistry::SPECIES, organism::Cell, world::World};
use serde::Serialize;
use serde_json::{Value, json};
use std::collections::BTreeSet;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CellView {
    pub id: u64,
    pub parent: Option<u64>,
    pub lineage: u64,
    pub genome: u64,
    pub generation: u64,
    pub x: f64,
    pub y: f64,
    pub heading: f64,
    pub radius: f64,
    pub energy: f64,
    pub energy_capacity: f64,
    pub material: f64,
    pub capacity: f64,
    pub mass: f64,
    pub damage: f64,
    pub born: u64,
    pub phenotype: [f64; 4],
    pub task: u8,
}
fn cell_view(cell: &Cell, w: &World) -> CellView {
    let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
    let import = crate::recognition_observation::preferred(&g.operators.transporters[0]);
    let membrane = crate::recognition_observation::preferred(&g.operators.membrane);
    CellView {
        id: cell.id,
        parent: cell.parent,
        lineage: cell.lineage,
        genome: cell.genome,
        generation: cell.generation,
        x: cell.x,
        y: cell.y,
        heading: cell.heading,
        radius: cell.radius(&w.config),
        energy: cell.energy,
        energy_capacity: cell.energy_capacity(&w.config),
        material: cell.material(),
        capacity: cell.capacity(&w.config),
        mass: cell.mass(),
        damage: cell.damage,
        born: cell.born,
        phenotype: [import[0], import[1], membrane[0], membrane[1]],
        task: cell.brain.task,
    }
}
pub fn summary(w: &World) -> Value {
    let (matter, energy) = w.held();
    let l = &w.ledger;
    let mut lineages = BTreeSet::new();
    let mut genomes = BTreeSet::new();
    let mut total_energy = 0.;
    let mut total_mass = 0.;
    let mut generation = 0;
    for c in &w.cells {
        lineages.insert(c.lineage);
        genomes.insert(c.genome);
        total_energy += c.energy;
        total_mass += c.mass();
        generation = generation.max(c.generation);
    }
    json!({"tick":w.tick,"modelSeconds":w.tick as f64*w.config.dt,"population":w.cells.len(),"lineages":lineages.len(),"genomes":genomes.len(),"generation":generation,"cellEnergy":total_energy,"biomass":total_mass,"coverMaterial":w.cover.totals(&w.chemistry).0,"heldMaterial":matter,"heldEnergy":energy,"materialResidual":l.initial_material+l.supplied-matter-l.washed_out-l.numerical_material,"energyResidual":l.initial_energy+l.supplied_energy+l.weathering_work+l.source_work+l.flows.external_work-energy-l.washout_energy-l.numerical_energy-l.heat(),"ledger":l,"mortality":crate::recovery_observation::summary(w),"ancestryRecords":w.ancestry.len(),"stopReason":w.stop_reason})
}
pub fn environment(w: &World) -> Value {
    let mut species = [0.; 256];
    for (n, mask, _) in w.field.amounts().occupied() {
        let row = w.field.amounts().row(n);
        for s in crate::field_activity::GroupLanes::<1>::new(mask) {
            species[s] += row[s] as f64;
        }
    }
    let amount = species.iter().sum::<f64>();
    let potential = species
        .iter()
        .zip(&w.chemistry.properties)
        .map(|(q, p)| q * p.potential)
        .sum::<f64>();
    // Reservoir load alone everywhere, corrected at occupied sites by their material impedance.
    let slow = |load: f64| w.config.movement_impedance * load >= 1.;
    let loads = w.field.source_load();
    let area = w.field.spacing * w.field.spacing;
    let mut half_speed = loads.iter().filter(|&&s| slow(s)).count();
    for (n, _, p) in w.field.amounts().occupied() {
        half_speed += usize::from(slow(p[2] / area + loads[n]));
        half_speed -= usize::from(slow(loads[n]));
    }
    json!({"tick":w.tick,"extracellular":{"amount":amount,"potential":potential,"species":species.to_vec()},"halfSpeedArea":half_speed as f64*w.field.spacing.powi(2),"sources":w.sources,"sourceResponse":crate::source_medium::observe(w),"environmentRng":w.environment_rng})
}

#[cfg(test)]
#[test]
fn sparse_environment_report_matches_complete_material_and_keeps_physical_state() {
    let mut w = World::new(
        27,
        crate::config::Config {
            width: 18.,
            height: 18.,
            founders: 2,
            source_count: 2,
            ..Default::default()
        },
    )
    .unwrap();
    for (n, s, amount) in [(0, 0, 2.), (17, 7, 3.), (80, 255, 4.)] {
        w.field.add(n, s, amount, &w.chemistry);
    }
    let before = w.snapshot().unwrap();
    let mut expected = [0.; 256];
    for (_, row) in w.field.amounts().rows() {
        for (sum, &q) in expected.iter_mut().zip(row) {
            *sum += q as f64;
        }
    }
    let report = environment(&w);
    assert_eq!(report["extracellular"]["species"], json!(expected.to_vec()));
    let expected_slow = (0..w.field.nx * w.field.ny)
        .filter(|&n| {
            w.config.movement_impedance * (w.field.impedance_at(n) + w.field.source_load()[n]) >= 1.
        })
        .count() as f64
        * w.field.spacing.powi(2);
    assert_eq!(report["halfSpeedArea"], json!(expected_slow));
    assert_eq!(w.snapshot().unwrap(), before);
}
pub fn frame(w: &World) -> Value {
    let cells: Vec<_> = w.cells.iter().map(|c| cell_view(c, w)).collect();
    json!({"version":w.version,"seed":w.seed,"tick":w.tick,"width":w.config.width,"height":w.config.height,"cells":cells,"summary":summary(w),"events":w.events})
}
pub fn field_view(w: &World, kind: &str, species: usize) -> Result<Value, String> {
    if species >= SPECIES {
        return Err("Invalid chemical identity".into());
    }
    let area = w.field.spacing * w.field.spacing;
    let values: Vec<f32> = match kind {
        "impedance" => w
            .field
            .source_load()
            .iter()
            .enumerate()
            .map(|(n, s)| (w.field.impedance_at(n) + s) as f32)
            .collect(),
        "stress" => (0..w.field.nx * w.field.ny)
            .map(|n| w.field.stress_at(n) as f32)
            .collect(),
        "chemical" => (0..w.field.nx * w.field.ny)
            .map(|i| w.field.amounts().row(i))
            .map(|n| n[species] / area as f32)
            .collect(),
        "material" => (0..w.field.nx * w.field.ny)
            .map(|i| w.field.amounts().row(i))
            .map(|n| n.iter().sum::<f32>() / area as f32)
            .collect(),
        "potential" => (0..w.field.nx * w.field.ny)
            .map(|i| w.field.amounts().row(i))
            .map(|n| {
                (n.iter()
                    .zip(&w.chemistry.properties)
                    .map(|(q, p)| *q as f64 * p.potential)
                    .sum::<f64>()
                    / area) as f32
            })
            .collect(),
        _ => return Err("Unknown field view".into()),
    };
    Ok(
        json!({"tick":w.tick,"kind":kind,"species":species,"nx":w.field.nx,"ny":w.field.ny,"spacing":w.field.spacing,"values":values}),
    )
}
pub fn inspect(w: &World, id: u64) -> Result<Value, String> {
    selected(w, id, &json!({"genealogy":true}))
}

/// One explicitly selected organism; immutable genes and parentage are revisions.
pub fn selected(w: &World, id: u64, request: &Value) -> Result<Value, String> {
    let cell = w.cells.iter().find(|c| c.id == id);
    let interface = w
        .cells
        .iter()
        .position(|c| c.id == id)
        .map(|i| crate::interfaces::selected(i, &w.cells, &w.config, &w.chemistry));
    let ancestor = crate::ancestry::get(&w.ancestry, id)
        .ok_or("Organism history is unknown or has expired")?;
    let genome = w.genomes.get(&ancestor.genome);
    let impedance = cell.map(|c| w.field.medium_load(&w.field.stencil(c.x, c.y)));
    let local: Option<Vec<f64>> = cell.map(|c| {
        let sites = w.field.stencil(c.x, c.y);
        (0..256).map(|s| w.field.sample(s, &sites)).collect()
    });
    let expressed = genome.map(|g| &g.compiled.as_ref().unwrap().chromosome);
    let events: Vec<_> = w
        .events
        .iter()
        .filter(|e| e.cell == id)
        .rev()
        .take(16)
        .collect();
    let exposure = cell.zip(interface.as_ref()).map(|(c, boundary)| {
        crate::sensing::stress_boundary(c, &w.config, &w.field, &w.chemistry, boundary)
    });
    let mut result = json!({"tick":w.tick,"cell":cell,"ancestor":ancestor,"local":local,"events":events,"exposure":exposure,"impedance":impedance,"mobility":impedance.map(|load| crate::movement::mobility(load,w.config.movement_impedance))});
    if let Some(cell) = cell {
        result["cell"]["body"] = json!(cell.body);
        result["cell"]["brain"] = json!(crate::controller::observed_state(&cell.brain));
        result["control"] = crate::controller::observation::inspect(
            &expressed.unwrap().behavior,
            &cell.brain,
            &w.config,
        );
    } else {
        result["control"] = Value::Null;
    }
    result["upkeep"] = json!(cell.map(|c| {
        let age = c.age(&w.config, w.tick);
        json!({"ageSeconds":age,"bodyMultiplier":crate::organism::aging_multiplier(&c.body,age,&w.config),
            "maintenancePerSecond":crate::organism::maintenance_rate(&c.body,c.damage,age,&w.config)})
    }));
    result["fieldInterface"] = json!(interface.map(|r| r.field));
    result["weathering"] = json!(cell.map(|c| crate::climate::local(w, c.x, c.y)));
    result["illumination"] = json!(cell.map(|c| crate::illumination::at(w, c.x, c.y)));
    result["optics"] = json!(cell.map(|c| crate::illumination::inspect(w, c)));
    result["terrain"] = json!(cell.map(|c| crate::terrain_observation::local(w, [c.x, c.y])));
    result["coverLocal"] = json!(cell.map(|c| {
        let sites = w.cover.stencil(c.x, c.y);
        (0..256)
            .map(|s| w.cover.sample(s, &sites))
            .collect::<Vec<_>>()
    }));
    if request.get("genealogy").and_then(Value::as_bool) == Some(true) {
        result["genealogy"] = crate::genealogy::inspect(w, id);
        result["relationships"] = crate::relationships::inspect(w, id);
    }
    if genome.is_none() || request.get("genome").and_then(Value::as_u64) != Some(ancestor.genome) {
        result["genotype"] = json!(genome);
        result["expressed"] = json!(expressed);
        result["blueprint"] = json!(genome.map(|g| g.compiled.as_ref().unwrap().body));
        result["recognition"] =
            json!(genome.map(|g| g.compiled.as_ref().unwrap().recognition(&w.config)));
    }
    Ok(result)
}
