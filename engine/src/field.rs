//! Geographic material owner. Shared features drive bounded conservative redistribution.
use crate::chemistry::{Chemistry, SPECIES};
use serde::{Deserialize, Serialize};
#[path = "field_exchange.rs"]
mod exchange;
#[path = "field_parallel.rs"]
mod parallel;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Field {
    pub nx: usize,
    pub ny: usize,
    pub spacing: f64,
    pub amounts: Vec<f32>,
    pub impedance: Vec<f64>,
    pub stress: Vec<f64>,
    pub signal: Vec<[f64; 2]>,
    totals: [f64; 2],
    pub drift: f64,
    #[serde(skip)]
    pub pressure_strength: f64,
    #[serde(skip)]
    pub attraction_length: f64,
    #[serde(skip)]
    pub attraction_strength: f64,
    #[serde(skip)]
    pub(crate) attraction: crate::attraction::Attraction,
    #[serde(skip)]
    pub(crate) broad_attraction: crate::attraction::Attraction,
    #[serde(skip)]
    pub illumination: crate::illumination::Illumination,
    #[serde(skip)]
    next: Vec<f32>,
    #[serde(skip)]
    pub(crate) neighbors: Vec<[usize; 4]>,
    #[serde(skip)]
    pub body_signal: Vec<[f64; 2]>,
    #[serde(skip)]
    pub body_load: Vec<f64>,
    #[serde(skip)]
    pub source_signal: Vec<[f64; 2]>,
    #[serde(skip)]
    pub source_load: Vec<f64>,
    #[serde(skip)]
    pub source_nodes: Vec<usize>,
    #[serde(skip)]
    pub source_listed: Vec<bool>,
    #[serde(skip)]
    activity: crate::field_activity::Activity,
    #[serde(skip)]
    last_groups: usize,
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
        let mut field = Self {
            nx,
            ny,
            spacing,
            amounts: vec![0.; nx * ny * SPECIES],
            impedance: vec![0.; nx * ny],
            stress: vec![0.; nx * ny],
            signal: vec![[0.; 2]; nx * ny],
            totals: [0.; 2],
            drift: 0.25,
            pressure_strength: crate::medium_response::DEFAULT_PRESSURE_STRENGTH,
            attraction_length: 0.,
            attraction_strength: 4.,
            attraction: Default::default(),
            broad_attraction: Default::default(),
            illumination: Default::default(),
            next: vec![],
            neighbors: vec![],
            body_signal: vec![],
            body_load: vec![],
            source_signal: vec![],
            source_load: vec![],
            source_nodes: vec![],
            source_listed: vec![],
            activity: Default::default(),
            last_groups: 0,
        };
        field.rebuild();
        field
    }
    pub fn rebuild(&mut self) {
        self.attraction = Default::default();
        self.broad_attraction = Default::default();
        self.illumination = Default::default();
        let n = self.nx * self.ny;
        self.next.resize(n * SPECIES, 0.);
        self.next.fill(0.);
        self.activity.rebuild(&self.amounts);
        // Retain pending cleanup of rounding in fully withdrawn rows across restore.
        for node in 0..n {
            if self.impedance[node] != 0. || self.stress[node] != 0. || self.signal[node] != [0.; 2]
            {
                self.activity.retain(node);
            }
        }
        self.body_signal = vec![[0.; 2]; n];
        self.body_load = vec![0.; n];
        self.source_signal = vec![[0.; 2]; n];
        self.source_load = vec![0.; n];
        self.source_nodes.clear();
        self.source_listed = vec![false; n];
        self.neighbors = (0..n)
            .map(|i| {
                let x = i % self.nx;
                [
                    i - x + (x + 1) % self.nx,
                    i - x + (x + self.nx - 1) % self.nx,
                    (i + self.nx) % n,
                    (i + n - self.nx) % n,
                ]
            })
            .collect();
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
    pub fn medium_load(&self, sites: &[(usize, f64)]) -> f64 {
        sites
            .iter()
            .map(|&(n, w)| w * (self.impedance[n] + self.source_load[n]))
            .sum()
    }
    pub fn medium_signal(&self, n: usize) -> [f64; 2] {
        std::array::from_fn(|k| {
            self.signal[n][k] + self.body_signal[n][k] + self.source_signal[n][k]
        })
    }
    pub fn sample(&self, species: usize, sites: &[(usize, f64)]) -> f64 {
        sites
            .iter()
            .map(|&(n, w)| w * self.amounts[n * SPECIES + species] as f64)
            .sum::<f64>()
            / self.spacing.powi(2)
    }
    pub fn scalar(&self, values: &[f64], sites: &[(usize, f64)]) -> f64 {
        sites.iter().map(|&(n, w)| w * values[n]).sum()
    }
    pub fn add(&mut self, node: usize, species: usize, amount: f64, chemistry: &Chemistry) -> f64 {
        let index = node * SPECIES + species;
        let before = self.amounts[index] as f64;
        let after = (before + amount).max(0.) as f32;
        self.amounts[index] = after;
        if after > 0. {
            self.activity
                .set(node, self.activity.masks[node] | (1 << (species / 4)));
        }
        let change = after as f64 - before;
        self.record(node, species, change, chemistry);
        amount - change
    }
    fn record(&mut self, node: usize, species: usize, change: f64, chemistry: &Chemistry) {
        let p = &chemistry.properties[species];
        let concentration = change / self.spacing.powi(2);
        self.totals[0] += change;
        self.totals[1] += change * p.potential;
        self.impedance[node] += concentration * p.impedance;
        self.stress[node] += concentration * p.stress;
        for k in 0..2 {
            self.signal[node][k] += concentration * p.interaction[k];
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
        self.activity.masks[node]
    }
    pub(crate) fn material_values(&self, node: usize, chemistry: &Chemistry) -> [f64; 2] {
        let mut values = [0.; 2];
        let mut mask = self.active_groups(node);
        while mask != 0 {
            let start = mask.trailing_zeros() as usize * 4;
            mask &= mask - 1;
            for s in start..start + 4 {
                let q = self.amounts[node * SPECIES + s] as f64;
                values[0] += q;
                values[1] += q * chemistry.properties[s].potential;
            }
        }
        values
    }
    /// Scalar diagnostics only; no physical field frame crosses the worker boundary.
    pub fn work_counts(&self) -> [usize; 3] {
        let groups = self
            .activity
            .nodes
            .iter()
            .map(|&n| self.activity.masks[n].count_ones() as usize)
            .sum();
        [self.activity.nodes.len(), groups, self.last_groups]
    }
    pub fn has_active_material(&self) -> bool {
        !self.activity.nodes.is_empty()
    }
    pub fn refresh(&mut self, chemistry: &Chemistry) {
        self.activity.rebuild(&self.amounts);
        self.totals = [0.; 2];
        let rows = crate::chemical_projection::Rows::new(chemistry);
        for n in 0..self.nx * self.ny {
            let values = crate::chemical_projection::project(
                &self.amounts[n * SPECIES..(n + 1) * SPECIES],
                &rows,
            );
            self.totals[0] += values[0];
            self.totals[1] += values[1];
            let a = self.spacing.powi(2);
            self.impedance[n] = values[2] / a;
            self.stress[n] = values[3] / a;
            self.signal[n] = [values[4] / a, values[5] / a];
        }
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
        let rate = 4. * (maximum / self.spacing.powi(2) + self.drift / self.spacing);
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
        let projection = crate::chemical_projection::Rows::new(chemistry);
        let floor = crate::field_activity::CONCENTRATION_FLOOR * self.spacing.powi(2) as f32;
        self.last_groups = 0;
        for step in 0..steps {
            self.prepare_attraction();
            self.activity.prepare(&self.neighbors);
            let outcome = self.advance_partitioned(
                &rows,
                &projection,
                dt,
                steps,
                step,
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
            self.activity.finish();
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
    pub fn validate(&self) -> Result<(), String> {
        let n = self
            .nx
            .checked_mul(self.ny)
            .ok_or("Invalid field dimensions")?;
        if self.nx < 4
            || self.ny < 4
            || n > crate::memory_budget::MAX_FIELD_NODES
            || self.spacing <= 0.
            || !self.spacing.is_finite()
            || self.amounts.len() != n * SPECIES
            || self.impedance.len() != n
            || self.stress.len() != n
            || self.signal.len() != n
            || self.amounts.iter().any(|q| !q.is_finite() || *q < 0.)
            || !self.drift.is_finite()
            || !(0. ..=1.).contains(&self.drift)
        {
            return Err("Invalid field state".into());
        }
        Ok(())
    }
    pub fn validate_reductions(&self, c: &Chemistry) -> Result<(), String> {
        let mut reference = self.clone();
        reference.refresh(c);
        let close = |a: f64, b: f64| a.is_finite() && (a - b).abs() <= 1e-9 * (1. + b.abs());
        if !self
            .totals
            .iter()
            .zip(reference.totals)
            .all(|(&a, b)| close(a, b))
            || !self
                .impedance
                .iter()
                .zip(&reference.impedance)
                .all(|(&a, &b)| close(a, b))
            || !self
                .stress
                .iter()
                .zip(&reference.stress)
                .all(|(&a, &b)| close(a, b))
            || !self
                .signal
                .iter()
                .flatten()
                .zip(reference.signal.iter().flatten())
                .all(|(&a, &b)| close(a, b))
        {
            return Err("Field reductions disagree with material".into());
        }
        Ok(())
    }
}
