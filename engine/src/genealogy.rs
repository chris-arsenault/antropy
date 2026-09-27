//! Bounded presentation records from retained parentage, never physical inputs.
use crate::{ancestry::Ancestor, world::World};
use serde_json::{Value, json};
use std::collections::BTreeMap;

fn parent_family(w: &World, id: u64) -> Option<u64> {
    let mut cursor = id;
    for _ in 0..4 {
        cursor = crate::ancestry::get(&w.ancestry, cursor)?.parent()?;
    }
    crate::ancestry::get(&w.ancestry, cursor).map(|a| a.id)
}

pub(crate) type Profiles = BTreeMap<u64, (usize, u64, [f64; 3])>;

pub(crate) fn add_profile(
    groups: &mut Profiles,
    family: u64,
    c: &crate::organism::Cell,
    g: &crate::genetics::Compiled,
) {
    let entry = groups.entry(family).or_default();
    entry.0 += 1;
    entry.1 = c.generation - c.generation % 4;
    entry.2[0] += 100. * g.body[1] / g.body[0];
    entry.2[1] += g.chromosome.chemistry.membrane.x;
    entry.2[2] += g.chromosome.chemistry.membrane.y;
}

#[cfg(test)]
pub fn profiles(w: &World) -> Value {
    let mut groups = Profiles::new();
    for c in &w.cells {
        let g = w.genomes[&c.genome].compiled.as_ref().unwrap();
        add_profile(&mut groups, crate::presentation::family(w, c), c, g);
    }
    profiles_from(w, groups)
}

pub(crate) fn profiles_from(w: &World, groups: Profiles) -> Value {
    let mut groups: Vec<_> = groups.into_iter().collect();
    groups.sort_by(|a, b| b.1.0.cmp(&a.1.0).then(a.0.cmp(&b.0)));
    json!(
        groups
            .into_iter()
            .take(64)
            .map(|(id, (count, generation, sums))| {
                json!({"id":id,"parent":parent_family(w,id),"born":crate::ancestry::get(&w.ancestry,id).map(|a|a.born),
            "generation":generation,"count":count,"motor":sums[0]/count as f64,
            "membrane":[sums[1]/count as f64,sums[2]/count as f64]})
            })
            .collect::<Vec<_>>()
    )
}

pub fn inspect(w: &World, id: u64) -> Value {
    let Some(reference) = crate::ancestry::get(&w.ancestry, id) else {
        return Value::Null;
    };
    let mut cursor = Some(id);
    let mut path = Vec::<&Ancestor>::new();
    let mut generation = 0usize;
    let mut family = id;
    let mut complete = true;
    // Count the complete path but transmit only its nearest twelve records.
    while let Some(current) = cursor {
        let Some(a) = crate::ancestry::get(&w.ancestry, current) else {
            complete = false;
            break;
        };
        if path.len() < 12 {
            path.push(a);
        }
        generation += 1;
        cursor = a.parent();
    }
    generation -= 1;
    if let Some(cell) = w.cells.iter().find(|c| c.id == id) {
        generation = cell.generation as usize;
    } else if !complete {
        return Value::Null;
    }
    for _ in 0..generation % 4 {
        let Some(parent) = crate::ancestry::get(&w.ancestry, family)
            .and_then(|a| a.parent())
            .filter(|p| crate::ancestry::get(&w.ancestry, *p).is_some())
        else {
            break;
        };
        family = parent;
    }
    let (child_count, children) = bounded(w.ancestry.iter().filter(|a| a.parent() == Some(id)));
    let (sibling_count, siblings) = bounded(w.ancestry.iter().filter(|a| {
        reference.parent().is_some() && a.id != id && a.parent() == reference.parent()
    }));
    let mut below = std::collections::BTreeSet::from([id]);
    for a in &w.ancestry {
        if below.contains(&a.parent) {
            below.insert(a.id);
        }
    }
    let (descendant_count, descendants) = bounded(
        w.cells
            .iter()
            .filter(|c| c.id != id && below.contains(&c.id))
            .filter_map(|c| crate::ancestry::get(&w.ancestry, c.id)),
    );
    json!({"generation":generation,"family":family,"parentFamily":parent_family(w,family),
        "familyBorn":crate::ancestry::get(&w.ancestry,family).map(|a|a.born),"familyGeneration":generation-generation%4,
        "complete":complete && w.ancestry.len() as u64 + 1 == w.next_cell,
        "path":path,"hiddenAncestors":(generation+1).saturating_sub(path.len()),
        "children":children,"childCount":child_count,
        "siblings":siblings,"siblingCount":sibling_count,
        "descendants":descendants,"descendantCount":descendant_count})
}

fn bounded<'a>(records: impl Iterator<Item = &'a Ancestor>) -> (usize, Vec<&'a Ancestor>) {
    let mut total = 0;
    let mut shown = Vec::with_capacity(24);
    for a in records {
        total += 1;
        if shown.len() < 24 {
            shown.push(a);
        }
    }
    (total, shown)
}
