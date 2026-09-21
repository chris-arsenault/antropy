use crate::{
    chemical_group::{Action, quarter_point},
    chemical_operators::Operators,
    chemistry::{self, Chemistry},
    diagnostics,
    genetics::{Enzyme, angles},
    organism::Cell,
};

fn transform_enzyme(e: Enzyme, q: u8, mirror: bool) -> Enzyme {
    let mut p = [e.x, e.y];
    let mut d = [e.center_x, e.center_y];
    if mirror {
        p[0] = 15. - p[0];
        d[0] = 15. - d[0];
    }
    let [x, y] = quarter_point(p, q);
    let v = quarter_point(d, q);
    Enzyme {
        x,
        y,
        center_x: v[0],
        center_y: v[1],
        angle: angles::wrap(if mirror { -e.angle } else { e.angle }),
    }
}

fn frame(q: u8, mirror: bool) -> Action {
    Action::quarter(q).compose(&if mirror {
        Action::intervals([15, 0])
    } else {
        Action::identity()
    })
}

fn transformed_cell(cell: &Cell, chemistry: &Chemistry, q: u8, mirror: bool) -> (Cell, Chemistry) {
    let u = frame(q, mirror);
    let mut cell = cell.clone();
    let original = cell.inventory.clone();
    let original_bound = cell.bound_material.clone();
    let mut transformed = chemistry.clone();
    for s in 0..256 {
        cell.inventory.set(u.apply(s), original.value(s));
        cell.bound_material.set(u.apply(s), original_bound.value(s));
        transformed.properties[u.apply(s)] = chemistry.properties[s].clone();
    }
    cell.installed.enzymes = cell
        .installed
        .enzymes
        .map(|e| transform_enzyme(e, q, mirror));
    (cell, transformed)
}

#[test]
fn ordinary_funded_reactions_commute_with_all_square_frames() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    for energy in [0., 0.001, 100.] {
        let mut initial = w.cells[0].clone();
        initial.energy = energy;
        initial.inventory = (0..256).map(|s| 0.001 * (1 + s % 17) as f64).collect();
        initial.installed.enzymes = std::array::from_fn(|i| Enzyme {
            x: [0.2, 7.5, 14.7, 8.][i % 4],
            y: [0.3, 4.2, 15., 9.][i % 4],
            center_x: [8.3, 4.1, 2.2, 1.][i % 4],
            center_y: [10., 7., 2.3, 3.][i % 4],
            angle: [0.4, -0.9, 2.1, 0.][i % 4],
        });
        initial.operators = Some(Operators::compile(
            &initial.installed,
            &w.config,
            &w.chemistry,
        ));
        let mut expected = initial.clone();
        for _ in 0..8 {
            crate::metabolism::react(&mut expected, &w.config, &w.chemistry, 0.2);
        }
        assert!(expected.flows.reacted > 0.);
        for q in 0..4 {
            for mirror in [false, true] {
                let (mut actual, chemistry) = transformed_cell(&initial, &w.chemistry, q, mirror);
                actual.operators =
                    Some(Operators::compile(&actual.installed, &w.config, &chemistry));
                for _ in 0..8 {
                    crate::metabolism::react(&mut actual, &w.config, &chemistry, 0.2);
                }
                for s in 0..256 {
                    assert!(
                        (actual.inventory.value(frame(q, mirror).apply(s))
                            - expected.inventory.value(s))
                        .abs()
                            < 1e-10
                    );
                }
                assert!((actual.energy - expected.energy).abs() < 1e-10);
                assert!((actual.flows.reaction_heat - expected.flows.reaction_heat).abs() < 1e-10);
                assert!((actual.material() - initial.material()).abs() < 1e-10);
                assert!(actual.inventory.iter().all(|v| v >= 0.));
            }
        }
    }
}

#[test]
fn installed_round_trip_restores_material_without_creating_usable_work() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    for (source, product) in [(0, 255), (15, 240), (80, 138)] {
        let mut cell = w.cells[0].clone();
        cell.inventory = (0..256).map(|s| f64::from(s == source)).collect();
        cell.energy = 100.;
        cell.installed.enzymes = std::array::from_fn(|i| {
            let (from, to) = if i < 2 {
                (source, product)
            } else {
                (product, source)
            };
            Enzyme::between(chemistry::coordinate(from), chemistry::coordinate(to))
        });
        cell.operators = Some(Operators::compile(&cell.installed, &w.config, &w.chemistry));
        let heat = cell.flows.reaction_heat;
        // Both directions are already installed and funded. A large diagnostic interval
        // exercises donor/work limiting; it is not a production clock change.
        crate::metabolism::react(&mut cell, &w.config, &w.chemistry, 1e6);
        assert!((cell.inventory.value(product) - 1.).abs() < 1e-10);
        crate::metabolism::react(&mut cell, &w.config, &w.chemistry, 1e6);
        assert!((cell.inventory.value(source) - 1.).abs() < 1e-10);
        assert!((cell.material() - 1.).abs() < 1e-10);
        assert!(cell.energy <= 100.);
        assert!((cell.energy + cell.flows.reaction_heat - heat - 100.).abs() < 1e-10);
    }
}

#[test]
fn environmental_actions_span_dyadic_scales_and_commute_with_square_frames() {
    let chemistry = Chemistry::new(101).unwrap();
    let op = crate::weathering::Operators::new(&chemistry);
    let source: Vec<f64> = (0..256).map(|s| 0.01 * (1 + s % 7) as f64).collect();
    let mut expected = source.clone();
    let account = op.inventory(&mut expected, [0.3, -0.2], 0.7);
    for s in 0..256 {
        let mut actual: Vec<_> = op.destination[s].into_iter().filter(|&t| t != s).collect();
        actual.sort_unstable();
        actual.dedup();
        assert_eq!(actual.len(), 8);
        let mut distances: Vec<_> = actual
            .iter()
            .map(|&t| {
                assert!(op.destination[t].contains(&s));
                chemistry::distance_squared(chemistry::coordinate(s), chemistry::coordinate(t))
                    as usize
            })
            .collect();
        distances.sort_unstable();
        assert_eq!(distances, [1, 1, 4, 4, 16, 16, 64, 64]);
    }
    for q in 0..4 {
        for mirror in [false, true] {
            let u = frame(q, mirror);
            let mut transformed = chemistry.clone();
            let mut actual = vec![0.; 256];
            for s in 0..256 {
                transformed.properties[u.apply(s)] = chemistry.properties[s].clone();
                actual[u.apply(s)] = source[s];
            }
            let other = crate::weathering::Operators::new(&transformed).inventory(
                &mut actual,
                [0.3, -0.2],
                0.7,
            );
            for s in 0..256 {
                assert!((actual[u.apply(s)] - expected[s]).abs() < 1e-12);
            }
            for k in 0..3 {
                assert!((other[k] - account[k]).abs() < 1e-12);
            }
        }
    }
}
