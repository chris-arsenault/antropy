use crate::{
    chemistry::{self, Affinity, Chemistry},
    config::Config,
    controller,
    random::Random,
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
pub struct Target {
    pub x: f64,
    pub y: f64,
}
impl Target {
    pub fn point(self) -> [f64; 2] {
        [self.x, self.y]
    }
    pub fn species(s: usize) -> Self {
        let [x, y] = chemistry::coordinate(s);
        Self { x, y }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
pub struct Transporter {
    pub x: f64,
    pub y: f64,
    pub export: bool,
}
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
pub struct Enzyme {
    pub x: f64,
    pub y: f64,
    pub dx: i8,
    pub dy: i8,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Machinery {
    pub receptors: [Target; 4],
    pub transporters: [Transporter; 4],
    pub enzymes: [Enzyme; 4],
    pub membrane: Target,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Chromosome {
    pub behavior: controller::Genome,
    pub physical: [f32; 15],
    pub chemistry: Machinery,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Genotype {
    pub id: u64,
    pub parent: Option<u64>,
    pub born: u64,
    pub learned: f64,
    pub mutated: bool,
    pub chromosomes: Vec<Chromosome>,
    #[serde(skip)]
    pub compiled: Option<Compiled>,
}
#[derive(Clone, Debug)]
pub struct Edge {
    pub substrate: usize,
    pub product: usize,
    pub affinity: f64,
    pub energy: f64,
    pub heat: f64,
}
#[derive(Clone, Debug)]
pub struct Compiled {
    pub sequence_fingerprint: u64,
    pub chromosome: Chromosome,
    pub body: [f64; 15],
    pub receptors: [Vec<Affinity>; 4],
    pub transporters: [Vec<Affinity>; 4],
    pub enzymes: [Vec<Edge>; 4],
    pub membrane: Vec<Affinity>,
}

impl Machinery {
    pub fn seed(chemistry: &Chemistry, sources: &[usize]) -> Self {
        let from = [
            Target::species(sources[0]),
            Target::species(*sources.get(1).unwrap_or(&sources[0])),
        ];
        let to = Target::species(chemistry.decomposition);
        let stress = Target::species(
            chemistry
                .properties
                .iter()
                .position(|p| p.stress >= 0.8)
                .unwrap(),
        );
        Self {
            receptors: [from[0], from[1], to, stress],
            transporters: std::array::from_fn(|i| {
                let p = if i < 2 { from[i] } else { to };
                Transporter {
                    x: p.x,
                    y: p.y,
                    export: i >= 2,
                }
            }),
            enzymes: std::array::from_fn(|i| {
                let p = from[i % 2];
                Enzyme {
                    x: p.x,
                    y: p.y,
                    dx: (to.x - p.x) as i8,
                    dy: (to.y - p.y) as i8,
                }
            }),
            membrane: to,
        }
    }
    fn mutate(&mut self, rng: &mut Random, c: &Config) {
        let mut point = |x: &mut f64, y: &mut f64| {
            for v in [x, y] {
                if rng.unit() < c.physical_mutation_rate {
                    let n = if c.mutation_kind == "gaussian" {
                        rng.normal()
                    } else {
                        rng.signed()
                    };
                    *v = chemistry::reflect(*v + n * c.physical_mutation_scale) as f32 as f64;
                }
            }
        };
        for p in &mut self.receptors {
            point(&mut p.x, &mut p.y);
        }
        for p in &mut self.transporters {
            point(&mut p.x, &mut p.y);
        }
        for p in &mut self.enzymes {
            point(&mut p.x, &mut p.y);
        }
        point(&mut self.membrane.x, &mut self.membrane.y);
        for t in &mut self.transporters {
            if rng.unit() < c.physical_mutation_rate * 0.1 {
                t.export = !t.export;
            }
        }
        for e in &mut self.enzymes {
            for d in [&mut e.dx, &mut e.dy] {
                if rng.unit() < c.physical_mutation_rate {
                    let step = if rng.unit() < 0.5 { -1. } else { 1. };
                    *d = (2. * chemistry::reflect((*d as f64 + 15. + step) / 2.) - 15.) as i8;
                }
            }
        }
    }
    fn express(a: &Self, b: &Self) -> Self {
        let mean = |x: f64, y: f64| ((x + y) * 0.5) as f32 as f64;
        Self {
            receptors: std::array::from_fn(|i| Target {
                x: mean(a.receptors[i].x, b.receptors[i].x),
                y: mean(a.receptors[i].y, b.receptors[i].y),
            }),
            transporters: std::array::from_fn(|i| Transporter {
                x: mean(a.transporters[i].x, b.transporters[i].x),
                y: mean(a.transporters[i].y, b.transporters[i].y),
                export: a.transporters[i].export,
            }),
            enzymes: std::array::from_fn(|i| Enzyme {
                x: mean(a.enzymes[i].x, b.enzymes[i].x),
                y: mean(a.enzymes[i].y, b.enzymes[i].y),
                dx: ((a.enzymes[i].dx as f64 + b.enzymes[i].dx as f64) / 2.).round() as i8,
                dy: ((a.enzymes[i].dy as f64 + b.enzymes[i].dy as f64) / 2.).round() as i8,
            }),
            membrane: Target {
                x: mean(a.membrane.x, b.membrane.x),
                y: mean(a.membrane.y, b.membrane.y),
            },
        }
    }
    fn combine(a: &Self, b: &Self, rng: &mut Random, kind: &str) -> Self {
        let mask = controller::combine(&[true; 13], &[false; 13], rng, kind);
        Self {
            receptors: std::array::from_fn(|i| {
                if mask[i] {
                    a.receptors[i]
                } else {
                    b.receptors[i]
                }
            }),
            transporters: std::array::from_fn(|i| {
                if mask[4 + i] {
                    a.transporters[i]
                } else {
                    b.transporters[i]
                }
            }),
            enzymes: std::array::from_fn(|i| {
                if mask[8 + i] {
                    a.enzymes[i]
                } else {
                    b.enzymes[i]
                }
            }),
            membrane: if mask[12] { a.membrane } else { b.membrane },
        }
    }
}
impl Genotype {
    pub fn seed(c: &Config, chemistry: &Chemistry) -> Self {
        let allele = Chromosome {
            behavior: controller::seed(),
            physical: [0.; 15],
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
        ];
        let core = c.birth_mass * (chromosome.physical[0] as f64).exp();
        let body = std::array::from_fn(|i| {
            if i == 0 {
                core
            } else {
                core * ratios[i] * (1. + chromosome.physical[i] as f64).max(0.)
            }
        });
        let receptors = std::array::from_fn(|i| {
            chemistry::compile_affinity(m.receptors[i].point(), c.affinity_radius)
        });
        let transporters = std::array::from_fn(|i| {
            chemistry::compile_affinity(
                [m.transporters[i].x, m.transporters[i].y],
                c.affinity_radius,
            )
        });
        let enzymes = std::array::from_fn(|i| {
            let e = m.enzymes[i];
            chemistry::compile_affinity([e.x, e.y], c.affinity_radius)
                .into_iter()
                .filter_map(|a| {
                    let p = chemistry::product(a.species, e.dx, e.dy);
                    if p == a.species {
                        return None;
                    }
                    let (energy, heat) = chemistry::reaction_energy(
                        chemistry.properties[a.species].potential,
                        chemistry.properties[p].potential,
                        c.conversion_efficiency,
                    );
                    Some(Edge {
                        substrate: a.species,
                        product: p,
                        affinity: a.value,
                        energy,
                        heat,
                    })
                })
                .collect()
        });
        let membrane = chemistry::compile_affinity(m.membrane.point(), c.affinity_radius);
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
            receptors,
            transporters,
            enzymes,
            membrane,
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
                &c.mutation_kind,
            );
            let before = a.chemistry.clone();
            a.chemistry.mutate(rng, c);
            mutated |= before != a.chemistry;
        }
        let mut child = Self {
            id,
            parent: Some(self.id),
            born: tick,
            learned,
            mutated,
            chromosomes: acquired,
            compiled: None,
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
            let m = &a.chemistry;
            let points = m
                .receptors
                .iter()
                .map(|p| p.point())
                .chain(m.transporters.iter().map(|p| [p.x, p.y]))
                .chain(m.enzymes.iter().map(|p| [p.x, p.y]))
                .chain([m.membrane.point()]);
            if points
                .flatten()
                .any(|x| !x.is_finite() || !(0. ..=15.).contains(&x))
                || m.enzymes.iter().any(|e| e.dx.abs() > 15 || e.dy.abs() > 15)
            {
                return Err("Invalid machinery".into());
            }
        }
        Ok(())
    }
}
