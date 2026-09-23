//! One contribution lifecycle for reservoirs and cellular bodies. Both kinds share one
//! region-major plane; owner changes become per-site deposits applied by one job per region.
use crate::spatial::{Geometry, SITES, Work};
use rayon::prelude::*;
use std::ops::Index;
#[cfg(test)]
use std::ops::IndexMut;

/// Carrier features of one site for bodies (kind 0) and reservoirs (kind 1).
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Site {
    pub signal: [[f64; 2]; 2],
    pub load: [f64; 2],
    /// Owners with nonzero weight here; the last one leaving clears rounding residue.
    count: [u32; 2],
}

/// One owner's contribution: weighted sites and its (signal, signal, load) profile.
pub type Contribution<'a> = (&'a [(usize, f64)], [f64; 3]);

/// Replacement of one owner's previous contribution by its current one.
#[derive(Clone, Copy, Debug)]
pub struct Change<'a> {
    pub kind: u8,
    pub old: Contribution<'a>,
    pub new: Contribution<'a>,
}

#[derive(Clone, Copy, Debug)]
struct Deposit {
    region: u32,
    site: u8,
    kind: u8,
    membership: i8,
    delta: [f64; 3],
}

#[derive(Clone, Debug, Default)]
pub struct Carriers {
    geometry: Geometry,
    sites: Vec<[Site; SITES]>,
    /// Regions whose carrier signal changed since attraction last read them.
    pub(crate) changed: Work,
    /// Set by resets and direct test writes; the next attraction update compares exactly.
    pub(crate) exact: bool,
    /// Current reservoir contributions by reservoir index.
    pub(crate) sources: Vec<Owned>,
}

/// A stored contribution: weighted sites and profile.
pub type Owned = (Vec<(usize, f64)>, [f64; 3]);

fn present((sites, profile): &Contribution<'_>) -> bool {
    !sites.is_empty() && *profile != [0.; 3]
}

/// Nonzero-weight sites in node order; sorted footprints are borrowed as they are.
fn by_node(sites: &[(usize, f64)]) -> std::borrow::Cow<'_, [(usize, f64)]> {
    if sites.is_sorted_by_key(|&(n, _)| n) && sites.iter().all(|&(_, w)| w != 0.) {
        return sites.into();
    }
    let mut kept: Vec<_> = sites.iter().copied().filter(|&(_, w)| w != 0.).collect();
    kept.sort_unstable_by_key(|&(n, _)| n);
    kept.into()
}

fn deposits(g: Geometry, change: &Change<'_>, out: &mut Vec<Deposit>) {
    let mut push = |n: usize, w: f64, profile: [f64; 3], membership: i8| {
        if w == 0. {
            return;
        }
        let (region, site) = g.address(n);
        out.push(Deposit {
            region: region as u32,
            site: site as u8,
            kind: change.kind,
            membership,
            delta: profile.map(|p| w * p),
        });
    };
    let (old, new) = (present(&change.old), present(&change.new));
    if old && new && change.old.0 == change.new.0 {
        if change.old.1 != change.new.1 {
            let delta = std::array::from_fn(|k| change.new.1[k] - change.old.1[k]);
            for &(n, w) in change.new.0 {
                push(n, w, delta, 0);
            }
        }
        return;
    }
    if old && new {
        // A moved owner keeps the nodes both footprints share: one net change there, and
        // owner counts change only where it leaves or arrives.
        let (before, after) = (by_node(change.old.0), by_node(change.new.0));
        let (p, q) = (change.old.1, change.new.1);
        let (mut i, mut j) = (0, 0);
        while i < before.len() || j < after.len() {
            let next_old = before.get(i).map_or(usize::MAX, |e| e.0);
            let next_new = after.get(j).map_or(usize::MAX, |e| e.0);
            if next_old == next_new {
                let (w, v) = (before[i].1, after[j].1);
                let net = std::array::from_fn(|k| v * q[k] - w * p[k]);
                push(next_new, 1., net, 0);
                (i, j) = (i + 1, j + 1);
            } else if next_old < next_new {
                push(next_old, before[i].1, p.map(|x| -x), -1);
                i += 1;
            } else {
                push(next_new, after[j].1, q, 1);
                j += 1;
            }
        }
        return;
    }
    if old {
        for &(n, w) in change.old.0 {
            push(n, w, change.old.1.map(|p| -p), -1);
        }
    }
    if new {
        for &(n, w) in change.new.0 {
            push(n, w, change.new.1, 1);
        }
    }
}

impl Carriers {
    pub fn new(geometry: Geometry) -> Self {
        let mut carriers = Self {
            geometry,
            sites: vec![[Site::default(); SITES]; geometry.count()],
            ..Self::default()
        };
        carriers.changed.reset(geometry.count());
        carriers.exact = true;
        carriers
    }
    pub fn site(&self, n: usize) -> &Site {
        let (r, s) = self.geometry.address(n);
        &self.sites[r][s]
    }
    pub fn region(&self, r: usize) -> &[Site; SITES] {
        &self.sites[r]
    }
    /// Applies owner changes. Deposits keep owner order within each site, so results do not
    /// depend on the number of workers.
    pub fn apply(&mut self, changes: &[Change<'_>]) {
        let g = self.geometry;
        let expand = |change: &Change<'_>| {
            let mut out = Vec::with_capacity(change.old.0.len() + change.new.0.len());
            deposits(g, change, &mut out);
            out
        };
        let cost = crate::parallel::cost::CARRIER_OWNER;
        let all: Vec<Deposit> = match crate::parallel::grain(changes.len(), cost) {
            Some(grain) => changes
                .par_iter()
                .with_min_len(grain)
                .flat_map_iter(expand)
                .collect(),
            None => changes.iter().flat_map(expand).collect(),
        };
        if all.is_empty() {
            return;
        }
        // Packed (region, position) keys sort cheaply and keep owner order within each site.
        let mut keys: Vec<u64> = all
            .par_iter()
            .enumerate()
            .map(|(k, d)| (d.region as u64) << 32 | k as u64)
            .collect();
        match crate::parallel::grain(keys.len(), crate::parallel::cost::CARRIER_DEPOSIT) {
            Some(_) => keys.par_sort_unstable(),
            None => keys.sort_unstable(),
        }
        let region_of = |k: usize| (keys[k] >> 32) as usize;
        let starts: Vec<usize> = (0..keys.len())
            .into_par_iter()
            .filter(|&k| k == 0 || region_of(k - 1) != region_of(k))
            .collect();
        let regions: Vec<usize> = starts.iter().map(|&k| region_of(k)).collect();
        let mut touched = crate::spatial::select_mut(&mut self.sites, &regions);
        let job = |(g, (r, sites)): (usize, &mut (usize, &mut [Site; SITES]))| {
            let sites: &mut [Site; SITES] = sites;
            let end = starts.get(g + 1).copied().unwrap_or(keys.len());
            let mut changed = false;
            for &key in &keys[starts[g]..end] {
                let d = &all[(key & u32::MAX as u64) as usize];
                let site = &mut sites[d.site as usize];
                let k = d.kind as usize;
                let before = site.signal[k];
                for axis in 0..2 {
                    if d.delta[axis] != 0. {
                        site.signal[k][axis] += d.delta[axis];
                    }
                }
                site.load[k] = (site.load[k] + d.delta[2]).max(0.);
                if d.membership != 0 {
                    site.count[k] = site.count[k].wrapping_add_signed(d.membership as i32);
                    if d.membership < 0 && site.count[k] == 0 {
                        site.signal[k] = [0.; 2];
                        site.load[k] = 0.;
                    }
                }
                changed |= site.signal[k] != before;
            }
            changed.then_some(*r)
        };
        let per_region = crate::parallel::cost::CARRIER_DEPOSIT * all.len().div_ceil(regions.len());
        let changed: Vec<usize> = match crate::parallel::grain(regions.len(), per_region) {
            Some(grain) => touched
                .par_iter_mut()
                .enumerate()
                .with_min_len(grain)
                .filter_map(job)
                .collect(),
            None => touched.iter_mut().enumerate().filter_map(job).collect(),
        };
        for r in changed {
            self.changed.insert(r);
        }
    }
    /// Removes every contribution of one kind; owners reset their own records.
    pub fn reset(&mut self, kind: u8) {
        let k = kind as usize;
        for (r, region) in self.sites.iter_mut().enumerate() {
            for site in region.iter_mut() {
                site.signal[k] = [0.; 2];
                site.load[k] = 0.;
                site.count[k] = 0;
            }
            self.changed.insert(r);
        }
        if kind == 1 {
            self.sources.clear();
        }
        self.exact = true;
    }
    pub(crate) fn signal(&self, kind: u8) -> SignalView<'_> {
        SignalView(self, kind as usize)
    }
    pub(crate) fn load(&self, kind: u8) -> LoadView<'_> {
        LoadView(self, kind as usize)
    }
    fn nodes(&self) -> usize {
        self.geometry.nx * self.geometry.ny
    }
}

/// Read-only node-indexed view of one kind's carrier signal.
#[derive(Clone, Copy)]
pub struct SignalView<'a>(&'a Carriers, usize);
impl<'a> SignalView<'a> {
    pub fn len(&self) -> usize {
        self.0.nodes()
    }
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
    pub fn iter(self) -> impl Iterator<Item = &'a [f64; 2]> {
        (0..self.len()).map(move |n| &self.0.site(n).signal[self.1])
    }
}
impl Index<usize> for SignalView<'_> {
    type Output = [f64; 2];
    fn index(&self, n: usize) -> &[f64; 2] {
        &self.0.site(n).signal[self.1]
    }
}
impl PartialEq for SignalView<'_> {
    fn eq(&self, other: &Self) -> bool {
        self.iter().eq(other.iter())
    }
}
impl std::fmt::Debug for SignalView<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("SignalView")
    }
}

/// Read-only node-indexed view of one kind's carrier load.
#[derive(Clone, Copy)]
pub struct LoadView<'a>(&'a Carriers, usize);
impl<'a> LoadView<'a> {
    pub fn len(&self) -> usize {
        self.0.nodes()
    }
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
    pub fn iter(self) -> impl Iterator<Item = &'a f64> {
        (0..self.len()).map(move |n| &self.0.site(n).load[self.1])
    }
}
impl Index<usize> for LoadView<'_> {
    type Output = f64;
    fn index(&self, n: usize) -> &f64 {
        &self.0.site(n).load[self.1]
    }
}
impl<'a> IntoIterator for LoadView<'a> {
    type Item = &'a f64;
    type IntoIter = Box<dyn Iterator<Item = &'a f64> + 'a>;
    fn into_iter(self) -> Self::IntoIter {
        Box::new(self.iter())
    }
}
impl PartialEq for LoadView<'_> {
    fn eq(&self, other: &Self) -> bool {
        self.iter().eq(other.iter())
    }
}
impl std::fmt::Debug for LoadView<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("LoadView")
    }
}

#[cfg(test)]
impl Carriers {
    /// Direct fixture access; every written region is reported to attraction.
    fn slot(&mut self, n: usize) -> &mut Site {
        let (r, s) = self.geometry.address(n);
        self.changed.insert(r);
        &mut self.sites[r][s]
    }
}

/// Direct signal edits for constructed fixtures.
#[cfg(test)]
pub struct TrackedSignal<'a>(pub(crate) &'a mut Carriers, pub(crate) usize);
#[cfg(test)]
impl TrackedSignal<'_> {
    pub fn fill(&mut self, value: [f64; 2]) {
        for n in 0..self.0.nodes() {
            self[n] = value;
        }
        self.0.exact = true;
    }
}
#[cfg(test)]
impl Index<usize> for TrackedSignal<'_> {
    type Output = [f64; 2];
    fn index(&self, n: usize) -> &[f64; 2] {
        &self.0.site(n).signal[self.1]
    }
}
#[cfg(test)]
impl IndexMut<usize> for TrackedSignal<'_> {
    fn index_mut(&mut self, n: usize) -> &mut [f64; 2] {
        let k = self.1;
        &mut self.0.slot(n).signal[k]
    }
}

/// Direct load edits for constructed fixtures.
#[cfg(test)]
pub struct TrackedLoad<'a>(pub(crate) &'a mut Carriers, pub(crate) usize);
#[cfg(test)]
impl TrackedLoad<'_> {
    pub fn fill(&mut self, value: f64) {
        for n in 0..self.0.nodes() {
            self[n] = value;
        }
    }
}
#[cfg(test)]
impl Index<usize> for TrackedLoad<'_> {
    type Output = f64;
    fn index(&self, n: usize) -> &f64 {
        &self.0.site(n).load[self.1]
    }
}
#[cfg(test)]
impl IndexMut<usize> for TrackedLoad<'_> {
    fn index_mut(&mut self, n: usize) -> &mut f64 {
        let k = self.1;
        &mut self.0.slot(n).load[k]
    }
}
