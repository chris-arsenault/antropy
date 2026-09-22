use crate::{
    chemistry::Chemistry,
    config::Config,
    field::Field,
    movement::distance_squared,
    random::Random,
    source_medium,
    sources::{Habitat, Source},
    world::World,
};

fn config() -> Config {
    Config {
        width: 24.,
        height: 24.,
        source_count: 2,
        founders: 2,
        source_species: vec![0, 80],
        ..Config::default()
    }
}

#[test]
fn composition_keeps_local_history_through_empty_interval_and_restore() {
    let mut c = config();
    c.founders = 0;
    c.source_count = 1;
    c.source_drift = 0.;
    c.source_priming = 0.;
    let mut w = World::new(27, c).unwrap();
    w.sources[0].amount = 0.;
    w.sources[0].wait = 10.;
    let seed = w.sources[0].mixture.clone();
    for n in 0..w.field.nx * w.field.ny {
        w.field.add(n, 15, 4., &w.chemistry);
    }
    source_medium::project(&mut w);
    let held = w.held();
    for _ in 0..8 {
        source_medium::advance(&mut w);
    }
    assert_eq!(held, w.held()); // Boundary composition adds no material or work.
    assert_eq!(w.ledger.supplied, 0.);
    assert!(w.field.source_load().iter().all(|q| *q == 0.));
    assert_ne!(seed, w.sources[0].mixture);
    w.sources[0].wait = 0.;
    w.config.source_processing = 0.;
    let profile = w.sources[0].mixture.clone();
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    source_medium::advance(&mut w);
    source_medium::advance(&mut restored);
    assert_eq!(profile, w.sources[0].mixture);
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
    let source = &w.sources[0];
    let total = source.amount;
    for (q, share) in source.inventory().zip(profile) {
        assert!((q / total - share).abs() < 1e-12);
    }
    let after = w.held();
    assert!((after.0 - held.0 - w.ledger.supplied).abs() < 1e-5);
    assert!((after.1 - held.1 - w.ledger.supplied_energy).abs() < 1e-5);
    w.sources[0].mixture[0] = f64::NAN;
    assert!(World::restore(&w.snapshot().unwrap()).is_err());
}

#[test]
fn source_caches_match_owned_material_and_clear_retired_geography() {
    let mut w = World::new(27, config()).unwrap();
    for _ in 0..12 {
        w.step();
        let mut reference = w.clone();
        source_medium::project(&mut reference);
        assert!(
            w.field
                .source_signal()
                .iter()
                .flatten()
                .zip(reference.field.source_signal().iter().flatten())
                .all(|(a, b)| (a - b).abs() < 1e-12)
        );
        assert!(
            w.field
                .source_load()
                .iter()
                .zip(reference.field.source_load())
                .all(|(a, b)| (a - b).abs() < 1e-12)
        );
        for (a, b) in w.sources.iter().zip(&reference.sources) {
            assert_eq!(a.material.total, b.material.total);
            assert_eq!(a.material.moments, b.material.moments);
        }
    }
    assert!(w.field.source_load().iter().any(|&v| v > 0.));
    w.sources.clear();
    source_medium::project(&mut w);
    assert!(w.field.source_load().iter().all(|&v| v == 0.));
    assert!(w.field.source_signal().iter().all(|v| *v == [0.; 2]));
    assert!(w.field.source_load().iter().all(|v| *v == 0.));
}

#[test]
fn zero_release_retains_inventory_without_lifetime_expiry() {
    let mut c = config();
    c.source_drift = 0.;
    c.source_processing = 0.;
    c.source_lifetime = 1.;
    c.source_gap = 0.1;
    let mut w = World::new(27, c).unwrap();
    for source in &mut w.sources {
        source.rate = 0.;
    }
    let amounts: Vec<_> = w.sources.iter().map(|s| s.amount).collect();
    for _ in 0..40 {
        let mut reference = crate::boundary_tests::restored_state(&w);
        let resumed_tick = w.tick + 1;
        w.step();
        reference.step();
        source_medium::project(&mut reference);
        assert_eq!(w.field.source_signal(), reference.field.source_signal());
        assert_eq!(w.field.source_load(), reference.field.source_load());
        crate::boundary_tests::usable_continuation(&w, resumed_tick);
        crate::boundary_tests::usable_continuation(&reference, resumed_tick);
    }
    assert_eq!(w.ledger.supplied, 0.);
    assert_eq!(
        amounts,
        w.sources.iter().map(|s| s.amount).collect::<Vec<_>>()
    );
}

#[test]
fn reservoirs_project_bounded_interfaces_without_self_propulsion_or_material_grants() {
    let mut c = config();
    c.source_count = 1;
    c.source_priming = 0.;
    c.founders = 0;
    let mut w = World::new(27, c).unwrap();
    for (x, y) in [(0.1, 23.7), (10.3, 11.9)] {
        w.sources[0].habitat.x = x;
        w.sources[0].habitat.y = y;
        w.sources[0].rebuild(&w.config, &w.field);
        let before = w.held();
        source_medium::project(&mut w);
        let r = source_medium::response(&w.sources[0], 0, &w.config, &w.field, &w.chemistry);
        assert!(r.velocity.iter().all(|v| v.abs() < 1e-13));
        assert_eq!(before, w.held());
        assert!(w.field.source_load().iter().any(|v| *v > 0.));
    }
    w.sources[0].amount *= 1e12;
    source_medium::project(&mut w);
    assert!(
        w.field
            .source_load()
            .iter()
            .all(|v| v.is_finite() && *v < 24.)
    );
}

#[test]
fn common_conversion_preserves_inventory_and_field_agreement_without_cascades() {
    let c = config();
    let chem = Chemistry::new(101).unwrap();
    let operators = crate::weathering::Operators::new(&chem);
    for signal in [[0., 0.], [1., -2.], [-2., 1.]] {
        let signal = crate::weathering::signal(signal);
        let mut climate = crate::climate::Climate::new(&c, &chem);
        climate.prepare(&c);
        let mut row = [0.; 256];
        row[0] = 4.;
        let mut stored = [0.; 256];
        stored[0] = 4.;
        let exposure = crate::weathering::exposure(1., 0., true, c.diffusion_impedance);
        // Pass the unbounded signal to the field adapter; reservoir uses the shared reduction.
        let raw_scale = 1. / (1. - signal[0].abs() - signal[1].abs());
        climate.convert(&mut row, 1, (signal.map(|v| v * raw_scale), 0.), 0.8);
        let floor = crate::field_activity::CONCENTRATION_FLOOR as f64 * c.mesh.powi(2);
        let account = operators
            .inventory_active(
                &mut stored,
                signal,
                c.weathering_rate * 0.8 * exposure,
                floor,
                1,
            )
            .0;
        for (a, b) in row.into_iter().zip(stored) {
            let rounded = b as f32;
            let expected = if (rounded as f64) < floor {
                0.
            } else {
                rounded
            };
            assert!((a - expected).abs() < 5e-7);
        }
        assert!((stored.iter().sum::<f64>() - 4.).abs() < 1e-12);
        assert!(stored.iter().all(|v| *v >= 0.));
        assert_eq!(stored[17], 0.); // Two-bit products cannot cascade in one update.
        assert!((account[1] - climate.heat).abs() < 1e-12);
    }
}

#[test]
fn stored_inventory_changes_without_release_and_source_responses_are_frozen() {
    let mut c = config();
    c.source_priming = 0.;
    c.founders = 0;
    let chemistry = Chemistry::new(c.chemistry_seed).unwrap();
    let op = crate::weathering::Operators::new(&chemistry);
    let species = (0..256)
        .find(|&s| {
            let signal = crate::weathering::signal(chemistry.properties[s].interaction);
            (0..crate::weathering::BRANCHES)
                .any(|j| op.heat[j][s] > 0. && op.local(s, j, signal).0 > 0.)
        })
        .unwrap();
    c.source_species = vec![species];
    let mut w = World::new(27, c).unwrap();
    for source in &mut w.sources {
        source.rate = 0.;
    }
    let mut reversed = World::restore(&w.snapshot().unwrap()).unwrap();
    reversed.sources.reverse();
    let before = w.sources[0].mixture.clone();
    source_medium::advance(&mut w);
    source_medium::advance(&mut reversed);
    assert_eq!(w.ledger.source_released, 0.);
    assert!(w.ledger.source_converted > 0.);
    assert_ne!(before, w.sources[0].mixture);
    for (a, b) in w.sources.iter().zip(reversed.sources.iter().rev()) {
        assert!((a.habitat.x - b.habitat.x).abs() < 1e-12);
        assert!((a.habitat.y - b.habitat.y).abs() < 1e-12);
        for (x, y) in a.inventory().zip(b.inventory()) {
            assert!((x - y).abs() < 1e-12);
        }
    }
}

#[test]
fn local_source_footprints_match_full_periodic_reference_without_duplicate_nodes() {
    let c = config();
    let field = Field::new(c.width, c.height, c.mesh);
    for radius in [0.1, 1., 3., 9., 30., 1e100] {
        for (x, y) in [(0.1, 23.9), (12., 12.), (23.8, 0.2)] {
            let s = Source::new(
                Habitat {
                    x,
                    y,
                    radius,
                    richness: 1.,
                    share: 0.5,
                },
                0,
                &c,
                &mut Random::new(27),
                &field,
            );
            let mut actual = vec![0.; field.nx * field.ny];
            for &(n, weight) in &s.footprint {
                assert_eq!(actual[n], 0., "duplicate periodic node");
                actual[n] = weight;
            }
            let radius = radius.max(c.mesh * 0.25);
            let mut expected = vec![0.; actual.len()];
            // Independent dense convolution: blend four normalized, grid-centered kernels.
            for (anchor, share) in field.stencil(x, y) {
                let center = [
                    (anchor % field.nx) as f64 * c.mesh + c.mesh / 2.,
                    (anchor / field.nx) as f64 * c.mesh + c.mesh / 2.,
                ];
                let row: Vec<_> = (0..actual.len())
                    .map(|n| {
                        let p = [
                            (n % field.nx) as f64 * c.mesh + c.mesh / 2.,
                            (n / field.nx) as f64 * c.mesh + c.mesh / 2.,
                        ];
                        let scaled = distance_squared(p, center, &c) / radius.powi(2);
                        if scaled <= 9. {
                            (-scaled / 2.).exp()
                        } else {
                            0.
                        }
                    })
                    .collect();
                let sum: f64 = row.iter().sum();
                for (value, weight) in expected.iter_mut().zip(row) {
                    *value += share * weight / sum;
                }
            }
            for (a, b) in actual.into_iter().zip(expected) {
                assert!((a - b).abs() < 1e-14);
            }
        }
    }
}

#[test]
fn source_response_uses_medium_and_processing_accounts_for_uphill_products() {
    let c = config();
    let chem = Chemistry::new(101).unwrap();
    let mut field = Field::new(24., 24., 2.);
    let source = Source::new(
        Habitat {
            x: 12.,
            y: 12.,
            radius: 2.,
            richness: 1.,
            share: 1.,
        },
        0,
        &c,
        &mut Random::new(27),
        &field,
    );
    let empty = source_medium::response(&source, 0, &c, &field, &chem);
    assert_eq!(empty.velocity, [0.; 2]);
    assert_eq!(empty.signal, [0.; 2]);
    for n in 0..field.nx * field.ny {
        field.add(n, 15, 1. + (n % field.nx) as f64 * 0.2, &chem);
    }
    let medium = source_medium::response(&source, 0, &c, &field, &chem);
    assert!(medium.velocity[0].abs() > 1e-6);
    assert!(medium.velocity[0].hypot(medium.velocity[1]) <= c.source_drift);
    assert_ne!(medium.signal, empty.signal);
    let mut converted = 0.;
    for s in 0..256 {
        let mut row = [0.; 256];
        row[s] = 2.;
        let accounts =
            crate::weathering::Operators::new(&chem).inventory(&mut row, medium.signal, 0.5);
        assert!((row.iter().sum::<f64>() - 2.).abs() < 1e-14);
        let energy: f64 = row
            .iter()
            .zip(&chem.properties)
            .map(|(q, p)| q * p.potential)
            .sum();
        assert!(
            (2. * chem.properties[s].potential + accounts[2] - accounts[1] - energy).abs() < 1e-12
        );
        for (target, amount) in row.into_iter().enumerate() {
            assert!(amount >= 0.);
            if amount > 0. {
                if target != s {
                    converted += amount;
                }
            }
        }
    }
    assert!(converted > 0.);
    let mut mirrored = Field::new(24., 24., 2.);
    for n in 0..field.nx * field.ny {
        mirrored.add(
            n,
            15,
            1. + (field.nx - 1 - n % field.nx) as f64 * 0.2,
            &chem,
        );
    }
    let reverse = source_medium::response(&source, 0, &c, &mirrored, &chem);
    assert!((reverse.velocity[0] + medium.velocity[0]).abs() < 1e-12);
    for n in 0..field.nx * field.ny {
        field.add(n, 15, 100., &chem);
    }
    let dense = source_medium::response(&source, 0, &c, &field, &chem);
    assert!(dense.velocity[0].abs() < medium.velocity[0].abs());
}

#[test]
fn moving_sources_rebuild_and_account_for_inventory_conversion_across_renewal() {
    let mut c = config();
    c.source_lifetime = 2.;
    c.source_gap = 1.;
    let chemistry = Chemistry::new(c.chemistry_seed).unwrap();
    let op = crate::weathering::Operators::new(&chemistry);
    let species = (0..256)
        .find(|&s| {
            let signal = crate::weathering::signal(chemistry.properties[s].interaction);
            (0..crate::weathering::BRANCHES)
                .any(|j| op.heat[j][s] > 0. && op.local(s, j, signal).0 > 0.)
        })
        .unwrap();
    c.source_species = vec![species];
    let mut w = World::new(27, c).unwrap();
    // Short-lived batches are tiny: provide an explicit finite medium for this conversion check.
    for n in 0..w.field.nx * w.field.ny {
        w.field
            .add(n, species, 4. * w.config.mesh.powi(2), &w.chemistry);
    }
    crate::diagnostics::initialize(&mut w);
    for _ in 0..40 {
        let mut restored = crate::boundary_tests::restored_state(&w);
        let resumed_tick = w.tick + 1;
        let before = w.snapshot().unwrap();
        source_medium::observe(&w);
        assert_eq!(before, w.snapshot().unwrap());
        w.step();
        restored.step();
        crate::boundary_tests::usable_continuation(&w, resumed_tick);
        crate::boundary_tests::usable_continuation(&restored, resumed_tick);
        let summary = crate::observation::summary(&w);
        assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-7);
        assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-7);
    }
    assert!(w.ledger.source_distance > 0.);
    assert!(w.ledger.source_converted > 0. && w.ledger.source_heat > 0.);
    assert!(w.ledger.supplied > 0.);
}
