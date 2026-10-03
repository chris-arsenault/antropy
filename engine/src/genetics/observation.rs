//! Derived immutable-genotype observations. Acquired state and funded bodies are never cached here.
use super::Compiled;
use std::sync::{Arc, OnceLock, Weak};

#[derive(Clone, Debug, Default)]
pub(super) struct Cache {
    identity: Arc<()>,
    distance: OnceLock<(Weak<()>, f64)>,
    traits: OnceLock<[f64; 9]>,
    recognition: Arc<OnceLock<serde_json::Value>>,
}

impl Compiled {
    pub(crate) fn recognition(&self, c: &crate::config::Config) -> &serde_json::Value {
        self.observation
            .recognition
            .get_or_init(|| crate::recognition_observation::report(self, c))
    }
    pub(crate) fn controller_distance(&self, reference: &Self) -> f64 {
        if Arc::ptr_eq(&self.observation.identity, &reference.observation.identity) {
            return 0.;
        }
        if let Some((identity, distance)) = self.observation.distance.get()
            && identity.as_ptr() == Arc::as_ptr(&reference.observation.identity)
        {
            return *distance;
        }
        let distance = crate::controller::genome_distance(
            &self.chromosome.behavior,
            &reference.chromosome.behavior,
        );
        let _ = self
            .observation
            .distance
            .set((Arc::downgrade(&reference.observation.identity), distance));
        distance
    }

    pub(crate) fn census_traits(&self, birth_mass: f64) -> [f64; 9] {
        let mut traits = *self.observation.traits.get_or_init(|| {
            let b = self.body;
            let membrane = crate::recognition_observation::preferred(&self.operators.membrane);
            let import = b[7..11].iter().sum::<f64>();
            let weighted = |axis: usize| {
                self.operators
                    .transporters
                    .iter()
                    .enumerate()
                    .map(|(i, t)| b[7 + i] * crate::recognition_observation::preferred(t)[axis])
                    .sum::<f64>()
                    / import.max(1e-30)
            };
            [
                100. * b[0],
                100. * b[1] / b[0],
                100. * b[3..7].iter().sum::<f64>() / b[0],
                100. * import / b[0],
                100. * (0..crate::organism::MAX_ENZYMES)
                    .map(|s| b[crate::organism::enzyme_stock(s)])
                    .sum::<f64>()
                    / b[0],
                membrane[0],
                membrane[1],
                weighted(0),
                weighted(1),
            ]
        });
        // Configuration is not owned by the compiled genotype.
        traits[0] /= birth_mass;
        traits
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn compilation_invalidates_cached_distance_for_owner_and_reference_changes() {
        let world = crate::world::World::new(27, crate::config::Config::default()).unwrap();
        let mut reference = world.genomes[&1].clone();
        let mut changed = reference.clone();
        changed.chromosomes[0].behavior.weights[0] += 1.;
        changed.compile(&world.config, &world.chemistry);
        let g = changed.compiled.as_ref().unwrap();
        let base = reference.compiled.as_ref().unwrap();
        let expected =
            crate::controller::genome_distance(&g.chromosome.behavior, &base.chromosome.behavior);
        assert!(expected > 0.);
        assert_eq!(g.controller_distance(base), expected);
        assert!(g.observation.distance.get().is_some());
        assert_eq!(g.controller_distance(base), expected);

        reference.chromosomes = changed.chromosomes.clone();
        reference.compile(&world.config, &world.chemistry);
        assert_eq!(
            g.controller_distance(reference.compiled.as_ref().unwrap()),
            0.
        );
        changed.chromosomes[0].behavior.weights[0] += 1.;
        changed.compile(&world.config, &world.chemistry);
        let g = changed.compiled.as_ref().unwrap();
        assert!(g.observation.distance.get().is_none());
        assert!(g.controller_distance(reference.compiled.as_ref().unwrap()) > 0.);
    }
}
