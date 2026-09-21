//! Direct true-contact geometry and reciprocal reductions for one physical step.
use super::{Contacts, search::Search};
use crate::{config::Config, organism::Cell};
#[path = "prepared_pressure.rs"]
pub(crate) mod pressure;

#[derive(Clone, Debug, Default)]
pub(crate) struct Local {
    pub contacts: Contacts,
    pub pressure: pressure::Pressure,
    search: Search,
    offsets: Vec<usize>,
    incident: Vec<usize>,
    cursors: Vec<usize>,
    passes: u64,
    candidate_checks: u64,
}
impl Local {
    pub fn update(&mut self, cells: &[Cell], c: &Config) {
        self.search.update(cells, c, &mut self.contacts);
        self.passes += 1;
        self.candidate_checks += self.contacts.candidates as u64;
        self.pressure.set_dt(c.dt);
        self.pressure.clear(cells.len());
        self.offsets.resize(cells.len() + 1, 0);
        self.offsets.fill(0);
        for &edge in &self.contacts.edges {
            self.offsets[edge.i + 1] += 1;
            self.offsets[edge.j + 1] += 1;
        }
        for i in 1..self.offsets.len() {
            let previous = self.offsets[i - 1];
            self.offsets[i] += previous;
        }
        self.cursors.clear();
        self.cursors.extend_from_slice(&self.offsets[..cells.len()]);
        self.incident.resize(self.contacts.edges.len() * 2, 0);
        for (index, edge) in self.contacts.edges.iter().enumerate() {
            for owner in [edge.i, edge.j] {
                self.incident[self.cursors[owner]] = index;
                self.cursors[owner] += 1;
            }
        }
        self.gather_pressure(c.dt);
    }
    fn gather_pressure(&mut self, dt: f64) {
        let offsets = &self.offsets;
        let incident = &self.incident;
        let contacts = &self.contacts;
        crate::parallel::for_each(&mut self.pressure.rows, 128, |i, row| {
            row.gather(
                i,
                &incident[offsets[i]..offsets[i + 1]],
                &contacts.edges,
                &contacts.bodies,
                dt,
            );
        });
    }
    /// Compact geometric incidence lets material consumers visit only exposed donors.
    pub fn incident(&self, owner: usize) -> &[usize] {
        &self.incident[self.offsets[owner]..self.offsets[owner + 1]]
    }
    pub fn pressure_at(&mut self, dt: f64) -> &[pressure::Row] {
        if self.pressure.dt != dt {
            self.pressure.set_dt(dt);
            self.pressure.clear(self.contacts.bodies.len());
            self.gather_pressure(dt);
        }
        &self.pressure.rows
    }
    pub fn counts(&self) -> serde_json::Value {
        serde_json::json!({
            "passes": self.passes,
            "candidateChecks": self.candidate_checks,
            "contacts": self.contacts.edges.len()
        })
    }
}
