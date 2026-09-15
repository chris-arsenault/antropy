use antropy_engine::{config::Config, world::World};

#[test]
fn derived_field_cache_follows_mutations_and_rebuilds_canonically() {
    use antropy_engine::{field_reductions, spatial_numeric};
    let mut w = world();
    let properties = field_reductions::properties(&w.chemistry);
    let check = |w: &World| {
        let snapshot = postcard::to_stdvec(&w.field).unwrap();
        let cached = w.field.thermodynamics(&w.chemistry).to_vec();
        assert_eq!(
            snapshot,
            postcard::to_stdvec(&w.field).unwrap(),
            "cache observation changes durable state"
        );
        for (amounts, node) in w.field.amounts.chunks_exact(256).zip(&cached) {
            assert_eq!(*node, spatial_numeric::project(amounts, &properties, 4.));
        }
        let mut restored: antropy_engine::field::Field = postcard::from_bytes(&snapshot).unwrap();
        restored.rebuild();
        assert_eq!(cached, restored.thermodynamics(&w.chemistry).to_vec());
    };
    check(&w);
    w.field.add(3, 129, 0.013, &w.chemistry);
    check(&w);
    w.field.amounts[17] = 1e-24;
    w.field.refresh(&w.chemistry);
    check(&w);
    let mut step = antropy_engine::spatial_step::SpatialStep::new(&w.field, Default::default());
    step.refresh(&w.field, &w.cells, &w.genomes, &w.chemistry, &w.config);
    step.field(
        &mut w.field,
        &w.chemistry,
        &w.cells,
        &w.config,
        0.2,
        &mut Default::default(),
    )
    .unwrap();
    check(&w);
    w.field.validate_reductions(&w.chemistry).unwrap();
}

#[test]
fn fused_proposal_reductions_match_independent_exact_and_stored_states() {
    use antropy_engine::{field_reductions, spatial_numeric, spatial_rounding};
    let w = world();
    let p = field_reductions::properties(&w.chemistry);
    for scale in [0., 1e-46, 1e-40, 1e-24, 1., 1e6] {
        let values: [f64; 256] = std::array::from_fn(|s| scale * (s as f64 + 0.123456789));
        let (exact, stored, loss) = spatial_rounding::project(&values, &p, 4.);
        let amounts = values.map(|v| v as f32);
        assert_eq!(stored, spatial_numeric::project(&amounts, &p, 4.));
        for (a, b) in exact
            .into_iter()
            .zip(spatial_numeric::project(&values, &p, 4.))
        {
            assert!(
                (a - b).abs() <= 32. * f64::EPSILON * a.abs().max(b.abs()).max(f64::MIN_POSITIVE),
                "{a} vs {b}"
            );
        }
        let direct_loss: f64 = values.iter().zip(amounts).map(|(a, b)| a - b as f64).sum();
        assert!(
            (loss - direct_loss).abs() <= 32. * f64::EPSILON * values.iter().copied().sum::<f64>()
        );
    }
}

fn world() -> World {
    World::new(
        101,
        Config {
            width: 16.,
            height: 16.,
            founders: 1,
            source_count: 0,
            ..Config::default()
        },
    )
    .unwrap()
}

#[test]
fn actual_material_sets_disk_area_and_daughter_extent() {
    let w = world();
    let mut cell = w.cells[0].clone();
    let area = cell.mass() / w.config.body_density + cell.material() / w.config.inventory_density;
    let r = cell.radius(&w.config);
    assert!((std::f64::consts::PI * r * r - area).abs() < 1e-14);
    for b in &mut cell.body {
        *b *= 0.5;
    }
    cell.inventory.scale(0.5);
    assert!((cell.radius(&w.config) / r - 0.5_f64.sqrt()).abs() < 1e-14);
}

#[test]
fn internal_derivative_and_mixing_accounts_use_the_same_functional() {
    use antropy_engine::spatial_energy::{SpatialLedger, internal, internal_local_mu, mixture};
    let w = world();
    let mut cell = w.cells[0].clone();
    let s = w.config.source_species[0];
    let expected = internal_local_mu(&cell, s, &w.chemistry, &w.config, 0.4);
    let original = cell.inventory[s];
    let eps = 1e-6;
    cell.inventory.set(s, original + eps);
    let plus = internal(&cell, &w.chemistry, &w.config, 0.4).free;
    cell.inventory.set(s, original - eps);
    let minus = internal(&cell, &w.chemistry, &w.config, 0.4).free;
    assert!(((plus - minus) / (2. * eps) - expected).abs() < 2e-8);
    let before = mixture([(2., 3.), (0., 3.)].into_iter(), 1., 0.);
    let after = mixture([(1., 3.), (1., 3.)].into_iter(), 1., 0.);
    let mut book = SpatialLedger::default();
    book.closed(before, after);
    assert_eq!(book.bath.get(), 0.);
    assert!((book.dissipation.get() - 2. * 2_f64.ln()).abs() < 1e-14);
    assert!(
        mixture([(1e-24, 2.), (0., 2.)].into_iter(), 1., 0.4)
            .free
            .is_finite()
    );
}

#[test]
fn disk_weights_are_normalized_periodic_and_differentiable() {
    use antropy_engine::{disk, field::Field};
    let field = Field::new(16., 16., 2.);
    for (x, y, r) in [(0.1, 0.2, 0.4), (1., 1., 0.6), (3.1, 4.7, 2.2)] {
        let base = disk::weights(&field, x, y, r);
        assert!((base.iter().map(|w| w.value).sum::<f64>() - 1.).abs() < 1e-14);
        for k in 0..3 {
            assert!(
                base.iter()
                    .map(|w| [w.dx, w.dy, w.dr][k])
                    .sum::<f64>()
                    .abs()
                    < 1e-13
            );
            let eps = 1e-5;
            let mut p = [x, y, r];
            p[k] += eps;
            let plus = disk::weights(&field, p[0], p[1], p[2]);
            p[k] -= 2. * eps;
            let minus = disk::weights(&field, p[0], p[1], p[2]);
            for w in &base {
                let get = |v: &Vec<disk::Weight>| {
                    v.iter().find(|a| a.node == w.node).map_or(0., |a| a.value)
                };
                let derivative = (get(&plus) - get(&minus)) / (2. * eps);
                assert!(
                    (derivative - [w.dx, w.dy, w.dr][k]).abs() < 2e-8,
                    "disk derivative k={k}: {derivative} vs {:?}",
                    w
                );
            }
        }
        let shifted = disk::weights(&field, x + 16., y - 16., r);
        for w in &base {
            let other = shifted.iter().find(|v| v.node == w.node).unwrap();
            assert!((w.value - other.value).abs() < 1e-13);
        }
    }
}

#[test]
fn production_field_force_and_inventory_derivatives_match_full_energy() {
    use antropy_engine::{
        interaction::Interaction,
        spatial_energy::{SpatialLaw, internal_local_mu},
    };
    let mut w = world();
    w.cells[0].x = 5.3;
    w.cells[0].y = 5.7;
    let s = w.config.source_species[0];
    w.field.deposit(7., 6., s, 2., &w.chemistry);
    let mut physics = Interaction::new(&w.field, SpatialLaw::default());
    let evaluate = |p: &mut Interaction, w: &World| {
        p.prepare_bodies(&w.field, &w.cells, &w.genomes, &w.chemistry, &w.config);
        p.evaluate(&w.field.amounts, &w.chemistry, &w.cells, &w.config)
    };
    evaluate(&mut physics, &w);
    let (force, radial, sampled) = physics.response(0);
    let cell = &w.cells[0];
    let membrane = w.genomes[&cell.machinery_genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .chemistry
        .membrane
        .point();
    let exposure = 0.05 + 0.95 * antropy_engine::chemistry::affinity(membrane, s, 3.);
    let profile = w.chemistry.properties[s].interaction.map(|q| q * exposure);
    let mu = internal_local_mu(cell, s, &w.chemistry, &w.config, 0.4)
        + physics.law.metric(profile, sampled)
        + radial
            / (2. * std::f64::consts::PI * cell.radius(&w.config) * w.config.inventory_density);
    let (x, n) = (cell.x, cell.inventory[s]);
    for eps in [1e-4, 1e-5, 1e-6] {
        w.cells[0].x = x + eps;
        let plus = evaluate(&mut physics, &w).free;
        w.cells[0].x = x - eps;
        let minus = evaluate(&mut physics, &w).free;
        assert!(((minus - plus) / (2. * eps) - force[0]).abs() < 2e-8);
        w.cells[0].x = x;
        w.cells[0].inventory.set(s, n + eps);
        let plus = evaluate(&mut physics, &w).free;
        w.cells[0].inventory.set(s, n - eps);
        let minus = evaluate(&mut physics, &w).free;
        assert!(((plus - minus) / (2. * eps) - mu).abs() < 2e-8);
        w.cells[0].inventory.set(s, n);
    }
    w.field.amounts.fill(0.);
    evaluate(&mut physics, &w);
    let (force, radial, _) = physics.response(0);
    assert!(force[0].abs() + force[1].abs() + radial.abs() < 1e-13);
}

#[test]
fn fitted_flux_and_nonlinear_field_batches_conserve_and_pay_full_energy() {
    use antropy_engine::{
        spatial_energy::{SpatialLaw, SpatialLedger},
        spatial_step::{SpatialStep, face_flux},
    };
    for v in [-1000., -2., -1e-8, 0., 1e-8, 2., 1000.] {
        assert!(face_flux(1., 0., v, 0.2).is_finite());
        if v.abs() < 10. {
            assert!(face_flux(1., (-v).exp(), v, 1.).abs() < 1e-13);
        }
    }
    assert_eq!(face_flux(2., 1., 0., 0.25), 0.25);
    let mut w = world();
    w.cells.clear();
    w.field.deposit(5., 5., 0, 3., &w.chemistry);
    w.field.deposit(7., 5., 255, 4., &w.chemistry);
    let mut step = SpatialStep::new(&w.field, SpatialLaw::default());
    let start = step.refresh(&w.field, &w.cells, &w.genomes, &w.chemistry, &w.config);
    let mut ledger = SpatialLedger::default();
    for _ in 0..10 {
        let before = step.before;
        let dt = step
            .field(
                &mut w.field,
                &w.chemistry,
                &w.cells,
                &w.config,
                0.2,
                &mut ledger,
            )
            .unwrap();
        assert!(dt > 0. && dt <= 0.2);
        assert!(step.before.free <= before.free + 1e-5);
        assert!(w.field.amounts.iter().all(|q| *q >= 0.));
    }
    assert!(
        (start.material - step.before.material - ledger.numerical_material.get()).abs() < 1e-12
    );
    assert!(
        (start.physical - step.before.physical - ledger.bath.get() - ledger.numerical_energy.get())
            .abs()
            < 1e-12
    );
    assert!(
        (start.free - step.before.free - ledger.dissipation.get() - ledger.numerical_free.get())
            .abs()
            < 1e-12
    );
    let before = step.before;
    step.boundary(
        &mut w.field,
        &w.chemistry,
        &w.cells,
        &w.config,
        &[(1, 128, 0.2)],
        &mut ledger,
    )
    .unwrap();
    let snapshot = w.field.amounts.clone();
    assert!(
        step.boundary(
            &mut w.field,
            &w.chemistry,
            &w.cells,
            &w.config,
            &[(1, 128, -100.)],
            &mut ledger
        )
        .is_err()
    );
    assert_eq!(snapshot, w.field.amounts);
    step.washout(
        &mut w.field,
        &w.chemistry,
        &w.cells,
        &w.config,
        0.2,
        &mut ledger,
    );
    assert!(step.before.material > before.material);
    assert!(
        (step.before.physical
            - start.physical
            - ledger.carried_energy.get()
            - ledger.boundary_work.get()
            + ledger.bath.get()
            + ledger.numerical_energy.get())
        .abs()
            < 1e-11
    );
}

#[test]
fn vector_math_matches_independent_transcendentals_across_supported_scales() {
    use antropy_engine::{spatial_numeric::log_positive, spatial_step::bernoulli};
    for exponent in [-1070, -1022, -100, -24, -1, 0, 1, 24, 100, 1000] {
        for i in 1..100 {
            let scale = if exponent < -1022 {
                f64::from_bits(1_u64 << (exponent + 1074))
            } else {
                f64::from_bits(((exponent + 1023) as u64) << 52)
            };
            let x = (1. + i as f64 / 100.) * scale;
            assert!(
                (log_positive(x) - x.ln()).abs() <= 4. * f64::EPSILON * (1. + x.ln().abs()),
                "x={x:e} exponent={exponent} calculated={} reference={}",
                log_positive(x),
                x.ln()
            );
        }
    }
    for i in -1000..=1000 {
        let v = i as f64 / 1000.;
        let exact = if v == 0. { 1. } else { v / v.exp_m1() };
        assert!((bernoulli(v) - exact).abs() < 8. * f64::EPSILON);
    }
}

#[test]
fn periodic_kernel_normalization_finite_reach_and_pair_reciprocity() {
    use antropy_engine::{interaction::Interaction, spatial_energy::SpatialLaw};
    let mut w = World::new(
        101,
        Config {
            width: 32.,
            height: 32.,
            founders: 2,
            source_count: 0,
            ..Config::default()
        },
    )
    .unwrap();
    w.cells[0].x = 5.2;
    w.cells[0].y = 5.4;
    w.cells[1].x = 7.4;
    w.cells[1].y = 5.8;
    let mut p = Interaction::new(&w.field, SpatialLaw::default());
    let refresh = |p: &mut Interaction, w: &World| {
        p.prepare_bodies(&w.field, &w.cells, &w.genomes, &w.chemistry, &w.config);
        p.evaluate(&w.field.amounts, &w.chemistry, &w.cells, &w.config)
    };
    let eps = 1e-5;
    let mut derivatives = [0.; 2];
    for i in 0..2 {
        w.cells[i].x += eps;
        refresh(&mut p, &w);
        let plus = p.response(1 - i).0[0];
        w.cells[i].x -= 2. * eps;
        refresh(&mut p, &w);
        let minus = p.response(1 - i).0[0];
        w.cells[i].x += eps;
        derivatives[i] = (plus - minus) / (2. * eps);
    }
    assert!((derivatives[0] - derivatives[1]).abs() < 2e-8);
    w.cells[1].x = 17.2;
    refresh(&mut p, &w);
    assert!(p.response(0).0.into_iter().all(|v| v.abs() < 1e-13));
    assert!(p.response(1).0.into_iter().all(|v| v.abs() < 1e-13));
    w.cells.clear();
    // A range wider than half a tiny periodic world must sum overlapping images.
    let field = antropy_engine::field::Field::new(8., 8., 2.);
    let mut p = Interaction::new(
        &field,
        SpatialLaw {
            range: 7.,
            ..SpatialLaw::default()
        },
    );
    let mut amounts = vec![0_f64; field.amounts.len()];
    for n in amounts.chunks_exact_mut(256) {
        n[0] = 4.;
    }
    p.evaluate(&amounts, &w.chemistry, &[], &w.config);
    for potential in &p.potential {
        for (actual, expected) in potential.iter().zip(w.chemistry.properties[0].interaction) {
            assert!((actual - expected).abs() < 1e-13);
        }
    }
}
