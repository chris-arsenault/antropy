//! Genealogical distance is independent of genetic resemblance and observed behavior.
use crate::{controller, presentation, world::World};
use serde_json::{Value, json};
pub fn inspect(w: &World, id: u64) -> Value {
    let Some(reference) = id.checked_sub(1).and_then(|i| w.ancestry.get(i as usize)) else {
        return Value::Null;
    };
    let kin = w
        .cells
        .iter()
        .filter(|c| c.lineage == reference.lineage)
        .count();
    let mut distances = vec![];
    if kin > 0 && (kin > 1 || !w.cells.iter().any(|c| c.id == id)) {
        distances = vec![u32::MAX; w.ancestry.len()];
        let mut cursor = id;
        let mut depth = 0;
        loop {
            distances[cursor as usize - 1] = depth;
            depth += 1;
            if let Some(parent) = w.ancestry[cursor as usize - 1].parent() {
                cursor = parent;
            } else {
                break;
            }
        }
        // Parent IDs precede children. Propagate the shortest route through the
        // selected cell's ancestor chain once, rather than walking it per cell.
        for a in &w.ancestry {
            if a.lineage == reference.lineage
                && distances[a.id as usize - 1] == u32::MAX
                && let Some(p) = a.parent()
            {
                distances[a.id as usize - 1] = distances[p as usize - 1].saturating_add(1);
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
                distances
                    .get(c.id as usize - 1)
                    .copied()
                    .unwrap_or(u32::MAX)
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
