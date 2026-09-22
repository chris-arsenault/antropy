//! Soft circle separation and isotropic crowding; no orientation or sample lattice.
#[derive(Clone, Copy, Debug, Default)]
pub(crate) struct Row {
    pub shift: [f64; 2],
    pub weight: f64,
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
}
impl Pressure {
    pub fn prepare(&mut self, contacts: &super::super::Contacts, dt: f64) {
        self.dt = dt;
        self.rows.resize(contacts.bodies.len(), Row::default());
        self.rows.fill(Row::default());
        let relaxation = 0.5 * (1. - (-dt).exp()) / dt;
        for edge in &contacts.edges {
            let weight = edge.weight();
            self.rows[edge.i].weight += weight;
            self.rows[edge.j].weight += weight;
            let speed = (edge.extent - edge.length) * relaxation;
            for (k, direction) in edge.direction().into_iter().enumerate() {
                let shift = speed * direction;
                self.rows[edge.i].shift[k] -= shift;
                self.rows[edge.j].shift[k] += shift;
            }
        }
    }
}
