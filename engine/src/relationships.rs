//! Genealogical distance is independent of genetic resemblance and observed behavior.
use crate::{controller, presentation, world::World};
use serde_json::{Value, json};
pub fn inspect(w: &World, id: u64) -> Value {
    let Some(reference) = crate::ancestry::get(&w.ancestry, id) else {
        return Value::Null;
    };
    let kin = w
        .cells
        .iter()
        .filter(|c| c.lineage == reference.lineage)
        .count();
    let mut distances = std::collections::BTreeMap::<u64, u32>::new();
    if kin > 0 && (kin > 1 || !w.cells.iter().any(|c| c.id == id)) {
        let mut cursor = id;
        let mut depth = 0;
        while let Some(a) = crate::ancestry::get(&w.ancestry, cursor) {
            distances.insert(cursor, depth);
            depth += 1;
            if let Some(parent) = a.parent() {
                cursor = parent;
            } else {
                break;
            }
        }
        // Parent IDs precede children. Propagate the shortest route through the
        // selected cell's ancestor chain once, rather than walking it per cell.
        for a in &w.ancestry {
            if a.lineage == reference.lineage
                && !distances.contains_key(&a.id)
                && let Some(d) = distances.get(&a.parent).copied()
            {
                distances.insert(a.id, d.saturating_add(1));
            }
        }
    }
    let mut cells: Vec<_> = w
        .cells
        .iter()
        .map(|c| {
            let links = if c.id == id {
                0
            } else {
                distances.get(&c.id).copied().unwrap_or(u32::MAX)
            };
            (links, c)
        })
        .collect();
    cells.sort_by_key(|(links, c)| (*links, c.id));
    let base = w
        .genomes
        .get(&reference.genome)
        .and_then(|g| g.compiled.as_ref());
    let rows:Vec<_>=cells.into_iter().take(5).map(|(links,c)| {
        let g=w.genomes[&c.genome].compiled.as_ref().unwrap();
        json!({"cell":c.id,"family":presentation::family(w,c),"links":if links==u32::MAX {None}else{Some(links)},
            "physical":base.map(|a|presentation::physical_distance(&a.chromosome,&g.chromosome)),
            "controller":base.map(|a|controller::genome_distance(&a.chromosome.behavior,&g.chromosome.behavior))})
    }).collect();
    json!({"kin":kin,"population":w.cells.len(),"rows":rows})
}
