//! Population reductions only; no observation is an input to physics or reproduction.
use crate::{census::distribution, controller, world::World};
use serde_json::{Value, json};
use std::collections::BTreeMap;

pub fn observe(w: &World) -> Value {
    let mut counts = BTreeMap::<u64, usize>::new();
    for c in &w.cells {
        *counts.entry(c.genome).or_default() += 1;
    }
    let reference = w.genomes[&1].compiled.as_ref().unwrap();
    let mut signatures = BTreeMap::<u64, Vec<u64>>::new();
    let mut target_sums = [0.; crate::organism::STOCKS];
    let mut distances = BTreeMap::new();
    for (&id, &n) in &counts {
        let g = &w.genomes[&id];
        let compiled = g.compiled.as_ref().unwrap();
        let bucket = signatures.entry(compiled.sequence_fingerprint).or_default();
        // Hashes accelerate lookup; equality, not a hash alone, determines the count.
        if !bucket
            .iter()
            .any(|other| w.genomes[other].chromosomes == g.chromosomes)
        {
            bucket.push(id);
        }
        for (sum, target) in target_sums.iter_mut().zip(compiled.body) {
            *sum += n as f64 * target;
        }
        distances.insert(
            id,
            controller::genome_distance(
                &compiled.chromosome.behavior,
                &reference.chromosome.behavior,
            ),
        );
    }
    let n = w.cells.len() as f64;
    let relative: Vec<_> = target_sums
        .iter()
        .zip(reference.body)
        .map(|(sum, base)| {
            if n > 0. && base > 0. {
                Some(100. * sum / n / base)
            } else {
                None
            }
        })
        .collect();
    let body: Vec<_> = (0..crate::organism::STOCKS)
        .map(|i| {
            distribution(
                w.cells.iter().map(|c| c.body[i]).collect(),
                (reference.body[i] * 2.).max(0.01),
            )
        })
        .collect();
    let acquired = w
        .cells
        .iter()
        .map(|c| {
            controller::acquired_rms(
                &w.genomes[&c.genome]
                    .compiled
                    .as_ref()
                    .unwrap()
                    .chromosome
                    .behavior,
                &c.brain,
                &w.config,
            )
        })
        .collect();
    let mut tasks = [0usize; 256];
    for c in &w.cells {
        tasks[c.brain.task as usize] += 1;
    }
    json!({"distinctSequences":signatures.values().map(Vec::len).sum::<usize>(),
        "targetPercentFounder":relative, "body":body,
        "controllerDistance":distribution(w.cells.iter().map(|c| distances[&c.genome]).collect(),0.1),
        "acquiredChange":distribution(acquired,0.1), "tasks":tasks.as_slice(),
        "epoch":epoch(w)})
}

fn epoch(w: &World) -> Value {
    let Some(schedule) = &w.config.source_epochs else {
        return Value::Null;
    };
    let phase = (w.tick / schedule.phase_ticks) as usize % schedule.mixtures.len();
    json!({"phase":phase,"phaseTicks":schedule.phase_ticks,
        "nextTick":(w.tick / schedule.phase_ticks + 1) * schedule.phase_ticks,
        "mixture":schedule.mixtures[phase]})
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn reductions_distinguish_registered_ids_from_sequences_and_actual_bodies() {
        let mut w = World::new(
            101,
            crate::config::Config {
                width: 24.,
                height: 24.,
                founders: 2,
                source_count: 0,
                ..Default::default()
            },
        )
        .unwrap();
        let mut clone = w.genomes[&1].clone();
        clone.id = 2;
        w.genomes.insert(2, clone);
        w.cells[1].genome = 2;
        let before = w.snapshot().unwrap();
        let data = observe(&w);
        assert_eq!(data["distinctSequences"], 1);
        assert_eq!(data["targetPercentFounder"][0], 100.);
        assert_eq!(w.snapshot().unwrap(), before);
        let g = w.genomes.get_mut(&2).unwrap();
        g.chromosomes[0].physical[1] = 0.5;
        g.compile(&w.config, &w.chemistry);
        let data = observe(&w);
        assert_eq!(data["distinctSequences"], 2);
        assert_eq!(data["targetPercentFounder"][1], 125.);
        assert_eq!(data["body"][1]["median"], 0.08);
    }
}
