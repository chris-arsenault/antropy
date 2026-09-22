use crate::{chemistry::Chemistry, config::Config, field::Field, source_medium, world::World};

fn direct_three_box(input: &[f64], nx: usize, ny: usize, width: f64) -> Vec<f64> {
    let radius = (width + 0.5).ceil() as isize;
    let weights: Vec<_> = (-radius..=radius)
        .map(|j| {
            ((j as f64 + 0.5).min(width) - (j as f64 - 0.5).max(-width)).max(0.) / (2. * width)
        })
        .collect();
    let mut values = input.to_vec();
    for axis in [0, 0, 0, 1, 1, 1] {
        let mut result = vec![0.; input.len()];
        for (n, q) in result.iter_mut().enumerate() {
            for (j, weight) in weights.iter().enumerate() {
                let offset = j as isize - radius;
                let x = (n % nx) as isize + if axis == 0 { offset } else { 0 };
                let y = (n / nx) as isize + if axis == 1 { offset } else { 0 };
                let node =
                    y.rem_euclid(ny as isize) as usize * nx + x.rem_euclid(nx as isize) as usize;
                *q += weight * values[node];
            }
        }
        values = result;
    }
    values
}

#[test]
fn compact_filter_matches_integrated_boxes_at_fractional_and_wrapped_reaches() {
    for (nx, ny) in [(1, 1), (1, 3), (4, 2), (13, 9)] {
        for width in [0.01, 0.49, 0.5, 0.51, 1., 1.5, 2.75, 13.25] {
            let signal: crate::spatial_signal::Signal = (0..nx * ny)
                .map(|n| [(n as f64 * 0.7).cos(), 0.])
                .collect::<Vec<_>>()
                .into();
            let zeros = vec![[0.; 2]; signal.len()].into();
            let input: Vec<_> = signal.iter().map(|q| q[0]).collect();
            let mut filter = crate::attraction::Attraction::default();
            filter.prepare((nx, ny, 2., width * 2.), [&signal, &zeros, &zeros]);
            let expected = direct_three_box(&input, nx, ny, width);
            for (actual, expected) in filter.output.iter().zip(expected) {
                assert!(
                    (actual - expected).abs() < 1e-12,
                    "{nx}x{ny}, width={width}"
                );
            }
            let residual = filter.output.iter().sum::<f64>() - input.iter().sum::<f64>();
            assert!(residual.abs() < 1e-11, "{nx}x{ny}, width={width}");
        }
    }
}

#[test]
fn compact_impulse_has_normalized_positive_support_and_discrete_variance() {
    let mut signal: crate::spatial_signal::Signal = vec![[0.; 2]; 65].into();
    signal[32][0] = 1.;
    let zeros = vec![[0.; 2]; 65].into();
    let mut filter = crate::attraction::Attraction::default();
    filter.prepare((65, 1, 2., 6.), [&signal, &zeros, &zeros]);
    assert!((filter.output.iter().sum::<f64>() - 1.).abs() < 1e-12);
    for (n, q) in filter.output.iter().enumerate() {
        assert!(*q >= -1e-15);
        assert!((q - filter.output[64 - n]).abs() < 1e-15);
        if n.abs_diff(32) > 9 {
            assert!(q.abs() < 1e-15);
        }
    }
    let variance: f64 = filter
        .output
        .iter()
        .enumerate()
        .map(|(n, q)| q * (n as f64 - 32.).powi(2))
        .sum();
    // One width-3 box has weights [1/2, 1, 1, 1, 1, 1, 1/2] / 6.
    // Its discrete variance is 19/6; three independent passes add variances.
    assert!((variance - 9.5).abs() < 1e-12);
}

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
    let revision = f.attraction.revisions;
    f.prepare_attraction();
    assert_eq!(revision, f.attraction.revisions);
    f.signal.fill([0.1, 0.]);
    f.prepare_attraction();
    assert!(f.attraction.output.iter().all(|q| (q - 0.2).abs() < 1e-12));
    assert!((0..f.signal.len()).all(|n| (f.attractive(n) - 0.2).abs() < 1e-12));
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
    initial.attraction_length = 5.5;
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
        other.attraction_length = 5.5;
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
            s.mixture.fill(0.);
            s.mixture[0] = 0.6;
            s.mixture[136] = 0.4;
            s.amount = s.interface;
        }
        source_medium::project(&mut w);
        let v: Vec<_> = w
            .sources
            .iter()
            .map(|s| source_medium::response(s, 0, &w.config, &w.field, &w.chemistry).velocity[0])
            .collect();
        if distance == 40. {
            assert!(v[0].abs() < 1e-12, "No force beyond finite support: {v:?}");
        } else {
            assert_eq!(v[0] > 0., distance > 4., "distance={distance}, v={v:?}");
        }
        assert!((v[0] + v[1]).abs() < 1e-10, "distance={distance}, v={v:?}");
    }
}

#[test]
fn ordinary_washout_has_no_cohesion_discount_and_accounts_actual_loss() {
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
    let before = compact.totals(&chemistry);
    let balance = compact.advance(&chemistry, 0.8, 0.001, 1.);
    let after = compact.totals(&chemistry);
    let expected = before.0 * (1. - (-0.0008_f64).exp());
    assert!((balance.matter - expected).abs() < 1e-9);
    assert!((before.0 - after.0 - balance.matter - balance.roundoff_matter).abs() < 1e-10);
    assert!((before.1 - after.1 - balance.energy - balance.roundoff_energy).abs() < 1e-10);
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
