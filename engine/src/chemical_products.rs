//! Continuous recognition geometry over the discrete, reflected chemical manifold.
use crate::chemistry::{coordinate, reflect};

pub const RECOGNITION_RADIUS: f64 = 3.;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ProductWeight {
    pub species: usize,
    pub weight: f64,
}

pub fn product_neighborhood(substrate: usize, offset: [f64; 2]) -> Vec<ProductWeight> {
    let source = coordinate(substrate);
    let point = [
        reflect(source[0] + offset[0]),
        reflect(source[1] + offset[1]),
    ];
    let base = point.map(|x| x.floor() as usize);
    let fraction = [point[0] - base[0] as f64, point[1] - base[1] as f64];
    let mut result: Vec<ProductWeight> = Vec::with_capacity(4);
    for dx in 0..2 {
        for dy in 0..2 {
            let weight = if dx == 0 {
                1. - fraction[0]
            } else {
                fraction[0]
            } * if dy == 0 {
                1. - fraction[1]
            } else {
                fraction[1]
            };
            if weight == 0. {
                continue;
            }
            let species = (base[0] + dx).min(15) * 16 + (base[1] + dy).min(15);
            if let Some(entry) = result.iter_mut().find(|p| p.species == species) {
                entry.weight += weight;
            } else {
                result.push(ProductWeight { species, weight });
            }
        }
    }
    result
}
