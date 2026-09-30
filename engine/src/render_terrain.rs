//! Bounded, immutable display projection; never sampled by physics.
use crate::{terrain::Shade, world::World};
use std::sync::{
    Arc,
    atomic::{AtomicU32, Ordering},
};

#[derive(Default)]
pub struct Terrain {
    owner: Option<Arc<Shade>>,
    pub values: Vec<f32>,
    pub nx: u32,
    pub ny: u32,
    pub revision: u32,
}
impl Terrain {
    pub fn prepare(&mut self, w: &World) {
        if self
            .owner
            .as_ref()
            .is_some_and(|s| Arc::ptr_eq(s, &w.shade))
        {
            return;
        }
        static NEXT: AtomicU32 = AtomicU32::new(1);
        self.nx = w.field.nx.min(256) as u32;
        self.ny = w.field.ny.min(256) as u32;
        self.values.clear();
        let g = &w.shade.geography;
        for y in 0..self.ny {
            for x in 0..self.nx {
                let p = [
                    (x as f64 + 0.5) * w.config.width / self.nx as f64,
                    (y as f64 + 0.5) * w.config.height / self.ny as f64,
                ];
                let [h, q, ..] = g.sample(p);
                self.values.extend([
                    if g.config.elevation { h as f32 } else { 0. },
                    if g.config.movement || g.config.transport || g.config.processing {
                        q as f32
                    } else {
                        1.
                    },
                    0.,
                    0.,
                ]);
            }
        }
        self.owner = Some(w.shade.clone());
        self.revision = NEXT.fetch_add(1, Ordering::Relaxed);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn source_seasons_follow_position_and_time_independently_of_stock() {
        let mut w = World::new(
            27,
            crate::config::Config {
                width: 24.,
                height: 24.,
                founders: 2,
                source_count: 2,
                ..crate::config::Config::ecology()
            },
        )
        .unwrap();
        w.sources[0].amount = 0.;
        let mut b = crate::render::Buffers::default();
        let mut phases = Vec::new();
        for tick in [
            0,
            (w.config.terrain.season_period / w.config.dt / 4.) as u64,
        ] {
            w.tick = tick;
            b.prepare(&w, 5, 0, 3, true, 0).unwrap();
            phases.push(b.markers[3]);
            for (source, marker) in w.sources.iter().zip(b.markers.chunks_exact(12)) {
                assert_eq!(
                    marker[3],
                    w.shade.geography.season(
                        [source.habitat.x, source.habitat.y],
                        tick as f64 * w.config.dt
                    ) as f32
                );
                assert_eq!(marker[7], if source.amount > 0. { 1. } else { 0. });
                assert_eq!(marker[11], 1.);
            }
        }
        assert_ne!(phases[0], phases[1]);
    }

    #[test]
    fn terrain_is_bounded_cached_and_replaced_with_the_world() {
        let mut w = World::new(27, crate::config::Config::ecology()).unwrap();
        let before = w.snapshot().unwrap();
        let mut t = Terrain::default();
        t.prepare(&w);
        assert!(t.values.len() <= 256 * 256 * 4);
        let revision = t.revision;
        let pointer = t.values.as_ptr();
        let g = &w.shade.geography;
        let p = [
            w.config.width / t.nx as f64 / 2.,
            w.config.height / t.ny as f64 / 2.,
        ];
        let [h, q, ..] = g.sample(p);
        assert_eq!(&t.values[..2], &[h as f32, q as f32]);
        t.prepare(&w);
        assert_eq!(revision, t.revision);
        assert_eq!(pointer, t.values.as_ptr());
        assert_eq!(before, w.snapshot().unwrap());
        w = World::restore(&before).unwrap();
        t.prepare(&w);
        assert_ne!(revision, t.revision);
    }
}
