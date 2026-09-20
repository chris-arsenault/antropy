use crate::{chemistry::Chemistry, config::Config, field::Field, source_medium, world::World};

#[test]
fn shared_filter_preserves_signed_sums_constants_and_skips_unchanged_inputs() {
    let mut f = Field::new(32., 24., 2.);
    f.attraction_length = 6.;
    for n in 0..f.signal.len() {
        f.signal[n][0] = (n as f64 * 0.17).sin();
        f.body_signal[n][0] = 0.2;
        f.source_signal[n][0] = -0.1;
    }
    let raw = f.signal.clone();
    f.prepare_attraction();
    let expected: f64 = (0..f.signal.len()).map(|n| f.medium_signal(n)[0]).sum();
    assert!((f.attraction.output.iter().sum::<f64>() - expected).abs() < 1e-11);
    assert_eq!(raw, f.signal);
    let weights: Vec<_> = (-9..=9)
        .map(|j| (-0.5 * (j as f64 / 3.).powi(2)).exp())
        .collect();
    let norm = weights.iter().sum::<f64>().powi(2);
    for n in [0, 53, 191] {
        let mut direct = 0.;
        for (x, wx) in weights.iter().enumerate() {
            for (y, wy) in weights.iter().enumerate() {
                let ix = (n % 16 + x as isize - 9).rem_euclid(16) as usize;
                let iy = (n / 16 + y as isize - 9).rem_euclid(12) as usize;
                direct += wx * wy * f.medium_signal(iy * 16 + ix)[0] / norm;
            }
        }
        assert!((f.attraction.output[n as usize] - direct).abs() < 1e-12);
    }
    let revision = f.attraction.revisions;
    f.prepare_attraction();
    assert_eq!(revision, f.attraction.revisions);
    f.signal.fill([0.1, 0.]);
    f.prepare_attraction();
    assert!(f.attraction.output.iter().all(|q| (q - 0.2).abs() < 1e-12));
    f.signal.fill([0.; 2]);
    f.body_signal.fill([0.; 2]);
    f.source_signal.fill([0.; 2]);
    f.prepare_attraction();
    assert!(f.attraction.output.iter().all(|q| *q == 0.));
}

#[test]
fn attraction_transport_commutes_with_grid_frames_and_chemical_relabeling() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut initial = Field::new(32., 32., 2.);
    initial.attraction_length = 6.;
    for (n, s, q) in [(0, 5, 40.), (26, 80, 2.), (253, 0, 12.)] {
        initial.add(n, s, q, &chemistry);
    }
    let mut reference = initial.clone();
    reference.advance(&chemistry, 0.8, 0., 1.);
    for mode in 0..3 {
        let node = |n: usize| match mode {
            0 => (n % 16) * 16 + n / 16,
            1 => (n / 16) * 16 + 15 - n % 16,
            _ => ((n / 16 + 3) % 16) * 16 + (n % 16 + 4) % 16,
        };
        let mut chem = chemistry.clone();
        for s in 0..256 {
            chem.properties[255 - s] = chemistry.properties[s].clone();
        }
        let mut other = Field::new(32., 32., 2.);
        other.attraction_length = 6.;
        for n in 0..256 {
            for s in 0..256 {
                other.add(node(n), 255 - s, initial.amounts[n * 256 + s] as f64, &chem);
            }
        }
        other.advance(&chem, 0.8, 0., 1.);
        for n in 0..256 {
            assert!(
                (other.attraction.output[node(n)] - reference.attraction.output[n]).abs() < 1e-12
            );
            for s in 0..256 {
                assert!(
                    (other.amounts[node(n) * 256 + 255 - s] - reference.amounts[n * 256 + s]).abs()
                        < 1e-5
                );
            }
        }
    }
}

#[test]
fn binding_changes_from_repulsion_to_restoring_response_without_anchors() {
    for distance in [4., 12., 16., 40.] {
        let mut w = World::new(
            27,
            Config {
                width: 128.,
                height: 128.,
                founders: 0,
                source_count: 2,
                source_priming: 0.,
                ..Config::default()
            },
        )
        .unwrap();
        for (j, s) in w.sources.iter_mut().enumerate() {
            s.habitat.x = 48.3 + j as f64 * distance;
            s.habitat.y = 63.1;
            s.habitat.radius = 3.;
            s.rebuild(&w.config, &w.field);
            s.inventory.fill(0.);
            s.inventory[0] = 0.6 * s.interface;
            s.inventory[136] = 0.4 * s.interface;
        }
        source_medium::project(&mut w);
        let v: Vec<_> = w
            .sources
            .iter()
            .map(|s| source_medium::response(s, 0, &w.config, &w.field, &w.chemistry).velocity[0])
            .collect();
        assert_eq!(
            v[0] > 0.,
            distance > 4. && distance < 40.,
            "distance={distance}, v={v:?}"
        );
        assert!((v[0] + v[1]).abs() < 1e-10, "distance={distance}, v={v:?}");
    }
}

#[test]
fn cohesion_retains_material_reversibly_and_accounts_actual_loss() {
    let mut chemistry = Chemistry::new(101).unwrap();
    // Isolate the shared mechanical law from diffusion and chemical response.
    for p in &mut chemistry.properties {
        p.interaction = [1., 0.];
        p.impedance = 0.1;
        p.diffusion = 0.;
    }
    let mut compact = Field::new(64., 64., 2.);
    compact.attraction_length = 6.;
    compact.drift = 0.;
    for y in 12..20 {
        for x in 12..20 {
            compact.add(y * 32 + x, 73, 100., &chemistry);
        }
    }
    compact.prepare_attraction();
    let center = 16 * 32 + 16;
    assert!(compact.retention(center, 1.) < 0.1);
    let before = compact.totals(&chemistry);
    let balance = compact.advance(&chemistry, 0.8, 0.001, 1.);
    let after = compact.totals(&chemistry);
    assert!(balance.matter > 0. && balance.matter < before.0 * 0.0004);
    assert!((before.0 - after.0 - balance.matter - balance.roundoff_matter).abs() < 1e-10);
    assert!((before.1 - after.1 - balance.energy - balance.roundoff_energy).abs() < 1e-10);
    compact.amounts.fill(0.);
    compact.refresh(&chemistry);
    compact.prepare_attraction();
    assert_eq!(compact.retention(center, 1.), 1.);
    compact.signal.fill([1., 0.]);
    compact.prepare_attraction();
    assert!((compact.retention(center, 1.) - 1.).abs() < 1e-12);
}

#[test]
fn finite_body_has_no_self_force_with_extended_attraction() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
    for [x, y] in [[0.1, 23.7], [10.3, 11.9]] {
        w.cells[0].x = x;
        w.cells[0].y = y;
        let sites = vec![crate::footprint::sites(&w.cells[0], &w.config, &w.field)];
        crate::footprint::deposit_profiles(&w.cells, &w.config, &mut w.field, &sites);
        w.field.prepare_attraction();
        assert!(
            w.field
                .gradient(&sites[0])
                .iter()
                .flatten()
                .all(|x| x.abs() < 1e-12)
        );
    }
}
