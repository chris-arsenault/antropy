use crate::{chemical_group::Action, chemical_products::Transform, genetics::Enzyme};

#[test]
fn dyadic_generators_are_involutions_and_reach_every_identity() {
    for s in 0..256 {
        let mut reached = [false; 256];
        for word in 0..256 {
            let mut action = Action::identity();
            for j in 0..8 {
                let generator = Action::dyadic(j / 4, j % 4);
                assert_eq!(generator.inverse(), generator);
                assert_eq!(generator.compose(&generator), Action::identity());
                if word & (1 << j) != 0 {
                    action = action.compose(&generator);
                }
            }
            reached[action.apply(s)] = true;
        }
        assert!(reached.into_iter().all(|v| v));
    }
}

#[test]
fn every_pair_has_an_exchange_independent_of_recognition() {
    for a in 0..256 {
        for b in 0..256 {
            let mut e = Enzyme::between(
                crate::chemistry::coordinate(a),
                crate::chemistry::coordinate(b),
            );
            let first = Transform::new(e);
            assert_eq!(first.products(a)[0].species, b);
            assert_eq!(first.products(b)[0].species, a);
            assert_eq!(first.products(a).len(), 1);
            let [x, y] = crate::chemistry::coordinate(b);
            e.x = x;
            e.y = y;
            let recognized = Transform::new(e);
            assert_eq!(
                first.components()[0].action,
                recognized.components()[0].action
            );
        }
    }
}

#[test]
fn discrete_generators_are_bijections_with_exact_inverses_including_boundaries() {
    let identity = Action::identity();
    for x in 0..=30 {
        for y in 0..=30 {
            let reflection = Action::intervals([x, y]);
            assert_eq!(reflection.compose(&reflection), identity);
            for q in 0..4 {
                let a = reflection.compose(&Action::quarter(q));
                assert_eq!(a.compose(&a.inverse()), identity);
                assert_eq!(a.inverse().compose(&a), identity);
                let mut seen = [false; 256];
                for s in 0..256 {
                    assert!(!seen[a.apply(s)]);
                    seen[a.apply(s)] = true;
                    assert_eq!(a.inverse().apply(a.apply(s)), s);
                }
            }
        }
    }
}

#[test]
fn stored_actions_obey_composition_associativity_and_noncommutativity() {
    let a = Action::intervals([18, 9]).compose(&Action::quarter(1));
    let b = Action::adjacent(0, 14).compose(&Action::quarter(3));
    let c = Action::intervals([4, 25]);
    assert_eq!(a.compose(&b).compose(&c), a.compose(&b.compose(&c)));
    assert_ne!(a.compose(&b), b.compose(&a));
    for s in 0..256 {
        assert_eq!(a.compose(&b).apply(s), a.apply(b.apply(s)));
        assert_eq!(
            a.compose(&b).inverse().apply(s),
            b.inverse().apply(a.inverse().apply(s))
        );
    }
    // The old reflected +3/-3 counterexample is now a real action/inverse pair.
    let shift = Action::intervals([18, 15]).compose(&Action::quarter(2));
    assert_eq!(shift.inverse().apply(shift.apply(14 * 16)), 14 * 16);
}

#[test]
fn prefix_reflections_generate_adjacent_transpositions_and_reach_all_coordinates() {
    for axis in 0..2 {
        for lower in 0..15 {
            let mut k = [0; 2];
            k[axis] = (lower + 1) as u8;
            let p = Action::intervals(k);
            let mut first = [0; 2];
            first[axis] = 1;
            assert_eq!(
                p.compose(&Action::intervals(first)).compose(&p),
                Action::adjacent(axis, lower)
            );
        }
    }
    for x in 0..16 {
        for y in 0..16 {
            assert_eq!(
                Action::intervals([x, y]).apply(0),
                x as usize * 16 + y as usize
            );
        }
    }
}

#[test]
fn kinetic_mixtures_preserve_uniform_material_but_do_not_claim_an_inverse() {
    for (x, y, dx, dy, angle) in [
        (0., 0., 2.3, 1.1, -1.2),
        (7.3, 4.6, 3.1, 7.2, 0.37),
        (15., 15., 15., 0., 3.1),
    ] {
        let t = Transform::new(Enzyme {
            x,
            y,
            center_x: dx,
            center_y: dy,
            angle,
        });
        assert!(t.components().len() <= 8);
        let mut uniform = [0.; 256];
        for s in 0..256 {
            let products = t.products(s);
            assert!(products.len() <= 8);
            assert!((products.iter().map(|p| p.weight).sum::<f64>() - 1.).abs() < 1e-12);
            for p in products {
                assert!(p.weight > 0.);
                uniform[p.species] += p.weight;
            }
            for component in t.components() {
                assert_eq!(
                    component.action.inverse().apply(component.action.apply(s)),
                    s
                );
            }
        }
        assert!(uniform.iter().all(|v| (v - 1.).abs() < 1e-12));
    }
}

#[test]
fn kinetic_parameters_are_continuous_at_orientation_seams_and_interval_edges() {
    let eps = 1e-7;
    for angle in [0., std::f64::consts::FRAC_PI_2, std::f64::consts::PI] {
        for x in [0., 7.5, 15.] {
            let mut results = [[0.; 256]; 2];
            for (i, sign) in [-1., 1.].into_iter().enumerate() {
                let t = Transform::new(Enzyme {
                    x,
                    y: 7.,
                    center_x: 1. + sign * eps,
                    center_y: 6.,
                    angle: angle + sign * eps,
                });
                for p in t.products(15 * 16) {
                    results[i][p.species] += p.weight;
                }
            }
            let l1: f64 = results[0]
                .iter()
                .zip(results[1])
                .map(|(a, b)| (a - b).abs())
                .sum();
            assert!(l1 < 16. * eps, "{x}/{angle}: {l1}");
        }
    }
}
