//! Boot-only sampling of integrated fractal density, independent of source attributes.
use crate::{
    config::Config, random::Random, sources::Habitat, terrain::noise::channel,
    terrain_config::Placement,
};

#[path = "terrain_envelopes.rs"]
mod envelopes;
pub use envelopes::centers as resource_centers;

/// Reconstructible boot intensity for placement and local map review; never retained by physics.
pub fn density(seed: u64, c: &Config) -> Vec<f64> {
    if c.terrain.placement == Placement::Uniform {
        return vec![1.; (c.width / c.mesh) as usize * (c.height / c.mesh) as usize];
    }
    envelopes::density(seed, c)
}

pub fn landscape(seed: u64, c: &Config, current: &mut Random) -> (Vec<[f64; 2]>, Vec<Habitat>) {
    if c.terrain.placement == Placement::Current {
        let (centers, mut sites) = crate::sources::landscape(c, current);
        attributes(seed, c, &mut sites);
        return (centers, sites);
    }
    let nx = (c.width / c.mesh) as usize;
    let density = density(seed, c);
    let zones = c.source_zones.as_ref().map_or(1, Vec::len);
    // Intersect mesh cells with exact zone boundaries: zones need not align with the mesh.
    let tables: Vec<_> = (0..zones)
        .map(|zone| {
            let left = zone as f64 * c.width / zones as f64;
            let right = (zone + 1) as f64 * c.width / zones as f64;
            let mut sum = 0.;
            density
                .iter()
                .enumerate()
                .filter_map(|(n, &weight)| {
                    let x = (n % nx) as f64 * c.mesh;
                    let lo = x.max(left);
                    let hi = (x + c.mesh).min(right);
                    if hi <= lo {
                        return None;
                    }
                    sum += weight * (hi - lo) * c.mesh;
                    Some((sum, lo, hi, (n / nx) as f64 * c.mesh))
                })
                .collect::<Vec<_>>()
        })
        .collect();
    let mut positions = Random::new(channel(seed, "resource-positions"));
    let mut sites: Vec<_> = (0..c.source_count)
        .map(|i| {
            let table = &tables[i % zones];
            let draw = positions.unit() * table.last().unwrap().0;
            let j = table
                .partition_point(|row| row.0 <= draw)
                .min(table.len() - 1);
            let (_, lo, hi, y) = table[j];
            Habitat {
                x: lo + (hi - lo) * positions.unit(),
                y: y + c.mesh * positions.unit(),
                radius: 0.,
                richness: 0.,
                share: 0.,
            }
        })
        .collect();
    attributes(seed, c, &mut sites);
    (vec![], sites)
}

fn attributes(seed: u64, c: &Config, sites: &mut [Habitat]) {
    let mut rng = Random::new(channel(seed, "resource-attributes"));
    for h in sites {
        h.radius = c.source_radius * (0.6 + rng.unit());
        h.richness = 0.3 + 2. * rng.unit().powi(2);
        h.share = 0.55 + 0.1 * rng.unit();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn density_placement_preserves_counts_zones_attributes_and_independent_streams() {
        let mut c = Config {
            width: 40.,
            height: 32.,
            source_count: 120,
            terrain: crate::terrain_config::TerrainConfig::integrated(),
            ..Config::default()
        };
        c.source_zones = Some(vec![vec![0.5, 0.5]; 3]);
        let a = landscape(27, &c, &mut Random::new(1)).1;
        c.terrain.seasons = false;
        c.terrain.feature_wavelength = 12.;
        c.shade_strength = 0.;
        let b = landscape(27, &c, &mut Random::new(999)).1;
        assert_eq!(a.len(), 120);
        for (i, (a, b)) in a.iter().zip(&b).enumerate() {
            assert_eq!(a.x, b.x);
            assert_eq!(a.y, b.y);
            assert_eq!(a.richness, b.richness);
            assert_eq!((a.x / c.width * 3.) as usize, i % 3);
        }
        c.terrain.placement = Placement::Uniform;
        let u = landscape(27, &c, &mut Random::new(1)).1;
        for (a, b) in a.iter().zip(&u) {
            assert_eq!(a.richness, b.richness);
            assert_eq!(a.radius, b.radius);
        }
        assert!(a.iter().zip(u).any(|(a, b)| a.x != b.x || a.y != b.y));
        c.terrain.placement = Placement::Current;
        let legacy = landscape(27, &c, &mut Random::new(1)).1;
        for (a, b) in a.iter().zip(legacy) {
            assert_eq!(a.richness, b.richness);
            assert_eq!(a.radius, b.radius);
            assert_eq!(a.share, b.share);
        }
    }

    #[test]
    fn resource_spacing_and_spread_change_placement_without_changing_attributes() {
        let mut c = Config {
            width: 80.,
            height: 64.,
            source_count: 32,
            landscape_region_spacing: 32.,
            terrain: crate::terrain_config::TerrainConfig::integrated(),
            ..Config::default()
        };
        let a = landscape(27, &c, &mut Random::new(1)).1;
        c.landscape_spread /= 2.;
        c.landscape_region_spacing *= 2.;
        let b = landscape(27, &c, &mut Random::new(1)).1;
        assert!(a.iter().zip(&b).any(|(a, b)| a.x != b.x || a.y != b.y));
        for (a, b) in a.iter().zip(&b) {
            assert_eq!(
                [a.radius, a.richness, a.share],
                [b.radius, b.richness, b.share]
            );
        }
    }
}
