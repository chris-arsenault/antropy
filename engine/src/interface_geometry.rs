//! Circle geometry stays frozen; exposed donor inventory is read live.
use super::{Graph, Neighbor};
use crate::{config::Config, movement::geometry::prepared::Local, organism::Cell};
impl Graph {
    pub fn new(cells: &[Cell], c: &Config) -> Self {
        let mut local = Local::default();
        local.update(cells, c);
        let mut graph = Self::default();
        graph.update_local(cells, c, &local);
        graph
    }
    pub(crate) fn update_local(&mut self, cells: &[Cell], c: &Config, local: &Local) {
        self.field.resize(cells.len(), 1.);
        self.contacts.resize(cells.len(), [0.; 4]);
        self.exposure.resize(cells.len(), 0.);
        self.neighbors.resize_with(cells.len(), Vec::new);
        self.exposed = false;
        for (i, cell) in cells.iter().enumerate() {
            self.field[i] = local.pressure.rows[i].field();
            self.contacts[i] = local.pressure.rows[i].contacts();
            self.neighbors[i].clear();
            self.exposure[i] = if cell.material() > 0. {
                cell.damage / cell.volume(c).max(1e-30)
            } else {
                0.
            };
            self.exposed |= self.exposure[i] > 0.;
        }
        if !self.exposed {
            return;
        }
        for edge in &local.contacts.edges {
            let weight = edge.weight();
            for (receiver, donor) in [(edge.i, edge.j), (edge.j, edge.i)] {
                if self.exposure[donor] > 0. {
                    self.neighbors[receiver].push(Neighbor {
                        donor,
                        weight: weight * self.field[receiver],
                    });
                }
            }
        }
    }
}
