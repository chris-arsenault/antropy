//! Soft circle separation and isotropic crowding; no orientation or sample lattice.
#[derive(Clone, Copy, Debug, Default)]
pub(crate) struct Row {
    pub shift: [f64; 2],
    pub weight: f64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::movement::geometry::{Body, Contacts, Edge};

    #[test]
    fn dense_compression_has_symmetric_bounded_displacement() {
        let mut contacts = Contacts {
            bodies: vec![Body::default(); 64],
            ..Contacts::default()
        };
        for i in 0..64 {
            for j in i + 1..64 {
                let length = (j - i) as f64 / 64.;
                contacts.edges.push(Edge {
                    i,
                    j,
                    displacement: [length, 0.],
                    length,
                    extent: 2.,
                });
            }
        }
        for dt in [0., 0.001, 0.2, 100.] {
            let mut p = Pressure::default();
            p.prepare(&contacts, dt);
            assert!(
                p.rows
                    .iter()
                    .all(|r| r.shift[0].is_finite() && (r.shift[0] * dt).abs() <= 1.)
            );
            assert!(p.rows.iter().map(|r| r.shift[0]).sum::<f64>().abs() < 1e-10);
            assert!(p.rows[0].shift[0] < 0. && p.rows[63].shift[0] > 0.);
        }
    }
}
impl Row {
    pub fn field(&self) -> f64 {
        1. / (1. + self.weight)
    }
    pub fn contacts(&self) -> [f64; 4] {
        [0.25 * self.weight * self.field(); 4]
    }
}
#[derive(Clone, Debug, Default)]
pub(crate) struct Pressure {
    pub rows: Vec<Row>,
    pub dt: f64,
    degree: Vec<f64>,
}
impl Pressure {
    pub fn prepare(&mut self, contacts: &super::super::Contacts, dt: f64) {
        self.dt = dt;
        self.rows.resize(contacts.bodies.len(), Row::default());
        self.rows.fill(Row::default());
        for edge in &contacts.edges {
            let weight = edge.weight();
            self.rows[edge.i].weight += weight;
            self.rows[edge.j].weight += weight;
        }
        self.degree.resize(self.rows.len(), 0.);
        self.degree.fill(0.);
        for edge in &contacts.edges {
            self.degree[edge.i] += 1.;
            self.degree[edge.j] += 1.;
        }
        for edge in &contacts.edges {
            let crowding = self.rows[edge.i].weight + self.rows[edge.j].weight;
            let degree = self.degree[edge.i].max(self.degree[edge.j]);
            let relaxed = -(-dt * degree).exp_m1();
            let relaxation = super::super::separation_rate(dt * degree) * (1. + crowding)
                / (1. + crowding * relaxed);
            let speed = (edge.extent - edge.length) * relaxation;
            for (k, direction) in edge.direction().into_iter().enumerate() {
                let shift = speed * direction;
                self.rows[edge.i].shift[k] -= shift;
                self.rows[edge.j].shift[k] += shift;
            }
        }
    }
}
