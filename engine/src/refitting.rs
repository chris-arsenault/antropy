//! Installed machinery remains functional until its generic material is remanufactured.
use crate::{config::Config, genetics::Genotype, organism::Cell};
use std::collections::BTreeMap;

pub fn attempt(cell: &mut Cell, genomes: &BTreeMap<u64, Genotype>, c: &Config) {
    if cell.machinery_genome == cell.genome {
        return;
    }
    let before = &genomes[&cell.machinery_genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .chemistry;
    let after = &genomes[&cell.genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .chemistry;
    let stock: f64 = (0..12)
        .filter(|&i| match i / 4 {
            0 => before.receptors[i] != after.receptors[i],
            1 => before.transporters[i - 4] != after.transporters[i - 4],
            _ => before.enzymes[i - 8] != after.enzymes[i - 8],
        })
        .map(|i| cell.body[3 + i])
        .sum();
    // Built material has one generic identity: recycling changes neither matter nor
    // embodied chemical potential. Work is paid as heat; no new biomass is credited.
    let cost = stock * c.construction_energy;
    if cost > 0. && cell.energy - c.protected_reserve * cell.energy_capacity(c) < cost {
        return;
    }
    cell.energy -= cost;
    cell.flows.refitting += cost;
    cell.machinery_genome = cell.genome;
}
