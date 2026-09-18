//! Smooth kinetic mixtures of exact finite chemical actions, compiled only on change.
use crate::{
    chemical_group::{Action, quarter_point},
    chemistry::{coordinate, reflect},
    genetics::Enzyme,
};

pub const RECOGNITION_RADIUS: f64 = 3.;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ProductWeight {
    pub species: usize,
    pub weight: f64,
}

/// Convenience for one recognition center. Different substrates here construct
/// different enzymes; this function is not a global translation action.
pub fn product_neighborhood(substrate: usize, offset: [f64; 2]) -> Vec<ProductWeight> {
    let [x, y] = coordinate(substrate);
    Transform::new(Enzyme {
        x,
        y,
        dx: offset[0],
        dy: offset[1],
        angle: 0.,
    })
    .products(substrate)
}

#[derive(Clone, Debug)]
pub struct WeightedAction {
    pub action: Action,
    pub weight: f64,
}

pub struct Transform {
    components: Vec<WeightedAction>,
}

fn neighbors(value: f64) -> [(u8, f64); 2] {
    let base = value.floor();
    let fraction = value - base;
    [(base as u8, 1. - fraction), ((base + 1.) as u8, fraction)]
}

impl Transform {
    pub fn new(e: Enzyme) -> Self {
        let target = [reflect(e.x + e.dx), reflect(e.y + e.dy)];
        let angle = e.angle.rem_euclid(std::f64::consts::TAU) / std::f64::consts::FRAC_PI_2;
        let mut components = Vec::with_capacity(8);
        for (q, angular_weight) in neighbors(angle) {
            if angular_weight == 0. {
                continue;
            }
            let quarter = (q + 2) % 4;
            let center = quarter_point([e.x, e.y], quarter);
            let x = neighbors(center[0] + target[0]);
            let y = neighbors(center[1] + target[1]);
            for (kx, wx) in x {
                for (ky, wy) in y {
                    let weight = angular_weight * wx * wy;
                    if weight > 0. {
                        components.push(WeightedAction {
                            action: Action::intervals([kx, ky]).compose(&Action::quarter(quarter)),
                            weight,
                        });
                    }
                }
            }
        }
        Self { components }
    }

    pub fn components(&self) -> &[WeightedAction] {
        &self.components
    }

    pub fn products(&self, substrate: usize) -> Vec<ProductWeight> {
        let mut result: Vec<ProductWeight> = Vec::with_capacity(self.components.len());
        for component in &self.components {
            let species = component.action.apply(substrate);
            if let Some(entry) = result.iter_mut().find(|p| p.species == species) {
                entry.weight += component.weight;
            } else {
                result.push(ProductWeight {
                    species,
                    weight: component.weight,
                });
            }
        }
        result.sort_unstable_by_key(|p| p.species);
        result
    }
}
