//! One contribution lifecycle for both reservoirs and cellular bodies.
use crate::spatial_signal::Signal;
use std::collections::HashMap;
#[derive(Clone, Debug)]
struct Contribution {
    sites: Vec<(usize, f64)>,
    profile: [f64; 3],
}
#[derive(Clone, Debug, Default)]
pub struct Carriers {
    owners: HashMap<(u8, u64), Contribution>,
    geometry: crate::spatial::Geometry,
    references: [crate::spatial_regions::Regions<[u32; crate::spatial::SITES]>; 2],
}
impl Carriers {
    pub fn new(geometry: crate::spatial::Geometry) -> Self {
        Self {
            geometry,
            references: std::array::from_fn(|_| {
                crate::spatial_regions::Regions::new(geometry.count())
            }),
            ..Self::default()
        }
    }
    pub fn replace(
        &mut self,
        kind: u8,
        id: u64,
        sites: &[(usize, f64)],
        profile: [f64; 3],
        signal: &mut Signal,
        load: &mut [f64],
    ) {
        let key = (kind, id);
        if let Some(old) = self.owners.get_mut(&key)
            && old.sites == sites
        {
            let delta = std::array::from_fn(|k| profile[k] - old.profile[k]);
            project(sites, delta, signal, load);
            old.profile = profile;
            if profile == [0.; 3] {
                let old = self.owners.remove(&key).unwrap();
                self.membership(kind, &old.sites, false, signal, load);
            }
            return;
        }
        if let Some(old) = self.owners.remove(&key) {
            project(&old.sites, old.profile.map(|q| -q), signal, load);
            self.membership(kind, &old.sites, false, signal, load);
        }
        if profile == [0.; 3] {
            self.owners.remove(&key);
            return;
        }
        project(sites, profile, signal, load);
        self.membership(kind, sites, true, signal, load);
        self.owners.insert(
            key,
            Contribution {
                sites: sites.to_vec(),
                profile,
            },
        );
    }
    fn membership(
        &mut self,
        kind: u8,
        sites: &[(usize, f64)],
        add: bool,
        signal: &mut Signal,
        load: &mut [f64],
    ) {
        for &(n, weight) in sites {
            if weight == 0. {
                continue;
            }
            let (r, s) = self.geometry.address(n);
            let counts = self.references[kind as usize].own(r, || [0; crate::spatial::SITES]);
            if add {
                counts[s] += 1;
            } else {
                counts[s] -= 1;
            }
            if counts[s] == 0 {
                signal[n] = [0.; 2];
                load[n] = 0.;
            }
            if counts.iter().all(|&c| c == 0) {
                self.references[kind as usize].remove(r);
            }
        }
    }
    pub fn reset(&mut self, kind: u8, signal: &mut Signal, load: &mut [f64]) {
        self.owners.retain(|&(k, _), old| {
            if k == kind {
                project(&old.sites, old.profile.map(|q| -q), signal, load);
            }
            k != kind
        });
        signal.fill([0.; 2]);
        load.fill(0.);
        self.references[kind as usize].clear();
    }
}
fn project(sites: &[(usize, f64)], delta: [f64; 3], signal: &mut Signal, load: &mut [f64]) {
    if delta == [0.; 3] {
        return;
    }
    for &(n, weight) in sites {
        for k in 0..2 {
            if delta[k] != 0. {
                signal[n][k] += weight * delta[k];
            }
        }
        load[n] = (load[n] + weight * delta[2]).max(0.);
    }
}
