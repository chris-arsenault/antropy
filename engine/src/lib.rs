//! The sole physical kernel, shared by browser WebAssembly and headless assays.
mod abi;
pub mod accounting;
pub mod ancestry;
#[cfg(test)]
mod boundary_tests;
mod catalog;
pub mod census;
mod chemical_observation;
pub mod chemical_operators;
pub mod chemical_products;
pub mod chemical_profiles;
mod chemical_projection;
pub mod chemistry;
pub mod chemistry_atlas;
pub mod climate;
#[cfg(test)]
mod climate_tests;
pub mod commands;
pub mod config;
pub mod controller;
#[cfg(test)]
mod coupling_tests;
pub mod diagnostics;
pub mod economy;
mod economy_report;
mod exchange_vector;
pub mod field;
mod field_activity;
#[cfg(test)]
mod field_activity_tests;
mod field_vector;
pub mod fixtures;
mod footprint;
mod genealogy;
#[cfg(test)]
mod genealogy_tests;
pub mod genetics;
pub mod inventory;
pub mod lifecycle;
#[cfg(test)]
mod mechanism_tests;
pub mod metabolism;
pub mod movement;
mod numeric;
pub mod observation;
pub mod opportunities;
pub mod organism;
mod population_diagnostics;
mod presentation;
pub mod random;
mod refitting;
mod relationships;
mod render;
#[cfg(test)]
mod runtime_tests;
pub mod sensing;
pub mod source_footprint;
pub mod source_medium;
mod source_probe;
#[cfg(test)]
mod source_tests;
pub mod sources;
mod startup_probe;
mod storage_diagnostics;
mod study_commands;
mod study_trace;
mod trace;
pub mod transport;
pub mod weathering;
mod weathering_budget;
mod weathering_probe;
pub mod world;
mod world_validation;
