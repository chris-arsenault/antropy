use crate::{config::Config, interfaces::Graph, movement, organism::Cell};

fn reference(cells: &[Cell], c: &Config) -> Vec<(usize, usize)> {
    let mut result = vec![];
    for (i, a) in cells.iter().enumerate() {
        for (j, b) in cells.iter().enumerate().skip(i + 1) {
            if movement::distance([a.x, a.y], [b.x, b.y], c) < a.radius(c) + b.radius(c) {
                result.push((i, j));
            }
        }
    }
    result
}
fn found(cells: &[Cell], c: &Config) -> Vec<(usize, usize)> {
    let mut pairs = movement::pairs(cells, c);
    pairs.sort_unstable();
    pairs
}
fn fixture() -> (Config, Vec<Cell>) {
    let w = crate::diagnostics::nutrition(0.8, 2., false, false);
    let mut rng = crate::random::Random::new(72);
    let cells = (0..160)
        .map(|i| {
            let mut cell = w.cells[0].clone();
            cell.id = i + 1;
            cell.inventory.fill(0.);
            cell.body.fill(0.);
            // Several occupied diameter classes, including a few very large bodies.
            let radius = 0.08 * 2_f64.powi((i % 8) as i32);
            cell.body[0] = std::f64::consts::PI * radius * radius * w.config.body_density;
            cell.x = rng.unit() * w.config.width;
            cell.y = rng.unit() * w.config.height;
            cell.heading = rng.unit() * std::f64::consts::TAU;
            cell
        })
        .collect();
    (w.config, cells)
}

#[test]
fn heterogeneous_overlaps_match_all_pairs_across_seams_and_small_grids() {
    let (mut c, mut cells) = fixture();
    for (width, height) in [(24., 24.), (2., 3.), (0.2, 0.3), (320., 240.)] {
        c.width = width;
        c.height = height;
        for cell in &mut cells {
            cell.x = cell.x.rem_euclid(width);
            cell.y = cell.y.rem_euclid(height);
        }
        cells[0].x = 0.01;
        cells[1].x = width - 0.01;
        cells[0].y = 0.01;
        cells[1].y = height - 0.01;
        for count in [0, 1, 2, cells.len()] {
            assert_eq!(found(&cells[..count], &c), reference(&cells[..count], &c));
        }
        cells.reverse();
        assert_eq!(found(&cells, &c), reference(&cells, &c));
    }
    cells[0].x = cells[1].x;
    cells[0].y = cells[1].y;
    cells[7].x = (cells[15].x + c.width * 0.5).rem_euclid(c.width);
    cells[7].y = cells[15].y;
    assert_eq!(found(&cells, &c), reference(&cells, &c));
}

#[test]
fn scalar_interfaces_follow_exact_circle_penetration() {
    let (c, mut cells) = fixture();
    for cell in &mut cells {
        cell.damage = 0.5;
        cell.inventory.set(17, 0.01);
    }
    let graph = Graph::new(&cells, &c);
    for (i, cell) in cells.iter().enumerate() {
        let sum: f64 = cells
            .iter()
            .enumerate()
            .filter(|(j, _)| *j != i)
            .map(|(_, other)| {
                let extent = cell.radius(&c) + other.radius(&c);
                let distance = movement::distance([cell.x, cell.y], [other.x, other.y], &c);
                (1. - distance / extent).max(0.)
            })
            .sum();
        assert!((graph.field[i] - 1. / (1. + sum)).abs() < 1e-12);
        assert!(
            graph.contacts[i]
                .iter()
                .all(|value| (*value - sum / (1. + sum) / 4.).abs() < 1e-12)
        );
        for n in graph.neighbors(i) {
            let reverse = graph
                .neighbors(n.donor)
                .iter()
                .find(|n| n.donor == i)
                .unwrap();
            assert!(
                (n.weight / graph.field[i] - reverse.weight / graph.field[n.donor]).abs() < 1e-12
            );
        }
    }
}

#[test]
fn an_outlier_does_not_widen_every_small_body_search() {
    let (c, mut cells) = fixture();
    cells.truncate(1);
    let small = cells[0].clone();
    for y in 0..20 {
        for x in 0..20 {
            let mut cell = small.clone();
            cell.id = cells.len() as u64 + 1;
            cell.x = x as f64 * 0.5;
            cell.y = y as f64 * 0.5;
            cells.push(cell);
        }
    }
    cells[0].body[0] *= 10000.;
    let geometry = movement::geometry::Contacts::new(&cells, &c);
    assert_eq!(found(&cells, &c), reference(&cells, &c));
    assert!(geometry.candidates < cells.len() * 20);
}

fn cached_found(
    cache: &mut movement::geometry::Cache,
    cells: &[Cell],
    c: &Config,
) -> Vec<(usize, usize)> {
    let mut pairs: Vec<_> = cache
        .prepare(cells, c)
        .edges
        .iter()
        .map(|e| (e.i, e.j))
        .collect();
    pairs.sort_unstable();
    pairs
}

#[test]
fn direct_stage_matches_all_pairs_after_motion_growth_topology_and_configuration_changes() {
    let (mut c, mut cells) = fixture();
    cells.truncate(32);
    let mut cache = movement::geometry::Cache::default();
    assert_eq!(cached_found(&mut cache, &cells, &c), reference(&cells, &c));
    for change in 0..12 {
        match change {
            0 => cells[0].x = (cells[0].x + c.mesh).rem_euclid(c.width),
            1 => cells[0].inventory.set(0, 100.),
            2 => cells[0].id += 1000,
            3 => cells.reverse(),
            4 => {
                cells.remove(3);
            }
            5 => {
                let mut child = cells[0].clone();
                child.id += 10000;
                cells.push(child);
            }
            6 => c.width *= 0.5,
            7 => c.height *= 0.5,
            8 => c.mesh *= 0.5,
            9 => c.body_density *= 2.,
            10 => c.inventory_density *= 2.,
            _ => cells.clear(),
        }
        for cell in &mut cells {
            cell.x = cell.x.rem_euclid(c.width);
            cell.y = cell.y.rem_euclid(c.height);
            cell.heading += 0.3;
        }
        assert_eq!(cached_found(&mut cache, &cells, &c), reference(&cells, &c));
        let geometry = cache.prepare(&cells, &c);
        for (body, cell) in geometry.bodies.iter().zip(&cells) {
            assert_eq!(body.position, [cell.x, cell.y]);
            assert_eq!(body.radius, cell.radius(&c));
        }
    }
}

#[test]
fn direct_stage_retains_only_true_contacts_and_detects_inventory_growth() {
    let (c, mut cells) = fixture();
    cells.truncate(2);
    cells[1].body = cells[0].body;
    for (i, cell) in cells.iter_mut().enumerate() {
        cell.x = 1. + 0.4 * i as f64;
        cell.y = 1.;
    }
    let mut cache = movement::geometry::Cache::default();
    assert!(cached_found(&mut cache, &cells, &c).is_empty());
    assert!(cache.local.contacts.edges.is_empty());
    cells[0].x += 0.05;
    cells[1].x -= 0.05;
    for cell in &mut cells {
        let radius = cell.radius(&c);
        cell.inventory.set(
            0,
            std::f64::consts::PI * ((radius + 0.08).powi(2) - radius.powi(2)) * c.inventory_density,
        );
    }
    assert_eq!(cached_found(&mut cache, &cells, &c), [(0, 1)]);
    for cell in &mut cells {
        cell.inventory.fill(0.);
    }
    assert!(cached_found(&mut cache, &cells, &c).is_empty());
}

#[test]
fn dense_birth_death_and_reordering_never_duplicate_or_retain_removed_pairs() {
    let (c, mut cells) = fixture();
    cells.truncate(16);
    for (i, cell) in cells.iter_mut().enumerate() {
        cell.x = 7. + i as f64 * 0.01;
        cell.y = 7.;
    }
    let mut cache = movement::geometry::Cache::default();
    for event in 0..4 {
        assert_eq!(cached_found(&mut cache, &cells, &c), reference(&cells, &c));
        cells.remove(0);
        for side in 0..2 {
            let mut child = cells[0].clone();
            child.id = 1000 + event * 2 + side;
            child.x += side as f64 * 0.01;
            cells.push(child);
        }
        cells.reverse();
        assert_eq!(cached_found(&mut cache, &cells, &c), reference(&cells, &c));
    }
}
