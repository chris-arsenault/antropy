use crate::{
    binding::{Key, Keys},
    config::Config,
    genetics::Genotype,
    random::Random,
};
use std::sync::Arc;

fn lock(species: usize) -> Key {
    Key {
        weights: std::array::from_fn(|j| {
            if species & (1 << (7 - j)) == 0 {
                -1.
            } else {
                1.
            }
        }),
        bias: -7.,
    }
}

#[test]
fn ordinary_ecology_founders_and_births_use_all_keyed_consumers() {
    let config = Config {
        width: 24.,
        height: 24.,
        founders: 4,
        source_count: 4,
        ..Config::ecology()
    };
    let w = crate::world::World::new(27, config).unwrap();
    for (index, g) in w.genomes.values().enumerate() {
        let compiled = g.compiled.as_ref().unwrap();
        let keys = compiled.chromosome.chemistry.keys.as_ref().unwrap();
        let input = [0, 128, 136, 8][index];
        assert_eq!(
            keys.enzymes[0],
            Key::target(crate::chemistry::coordinate(input))
        );
        assert_eq!(
            compiled.operators.receptors[0].as_ref(),
            &keys.receptors[0].compile(w.config.binding_lambda)
        );
        assert_eq!(
            compiled.operators.transporters[0].as_ref(),
            &keys.transporters[0].compile(w.config.binding_lambda)
        );
        assert_eq!(
            compiled.operators.membrane.as_ref(),
            &keys.membrane.compile(w.config.binding_lambda)
        );
        let cell = &w.cells[index];
        let child = g.inherit(
            9,
            1,
            &cell.brain,
            &mut Random::new(91),
            &w.config,
            &w.chemistry,
        );
        assert!(child.express().chemistry.keys.is_some());
        child.validate(&w.config).unwrap();
    }
    let restored = crate::world::World::restore(&w.snapshot().unwrap()).unwrap();
    assert!(!restored.config.radial_founders);
    assert!(
        restored
            .genomes
            .values()
            .all(|g| g.express().chemistry.keys.is_some())
    );
    let radial = crate::world::World::new(
        27,
        Config {
            radial_founders: true,
            ..w.config.clone()
        },
    )
    .unwrap();
    assert!(
        radial
            .genomes
            .values()
            .all(|g| g.express().chemistry.keys.is_none())
    );
    assert_eq!(w.ledger.initial_material, radial.ledger.initial_material);
    assert_eq!(w.ledger.initial_energy, radial.ledger.initial_energy);
}
fn keys() -> Keys {
    Keys {
        receptors: [lock(0); 4],
        transporters: [lock(0); 4],
        enzymes: [lock(0); 8],
        membrane: lock(0),
    }
}

#[test]
fn all_consumers_share_keyed_rows_and_only_changed_sites_recompile() {
    let c = Config::default();
    let chemistry = crate::chemistry::Chemistry::new(101).unwrap();
    let mut g = Genotype::seed(&c, &chemistry);
    g.chromosomes[0].chemistry.keys = Some(keys());
    g.compile(&c, &chemistry);
    let before = g.compiled.as_ref().unwrap().operators.clone();
    let receptor = &before.receptors[0];
    assert_eq!(receptor.len(), before.transporters[0].len());
    assert_eq!(receptor.len(), before.membrane.len());
    assert_eq!(receptor.len(), before.enzymes[0].conversions.len());
    for a in receptor.iter() {
        let edge = before.enzymes[0]
            .conversions
            .iter()
            .find(|e| e.substrate == a.species)
            .unwrap();
        assert_eq!(edge.binding, a.value);
        assert_eq!(
            before
                .membrane
                .iter()
                .find(|b| b.species == a.species)
                .unwrap()
                .value,
            a.value
        );
        assert_eq!(
            before.transporters[0]
                .iter()
                .find(|b| b.species == a.species)
                .unwrap()
                .value,
            a.value
        );
    }
    g.chromosomes[0].chemistry.keys.as_mut().unwrap().receptors[0] = lock(255);
    g.compile(&c, &chemistry);
    let after = &g.compiled.as_ref().unwrap().operators;
    assert!(!Arc::ptr_eq(&before.receptors[0], &after.receptors[0]));
    assert!(Arc::ptr_eq(&before.receptors[1], &after.receptors[1]));
    assert!(Arc::ptr_eq(&before.transporters[0], &after.transporters[0]));
    assert!(Arc::ptr_eq(&before.enzymes[0], &after.enzymes[0]));
    assert!(Arc::ptr_eq(&before.membrane, &after.membrane));
    let c = Config {
        binding_lambda: 0.25,
        ..c
    };
    g.compile(&c, &chemistry);
    assert!(!Arc::ptr_eq(
        &before.membrane,
        &g.compiled.as_ref().unwrap().operators.membrane
    ));
    assert!(g.compiled.as_ref().unwrap().operators.membrane.len() > before.membrane.len());
}

#[test]
fn keys_survive_clonal_birth_and_checkpoint_with_closed_accounts() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
    let g = w.genomes.get_mut(&1).unwrap();
    g.chromosomes[0].chemistry.keys = Some(keys());
    g.compile(&w.config, &w.chemistry);
    crate::diagnostics::initialize(&mut w);
    let parent = &w.genomes[&1];
    let child = parent.inherit(
        2,
        1,
        &w.cells[0].brain,
        &mut Random::new(7),
        &w.config,
        &w.chemistry,
    );
    assert_eq!(
        parent.chromosomes[0].chemistry.keys,
        child.chromosomes[0].chemistry.keys
    );
    assert!(Arc::ptr_eq(
        &parent.compiled.as_ref().unwrap().operators.membrane,
        &child.compiled.as_ref().unwrap().operators.membrane
    ));
    let mut restored = crate::world::World::restore(&w.snapshot().unwrap()).unwrap();
    assert_eq!(
        restored.genomes[&1].chromosomes[0].chemistry.keys,
        Some(keys())
    );
    for _ in 0..8 {
        restored.step();
    }
    let summary = crate::observation::summary(&restored);
    assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-9);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-9);
}

#[test]
fn near_zero_support_and_ambiguous_or_invalid_keys_are_handled() {
    let c = Config {
        binding_lambda: 64.,
        ..Config::default()
    };
    let chemistry = crate::chemistry::Chemistry::new(101).unwrap();
    let mut g = Genotype::seed(&c, &chemistry);
    let empty = Key {
        weights: [0.; 8],
        bias: -9.,
    };
    // Exercise stable near-zero rows at the declared bias/steepness limits.
    assert!(empty.affinity(0, c.binding_lambda).is_finite());
    g.chromosomes[0].chemistry.keys = Some(Keys {
        membrane: empty,
        ..keys()
    });
    g.compile(&c, &chemistry);
    assert!(
        g.compiled
            .as_ref()
            .unwrap()
            .operators
            .profile
            .iter()
            .all(|x| x.is_finite())
    );
    g.chromosomes[0]
        .chemistry
        .keys
        .as_mut()
        .unwrap()
        .membrane
        .weights[0] = f64::NAN;
    assert!(g.validate(&c).is_err());
    g.chromosomes[0].chemistry.keys = Some(keys());
    let mut other = g.chromosomes[0].clone();
    other.chemistry.keys = None;
    g.chromosomes.push(other);
    assert!(
        g.validate(&Config {
            ploidy: "diploid".into(),
            ..c
        })
        .is_err()
    );
}

#[test]
fn common_mutation_changes_key_values_within_their_declared_domains() {
    let c = Config {
        physical_mutation_rate: 1.,
        physical_mutation_scale: 100.,
        ..Config::default()
    };
    let mut k = keys();
    let before = k.clone();
    assert!(k.mutate(&mut Random::new(7), &c));
    assert_ne!(k, before);
    k.validate().unwrap();
}

#[test]
fn program_duplication_preserves_keyed_recognition_and_total_capacity() {
    let c = Config::default();
    let chemistry = crate::chemistry::Chemistry::new(101).unwrap();
    let mut g = Genotype::seed(&c, &chemistry);
    let mut k = keys();
    k.enzymes[4] = lock(255);
    g.chromosomes[0].chemistry.keys = Some(k);
    g.compile(&c, &chemistry);
    let before = g.compiled.as_ref().unwrap().body[11];
    crate::genetics::repertoire::duplicate(&mut g, 0, 4);
    g.compile(&c, &chemistry);
    let compiled = g.compiled.as_ref().unwrap();
    assert_eq!(
        compiled.body[11] + compiled.body[crate::organism::enzyme_stock(4)],
        before
    );
    let k = compiled.chromosome.chemistry.keys.as_ref().unwrap();
    assert_eq!(k.enzymes[0], k.enzymes[4]);
    for (a, b) in compiled.operators.enzymes[0]
        .conversions
        .iter()
        .zip(compiled.operators.enzymes[4].conversions.iter())
    {
        assert_eq!(
            (a.substrate, a.binding, a.catalytic),
            (b.substrate, b.binding, b.catalytic)
        );
    }
}
