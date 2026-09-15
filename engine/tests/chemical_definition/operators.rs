use super::parameters::fixture;
use antropy_engine::{
    chemical_operators::*,
    chemistry::{Chemistry, affinity, compile_affinity, coordinate},
    genetics::Target,
    machinery_parameters::{InstalledParameters, MachineryParameters},
};

pub fn cases() -> Vec<(&'static str, MachineryParameters)> {
    [
        ("corner", [0., 0.], [1., 1.]),
        ("center", [7., 7.], [1., 0.]),
        ("fractional", [7.5, 7.5], [0.25, -0.75]),
        ("reflected", [14.5, 14.5], [1., 1.]),
        ("idle", [7., 7.], [0., 0.]),
    ]
    .into_iter()
    .map(|(name, [x, y], offset)| {
        let mut p = fixture();
        let center = Target { x, y };
        p.receptors = [center; 4];
        p.membrane = center;
        for t in &mut p.transporters {
            t.center = center;
        }
        for e in &mut p.enzymes {
            e.center = center;
            e.offset = offset;
        }
        (name, p)
    })
    .collect()
}

// Independent hat-function enumeration, not the compiler's four-corner construction.
fn dense_weight(s: usize, p: usize, offset: [f64; 2]) -> f64 {
    let a = coordinate(s);
    let b = coordinate(p);
    let mut weight = 1.;
    for k in 0..2 {
        let x = a[k] + offset[k];
        let reflected = 15. - ((x % 30. + 30.) % 30. - 15.).abs();
        weight *= (1. - (reflected - b[k]).abs()).max(0.);
    }
    weight
}

fn verify_enzyme(parameters: &MachineryParameters, enzyme: &[Conversion], chemistry: &Chemistry) {
    let e = parameters.enzymes[0];
    let mut count = 0;
    for s in 0..256 {
        let a = affinity(e.center.point(), s, 3.);
        if a == 0. {
            continue;
        }
        let map = &enzyme[count];
        assert_eq!(map.substrate, s);
        assert_eq!(map.binding, a);
        let mut output = 0.;
        let mut product_sum = 0.;
        for p in 0..256 {
            let weight = dense_weight(s, p, e.offset);
            let actual = map
                .products
                .iter()
                .find(|v| v.species == p)
                .map_or(0., |v| v.weight);
            assert!((actual - weight).abs() < 1e-13);
            output += weight * chemistry.properties[p].potential;
            product_sum += actual;
        }
        assert!((product_sum - 1.).abs() < 1e-13);
        let delta = chemistry.properties[s].potential - output;
        let work = if delta >= 0. {
            0.8 * delta
        } else {
            delta / 0.8
        } - 0.05;
        assert!((map.work - work).abs() < 1e-12);
        assert!((map.heat - (delta - work)).abs() < 1e-12);
        assert!(map.heat >= 0.);
        assert_eq!(
            map.attenuation,
            1. / (1. + (e.offset[0].powi(2) + e.offset[1].powi(2)) / 9.)
        );
        count += 1;
    }
    assert_eq!(count, enzyme.len());
}

#[test]
fn compact_operators_match_dense_forward_maps() {
    let c = Chemistry::new(101).unwrap();
    let compiler = OperatorCompiler::new(&c).unwrap();
    for (_, p) in cases() {
        let op = compiler.compile_target(&p).unwrap();
        verify_enzyme(&p, &op.enzymes[0], &c);
        for s in 0..256 {
            let expected = affinity(p.enzymes[0].center.point(), s, 3.)
                + (0..256)
                    .map(|origin| {
                        affinity(p.enzymes[0].center.point(), origin, 3.)
                            * dense_weight(origin, s, p.enzymes[0].offset)
                    })
                    .sum::<f64>();
            let actual = op.engagement[0]
                .iter()
                .find(|a| a.species == s)
                .map_or(0., |a| a.value);
            assert!((actual - expected).abs() < 1e-12);
        }
        assert_eq!(op.membrane, p.membrane.point());
        assert_eq!(op.profile, c.profiles.evaluate(p.membrane.point()));
        for s in 0..256 {
            assert_eq!(
                op.stress[s],
                c.properties[s].stress * (1. - 0.95 * affinity(p.membrane.point(), s, 3.))
            );
            for slot in 0..4 {
                let expected = affinity(p.receptors[slot].point(), s, 3.);
                let actual = op.receptors[slot]
                    .iter()
                    .find(|a| a.species == s)
                    .map_or(0., |a| a.value);
                assert_eq!(actual, expected);
                assert_eq!(op.transporters[slot], op.receptors[slot]);
            }
        }
    }
}

#[test]
fn actual_processing_and_sensing_are_continuous_at_topology_changes() {
    use antropy_engine::{
        composed::{
            Accounts,
            machinery::{ReactionWork, receptors},
        },
        config::Config,
        world::World,
    };
    let world = World::new(
        101,
        Config {
            founders: 1,
            ..Config::default()
        },
    )
    .unwrap();
    let compiler = OperatorCompiler::new(&world.chemistry).unwrap();
    let local = std::array::from_fn(|s| 0.1 + s as f64 / 255.);
    for x in [3., 7., 14.] {
        for offset in [0., 1., -1.] {
            for eps in [1e-4, 1e-6] {
                let mut p = fixture();
                for e in &mut p.enzymes {
                    e.center.x = x - eps;
                    e.offset[0] = offset - eps;
                }
                p.receptors[0].x = x - eps;
                let a = compiler.compile_target(&p).unwrap();
                for e in &mut p.enzymes {
                    e.center.x = x + eps;
                    e.offset[0] = offset + eps;
                }
                p.receptors[0].x = x + eps;
                let b = compiler.compile_target(&p).unwrap();
                let mut left = world.cells[0].clone();
                left.inventory.fill(0.1);
                left.energy = 10.;
                let mut right = left.clone();
                let mut work = ReactionWork::default();
                work.react(&mut left, &a, &world.config, 0.2, &mut Accounts::default());
                work.react(&mut right, &b, &world.config, 0.2, &mut Accounts::default());
                let l1: f64 = left
                    .inventory
                    .iter()
                    .zip(right.inventory.iter())
                    .map(|(a, b)| (a - b).abs())
                    .sum();
                // Conservative Lipschitz envelope: four bounded slots, support <=36,
                // compact affinity, bilinear products and piecewise-linear reference yields.
                assert!(l1 + (left.energy - right.energy).abs() <= 4096. * eps + 1e-12);
                let sa = receptors(&left, &a, &local);
                let sb = receptors(&right, &b, &local);
                assert!(
                    sa.iter().zip(sb).map(|(a, b)| (a - b).abs()).sum::<f64>()
                        <= 4096. * eps + 1e-12
                );
            }
        }
    }
}

#[test]
fn supports_costs_and_cache_identity_are_bounded() {
    let c = Chemistry::new(101).unwrap();
    let compiler = OperatorCompiler::new(&c).unwrap();
    let mut maximum = 0;
    for x in 0..151 {
        for y in 0..151 {
            maximum = maximum.max(compile_affinity([x as f64 / 10., y as f64 / 10.], 3.).len());
        }
    }
    assert!(maximum <= MAX_SUPPORT);
    for (_, p) in cases() {
        let target = compiler.compile_target(&p).unwrap();
        assert_eq!(target, compiler.compile_target(&p).unwrap());
        assert!(target.enzymes.iter().all(|e| e.len() <= MAX_SUPPORT));
        assert!(target.enzymes.iter().map(|e| e.len()).sum::<usize>() <= MAX_CONVERSIONS);
        assert!(
            target
                .enzymes
                .iter()
                .flatten()
                .all(|e| e.products.len() <= 4)
        );
        assert!(target.owned_bytes() <= CompiledOperators::maximum_owned_bytes());
        let mut installed = InstalledParameters {
            revision: 7,
            parameters: p,
        };
        let a = compiler.compile_installed(&installed).unwrap();
        assert_ne!(target.key, a.key);
        assert!(std::sync::Arc::ptr_eq(
            &target.key.definition,
            &a.key.definition
        ));
        installed.revision += 1;
        let b = compiler.compile_installed(&installed).unwrap();
        assert_ne!(a.key, b.key);
        assert_eq!(a.enzymes, b.enzymes);
        installed.parameters.membrane.x += 0.001;
        assert_ne!(b.key, compiler.compile_installed(&installed).unwrap().key);
        let other = Chemistry::new(202).unwrap();
        assert_ne!(
            a.key.definition,
            OperatorCompiler::new(&other)
                .unwrap()
                .compile_installed(&installed)
                .unwrap()
                .key
                .definition
        );
    }
    let mut invalid = c.clone();
    invalid.properties[0].potential += 1.;
    assert!(OperatorCompiler::new(&invalid).is_err());
    println!(
        "maximum_sampled_support={maximum}; maximum_owned_bytes={}",
        CompiledOperators::maximum_owned_bytes()
    );
}

#[test]
fn installed_refresh_matches_recompile_and_retains_unaffected_maps() {
    let chemistry = Chemistry::new(101).unwrap();
    let compiler = OperatorCompiler::new(&chemistry).unwrap();
    let mut installed = InstalledParameters {
        revision: 0,
        parameters: fixture(),
    };
    let mut actual = compiler.compile_installed(&installed).unwrap();
    for change in 0..5 {
        let retained = actual.enzymes[3].as_ptr();
        match change {
            0 => installed.parameters.membrane.x += 0.1,
            1 => installed.parameters.receptors[0].x += 0.1,
            2 => installed.parameters.transporters[1].center.y += 0.1,
            3 => installed.parameters.enzymes[2].offset[0] += 0.1,
            _ => {}
        }
        installed.revision += 1;
        compiler.refresh_installed(&mut actual, &installed).unwrap();
        assert_eq!(actual, compiler.compile_installed(&installed).unwrap());
        assert_eq!(actual.enzymes[3].as_ptr(), retained);
    }
    let previous = actual.clone();
    installed.parameters.membrane.x = f64::NAN;
    assert!(compiler.refresh_installed(&mut actual, &installed).is_err());
    assert_eq!(actual, previous);
    installed.parameters.membrane = fixture().membrane;
    let other = Chemistry::new(202).unwrap();
    let other_compiler = OperatorCompiler::new(&other).unwrap();
    other_compiler
        .refresh_installed(&mut actual, &installed)
        .unwrap();
    assert_eq!(
        actual,
        other_compiler.compile_installed(&installed).unwrap()
    );
}
