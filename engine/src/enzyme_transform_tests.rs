use crate::{
    chemical_operators::Operators,
    chemical_products::Transform,
    chemistry::{self, Chemistry},
    config::Config,
    diagnostics,
    genetics::{Enzyme, Machinery, angles},
};
use std::f64::consts::PI;

fn enzyme(angle: f64) -> Enzyme {
    Enzyme {
        x: 7.,
        y: 7.,
        center_x: 1.,
        center_y: 6.,
        angle,
    }
}

#[test]
fn mixtures_of_identity_components_have_exact_zero_flow_and_work() {
    let chemistry = Chemistry::new(101).unwrap();
    let c = Config::default();
    let mut m = Machinery::seed(&chemistry, &chemistry.source_species());
    let mut rng = crate::random::Random::new(27);
    for _ in 0..256 {
        m.enzymes[0] = Enzyme {
            x: 15.,
            y: 15.,
            center_x: rng.unit(),
            center_y: rng.unit(),
            angle: 0.,
        };
        let op = Operators::compile(&m, &c, &chemistry);
        for edge in &op.enzymes[0].conversions {
            assert!(edge.products.iter().all(|p| p.species == edge.substrate));
            assert_eq!((edge.changed, edge.work, edge.heat), (0., 0., 0.));
        }
    }
}
#[test]
fn rotated_and_reflected_frames_preserve_compiled_products_and_costs() {
    let chemistry = Chemistry::new(101).unwrap();
    let c = Config::default();
    for e in [
        enzyme(0.37),
        Enzyme {
            x: 0.,
            y: 0.,
            center_x: 2.3,
            center_y: 1.1,
            angle: -1.2,
        },
    ] {
        for mirror in [false, true] {
            let map = |[x, y]: [f64; 2]| if mirror { [15. - x, y] } else { [15. - y, x] };
            let id = |s| {
                let [x, y] = map(chemistry::coordinate(s));
                x as usize * 16 + y as usize
            };
            let [x, y] = map([e.x, e.y]);
            let [dx, dy] = map([e.center_x, e.center_y]);
            let other = Enzyme {
                x,
                y,
                center_x: dx,
                center_y: dy,
                angle: if mirror { -e.angle } else { e.angle },
            };
            let mut transformed = chemistry.clone();
            for s in 0..256 {
                transformed.properties[id(s)] = chemistry.properties[s].clone();
            }
            let mut m = Machinery::seed(&chemistry, &[0, 80]);
            m.enzymes[0] = e;
            let a = Operators::compile(&m, &c, &chemistry);
            m.enzymes[0] = other;
            let b = Operators::compile(&m, &c, &transformed);
            for edge in &a.enzymes[0].conversions {
                let other = b.enzymes[0]
                    .conversions
                    .iter()
                    .find(|x| x.substrate == id(edge.substrate))
                    .unwrap();
                assert!((edge.catalytic - other.catalytic).abs() < 1e-12);
                assert!((edge.work - other.work).abs() < 1e-12);
                let mut expected = [0.; 256];
                let mut actual = [0.; 256];
                for p in &edge.products {
                    expected[id(p.species)] += p.weight;
                }
                for p in &other.products {
                    actual[p.species] += p.weight;
                }
                assert!(
                    expected
                        .iter()
                        .zip(actual)
                        .all(|(a, b)| (a - b).abs() < 1e-12)
                );
            }
        }
        for s in 0..256 {
            let products = Transform::new(e).products(s);
            assert!(products.len() <= 8 && products.iter().all(|p| p.weight >= 0.));
            assert!((products.iter().map(|p| p.weight).sum::<f64>() - 1.).abs() < 1e-12);
        }
    }
}

#[test]
fn founders_share_a_map_instead_of_a_product_and_export_their_products() {
    let chemistry = Chemistry::new(101).unwrap();
    let c = Config::default();
    let sources = chemistry.source_species();
    let m = Machinery::seed(&chemistry, &sources);
    let reversed = Machinery::seed(&chemistry, &[sources[1], sources[0]]);
    let products: Vec<_> = m.enzymes[..2]
        .iter()
        .zip(sources.iter().copied())
        .map(|(e, s)| Transform::new(*e).products(s))
        .collect();
    assert_eq!(
        [m.enzymes[0].center_x, m.enzymes[0].center_y],
        [m.enzymes[1].center_x, m.enzymes[1].center_y]
    );
    assert!(
        products[0]
            .iter()
            .all(|a| products[1].iter().all(|b| a.species != b.species))
    );
    let operators = Operators::compile(&m, &c, &chemistry);
    for i in 0..2 {
        assert_eq!(m.enzymes[i], reversed.enzymes[1 - i]);
        assert_eq!(m.transporters[i + 2], reversed.transporters[3 - i]);
        let s = sources[i];
        let edge = operators.enzymes[i]
            .conversions
            .iter()
            .find(|e| e.substrate == s)
            .unwrap();
        assert!(edge.work > 0.);
        assert!(products[i].iter().all(|p| {
            operators.transporters[i + 2]
                .iter()
                .any(|a| a.species == p.species && a.value > 0.)
        }));
    }
}

#[test]
fn circular_expression_validation_and_continuation_cover_nonzero_angles() {
    assert!((angles::mean(PI - 0.1, -PI + 0.1).abs() - PI).abs() < 1e-12);
    assert_eq!(angles::mean(0., -PI), 0.);
    let mut w = diagnostics::nutrition(0.8, 2., true, false);
    let g = w.genomes.get_mut(&1).unwrap();
    g.chromosomes[0].chemistry.enzymes[0].angle = 0.7;
    g.compile(&w.config, &w.chemistry);
    diagnostics::initialize(&mut w);
    let mut restored = crate::boundary_tests::restored_state(&w);
    assert_eq!(restored.cells[0].chemistry().enzymes[0].angle, 0.7);
    let resumed_tick = w.tick + 8;
    for _ in 0..8 {
        w.step();
        restored.step();
    }
    crate::boundary_tests::usable_continuation(&w, resumed_tick);
    crate::boundary_tests::usable_continuation(&restored, resumed_tick);
    for angle in [f64::NAN, f64::INFINITY, PI, -PI - 0.01] {
        let mut g = w.genomes[&1].clone();
        g.chromosomes[0].chemistry.enzymes[0].angle = angle;
        assert!(g.validate(&w.config).is_err());
        let mut m = w.cells[0].chemistry().clone();
        m.enzymes[0].angle = angle;
        assert!(m.validate().is_err());
    }
}

#[test]
fn diploid_birth_compilation_does_not_change_parent_capabilities() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let mut c = w.config.clone();
    c.ploidy = "diploid".into();
    let mut g = w.genomes[&1].clone();
    g.chromosomes.push(g.chromosomes[0].clone());
    g.chromosomes[0].chemistry.enzymes[0] = enzyme(-0.4);
    g.chromosomes[1].chemistry.enzymes[0] = enzyme(1.2);
    g.compile(&c, &w.chemistry);
    g.validate(&c).unwrap();
    let expressed = g.compiled.as_ref().unwrap();
    let e = expressed.chromosome.chemistry.enzymes[0];
    assert!((e.angle - 0.4).abs() < 1e-12);
    let t = Transform::new(e);
    assert!(t.components().len() > 1);
    for row in &expressed.operators.enzymes[0].conversions {
        assert_eq!(row.products, t.products(row.substrate));
    }
    // Compiling a daughter's genotype does not mutate its parent.
    assert_ne!(w.cells[0].chemistry().enzymes[0], e);
}
