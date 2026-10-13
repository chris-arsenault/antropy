//! Physical-time histories fixed to material nodes, under the existing region geometry.
use crate::{config::Config, field::Field, mortality::History, organism::Cell, spatial::Geometry};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
struct Sample {
    at: f64,
    history: History,
}
impl Sample {
    fn advance(&mut self, now: f64, c: &Config) {
        self.history
            .advance((now - self.at).max(0.), c.mortality_memory);
        self.at = now;
    }
}
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct State {
    regions: BTreeMap<usize, BTreeMap<usize, Sample>>,
    occupied: Vec<usize>,
}
impl State {
    fn entry(&mut self, node: usize, field: &Field, now: f64, c: &Config) -> &mut History {
        let (region, site) = field.amounts().geometry().address(node);
        let sample = self
            .regions
            .entry(region)
            .or_default()
            .entry(site)
            .or_insert_with(|| Sample {
                at: now,
                ..Default::default()
            });
        sample.advance(now, c);
        &mut sample.history
    }
    pub fn settle(&mut self, now: f64, c: &Config) {
        for region in self.regions.values_mut() {
            for sample in region.values_mut() {
                sample.advance(now, c);
            }
        }
    }
    pub fn sync<'a>(
        &mut self,
        cells: impl Iterator<Item = &'a Cell>,
        c: &Config,
        field: &Field,
        now: f64,
    ) {
        let mut living = BTreeMap::<usize, f64>::new();
        for cell in cells {
            for &(node, weight) in &crate::footprint::sites(cell, c, field) {
                *living.entry(node).or_default() += weight * cell.mass();
            }
        }
        let previous = std::mem::take(&mut self.occupied);
        for node in previous {
            self.entry(node, field, now, c).living = 0.;
        }
        for (node, mass) in living {
            let h = self.entry(node, field, now, c);
            if h.biomass == 0. && h.death_rate == 0. {
                h.biomass = mass;
            }
            h.living = mass;
            self.occupied.push(node);
        }
    }
    pub fn grow(&mut self, cells: &[Cell], c: &Config, field: &Field, now: f64) {
        for cell in cells.iter().filter(|cell| cell.flows.grown > 0.) {
            for &(node, weight) in &crate::footprint::sites(cell, c, field) {
                self.entry(node, field, now, c)
                    .grow(cell.flows.grown * weight, c.mortality_memory);
            }
        }
    }
    pub fn deaths(
        &mut self,
        cells: impl Iterator<Item = impl std::borrow::Borrow<Cell>>,
        c: &Config,
        field: &Field,
        now: f64,
    ) {
        let mut losses = BTreeMap::<usize, f64>::new();
        for cell in cells {
            let cell = cell.borrow();
            for &(node, weight) in &crate::footprint::sites(cell, c, field) {
                *losses.entry(node).or_default() += weight * cell.mass();
            }
        }
        for (node, mass) in losses {
            let h = self.entry(node, field, now, c);
            // A newly occupied support still has its actual pre-removal reference.
            if h.biomass == 0. {
                h.biomass = mass;
                h.living = mass;
            }
            h.deaths(mass, h.living.max(mass), c);
        }
    }
    pub fn sample(&self, row: &[(usize, f64)], c: &Config, field: &Field, now: f64) -> History {
        let mut result = History::default();
        for &(node, weight) in row {
            let (region, site) = field.amounts().geometry().address(node);
            if let Some(sample) = self.regions.get(&region).and_then(|r| r.get(&site)) {
                let mut sample = sample.clone();
                sample.advance(now, c);
                result.death_rate += weight * sample.history.death_rate;
                result.growth_rate += weight * sample.history.growth_rate;
                result.biomass += weight * sample.history.biomass;
            }
        }
        result
    }
    pub fn validate(&self, field: &Field, now: f64) -> Result<(), String> {
        let g = Geometry::new(field.nx, field.ny);
        let mut living = BTreeSet::new();
        for (&region, samples) in &self.regions {
            if region >= g.count() || samples.len() > crate::spatial::SITES {
                return Err("Invalid local mortality region".into());
            }
            for (&site, sample) in samples {
                if site >= crate::spatial::SITES {
                    return Err("Invalid local mortality node".into());
                }
                let node = g.node(region, site).ok_or("Invalid local mortality node")?;
                if !sample.at.is_finite() || sample.at < 0. || sample.at > now + 1e-9 {
                    return Err("Invalid local mortality clock".into());
                }
                sample.history.validate()?;
                if sample.history.living > 0. {
                    living.insert(node);
                }
            }
        }
        if self.occupied.iter().copied().collect::<BTreeSet<_>>() != living
            || self.occupied.len() != living.len()
        {
            return Err("Invalid local mortality living support".into());
        }
        Ok(())
    }
}

#[cfg(test)]
#[path = "mortality_local_tests.rs"]
mod tests;
