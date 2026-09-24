use crate::{config::Config, reservoir_coupling, source_medium, world::World};

fn world(positions: &[[f64; 2]], mixtures: &[&[(usize, f64)]], c: Config) -> World {
    let mut w = World::new(
        27,
        Config {
            founders: 0,
            source_count: positions.len(),
            source_priming: 0.,
            source_processing: 0.,
            ..c
        },
    )
    .unwrap();
    for (i, s) in w.sources.iter_mut().enumerate() {
        [s.habitat.x, s.habitat.y] = positions[i];
        s.habitat.radius = 3.;
        s.rebuild(&w.config, &w.field);
        s.mixture.fill(0.);
        for &(k, q) in mixtures[i % mixtures.len()] {
            s.mixture[k] = q;
        }
        s.rate = 0.;
        s.amount = s.interface;
    }
    source_medium::project(&mut w);
    w
}
const MATCHED: &[(usize, f64)] = &[(0, 0.6), (136, 0.4)];
const OPPOSITE: &[(usize, f64)] = &[(255, 1.)];
fn config() -> Config {
    Config {
        width: 160.,
        height: 160.,
        ..Config::default()
    }
}

#[test]
fn like_charges_repel_opposite_charges_attract_reciprocally_within_finite_range() {
    for (mixtures, sign) in [([MATCHED, MATCHED], -1.), ([MATCHED, OPPOSITE], 1.)] {
        let w = world(&[[60., 80.], [90., 80.]], &mixtures, config());
        let k = reservoir_coupling::prepare(&w.sources, &w.config, &w.chemistry);
        // Positive x on the left owner points toward the right one.
        assert_eq!(k[0].force[0].signum(), sign, "{k:?}");
        assert!(k[0].force[1].abs() < 1e-15 && k[0].shift == [0.; 2]);
        let ratio = k[0].force[0] / k[1].force[0];
        assert!(ratio < 0., "equal and opposite directions: {k:?}");
    }
    // Beyond three ranges there is no coupling at all.
    let short = Config {
        reservoir_range: 10.,
        ..config()
    };
    let far = world(&[[0., 80.], [65., 80.]], &[MATCHED], short);
    let k = reservoir_coupling::prepare(&far.sources, &far.config, &far.chemistry);
    assert!(k.iter().all(|c| *c == Default::default()), "{k:?}");
}

#[test]
fn empty_reservoirs_keep_their_charge_and_exclude_overlap() {
    let mut w = world(&[[78., 80.], [82., 80.]], &[MATCHED], config());
    let full = reservoir_coupling::prepare(&w.sources, &w.config, &w.chemistry);
    w.sources[1].amount = 0.;
    w.sources[1].refresh_material(&w.chemistry);
    let k = reservoir_coupling::prepare(&w.sources, &w.config, &w.chemistry);
    // Charge follows composition and interface, so emptying one deposit changes nothing.
    assert_eq!(k, full);
    assert!(
        k[0].force[0] < 0. && k[1].force[0] > 0.,
        "like charges repel: {k:?}"
    );
    // Overlap of 2 units: each owner separates at the shared contact rate.
    let rate = crate::movement::geometry::separation_rate(w.config.dt);
    assert!((k[0].shift[0] + 2. * rate).abs() < 1e-12, "{k:?}");
    assert!((k[1].shift[0] - 2. * rate).abs() < 1e-12, "{k:?}");
}

#[test]
fn coupling_is_invariant_across_the_periodic_seam() {
    let inside = world(&[[60., 80.], [84., 80.]], &[MATCHED], config());
    let seam = world(&[[148., 80.], [12., 80.]], &[MATCHED], config());
    let a = reservoir_coupling::prepare(&inside.sources, &inside.config, &inside.chemistry);
    let b = reservoir_coupling::prepare(&seam.sources, &seam.config, &seam.chemistry);
    for (x, y) in a.iter().zip(&b) {
        assert!((x.force[0] - y.force[0]).abs() < 1e-12, "{a:?} {b:?}");
    }
}

#[test]
fn reservoirs_ignore_crowding_pressure() {
    let w = world(&[[74., 80.], [86., 80.]], &[MATCHED], config());
    let base = source_medium::response(&w.sources[0], 0, &w.config, &w.field, &w.chemistry);
    let mut c = w.config.clone();
    c.pressure_strength *= 1000.;
    let crowded = source_medium::response(&w.sources[0], 0, &c, &w.field, &w.chemistry);
    assert_eq!(base.velocity, crowded.velocity);
}

#[test]
fn matched_pair_holds_near_its_cohesion_spacing() {
    let mut w = world(
        &[[74., 80.], [86., 80.]],
        &[MATCHED],
        Config {
            source_drift: 4.,
            ..config()
        },
    );
    for _ in 0..400 {
        source_medium::advance(&mut w);
    }
    let a = [w.sources[0].habitat.x, w.sources[0].habitat.y];
    let b = [w.sources[1].habitat.x, w.sources[1].habitat.y];
    let d = crate::movement::distance(a, b, &w.config);
    // Local like repulsion balances ℓ-range cohesion near 12 units; long-range charge
    // repulsion does not separate a pair.
    assert!((10.5..13.5).contains(&d), "d={d}");
}
