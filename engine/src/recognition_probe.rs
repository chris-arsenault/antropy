//! Read-only birth neighborhoods use the real inheritance and repertoire operators.
use crate::{genetics::Genotype, random::Random, world::World};
use serde_json::{Value, json};

pub fn capabilities(g: &Genotype, w: &World) -> Value {
    let c = g.compiled.as_ref().unwrap();
    let routes: Vec<_> = c
        .operators
        .enzymes
        .iter()
        .enumerate()
        .flat_map(|(slot, e)| {
            e.conversions.iter().map(move |r| {
                json!({"slot":slot,"substrate":r.substrate,
            "binding":r.binding,"catalytic":r.catalytic,
            "products":r.products.iter().map(|p| [p.species as f64,p.weight]).collect::<Vec<_>>()})
            })
        })
        .collect();
    json!({"recognition":c.recognition(&w.config),"body":c.body,
        "chemistry":c.chromosome.chemistry,"routes":routes})
}

pub fn run(w: &World, v: &Value) -> Result<Value, String> {
    if v.get("singleLocus").and_then(Value::as_bool) == Some(true) {
        return single_locus(w, v);
    }
    let cell = v
        .get("cell")
        .and_then(Value::as_u64)
        .ok_or("Missing probe cell")?;
    let cell = w
        .cells
        .iter()
        .find(|c| c.id == cell)
        .ok_or("Probe cell is not alive")?;
    let count = v
        .get("count")
        .and_then(Value::as_u64)
        .ok_or("Missing probe count")?;
    if !(1..=32).contains(&count) {
        return Err("Probe count must be 1..32".into());
    }
    let seed = v
        .get("seed")
        .and_then(Value::as_u64)
        .ok_or("Missing probe seed")?;
    let parent = &w.genomes[&cell.genome];
    let mut rng = Random::new(seed);
    let children: Vec<_> = (0..count)
        .map(|i| {
            let mut child = parent.inherit(
                i + 1,
                w.tick,
                &cell.brain,
                &mut rng,
                &w.config,
                &w.chemistry,
            );
            crate::genetics::repertoire::mutate(&mut child, &mut rng, &w.config, &w.chemistry);
            capabilities(&child, w)
        })
        .collect();
    Ok(json!({"ticksAdvanced":0,"tick":w.tick,"seed":seed,
        "parent":capabilities(parent,w),"children":children,
        "limitations":"Independent hypothetical births; no installation, resource transfer or fitness prediction"}))
}

fn single_locus(w: &World, v: &Value) -> Result<Value, String> {
    let id = v
        .get("cell")
        .and_then(Value::as_u64)
        .ok_or("Missing probe cell")?;
    let cell = w
        .cells
        .iter()
        .find(|c| c.id == id)
        .ok_or("Probe cell is not alive")?;
    let count = v
        .get("count")
        .and_then(Value::as_u64)
        .ok_or("Missing probe count")?;
    if !(1..=128).contains(&count) {
        return Err("Single-locus count must be 1..128".into());
    }
    let seed = v
        .get("seed")
        .and_then(Value::as_u64)
        .ok_or("Missing probe seed")?;
    let compiled = w.genomes[&cell.genome].compiled.as_ref().unwrap();
    let keys = compiled
        .chromosome
        .chemistry
        .keys
        .as_ref()
        .ok_or("Probe requires keys")?;
    let mut rng = Random::new(seed);
    let events: Vec<_> = (0..count)
        .map(|_| {
            let site = (rng.unit() * 17.) as usize;
            let locus = (rng.unit() * 9.) as usize;
            let before = keys.site(site);
            let mut after = before;
            after.mutate_locus(locus, &mut rng, &w.config);
            let active = site < 8 || site == 16 || compiled.chromosome.chemistry.programs[site - 8];
            let profile = |key: crate::binding::Key| {
                key.compile(w.config.binding_lambda)
                    .iter()
                    .map(|a| [a.species as f64, a.value])
                    .collect::<Vec<_>>()
            };
            json!({"site":site,"locus":locus,"active":active,"before":before,"after":after,
            "affinityBefore":profile(before),"affinityAfter":profile(after)})
        })
        .collect();
    Ok(json!({"ticksAdvanced":0,"seed":seed,"events":events,
        "limitations":"One uniformly selected scalar locus of the expressed key, conditional on a mutation event; no whole-birth or fitness prediction. Sparse profiles use production compilation."}))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn probe_matches_birth_operators_without_changing_world_or_random_streams() {
        let w = World::new(
            27,
            crate::config::Config {
                width: 24.,
                height: 24.,
                founders: 4,
                source_count: 4,
                ..crate::config::Config::ecology()
            },
        )
        .unwrap();
        let before = w.snapshot().unwrap();
        let result = run(&w, &json!({"cell":1,"count":2,"seed":101})).unwrap();
        let parent = &w.genomes[&w.cells[0].genome];
        let mut rng = Random::new(101);
        for i in 0..2 {
            let mut g = parent.inherit(
                i + 1,
                w.tick,
                &w.cells[0].brain,
                &mut rng,
                &w.config,
                &w.chemistry,
            );
            crate::genetics::repertoire::mutate(&mut g, &mut rng, &w.config, &w.chemistry);
            g.validate(&w.config).unwrap();
            assert_eq!(result["children"][i as usize], capabilities(&g, &w));
        }
        assert_eq!(before, w.snapshot().unwrap());
        assert!(run(&w, &json!({"cell":1,"count":33,"seed":101})).is_err());
        let events = run(
            &w,
            &json!({"cell":1,"count":128,"seed":101,"singleLocus":true}),
        )
        .unwrap();
        for event in events["events"].as_array().unwrap() {
            let a: crate::binding::Key = serde_json::from_value(event["before"].clone()).unwrap();
            let b: crate::binding::Key = serde_json::from_value(event["after"].clone()).unwrap();
            let changed = a
                .weights
                .iter()
                .zip(b.weights)
                .filter(|(x, y)| **x != *y)
                .count()
                + usize::from(a.bias != b.bias);
            assert!(changed <= 1);
        }
        assert_eq!(before, w.snapshot().unwrap());
    }
}
