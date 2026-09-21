use super::*;
use crate::{chemistry::Chemistry, config::Config};

fn genotype(id: u64) -> Genotype {
    let config = Config::default();
    let mut g = Genotype::seed(&config, &Chemistry::new(config.chemistry_seed).unwrap());
    g.id = id;
    g
}

#[test]
fn swap_removal_replacement_and_reinsertion_keep_one_authoritative_owner() {
    let mut store: GenotypeStore = [1, 257, u64::MAX, 4]
        .map(|id| (id, genotype(id)))
        .into_iter()
        .collect();
    assert_eq!(store.remove(&257).unwrap().id, 257);
    assert_eq!(store[&4].id, 4);
    assert_eq!(store[&u64::MAX].id, u64::MAX);
    assert!(store.get(&257).is_none());
    store.insert(257, genotype(257));
    let mut replacement = genotype(4);
    replacement.learned = 0.75;
    assert_eq!(store.insert(4, replacement).unwrap().learned, 0.);
    assert_eq!(store.len(), 4);
    assert_eq!(store[&4].learned, 0.75);
    store.retain(|id, g| {
        g.born = 10;
        *id == 257 || *id == u64::MAX
    });
    assert_eq!(store.len(), 2);
    assert_eq!(store[&257].born, 10);
    assert_eq!(store[&u64::MAX].born, 10);
    assert!(!store.contains_key(&4));
    store.clear();
    assert!(store.is_empty());
    store.insert(1, genotype(1));
    assert_eq!(store[&1].id, 1);
}

#[test]
fn same_id_recompilation_is_immediately_visible_to_all_lookup_consumers() {
    let config = Config::default();
    let chemistry = Chemistry::new(config.chemistry_seed).unwrap();
    let mut store: GenotypeStore = [(1, genotype(1))].into_iter().collect();
    let before = store[&1].compiled.as_ref().unwrap().body[0];
    let g = store.get_mut(&1).unwrap();
    g.chromosomes[0].physical[0] = 1.;
    g.compile(&config, &chemistry);
    let expected = config.birth_mass * std::f64::consts::E;
    assert!(expected > before);
    assert_eq!(store[&1].compiled.as_ref().unwrap().body[0], expected);
    assert_eq!(
        store
            .values()
            .next()
            .unwrap()
            .compiled
            .as_ref()
            .unwrap()
            .body[0],
        expected
    );
    // The lookup key remains independent of a corrupted record, allowing World validation.
    store.get_mut(&1).unwrap().id = 9;
    assert_eq!(store.iter().next().unwrap().0, &1);
    assert!(store.get(&9).is_none());
}

#[test]
fn sorted_map_serialization_roundtrips_sparse_keys_after_dense_reordering() {
    let original: BTreeMap<_, _> = [1, 257, u64::MAX]
        .map(|id| (id, genotype(id)))
        .into_iter()
        .collect();
    let bytes = postcard::to_stdvec(&original).unwrap();
    let mut store: GenotypeStore = postcard::from_bytes(&bytes).unwrap();
    let removed = store.remove(&1).unwrap();
    store.insert(1, removed);
    assert_eq!(postcard::to_stdvec(&store).unwrap(), bytes);
    let json = serde_json::to_value(&store).unwrap();
    assert_eq!(json, serde_json::to_value(&original).unwrap());
    let restored: GenotypeStore = serde_json::from_value(json).unwrap();
    assert_eq!(restored.len(), 3);
    assert_eq!(restored[&u64::MAX].id, u64::MAX);
    assert!(restored[&1].compiled.is_none());
}
