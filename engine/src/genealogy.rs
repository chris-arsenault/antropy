//! Bounded presentation records derived from complete parentage, never physical inputs.
use crate::{ancestry::Ancestor, world::World};
use serde_json::{Value, json};
use std::collections::BTreeMap;

fn parent_family(w: &World, id: u64) -> Option<u64> {
    let mut cursor = id;
    for _ in 0..4 {
        cursor = w.ancestry[cursor as usize - 1].parent()?;
    }
    Some(cursor)
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
                json!({"id":id,"parent":parent_family(w,id),"born":w.ancestry[id as usize-1].born,
            "generation":generation,"count":count,"motor":sums[0]/count as f64,
            "membrane":[sums[1]/count as f64,sums[2]/count as f64]})
            })
            .collect::<Vec<_>>()
    )
}

pub fn inspect(w: &World, id: u64) -> Value {
    let reference = &w.ancestry[id as usize - 1];
    let mut cursor = Some(id);
    let mut path = Vec::<&Ancestor>::new();
    let mut generation = 0usize;
    let mut family = id;
    // Count the complete path but transmit only its nearest twelve records.
    while let Some(current) = cursor {
        let a = &w.ancestry[current as usize - 1];
        if path.len() < 12 {
            path.push(a);
        }
        generation += 1;
        cursor = a.parent();
    }
    generation -= 1;
    for _ in 0..generation % 4 {
        family = w.ancestry[family as usize - 1].parent().unwrap();
    }
    let (child_count, children) = bounded(w.ancestry.iter().filter(|a| a.parent() == Some(id)));
    let (sibling_count, siblings) = bounded(w.ancestry.iter().filter(|a| {
        reference.parent().is_some() && a.id != id && a.parent() == reference.parent()
    }));
    let mut below = vec![false; w.ancestry.len()];
    below[id as usize - 1] = true;
    for a in &w.ancestry {
        if let Some(parent) = a.parent() {
            below[a.id as usize - 1] |= below[parent as usize - 1];
        }
    }
    let (descendant_count, descendants) = bounded(
        w.cells
            .iter()
            .filter(|c| c.id != id && below[c.id as usize - 1])
            .map(|c| &w.ancestry[c.id as usize - 1]),
    );
    json!({"generation":generation,"family":family,"parentFamily":parent_family(w,family),
        "familyBorn":w.ancestry[family as usize - 1].born,"familyGeneration":generation-generation%4,
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
