//! Zero-tick candidate diagnostics reuse production coefficients and economy accounts.
use crate::{economy, world::World};
use serde_json::{Value, json};

pub fn budget(w: &World, value: &Value) -> Result<Value, String> {
    let id = value
        .get("cell")
        .and_then(Value::as_u64)
        .ok_or("Missing budget cell")?;
    let cell = w
        .cells
        .iter()
        .find(|c| c.id == id)
        .ok_or("Budget cell is not alive")?;
    let g = w.genomes[&cell.genome].compiled.as_ref().unwrap();
    let sites = crate::footprint::sites(cell, &w.config, &w.field);
    let local = std::array::from_fn(|s| w.field.sample(s, &sites));
    let scale = cell.mass() / g.body.iter().sum::<f64>();
    let action = crate::controller::act(
        &g.chromosome.behavior,
        &cell.inputs,
        &mut cell.brain.clone(),
        &w.config,
        false,
    );
    let report = economy::budget_with_action(
        &w.config,
        &w.chemistry,
        g,
        scale,
        &local,
        cell.material(),
        action,
    );
    let compiled = &g.operators;
    let signal: [f64; 2] = std::array::from_fn(|k| {
        local
            .iter()
            .enumerate()
            .map(|(s, q)| q * w.chemistry.properties[s].interaction[k])
            .sum()
    });
    let light = crate::metabolism::light_environment(cell, &w.config, &w.chemistry, signal);
    let footprints: Vec<_> = w
        .cells
        .iter()
        .map(|cell| crate::footprint::sites(cell, &w.config, &w.field))
        .collect();
    let exposures = crate::optics::observed_cell_exposures(w, &footprints);
    let index = w.cells.iter().position(|c| c.id == id).unwrap();
    let (held_signal, exposure) = exposures[index];
    let drive = crate::illumination::drive(held_signal, exposure.drive());
    let initial_context_work_ceiling: f64 = report
        .imports
        .iter()
        .enumerate()
        .map(|(s, q)| q * economy::local_work_ceiling(g, s, &w.config, light))
        .sum();
    let routes: Vec<_> = compiled.enzymes.iter().enumerate().flat_map(|(slot,e)| {
        e.conversions.iter().map(move |edge| json!({"slot":slot,"species":edge.substrate,
            "binding":edge.binding,"catalytic":edge.catalytic,"yield":edge.energy(&w.config,light),
            "heldLightYield":edge.energy(&w.config,drive),
            "products":edge.products.iter().map(|p| json!([p.species,p.weight])).collect::<Vec<_>>() }))
    }).collect();
    Ok(
        json!({"ticksAdvanced":0,"tick":w.tick,"cell":id,"body":cell.body,
        "boundMaterial":cell.bound_material,"inventory":cell.inventory,"energy":cell.energy,
        "local":local.to_vec(),"budget":report,"routes":routes,"action":action,
        "initialContextImportWorkCeiling":initial_context_work_ceiling,
        "heldLight":{"solar":exposure.solar,"emitted":exposure.emitted,"funded":exposure.funded,"signal":held_signal},
        "support":{"receptors":compiled.receptors.iter().map(|r|r.len()).collect::<Vec<_>>(),
            "transporters":compiled.transporters.iter().map(|r|r.len()).collect::<Vec<_>>(),
            "enzymes":compiled.enzymes.iter().map(|e|e.conversions.len()).collect::<Vec<_>>(),
            "membrane":compiled.membrane.len()},
        "limitations":"Action-aware import ceiling; budget substitutes import-proportional internal composition, while routes and initialContextImportWorkCeiling use actual initial retained chemistry at unit illumination. heldLightYield additionally uses the snapshot optical allocation; the next physical boundary recomputes it. Excludes passive loss, injury, competition, product inhibition, energy-limited acceptance and subsequent composition changes. Neither is a survival prediction"}),
    )
}
