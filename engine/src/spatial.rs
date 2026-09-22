//! Periodic region geometry and deduplicated local work ownership.
pub const SIDE: usize = 8;
pub const SITES: usize = SIDE * SIDE;
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Geometry {
    pub nx: usize,
    pub ny: usize,
    columns: usize,
    /// ceil(2^64 / nx): node / nx is one high multiply for every node below 2^32.
    reciprocal: u64,
}
impl Geometry {
    pub fn new(nx: usize, ny: usize) -> Self {
        let reciprocal = if nx > 1 { u64::MAX / nx as u64 + 1 } else { 0 };
        Self {
            nx,
            ny,
            columns: nx.div_ceil(SIDE),
            reciprocal,
        }
    }
    pub fn columns(self) -> usize {
        self.columns
    }
    pub fn count(self) -> usize {
        self.columns * self.ny.div_ceil(SIDE)
    }
    #[inline]
    fn split(self, node: usize) -> (usize, usize) {
        if self.reciprocal == 0 {
            return (node % self.nx, node / self.nx);
        }
        debug_assert!(node < 1 << 32);
        let y = ((self.reciprocal as u128 * node as u128) >> 64) as usize;
        (node - y * self.nx, y)
    }
    #[inline]
    pub fn address(self, node: usize) -> (usize, usize) {
        let (x, y) = self.split(node);
        (
            y / SIDE * self.columns + x / SIDE,
            y % SIDE * SIDE + x % SIDE,
        )
    }
    pub fn node(self, region: usize, site: usize) -> Option<usize> {
        let x = region % self.columns() * SIDE + site % SIDE;
        let y = region / self.columns() * SIDE + site / SIDE;
        (x < self.nx && y < self.ny).then_some(y * self.nx + x)
    }
    pub fn offset(self, node: usize, dx: isize, dy: isize) -> usize {
        let x = (node as isize % self.nx as isize + dx).rem_euclid(self.nx as isize);
        let y = (node as isize / self.nx as isize + dy).rem_euclid(self.ny as isize);
        y as usize * self.nx + x as usize
    }
    pub fn sites(self, region: usize) -> impl Iterator<Item = (usize, usize)> {
        (0..SITES).filter_map(move |i| self.node(region, i).map(|n| (i, n)))
    }
}
#[derive(Clone, Debug, Default)]
pub struct Work {
    listed: Vec<bool>,
    pub regions: Vec<usize>,
}
impl Work {
    pub fn reset(&mut self, count: usize) {
        for r in self.regions.drain(..) {
            self.listed[r] = false;
        }
        self.listed.resize(count, false);
    }
    pub fn contains(&self, region: usize) -> bool {
        self.listed.get(region).copied().unwrap_or(false)
    }
    pub fn insert(&mut self, region: usize) {
        if !self.listed[region] {
            self.listed[region] = true;
            self.regions.push(region);
        }
    }
    pub fn halo(&mut self, g: Geometry, region: usize, radius: usize, axis: usize) {
        let limit = if axis == 0 { g.nx } else { g.ny };
        let origin = if axis == 0 {
            region % g.columns()
        } else {
            region / g.columns()
        } * SIDE;
        let mut left = ((limit - origin).min(SIDE) + 2 * radius).min(limit);
        let mut position = (origin as isize - radius as isize).rem_euclid(limit as isize) as usize;
        while left != 0 {
            let target = if axis == 0 {
                region / g.columns() * g.columns() + position / SIDE
            } else {
                position / SIDE * g.columns() + region % g.columns()
            };
            self.insert(target);
            let step = (SIDE - position % SIDE).min(limit - position).min(left);
            left -= step;
            position = (position + step) % limit;
        }
    }
}
