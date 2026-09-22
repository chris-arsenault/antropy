//! Reduced observer data. Grouping and trait partitions never enter the physical kernel.
use crate::{movement::delta, world::World};
use serde_json::{Value, json};
use std::collections::BTreeMap;
#[path = "census_groups.rs"]
mod grouping;
#[path = "census_reduction.rs"]
mod reduction;
fn origin(w: &World, mut id: u64, known: &BTreeMap<u64, u64>) -> Option<u64> {
    loop {
        if let Some(&region) = known.get(&id) {
            return Some(region);
        }
        id = w.ancestry.get(id.checked_sub(1)? as usize)?.parent()?;
    }
}
fn region(w: &World, indices: &[usize], origins: &BTreeMap<u64, u64>) -> Value {
    let first = &w.cells[indices[0]];
    let mut x = 0.;
    let mut y = 0.;
    let mut membrane = 0.;
    let mut votes = BTreeMap::<u64, usize>::new();
    let mut lineages = BTreeMap::<u64, usize>::new();
    let mut youngest = None;
    for &i in indices {
        let c = &w.cells[i];
        x += delta(c.x - first.x, w.config.width);
        y += delta(c.y - first.y, w.config.height);
        membrane += w.genomes[&c.genome]
            .compiled
            .as_ref()
            .unwrap()
            .chromosome
            .chemistry
            .membrane
            .x;
        if let Some(id) = origin(w, c.id, origins) {
            *votes.entry(id).or_default() += 1;
        }
        *lineages.entry(c.lineage).or_default() += 1;
        if c.parent.is_some() {
            youngest = Some(youngest.unwrap_or(0).max(c.born));
        }
    }
    let count = indices.len() as f64;
    json!({"x":(first.x+x/count).rem_euclid(w.config.width),"y":(first.y+y/count).rem_euclid(w.config.height),
        "membraneX":membrane/count,"members":indices.iter().map(|&i| w.cells[i].id).collect::<Vec<_>>(),
        "votes":votes.into_iter().collect::<Vec<_>>(),"lineages":lineages.into_iter().collect::<Vec<_>>(),"youngestDescendant":youngest})
}
pub(crate) fn distribution(mut samples: Vec<f64>, ceiling: f64) -> Value {
    samples.sort_by(f64::total_cmp);
    let ceiling = ceiling.max(samples.last().copied().unwrap_or(ceiling));
    let mut bins = [0usize; 10];
    for &x in &samples {
        bins[((x / ceiling * 10.) as usize).min(9)] += 1;
    }
    let quantile = |p: f64| {
        if samples.is_empty() {
            None
        } else {
            Some(samples[((samples.len() - 1) as f64 * p).round() as usize])
        }
    };
    json!({"ceiling":ceiling,"bins":bins,"p10":quantile(0.1),"median":quantile(0.5),"p90":quantile(0.9)})
}
fn top(counts: BTreeMap<u64, usize>) -> Value {
    let total = counts.len();
    let mut rows: Vec<_> = counts.into_iter().collect();
    rows.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    rows.truncate(64);
    json!({"total":total,"rows":rows})
}
fn population(w: &World) -> Value {
    let reduced = reduction::Population::new(w);
    let ceilings = [200., 16., 16., 32., 32., 15., 15., 15., 15.];
    let traits: Vec<_> = reduced
        .traits
        .into_iter()
        .zip(ceilings)
        .map(|(values, ceiling)| distribution(values, ceiling))
        .collect();
    let efforts = reduced.efforts.map(|values| distribution(values, 1.));
    json!({"tick":w.tick,"traits":traits,"efforts":efforts,
        "membrane":reduced.membrane.as_slice(),"families":top(reduced.families),
        "lineages":top(reduced.lineages),
        "familyProfiles":crate::genealogy::profiles_from(w,reduced.profiles),
        "evolution":reduced.evolution.report(w)})
}
pub fn observe(w: &World, v: &Value) -> Result<Value, String> {
    let pairs: Vec<(u64, u64)> =
        serde_json::from_value(v.get("origins").cloned().unwrap_or(json!([])))
            .map_err(|e| e.to_string())?;
    if pairs.len() > w.ancestry.len() {
        return Err("Too many observer origins".into());
    }
    let known: BTreeMap<_, _> = pairs.into_iter().collect();
    let regions: Vec<_> = grouping::groups(w)
        .iter()
        .map(|g| region(w, g, &known))
        .collect();
    let origins: Vec<_> = w
        .cells
        .iter()
        .filter_map(|c| origin(w, c.id, &known).map(|r| (c.id, r)))
        .collect();
    Ok(json!({"tick":w.tick,"regions":regions,"origins":origins,"population":population(w)}))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn census_is_read_only_and_groups_periodically_without_migrant_bridges() {
        let mut w = World::new(
            101,
            crate::config::Config {
                width: 48.,
                height: 24.,
                founders: 7,
                source_count: 0,
                ..Default::default()
            },
        )
        .unwrap();
        for (c, x) in w.cells.iter_mut().zip([47., 0., 1., 23., 24., 25., 12.]) {
            c.x = x;
            c.y = 12.;
        }
        let before = w.snapshot().unwrap();
        let observed = observe(&w, &json!({})).unwrap();
        assert_eq!(observed["regions"].as_array().unwrap().len(), 2);
        assert_eq!(
            observed["regions"][0]["members"].as_array().unwrap().len(),
            3
        );
        assert_eq!(w.snapshot().unwrap(), before);
        assert_eq!(
            observed["population"]["membrane"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_u64().unwrap())
                .sum::<u64>(),
            7
        );
    }

    #[test]
    fn shared_population_columns_preserve_evolution_and_family_reports_after_membership_changes() {
        let mut w = World::new(27, crate::config::Config::default()).unwrap();
        w.cells[0].damage = 0.4;
        w.cells[0].body[1] *= 0.5;
        w.cells[0].brain.traces.fill(0.25);
        for reduced in [false, true] {
            if reduced {
                w.cells.reverse();
                w.cells.truncate(w.cells.len() / 2);
            }
            let before = w.snapshot().unwrap();
            let result = population(&w);
            assert_eq!(
                result["evolution"],
                crate::population_diagnostics::observe(&w)
            );
            assert_eq!(result["familyProfiles"], crate::genealogy::profiles(&w));
            for key in ["traits", "efforts"] {
                for distribution in result[key].as_array().unwrap() {
                    let n: u64 = distribution["bins"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|v| v.as_u64().unwrap())
                        .sum();
                    assert_eq!(n, w.cells.len() as u64);
                }
            }
            assert_eq!(w.snapshot().unwrap(), before);
        }
    }
}
