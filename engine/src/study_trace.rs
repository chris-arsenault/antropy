//! Optional streamed assay facts, drained by the existing headless study writer.
use crate::{
    config::Config,
    field::Field,
    genetics::Genotype,
    organism::{Cell, ChemicalFlows},
};
use serde::Serialize;
use serde_json::{Value, json};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize)]
struct FlowKey {
    cell: u64,
    lineage: u64,
    genome: u64,
    channel: &'static str,
    species: Option<usize>,
    product: Option<usize>,
}
#[derive(Clone, Debug, Default, Serialize)]
struct Exposure {
    cell: u64,
    lineage: u64,
    genome: u64,
    seconds: f64,
    slowed_seconds: f64,
    impaired_seconds: f64,
    damage_seconds: f64,
    swim_seconds: f64,
    turn_seconds: f64,
    source_read_seconds: f64,
}
#[derive(Clone, Debug, Default)]
pub struct Study {
    start: u64,
    flows: BTreeMap<FlowKey, f64>,
    exposure: BTreeMap<(u64, u64), Exposure>,
    life: Vec<Value>,
    genomes: Vec<Genotype>,
    known: BTreeSet<u64>,
}
impl Study {
    pub fn new(tick: u64) -> Self {
        Self {
            start: tick,
            ..Default::default()
        }
    }
    pub fn before(&mut self, cells: &[Cell], config: &Config, field: &Field) {
        for c in cells {
            let r = self
                .exposure
                .entry((c.id, c.genome))
                .or_insert_with(|| Exposure {
                    cell: c.id,
                    lineage: c.lineage,
                    genome: c.genome,
                    ..Default::default()
                });
            let dt = config.dt;
            let load = field.medium_load(&field.stencil(c.x, c.y));
            r.seconds += dt;
            r.slowed_seconds +=
                f64::from(crate::movement::mobility(load, config.movement_impedance) <= 0.8) * dt;
            r.impaired_seconds += f64::from(c.damage >= 0.2) * dt;
            r.damage_seconds += c.damage * dt;
            r.swim_seconds += c.action.swim * dt;
            r.turn_seconds += c.action.turn.abs() * dt;
            r.source_read_seconds += (c.inputs[0] + c.inputs[4]) as f64 * dt;
        }
    }
    pub fn flow(
        &mut self,
        c: &Cell,
        channel: &'static str,
        species: Option<usize>,
        product: Option<usize>,
        amount: f64,
    ) {
        if amount != 0. {
            *self
                .flows
                .entry(FlowKey {
                    cell: c.id,
                    lineage: c.lineage,
                    genome: c.genome,
                    channel,
                    species,
                    product,
                })
                .or_default() += amount;
        }
    }
    pub fn capture(&mut self, c: &Cell, previous: &ChemicalFlows) {
        for (channel, now, before) in [
            ("imported", &c.chemical_flows.imported, &previous.imported),
            ("exported", &c.chemical_flows.exported, &previous.exported),
        ] {
            for (s, (n, p)) in now.iter().zip(before.iter()).enumerate() {
                self.flow(c, channel, Some(s), None, n - p);
            }
        }
        let f = &c.flows;
        for (name, amount) in [
            ("motors", f.motors),
            ("transport", f.transport),
            ("reaction_heat", f.reaction_heat),
            ("maintenance", f.maintenance),
            ("learning", f.learning),
            ("construction", f.construction),
            ("constructed", f.constructed),
            ("repair", f.repair),
            ("damage", f.damage),
            ("repaired", f.repaired),
            ("captured", f.captured),
            ("externalWork", f.external_work),
            ("distance", f.distance),
        ] {
            self.flow(c, name, None, None, amount);
        }
    }
    pub fn reactions(&mut self, c: &Cell, work: &crate::metabolism::Work) {
        for (s, p, q) in work.reactions() {
            self.flow(c, "reacted", Some(s), Some(p), q);
        }
    }
    pub fn life(&mut self, c: &Cell, kind: &str, tick: u64) {
        self.life.push(json!({"tick":tick,"cell":c.id,"parent":c.parent,"lineage":c.lineage,"genome":c.genome,"kind":kind,"x":c.x,"y":c.y}));
    }
    pub fn genomes(&mut self, genomes: &crate::genetics::GenotypeStore) {
        let mut entries: Vec<_> = genomes.iter().collect();
        entries.sort_unstable_by_key(|(id, _)| **id);
        for (id, g) in entries {
            if self.known.insert(*id) {
                self.genomes.push(g.clone());
            }
        }
    }
    pub fn drain(&mut self, tick: u64) -> Value {
        let flows: Vec<_> = std::mem::take(&mut self.flows)
            .into_iter()
            .map(|(key, amount)| {
                let mut row = serde_json::to_value(key).unwrap();
                row["amount"] = json!(amount);
                row["start_tick"] = json!(self.start);
                row["end_tick"] = json!(tick);
                row
            })
            .collect();
        let exposure: Vec<_> = std::mem::take(&mut self.exposure)
            .into_values()
            .map(|r| {
                let mut row = serde_json::to_value(r).unwrap();
                row["start_tick"] = json!(self.start);
                row["end_tick"] = json!(tick);
                row
            })
            .collect();
        self.start = tick;
        json!({"flows":flows,"exposure":exposure,"life":std::mem::take(&mut self.life),"genomes":std::mem::take(&mut self.genomes)})
    }
}
