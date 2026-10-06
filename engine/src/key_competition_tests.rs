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
                assert!((key.affinity(s, lambda) - weight / partition).abs() < 1e-13);
            }
            assert!(total(&key, lambda) <= 1. + 1e-13);
            assert!(key.compile(lambda).iter().map(|a| a.value).sum::<f64>() <= 1. + 1e-13);
        }
    }
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
    assert!(total(&weak, 6.) < 0.001);
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
