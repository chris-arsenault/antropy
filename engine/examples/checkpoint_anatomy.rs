//! Encoded size of every checkpoint section and of each cell and genotype field.
//! Usage: checkpoint_anatomy CHECKPOINT
use antropy_engine::world::World;
use serde::Serialize;
use std::collections::BTreeMap;

fn size<T: Serialize>(value: &T) -> usize {
    postcard::to_stdvec(value).map_or(0, |b| b.len())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = std::env::args().nth(1).ok_or("checkpoint path required")?;
    let raw = std::fs::read(&path)?;
    let w = World::restore(&raw)?;
    let mut cells = BTreeMap::<&str, usize>::new();
    let mut nonzero = BTreeMap::<&str, (usize, usize)>::new();
    for c in &w.cells {
        let flows = &c.chemical_flows;
        for (name, n) in [
            (
                "identity (id, parent, lineage, generation, genome, born)",
                size(&(c.id, c.parent, c.lineage, c.generation, c.genome, c.born)),
            ),
            ("position and heading", size(&(c.x, c.y, c.heading))),
            ("body stocks", size(&c.body)),
            ("bound material", size(&c.bound_material)),
            ("inventory", size(&c.inventory)),
            ("energy and damage", size(&(c.energy, c.damage))),
            ("brain hidden", size(&c.brain.hidden)),
            ("brain learning traces", size(&c.brain.traces)),
            (
                "brain other",
                size(&(c.brain.task, c.brain.last_energy, &c.brain.epoch)),
            ),
            (
                "receptors, photoreceptor, contacts",
                size(&(c.receptors, c.inward_receptors, c.photoreceptor, c.contacts)),
            ),
            ("inputs", size(&c.inputs)),
            ("action", size(&c.action)),
            ("last-step flows", size(&c.flows)),
            ("lifetime chemical flows (4 x 256)", size(flows)),
        ] {
            *cells.entry(name).or_default() += n;
        }
        for (name, inventory) in [
            ("inventory", &c.inventory),
            ("bound material", &c.bound_material),
        ] {
            let e = nonzero.entry(name).or_default();
            e.0 += inventory.iter().filter(|v| *v != 0.).count();
            e.1 += inventory.iter().len();
        }
        let e = nonzero
            .entry("lifetime chemical flows (4 x 256)")
            .or_default();
        for counter in [
            &flows.imported,
            &flows.exported,
            &flows.consumed,
            &flows.produced,
        ] {
            e.0 += counter.iter().filter(|v| *v != 0.).count();
            e.1 += counter.len();
        }
        let e = nonzero.entry("brain learning traces").or_default();
        e.0 += c.brain.traces.iter().filter(|v| **v != 0.).count();
        e.1 += c.brain.traces.len();
    }
    let mut genomes = BTreeMap::<&str, usize>::new();
    for g in w.genomes.values() {
        for ch in &g.chromosomes {
            *genomes.entry("controller weights").or_default() += size(&ch.behavior.weights);
            *genomes.entry("controller plasticity").or_default() += size(&ch.behavior.plasticity);
            *genomes.entry("physical targets").or_default() += size(&ch.physical);
            *genomes.entry("chemical machinery").or_default() += size(&ch.chemistry);
        }
        *genomes.entry("identity").or_default() +=
            size(&(g.id, g.parent, g.born, g.learned, g.mutated));
    }
    let live: std::collections::BTreeSet<_> = w.cells.iter().map(|c| c.genome).collect();
    let shared = w.cells.len() - live.len();
    let report = serde_json::json!({
        "tick": w.tick, "cells": w.cells.len(), "genotypes": w.genomes.len(),
        "cellsSharingAGenotype": shared, "checkpointBytes": raw.len(),
        "sections": {"cells": size(&w.cells), "genomes": size(&w.genomes), "field": size(&w.field),
            "ancestry": size(&w.ancestry), "sources": size(&w.sources), "events": size(&w.events)},
        "cellFields": cells, "genotypeFields": genomes,
        "nonzeroOfEntries": nonzero,
    });
    println!("{}", serde_json::to_string_pretty(&report)?);
    Ok(())
}
