//! Bounded immutable capability projections from the physical compiled coefficients.
use crate::{chemistry::Affinity, config::Config, genetics::Compiled};
use serde_json::{Value, json};

pub fn preferred(row: &[Affinity]) -> [f64; 2] {
    row.iter()
        .max_by(|a, b| a.value.total_cmp(&b.value).then(b.species.cmp(&a.species)))
        .map_or([0.; 2], |a| crate::chemistry::coordinate(a.species))
}

pub fn sites(g: &Compiled) -> Vec<Vec<Affinity>> {
    let op = &g.operators;
    op.receptors
        .iter()
        .chain(&op.transporters)
        .map(|row| row.as_ref().clone())
        .chain(op.enzymes.iter().map(|enzyme| {
            enzyme
                .conversions
                .iter()
                .map(|r| Affinity {
                    species: r.substrate,
                    value: r.binding,
                })
                .collect()
        }))
        .chain([op.membrane.as_ref().clone()])
        .collect()
}

pub fn report(g: &Compiled, c: &Config) -> Value {
    let m = &g.chromosome.chemistry;
    let sites: Vec<_> = sites(g)
        .iter()
        .enumerate()
        .map(|(site, row)| {
            let peak = row.iter().map(|a| a.value).fold(0., f64::max);
            // Scale first so tiny valid affinities do not underflow their squared breadth.
            let total = row
                .iter()
                .map(|a| a.value / peak.max(f64::MIN_POSITIVE))
                .sum::<f64>();
            let squares = row
                .iter()
                .map(|a| (a.value / peak.max(f64::MIN_POSITIVE)).powi(2))
                .sum::<f64>();
            json!({"site":site,"key":m.keys.as_ref().map(|k| k.site(site)),
            "active":!(8..16).contains(&site) || m.programs[site-8],
            "affinities":row.iter().map(|a| [a.species as f64,a.value]).collect::<Vec<_>>(),
            "peak":peak,"preferred":preferred(row),
            "effectiveBreadth":if squares > 0. { total*total/squares } else { 0. }})
        })
        .collect();
    let mut susceptibility = [1.; 256];
    for a in g.operators.membrane.iter() {
        susceptibility[a.species] -= (1. - c.susceptibility_floor) * a.value;
    }
    json!({"kind":if m.keys.is_some() {"complementarity"} else {"radial"},
        "lambda":c.binding_lambda,"sites":sites,"susceptibility":susceptibility.as_slice()})
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn selected_profiles_follow_keys_are_read_only_and_only_publish_with_genotype() {
        let mut w = crate::world::World::new(
            27,
            Config {
                founders: 2,
                source_count: 0,
                width: 24.,
                height: 24.,
                ..Config::ecology()
            },
        )
        .unwrap();
        let before = w.snapshot().unwrap();
        let result = crate::observation::inspect(&w, 1).unwrap();
        assert_eq!(result["recognition"]["kind"], "complementarity");
        assert_eq!(result["recognition"]["sites"].as_array().unwrap().len(), 17);
        let affinity = w.genomes[&1].compiled.as_ref().unwrap().operators.membrane[0].value;
        assert_eq!(
            result["recognition"]["susceptibility"][0],
            1. - 0.95 * affinity
        );
        assert_eq!(w.snapshot().unwrap(), before);
        let patch = crate::observation::selected(&w, 1, &json!({"genome":1})).unwrap();
        assert!(patch.get("recognition").is_none());
        let parent = w.genomes[&1].compiled.as_ref().unwrap().chromosome.clone();
        let g = w.genomes.get_mut(&1).unwrap();
        g.chromosomes[0].chemistry.keys.as_mut().unwrap().membrane =
            crate::binding::Key::target([15., 15.]);
        g.compile(&w.config, &w.chemistry);
        let compiled = g.compiled.as_ref().unwrap();
        assert!(crate::presentation::physical_distance(&parent, &compiled.chromosome) > 0.);
        assert_eq!(
            compiled.census_traits(w.config.birth_mass)[5..7],
            [15., 15.]
        );
        let changed = crate::observation::inspect(&w, 1).unwrap();
        assert_ne!(changed["recognition"], result["recognition"]);
    }
}
