use crate::{
    chemistry::Chemistry, config::Config, field::Field, footprint, medium_response, movement,
    source_medium, world::World,
};

#[test]
fn pressure_reverses_attraction_with_load_and_commutes_with_spatial_frames() {
    let profile = [0.9, 0.2, 1.];
    let gradient = [[0.9, 0.2, 1.], [0., 0., 0.]];
    assert!(medium_response::force(profile, gradient, 0.1)[0] > 0.);
    assert!(medium_response::force(profile, gradient, 2.)[0] < 0.);
    assert_eq!(medium_response::force(profile, [[0.; 3]; 2], 100.), [0.; 2]);
    for load in [0., 0.1, 2., 100.] {
        let reference = movement::passive(profile, gradient, load, 0.7, 4.);
        for angle in [0_f64, 0.37, 1.8, 3.4] {
            for sign in [-1., 1.] {
                let direction = [angle.cos(), sign * angle.sin()];
                let rotated = direction.map(|d| gradient[0].map(|v| d * v));
                let velocity = movement::passive(profile, rotated, load, 0.7, 4.);
                for k in 0..2 {
                    assert!((velocity[k] - direction[k] * reference[0]).abs() < 1e-12);
                }
                assert!(velocity[0].hypot(velocity[1]) <= 2.8);
            }
        }
    }
}

#[test]
fn embodied_pressure_has_no_self_propulsion_at_off_grid_or_periodic_positions() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
    w.sources.clear();
    w.field = Field::new(w.config.width, w.config.height, w.config.mesh);
    w.cells.truncate(1);
    for [x, y] in [[0.1, 23.7], [10.3, 11.9]] {
        w.cells[0].x = x;
        w.cells[0].y = y;
        let sites = vec![footprint::sites(&w.cells[0], &w.config, &w.field)];
        footprint::deposit_profiles(&w.cells, &w.config, &mut w.field, &sites);
        let v = movement::passive(
            w.cells[0].operators.as_ref().unwrap().profile,
            w.field.gradient(&sites[0]),
            w.field.pressure_load(&sites[0]),
            1.,
            4.,
        );
        assert!(w.field.body_load.iter().any(|x| *x > 0.));
        assert!(v.iter().all(|x| x.abs() < 1e-12));
    }
}

#[test]
fn source_pairs_attract_when_dilute_and_separate_when_crowded() {
    for offset in [0., 12.] {
        for ratio in [0.01, 100.] {
            let c = Config {
                width: 24.,
                height: 24.,
                founders: 0,
                source_count: 2,
                source_species: vec![0, 136],
                source_priming: 0.,
                source_processing: 0.,
                source_lifetime: 1e9,
                attraction_length: 0., // Identity-kernel limit retains the earlier local law.
                ..Config::default()
            };
            let mut w = World::new(27, c).unwrap();
            for (i, source) in w.sources.iter_mut().enumerate() {
                source.habitat.x = (10. + 4. * i as f64 + offset) % 24.;
                source.habitat.y = 12.;
                source.habitat.radius = 2.;
                source.rebuild(&w.config, &w.field);
                source.inventory.fill(0.);
                source.inventory[0] = 0.6 * ratio * source.interface;
                source.inventory[136] = 0.4 * ratio * source.interface;
                source.rate = 0.;
            }
            source_medium::project(&mut w);
            let before = w.held();
            let responses: Vec<_> = w
                .sources
                .iter()
                .map(|s| source_medium::response(s, 0, &w.config, &w.field, &w.chemistry).velocity)
                .collect();
            assert!((responses[0][0] + responses[1][0]).abs() < 1e-12);
            assert_eq!(responses[0][0] > 0., ratio < 1.);
            for _ in 0..300 {
                source_medium::advance(&mut w);
                w.tick += 1;
            }
            let distance = movement::distance(
                [w.sources[0].habitat.x, w.sources[0].habitat.y],
                [w.sources[1].habitat.x, w.sources[1].habitat.y],
                &w.config,
            );
            println!("pair ratio={ratio} offset={offset}: 4 -> {distance}");
            assert_eq!(distance > 4., ratio > 1.);
            assert_eq!(before, w.held());
        }
    }
}

#[test]
fn self_load_uses_actual_interface_and_retains_foreign_background() {
    let mut w = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 1,
            source_priming: 0.,
            source_species: vec![0, 136],
            ..Config::default()
        },
    )
    .unwrap();
    w.cells[0].x = 0.3;
    w.cells[0].y = 23.7;
    let row = footprint::sites(&w.cells[0], &w.config, &w.field);
    footprint::deposit_profiles(&w.cells, &w.config, &mut w.field, &[row.clone()]);
    let own = medium_response::self_load(
        w.cells[0].mass() * w.cells[0].operators.as_ref().unwrap().profile[2],
        w.config.mesh.powi(2),
        &row,
    );
    let bodies: f64 = row.iter().map(|&(n, a)| a * w.field.body_load[n]).sum();
    assert!((own - bodies).abs() < 1e-12);
    source_medium::project(&mut w);
    let source = &w.sources[0];
    let projected = source.material.moments[2] / (1. + source.material.total / source.interface);
    let own = medium_response::self_load(projected, w.config.mesh.powi(2), &source.footprint);
    let deposited: f64 = source
        .footprint
        .iter()
        .map(|&(n, a)| a * w.field.source_load[n])
        .sum();
    assert!((own - deposited).abs() < 1e-12);
    for n in 0..w.field.nx * w.field.ny {
        w.field
            .add(n, 136, 0.02 * w.config.mesh.powi(2), &w.chemistry);
    }
    let expected = 0.02 * w.chemistry.properties[136].impedance;
    assert!(w.field.pressure_load(&row) - bodies >= expected - 1e-12);
}

#[test]
fn pressure_flux_preserves_material_and_commutes_with_chemical_relabeling_and_geography() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut field = Field::new(24., 24., 2.);
    for (n, s, q) in [(13, 5, 40.), (26, 80, 2.), (132, 0, 12.)] {
        field.add(n, s, q, &chemistry);
    }
    let initial = field.clone();
    let balance = field.advance(&chemistry, 0.8, 0., 1.);
    assert!(
        (initial.totals(&chemistry).0 - field.totals(&chemistry).0 - balance.roundoff_matter).abs()
            < 1e-12
    );
    assert!(field.amounts.iter().all(|x| *x >= 0. && x.is_finite()));
    for mode in 0..3 {
        let node = |n: usize| match mode {
            0 => (n % 12) * 12 + n / 12,
            1 => (n / 12) * 12 + 11 - n % 12,
            _ => ((n / 12 + 3) % 12) * 12 + (n % 12 + 4) % 12,
        };
        let species = |s: usize| 255 - s;
        let mut relabeled = chemistry.clone();
        for s in 0..256 {
            relabeled.properties[species(s)] = chemistry.properties[s].clone();
        }
        let mut other = Field::new(24., 24., 2.);
        for n in 0..144 {
            for s in 0..256 {
                other.add(
                    node(n),
                    species(s),
                    initial.amounts[n * 256 + s] as f64,
                    &relabeled,
                );
            }
        }
        other.advance(&relabeled, 0.8, 0., 1.);
        for n in 0..144 {
            for s in 0..256 {
                assert!(
                    (other.amounts[node(n) * 256 + species(s)] - field.amounts[n * 256 + s]).abs()
                        < 1e-5
                );
            }
        }
    }
}
