use crate::{chemistry::Chemistry, field::Field};

#[test]
fn sparse_halo_crosses_both_periodic_seams_without_processing_empty_geography() {
    let chemistry = Chemistry::new(101).unwrap();
    for size in [32., 64., 128.] {
        let mut field = Field::new(size, size, 2.);
        field.add(0, 17, 1., &chemistry);
        field.drift = 0.;
        field.advance(&chemistry, 0.2, 0., 0.);
        let diffusion = chemistry.properties[17].diffusion;
        let outgoing = (diffusion as f32 * (0.2 / 4.) as f32) as f64;
        for node in [1, field.nx - 1, field.nx, field.nx * (field.ny - 1)] {
            assert!((field.amounts[node * 256 + 17] as f64 - outgoing).abs() < 1e-8);
        }
        assert!((field.amounts[17] as f64 - (1. - 4. * outgoing)).abs() < 1e-7);
        assert_eq!(field.work_counts(), [5, 5, 5]);
        field.validate_reductions(&chemistry).unwrap();
    }
}

#[test]
fn truncation_is_accounted_and_empty_nodes_can_reactivate_without_stale_buffer_material() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut field = Field::new(32., 32., 2.);
    field.add(0, 17, 1e-25, &chemistry);
    let before = field.totals(&chemistry);
    let loss = field.advance(&chemistry, 0.8, 0., 0.);
    assert_eq!(field.work_counts()[..2], [0, 0]);
    assert_eq!(field.totals(&chemistry), (0., 0.));
    assert_eq!(before.0, loss.roundoff_matter);
    assert_eq!(before.1, loss.roundoff_energy);
    field.advance(&chemistry, 0.8, 0., 0.);
    assert_eq!(field.work_counts(), [0, 0, 0]);
    field.add(0, 213, 2., &chemistry);
    field.advance(&chemistry, 0.8, 0., 0.);
    assert!(field.amounts.rows().all(|(_, r)| r[17] == 0.));
    assert!(field.work_counts()[0] > 0);
    field.validate_reductions(&chemistry).unwrap();
}

#[test]
fn active_vector_matches_full_rows_and_cutoff_error_is_bounded_per_value() {
    let mut center = [0.; 256];
    let mut adjacent = [[0.; 256]; 4];
    for s in [0, 17, 63, 192, 255] {
        center[s] = 0.5;
        adjacent[s % 4][s] = 0.7;
    }
    center[33] = 1e-25;
    let rows = [[0.25; 256], [0.3; 256], [-0.2; 256], [0.7; 256]];
    let coefficients = [[0.1, 0.02, -0.01, -0.005]; 4];
    let mut expected = [0.; 256];
    let mut actual = [0.; 256];
    let mask = crate::field_activity::mask(&center);
    crate::field_vector::redistribute(
        &center,
        adjacent.each_ref().map(|r| r.as_slice()),
        &mut expected,
        &rows,
        coefficients,
        0.9,
        crate::field_vector::Work {
            mask: u64::MAX,
            floor: 0.,
        },
    );
    crate::field_vector::redistribute(
        &center,
        adjacent.each_ref().map(|r| r.as_slice()),
        &mut actual,
        &rows,
        coefficients,
        0.9,
        crate::field_vector::Work { mask, floor: 4e-24 },
    );
    let mut loss = 0.;
    for s in 0..256 {
        if expected[s] >= 4e-24 {
            assert_eq!(actual[s], expected[s]);
        } else {
            assert_eq!(actual[s], 0.);
        }
        loss += (expected[s] - actual[s]) as f64;
    }
    assert!(loss > 0. && loss < 256. * 4e-24);
}

#[test]
fn source_and_row_commit_wake_previously_empty_chemical_groups() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut field = Field::new(32., 32., 2.);
    let mut changes = vec![0.; 256];
    changes[255] = 0.25;
    field.apply_rows(&mut changes, &[(0, 1 << 63)], &chemistry);
    field.add(3, 0, 0.5, &chemistry);
    field.advance(&chemistry, 0.8, 0.002, 0.5);
    assert!(field.sample(255, &[(1, 1.)]) > 0.);
    assert!(field.sample(0, &[(2, 1.)]) > 0.);
    field.validate_reductions(&chemistry).unwrap();
}

#[test]
fn default_transport_uses_one_pass_with_positive_conservative_extreme_medium() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut field = Field::new(16., 16., 2.);
    for (i, q) in field.amounts.dense_values_mut().enumerate() {
        *q = 0.01 + (i % 23) as f32 * 0.002;
    }
    field.refresh(&chemistry);
    for n in 0..field.nx * field.ny {
        let sign = if n % 2 == 0 { 1. } else { -1. };
        field.source_signal[n] = [sign * 1e6, -sign * 1e6];
        field.source_load[n] = if n % 3 == 0 { 1e6 } else { 0. };
        field.body_load[n] = if n % 5 == 0 { 1e8 } else { 0. };
    }
    let initial = field.totals(&chemistry);
    let balance = field.advance(&chemistry, 0.8, 0., 1.);
    assert_eq!(field.work_counts()[2], field.nx * field.ny * 64);
    assert!(field.amounts.iter().all(|q| q.is_finite() && *q > 0.));
    assert!((field.totals(&chemistry).0 - initial.0).abs() < 1e-4);
    assert!(balance.roundoff_matter.abs() < 1e-4);
    field.validate_reductions(&chemistry).unwrap();
    // Larger intervals must still subdivide; the one-pass optimization is not unconditional.
    field.advance(&chemistry, 2., 0., 1.);
    assert_eq!(field.work_counts()[2], 3 * field.nx * field.ny * 64);
    assert!(field.amounts.iter().all(|q| q.is_finite() && *q >= 0.));
}

#[test]
fn common_cutoff_retains_useful_dilute_material_and_accounts_discarded_tails() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut field = Field::new(16., 16., 2.);
    let floor = crate::field_activity::CONCENTRATION_FLOOR as f64 * 4.;
    for n in 0..field.nx * field.ny {
        field.add(n, 0, floor / 2., &chemistry);
        field.add(n, 255, floor * 100., &chemistry);
    }
    field.drift = 0.;
    let expected_loss = field.totals(&chemistry).0
        - field
            .amounts
            .chunks_exact(256)
            .map(|r| r[255] as f64)
            .sum::<f64>();
    let balance = field.advance(&chemistry, 0.8, 0., 0.);
    assert!(
        field
            .amounts
            .chunks_exact(256)
            .all(|r| r[0] == 0. && r[255] > 0.)
    );
    assert!((balance.roundoff_matter - expected_loss).abs() < 1e-8);
    field.validate_reductions(&chemistry).unwrap();
}

#[test]
fn checkpoint_retains_pending_zero_row_reduction_cleanup() {
    let mut world = crate::diagnostics::nutrition(0.8, 2., false, false);
    for species in 0..256 {
        world.field.add(0, species, 1., &world.chemistry);
        world.field.add(0, species, 0.3, &world.chemistry);
        let amount = world.field.amounts[species] as f64;
        world.field.add(0, species, -amount, &world.chemistry);
    }
    crate::diagnostics::initialize(&mut world);
    assert!(world.field.amounts.iter().all(|q| *q == 0.));
    let mut restored = crate::world::World::restore(&world.snapshot().unwrap()).unwrap();
    for _ in 0..8 {
        world.step();
        restored.step();
        assert!(world.snapshot().unwrap() == restored.snapshot().unwrap());
    }
}
