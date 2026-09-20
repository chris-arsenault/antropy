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
    let g = &w.genomes[&cell.genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .chemistry;
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
        phenotype: [
            g.transporters[0].x,
            g.transporters[0].y,
            g.membrane.x,
            g.membrane.y,
        ],
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
    json!({"tick":w.tick,"modelSeconds":w.tick as f64*w.config.dt,"population":w.cells.len(),"lineages":lineages.len(),"genomes":genomes.len(),"generation":generation,"cellEnergy":total_energy,"biomass":total_mass,"heldMaterial":matter,"heldEnergy":energy,"materialResidual":l.initial_material+l.supplied-matter-l.washed_out-l.numerical_material,"energyResidual":l.initial_energy+l.supplied_energy+l.weathering_work+l.source_work+l.flows.external_work-energy-l.washout_energy-l.numerical_energy-l.heat(),"ledger":l,"ancestryRecords":w.ancestry.len(),"stopReason":w.stop_reason})
}
pub fn environment(w: &World) -> Value {
    let mut species = [0.; 256];
    for node in w.field.amounts.as_chunks::<256>().0 {
        for (total, q) in species.iter_mut().zip(node) {
            *total += *q as f64;
        }
    }
    let amount = species.iter().sum::<f64>();
    let potential = species
        .iter()
        .zip(&w.chemistry.properties)
        .map(|(q, p)| q * p.potential)
        .sum::<f64>();
    let half_speed = w
        .field
        .impedance
        .iter()
        .zip(&w.field.source_load)
        .filter(|(i, s)| w.config.movement_impedance * (**i + **s) >= 1.)
        .count();
    json!({"tick":w.tick,"extracellular":{"amount":amount,"potential":potential,"species":species.to_vec()},"halfSpeedArea":half_speed as f64*w.field.spacing.powi(2),"sources":w.sources,"sourceResponse":crate::source_medium::observe(w),"environmentRng":w.environment_rng})
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
            .impedance
            .iter()
            .zip(&w.field.source_load)
            .map(|(x, s)| (x + s) as f32)
            .collect(),
        "stress" => w.field.stress.iter().map(|x| *x as f32).collect(),
        "chemical" => w
            .field
            .amounts
            .as_chunks::<SPECIES>()
            .0
            .iter()
            .map(|n| n[species] / area as f32)
            .collect(),
        "material" => w
            .field
            .amounts
            .as_chunks::<SPECIES>()
            .0
            .iter()
            .map(|n| n.iter().sum::<f32>() / area as f32)
            .collect(),
        "potential" => w
            .field
            .amounts
            .as_chunks::<SPECIES>()
            .0
            .iter()
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
    let interface = w.cells.iter().position(|c| c.id == id).map(|i| {
        crate::interfaces::Graph::new(&w.cells, &w.config).reading(
            i,
            &w.cells,
            &w.config,
            &w.chemistry,
        )
    });
    let ancestor = w
        .ancestry
        .get(id.checked_sub(1).ok_or("Invalid organism id")? as usize)
        .ok_or("Unknown organism")?;
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
    result["fieldInterface"] = json!(interface.map(|r| r.field));
    result["weathering"] = json!(cell.map(|c| crate::climate::local(w, c.x, c.y)));
    result["illumination"] = json!(cell.map(|c| crate::illumination::at(w, c.x, c.y)));
    if request.get("machinery").and_then(Value::as_u64) != cell.map(|c| c.machinery_revision)
        || cell.is_none()
    {
        result["installedChemistry"] = json!(cell.map(|c| &c.installed));
    }
    if request.get("genealogy").and_then(Value::as_bool) == Some(true) {
        result["genealogy"] = crate::genealogy::inspect(w, id);
        result["relationships"] = crate::relationships::inspect(w, id);
    }
    if genome.is_none() || request.get("genome").and_then(Value::as_u64) != Some(ancestor.genome) {
        result["genotype"] = json!(genome);
        result["expressed"] = json!(expressed);
        result["blueprint"] = json!(genome.map(|g| g.compiled.as_ref().unwrap().body));
    }
    Ok(result)
}
