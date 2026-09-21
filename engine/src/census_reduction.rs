//! Query-local columns share one population traversal; no physical state is retained or copied.
use crate::{genetics::Compiled, organism::Cell, world::World};
use std::collections::BTreeMap;

pub(super) struct Population {
    pub traits: [Vec<f64>; 9],
    pub efforts: [Vec<f64>; 7],
    pub membrane: [usize; 256],
    pub families: BTreeMap<u64, usize>,
    pub lineages: BTreeMap<u64, usize>,
    pub profiles: crate::genealogy::Profiles,
    pub evolution: crate::population_diagnostics::Reduction,
}
impl Population {
    pub fn new(w: &World) -> Self {
        let mut result = Self {
            traits: std::array::from_fn(|_| Vec::with_capacity(w.cells.len())),
            efforts: std::array::from_fn(|_| Vec::with_capacity(w.cells.len())),
            membrane: [0; 256],
            families: BTreeMap::new(),
            lineages: BTreeMap::new(),
            profiles: Default::default(),
            evolution: crate::population_diagnostics::Reduction::new(w.cells.len()),
        };
        let reference = w.genomes[&1].compiled.as_ref().unwrap();
        for cell in &w.cells {
            let genotype = &w.genomes[&cell.genome];
            let g = genotype.compiled.as_ref().unwrap();
            result.add(cell, g, w);
            result.evolution.add(cell, genotype, reference, w);
        }
        result
    }
    fn add(&mut self, cell: &Cell, g: &Compiled, w: &World) {
        let traits = g.census_traits(w.config.birth_mass);
        for (column, value) in self.traits.iter_mut().zip(traits) {
            column.push(value);
        }
        let a = &cell.action;
        let efforts = [
            a.swim.abs(),
            a.turn.abs(),
            a.repair,
            a.transport[0],
            a.transport[1],
            a.transport[2],
            a.transport[3],
        ];
        for (column, value) in self.efforts.iter_mut().zip(efforts) {
            column.push(value);
        }
        self.membrane[traits[5].round() as usize * 16 + traits[6].round() as usize] += 1;
        let family = crate::presentation::family(w, cell);
        *self.families.entry(family).or_default() += 1;
        *self.lineages.entry(cell.lineage).or_default() += 1;
        crate::genealogy::add_profile(&mut self.profiles, family, cell, g);
    }
}
