use super::*;

fn pair() -> (Config, Vec<Cell>) {
    let w = crate::diagnostics::nutrition(0.8, 2., false, false);
    let mut cells = vec![w.cells[0].clone(); 2];
    for (i, cell) in cells.iter_mut().enumerate() {
        cell.id = i as u64 + 1;
        cell.heading = 0.;
        cell.damage = 0.;
        cell.x = 8. + i as f64 * cell.radius(&w.config);
        cell.y = 8.;
    }
    (w.config, cells)
}

#[test]
fn intact_cells_keep_mechanical_occlusion_and_activate_material_without_motion() {
    let (c, mut cells) = pair();
    let mut cache = crate::movement::geometry::Cache::default();
    let graph = cache.graph(&cells, &c);
    assert!(!graph.exposed);
    let field = graph.field.clone();
    let contacts = graph.contacts.clone();
    for (field, contacts) in field.iter().zip(&contacts) {
        assert!(*field < 1.);
        assert!((field + contacts.iter().sum::<f64>() - 1.).abs() < 1e-12);
    }
    let preparations = cache.local.counts()["passes"].clone();
    cells[1].damage = 0.5;
    let graph = cache.graph_prepared(&cells, &c);
    assert_eq!(graph.neighbors(0).len(), 1);
    assert!(graph.neighbors(1).is_empty());
    assert_eq!(graph.field, field);
    assert_eq!(graph.contacts, contacts);
    assert_eq!(cache.local.counts()["passes"], preparations);
    cells[1].damage = 0.;
    assert!(cache.graph_prepared(&cells, &c).neighbors(0).is_empty());
    cells[1].damage = 0.5;
    cells[1].inventory.fill(0.);
    assert!(cache.graph_prepared(&cells, &c).neighbors(0).is_empty());
    cells[1].inventory.set(17, 1e-10);
    assert_eq!(cache.graph_prepared(&cells, &c).neighbors(0).len(), 1);
    assert_eq!(cache.local.counts()["passes"], preparations);
}

#[test]
fn heading_does_not_change_contact_sensing_stress_or_material_access() {
    let (c, mut cells) = pair();
    let chemistry = Chemistry::new(c.chemistry_seed).unwrap();
    cells[1].damage = 0.5;
    cells[1].inventory.set(17, 0.3);
    let baseline = Graph::new(&cells, &c);
    let reading = baseline.reading(0, &cells, &c, &chemistry);
    assert!(reading.recognition.iter().any(|row| row[0] > 0.));
    for row in reading.recognition {
        assert!(row.iter().all(|v| *v == row[0]));
    }
    for angle in [0., 0.4, 1.2, 2.8] {
        cells[0].heading = angle;
        cells[1].heading = -angle;
        let graph = Graph::new(&cells, &c);
        assert_eq!(graph.contacts, baseline.contacts);
        assert_eq!(graph.reading(0, &cells, &c, &chemistry), reading);
        assert_eq!(
            graph.local(0, &cells, &c, &[0.; 256]),
            baseline.local(0, &cells, &c, &[0.; 256])
        );
    }
}

#[test]
fn coincidence_has_no_invented_direction_and_heading_cannot_create_passive_work() {
    let (c, mut cells) = pair();
    cells[1].x = cells[0].x;
    let mut cache = crate::movement::geometry::Cache::default();
    cache.graph(&cells, &c);
    let before = cache.local.pressure.rows[0].shift;
    cells[0].heading += 0.3;
    cache.graph(&cells, &c);
    assert_eq!(cache.local.pressure.rows[0].shift, before);
    for k in 0..2 {
        assert!(
            (cache.local.pressure.rows[0].shift[k] + cache.local.pressure.rows[1].shift[k]).abs()
                < 1e-12
        );
    }
    let mut fresh = crate::movement::geometry::Cache::default();
    fresh.graph(&cells, &c);
    for (actual, expected) in cache
        .local
        .pressure
        .rows
        .iter()
        .zip(&fresh.local.pressure.rows)
    {
        assert_eq!(actual.shift, expected.shift);
        assert_eq!(actual.contacts(), expected.contacts());
    }
}

#[test]
fn selected_boundary_preserves_full_crowding_and_exposed_donor_readings() {
    let (c, mut cells) = pair();
    let mut intact = cells[1].clone();
    intact.id = 3;
    cells.push(intact);
    cells[1].damage = 0.4;
    cells[1].inventory.set(17, 0.3);
    for separation in [
        0.,
        cells[0].radius(&c),
        c.width - cells[0].radius(&c),
        c.width * 0.5,
    ] {
        cells[1].x = (cells[0].x + separation).rem_euclid(c.width);
        let graph = Graph::new(&cells, &c);
        for i in 0..cells.len() {
            let chemistry = crate::chemistry::Chemistry::new(c.chemistry_seed).unwrap();
            let expected = graph.reading(i, &cells, &c, &chemistry);
            let actual = selected(i, &cells, &c, &chemistry);
            assert!((actual.field - expected.field).abs() < 1e-12);
            assert!((actual.stress - expected.stress).abs() < 1e-12);
            for (a, b) in actual
                .recognition
                .iter()
                .flatten()
                .zip(expected.recognition.iter().flatten())
            {
                assert!((a - b).abs() < 1e-12);
            }
        }
    }
}
