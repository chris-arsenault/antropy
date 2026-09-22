//! Small group reductions; no organism records leave the physical owner.
use crate::{organism::Cell, phenotype_activity::Flux, world::World};
use serde_json::{Value, json};

fn traits(body: &crate::organism::Body, membrane: [f64; 2]) -> [f64; 5] {
    let mass = body.iter().sum::<f64>();
    [
        mass,
        body[1] / mass.max(1e-30),
        body[2] / mass.max(1e-30),
        membrane[0],
        membrane[1],
    ]
}

#[derive(Default)]
struct Group {
    actual: [Vec<f64>; 7],
    target: [Vec<f64>; 5],
    light: f64,
    count: usize,
}
impl Group {
    fn add(&mut self, w: &World, cell: &Cell, light: f64) {
        let compiled = w.genomes[&cell.genome].compiled.as_ref().unwrap();
        let a = traits(&cell.body, cell.chemistry().membrane.point());
        let b = traits(
            &compiled.body,
            compiled.chromosome.chemistry.membrane.point(),
        );
        for (i, value) in a.into_iter().enumerate() {
            self.actual[i].push(value);
        }
        self.actual[5].push(cell.energy / cell.energy_capacity(&w.config).max(1e-30));
        self.actual[6].push(cell.damage);
        for (i, value) in b.into_iter().enumerate() {
            self.target[i].push(value);
        }
        self.light += light;
        self.count += 1;
    }
    fn report(self, flux: Option<&Flux>) -> Value {
        json!({"count":self.count,"actual":self.actual.map(distribution),
            "target":self.target.map(distribution),
            "illumination":if self.count == 0 { None } else { Some(self.light / self.count as f64) },
            "activity":flux.map(activity)})
    }
}

fn distribution(mut values: Vec<f64>) -> Option<[f64; 3]> {
    if values.is_empty() {
        return None;
    }
    values.sort_by(f64::total_cmp);
    Some([0.1, 0.5, 0.9].map(|p| values[(p * (values.len() - 1) as f64).round() as usize]))
}

fn species(values: &[f64; 256]) -> Value {
    let mut rows: Vec<_> = values
        .iter()
        .copied()
        .enumerate()
        .filter(|(_, q)| *q > 0.)
        .collect();
    rows.sort_by(|a, b| b.1.total_cmp(&a.1).then(a.0.cmp(&b.0)));
    let total: f64 = values.iter().sum();
    rows.truncate(8);
    let shown: f64 = rows.iter().map(|r| r.1).sum();
    json!({"rows":rows,"total":total,"other":(total-shown).max(0.)})
}

pub fn activity(f: &Flux) -> Value {
    json!({"imports":species(&f.imports),"exports":species(&f.exports),
        "flows":f.ledger.flows,"overflow":f.ledger.overflow_heat,
        "division":f.ledger.division_heat,"organismSeconds":f.organism_seconds})
}

pub fn report(w: &World) -> Value {
    let Some(o) = &w.observer else {
        return Value::Null;
    };
    let mut groups: [Group; 3] = std::array::from_fn(|_| Group::default());
    let mut light = crate::illumination::Illumination::default();
    light.prepare(w.seed, w.tick, &w.config, w.field.nx, w.field.ny);
    for cell in &w.cells {
        let local = light.sample(&crate::footprint::sites(cell, &w.config, &w.field));
        for (index, includes) in [true, o.selected(cell), o.pinned(cell.id)]
            .into_iter()
            .enumerate()
        {
            if includes {
                groups[index].add(w, cell, local);
            }
        }
    }
    let mut index = 0;
    let reports = groups.map(|group| {
        let result = group.report(o.active().then_some(&o.interval().groups[index]));
        index += 1;
        result
    });
    json!({"tick":w.tick,"selection":o.selection,"highlight":o.highlight,
        "window":o.coverage(w.config.dt),"groups":reports,
        "pin":o.pin.as_ref().map(|p| json!({"id":p.id,"label":p.label,"started":p.started,"roots":p.roots.len()}))})
}

pub fn web(w: &World, query: &crate::chemical_roles::Query) -> Value {
    let interval = w
        .observer
        .as_ref()
        .filter(|o| o.active())
        .map(|o| o.interval());
    let flux = interval.map(|v| &v.groups[0]);
    let mut edges: Vec<_> = interval.map_or_else(Vec::new, |_| {
        w.observed_reactions(0)
            .iter()
            .copied()
            .enumerate()
            .filter(|(_, amount)| *amount > 0.)
            .filter(|&(k, _)| query.focus.is_none_or(|s| k / 256 == s || k % 256 == s))
            .collect()
    });
    edges.sort_by(|a, b| b.1.total_cmp(&a.1).then(a.0.cmp(&b.0)));
    let pairs = edges.len();
    let offset = query.offset.min(pairs.saturating_sub(1) / 64 * 64);
    let rows: Vec<_> = edges
        .into_iter()
        .skip(offset)
        .take(64)
        .map(|(k, amount)| {
            json!({"input":k/256,"output":k%256,"amount":amount,
            "cells":0,"primary":0,"capacity":0})
        })
        .collect();
    json!({"tick":w.tick,"population":w.cells.len(),"assigned":0,"unassigned":0,
        "mode":"measured","focus":query.focus,"offset":offset,"pairs":pairs,
        "rows":rows,"sources":crate::chemical_roles::source_species(w),"activity":flux.map(activity),
        "window":w.observer.as_ref().map(|o| o.coverage(w.config.dt))})
}
