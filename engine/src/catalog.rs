//! Explicit diagnostic records; adding them never relabels an observed organism.
use crate::{genetics::Genotype, world::World};
use serde_json::{Value, json};
pub fn append(w: &mut World, v: &Value) -> Result<Value, String> {
    w.intervention_budget()?;
    let mut records: Vec<Genotype> =
        serde_json::from_value(v.get("genotypes").cloned().ok_or("Missing genotypes")?)
            .map_err(|e| e.to_string())?;
    if records.is_empty() || records.len() > 16 {
        return Err("Diagnostic catalog requires 1..16 genotypes".into());
    }
    let mut next = w.next_genome;
    for g in &mut records {
        if !g.parent.is_some_and(|p| w.genomes.contains_key(&p)) {
            return Err("Catalog requires an existing source genotype".into());
        }
        g.id = next;
        g.born = w.tick;
        g.validate(&w.config)?;
        g.compile(&w.config, &w.chemistry);
        next += 1;
    }
    let ids: Vec<_> = records.iter().map(|g| g.id).collect();
    for g in records {
        w.genomes.insert(g.id, g);
    }
    w.next_genome = next;
    w.event("catalog", 0, ids.clone());
    Ok(json!(ids))
}
