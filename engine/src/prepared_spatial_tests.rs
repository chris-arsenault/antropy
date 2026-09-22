use crate::{config::Config, field::Field, interfaces::Graph, movement, organism::Cell};

fn pair() -> (Config, Vec<Cell>) {
    let w = crate::diagnostics::nutrition(0.8, 2., false, false);
    let mut cells = vec![w.cells[0].clone(); 2];
    for (i, cell) in cells.iter_mut().enumerate() {
        cell.id = i as u64 + 1;
        cell.x = 6. + i as f64 * cell.radius(&w.config);
        cell.y = 6.;
        cell.heading = 0.;
        cell.damage = 0.25;
    }
    (w.config, cells)
}

fn graph_matches_reference(cells: &[Cell], c: &Config, cache: &mut movement::geometry::Cache) {
    let expected = Graph::new(cells, c);
    let actual = cache.graph(cells, c);
    for i in 0..cells.len() {
        assert!((actual.field[i] - expected.field[i]).abs() < 1e-12);
        assert_eq!(actual.neighbors(i).len(), expected.neighbors(i).len());
        for edge in expected.neighbors(i) {
            let other = actual
                .neighbors(i)
                .iter()
                .find(|n| n.donor == edge.donor)
                .unwrap();
            assert!((edge.weight - other.weight).abs() < 1e-12);
        }
    }
}

#[test]
fn direct_graph_reads_subresolution_motion_and_live_exposure() {
    let (c, mut cells) = pair();
    let mut cache = movement::geometry::Cache::default();
    graph_matches_reference(&cells, &c, &mut cache);
    let before = cache.graph(&cells, &c).field[0];
    cells[0].x += 0.001 * cells[0].radius(&c);
    graph_matches_reference(&cells, &c, &mut cache);
    assert!(cache.graph(&cells, &c).field[0] < before);
    cells[1].damage = 0.4;
    let graph = cache.graph_prepared(&cells, &c);
    assert!((graph.exposure[1] - cells[1].damage / cells[1].volume(&c)).abs() < 1e-12);
}

#[test]
fn material_rows_survive_dense_population_changes_without_owner_slots() {
    let (c, pair) = pair();
    let mut cells: Vec<_> = (0..10)
        .map(|i| {
            let mut cell = pair[0].clone();
            cell.id = i + 1;
            cell.x += i as f64 * 0.04 * cell.radius(&c);
            cell.heading = i as f64 * 0.2;
            cell.damage = if i % 2 == 0 { 0. } else { 0.4 };
            cell
        })
        .collect();
    let mut cache = movement::geometry::Cache::default();
    graph_matches_reference(&cells, &c, &mut cache);
    for removed in [4, 0, 5, 2] {
        cells.remove(removed);
        cells.reverse();
        graph_matches_reference(&cells, &c, &mut cache);
    }
    for i in 0..4 {
        let mut born = pair[0].clone();
        born.id = 20 + i;
        cells.insert(0, born);
        graph_matches_reference(&cells, &c, &mut cache);
    }
}

#[test]
fn periodic_contact_entry_and_growth_across_size_classes_are_immediate() {
    let (c, mut cells) = pair();
    let radius = cells[0].radius(&c);
    cells[0].x = radius;
    cells[1].x = c.width - 4. * radius - c.mesh;
    let mut cache = movement::geometry::Cache::default();
    assert!(cache.graph(&cells, &c).neighbors(0).is_empty());
    cells[1].x = c.width - radius * 0.5;
    graph_matches_reference(&cells, &c, &mut cache);
    assert_eq!(cache.graph(&cells, &c).neighbors(0).len(), 1);
    cells[1].x = cells[0].x + 4. * radius + c.mesh;
    assert!(cache.graph(&cells, &c).neighbors(0).is_empty());
    let new_radius = 4. * radius + c.mesh;
    let amount = std::f64::consts::PI * (new_radius.powi(2) - radius.powi(2)) * c.inventory_density;
    let previous = cells[0].inventory.value(17);
    cells[0].inventory.set(17, previous + amount);
    graph_matches_reference(&cells, &c, &mut cache);
    assert_eq!(cache.graph(&cells, &c).neighbors(0).len(), 1);
}

#[test]
fn contact_stage_is_frozen_until_next_prepare_and_reductions_follow_dt() {
    let (c, mut cells) = pair();
    let mut cache = movement::geometry::Cache::default();
    let before = cache.graph(&cells, &c).field.clone();
    cells[1].x += c.mesh;
    assert_eq!(cache.graph_prepared(&cells, &c).field, before);
    assert!(cache.graph(&cells, &c).neighbors(0).is_empty());
    cells[1].x = cells[0].x + cells[0].radius(&c);
    cache.prepare_local(&cells, &c);
    for dt in [c.dt, c.dt * 0.5, c.dt * 2.] {
        cache.local.pressure_at(dt);
        let edge = cache.local.contacts.edges[0];
        let correction = (edge.extent - edge.length) * 0.5 * (1. - (-dt).exp()) / dt;
        assert!((cache.local.pressure.rows[0].shift[0] + correction).abs() < 1e-12);
        assert!((cache.local.pressure.rows[1].shift[0] - correction).abs() < 1e-12);
    }
}

#[test]
fn heading_cannot_change_scalar_contacts_or_world_pressure() {
    let (c, mut cells) = pair();
    let mut cache = movement::geometry::Cache::default();
    let before = cache.graph(&cells, &c).contacts[0];
    let shift = cache.local.pressure.rows[0].shift;
    let neighbors = cache.graph(&cells, &c).neighbors(0).to_vec();
    cells[0].heading += 0.25;
    let graph = cache.graph(&cells, &c);
    assert_eq!(graph.contacts[0], before);
    assert_eq!(graph.contacts[0], Graph::new(&cells, &c).contacts[0]);
    assert_eq!(graph.neighbors(0), neighbors);
    assert_eq!(cache.local.pressure.rows[0].shift, shift);
}

#[test]
fn held_motion_advances_and_pays_every_physical_tick() {
    let (c, mut cells) = pair();
    cells.truncate(1);
    cells[0].body[1] = 1.;
    cells[0].energy = 1e4;
    cells[0].action.swim = 0.01;
    cells[0].action.turn = 0.;
    let mut field = Field::new(c.width, c.height, c.mesh);
    field.drift = 0.;
    let sites = vec![crate::footprint::sites(&cells[0], &c, &field)];
    let mut cache = movement::geometry::Cache::default();
    let before = cells[0].energy;
    let rate = movement::motor_work_rate(&cells[0].body, cells[0].damage, 0.01, 0., &c);
    for _ in 0..8 {
        movement::advance_cached(&mut cells, &c, &field, &sites, &mut cache);
    }
    assert!((before - cells[0].energy - rate * c.dt * 8.).abs() < 1e-9);
    assert!(cells[0].flows.distance > 0.);
    assert_eq!(cache.motion.preparations, 1);
    cells[0].energy = 0.;
    let position = [cells[0].x, cells[0].y];
    movement::advance_cached(&mut cells, &c, &field, &sites, &mut cache);
    assert_eq!([cells[0].x, cells[0].y], position);
}

#[test]
fn new_weak_carrier_and_reciprocal_pressure_are_not_suspended() {
    let (c, mut cells) = pair();
    for cell in &mut cells {
        cell.action.swim = 0.;
        cell.action.turn = 0.;
    }
    let mut field = Field::new(c.width, c.height, c.mesh);
    field.drift = 0.;
    let sites: Vec<_> = cells
        .iter()
        .map(|cell| crate::footprint::sites(cell, &c, &field))
        .collect();
    let center = cells[0].x + cells[1].x;
    let mut cache = movement::geometry::Cache::default();
    movement::advance_cached(&mut cells, &c, &field, &sites, &mut cache);
    assert!((cells[0].x + cells[1].x - center).abs() < 1e-12);
    // Isolate carrier activation from the contact displacement tested above.
    cells.truncate(1);
    let mut cache = movement::geometry::Cache::default();
    movement::advance_cached(&mut cells, &c, &field, &sites, &mut cache);
    let preparations = cache.motion.preparations;
    let node = sites[0][0].0;
    let neighbor = field.neighbors[node][0];
    field.test_source_signal()[neighbor][1] = 1e-6;
    movement::advance_cached(&mut cells, &c, &field, &sites, &mut cache);
    assert!(cache.motion.preparations > preparations);
}
