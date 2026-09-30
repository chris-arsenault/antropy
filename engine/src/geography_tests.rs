use crate::{config::Config, terrain::Shade, terrain_config::TerrainConfig, world::World};

fn config() -> Config {
    Config {
        width: 32.,
        height: 24.,
        founders: 0,
        source_count: 0,
        terrain: TerrainConfig::integrated(),
        ..Config::default()
    }
}

#[test]
fn geographic_maps_are_bounded_periodic_and_restore_cached_faces() {
    let c = config();
    let w = World::new(27, c.clone()).unwrap();
    let g = &w.shade.geography;
    g.validate(&c).unwrap();
    for p in [[0., 0.], [31.8, 12.2], [-2.3, 25.]] {
        let a = g.sample(p);
        let b = g.sample([p[0] + c.width, p[1] - c.height]);
        for i in 0..4 {
            assert!((a[i] - b[i]).abs() < 1e-12);
        }
        assert!((0.25..=1.).contains(&a[1]));
        assert!((0. ..=2.).contains(&g.season(p, 137.)));
        assert!(
            (g.supply_time(p, 0., c.terrain.season_period) - c.terrain.season_period).abs() < 1e-9
        );
    }
    let restored = World::restore(&w.snapshot().unwrap()).unwrap();
    assert_eq!(g.height, restored.shade.geography.height);
    assert_eq!(g.faces, restored.shade.geography.faces);
    assert_eq!(g.sampling, restored.shade.geography.sampling);
    assert_eq!(
        g.resource_regions,
        restored.shade.geography.resource_regions
    );
    assert_eq!(g.generator_version, 2);
}

#[test]
fn spatial_controls_preserve_local_scale_when_area_grows() {
    let mut c = Config::ecology();
    assert_eq!(c.landscape_region_count(), 35);
    c.width *= 2.;
    c.height *= 2.;
    assert_eq!(c.landscape_region_count(), 140);
    assert_eq!(c.landscape_spread, 18.);
    assert_eq!(c.terrain.feature_wavelength, 36.);
    c.landscape_region_spacing = 0.;
    assert!(c.validate().is_err());
    c.landscape_region_spacing = 1.;
    assert!(c.validate().is_err());
    c.landscape_region_spacing = f64::NAN;
    assert!(c.validate().is_err());
}

#[test]
fn slope_is_directional_and_height_offset_cannot_supply_energy() {
    let c = config();
    let mut shade = Shade::generate(27, &c, 16, 12).as_ref().clone();
    let g = &mut shade.geography;
    for n in 0..g.height.len() {
        g.height[n] = (n % g.nx) as f64 * c.mesh;
    }
    g.conductance.fill(0.5);
    let up = g.movement([5., 5.], [1., 0.]);
    let down = g.movement([5., 5.], [-1., 0.]);
    assert!((up - 0.25).abs() < 1e-12);
    assert!((down - 0.5).abs() < 1e-12);
    for h in &mut g.height {
        *h += 100.;
    }
    assert!((g.movement([5., 5.], [1., 0.]) - up).abs() < 1e-12);
}

#[test]
fn neutral_switches_and_invalid_configs_are_explicit() {
    let mut c = config();
    c.terrain = TerrainConfig::default();
    let s = Shade::generate(27, &c, 16, 12);
    assert_eq!(s.geography.movement([1., 2.], [3., 4.]), 1.);
    assert_eq!(s.geography.supply_time([1., 2.], 17., 0.2), 0.2);
    c.terrain.minimum_conductance = 0.;
    assert!(c.validate().is_err());
    c.terrain = TerrainConfig::integrated();
    c.terrain.season_period = f64::NAN;
    assert!(c.validate().is_err());
}

#[test]
fn opposing_motion_uses_actual_path_and_resistance_survives_cancellation() {
    let c = config();
    let mut shade = Shade::generate(27, &c, 16, 12).as_ref().clone();
    let g = &mut shade.geography;
    g.height.fill(0.);
    g.conductance.fill(0.25);
    let (d, x) = g.combined_motion([5., 5.], [1., 0.], [-1., 0.]);
    assert_eq!(x, 0.5);
    assert_eq!(d, [0.25, 0.]);
    for n in 0..g.height.len() {
        g.height[n] = (n % g.nx) as f64 * c.mesh;
    }
    // The unscaled vector points downhill, but differing power/force responses
    // produce uphill travel. Evaluate the uphill path, not the cancelled proposal.
    let (d, x) = g.combined_motion([5., 5.], [1., 0.], [-1.5, 0.]);
    assert!(d[0] > 0.);
    assert!((x * x - 0.125).abs() < 1e-8);
    assert!((x * x - g.movement([5., 5.], d)).abs() < 1e-8);
    // Oblique motion must also solve the same law, not only a collinear special case.
    let (d, x) = g.combined_motion([5., 5.], [1., 0.3], [-1.5, 0.4]);
    assert!((x * x - g.movement([5., 5.], d)).abs() < 1e-8);
    assert!((d[1] - (0.3 * x + 0.4 * x * x)).abs() < 1e-12);
    // Opposite one-sided slope responses can balance at a stall.
    let (d, x) = g.combined_motion([5., 5.], [-1., 0.], [2.5, 0.]);
    assert!(d[0].hypot(d[1]) < 1e-8);
    assert!((x - 0.4).abs() < 1e-8);
}
