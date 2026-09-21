//! Population reductions only; no observation is an input to physics or reproduction.
use crate::{census::distribution, controller, world::World};
use serde_json::{Value, json};
use std::collections::BTreeMap;

pub(crate) struct Reduction {
    body: [Vec<f64>; crate::organism::STOCKS],
    targets: [f64; crate::organism::STOCKS],
    distances: Vec<f64>,
    acquired: Vec<f64>,
    tasks: [usize; 256],
    genomes: std::collections::BTreeSet<u64>,
    signatures: BTreeMap<u64, Vec<u64>>,
}
impl Reduction {
    pub fn new(count: usize) -> Self {
        Self {
            body: std::array::from_fn(|_| Vec::with_capacity(count)),
            targets: [0.; crate::organism::STOCKS],
            distances: Vec::with_capacity(count),
            acquired: Vec::with_capacity(count),
            tasks: [0; 256],
            genomes: Default::default(),
            signatures: Default::default(),
        }
    }
    pub fn add(
        &mut self,
        cell: &crate::organism::Cell,
        genotype: &crate::genetics::Genotype,
        reference: &crate::genetics::Compiled,
        w: &World,
    ) {
        let g = genotype.compiled.as_ref().unwrap();
        if self.genomes.insert(cell.genome) {
            let bucket = self.signatures.entry(g.sequence_fingerprint).or_default();
            // Fingerprints partition equality checks; they do not establish sequence identity.
            if !bucket
                .iter()
                .any(|id| w.genomes[id].chromosomes == genotype.chromosomes)
            {
                bucket.push(cell.genome);
            }
        }
        for ((column, sum), (actual, target)) in self
            .body
            .iter_mut()
            .zip(&mut self.targets)
            .zip(cell.body.into_iter().zip(g.body))
        {
            column.push(actual);
            *sum += target;
        }
        self.distances.push(g.controller_distance(reference));
        self.acquired.push(controller::acquired_rms(
            &g.chromosome.behavior,
            &cell.brain,
            &w.config,
        ));
        self.tasks[cell.brain.task as usize] += 1;
    }
    pub fn report(self, w: &World) -> Value {
        let reference = w.genomes[&1].compiled.as_ref().unwrap();
        let n = self.distances.len() as f64;
        let relative: Vec<_> = self
            .targets
            .into_iter()
            .zip(reference.body)
            .map(|(sum, base)| {
                if n > 0. && base > 0. {
                    Some(100. * sum / n / base)
                } else {
                    None
                }
            })
            .collect();
        let body: Vec<_> = self
            .body
            .into_iter()
            .zip(reference.body)
            .map(|(values, target)| distribution(values, (target * 2.).max(0.01)))
            .collect();
        json!({"distinctSequences":self.signatures.values().map(Vec::len).sum::<usize>(),
            "targetPercentFounder":relative, "body":body,
            "controllerDistance":distribution(self.distances,0.1),
            "acquiredChange":distribution(self.acquired,0.1), "tasks":self.tasks.as_slice(),
            "epoch":epoch(w)})
    }
}

#[cfg(test)]
pub fn observe(w: &World) -> Value {
    let mut reduction = Reduction::new(w.cells.len());
    let reference = w.genomes[&1].compiled.as_ref().unwrap();
    for cell in &w.cells {
        reduction.add(cell, &w.genomes[&cell.genome], reference, w);
    }
    reduction.report(w)
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
        assert_eq!(data["acquiredChange"]["median"], 0.);
        for cell in &mut w.cells {
            cell.brain.traces.fill(0.5);
        }
        let before = w.snapshot().unwrap();
        let updated = observe(&w);
        assert!(updated["acquiredChange"]["median"].as_f64().unwrap() > 0.);
        assert_eq!(updated["controllerDistance"], data["controllerDistance"]);
        assert_eq!(w.snapshot().unwrap(), before);
    }
}
