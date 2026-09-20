use super::*;

#[test]
fn specificity_scaled_inheritance_reaches_product_neighborhoods_without_special_targets() {
    let chemistry = crate::chemistry::Chemistry::new(101).unwrap();
    let config = crate::config::Config::default();
    for (a, b) in [(0, 138), (119, 187), (15, 240)] {
        let mut original =
            crate::genetics::Machinery::seed(&chemistry, &chemistry.source_species());
        original.enzymes[0] = crate::genetics::Enzyme::between(
            crate::chemistry::coordinate(a),
            crate::chemistry::coordinate(b),
        );
        let start = crate::chemistry::coordinate(a);
        let target = crate::chemistry::coordinate(b);
        let mut counts = vec![];
        for multiplier in [1. / config.affinity_radius, 1.] {
            let mut c = config.clone();
            c.physical_mutation_scale *= multiplier;
            let mut rng = Random::new(101);
            let mut norms = vec![];
            let mut hits = 0;
            for _ in 0..100000 {
                let mut m = original.clone();
                m.mutate(&mut rng, &c);
                let e = m.enzymes[0];
                let norm = (e.x - start[0]).hypot(e.y - start[1]);
                if norm > 0. {
                    norms.push(norm);
                }
                hits += usize::from((e.x - target[0]).hypot(e.y - target[1]) < c.affinity_radius);
            }
            norms.sort_by(f64::total_cmp);
            assert!((18000..20000).contains(&norms.len()));
            println!(
                "recognition {a}>{b} scale={} births=100000 changed={} median={} target_hits={hits}",
                c.physical_mutation_scale * c.affinity_radius,
                norms.len(),
                norms[norms.len() / 2]
            );
            counts.push((norms.len(), hits));
        }
        assert_eq!(counts[0].0, counts[1].0);
        assert!(counts[1].1 > counts[0].1);
    }
}

#[test]
fn geometric_events_preserve_frequency_magnitude_and_uniform_direction() {
    let mut rng = Random::new(101);
    let mut events = 0;
    let mut hits = 0;
    let mut below_median = 0;
    let mut tail = 0;
    let mut sectors = [0; 8];
    let b = NORMAL_ABS_MEDIAN * 0.12;
    for _ in 0..100000 {
        let count = event_count(&mut rng, 0.1);
        events += count;
        hits += usize::from(count > 0);
        let u = rng.signed();
        let angle = rng.unit() * std::f64::consts::TAU;
        let [x, y] = vector_step([0., 0.], [-1e6, 1e6], 0.12, u, angle);
        let norm = x.hypot(y);
        below_median += usize::from(norm < b);
        tail += usize::from(norm > 3.);
        let sector =
            (y.atan2(x).rem_euclid(std::f64::consts::TAU) / std::f64::consts::TAU * 8.) as usize;
        sectors[sector] += 1;
    }
    assert!((19200..20800).contains(&events), "events={events}");
    assert!((18200..19800).contains(&hits), "hits={hits}");
    assert!((49000..51000).contains(&below_median));
    let expected_tail = 100000. * b / (b + 3.);
    assert!((tail as f64 - expected_tail).abs() < 6. * expected_tail.sqrt());
    assert!(sectors.iter().all(|n| (11900..13100).contains(n)));
    println!(
        "vector draws=100000 events={events} hit_groups={hits} below_median={below_median} tail_above_3={tail} sectors={sectors:?}"
    );
}

#[test]
fn vector_steps_rotate_scale_and_reflect_with_finite_bounds() {
    for u in [-0.9, -0.5, 0.5, 0.9] {
        for angle in [0., 0.3, 1.2, 3.] {
            let [x, y] = vector_step([0., 0.], [-15., 15.], 0.12, u, angle);
            let [rx, ry] = vector_step([0., 0.], [-15., 15.], 0.12, u, angle + 0.7);
            assert!((rx - (x * 0.7_f64.cos() - y * 0.7_f64.sin())).abs() < 1e-12);
            assert!((ry - (x * 0.7_f64.sin() + y * 0.7_f64.cos())).abs() < 1e-12);
            let scaled = vector_step([0., 0.], [-30., 30.], 0.24, u, angle);
            assert!((scaled[0] - 2. * x).abs() < 1e-12);
            assert!((scaled[1] - 2. * y).abs() < 1e-12);
        }
    }
    for u in [-1., 1.] {
        let point = vector_step([0., 15.], [0., 15.], f64::MAX, u, 0.7);
        assert!(
            point
                .iter()
                .all(|v| v.is_finite() && (0. ..=15.).contains(v))
        );
    }
    let mut rng = Random::new(7);
    for _ in 0..100 {
        assert_eq!(event_count(&mut rng, 0.), 0);
        assert_eq!(event_count(&mut rng, 1.), 2);
    }
}

#[test]
fn realized_pair_changes_report_bounds_separately_from_proposals() {
    for start in [[7.5_f64, 7.5], [0., 0.], [0., 7.5]] {
        let mut old_rng = Random::new(101);
        let mut new_rng = Random::new(101);
        let mut old_norms = Vec::new();
        let mut new_norms = Vec::new();
        for _ in 0..100000 {
            let mut old = start;
            mutate(&mut old, &mut old_rng, 0.1, 0.12, 0., 15.);
            let old_norm = (old[0] - start[0]).hypot(old[1] - start[1]);
            if old_norm > 0. {
                old_norms.push(old_norm);
            }
            let mut new = start;
            let [x, y] = &mut new;
            mutate_pairs([[x, y]], &mut new_rng, 0.1, 0.12, 0., 15.);
            let new_norm = (new[0] - start[0]).hypot(new[1] - start[1]);
            if new_norm > 0. {
                new_norms.push(new_norm);
            }
        }
        for (name, mut norms) in [("v20", old_norms), ("v21", new_norms)] {
            norms.sort_by(f64::total_cmp);
            let median = norms[norms.len() / 2];
            let p90 = norms[norms.len() * 9 / 10];
            let tail = norms.iter().filter(|v| **v > 3.).count();
            assert!((18000..20000).contains(&norms.len()));
            assert!((0.07..0.1).contains(&median));
            println!(
                "{name} start={start:?} changed_groups={} realized_norm_median={median} p90={p90} above_3={tail}",
                norms.len()
            );
        }
    }
}

#[test]
fn machinery_mutation_preserves_pair_rate_and_replays_without_touching_disabled_rng() {
    let c = crate::config::Config::default();
    let chemistry = crate::chemistry::Chemistry::new(101).unwrap();
    let original = crate::genetics::Machinery::seed(&chemistry, &[0, 17]);
    let mut rng = Random::new(101);
    let mut changed_coordinates = 0;
    for _ in 0..10000 {
        let mut machinery = original.clone();
        let mut replay = rng.clone();
        let mut repeated = original.clone();
        machinery.mutate(&mut rng, &c);
        repeated.mutate(&mut replay, &c);
        assert_eq!(machinery, repeated);
        assert_eq!(rng.0, replay.0);
        machinery.validate().unwrap();
        let values = |m: &crate::genetics::Machinery| {
            m.receptors
                .iter()
                .map(|p| p.point())
                .chain(m.transporters.iter().map(|p| [p.x, p.y]))
                .chain(m.enzymes.iter().map(|p| [p.x, p.y]))
                .chain([m.membrane.point()])
                .chain(m.enzymes.iter().map(|p| [p.center_x, p.center_y]))
                .flatten()
                .collect::<Vec<_>>()
        };
        changed_coordinates += values(&machinery)
            .iter()
            .zip(values(&original))
            .filter(|(a, b)| **a != *b)
            .count();
    }
    let coordinates = 18 + 4 * crate::organism::MAX_ENZYMES;
    let expected = 10000. * coordinates as f64 * (2. * 0.1 - 0.1 * 0.1);
    assert!((changed_coordinates as f64 - expected).abs() < 1600.);
    println!(
        "chemical changed_coordinates_per_birth={} predicted=6.46; scalar body predicted=1.5; total event opportunities=4.9",
        changed_coordinates as f64 / 10000.
    );
    let mut point = [1., 2.];
    let before = rng.0;
    let [x, y] = &mut point;
    assert!(!mutate_pairs([[x, y]], &mut rng, 0., 0.12, 0., 15.));
    assert_eq!(rng.0, before);
    assert_eq!(point, [1., 2.]);
}
