//! Zero-tick concentration-support inspection; docs/bounded-computation.md owns the question.
use antropy_engine::{metabolism, organism, world::World};
use serde_json::json;

fn main() {
    let args: Vec<_> = std::env::args().collect();
    let w = World::restore(&std::fs::read(&args[1]).unwrap()).unwrap();
    let floors = [0., 1e-8, 1e-6, 1e-4];
    let mut edges = [0usize; 4];
    let mut requests = [0.; 4];
    let mut amounts = [0.; 4];
    let mut subnormal = 0;
    let mut partial_refits = 0;
    for cell in &w.cells {
        let c = &w.config;
        let volume = cell.volume(c);
        let operators = cell.operators.as_ref().unwrap();
        let mixture = metabolism::retained_response(cell, c, &w.chemistry);
        if cell.installed
            != w.genomes[&cell.genome]
                .compiled
                .as_ref()
                .unwrap()
                .chromosome
                .chemistry
        {
            partial_refits += 1;
        }
        for q in cell.inventory.iter() {
            subnormal += usize::from(q.is_subnormal());
            for (i, floor) in floors.iter().enumerate() {
                if q > floor * volume {
                    amounts[i] += q;
                }
            }
        }
        for (slot, enzyme) in operators.enzymes.iter().enumerate() {
            let capacity = c.physiology_interval
                * c.enzyme_turnover
                * cell.body[organism::enzyme_stock(slot)]
                * cell.action.activity[slot]
                * (1. - cell.damage);
            if capacity == 0. || !cell.installed.programs[slot] {
                continue;
            }
            let occupancy: f64 = enzyme
                .engagement
                .iter()
                .map(|a| a.value * cell.inventory.value(a.species))
                .sum();
            let factor = capacity / (c.receptor_k * volume + occupancy).max(1e-30);
            for edge in &enzyme.conversions {
                let q = cell.inventory.value(edge.substrate);
                let requested = factor
                    * edge.catalytic
                    * q
                    * metabolism::response(edge.work_coefficient, mixture);
                for (i, floor) in floors.iter().enumerate() {
                    if q > floor * volume {
                        edges[i] += 1;
                        requests[i] += requested;
                    }
                }
            }
        }
    }
    let result = json!({"tick":w.tick,"population":w.cells.len(),"floors":floors,
        "activeReactionEdges":edges,"unfundedRequestedMaterial":requests,
        "retainedFreeMaterial":amounts,"subnormalInventoryEntries":subnormal,
        "partiallyRefittedCells":partial_refits});
    std::fs::write(&args[2], serde_json::to_vec_pretty(&result).unwrap()).unwrap();
    println!("{result}");
}
