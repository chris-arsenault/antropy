//! Persistent regional material. Each occupied site owns its chemical row, group mask and
//! feature projection; every commit keeps all three consistent. Missing regions read as zero.
use crate::chemical_projection::Rows;
use crate::field_activity::{GroupLanes, pairs};
use crate::spatial::{Geometry, SIDE, SITES};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::ops::{Index, IndexMut, Range};
const WIDTH: usize = 256;
static ZERO: [f32; WIDTH] = [0.; WIDTH];

/// Unscaled per-site sums of material, potential, impedance, stress and two signal axes.
pub type Projection = [f64; 6];

#[derive(Clone, Debug, PartialEq)]
pub(crate) struct Region {
    pub id: usize,
    pub values: Vec<f32>,
    pub masks: [u64; SITES],
    pub projection: [Projection; SITES],
}
impl Region {
    fn new(id: usize) -> Self {
        Self {
            id,
            values: vec![0.; SITES * WIDTH],
            masks: [0; SITES],
            projection: [[0.; 6]; SITES],
        }
    }
    pub fn row(&self, site: usize) -> &[f32] {
        &self.values[site * WIDTH..(site + 1) * WIDTH]
    }
    pub fn row_mut(&mut self, site: usize) -> &mut [f32] {
        &mut self.values[site * WIDTH..(site + 1) * WIDTH]
    }
    /// Clears only previously written chemical groups.
    pub fn clear(&mut self) {
        for site in 0..SITES {
            for s in GroupLanes::<1>::new(self.masks[site]) {
                self.values[site * WIDTH + s] = 0.;
            }
            self.masks[site] = 0;
            self.projection[site] = [0.; 6];
        }
    }
    fn is_empty(&self) -> bool {
        self.masks.iter().all(|&m| m == 0)
    }
    /// Rounded commit of requested groups. Returns the actual feature change, rounding loss
    /// and whether the site's signal projection changed. Requested groups are cleared.
    pub fn commit(
        &mut self,
        site: usize,
        requested: &mut [f64],
        mask: u64,
        rows: &Rows,
    ) -> (Projection, [f64; 2], bool) {
        let row = &mut self.values[site * WIDTH..(site + 1) * WIDTH];
        if !changes(row, requested, mask) {
            return ([0.; 6], discard(requested, mask, rows), false);
        }
        let (reduction, loss) = crate::chemical_projection::commit(row, requested, rows, mask);
        let mut occupied = self.masks[site] & !mask;
        for s in pairs(mask) {
            if row[s..s + 2].iter().any(|q| *q > 0.) {
                occupied |= 1 << (s / 4);
            }
        }
        self.masks[site] = occupied;
        let before = self.projection[site];
        // A projection is a function of its row alone, so restored worlds read identical
        // features; the incremental change still feeds the running totals.
        self.projection[site] = if occupied == 0 {
            [0.; 6]
        } else {
            crate::chemical_projection::project_active(row, rows, occupied)
        };
        let after = self.projection[site];
        (reduction, loss, before[4..] != after[4..])
    }
}

fn changes(row: &[f32], requested: &[f64], mask: u64) -> bool {
    GroupLanes::<1>::new(mask).any(|s| (row[s] as f64 + requested[s]).max(0.) as f32 != row[s])
}

fn discard(requested: &mut [f64], mask: u64, rows: &Rows) -> [f64; 2] {
    let mut loss = [0.; 2];
    for s in GroupLanes::<1>::new(mask) {
        loss[0] += requested[s];
        loss[1] += requested[s] * rows.potential(s);
        requested[s] = 0.;
    }
    loss
}

/// Totals of one committed batch; `changed` lists regions whose signal projection moved.
#[derive(Debug, Default)]
pub(crate) struct Batch {
    pub reduction: Projection,
    pub loss: [f64; 2],
    pub changed: Vec<usize>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(try_from = "Stored", into = "Stored")]
pub struct Material {
    count: usize,
    geometry: Geometry,
    pub(crate) regions: crate::spatial_regions::Regions<Region>,
    allocations: u64,
    /// Emptied regions keep their allocation for the next occupied region.
    spare: Vec<Region>,
    /// Reused destination set; clearing touches only regions it listed.
    wanted: crate::spatial::Work,
}
#[derive(Serialize, Deserialize)]
struct Stored {
    count: usize,
    nodes: Vec<usize>,
    values: Vec<f32>,
}
impl From<Material> for Stored {
    fn from(m: Material) -> Self {
        let mut s = Self {
            count: m.count,
            nodes: Vec::new(),
            values: Vec::new(),
        };
        let mut nodes = m.nodes();
        nodes.sort_unstable();
        for n in nodes {
            let row = m.row(n);
            if crate::field_activity::mask(row) != 0 {
                s.nodes.push(n);
                s.values.extend_from_slice(row);
            }
        }
        s
    }
}
impl TryFrom<Stored> for Material {
    type Error = String;
    fn try_from(s: Stored) -> Result<Self, String> {
        if s.count > crate::memory_budget::MAX_FIELD_NODES
            || s.values.len() != s.nodes.len() * WIDTH
        {
            return Err("Invalid sparse material dimensions".into());
        }
        if s.values.iter().any(|v| !v.is_finite() || *v < 0.) {
            return Err("Invalid sparse material value".into());
        }
        let mut m = Self::new(s.count);
        let mut seen = std::collections::HashSet::new();
        for (&n, row) in s.nodes.iter().zip(s.values.chunks_exact(WIDTH)) {
            if n >= s.count || !seen.insert(n) {
                return Err("Invalid sparse material owner".into());
            }
            m.row_mut(n).copy_from_slice(row);
        }
        m.reclaim();
        Ok(m)
    }
}
impl Default for Material {
    fn default() -> Self {
        Self::new(0)
    }
}
impl PartialEq for Material {
    fn eq(&self, other: &Self) -> bool {
        self.len() == other.len()
            && self.rows().all(|(n, r)| r == other.row(n))
            && other.rows().all(|(n, r)| r == self.row(n))
    }
}
impl Material {
    pub fn new(count: usize) -> Self {
        // A compact temporary layout for the logical checkpoint rows. World rebuild assigns
        // actual XY geometry; a one-row layout would waste seven eighths of every region.
        let mut material = Self::with_geometry(Geometry::new(SIDE, count.div_ceil(SIDE)));
        material.count = count;
        material
    }
    pub(crate) fn with_geometry(geometry: Geometry) -> Self {
        Self {
            count: geometry.nx * geometry.ny,
            geometry,
            regions: crate::spatial_regions::Regions::new(geometry.count()),
            allocations: 0,
            spare: Vec::new(),
            wanted: Default::default(),
        }
    }
    pub(crate) fn reshape(&mut self, geometry: Geometry) {
        if self.geometry == geometry {
            return;
        }
        let mut replacement = Self::with_geometry(geometry);
        for (n, row) in self.rows() {
            replacement.row_mut(n).copy_from_slice(row);
        }
        replacement.reclaim();
        *self = replacement;
    }
    pub fn len(&self) -> usize {
        self.count * WIDTH
    }
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
    pub fn nodes(&self) -> Vec<usize> {
        self.rows().map(|(n, _)| n).collect()
    }
    pub fn allocated_bytes(&self) -> usize {
        let region = |r: &Region| r.values.capacity() * 4 + std::mem::size_of::<Region>();
        self.regions.index_bytes()
            + self
                .regions
                .entries
                .iter()
                .map(|r| region(&r.value))
                .sum::<usize>()
            + self.spare.iter().map(region).sum::<usize>()
    }
    pub(crate) fn allocations(&self) -> u64 {
        self.allocations
    }
    pub(crate) fn geometry(&self) -> Geometry {
        self.geometry
    }
    pub fn row(&self, node: usize) -> &[f32] {
        let (r, s) = self.geometry.address(node);
        self.regions.get(r).map_or(&ZERO, |v| v.row(s))
    }
    /// Row, occupied groups and feature projection from one regional lookup.
    pub fn site(&self, node: usize) -> (&[f32], u64, Projection) {
        let (r, s) = self.geometry.address(node);
        self.regions.get(r).map_or((&ZERO, 0, [0.; 6]), |v| {
            (v.row(s), v.masks[s], v.projection[s])
        })
    }
    pub fn mask(&self, node: usize) -> u64 {
        let (r, s) = self.geometry.address(node);
        self.regions.get(r).map_or(0, |v| v.masks[s])
    }
    pub fn projection(&self, node: usize) -> Projection {
        let (r, s) = self.geometry.address(node);
        self.regions.get(r).map_or([0.; 6], |v| v.projection[s])
    }
    fn own(&mut self, region: usize) -> &mut Region {
        if self.regions.get(region).is_none() {
            let value = match self.spare.pop() {
                Some(mut spare) => {
                    spare.id = region;
                    spare
                }
                None => {
                    self.allocations += 1;
                    Region::new(region)
                }
            };
            self.regions.own(region, || value);
        }
        self.regions.get_mut(region).unwrap()
    }
    /// Explicit cold writes; the owner must `refresh` before physical readers see them.
    pub(crate) fn row_mut(&mut self, node: usize) -> &mut [f32] {
        let (r, s) = self.geometry.address(node);
        let region = self.own(r);
        region.masks[s] = u64::MAX;
        region.row_mut(s)
    }
    /// One rounded commit; a write that changes no stored value never allocates.
    pub(crate) fn commit(
        &mut self,
        node: usize,
        requested: &mut [f64],
        mask: u64,
        rows: &Rows,
    ) -> (Projection, [f64; 2], bool) {
        let (r, s) = self.geometry.address(node);
        if mask == 0 {
            return ([0.; 6], [0.; 2], false);
        }
        if self.regions.get(r).is_none() && !changes(&ZERO, requested, mask) {
            return ([0.; 6], discard(requested, mask, rows), false);
        }
        let result = self.own(r).commit(s, requested, mask, rows);
        if self.regions.get(r).unwrap().is_empty() {
            self.release(r);
        }
        result
    }
    /// Commits many rows with one job per owning region. `fill(i, row)` writes entry i's
    /// requested groups into a zeroed row; entries of one node keep their order.
    pub(crate) fn commit_batch(
        &mut self,
        entries: &[(usize, u64)],
        fill: impl Fn(usize, &mut [f64]) + Sync,
        rows: &Rows,
    ) -> Batch {
        let mut batch = Batch::default();
        let geometry = self.geometry;
        let region_of =
            |&(node, mask): &(usize, u64)| (mask != 0).then(|| geometry.address(node).0);
        // Writes into unallocated regions are rare: allocate only for real changes, in order.
        let missing: Vec<usize> = entries
            .par_iter()
            .enumerate()
            .filter_map(|(i, e)| {
                region_of(e)
                    .filter(|&r| self.regions.get(r).is_none())
                    .map(|_| i)
            })
            .collect();
        let mut discarded = Vec::new();
        let mut requested = [0.; WIDTH];
        for i in missing {
            let (node, mask) = entries[i];
            let r = geometry.address(node).0;
            if self.regions.get(r).is_some() {
                continue;
            }
            fill(i, &mut requested);
            if changes(&ZERO, &requested, mask) {
                for s in pairs(mask) {
                    requested[s..s + 2].fill(0.);
                }
                self.own(r);
            } else {
                let loss = discard(&mut requested, mask, rows);
                batch.loss[0] += loss[0];
                batch.loss[1] += loss[1];
                discarded.push(i);
            }
        }
        let regions = &self.regions;
        let mut order: Vec<(usize, usize)> = entries
            .par_iter()
            .enumerate()
            .filter_map(|(i, e)| {
                let r = region_of(e)?;
                regions.get(r)?;
                discarded
                    .binary_search(&i)
                    .is_err()
                    .then(|| (regions.slot(r), i))
            })
            .collect();
        order.par_sort_unstable();
        let mut groups = vec![(0_u32, 0_u32); self.regions.entries.len()];
        let mut start = 0;
        while start < order.len() {
            let slot = order[start].0;
            let end = start + order[start..].partition_point(|&(s, _)| s == slot);
            groups[slot] = (start as u32, end as u32);
            start = end;
        }
        let job = |(slot, entry): (usize, &mut crate::spatial_regions::Entry<Region>)| {
            let (start, end) = groups[slot];
            let mut result = (Batch::default(), false);
            if start == end {
                return result;
            }
            let mut requested = [0.; WIDTH];
            for &(_, i) in &order[start as usize..end as usize] {
                let (node, mask) = entries[i];
                fill(i, &mut requested);
                let site = geometry.address(node).1;
                let (reduction, loss, changed) =
                    entry.value.commit(site, &mut requested, mask, rows);
                add(&mut result.0.reduction, reduction);
                result.0.loss[0] += loss[0];
                result.0.loss[1] += loss[1];
                result.1 |= changed;
            }
            if result.1 {
                result.0.changed.push(entry.id);
            }
            result
        };
        let merge = |mut a: Batch, (b, _): (Batch, bool)| {
            add(&mut a.reduction, b.reduction);
            a.loss[0] += b.loss[0];
            a.loss[1] += b.loss[1];
            a.changed.extend(b.changed);
            a
        };
        // Region cost is its share of the batch; tasks group regions to one grain of rows.
        let regions = self.regions.entries.len().max(1);
        let cost = crate::parallel::cost::COMMIT_ROW * order.len().div_ceil(regions);
        let committed = if let Some(grain) = crate::parallel::grain(regions, cost) {
            self.regions
                .entries
                .par_iter_mut()
                .enumerate()
                .with_min_len(grain)
                .map(job)
                .fold(Batch::default, merge)
                .reduce(Batch::default, |a, b| merge(a, (b, false)))
        } else {
            self.regions
                .entries
                .iter_mut()
                .enumerate()
                .map(job)
                .fold(Batch::default(), merge)
        };
        let emptied: Vec<_> = groups
            .iter()
            .zip(&self.regions.entries)
            .filter(|((start, end), entry)| start != end && entry.value.is_empty())
            .map(|(_, entry)| entry.id)
            .collect();
        for r in emptied {
            self.release(r);
        }
        merge(batch, (committed, false))
    }
    fn release(&mut self, region: usize) {
        if let Some(mut value) = self.regions.take(region) {
            value.clear();
            self.spare.push(value);
        }
    }
    pub fn rows(&self) -> impl Iterator<Item = (usize, &[f32])> {
        self.regions
            .entries
            .iter()
            .map(|r| &r.value)
            .flat_map(move |r| {
                self.geometry
                    .sites(r.id)
                    .filter(move |&(s, _)| r.masks[s] != 0)
                    .map(move |(s, n)| (n, r.row(s)))
            })
    }
    /// Occupied sites with their groups and projections.
    pub(crate) fn occupied(&self) -> impl Iterator<Item = (usize, u64, Projection)> + '_ {
        self.regions.entries.iter().flat_map(move |r| {
            let r = &r.value;
            self.geometry
                .sites(r.id)
                .filter(move |&(s, _)| r.masks[s] != 0)
                .map(move |(s, n)| (n, r.masks[s], r.projection[s]))
        })
    }
    pub fn iter(&self) -> impl Iterator<Item = &f32> {
        self.rows().flat_map(|(_, r)| r.iter())
    }
    pub fn chunks_exact(&self, width: usize) -> impl Iterator<Item = &[f32]> {
        assert_eq!(width, WIDTH);
        self.rows().map(|(_, row)| row)
    }
    pub(crate) fn clear(&mut self) {
        let ids: Vec<_> = self.regions.entries.iter().map(|e| e.id).collect();
        for r in ids {
            self.release(r);
        }
    }
    /// Destination storage for one transport pass: every occupied region and its four
    /// neighboring regions. Others return to the spare pool; retained regions are cleared.
    pub(crate) fn prepare_destinations(&mut self, current: &Material) {
        let g = self.geometry;
        let columns = g.columns();
        let lines = g.count() / columns.max(1);
        let mut wanted = std::mem::take(&mut self.wanted);
        wanted.reset(g.count());
        for entry in &current.regions.entries {
            let r = entry.id;
            let (x, y) = (r % columns, r / columns);
            wanted.insert(r);
            wanted.insert(y * columns + (x + 1) % columns);
            wanted.insert(y * columns + (x + columns - 1) % columns);
            wanted.insert((y + 1) % lines * columns + x);
            wanted.insert((y + lines - 1) % lines * columns + x);
        }
        let unwanted: Vec<_> = self
            .regions
            .entries
            .iter()
            .map(|e| e.id)
            .filter(|&r| !wanted.contains(r))
            .collect();
        for r in unwanted {
            self.release(r);
        }
        // Retained destinations are cleared by their own region job (`Region::clear`).
        for &r in &wanted.regions {
            self.own(r);
        }
        self.wanted = wanted;
    }
    /// Moves regions with no occupied site to the spare pool.
    pub(crate) fn prune(&mut self) {
        let empty: Vec<_> = self
            .regions
            .entries
            .iter()
            .filter(|e| e.value.is_empty())
            .map(|e| e.id)
            .collect();
        for r in empty {
            self.release(r);
        }
    }
    /// Recomputes masks only; cold writers call `refresh` for projections.
    pub(crate) fn reclaim(&mut self) {
        for entry in &mut self.regions.entries {
            let r = &mut entry.value;
            for s in 0..SITES {
                r.masks[s] = crate::field_activity::mask(r.row(s));
            }
        }
        self.prune();
    }
    /// Cold boundary: recompute every mask and projection; returns their sum.
    pub(crate) fn refresh(&mut self, rows: &Rows) -> Projection {
        self.reclaim();
        let mut total = [0.; 6];
        for entry in &mut self.regions.entries {
            let r = &mut entry.value;
            for s in 0..SITES {
                r.projection[s] = if r.masks[s] == 0 {
                    [0.; 6]
                } else {
                    crate::chemical_projection::project_active(r.row(s), rows, r.masks[s])
                };
                add(&mut total, r.projection[s]);
            }
        }
        total
    }
}
pub(crate) fn add(a: &mut Projection, b: Projection) {
    for (x, y) in a.iter_mut().zip(b) {
        *x += y;
    }
}
impl Index<usize> for Material {
    type Output = f32;
    fn index(&self, i: usize) -> &f32 {
        &self.row(i / WIDTH)[i % WIDTH]
    }
}
impl IndexMut<usize> for Material {
    fn index_mut(&mut self, i: usize) -> &mut f32 {
        &mut self.row_mut(i / WIDTH)[i % WIDTH]
    }
}
impl Index<Range<usize>> for Material {
    type Output = [f32];
    fn index(&self, r: Range<usize>) -> &[f32] {
        let s = r.start % WIDTH;
        &self.row(r.start / WIDTH)[s..s + r.len()]
    }
}
impl IndexMut<Range<usize>> for Material {
    fn index_mut(&mut self, r: Range<usize>) -> &mut [f32] {
        let s = r.start % WIDTH;
        &mut self.row_mut(r.start / WIDTH)[s..s + r.len()]
    }
}
