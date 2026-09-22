use crate::{chemistry::Chemistry, field::Field};

#[test]
fn material_restore_validates_before_reclaim_and_packs_partial_geometry() {
    use crate::spatial_material::Material;
    let count = 225;
    let mut values = vec![1_f32; count * 256];
    let encode = |values: &[f32]| {
        postcard::to_stdvec(&(count, (0..count).collect::<Vec<_>>(), values)).unwrap()
    };
    let material: Material = postcard::from_bytes(&encode(&values)).unwrap();
    assert_eq!(material.len(), count * 256);
    assert_eq!(material.rows().count(), count);
    assert!(material.allocated_bytes() < count * 256 * 4 * 2);
    assert!(material.row(count - 1).iter().all(|&v| v == 1.));
    for invalid in [-1., f32::NAN, f32::INFINITY] {
        values[..256].fill(invalid);
        assert!(postcard::from_bytes::<Material>(&encode(&values)).is_err());
    }
}

#[test]
fn no_op_exchange_never_allocates_and_last_withdrawal_clears_every_feature() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut f = Field::new(64., 64., 2.);
    let before = f.structural_counts();
    f.apply_rows(&mut [0.; 256], &[(500, 0)], &chemistry);
    f.apply_rows(&mut [0.; 256], &[(500, u64::MAX)], &chemistry);
    assert_eq!(before, f.structural_counts());
    for s in 0..256 {
        f.add(500, s, 0.3, &chemistry);
    }
    let mut withdraw: Vec<_> = f.amounts().row(500).iter().map(|&v| -(v as f64)).collect();
    f.apply_rows(&mut withdraw, &[(500, u64::MAX)], &chemistry);
    assert!(f.amounts().row(500).iter().all(|&v| v == 0.));
    assert_eq!(f.material_signal(500), [0.; 2]);
    assert_eq!(f.impedance_at(500), 0.);
    assert_eq!(f.stress_at(500), 0.);
    f.validate_reductions(&chemistry).unwrap();
}

#[test]
fn delayed_local_filter_commutes_with_grid_translations_and_reflections() {
    let mut a = Field::new(128., 128., 2.);
    let mut b = a.clone();
    a.attraction_length = 6.;
    b.attraction_length = 6.;
    let map = |n: usize| ((n / 64 + 7) % 64) * 64 + (63 - n % 64 + 9) % 64;
    for step in 0..32 {
        for n in [0, 17, 73, 301, 991] {
            let value = ((step as f64 * 0.023 + n as f64) * 0.1).sin();
            a.test_body_signal()[n] = [value, 0.];
            b.test_body_signal()[map(n)] = [value, 0.];
        }
        a.prepare_attraction();
        b.prepare_attraction();
        for n in 0..4096 {
            assert!((a.attraction.output[n] - b.attraction.output[map(n)]).abs() < 1e-12);
        }
    }
}

#[test]
fn membership_is_reused_and_handles_reordering_removal_and_crossing() {
    let mut members = crate::spatial_members::Members::default();
    let g = crate::spatial::Geometry::new(19, 11);
    members.begin(g);
    members.update(12, 0, 0);
    members.update(17, 1, 208);
    members.finish();
    assert_eq!(members.changes, 2);
    members.begin(g);
    members.update(12, 1, 0);
    members.update(17, 0, 208);
    members.finish();
    assert_eq!(members.changes, 2);
    assert_eq!(members.at(0).collect::<Vec<_>>(), [1]);
    members.begin(g);
    members.update(12, 0, 208);
    members.finish();
    assert_eq!(members.at(208).collect::<Vec<_>>(), [0]);
    assert_eq!(members.at(0).count(), 0);
}

#[test]
fn persistent_regions_reuse_destinations_and_never_revive_removed_groups() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut f = Field::new(36., 26., 2.);
    f.drift = 0.;
    f.add(7, 0, 20., &chemistry);
    f.add(f.nx * f.ny - 1, 255, 20., &chemistry);
    for _ in 0..8 {
        f.advance(&chemistry, 0.01, 0., 0.);
    }
    let allocations = f.structural_counts()["regionAllocations"].as_u64().unwrap();
    for _ in 0..4 {
        f.advance(&chemistry, 0.01, 0., 0.);
    }
    assert_eq!(
        allocations,
        f.structural_counts()["regionAllocations"].as_u64().unwrap()
    );
    let before = f.structural_counts();
    assert_eq!(f.sample(16, &[(f.nx * 6 + 12, 1.)]), 0.);
    assert_eq!(before, f.structural_counts());
    f.replace_material(&chemistry, |i| if i == 256 * 8 + 68 { 10. } else { 0. });
    for _ in 0..5 {
        f.advance(&chemistry, 0.1, 0., 0.);
        assert!(
            f.amounts()
                .rows()
                .all(|(_, row)| row[0] == 0. && row[255] == 0.)
        );
        f.validate_reductions(&chemistry).unwrap();
    }
}

#[test]
fn local_change_does_not_recompute_distant_populated_regions() {
    let mut f = Field::new(512., 512., 2.);
    f.attraction_length = 6.;
    for (x, y) in [(16, 16), (96, 96), (176, 176)] {
        let n = y * f.nx + x;
        f.test_body_signal()[n] = [1., 0.];
    }
    f.prepare_attraction();
    let full = f.attraction.visited;
    let distant = f.attraction.output[96 * f.nx + 96];
    let n = 16 * f.nx + 16;
    f.test_body_signal()[n][0] += 0.;
    f.prepare_attraction();
    assert_eq!(f.attraction.visited, 0);
    for _ in 0..4 {
        f.test_body_signal()[n][0] += 0.02;
        f.prepare_attraction();
        assert_eq!(f.attraction.visited, 0);
    }
    for _ in 0..2 {
        f.test_body_signal()[n][0] += 0.02;
        f.prepare_attraction();
    }
    assert!(f.attraction.visited > 0 && f.attraction.visited < full / 2);
    assert_eq!(f.attraction.output[96 * f.nx + 96], distant);
    let mut fresh = f.clone();
    fresh.attraction = Default::default();
    fresh.prepare_attraction();
    assert!(
        f.attraction
            .output
            .iter()
            .zip(fresh.attraction.output)
            .all(|(a, b)| (a - b).abs() < 1e-12)
    );
}

#[test]
fn local_operator_removes_old_support_across_periodic_seams() {
    let mut f = Field::new(132., 100., 2.);
    f.attraction_length = 6.;
    f.test_body_signal()[0] = [1., 0.];
    f.prepare_attraction();
    assert!(f.attraction.output[f.nx - 1] > 0.);
    f.test_body_signal()[0] = [0.; 2];
    let n = 20 * f.nx + 30;
    f.test_body_signal()[n] = [1., 0.];
    f.prepare_attraction();
    assert_eq!(f.attraction.output[f.nx - 1], 0.);
    let mut fresh = f.clone();
    fresh.attraction = Default::default();
    fresh.prepare_attraction();
    assert!(
        f.attraction
            .output
            .iter()
            .zip(fresh.attraction.output)
            .all(|(a, b)| (a - b).abs() < 1e-12)
    );
}

#[test]
fn reciprocal_addressing_matches_division_for_every_width() {
    use crate::spatial::SIDE;
    let limit = crate::memory_budget::MAX_FIELD_NODES;
    for nx in (1..=1024).chain([1439, 3600, 7200, limit / 4]) {
        let g = crate::spatial::Geometry::new(nx, 4);
        let columns = nx.div_ceil(SIDE);
        let nodes = (0..4 * nx).chain((0..64).map(|k| limit - 1 - k * 7919));
        for node in nodes {
            let (x, y) = (node % nx, node / nx);
            let expected = (y / SIDE * columns + x / SIDE, y % SIDE * SIDE + x % SIDE);
            assert_eq!(g.address(node), expected, "nx={nx}, node={node}");
        }
    }
}
