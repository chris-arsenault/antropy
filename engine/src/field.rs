use crate::chemistry::{Chemistry, SPECIES};
use serde::{Deserialize, Serialize};
#[path = "field_batch.rs"]
mod batch;

pub fn mobility(load: f64, k: f64) -> f64 {
    1. / (1. + k * load)
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Field {
    pub nx: usize,
    pub ny: usize,
    pub spacing: f64,
    /// Node-major chemical vectors; each vector is one contiguous SIMD workload.
    pub amounts: Vec<f32>,
    #[serde(skip)]
    next: Vec<f32>,
    // Incremental reductions influence movement between field updates. Persist their exact
    // arithmetic state; rebuilding from amounts in another order changes continuation.
    pub impedance: Vec<f64>,
    pub stress: Vec<f64>,
    #[serde(skip)]
    faces: Vec<(usize, usize)>,
    #[serde(skip)]
    mobility: Vec<f64>,
    matter: f64,
    energy: f64,
    #[serde(skip)]
    reductions: std::cell::RefCell<crate::field_reductions::Cache>,
}
#[derive(Default, Clone, Copy, Debug)]
pub struct FieldBalance {
    pub matter: f64,
    pub energy: f64,
    pub roundoff_matter: f64,
    pub roundoff_energy: f64,
}

impl Field {
    pub fn new(width: f64, height: f64, spacing: f64) -> Self {
        let (nx, ny) = ((width / spacing) as usize, (height / spacing) as usize);
        let mut f = Self {
            nx,
            ny,
            spacing,
            amounts: vec![0.; nx * ny * SPECIES],
            next: vec![],
            impedance: vec![],
            stress: vec![],
            faces: vec![],
            mobility: vec![],
            matter: 0.,
            energy: 0.,
            reductions: Default::default(),
        };
        f.rebuild();
        f
    }
    pub fn rebuild(&mut self) {
        self.reductions = Default::default();
        let n = self.nx * self.ny;
        self.next = vec![0.; n * SPECIES];
        self.impedance.resize(n, 0.);
        self.stress.resize(n, 0.);
        self.mobility = vec![0.; n];
        self.faces = (0..n)
            .flat_map(|i| {
                [
                    (i, (i / self.nx) * self.nx + (i + 1) % self.nx),
                    (i, (i + self.nx) % n),
                ]
            })
            .collect();
    }
    pub fn validate(&self) -> Result<(), String> {
        if self.nx < 4
            || self.ny < 4
            || self.nx.checked_mul(self.ny).is_none_or(|n| n > 80000)
            || !self.spacing.is_finite()
            || self.spacing <= 0.
            || self.amounts.len() != self.nx * self.ny * SPECIES
            || self.amounts.iter().any(|q| !q.is_finite() || *q < 0.)
            || self.impedance.len() != self.nx * self.ny
            || self.stress.len() != self.nx * self.ny
        {
            return Err("Invalid chemical field".into());
        }
        Ok(())
    }
    pub fn validate_reductions(&self, chemistry: &Chemistry) -> Result<(), String> {
        let area = self.spacing * self.spacing;
        let close = |a: f64, b: f64| a.is_finite() && (a - b).abs() <= 1e-9 * (1. + b.abs());
        let (mut matter, mut energy) = (0., 0.);
        for (i, node) in self.amounts.chunks_exact(SPECIES).enumerate() {
            let (mut impedance, mut stress) = (0., 0.);
            for (q, p) in node.iter().zip(&chemistry.properties) {
                let q = *q as f64;
                matter += q;
                energy += q * p.potential;
                impedance += q * p.impedance / area;
                stress += q * p.stress / area;
            }
            if !close(self.impedance[i], impedance) || !close(self.stress[i], stress) {
                return Err("Field reductions disagree with chemistry".into());
            }
        }
        if !close(self.matter, matter) || !close(self.energy, energy) {
            return Err("Field accounting disagrees with chemistry".into());
        }
        Ok(())
    }
    pub fn refresh(&mut self, chemistry: &Chemistry) {
        self.reductions.borrow_mut().invalidate();
        let area = self.spacing * self.spacing;
        self.matter = 0.;
        self.energy = 0.;
        let properties = std::array::from_fn(|j| {
            std::array::from_fn(|s| {
                let p = &chemistry.properties[s];
                match j {
                    0 => p.potential,
                    1 => p.impedance,
                    _ => p.stress,
                }
            })
        });
        for (i, node) in self.amounts.chunks_exact(SPECIES).enumerate() {
            let [matter, energy, impedance, stress] =
                crate::numeric::reductions(node.try_into().unwrap(), &properties);
            self.matter += matter;
            self.energy += energy;
            self.impedance[i] = impedance / area;
            self.stress[i] = stress / area;
        }
    }
    /// Bilinear finite-volume sampling uses node centers and periodic geographic boundaries.
    pub fn stencil(&self, x: f64, y: f64) -> [(usize, f64); 4] {
        let (gx, gy) = (x / self.spacing - 0.5, y / self.spacing - 0.5);
        let (ix, iy) = (gx.floor() as isize, gy.floor() as isize);
        let (fx, fy) = (gx - gx.floor(), gy - gy.floor());
        let at = |x: isize, y: isize| {
            y.rem_euclid(self.ny as isize) as usize * self.nx
                + x.rem_euclid(self.nx as isize) as usize
        };
        [
            (at(ix, iy), (1. - fx) * (1. - fy)),
            (at(ix + 1, iy), fx * (1. - fy)),
            (at(ix, iy + 1), (1. - fx) * fy),
            (at(ix + 1, iy + 1), fx * fy),
        ]
    }
    pub fn sample(&self, s: usize, stencil: &[(usize, f64); 4]) -> f64 {
        stencil
            .iter()
            .map(|(i, w)| self.amounts[i * SPECIES + s] as f64 * w)
            .sum::<f64>()
            / (self.spacing * self.spacing)
    }
    pub fn scalar(&self, values: &[f64], stencil: &[(usize, f64); 4]) -> f64 {
        stencil.iter().map(|(i, w)| values[*i] * w).sum()
    }
    /// Returns signed numerical loss. Callers account the requested physical transfer separately.
    pub fn add(&mut self, node: usize, s: usize, q: f64, chemistry: &Chemistry) -> f64 {
        let i = node * SPECIES + s;
        let before = self.amounts[i] as f64;
        self.amounts[i] = (before + q).max(0.) as f32;
        let delta = self.amounts[i] as f64 - before;
        if delta != 0. {
            self.reductions.borrow_mut().changed(node);
        }
        let area = self.spacing * self.spacing;
        self.impedance[node] += delta * chemistry.properties[s].impedance / area;
        self.stress[node] += delta * chemistry.properties[s].stress / area;
        self.matter += delta;
        self.energy += delta * chemistry.properties[s].potential;
        q - delta
    }
    pub fn deposit(&mut self, x: f64, y: f64, s: usize, q: f64, chemistry: &Chemistry) -> f64 {
        let stencil = self.stencil(x, y);
        stencil
            .iter()
            .map(|(i, w)| self.add(*i, s, q * w, chemistry))
            .sum()
    }
    pub fn totals(&self, _chemistry: &Chemistry) -> (f64, f64) {
        (self.matter, self.energy)
    }
    pub fn thermodynamics(
        &self,
        chemistry: &Chemistry,
    ) -> std::cell::Ref<'_, [crate::field_reductions::Node]> {
        self.reductions
            .borrow_mut()
            .update(&self.amounts, self.spacing * self.spacing, chemistry);
        std::cell::Ref::map(self.reductions.borrow(), |cache| cache.nodes.as_slice())
    }
    /// Install canonical reductions computed alongside a validated f32 spatial proposal.
    pub(crate) fn commit_spatial(
        &mut self,
        amounts: &[f64],
        nodes: &mut Vec<crate::field_reductions::Node>,
    ) {
        for (to, from) in self.amounts.iter_mut().zip(amounts) {
            *to = *from as f32;
        }
        let area = self.spacing * self.spacing;
        let mut totals = [crate::spatial_energy::Sum::default(); 2];
        for (i, n) in nodes.iter().enumerate() {
            totals[0].add(n[0]);
            totals[1].add(n[1]);
            self.impedance[i] = n[3] * 12. / area;
            self.stress[i] = n[6] / area;
        }
        self.matter = totals[0].get();
        self.energy = totals[1].get();
        self.reductions.get_mut().install(nodes);
    }
    pub fn advance(
        &mut self,
        chemistry: &Chemistry,
        dt: f64,
        washout: f64,
        impedance: f64,
    ) -> FieldBalance {
        self.refresh(chemistry);
        let before = self.totals(chemistry);
        let max_d = chemistry
            .properties
            .iter()
            .map(|p| p.diffusion)
            .fold(0., f64::max);
        let steps = (4. * max_d * dt / (self.spacing * self.spacing) / 0.95)
            .ceil()
            .max(1.) as usize;
        let h = dt / steps as f64;
        let factor = (-washout * dt).exp();
        let matter = before.0 * (1. - factor);
        let energy = before.1 * (1. - factor);
        // Uniform decay commutes with each frozen conservative linear transport operator.
        // Apply it to the last operator output; book its analytical sink and measure roundoff.
        for step in 0..steps {
            if step > 0 {
                self.refresh(chemistry);
            }
            self.diffuse(
                chemistry,
                h,
                impedance,
                if step + 1 == steps { factor } else { 1. },
            );
        }
        self.refresh(chemistry);
        let after = self.totals(chemistry);
        FieldBalance {
            matter,
            energy,
            roundoff_matter: before.0 - after.0 - matter,
            roundoff_energy: before.1 - after.1 - energy,
        }
    }
    fn diffuse(&mut self, chemistry: &Chemistry, dt: f64, k: f64, decay: f64) {
        for (m, l) in self.mobility.iter_mut().zip(&self.impedance) {
            *m = mobility(*l, k);
        }
        crate::numeric::scale(&self.amounts, &mut self.next, decay as f32);
        let scale = dt * decay / (self.spacing * self.spacing);
        let diffusion = std::array::from_fn(|s| chemistry.properties[s].diffusion as f32);
        for &(a, b) in &self.faces {
            let conductance = 2. * self.mobility[a] * self.mobility[b]
                / (self.mobility[a] + self.mobility[b])
                * scale;
            let (ia, ib) = (a * SPECIES, b * SPECIES);
            let (lo, hi) = (ia.min(ib), ia.max(ib));
            let (left, right) = self.next.split_at_mut(hi);
            crate::numeric::exchange(
                self.amounts[lo..lo + SPECIES].try_into().unwrap(),
                self.amounts[hi..hi + SPECIES].try_into().unwrap(),
                (&mut left[lo..lo + SPECIES]).try_into().unwrap(),
                (&mut right[..SPECIES]).try_into().unwrap(),
                &diffusion,
                conductance as f32,
            );
        }
        std::mem::swap(&mut self.next, &mut self.amounts);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn field_conserves_and_washout_is_uniform() {
        let c = Chemistry::new(101).unwrap();
        let mut f = Field::new(16., 16., 2.);
        for s in 0..SPECIES {
            f.deposit(0., 0., s, 1., &c);
        }
        let start = f.totals(&c);
        let mut removed = (0., 0.);
        let mut roundoff = (0., 0.);
        for _ in 0..20 {
            let b = f.advance(&c, 0.2, 0.01, 1.);
            removed.0 += b.matter;
            removed.1 += b.energy;
            roundoff.0 += b.roundoff_matter;
            roundoff.1 += b.roundoff_energy;
        }
        assert!(f.amounts.iter().all(|x| *x >= 0.));
        let end = f.totals(&c);
        assert!((start.0 - end.0 - removed.0 - roundoff.0).abs() < 1e-9);
        assert!((start.1 - end.1 - removed.1 - roundoff.1).abs() < 1e-8);
        assert!((end.0 / start.0 - (-0.04_f64).exp()).abs() < 1e-6);
    }
    #[test]
    fn periodic_sampling_and_rare_matter() {
        let c = Chemistry::new(1).unwrap();
        let mut f = Field::new(16., 16., 2.);
        f.deposit(0., 0., 7, 1e-25, &c);
        assert_eq!(
            f.sample(7, &f.stencil(0., 0.)),
            f.sample(7, &f.stencil(16., 16.))
        );
        assert!(f.sample(7, &f.stencil(0., 0.)) > 0.);
        let before = f.totals(&c).0;
        f.advance(&c, 0.2, 0., 0.);
        assert!((f.totals(&c).0 / before - 1.).abs() < 1e-6);
    }
}
