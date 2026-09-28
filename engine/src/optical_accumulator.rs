//! Interval deposits use direct regional addressing; held samples keep their save format.
use crate::{
    spatial::{Geometry, SITES},
    spatial_regions::Regions,
};

#[derive(Clone, Debug)]
struct Region {
    values: [f64; SITES],
    touched: u64,
}

#[derive(Clone, Debug, Default)]
pub(super) struct Accumulator {
    geometry: Geometry,
    regions: Regions<Region>,
}

impl Accumulator {
    pub fn reset(&mut self, geometry: Geometry) {
        if self.geometry != geometry {
            self.geometry = geometry;
            self.regions = Regions::new(geometry.count());
        }
        for entry in &mut self.regions.entries {
            entry.value.values.fill(0.);
            entry.value.touched = 0;
        }
    }
    pub fn add(&mut self, node: usize, amount: f64) {
        let (r, s) = self.geometry.address(node);
        let region = self.regions.own(r, || Region {
            values: [0.; SITES],
            touched: 0,
        });
        region.values[s] += amount;
        region.touched |= 1 << s;
    }
    pub fn plane(&mut self) -> super::Plane {
        self.regions.retain(|entry| entry.value.touched != 0);
        self.regions
            .entries
            .iter()
            .flat_map(|entry| {
                self.geometry.sites(entry.id).filter_map(|(s, n)| {
                    (entry.value.touched & (1 << s) != 0).then_some((n, entry.value.values[s]))
                })
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deposits_preserve_order_and_reclaim_departed_regions_on_partial_grids() {
        let mut accumulator = Accumulator::default();
        for geometry in [Geometry::new(17, 9), Geometry::new(3, 2)] {
            accumulator.reset(geometry);
            let last = geometry.nx * geometry.ny - 1;
            let mut expected = super::super::Plane::new();
            for (node, q) in [(last, 1.), (0, 2.), (last, 1e-10), (1, 0.)] {
                accumulator.add(node, q);
                *expected.entry(node).or_default() += q;
            }
            assert_eq!(accumulator.plane(), expected);
            accumulator.reset(geometry);
            accumulator.add(0, 0.25);
            assert_eq!(accumulator.plane(), [(0, 0.25)].into_iter().collect());
            assert_eq!(accumulator.regions.entries.len(), 1);
            accumulator.reset(geometry);
            assert!(accumulator.plane().is_empty());
            assert!(accumulator.regions.entries.is_empty());
        }
    }
}
