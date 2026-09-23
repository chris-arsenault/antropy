//! Geographic material owner. Shared features drive bounded conservative redistribution.
use crate::chemistry::{Chemistry, SPECIES};
#[path = "attraction.rs"]
pub(crate) mod attraction;
#[path = "field_carriers.rs"]
mod carriers;
#[path = "field_exchange.rs"]
mod exchange;
#[path = "field_medium.rs"]
pub(crate) mod medium;
#[path = "field_parallel.rs"]
mod parallel;
#[path = "field_read.rs"]
mod read;
#[path = "field_stored.rs"]
mod stored;

/// Material and its per-site features are owned by `amounts`; impedance, stress and signal
/// are read from each site's projection rather than kept as separate geographic arrays.
#[derive(Clone, Debug)]
pub struct Field {
    pub nx: usize,
    pub ny: usize,
    pub spacing: f64,
    amounts: crate::spatial_material::Material,
    totals: [f64; 2],
    pub drift: f64,
    pub pressure_strength: f64,
    pub attraction_length: f64,
    pub(crate) attraction: crate::attraction::Attraction,
    pub illumination: crate::illumination::Illumination,
    next: crate::spatial_material::Material,
    pub(crate) neighbors: Vec<[usize; 4]>,
    /// Body (kind 0) and reservoir (kind 1) signal and load in one region-major plane.
    pub(crate) carriers: crate::spatial_carriers::Carriers,
    /// Regions whose material signal projection changed since attraction last read them.
    signal_changes: crate::spatial::Work,
    /// Set by cold replacement; the next attraction update compares exactly.
    material_exact: bool,
    rows: Option<std::sync::Arc<crate::chemical_projection::Rows>>,
    last_groups: usize,
    pub(crate) mechanical_frozen: bool,
    pub profile: bool,
    pub profile_ms: [f64; 2],
}

#[derive(Clone, Copy, Debug, Default)]
pub struct FieldBalance {
    pub matter: f64,
    pub energy: f64,
    pub roundoff_matter: f64,
    pub roundoff_energy: f64,
    pub weathering_heat: f64,
    pub weathering_work: f64,
    pub weathered_material: f64,
    pub sheltered_conversion: f64,
}

pub fn mobility(load: f64, scale: f64) -> f64 {
    1. / (1. + scale * load)
}

impl Field {
    pub fn new(width: f64, height: f64, spacing: f64) -> Self {
        let nx = (width / spacing) as usize;
        let ny = (height / spacing) as usize;
        Self::from_material(
            nx,
            ny,
            spacing,
            crate::spatial_material::Material::new(nx * ny),
            [0.; 2],
            0.25,
        )
    }
    fn from_material(
        nx: usize,
        ny: usize,
        spacing: f64,
        amounts: crate::spatial_material::Material,
        totals: [f64; 2],
        drift: f64,
    ) -> Self {
        let mut field = Self {
            nx,
            ny,
            spacing,
            amounts,
            totals,
            drift,
            pressure_strength: crate::medium_response::DEFAULT_PRESSURE_STRENGTH,
            attraction_length: 0.,
            attraction: Default::default(),
            illumination: Default::default(),
            next: Default::default(),
            neighbors: vec![],
            carriers: Default::default(),
            signal_changes: Default::default(),
            material_exact: true,
            rows: None,
            last_groups: 0,
            mechanical_frozen: false,
            profile: false,
            profile_ms: [0.; 2],
        };
        field.rebuild();
        field
    }
    /// Geometry-dependent derived state. Projections need chemistry: see `refresh`.
    pub fn rebuild(&mut self) {
        self.attraction = Default::default();
        self.illumination = Default::default();
        let n = self.nx * self.ny;
        let geometry = crate::spatial::Geometry::new(self.nx, self.ny);
        self.amounts.reshape(geometry);
        self.next = crate::spatial_material::Material::with_geometry(geometry);
        self.signal_changes = Default::default();
        self.signal_changes.reset(geometry.count());
        self.material_exact = true;
        self.carriers = crate::spatial_carriers::Carriers::new(geometry);
        self.neighbors = (0..n)
            .map(|i| [(1, 0), (-1, 0), (0, 1), (0, -1)].map(|(x, y)| geometry.offset(i, x, y)))
            .collect();
    }
    pub(crate) fn projection_rows(
        &mut self,
        chemistry: &Chemistry,
    ) -> std::sync::Arc<crate::chemical_projection::Rows> {
        self.rows
            .get_or_insert_with(|| {
                std::sync::Arc::new(crate::chemical_projection::Rows::new(chemistry))
            })
            .clone()
    }
    pub fn stencil(&self, x: f64, y: f64) -> [(usize, f64); 4] {
        let gx = x / self.spacing - 0.5;
        let gy = y / self.spacing - 0.5;
        let (ix, iy) = (gx.floor() as isize, gy.floor() as isize);
        let (a, b) = (gx - gx.floor(), gy - gy.floor());
        let node = |x: isize, y: isize| {
            y.rem_euclid(self.ny as isize) as usize * self.nx
                + x.rem_euclid(self.nx as isize) as usize
        };
        [
            (node(ix, iy), (1. - a) * (1. - b)),
            (node(ix + 1, iy), a * (1. - b)),
            (node(ix, iy + 1), (1. - a) * b),
            (node(ix + 1, iy + 1), a * b),
        ]
    }
    fn area(&self) -> f64 {
        self.spacing * self.spacing
    }
    /// Material impedance concentration at one node.
    pub fn impedance_at(&self, n: usize) -> f64 {
        self.amounts.projection(n)[2] / self.area()
    }
    pub fn stress_at(&self, n: usize) -> f64 {
        self.amounts.projection(n)[3] / self.area()
    }
    pub fn material_signal(&self, n: usize) -> [f64; 2] {
        let p = self.amounts.projection(n);
        [p[4] / self.area(), p[5] / self.area()]
    }
    pub fn medium_load(&self, sites: &[(usize, f64)]) -> f64 {
        sites
            .iter()
            .map(|&(n, w)| w * (self.impedance_at(n) + self.carriers.site(n).load[1]))
            .sum()
    }
    pub fn medium_signal(&self, n: usize) -> [f64; 2] {
        let material = self.material_signal(n);
        let carrier = self.carriers.site(n);
        std::array::from_fn(|k| material[k] + carrier.signal[0][k] + carrier.signal[1][k])
    }
    pub fn sample(&self, species: usize, sites: &[(usize, f64)]) -> f64 {
        sites
            .iter()
            .map(|&(n, w)| w * self.amounts[n * SPECIES + species] as f64)
            .sum::<f64>()
            / self.area()
    }
    pub fn stress_sample(&self, sites: &[(usize, f64)]) -> f64 {
        sites.iter().map(|&(n, w)| w * self.stress_at(n)).sum()
    }
    pub fn amounts(&self) -> &crate::spatial_material::Material {
        &self.amounts
    }
    /// Explicit cold replacement; callers cannot observe material without its derived state.
    pub fn replace_material(&mut self, chemistry: &Chemistry, mut value: impl FnMut(usize) -> f32) {
        self.amounts.clear();
        for i in 0..self.nx * self.ny * SPECIES {
            let q = value(i);
            assert!(q.is_finite() && q >= 0.);
            if q != 0. {
                self.amounts[i] = q;
            }
        }
        self.refresh(chemistry);
    }
    pub fn scalar(&self, values: &[f64], sites: &[(usize, f64)]) -> f64 {
        sites.iter().map(|&(n, w)| w * values[n]).sum()
    }
    /// One chemical at one node through the shared row commit; returns the rounding loss.
    pub fn add(&mut self, node: usize, species: usize, amount: f64, chemistry: &Chemistry) -> f64 {
        let mut requested = [0.; SPECIES];
        requested[species] = amount;
        let rows = self.projection_rows(chemistry);
        let (reduction, loss, changed) =
            self.amounts
                .commit(node, &mut requested, 1 << (species / 4), &rows);
        self.record(node, reduction, changed);
        loss[0]
    }
    fn record(&mut self, node: usize, reduction: [f64; 6], changed: bool) {
        self.totals[0] += reduction[0];
        self.totals[1] += reduction[1];
        if changed {
            let geometry = self.amounts.geometry();
            self.signal_changes.insert(geometry.address(node).0);
        }
    }
    pub fn deposit(&mut self, x: f64, y: f64, species: usize, amount: f64, c: &Chemistry) -> f64 {
        self.stencil(x, y)
            .iter()
            .map(|&(n, w)| self.add(n, species, amount * w, c))
            .sum()
    }
    pub fn totals(&self, _: &Chemistry) -> (f64, f64) {
        (self.totals[0], self.totals[1])
    }
    pub(crate) fn active_groups(&self, node: usize) -> u64 {
        self.amounts.mask(node)
    }
    /// Scalar diagnostics only; no physical field frame crosses the worker boundary.
    pub fn work_counts(&self) -> [usize; 3] {
        let (rows, groups) = self
            .amounts
            .occupied()
            .fold((0, 0), |(r, g), (_, mask, _)| {
                (r + 1, g + mask.count_ones() as usize)
            });
        [rows, groups, self.last_groups]
    }
    pub fn has_active_material(&self) -> bool {
        !self.amounts.regions.entries.is_empty()
    }
    pub fn structural_counts(&self) -> serde_json::Value {
        serde_json::json!({"materialRows":self.amounts.nodes().len(),
            "materialAllocatedBytes":self.amounts.allocated_bytes()+self.next.allocated_bytes(),
            "geographicNodes":self.nx*self.ny,
            "materialRegions":self.amounts.regions.entries.len(),
            "regionAllocations":self.amounts.allocations()+self.next.allocations(),
            "attractionVisited":self.attraction.visited,
            "attractionDirtyRegions":self.attraction.dirty_regions})
    }
    /// Cold boundary: recompute every mask, projection and total from material.
    pub fn refresh(&mut self, chemistry: &Chemistry) {
        let total = self.refresh_features(chemistry);
        self.totals = [total[0], total[1]];
    }
    /// Restore boundary: saved totals remain the incremental account; features are derived.
    pub(crate) fn refresh_features(&mut self, chemistry: &Chemistry) -> [f64; 6] {
        let rows = self.projection_rows(chemistry);
        let total = self.amounts.refresh(&rows);
        self.material_exact = true;
        for r in 0..self.amounts.geometry().count() {
            self.signal_changes.insert(r);
        }
        total
    }
    pub fn advance(
        &mut self,
        chemistry: &Chemistry,
        dt: f64,
        washout: f64,
        impedance: f64,
    ) -> FieldBalance {
        self.advance_weathered(chemistry, dt, washout, impedance, None)
    }
    pub fn advance_weathered(
        &mut self,
        chemistry: &Chemistry,
        dt: f64,
        washout: f64,
        impedance: f64,
        mut climate: Option<&mut crate::climate::Climate>,
    ) -> FieldBalance {
        let maximum = chemistry
            .properties
            .iter()
            .map(|p| p.diffusion)
            .fold(0., f64::max);
        let rate = 4. * (maximum / self.area() + self.drift / self.spacing);
        // Faces <= D/h² + drift/h: outgoing <= 0.9 retains positive, conservative weights.
        let steps = (dt * rate / 0.9).ceil().max(1.) as usize;
        let maximum_impedance = chemistry
            .properties
            .iter()
            .map(|p| p.impedance)
            .fold(0., f64::max);
        let rows: [[f32; SPECIES]; 4] = std::array::from_fn(|k| {
            std::array::from_fn(|s| {
                let p = &chemistry.properties[s];
                if k == 0 {
                    p.diffusion as f32
                } else {
                    crate::medium_response::profile(p)[k - 1] as f32
                }
            })
        });
        let before = self.totals;
        let mut lost = [0.; 2];
        let projection = self.projection_rows(chemistry);
        let floor = crate::field_activity::CONCENTRATION_FLOOR * self.area() as f32;
        self.last_groups = 0;
        for step in 0..steps {
            self.prepare_attraction();
            let outcome = self.advance_partitioned(
                &rows,
                &projection,
                (dt, steps, step),
                washout,
                impedance,
                maximum_impedance,
                floor,
                climate.as_deref(),
            );
            for k in 0..2 {
                lost[k] += outcome[k];
            }
            if let Some(weather) = climate.as_deref_mut() {
                weather.heat += outcome[2];
                weather.work += outcome[3];
                weather.converted += outcome[4];
                weather.prevented += outcome[5];
            }
        }
        let weathering_heat = climate.as_ref().map_or(0., |c| c.heat);
        let weathering_work = climate.as_ref().map_or(0., |c| c.work);
        FieldBalance {
            matter: lost[0],
            energy: lost[1],
            roundoff_matter: before[0] - lost[0] - self.totals[0],
            roundoff_energy: before[1] - lost[1] + weathering_work
                - self.totals[1]
                - weathering_heat,
            weathering_heat,
            weathering_work,
            weathered_material: climate.as_ref().map_or(0., |c| c.converted),
            sheltered_conversion: climate.as_ref().map_or(0., |c| c.prevented),
        }
    }
}
