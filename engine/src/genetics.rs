use crate::{
    chemistry::{self, Chemistry},
    config::Config,
    controller,
    random::Random,
};
use serde::{Deserialize, Serialize};

#[cfg(test)]
mod angle_tests;
pub mod angles;
pub(crate) mod mutation;
pub mod repertoire;

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
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
#[serde(deny_unknown_fields)]
pub struct Transporter {
    pub x: f64,
    pub y: f64,
}
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Enzyme {
    pub x: f64,
    pub y: f64,
    #[serde(rename = "centerX")]
    pub center_x: f64,
    #[serde(rename = "centerY")]
    pub center_y: f64,
    /// Periodic orientation coordinate mixing adjacent exact square actions.
    pub angle: f64,
}
pub mod founder;
impl Enzyme {
    /// Recognition and action are independent; this involution exchanges the endpoints.
    pub fn between(from: [f64; 2], to: [f64; 2]) -> Self {
        Self {
            x: from[0],
            y: from[1],
            center_x: (from[0] + to[0]) * 0.5,
            center_y: (from[1] + to[1]) * 0.5,
            angle: 0.,
        }
    }
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Machinery {
    pub receptors: [Target; 4],
    pub inward: [f64; 4],
    pub transporters: [Transporter; 4],
    pub enzymes: [Enzyme; crate::organism::MAX_ENZYMES],
    pub programs: [bool; crate::organism::MAX_ENZYMES],
    pub membrane: Target,
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Chromosome {
    pub behavior: controller::Genome,
    pub physical: [f32; crate::organism::STOCKS],
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
pub struct Compiled {
    pub sequence_fingerprint: u64,
    pub chromosome: Chromosome,
    pub body: crate::organism::Body,
    pub operators: crate::chemical_operators::Operators,
}

impl Machinery {
    pub fn validate(&self) -> Result<(), String> {
        let points = self
            .receptors
            .iter()
            .map(|p| p.point())
            .chain(self.transporters.iter().map(|p| [p.x, p.y]))
            .chain(self.enzymes.iter().map(|p| [p.x, p.y]))
            .chain([self.membrane.point()]);
        if points
            .flatten()
            .any(|v| !v.is_finite() || !(0. ..=15.).contains(&v))
            || self
                .inward
                .iter()
                .any(|v| !v.is_finite() || !(0. ..=1.).contains(v))
            || self.enzymes.iter().any(|e| {
                !e.center_x.is_finite()
                    || !e.center_y.is_finite()
                    || !(0. ..=15.).contains(&e.center_x)
                    || !(0. ..=15.).contains(&e.center_y)
                    || !e.angle.is_finite()
                    || !(-std::f64::consts::PI..std::f64::consts::PI).contains(&e.angle)
            })
        {
            return Err("Invalid installed machinery".into());
        }
        Ok(())
    }
    pub fn seed(chemistry: &Chemistry, sources: &[usize]) -> Self {
        let from = [
            Target::species(sources[0]),
            Target::species(*sources.get(1).unwrap_or(&sources[0])),
        ];
        let center = founder::center(
            chemistry,
            [sources[0], *sources.get(1).unwrap_or(&sources[0])],
        );
        let action = crate::chemical_group::Action::intervals(center.map(|v| (v * 2.) as u8));
        let products = [
            action.apply(sources[0]),
            action.apply(*sources.get(1).unwrap_or(&sources[0])),
        ]
        .map(Target::species);
        let to = Target {
            x: (products[0].x + products[1].x) * 0.5,
            y: (products[0].y + products[1].y) * 0.5,
        };
        let stress = Target::species(
            chemistry
                .properties
                .iter()
                .position(|p| p.stress >= 0.8)
                .unwrap(),
        );
        Self {
            receptors: [from[0], from[1], to, stress],
            inward: [0.; 4],
            programs: std::array::from_fn(|i| i < 4),
            transporters: std::array::from_fn(|i| {
                let p = if i < 2 { from[i] } else { products[i - 2] };
                Transporter { x: p.x, y: p.y }
            }),
            enzymes: std::array::from_fn(|i| {
                let p = from[i % 2];
                Enzyme {
                    x: p.x,
                    y: p.y,
                    center_x: center[0],
                    center_y: center[1],
                    angle: 0.,
                }
            }),
            membrane: to,
        }
    }
    fn mutate(&mut self, rng: &mut Random, c: &Config) -> bool {
        // Specificity changes over R, not over the entire chemical domain.
        let chemical_scale = c.physical_mutation_scale * c.affinity_radius;
        let points = self
            .receptors
            .iter_mut()
            .map(|p| [&mut p.x, &mut p.y])
            .chain(self.transporters.iter_mut().map(|p| [&mut p.x, &mut p.y]))
            .chain(self.enzymes.iter_mut().map(|p| [&mut p.x, &mut p.y]))
            .chain([[&mut self.membrane.x, &mut self.membrane.y]]);
        let points_changed = mutation::mutate_pairs(
            points,
            rng,
            c.physical_mutation_rate,
            chemical_scale,
            0.,
            15.,
        );
        let centers_changed = mutation::mutate_pairs(
            self.enzymes
                .iter_mut()
                .map(|e| [&mut e.center_x, &mut e.center_y]),
            rng,
            c.physical_mutation_rate,
            chemical_scale,
            0.,
            15.,
        );
        let angles_changed = mutation::mutate_angles(
            self.enzymes.iter_mut().map(|e| &mut e.angle),
            rng,
            c.physical_mutation_rate,
            chemical_scale / c.affinity_radius,
        );
        let inward_changed = mutation::mutate(
            &mut self.inward,
            rng,
            c.physical_mutation_rate,
            c.physical_mutation_scale,
            0.,
            1.,
        );
        points_changed || centers_changed || angles_changed || inward_changed
    }
    fn express(a: &Self, b: &Self) -> Self {
        let mean = |x: f64, y: f64| ((x + y) * 0.5) as f32 as f64;
        Self {
            inward: std::array::from_fn(|i| mean(a.inward[i], b.inward[i])),
            programs: std::array::from_fn(|i| a.programs[i] || b.programs[i]),
            receptors: std::array::from_fn(|i| Target {
                x: mean(a.receptors[i].x, b.receptors[i].x),
                y: mean(a.receptors[i].y, b.receptors[i].y),
            }),
            transporters: std::array::from_fn(|i| Transporter {
                x: mean(a.transporters[i].x, b.transporters[i].x),
                y: mean(a.transporters[i].y, b.transporters[i].y),
            }),
            enzymes: std::array::from_fn(|i| Enzyme {
                x: mean(a.enzymes[i].x, b.enzymes[i].x),
                y: mean(a.enzymes[i].y, b.enzymes[i].y),
                center_x: mean(a.enzymes[i].center_x, b.enzymes[i].center_x),
                center_y: mean(a.enzymes[i].center_y, b.enzymes[i].center_y),
                angle: angles::mean(a.enzymes[i].angle, b.enzymes[i].angle),
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
            inward: std::array::from_fn(|i| if mask[i] { a.inward[i] } else { b.inward[i] }),
            programs: a.programs,
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
                if mask[8 + i % 4] {
                    a.enzymes[i]
                } else {
                    b.enzymes[i]
                }
            }),
            membrane: if mask[12] { a.membrane } else { b.membrane },
        }
    }
}
mod genotype;
