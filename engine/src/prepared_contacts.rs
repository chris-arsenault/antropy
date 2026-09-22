//! One local circle-overlap search per frozen physical stage.
use super::{Contacts, search::Search};
use crate::{config::Config, organism::Cell};
#[path = "prepared_pressure.rs"]
pub(crate) mod pressure;

#[derive(Clone, Debug, Default)]
pub(crate) struct Local {
    pub contacts: Contacts,
    pub pressure: pressure::Pressure,
    search: Search,
    passes: u64,
}
impl Local {
    pub fn update(&mut self, cells: &[Cell], c: &Config) {
        self.search.update(cells, c, &mut self.contacts);
        self.pressure.prepare(&self.contacts, c.dt);
        self.passes += 1;
    }
    pub fn pressure_at(&mut self, dt: f64) -> &[pressure::Row] {
        if self.pressure.dt != dt {
            self.pressure.prepare(&self.contacts, dt);
        }
        &self.pressure.rows
    }
    pub fn counts(&self) -> serde_json::Value {
        serde_json::json!({"passes":self.passes, "contacts":self.contacts.edges.len(),
            "candidateChecks":self.contacts.candidates})
    }
}
