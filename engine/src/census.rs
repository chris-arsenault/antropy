//! Reduced observer data. Grouping and trait partitions never enter the physical kernel.
use crate::{
    movement::{Spatial, delta, distance_squared},
    world::World,
};
use serde_json::{Value, json};
use std::collections::BTreeMap;
const REACH: f64 = 6.;
const MINIMUM: usize = 3;

fn groups(w: &World) -> Vec<Vec<usize>> {
    let index = Spatial::for_observation(&w.config, &w.cells, REACH);
    let mut neighbors = Vec::with_capacity(w.cells.len());
    for c in &w.cells {
        let mut near = vec![];
        index.near(c.x, c.y, &mut near);
        near.retain(|&i| {
            distance_squared([c.x, c.y], [w.cells[i].x, w.cells[i].y], &w.config) <= REACH * REACH
        });
        near.sort_unstable();
        neighbors.push(near);
    }
    let mut assigned = vec![false; w.cells.len()];
    let mut result = vec![];
    for i in 0..w.cells.len() {
        if assigned[i] || neighbors[i].len() < MINIMUM {
            continue;
        }
        let mut group = vec![i];
        assigned[i] = true;
        let mut cursor = 0;
        while cursor < group.len() {
            let n = &neighbors[group[cursor]];
            if n.len() >= MINIMUM {
                for &j in n {
                    if !assigned[j] {
                        assigned[j] = true;
                        group.push(j);
                    }
                }
            }
            cursor += 1;
        }
        result.push(group);
    }
    result
}
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
fn values(w: &World, genome: u64) -> [f64; 9] {
    let g = w.genomes[&genome].compiled.as_ref().unwrap();
    let b = g.body;
    let m = &g.chromosome.chemistry;
    let mut import = 0.;
    let mut x = 0.;
    let mut y = 0.;
    for (i, t) in m.transporters.iter().enumerate() {
        {
            import += b[7 + i];
            x += b[7 + i] * t.x;
            y += b[7 + i] * t.y;
        }
    }
    [
        100. * b[0] / w.config.birth_mass,
        100. * b[1] / b[0],
        100. * b[3..7].iter().sum::<f64>() / b[0],
        100. * import / b[0],
        100. * (0..crate::organism::MAX_ENZYMES)
            .map(|s| b[crate::organism::enzyme_stock(s)])
            .sum::<f64>()
            / b[0],
        m.membrane.x,
        m.membrane.y,
        x / import.max(1e-30),
        y / import.max(1e-30),
    ]
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
    let mut traits = BTreeMap::new();
    for c in &w.cells {
        traits
            .entry(c.genome)
            .or_insert_with(|| values(w, c.genome));
    }
    let distributions: Vec<_> = [200., 16., 16., 32., 32., 15., 15., 15., 15.]
        .iter()
        .enumerate()
        .map(|(i, &max)| distribution(w.cells.iter().map(|c| traits[&c.genome][i]).collect(), max))
        .collect();
    let mut membrane = [0usize; 256];
    let mut families = BTreeMap::<u64, usize>::new();
    let mut lineages = BTreeMap::<u64, usize>::new();
    for c in &w.cells {
        let t = traits[&c.genome];
        membrane[(t[5].round() as usize) * 16 + t[6].round() as usize] += 1;
        let mut id = c.id;
        for _ in 0..c.generation % 4 {
            if let Some(parent) = w.ancestry[id as usize - 1].parent() {
                id = parent;
            }
        }
        *families.entry(id).or_default() += 1;
        *lineages.entry(c.lineage).or_default() += 1;
    }
    let efforts: Vec<_> = (0..7)
        .map(|i| {
            distribution(
                w.cells
                    .iter()
                    .map(|c| match i {
                        0 => c.action.swim.abs(),
                        1 => c.action.turn.abs(),
                        2 => c.action.repair,
                        _ => c.action.transport[i - 3],
                    })
                    .collect(),
                1.,
            )
        })
        .collect();
    json!({"tick":w.tick,"traits":distributions,"efforts":efforts,"membrane":membrane.as_slice(),"families":top(families),"lineages":top(lineages),"familyProfiles":crate::genealogy::profiles(w),
        "evolution":crate::population_diagnostics::observe(w)})
}
pub fn observe(w: &World, v: &Value) -> Result<Value, String> {
    let pairs: Vec<(u64, u64)> =
        serde_json::from_value(v.get("origins").cloned().unwrap_or(json!([])))
            .map_err(|e| e.to_string())?;
    if pairs.len() > w.config.max_population {
        return Err("Too many observer origins".into());
    }
    let known: BTreeMap<_, _> = pairs.into_iter().collect();
    let regions: Vec<_> = groups(w).iter().map(|g| region(w, g, &known)).collect();
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
}
