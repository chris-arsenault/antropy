//! Mechanical summaries include every overlap; material rows visit only exposed donors.
use super::{Graph, Neighbor};
use crate::{
    config::Config,
    movement::geometry::{
        Contacts,
        prepared::{Local, pressure},
    },
    organism::Cell,
};

impl Graph {
    pub fn new(cells: &[Cell], c: &Config) -> Self {
        Self::from_geometry(cells, c, &Contacts::new(cells, c))
    }
    pub fn from_geometry(cells: &[Cell], c: &Config, geometry: &Contacts) -> Self {
        let mut reduction = pressure::Pressure::default();
        reduction.set_dt(c.dt);
        reduction.clear(cells.len());
        for &edge in &geometry.edges {
            reduction.accumulate(edge, &geometry.bodies, 1.);
        }
        let mut graph = Self::default();
        graph.prepare_rows(cells, c, &reduction.rows);
        for &edge in &geometry.edges {
            for (receiver, donor, sign) in [(edge.i, edge.j, 1.), (edge.j, edge.i, -1.)] {
                if cells[donor].damage != 0. && cells[donor].material() != 0. {
                    graph.push(receiver, donor, sign, edge);
                }
            }
        }
        graph
    }
    fn prepare_rows(&mut self, cells: &[Cell], c: &Config, rows: &[pressure::Row]) {
        self.neighbors.rows.resize_with(cells.len(), Vec::new);
        self.field.resize(cells.len(), 1.);
        self.contacts.resize(cells.len(), [0.; 4]);
        self.exposure.resize(cells.len(), 0.);
        for (i, cell) in cells.iter().enumerate() {
            self.neighbors.rows[i].clear();
            self.field[i] = rows[i].field();
            self.contacts[i] = rows[i].contacts();
            self.exposure[i] = cell.damage / cell.volume(c).max(1e-30);
        }
    }
    fn push(
        &mut self,
        receiver: usize,
        donor: usize,
        sign: f64,
        edge: crate::movement::geometry::Edge,
    ) {
        self.neighbors.rows[receiver].push(Neighbor {
            donor,
            weight: edge.weight() * self.field[receiver],
            direction: edge.direction().map(|v| v * sign),
        });
    }
    pub(crate) fn update_local(&mut self, cells: &[Cell], c: &Config, local: &Local) {
        self.prepare_rows(cells, c, &local.pressure.rows);
        for (donor, cell) in cells.iter().enumerate() {
            if cell.damage == 0. || cell.material() == 0. {
                continue;
            }
            for &index in local.incident(donor) {
                let edge = local.contacts.edges[index];
                let (receiver, sign) = if edge.j == donor {
                    (edge.i, 1.)
                } else {
                    (edge.j, -1.)
                };
                self.push(receiver, donor, sign, edge);
            }
        }
    }
}
