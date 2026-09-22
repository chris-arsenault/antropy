//! Contact chemistry is isotropic: heading does not change access or recognition.
use super::{Graph, Reading};
use crate::{chemistry::Chemistry, config::Config, organism::Cell};
impl Graph {
    pub(super) fn read_with<const CONTROL: bool>(
        &self,
        i: usize,
        cells: &[Cell],
        c: &Config,
        chemistry: &Chemistry,
        stress: &[f64],
    ) -> Reading {
        let mut reading = Reading {
            field: self.field[i],
            ..Reading::default()
        };
        let cell = &cells[i];
        let operators = cell.operators.as_ref().unwrap();
        for n in self.neighbors(i) {
            let donor = &cells[n.donor];
            let gain = n.weight * self.exposure[n.donor];
            if CONTROL {
                for (slot, receptor) in operators.receptors.iter().enumerate() {
                    if cell.body[3 + slot] == 0. || cell.chemistry().inward[slot] == 1. {
                        continue;
                    }
                    let value = gain
                        * receptor
                            .iter()
                            .map(|a| a.value * donor.inventory.value(a.species))
                            .sum::<f64>();
                    for sample in &mut reading.recognition[slot] {
                        *sample += value;
                    }
                }
            } else {
                let mut load = stress
                    .get(n.donor)
                    .copied()
                    .unwrap_or_else(|| donor.inventory.projection(chemistry).stress);
                for a in operators.membrane.iter() {
                    load -= (1. - c.susceptibility_floor)
                        * a.value
                        * chemistry.properties[a.species].stress
                        * donor.inventory.value(a.species);
                }
                reading.stress += gain * load.max(0.);
            }
        }
        reading
    }
}
/// Inspection uses the same circle law and scalar mixtures as ordinary execution.
pub fn selected(i: usize, cells: &[Cell], c: &Config, chemistry: &Chemistry) -> Reading {
    Graph::new(cells, c).reading(i, cells, c, chemistry)
}
