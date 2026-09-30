use crate::{config::Config, terrain_config::TerrainConfig, world::World};

#[test]
fn directional_field_faces_conserve_material_across_periodic_regions() {
    let c = Config {
        width: 32.,
        height: 24.,
        founders: 0,
        source_count: 0,
        terrain: TerrainConfig::integrated(),
        ..Config::default()
    };
    let mut w = World::new(27, c).unwrap();
    w.field.add(0, 17, 10., &w.chemistry);
    w.field.add(111, 43, 2., &w.chemistry);
    let before = w.field.totals(&w.chemistry);
    let mut loss = [0.; 2];
    for _ in 0..40 {
        let b = w.field.advance(&w.chemistry, 0.2, 0., 0.);
        loss[0] += b.roundoff_matter;
        loss[1] += b.roundoff_energy;
    }
    let after = w.field.totals(&w.chemistry);
    assert!((after.0 + loss[0] - before.0).abs() < 1e-6);
    assert!((after.1 + loss[1] - before.1).abs() < 1e-6);
    w.field.validate_reductions(&w.chemistry).unwrap();
}

#[test]
fn paid_motion_and_passive_contacts_obey_distinct_resistance_and_publish_load() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., true, true);
    w.config.terrain = TerrainConfig::integrated();
    w.config.terrain.elevation = false;
    w.config.adhesion = 0.;
    w.shade = crate::terrain::Shade::generate(27, &w.config, w.field.nx, w.field.ny);
    std::sync::Arc::make_mut(&mut w.shade)
        .geography
        .conductance
        .fill(0.25);
    let cell = &mut w.cells[0];
    let start = [cell.x, cell.y];
    cell.action.swim = 1.;
    cell.flows.motors = 1.;
    let contact = crate::movement::geometry::Contacts::new(&w.cells, &w.config);
    crate::movement::prepared::blend_apply(
        &mut w.cells,
        vec![[1., 0., 0., 0.]],
        &contact,
        &w.config,
        &w.shade.geography,
    );
    assert!((w.cells[0].x - start[0] - 0.5).abs() < 1e-10);
    assert!(w.cells[0].motor_load > 0.);
    let x = w.cells[0].x;
    crate::movement::prepared::passive_apply(
        &mut w.cells[0],
        [1., 0.],
        &w.config,
        &w.shade.geography,
    );
    assert!((w.cells[0].x - x - 0.25).abs() < 1e-10);
    crate::sensing::observe_base(&mut w.cells[0], &w.config);
    assert!(w.cells[0].inputs[crate::controller::MOTOR_LOAD_INPUT] > 0.);
}

#[test]
fn terrain_display_uses_canonical_values_without_mutating_world() {
    let c = Config {
        width: 24.,
        height: 24.,
        founders: 0,
        source_count: 0,
        terrain: TerrainConfig::integrated(),
        ..Config::default()
    };
    let mut w = World::new(27, c).unwrap();
    let s = std::sync::Arc::make_mut(&mut w.shade);
    s.geography.height.fill(0.);
    s.geography.conductance.fill(0.25);
    s.geography.seasons.fill([1., 0.]);
    s.geography.phase = 0.;
    s.ceiling.fill(0.5);
    let before = w.snapshot().unwrap();
    let mut render = crate::render::Buffers::default();
    for (kind, expected) in [
        (10, 0.5),
        (11, 0.25),
        (12, 0.),
        (13, 1.),
        (14, 1.),
        (15, 0.),
    ] {
        render.prepare(&w, kind, 0, 0, true, 0).unwrap();
        assert!(
            render
                .field
                .chunks_exact(8)
                .all(|v| (v[0] as f64 - expected).abs() < 1e-7)
        );
    }
    assert_eq!(before, w.snapshot().unwrap());
}
