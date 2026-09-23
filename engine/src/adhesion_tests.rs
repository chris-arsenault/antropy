use crate::{
    adhesion::{blend, compatibility},
    config::Config,
    movement::geometry::{Body, Contacts, Edge},
    random::Random,
    world::World,
};

/// Twenty cells on a triangular lattice at contact spacing, with every touching pair listed.
fn lattice() -> (Contacts, Vec<usize>) {
    let mut bodies = vec![];
    for row in 0..4 {
        for col in 0..5 {
            let x = col as f64 * 2. + if row % 2 == 1 { 1. } else { 0. };
            bodies.push(Body {
                position: [x, row as f64 * 3f64.sqrt()],
                radius: 1.05,
            });
        }
    }
    let mut edges = vec![];
    let mut degree = vec![0; bodies.len()];
    for i in 0..bodies.len() {
        for j in i + 1..bodies.len() {
            let d = [0, 1].map(|k| bodies[j].position[k] - bodies[i].position[k]);
            let length = d[0].hypot(d[1]);
            if length < 2.1 {
                edges.push(Edge {
                    i,
                    j,
                    displacement: d,
                    length,
                    extent: 2.1,
                });
                degree[i] += 1;
                degree[j] += 1;
            }
        }
    }
    let interior = (0..bodies.len()).filter(|&i| degree[i] == 6).collect();
    (
        Contacts {
            bodies,
            edges,
            candidates: 0,
        },
        interior,
    )
}

/// Founder cells whose membrane profiles are set to a chosen [a, b, impedance].
fn cells(n: usize, profile: [f64; 3]) -> Vec<crate::organism::Cell> {
    let mut w = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 4,
            source_count: 1,
            ..Config::default()
        },
    )
    .unwrap();
    let template = w.cells.remove(0);
    (0..n)
        .map(|_| {
            let mut cell = template.clone();
            cell.operators.as_mut().unwrap().profile = profile;
            cell
        })
        .collect()
}

fn relative(d: &[[f64; 2]], contacts: &Contacts, interior: &[usize]) -> f64 {
    interior
        .iter()
        .map(|&i| {
            let neighbours: Vec<_> = contacts
                .edges
                .iter()
                .filter_map(|e| (e.i == i).then_some(e.j).or((e.j == i).then_some(e.i)))
                .collect();
            let mean = [0, 1].map(|k| {
                neighbours.iter().map(|&j| d[j][k]).sum::<f64>() / neighbours.len() as f64
            });
            (d[i][0] - mean[0]).hypot(d[i][1] - mean[1])
        })
        .sum::<f64>()
        / interior.len() as f64
}

#[test]
fn compatible_groups_lose_interior_relative_motion_without_exceeding_paid_motion() {
    let (contacts, interior) = lattice();
    assert!(!interior.is_empty());
    let cells = cells(contacts.bodies.len(), [-0.6, 0.1, 0.5]);
    let mut rng = Random::new(9);
    let free: Vec<[f64; 2]> = (0..cells.len())
        .map(|_| {
            let angle = rng.unit() * std::f64::consts::TAU;
            let speed = 0.1 * rng.unit();
            [speed * angle.cos(), speed * angle.sin()]
        })
        .collect();
    let mut bound = free.clone();
    blend(&mut bound, &cells, &contacts, Config::default().adhesion);
    let before = relative(&free, &contacts, &interior);
    let after = relative(&bound, &contacts, &interior);
    println!("interior relative motion {before:.4} -> {after:.4}");
    assert!(after < 0.1 * before, "relative {before} -> {after}");
    let largest = free.iter().map(|d| d[0].hypot(d[1])).fold(0., f64::max);
    assert!(bound.iter().all(|d| d[0].hypot(d[1]) <= largest + 1e-15));
}

#[test]
fn incompatible_membranes_do_not_adhere() {
    let (contacts, _) = lattice();
    // Like repulsion properties outweigh attraction: compatibility clamps to zero.
    let cells = cells(contacts.bodies.len(), [0.1, 0.6, 0.5]);
    let free: Vec<[f64; 2]> = (0..cells.len()).map(|i| [i as f64 * 0.01, 0.]).collect();
    let mut bound = free.clone();
    blend(&mut bound, &cells, &contacts, 4.);
    assert_eq!(bound, free);
}

#[test]
fn compatibility_follows_the_shared_product_signs() {
    assert_eq!(compatibility([-0.6, 0., 0.], [-0.6, 0., 0.]), 0.36);
    assert_eq!(compatibility([0.6, 0., 0.], [-0.6, 0., 0.]), 0.);
    assert_eq!(compatibility([0., 0.5, 0.], [0., 0.5, 0.]), 0.);
    assert_eq!(compatibility([0., 0.5, 0.], [0., -0.5, 0.]), 0.25);
    assert_eq!(compatibility([2., 0., 0.], [2., 0., 0.]), 1.);
}
