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
    let mut d = [e.dx, e.dy];
    if mirror {
        p[0] = 15. - p[0];
        d[0] = -d[0];
    }
    let [x, y] = quarter_point(p, q);
    let v = quarter_point([7.5 + d[0], 7.5 + d[1]], q);
    Enzyme {
        x,
        y,
        dx: v[0] - 7.5,
        dy: v[1] - 7.5,
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
    let mut transformed = chemistry.clone();
    for s in 0..256 {
        cell.inventory.set(u.apply(s), original[s]);
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
            x: [0.2, 7.5, 14.7, 8.][i],
            y: [0.3, 4.2, 15., 9.][i],
            dx: [8.3, -4.1, 2.2, 1.][i],
            dy: [10., 7., -2.3, -3.][i],
            angle: [0.4, -0.9, 2.1, 0.][i],
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
                        (actual.inventory[frame(q, mirror).apply(s)] - expected.inventory[s]).abs()
                            < 1e-10
                    );
                }
                assert!((actual.energy - expected.energy).abs() < 1e-10);
                assert!((actual.flows.reaction_heat - expected.flows.reaction_heat).abs() < 1e-10);
                assert!((actual.material() - initial.material()).abs() < 1e-10);
                assert!(actual.inventory.iter().all(|v| *v >= 0.));
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
            let [x, y] = chemistry::coordinate(from);
            let target = chemistry::coordinate(to);
            Enzyme {
                x,
                y,
                dx: target[0] - x,
                dy: target[1] - y,
                angle: 0.,
            }
        });
        cell.operators = Some(Operators::compile(&cell.installed, &w.config, &w.chemistry));
        let heat = cell.flows.reaction_heat;
        // Both directions are already installed and funded. A large diagnostic interval
        // exercises donor/work limiting; it is not a production clock change.
        crate::metabolism::react(&mut cell, &w.config, &w.chemistry, 1e6);
        assert!((cell.inventory[product] - 1.).abs() < 1e-10);
        crate::metabolism::react(&mut cell, &w.config, &w.chemistry, 1e6);
        assert!((cell.inventory[source] - 1.).abs() < 1e-10);
        assert!((cell.material() - 1.).abs() < 1e-10);
        assert!(cell.energy <= 100.);
        assert!((cell.energy + cell.flows.reaction_heat - heat - 100.).abs() < 1e-10);
    }
}

#[test]
fn environmental_actions_match_unique_in_bounds_edges_and_square_frames() {
    let chemistry = Chemistry::new(101).unwrap();
    let op = crate::weathering::Operators::new(&chemistry);
    let source: Vec<f64> = (0..256).map(|s| 0.01 * (1 + s % 7) as f64).collect();
    let mut expected = source.clone();
    let account = op.inventory(&mut expected, [0.3, -0.2], 0.7);
    for s in 0..256 {
        let p = chemistry::coordinate(s);
        let mut allowed: Vec<_> = (0..256)
            .filter(|&t| chemistry::distance_squared(p, chemistry::coordinate(t)) == 1.)
            .collect();
        let mut actual: Vec<_> = op.destination[s].into_iter().filter(|&t| t != s).collect();
        allowed.sort_unstable();
        actual.sort_unstable();
        assert_eq!(actual, allowed);
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
            for k in 0..2 {
                assert!((other[k] - account[k]).abs() < 1e-12);
            }
        }
    }
}
