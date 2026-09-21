//! One exact contact geometry shared by every consumer of the current physical step.
use crate::{config::Config, organism::Cell};
#[path = "prepared_contacts.rs"]
pub(crate) mod prepared;
#[path = "contact_search.rs"]
mod search;

#[derive(Clone, Copy, Debug, Default)]
pub struct Body {
    pub position: [f64; 2],
    pub radius: f64,
    pub heading: [f64; 2],
}
#[derive(Clone, Copy, Debug)]
pub struct Edge {
    pub i: usize,
    pub j: usize,
    pub displacement: [f64; 2],
    pub length: f64,
    pub extent: f64,
}
impl Edge {
    pub fn weight(&self) -> f64 {
        (1. - self.length / self.extent).max(0.)
    }
    pub fn direction(&self) -> [f64; 2] {
        if self.length > 0. {
            self.displacement.map(|v| v / self.length)
        } else {
            [0.; 2]
        }
    }
}
#[derive(Clone, Debug, Default)]
pub struct Contacts {
    pub bodies: Vec<Body>,
    pub edges: Vec<Edge>,
    pub candidates: usize,
}
impl Contacts {
    pub fn new(cells: &[Cell], c: &Config) -> Self {
        let mut result = Self::default();
        search::Search::default().update(cells, c, &mut result);
        result
    }
}

/// Reusable stage scratch, not a second owner of physical positions or material.
#[derive(Clone, Debug, Default)]
pub struct Cache {
    pub(crate) local: prepared::Local,
    pub(crate) motion: super::prepared::Motion,
    graph: crate::interfaces::Graph,
}
impl Cache {
    pub fn prepare(&mut self, cells: &[Cell], c: &Config) -> &Contacts {
        self.prepare_local(cells, c)
    }
    pub fn prepare_local(&mut self, cells: &[Cell], c: &Config) -> &Contacts {
        self.local.update(cells, c);
        &self.local.contacts
    }
    pub fn graph(&mut self, cells: &[Cell], c: &Config) -> &crate::interfaces::Graph {
        self.prepare_local(cells, c);
        self.graph_prepared(cells, c)
    }
    /// Geometry stays frozen for the base step; current donor exposure remains live.
    pub fn graph_prepared(&mut self, cells: &[Cell], c: &Config) -> &crate::interfaces::Graph {
        self.graph.update_local(cells, c, &self.local);
        &self.graph
    }
}
