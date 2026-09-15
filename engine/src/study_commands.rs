//! Explicit research interventions; production never invokes these policies.
use crate::{
    controller,
    genetics::Genotype,
    sensing,
    sources::{Habitat, Source},
    world::World,
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::collections::BTreeMap;

pub fn policy(w: &mut World, v: &Value) -> Result<Value, String> {
    w.intervention_budget()?;
    let patch = v
        .get("patch")
        .and_then(Value::as_object)
        .ok_or("Missing study policy")?;
    let mut config = serde_json::to_value(&w.config).map_err(|e| e.to_string())?;
    for (key, value) in patch {
        if ![
            "mutationRate",
            "physicalMutationRate",
            "learningRetention",
            "transmission",
            "transferRate",
            "learning",
            "damageRate",
            "movementImpedance",
        ]
        .contains(&key.as_str())
        {
            return Err(
                "Study policy cannot change geometry, time integration or chemical laws".into(),
            );
        }
        config[key] = value.clone();
    }
    let config: crate::config::Config =
        serde_json::from_value(config).map_err(|e| e.to_string())?;
    config.validate()?;
    w.config = config;
    w.event("study-policy", 0, vec![]);
    Ok(json!({}))
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Replacement {
    lineage: u64,
    genotypes: BTreeMap<u64, Genotype>,
}
pub fn replace(w: &mut World, v: &Value) -> Result<Value, String> {
    w.intervention_budget()?;
    let mut r: Replacement =
        serde_json::from_value(v.get("replacement").cloned().ok_or("Missing replacement")?)
            .map_err(|e| e.to_string())?;
    if !r.genotypes.is_empty() && !w.cells.iter().any(|c| c.lineage == r.lineage) {
        return Err("Replacement requires a living lineage".into());
    }
    let mut next = w.next_genome;
    for (old, g) in &mut r.genotypes {
        if !w.genomes.contains_key(old) {
            return Err("Replacement source genotype unavailable".into());
        }
        g.id = next;
        g.parent = Some(*old);
        g.born = w.tick;
        g.validate(&w.config)?;
        g.compile(&w.config, &w.chemistry);
        next += 1;
    }
    for i in 0..w.cells.len() {
        let mut cell = w.cells[i].clone();
        cell.brain = controller::State::default();
        if cell.lineage == r.lineage
            && let Some(g) = r.genotypes.get(&cell.genome)
        {
            cell.genome = g.id;
            let installed = w.genomes[&cell.machinery_genome].compiled.as_ref().unwrap();
            sensing::initialize(&mut cell, installed, &w.config, &w.field);
            w.ancestry[cell.id as usize - 1].genome = g.id;
        }
        w.cells[i] = cell;
    }
    w.next_genome = next;
    for g in r.genotypes.into_values() {
        w.genomes.insert(g.id, g);
    }
    w.event("counterfactual", r.lineage, vec![]);
    Ok(json!({}))
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Supply {
    x: f64,
    y: f64,
    radius: f64,
    rate: f64,
    duration: f64,
}
pub fn source(w: &mut World, v: &Value) -> Result<Value, String> {
    let s: Supply = serde_json::from_value(v.get("source").cloned().ok_or("Missing source")?)
        .map_err(|e| e.to_string())?;
    if [s.x, s.y, s.radius, s.rate, s.duration]
        .iter()
        .any(|x| !x.is_finite() || *x < 0.)
        || s.x >= w.config.width
        || s.y >= w.config.height
        || s.radius <= 0.
        || s.duration <= 0.
        || s.duration * s.rate > 1e9
        || w.sources.len() >= 10000
    {
        return Err("Invalid scheduled source".into());
    }
    let mut source = Source {
        habitat: Habitat {
            x: s.x,
            y: s.y,
            radius: s.radius,
            richness: 1.,
            share: 0.5,
        },
        remaining: s.duration,
        wait: 0.,
        rate: s.rate,
        inventory: vec![0.; 256],
        footprint: vec![],
    };
    for &id in &w.config.source_species {
        let q = s.duration * s.rate / w.config.source_species.len() as f64;
        source.inventory[id] += q;
        w.ledger.supplied += q;
        w.ledger.supplied_energy += q * w.chemistry.properties[id].potential;
    }
    source.rebuild(&w.config, &w.field);
    w.sources.push(source);
    w.event("scheduled-source", 0, vec![]);
    Ok(json!({}))
}
pub fn sample(w: &World) -> Value {
    let bodies:Vec<_>=w.cells.iter().map(|c| {
        let load=w.field.scalar(&w.field.impedance,&w.field.stencil(c.x,c.y));
        let mobility=1./(1.+w.config.movement_impedance*load*load);
        json!({"tick":w.tick,"cell":c.id,"genome":c.genome,"core":c.body[0],"motor":c.body[1],"speed_ceiling":crate::movement::motor_limits(c,&w.config,mobility).0})
    }).collect();
    let census:Vec<_>=w.cells.iter().map(|c|json!({"tick":w.tick,"cell":c.id,"lineage":c.lineage,"genome":c.genome,"born":c.born,"generation":c.generation,"x":c.x,"y":c.y,"energy":c.energy,"inventory_material":c.material(),"damage":c.damage})).collect();
    let e = crate::observation::environment(w);
    let s = crate::observation::summary(w);
    json!({"bodies":bodies,"census":census,"environment":[{"tick":w.tick,"population":w.cells.len(),
        "world_area":w.config.width*w.config.height,"half_speed_area":e["halfSpeedArea"],"chemical_material":e["extracellular"]["amount"],
        "chemical_energy":e["extracellular"]["potential"],"energy_residual":s["energyResidual"],"material_residual":s["materialResidual"]}]})
}
pub fn branches(w: &World, lineage: u64) -> Value {
    let mut ancestors = Vec::<(u8, u64)>::with_capacity(w.ancestry.len());
    for a in &w.ancestry {
        let (depth, branch) = if let Some(p) = a.parent() {
            ancestors[p as usize - 1]
        } else {
            (0, a.id)
        };
        ancestors.push(if a.parent == 0 {
            (0, a.id)
        } else if depth < 3 {
            (depth + 1, a.id)
        } else {
            (3, branch)
        });
    }
    let mut groups = BTreeMap::<u64, Vec<&crate::organism::Cell>>::new();
    let mut count = 0;
    for c in &w.cells {
        if lineage == 0 || c.lineage == lineage {
            groups
                .entry(ancestors[c.id as usize - 1].1)
                .or_default()
                .push(c);
            count += 1;
        }
    }
    let mut groups: Vec<_> = groups.into_iter().collect();
    groups.sort_by(|a, b| b.1.len().cmp(&a.1.len()).then(a.0.cmp(&b.0)));
    json!(groups.into_iter().take(3).map(|(branch,mut members)| {
        members.sort_by_key(|c|(c.born,c.id));let c=members[members.len()/2];
        json!({"branch":branch,"members":members.len(),"lineagePercent":100.*members.len() as f64/count as f64,"cell":c.id,"genome":c.genome})
    }).collect::<Vec<_>>())
}
