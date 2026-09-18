use antropy_engine::{
    chemical_operators::Operators,
    chemistry::{Chemistry, affinity, coordinate},
    config::Config,
    genetics::{Enzyme, Machinery, Target},
};
use std::sync::Arc;
// Independently enumerate the interval involutions at zero orientation.
fn weight(s: usize, p: usize, center: [f64; 2], offset: [f64; 2]) -> f64 {
    let a = coordinate(s);
    let b = coordinate(p);
    (0..2)
        .map(|k| {
            let target = 15. - ((center[k] + offset[k]).rem_euclid(30.) - 15.).abs();
            let pivot = 15. - center[k] + target;
            let source = 15. - a[k];
            (0..=30)
                .map(|j| {
                    let candidate = j as f64 - source;
                    let destination = if (0. ..=15.).contains(&candidate) {
                        candidate
                    } else {
                        source
                    };
                    if destination == b[k] {
                        (1. - (pivot - j as f64).abs()).max(0.)
                    } else {
                        0.
                    }
                })
                .sum::<f64>()
        })
        .product()
}
#[test]
fn production_coefficients_match_dense_products_and_work_accounts() {
    let chemistry = Chemistry::new(101).unwrap();
    let config = Config::default();
    for (center, offset) in [
        ([0., 0.], [1., 1.]),
        ([7.5, 7.5], [0.25, -0.75]),
        ([14.5, 14.5], [1., 1.]),
        ([7., 7.], [0., 0.]),
    ] {
        let mut m = Machinery::seed(&chemistry, &chemistry.source_species());
        m.enzymes = [Enzyme {
            x: center[0],
            y: center[1],
            dx: offset[0],
            dy: offset[1],
            angle: 0.,
        }; 4];
        let op = Operators::compile(&m, &config, &chemistry);
        let enzyme = &op.enzymes[0];
        assert!(enzyme.conversions.len() <= 36);
        let mut occupancy = [0.; 256];
        for e in &enzyme.conversions {
            assert_eq!(e.binding, affinity(center, e.substrate, 3.));
            let mut value = 0.;
            let mut sum = 0.;
            let mut displacement = 0.;
            occupancy[e.substrate] += e.binding;
            for p in 0..256 {
                let expected = weight(e.substrate, p, center, offset);
                let actual = e
                    .products
                    .iter()
                    .find(|v| v.species == p)
                    .map_or(0., |v| v.weight);
                assert!((actual - expected).abs() < 1e-12);
                value += expected * chemistry.properties[p].potential;
                sum += actual;
                let a = coordinate(e.substrate);
                let b = coordinate(p);
                displacement += expected * ((a[0] - b[0]).powi(2) + (a[1] - b[1]).powi(2));
                occupancy[p] += e.binding * expected;
            }
            assert!((sum - 1.).abs() < 1e-12);
            assert!((e.catalytic - e.binding / (1. + displacement / 9.)).abs() < 1e-12);
            let difference = chemistry.properties[e.substrate].potential - value;
            assert!((difference - e.work - e.heat).abs() < 1e-12);
            assert!(e.heat >= 0.05 * e.changed - 1e-12);
            assert!(e.products.len() <= 4);
        }
        for (s, expected) in occupancy.into_iter().enumerate() {
            let actual = enzyme
                .engagement
                .iter()
                .find(|a| a.species == s)
                .map_or(0., |a| a.value);
            assert!((expected - actual).abs() < 1e-12);
        }
        if offset == [0., 0.] {
            assert!(
                enzyme
                    .conversions
                    .iter()
                    .all(|e| e.changed == 0. && e.work == 0.)
            );
        }
    }
}
#[test]
fn partial_refresh_preserves_unaffected_allocations() {
    let chemistry = Chemistry::new(101).unwrap();
    let config = Config::default();
    let mut m = Machinery::seed(&chemistry, &chemistry.source_species());
    let mut op = Operators::compile(&m, &config, &chemistry);
    let original = op.clone();
    let before = m.clone();
    m.receptors[0] = Target { x: 7.5, y: 7.5 };
    op.update(&before, &m, &config, &chemistry);
    assert!(!Arc::ptr_eq(&original.receptors[0], &op.receptors[0]));
    for i in 0..4 {
        assert!(Arc::ptr_eq(&original.enzymes[i], &op.enzymes[i]));
        assert!(Arc::ptr_eq(&original.transporters[i], &op.transporters[i]));
    }
}
#[test]
fn processing_is_continuous_across_product_and_recognition_boundaries() {
    let world = antropy_engine::world::World::new(
        101,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 0,
            ..Default::default()
        },
    )
    .unwrap();
    for x in [3., 7., 14.] {
        for offset in [0., 1., -1.] {
            let eps = 1e-6;
            let cells: [antropy_engine::organism::Cell; 2] = [-eps, eps].map(|delta| {
                let mut cell = world.cells[0].clone();
                cell.inventory.fill(0.1);
                cell.energy = 10.;
                for e in &mut cell.installed.enzymes {
                    e.x = x + delta;
                    e.dx = offset + delta;
                }
                cell.operators = Some(Operators::compile(
                    &cell.installed,
                    &world.config,
                    &world.chemistry,
                ));
                antropy_engine::metabolism::react(&mut cell, &world.config, &world.chemistry, 0.2);
                cell
            });
            let change = cells[0]
                .inventory
                .iter()
                .zip(cells[1].inventory.iter())
                .map(|(a, b)| (a - b).abs())
                .sum::<f64>()
                + (cells[0].energy - cells[1].energy).abs();
            assert!(change < 4096. * eps);
        }
    }
}

#[test]
fn an_idle_offset_and_a_tiny_offset_have_continuous_work_cost() {
    let world = antropy_engine::world::World::new(
        101,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 0,
            ..Default::default()
        },
    )
    .unwrap();
    let outcomes = [0., 1e-8].map(|offset| {
        let mut cell = world.cells[0].clone();
        cell.inventory.fill(0.1);
        cell.energy = 10.;
        for e in &mut cell.installed.enzymes {
            e.dx = offset;
            e.dy = 0.;
        }
        cell.operators = Some(Operators::compile(
            &cell.installed,
            &world.config,
            &world.chemistry,
        ));
        antropy_engine::metabolism::react(&mut cell, &world.config, &world.chemistry, 0.8);
        cell
    });
    assert_eq!(outcomes[0].energy, 10.);
    assert_eq!(outcomes[0].flows.reacted, 0.);
    assert!((outcomes[1].energy - 10.).abs() < 1e-8);
    assert!(outcomes[1].flows.reacted < 1e-8);
}
