use crate::{binding::Key, config::Config, random::Random};

fn total(key: &Key, lambda: f64) -> f64 {
    (0..256).map(|s| key.affinity(s, lambda)).sum()
}

#[test]
fn competing_states_match_the_explicit_partition_and_share_finite_capacity() {
    for key in [
        Key::target([0., 0.]),
        Key {
            weights: [0.; 8],
            bias: 9.,
        },
        Key {
            weights: [-0.8, 0.1, 0.3, -0.2, 0.6, -0.7, 0.4, 0.9],
            bias: 8.1,
        },
    ] {
        for lambda in [0.25, 3., 6.] {
            let weights: Vec<_> = (0..256).map(|s| (lambda * key.score(s)).exp()).collect();
            let partition = 1. + weights.iter().sum::<f64>();
            for (s, weight) in weights.iter().enumerate() {
                assert!((key.affinity_with(s, lambda, false) - weight / partition).abs() < 1e-13);
            }
            assert!(total(&key, lambda) <= 1. + 1e-13);
            assert!(key.compile(lambda).iter().map(|a| a.value).sum::<f64>() <= 1. + 1e-13);
        }
    }
}

#[test]
fn preference_changes_do_not_destroy_binding_strength_or_grant_extra_capacity() {
    let parent = Key::target([0., 0.]);
    for lambda in [0.25, 3., 6., 64.] {
        for magnitude in [0., 0.25, 0.5, 0.75, 0.88, 1.] {
            let altered = Key {
                weights: [-magnitude; 8],
                ..parent
            };
            assert!((total(&altered, lambda) - total(&parent, lambda)).abs() < 1e-12);
        }
        for species in 0..256 {
            assert!(
                (parent.affinity(species, lambda) - parent.affinity_with(species, lambda, false))
                    .abs()
                    < 1e-13
            );
        }
    }
    let intermediate = Key {
        weights: [-0.75; 8],
        ..parent
    };
    let old: f64 = (0..256)
        .map(|s| intermediate.affinity_with(s, 6., false))
        .sum();
    assert!(old < 0.003);
    assert!(total(&intermediate, 6.) > 0.99);
    // A changed preference redistributes the fixed occupied share, including to new inputs.
    assert!(intermediate.affinity(128, 6.) > parent.affinity(128, 6.));
}

#[test]
fn ordinary_preference_mutations_preserve_strength_without_compensating_bias_mutations() {
    let config = Config::ecology();
    let mut rng = Random::new(27);
    let mut key = Key::target([0., 0.]);
    let original = key;
    let occupied = total(&key, config.binding_lambda);
    for event in 0..128 {
        key.mutate_locus(event % 8, &mut rng, &config);
        assert_eq!(key.bias, original.bias);
        assert!((total(&key, config.binding_lambda) - occupied).abs() < 1e-12);
    }
    assert_ne!(key.weights, original.weights);
    assert!(
        key.compile(config.binding_lambda).len() > original.compile(config.binding_lambda).len()
    );
}

#[test]
fn strength_ablation_recompiles_all_consumers_and_persists_as_startup_configuration() {
    let mut config = Config::ecology();
    let chemistry = crate::chemistry::Chemistry::new(101).unwrap();
    let mut g = crate::genetics::Genotype::seed(&config, &chemistry);
    let key = Key {
        weights: [-0.75; 8],
        bias: -7.,
    };
    let keys = g.chromosomes[0].chemistry.keys.as_mut().unwrap();
    keys.receptors.fill(key);
    keys.transporters.fill(key);
    keys.enzymes.fill(key);
    keys.membrane = key;
    g.compile(&config, &chemistry);
    let before = g.compiled.as_ref().unwrap().operators.clone();
    config.binding_independent_strength = false;
    g.compile(&config, &chemistry);
    let after = &g.compiled.as_ref().unwrap().operators;
    assert!(!std::sync::Arc::ptr_eq(&before.membrane, &after.membrane));
    assert!(before.transporters[0][0].value > 100. * after.transporters[0][0].value);
    assert!(
        before.enzymes[0].conversions.get(0).binding
            > 100. * after.enzymes[0].conversions.get(0).binding
    );
    let w = crate::world::World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 4,
            source_count: 4,
            ..config
        },
    )
    .unwrap();
    let restored = crate::world::World::restore(&w.snapshot().unwrap()).unwrap();
    assert!(!restored.config.binding_independent_strength);
}

#[test]
fn positive_bias_cannot_grant_universal_strong_binding_or_protection() {
    let generalist = Key {
        weights: [0.; 8],
        bias: 9.,
    };
    let config = Config::ecology();
    for s in 0..256 {
        let affinity = generalist.affinity(s, config.binding_lambda);
        assert!((affinity - 1. / 256.).abs() < 1e-14);
        let susceptibility = 1. - (1. - config.susceptibility_floor) * affinity;
        assert!(susceptibility > 0.996);
    }
    let mut selective = Key::target([0., 0.]);
    selective.bias = 9.;
    assert!(selective.affinity(0, config.binding_lambda) > 0.9999);
    assert!(selective.affinity(128, config.binding_lambda) < 1e-5);
    assert_eq!(selective.compile(config.binding_lambda).len(), 1);
}

#[test]
fn binding_strength_changes_total_binding_without_erasing_chemical_preferences() {
    let mut weak = Key::target([0., 0.]);
    weak.weights[0] = 0.3;
    weak.bias = -9.;
    let mut strong = weak;
    strong.bias = 9.;
    let odds = |key: &Key| key.affinity(0, 6.) / key.affinity(128, 6.);
    assert!((odds(&weak) / odds(&strong) - 1.).abs() < 1e-13);
    let narrow_weak = Key {
        weights: [-1.; 8],
        bias: weak.bias,
    };
    assert!((total(&weak, 6.) - total(&narrow_weak, 6.)).abs() < 1e-13);
    assert!(total(&strong, 6.) > 100. * total(&weak, 6.));
    assert!(total(&strong, 6.) > 0.999);
}

#[test]
fn one_inherited_bit_change_reassigns_strong_binding_in_both_directions() {
    let parent = Key::target([0., 0.]);
    let mut daughter = parent;
    daughter.weights[0] = 1.;
    assert!(parent.affinity(0, 6.) > 0.99);
    assert!(daughter.affinity(0, 6.) < 1e-5);
    assert!(parent.affinity(128, 6.) < 1e-5);
    assert!(daughter.affinity(128, 6.) > 0.99);
}

#[test]
fn bit_relabeling_preserves_the_binding_partition_without_favored_identities() {
    let key = Key {
        weights: [-0.8, 0.1, 0.3, -0.2, 0.6, -0.7, 0.4, 0.9],
        bias: 2.,
    };
    for mask in [1, 42, 136, 255] {
        let relabeled = Key {
            weights: std::array::from_fn(|j| {
                key.weights[j] * if mask & (1 << (7 - j)) == 0 { 1. } else { -1. }
            }),
            bias: key.bias,
        };
        for s in 0..256 {
            assert!((key.affinity(s, 6.) - relabeled.affinity(s ^ mask, 6.)).abs() < 1e-13);
        }
    }
}

#[test]
fn common_mutation_and_extreme_domains_preserve_the_competition_budget() {
    let config = Config {
        physical_mutation_rate: 1.,
        physical_mutation_scale: 100.,
        ..Config::ecology()
    };
    let mut keys = crate::binding::Keys::founders(&crate::genetics::Machinery::seed(
        &crate::chemistry::Chemistry::new(101).unwrap(),
        &[0, 136],
    ));
    let mut rng = Random::new(91);
    for _ in 0..16 {
        keys.mutate(&mut rng, &config);
        keys.validate().unwrap();
        for site in 0..17 {
            for lambda in [1e-5, 0.25, 6., 64.] {
                let key = keys.site(site);
                assert!((0..256).all(|s| key.affinity(s, lambda).is_finite()));
                assert!(total(&key, lambda) <= 1. + 1e-12);
            }
        }
    }
    for bias in [-9., 9.] {
        for weights in [[0.; 8], [-1.; 8], [1.; 8]] {
            let key = Key { weights, bias };
            assert!(total(&key, 64.).is_finite());
            assert!(total(&key, 64.) <= 1. + 1e-12);
        }
    }
}
