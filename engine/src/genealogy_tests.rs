use crate::{ancestry::Cause, config::Config, genealogy, observation, world::World};
use serde_json::json;

fn family_world() -> World {
    let mut w = World::new(
        101,
        Config {
            width: 24.,
            height: 24.,
            founders: 8,
            source_count: 0,
            ..Default::default()
        },
    )
    .unwrap();
    // Two unrelated founders, a sibling branch and five generations in the other branch.
    let parents = [0, 0, 1, 1, 3, 5, 6, 7];
    let generations = [0, 0, 1, 1, 2, 3, 4, 5];
    for (i, a) in w.ancestry.iter_mut().enumerate() {
        a.parent = parents[i];
        a.lineage = if i == 1 { 2 } else { 1 };
        if ![2, 4, 8].contains(&a.id) {
            a.ended = 0;
            a.cause = Cause::Division;
        }
    }
    w.cells.retain(|c| [2, 4, 8].contains(&c.id));
    for c in &mut w.cells {
        let i = c.id as usize - 1;
        c.parent = (parents[i] != 0).then_some(parents[i]);
        c.lineage = if c.id == 2 { 2 } else { 1 };
        c.generation = generations[i];
    }
    crate::diagnostics::initialize(&mut w);
    w
}

#[test]
fn genealogy_preserves_ended_branches_and_independent_founders_across_restore() {
    let w = family_world();
    let before = w.snapshot().unwrap();
    let root = observation::inspect(&w, 1).unwrap();
    assert_eq!(root["genealogy"]["descendantCount"], 2);
    assert_eq!(root["genealogy"]["siblingCount"], 0);
    assert_eq!(root["genealogy"]["childCount"], 2);
    assert_eq!(root["relationships"]["kin"], 2);
    let leaf = observation::inspect(&w, 8).unwrap();
    let g = &leaf["genealogy"];
    assert_eq!(g["generation"], 5);
    assert_eq!(g["family"], 7);
    assert_eq!(g["parentFamily"], 1);
    assert_eq!(g["familyGeneration"], 4);
    assert_eq!(g["descendantCount"], 0);
    assert_eq!(
        g["path"]
            .as_array()
            .unwrap()
            .iter()
            .map(|a| a["id"].clone())
            .collect::<Vec<_>>(),
        vec![json!(8), json!(7), json!(6), json!(5), json!(3), json!(1)]
    );
    let cousin = leaf["relationships"]["rows"]
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["cell"] == 4)
        .unwrap();
    assert_eq!(cousin["links"], 6);
    let sibling = genealogy::inspect(&w, 3);
    assert_eq!(sibling["siblings"][0]["id"], 4);
    let profiles = genealogy::profiles(&w);
    let family = profiles
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["id"] == 7)
        .unwrap();
    assert_eq!(family["parent"], 1);
    assert_eq!(family["count"], 1);
    assert_eq!(w.snapshot().unwrap(), before);
    let restored = World::restore(&before).unwrap();
    assert_eq!(leaf, observation::inspect(&restored, 8).unwrap());
}

#[test]
fn long_parentage_has_bounded_display_records_without_dropping_saved_ancestors() {
    let mut w = World::new(
        101,
        Config {
            width: 16.,
            height: 16.,
            founders: 1,
            source_count: 0,
            ..Default::default()
        },
    )
    .unwrap();
    crate::storage_diagnostics::history(&mut w, 100_000).unwrap();
    let before = w.snapshot().unwrap();
    let g = genealogy::inspect(&w, 100_000);
    assert_eq!(g["path"].as_array().unwrap().len(), 12);
    assert_eq!(g["hiddenAncestors"], 99_988);
    assert_eq!(genealogy::inspect(&w, 1)["descendantCount"], 1);
    assert_eq!(w.ancestry.len(), 100_000);
    assert_eq!(w.snapshot().unwrap(), before);
}
