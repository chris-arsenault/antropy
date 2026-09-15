//! Optional causal-assay accounting. No physical rule reads these observations.
use crate::{
    accounting::Ledger,
    config::Config,
    field::Field,
    movement::distance,
    organism::{Cell, ChemicalFlows},
};
use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Founder {
    pub id: u64,
    pub first_uptake: Option<u64>,
    pub arrival: Option<u64>,
}

pub fn frame(w: &crate::world::World) -> serde_json::Value {
    let cells:Vec<_>=w.cells.iter().map(|c| {
        let g=w.genomes[&c.genome].compiled.as_ref().unwrap();
        let mut probe=c.clone();crate::sensing::observe(&mut probe,g,w.genomes[&c.machinery_genome].compiled.as_ref().unwrap(),&w.config,&w.field);
        let sites=w.field.stencil(c.x,c.y);
        let local:Vec<_>=(0..256).map(|s| w.field.sample(s,&sites)).collect();
        let impedance=w.field.scalar(&w.field.impedance,&sites);
        serde_json::json!({"cell":c,"localInputsNow":probe.inputs,"local":local,"impedance":impedance,"mobility":1./(1.+w.config.movement_impedance*impedance*impedance),"stressLoad":crate::sensing::stress_load(c,g,&w.config,&w.field,&w.chemistry)})
    }).collect();
    serde_json::json!({"tick":w.tick,"cells":cells})
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn observers_preserve_physics_and_capture_descendants_and_reaction_edges() {
        let mut observed = crate::diagnostics::nutrition(0.8, 2., true, false);
        observed.cells[0].body = observed.cells[0].body.map(|q| q * 2.);
        observed.cells[0].energy = 1.;
        crate::diagnostics::initialize(&mut observed);
        let mut control = observed.clone();
        observed.trace = Some(Trace::new(&observed.cells, Some([12., 12., 4.])));
        for _ in 0..16 {
            observed.step();
            control.step();
            frame(&observed);
        }
        assert_eq!(observed.snapshot().unwrap(), control.snapshot().unwrap());
        let trace = observed.trace.as_ref().unwrap();
        let g = &trace.groups[&1];
        assert_eq!(g.initial_cells, 1);
        assert!(g.ledger.divisions > 0);
        assert_eq!(g.ledger.births, observed.ledger.births);
        assert_eq!(g.living, observed.cells.len());
        assert!((g.ledger.flows.imported - observed.ledger.flows.imported).abs() < 1e-12);
        assert!(
            (g.reactions.iter().map(|r| r.amount).sum::<f64>() - observed.ledger.flows.reacted)
                .abs()
                < 1e-12
        );
        for s in 0..256 {
            assert!(
                (g.reactions
                    .iter()
                    .filter(|r| r.species == s)
                    .map(|r| r.amount)
                    .sum::<f64>()
                    - g.chemical.consumed[s])
                    .abs()
                    < 1e-12
            );
        }
        for w in [&mut observed, &mut control] {
            while let Some(c) = w.cells.pop() {
                w.release_cell(&c, crate::ancestry::Cause::ConstructedDeath);
            }
            w.step();
        }
        assert_eq!(observed.snapshot().unwrap(), control.snapshot().unwrap());
        let g = &observed.trace.as_ref().unwrap().groups[&1];
        assert_eq!(g.living, 0);
        assert_eq!(g.ledger.deaths, observed.ledger.deaths);
    }
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    pub lineage: u64,
    pub initial_genome: u64,
    pub initial_cells: usize,
    pub living: usize,
    pub founders: Vec<Founder>,
    pub ledger: Ledger,
    pub chemical: ChemicalFlows,
    pub organism_seconds: f64,
    pub damage_seconds: f64,
    pub slowed_seconds: f64,
    pub reactions: Vec<Reaction>,
}
#[derive(Clone, Debug, Serialize)]
pub struct Reaction {
    pub species: usize,
    pub product: usize,
    pub amount: f64,
}
#[derive(Clone, Debug)]
pub struct Trace {
    pub groups: BTreeMap<u64, Group>,
    pub study: Option<crate::study_trace::Study>,
    previous: BTreeMap<u64, ChemicalFlows>,
    target: Option<[f64; 3]>,
}
impl Trace {
    pub fn new(cells: &[Cell], target: Option<[f64; 3]>) -> Self {
        let mut trace = Self {
            groups: BTreeMap::new(),
            study: None,
            previous: BTreeMap::new(),
            target,
        };
        for c in cells {
            let g = trace.group(c);
            g.initial_cells += 1;
            g.living += 1;
            g.founders.push(Founder {
                id: c.id,
                first_uptake: None,
                arrival: None,
            });
            trace.previous.insert(c.id, c.chemical_flows.clone());
        }
        trace
    }
    fn group(&mut self, c: &Cell) -> &mut Group {
        self.groups.entry(c.lineage).or_insert_with(|| Group {
            lineage: c.lineage,
            initial_genome: c.genome,
            initial_cells: 0,
            living: 0,
            founders: vec![],
            ledger: Ledger::default(),
            chemical: ChemicalFlows::default(),
            organism_seconds: 0.,
            damage_seconds: 0.,
            slowed_seconds: 0.,
            reactions: vec![],
        })
    }
    pub fn before(&mut self, cells: &[Cell], config: &Config, field: &Field) {
        if let Some(study) = &mut self.study {
            study.before(cells, config, field);
        }
        for c in cells {
            let g = self.group(c);
            g.organism_seconds += config.dt;
            g.damage_seconds += c.damage * config.dt;
            let load = field.scalar(&field.impedance, &field.stencil(c.x, c.y));
            if 1. / (1. + config.movement_impedance * load * load) <= 0.8 {
                g.slowed_seconds += config.dt;
            }
        }
    }
    pub fn capture(&mut self, c: &Cell, tick: u64) {
        let previous = self.previous.remove(&c.id).unwrap_or_default();
        if let Some(study) = &mut self.study {
            study.capture(c, &previous);
        }
        let g = self.group(c);
        g.ledger.accumulate(&c.flows);
        for ((sum, now), before) in [
            &mut g.chemical.imported,
            &mut g.chemical.exported,
            &mut g.chemical.consumed,
            &mut g.chemical.produced,
        ]
        .into_iter()
        .zip([
            &c.chemical_flows.imported,
            &c.chemical_flows.exported,
            &c.chemical_flows.consumed,
            &c.chemical_flows.produced,
        ])
        .zip([
            &previous.imported,
            &previous.exported,
            &previous.consumed,
            &previous.produced,
        ]) {
            for ((total, n), p) in sum.iter_mut().zip(now).zip(before) {
                *total += n - p;
            }
        }
        if c.flows.imported > 0.
            && let Some(f) = g
                .founders
                .iter_mut()
                .find(|f| f.id == c.id && f.first_uptake.is_none())
        {
            f.first_uptake = Some(tick + 1);
        }
        self.previous.insert(c.id, c.chemical_flows.clone());
    }
    pub fn life(&mut self, c: &Cell, kind: &str, tick: u64) {
        if let Some(study) = &mut self.study {
            study.life(c, kind, tick);
        }
        let g = self.group(c);
        match kind {
            "birth" => g.ledger.births += 1,
            "division" => g.ledger.divisions += 1,
            _ => g.ledger.deaths += 1,
        }
    }
    pub fn reactions(&mut self, c: &Cell, work: &crate::metabolism::Work) {
        if let Some(study) = &mut self.study {
            study.reactions(c, work);
        }
        let g = self.group(c);
        for (species, product, amount) in work.reactions() {
            if let Some(edge) = g
                .reactions
                .iter_mut()
                .find(|r| r.species == species && r.product == product)
            {
                edge.amount += amount;
            } else {
                g.reactions.push(Reaction {
                    species,
                    product,
                    amount,
                });
            }
        }
    }
    pub fn finish(&mut self, cells: &[Cell], config: &Config, tick: u64) {
        for g in self.groups.values_mut() {
            g.living = 0;
        }
        let target = self.target;
        for c in cells {
            let g = self.group(c);
            g.living += 1;
            if target.is_some_and(|t| distance([c.x, c.y], [t[0], t[1]], config) <= t[2])
                && let Some(f) = g
                    .founders
                    .iter_mut()
                    .find(|f| f.id == c.id && f.arrival.is_none())
            {
                f.arrival = Some(tick);
            }
        }
        let living: std::collections::BTreeSet<_> = cells.iter().map(|c| c.id).collect();
        self.previous.retain(|id, _| living.contains(id));
    }
}
