//! Initial mutable machinery from definition properties, never population outcomes.
use crate::{
    chemical_group::Action,
    chemistry::{Chemistry, coordinate, distance_squared},
};

pub fn circuit(c: &crate::config::Config, chemistry: &Chemistry, index: usize) -> super::Genotype {
    use super::{Enzyme, Target, Transporter};
    let species = [0, 128, 136, 8];
    let from = Target::species(species[index % 4]);
    let to = Target::species(species[(index + 1) % 4]);
    let mut g = super::Genotype::seed(c, chemistry);
    g.id = index as u64 + 1;
    for a in &mut g.chromosomes {
        a.behavior = crate::controller::circuit_seed();
        a.chemistry.receptors = [from, from, to, to];
        a.chemistry.membrane = from;
        a.chemistry.transporters = std::array::from_fn(|i| {
            let p = if i < 2 { from } else { to };
            Transporter { x: p.x, y: p.y }
        });
        a.chemistry.enzymes = [Enzyme {
            x: from.x,
            y: from.y,
            center_x: if index.is_multiple_of(2) { 4. } else { 0. },
            center_y: if index.is_multiple_of(2) { 0. } else { 4. },
            angle: 0.,
        }; 4];
    }
    g.compile(c, chemistry);
    g
}

pub fn center(chemistry: &Chemistry, sources: [usize; 2]) -> [f64; 2] {
    let mut best = ([0.; 2], f64::NEG_INFINITY);
    for x in 0..31 {
        for y in 0..31 {
            let action = Action::intervals([x, y]);
            let score = sources
                .into_iter()
                .map(|s| {
                    let t = action.apply(s);
                    let gain =
                        chemistry.properties[s].potential - chemistry.properties[t].potential;
                    gain / (1.
                        + distance_squared(coordinate(s), coordinate(t))
                            / crate::chemical_products::RECOGNITION_RADIUS.powi(2))
                })
                .fold(f64::INFINITY, f64::min);
            if score > best.1 {
                best = ([x as f64 * 0.5, y as f64 * 0.5], score);
            }
        }
    }
    best.0
}
