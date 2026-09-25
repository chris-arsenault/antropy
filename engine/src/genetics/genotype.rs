use super::*;

impl Genotype {
    pub fn seed(c: &Config, chemistry: &Chemistry) -> Self {
        let allele = Chromosome {
            behavior: controller::seed(),
            physical: [0.; crate::organism::STOCKS],
            chemistry: Machinery::seed(chemistry, &c.source_species),
        };
        let mut g = Self {
            id: 1,
            parent: None,
            born: 0,
            learned: 0.,
            mutated: false,
            chromosomes: vec![allele; if c.ploidy == "diploid" { 2 } else { 1 }],
            compiled: None,
        };
        g.compile(c, chemistry);
        g
    }
    pub fn express(&self) -> Chromosome {
        let a = &self.chromosomes[0];
        let Some(b) = self.chromosomes.get(1) else {
            return a.clone();
        };
        Chromosome {
            behavior: controller::express(&a.behavior, &b.behavior),
            physical: std::array::from_fn(|i| (a.physical[i] + b.physical[i]) * 0.5),
            chemistry: Machinery::express(&a.chemistry, &b.chemistry),
        }
    }
    pub fn compile(&mut self, c: &Config, chemistry: &Chemistry) {
        let chromosome = self.express();
        let m = &chromosome.chemistry;
        let ratios = [
            1.,
            c.motor_ratio,
            c.storage_ratio,
            c.receptor_ratio,
            c.receptor_ratio,
            c.receptor_ratio,
            c.receptor_ratio,
            c.transporter_ratio,
            c.transporter_ratio,
            c.transporter_ratio,
            c.transporter_ratio,
            c.enzyme_ratio,
            c.enzyme_ratio,
            c.enzyme_ratio,
            c.enzyme_ratio,
            c.receptor_ratio,
            c.enzyme_ratio,
            c.enzyme_ratio,
            c.enzyme_ratio,
            c.enzyme_ratio,
        ];
        let ratios: Vec<_> = ratios.into_iter().chain([c.transporter_ratio; 2]).collect();
        let core = c.birth_mass * (chromosome.physical[0] as f64).exp();
        let mut body = std::array::from_fn(|i| {
            if i == 0 {
                core
            } else {
                core * ratios[i] * (1. + chromosome.physical[i] as f64).max(0.)
            }
        });
        for (slot, active) in m.programs.iter().enumerate() {
            if !active {
                body[crate::organism::enzyme_stock(slot)] = 0.;
            }
        }
        let operators = if let Some(previous) = &self.compiled {
            let mut op = previous.operators.clone();
            op.update(&previous.chromosome.chemistry, m, c, chemistry);
            op
        } else {
            crate::chemical_operators::Operators::compile(m, c, chemistry)
        };
        self.compiled = Some(Compiled {
            sequence_fingerprint: {
                use std::hash::{Hash, Hasher};
                let mut hash = std::collections::hash_map::DefaultHasher::new();
                postcard::to_stdvec(&self.chromosomes)
                    .unwrap()
                    .hash(&mut hash);
                hash.finish()
            },
            chromosome,
            body,
            operators,
            observation: Default::default(),
        });
    }
    pub fn inherit(
        &self,
        id: u64,
        tick: u64,
        state: &controller::State,
        rng: &mut Random,
        c: &Config,
        chemistry: &Chemistry,
    ) -> Self {
        let expressed = &self.compiled.as_ref().unwrap().chromosome.behavior;
        let mut acquired = self.chromosomes.clone();
        if c.learning == "plastic" {
            for a in &mut acquired {
                a.behavior =
                    controller::assimilate(&a.behavior, expressed, state, c.learning_retention);
            }
        }
        let learned =
            controller::genome_distance(&self.chromosomes[0].behavior, &acquired[0].behavior);
        if c.transmission == "selfing" {
            acquired = (0..2)
                .map(|_| Chromosome {
                    behavior: controller::recombine(
                        &acquired[0].behavior,
                        &acquired[1].behavior,
                        rng,
                        &c.crossover,
                    ),
                    physical: controller::combine(
                        &acquired[0].physical,
                        &acquired[1].physical,
                        rng,
                        &c.crossover,
                    )
                    .try_into()
                    .unwrap(),
                    chemistry: Machinery::combine(
                        &acquired[0].chemistry,
                        &acquired[1].chemistry,
                        rng,
                        &c.crossover,
                    ),
                })
                .collect();
        }
        let mut mutated = false;
        for a in &mut acquired {
            mutated |= controller::mutate(&mut a.behavior, rng, c);
            mutated |= controller::mutate_vector(
                &mut a.physical,
                rng,
                c.physical_mutation_rate,
                c.physical_mutation_scale,
                3.,
            );
            mutated |= a.chemistry.mutate(rng, c);
        }
        let mut child = Self {
            id,
            parent: Some(self.id),
            born: tick,
            learned,
            mutated,
            chromosomes: acquired,
            compiled: self.compiled.clone(),
        };
        child.compile(c, chemistry);
        child
    }
    pub fn validate(&self, c: &Config) -> Result<(), String> {
        if self.chromosomes.len() != if c.ploidy == "diploid" { 2 } else { 1 } {
            return Err("Invalid chromosome count".into());
        }
        for a in &self.chromosomes {
            controller::validate(&a.behavior)?;
            if a.physical.iter().any(|x| !x.is_finite() || x.abs() > 3.) {
                return Err("Invalid physical loci".into());
            }
            a.chemistry.validate()?;
            if !a.chemistry.programs.iter().any(|v| *v) {
                return Err("An enzyme template must remain".into());
            }
        }
        Ok(())
    }
}
