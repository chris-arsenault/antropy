use crate::{config::Config, movement, random::Random, sources};

#[test]
fn radial_tail_keeps_dense_centers_and_outliers_in_the_periodic_world() {
    let c = Config {
        source_count: 2000,
        landscape_regions: 1,
        ..Config::default()
    };
    let (centers, sites) = sources::landscape(&c, &mut Random::new(27));
    let mut inner = 0;
    let mut outer = 0;
    for site in &sites {
        assert!((0. ..c.width).contains(&site.x));
        assert!((0. ..c.height).contains(&site.y));
        let d = movement::distance(centers[0], [site.x, site.y], &c);
        inner += usize::from(d <= c.landscape_spread);
        outer += usize::from(d > 3. * c.landscape_spread);
        assert!((0.6 * c.source_radius..1.6 * c.source_radius).contains(&site.radius));
    }
    assert!((850..1150).contains(&inner));
    assert!((100..300).contains(&outer));
}

#[test]
fn changing_spread_changes_only_positions_not_supply_or_random_draw_count() {
    let mut c = Config::default();
    let mut a_rng = Random::new(27);
    let (_, a) = sources::landscape(&c, &mut a_rng);
    c.landscape_spread *= 3.;
    let mut b_rng = Random::new(27);
    let (_, b) = sources::landscape(&c, &mut b_rng);
    assert_eq!(a_rng.0, b_rng.0);
    for (a, b) in a.iter().zip(b) {
        assert_eq!(
            [a.radius, a.richness, a.share],
            [b.radius, b.richness, b.share]
        );
    }
}
