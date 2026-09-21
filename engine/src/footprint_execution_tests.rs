use super::*;

fn row_distance(a: &Row, b: &Row) -> f64 {
    let mut values = std::collections::BTreeMap::new();
    for &(node, weight) in a {
        *values.entry(node).or_insert(0_f64) += weight;
    }
    for &(node, weight) in b {
        *values.entry(node).or_insert(0_f64) -= weight;
    }
    values.values().map(|v| v.abs()).sum()
}

fn set_radius(cell: &mut Cell, radius: f64, c: &Config) {
    cell.inventory.fill(0.);
    let mut body = [0.; crate::organism::STOCKS];
    body[0] = std::f64::consts::PI * radius * radius * c.body_density;
    cell.set_fixture_body(body);
}

fn check(field: &Field, cells: &[Cell], c: &Config, rows: &[Row]) {
    let mut expected = field.clone();
    crate::footprint::deposit_profiles(cells, c, &mut expected, rows);
    for (a, b) in field
        .body_signal
        .iter()
        .flatten()
        .zip(expected.body_signal.iter().flatten())
    {
        assert!((a - b).abs() < 1e-12);
    }
    for (a, b) in field.body_load.iter().zip(&expected.body_load) {
        assert!((a - b).abs() < 1e-12);
    }
    for row in rows {
        assert!((row.iter().map(|p| p.1).sum::<f64>() - 1.).abs() < 1e-12);
    }
}

#[test]
fn stable_owners_reuse_projection_and_motion_death_birth_refresh_only_affected_rows() {
    let mut w = crate::world::World::new(
        101,
        Config {
            width: 16.,
            height: 16.,
            founders: 2,
            source_count: 0,
            ..Config::default()
        },
    )
    .unwrap();
    let mut projection = Projection::default();
    let mut rows = Vec::new();
    projection.prepare(&w.cells, &w.config, &mut w.field, &mut rows);
    check(&w.field, &w.cells, &w.config, &rows);
    projection.prepare(&w.cells, &w.config, &mut w.field, &mut rows);
    assert_eq!((projection.preparations, projection.reuses), (2, 2));
    w.cells[0].x = (w.cells[0].x + 2.).rem_euclid(w.config.width);
    projection.prepare(&w.cells, &w.config, &mut w.field, &mut rows);
    assert_eq!(projection.preparations, 3);
    check(&w.field, &w.cells, &w.config, &rows);
    w.cells.remove(0);
    projection.prepare(&w.cells, &w.config, &mut w.field, &mut rows);
    assert_eq!(projection.preparations, 3);
    check(&w.field, &w.cells, &w.config, &rows);
    let mut child = w.cells[0].clone();
    child.id = 3;
    w.cells.push(child);
    projection.prepare(&w.cells, &w.config, &mut w.field, &mut rows);
    assert_eq!(projection.preparations, 4);
    check(&w.field, &w.cells, &w.config, &rows);
}

#[test]
fn bilinear_row_bound_holds_across_grid_periodic_and_radius_changes() {
    let w = crate::diagnostics::nutrition(0.8, 2., false, false);
    let h = w.field.spacing;
    for scale in [0.005, 0.5, 2.5] {
        for position in [
            [0., 0.],
            [0.49 * h, 0.51 * h],
            [h, h],
            [w.config.width - 0.003 * h, w.config.height - 0.002 * h],
        ] {
            let mut cell = w.cells[0].clone();
            set_radius(&mut cell, scale * h, &w.config);
            cell.x = position[0];
            cell.y = position[1];
            let initial = sites(&cell, &w.config, &w.field);
            let initial_radius = cell.radius(&w.config);
            for delta in [
                [0.01, 0.02, 0.03],
                [0.04, 0., -0.004],
                [-0.015, 0.005, 0.008],
            ] {
                let mut changed = cell.clone();
                changed.x = (cell.x + delta[0] * h).rem_euclid(w.config.width);
                changed.y = (cell.y + delta[1] * h).rem_euclid(w.config.height);
                set_radius(&mut changed, initial_radius + delta[2] * h, &w.config);
                let distance =
                    crate::movement::distance([cell.x, cell.y], [changed.x, changed.y], &w.config);
                let bound = std::f64::consts::SQRT_2 / h
                    * (2. * distance + (changed.radius(&w.config) - initial_radius).abs());
                let row = sites(&changed, &w.config, &w.field);
                assert!(row_distance(&initial, &row) <= bound + 1e-12);
            }
        }
    }
}

#[test]
fn tiny_body_motion_uses_grid_row_resolution_and_keeps_matched_self_projection() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
    w.cells.truncate(1);
    set_radius(&mut w.cells[0], w.config.mesh * 0.005, &w.config);
    let mut field = Field::new(w.config.width, w.config.height, w.config.mesh);
    let mut projection = Projection::default();
    let mut rows = Vec::new();
    projection.prepare(&w.cells, &w.config, &mut field, &mut rows);
    let row = rows[0].clone();
    let limit = execution::RESOLUTION * field.spacing / (2. * std::f64::consts::SQRT_2);
    w.cells[0].x = (w.cells[0].x + limit * 0.5).rem_euclid(w.config.width);
    projection.prepare(&w.cells, &w.config, &mut field, &mut rows);
    assert_eq!(projection.preparations, 1);
    assert_eq!(rows[0].revision(), row.revision());
    assert!(
        row_distance(&rows[0], &sites(&w.cells[0], &w.config, &field)) <= execution::RESOLUTION
    );
    check(&field, &w.cells, &w.config, &rows);
    let cell = &w.cells[0];
    let own = crate::medium_response::self_load(
        cell.mass() * cell.operators.as_ref().unwrap().profile[2],
        field.spacing.powi(2),
        &rows[0],
    );
    assert!((field.pressure_load(&rows[0]) - own).abs() < 1e-12);
    for axis in field.gradient(&rows[0]) {
        assert!(axis[1].abs() < 1e-12 && axis[2].abs() < 1e-12);
    }
    w.cells[0].x = (w.cells[0].x + limit * 0.6).rem_euclid(w.config.width);
    projection.prepare(&w.cells, &w.config, &mut field, &mut rows);
    assert_eq!(projection.preparations, 2);
}

#[test]
fn paid_stock_and_profile_changes_update_projection_without_rebuilding_geometry() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
    w.cells.truncate(1);
    let mut field = Field::new(w.config.width, w.config.height, w.config.mesh);
    let mut projection = Projection::default();
    let mut rows = Vec::new();
    projection.prepare(&w.cells, &w.config, &mut field, &mut rows);
    let original = rows[0].clone();
    let cell = &mut w.cells[0];
    let material = cell.mass() + cell.material();
    let energy = cell.energy;
    let (built, paid) = crate::metabolism::assemble(cell, &w.chemistry, &w.config, 1e-4, 0., 0.);
    assert!(built > 0. && paid > 0.);
    cell.body[0] += built;
    assert!((cell.mass() + cell.material() - material).abs() < 1e-12);
    assert!((energy - cell.energy - paid).abs() < 1e-12);
    projection.prepare(&w.cells, &w.config, &mut field, &mut rows);
    assert_eq!(
        (projection.preparations, projection.material_updates),
        (1, 1)
    );
    assert_eq!(rows[0].revision(), original.revision());
    assert_eq!(rows[0].as_slice(), original.as_slice());
    check(&field, &w.cells, &w.config, &rows);
    w.cells[0].operators.as_mut().unwrap().profile = [0.3, -0.2, 0.7];
    projection.prepare(&w.cells, &w.config, &mut field, &mut rows);
    assert_eq!(
        (projection.preparations, projection.material_updates),
        (1, 2)
    );
    assert_eq!(rows[0].revision(), original.revision());
    check(&field, &w.cells, &w.config, &rows);
}
