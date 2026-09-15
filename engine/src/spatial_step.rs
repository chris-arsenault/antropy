//! Conservative spatial proposals and their full-state acceptance, owned by Rust.
use crate::{
    chemistry::{Chemistry, SPECIES},
    config::Config,
    field::Field,
    genetics::Genotype,
    interaction::Interaction,
    organism::Cell,
    spatial_energy::{Energy, SpatialLaw, SpatialLedger},
};
use std::collections::BTreeMap;

pub fn bernoulli(v: f64) -> f64 {
    if v.abs() <= 0.5 {
        crate::spatial_numeric::bernoulli_even(v) - v / 2.
    } else if v > 0. {
        let e = (-v).exp();
        v * e / (1. - e)
    } else {
        v / v.exp_m1()
    }
}

/// One face uses each resistance once; inputs are amounts in equal-area volumes.
pub fn face_flux(left: f64, right: f64, v: f64, conductance: f64) -> f64 {
    conductance * (bernoulli(v) * left - bernoulli(-v) * right)
}

#[derive(Clone, Debug)]
pub struct SpatialStep {
    pub interaction: Interaction,
    pub before: Energy,
    proposal: Vec<f64>,
    exact_nodes: Vec<crate::field_reductions::Node>,
    stored_nodes: Vec<crate::field_reductions::Node>,
    material_loss: f64,
}
impl SpatialStep {
    pub fn new(field: &Field, law: SpatialLaw) -> Self {
        Self {
            interaction: Interaction::new(field, law),
            before: Energy::default(),
            proposal: vec![0.; field.amounts.len()],
            exact_nodes: vec![[0.; 7]; field.nx * field.ny],
            stored_nodes: vec![[0.; 7]; field.nx * field.ny],
            material_loss: 0.,
        }
    }
    pub fn refresh(
        &mut self,
        field: &Field,
        cells: &[Cell],
        genomes: &BTreeMap<u64, Genotype>,
        chemistry: &Chemistry,
        c: &Config,
    ) -> Energy {
        self.interaction
            .prepare_bodies(field, cells, genomes, chemistry, c);
        self.before = self.interaction.evaluate_cached(field, chemistry, cells, c);
        self.before
    }
    fn copy_owners(&mut self, field: &Field) {
        for (to, from) in self.proposal.iter_mut().zip(&field.amounts) {
            *to = *from as f64;
        }
    }
    fn flux_proposal(&mut self, field: &Field, chemistry: &Chemistry, dt: f64) -> f64 {
        self.copy_owners(field);
        let area = field.spacing * field.spacing;
        let mut largest = 0_f64;
        let properties = std::array::from_fn(|j| {
            std::array::from_fn(|s| {
                let p = &chemistry.properties[s];
                if j < 2 { p.interaction[j] } else { p.diffusion }
            })
        });
        for a in 0..field.nx * field.ny {
            for b in [
                (a / field.nx) * field.nx + (a + 1) % field.nx,
                (a + field.nx) % (field.nx * field.ny),
            ] {
                let resistance = self.interaction.resistance[a] + self.interaction.resistance[b];
                let potential = [
                    self.interaction.potential[b][0] - self.interaction.potential[a][0],
                    self.interaction.potential[b][1] - self.interaction.potential[a][1],
                ];
                let crowding = self.interaction.law.crowding
                    * (self.interaction.density[b].powi(2) - self.interaction.density[a].powi(2));
                let (ia, ib) = (a * SPECIES, b * SPECIES);
                let (out_a, out_b) = if ia < ib {
                    let (left, right) = self.proposal.split_at_mut(ib);
                    (&mut left[ia..ia + SPECIES], &mut right[..SPECIES])
                } else {
                    let (left, right) = self.proposal.split_at_mut(ia);
                    (&mut right[..SPECIES], &mut left[ib..ib + SPECIES])
                };
                let g = self.interaction.law.coupling;
                let outgoing = crate::spatial_flux::face(
                    field.amounts[ia..ia + SPECIES].try_into().unwrap(),
                    field.amounts[ib..ib + SPECIES].try_into().unwrap(),
                    out_a.try_into().unwrap(),
                    out_b.try_into().unwrap(),
                    &properties,
                    [-g * potential[0], g * potential[1], crowding],
                    [2. / (resistance * area), dt],
                );
                largest = largest.max(outgoing);
            }
        }
        // Every donor has four faces. This bounds its summed outgoing coefficient without
        // another species-sized coefficient buffer; it can be stricter than the local sum.
        4. * largest
    }
    fn evaluate_proposal(
        &mut self,
        chemistry: &Chemistry,
        cells: &[Cell],
        c: &Config,
        area: f64,
    ) -> Energy {
        let properties = crate::field_reductions::properties(chemistry);
        let mut loss = crate::spatial_energy::Sum::default();
        for (i, node) in self.proposal.chunks_exact(SPECIES).enumerate() {
            let (exact, stored, rounding) =
                crate::spatial_rounding::project(node, &properties, area);
            self.exact_nodes[i] = exact;
            self.stored_nodes[i] = stored;
            loss.add(rounding);
        }
        self.material_loss = loss.get();
        self.interaction
            .evaluate_nodes(self.exact_nodes.iter().copied(), cells, c)
    }
    fn commit(
        &mut self,
        field: &mut Field,
        chemistry: &Chemistry,
        cells: &[Cell],
        c: &Config,
        exact: Energy,
        ledger: &mut SpatialLedger,
    ) {
        field.commit_spatial(&self.proposal, &mut self.stored_nodes);
        self.stored_nodes.resize(self.exact_nodes.len(), [0.; 7]);
        let stored = self.interaction.evaluate_cached(field, chemistry, cells, c);
        ledger.rounding(exact, stored, self.material_loss);
        self.before = stored;
    }
    /// Accept at most one substep. Rejected trials leave every physical owner unchanged.
    pub fn field(
        &mut self,
        field: &mut Field,
        chemistry: &Chemistry,
        cells: &[Cell],
        c: &Config,
        maximum: f64,
        ledger: &mut SpatialLedger,
    ) -> Result<f64, String> {
        if !maximum.is_finite() || maximum <= 0. {
            return Err("Spatial substep duration must be positive and finite".into());
        }
        let before = self.before;
        let mut dt = maximum;
        for _ in 0..=20 {
            let outgoing = self.flux_proposal(field, chemistry, dt);
            if dt * outgoing > 0.5 {
                dt = (0.5 / outgoing).min(dt * 0.5);
                continue;
            }
            if self
                .proposal
                .iter()
                .all(|v| v.is_finite() && *v >= 0. && *v <= f32::MAX as f64)
            {
                let exact =
                    self.evaluate_proposal(chemistry, cells, c, field.spacing * field.spacing);
                if exact.total_free() <= before.total_free() {
                    ledger.closed(before, exact);
                    self.commit(field, chemistry, cells, c, exact, ledger);
                    return Ok(dt);
                }
            }
            ledger.rejected += 1;
            self.interaction.evaluate_cached(field, chemistry, cells, c);
            dt *= 0.5;
        }
        Err("Spatial transport exceeded 20 trial halvings; last accepted state retained".into())
    }
    /// Prescribed material boundary: the reservoir pays the exact free-energy difference.
    pub fn boundary(
        &mut self,
        field: &mut Field,
        chemistry: &Chemistry,
        cells: &[Cell],
        c: &Config,
        changes: &[(usize, usize, f64)],
        ledger: &mut SpatialLedger,
    ) -> Result<(), String> {
        self.copy_owners(field);
        let mut carried = 0.;
        for &(node, s, q) in changes {
            self.proposal[node * SPECIES + s] += q;
            carried += q * chemistry.properties[s].potential;
        }
        if self
            .proposal
            .iter()
            .any(|q| !q.is_finite() || *q < 0. || *q > f32::MAX as f64)
        {
            return Err("Boundary would create an invalid chemical owner".into());
        }
        let exact = self.evaluate_proposal(chemistry, cells, c, field.spacing * field.spacing);
        ledger.boundary(self.before, exact, carried);
        self.commit(field, chemistry, cells, c, exact, ledger);
        Ok(())
    }
    pub fn washout(
        &mut self,
        field: &mut Field,
        chemistry: &Chemistry,
        cells: &[Cell],
        c: &Config,
        dt: f64,
        ledger: &mut SpatialLedger,
    ) {
        if c.washout == 0. {
            return;
        }
        let factor = (-c.washout * dt).exp();
        let mut carried = 0.;
        for (i, (to, from)) in self.proposal.iter_mut().zip(&field.amounts).enumerate() {
            *to = *from as f64 * factor;
            carried += (*to - *from as f64) * chemistry.properties[i % SPECIES].potential;
        }
        let exact = self.evaluate_proposal(chemistry, cells, c, field.spacing * field.spacing);
        ledger.boundary(self.before, exact, carried);
        self.commit(field, chemistry, cells, c, exact, ledger);
    }
    pub fn scratch_bytes(&self) -> usize {
        self.proposal.capacity() * 8
            + (self.exact_nodes.capacity() + self.stored_nodes.capacity())
                * std::mem::size_of::<crate::field_reductions::Node>()
            + self.interaction.density.capacity() * (8 * 2 + 16 * 3)
            + self
                .interaction
                .bodies
                .iter()
                .map(|b| {
                    b.weights.capacity() * std::mem::size_of::<crate::disk::Weight>()
                        + b.self_potential.capacity() * 8
                })
                .sum::<usize>()
    }
}
