//! The sole physical kernel, shared by browser WebAssembly and headless assays.
mod abi;
pub mod memory_budget;
pub mod parallel;
#[cfg(test)]
mod parallel_tests;
#[cfg(all(target_arch = "wasm32", feature = "threads"))]
pub use wasm_bindgen_rayon::init_thread_pool;
pub mod accounting;
pub mod adhesion;
#[cfg(test)]
mod adhesion_tests;
pub mod ancestry;
pub(crate) use field::attraction;
#[cfg(test)]
mod attraction_tests;
#[cfg(test)]
mod bound_material_tests;
#[cfg(test)]
mod boundary_tests;
mod catalog;
pub mod census;
#[cfg(test)]
mod chemical_equivariance_tests;
pub mod chemical_group;
#[cfg(test)]
mod chemical_group_tests;
pub mod chemical_landscape;
mod chemical_observation;
pub mod chemical_operators;
pub mod chemical_products;
pub mod chemical_profiles;
mod chemical_projection;
pub mod chemical_roles;
#[cfg(test)]
mod chemical_roles_tests;
pub mod chemistry;
pub mod chemistry_atlas;
pub mod climate;
#[cfg(test)]
mod climate_tests;
pub mod commands;
pub mod config;
pub mod contact_exchange;
pub mod controller;
#[cfg(test)]
mod coupling_tests;
pub mod cover;
#[cfg(test)]
mod cover_tests;
pub mod diagnostics;
pub mod economy;
mod economy_report;
#[cfg(test)]
mod environmental_return_tests;
#[cfg(test)]
mod enzyme_transform_tests;
mod exchange_vector;
pub mod execution;
pub mod execution_budget;
#[cfg(test)]
mod execution_schedule_tests;
pub mod field;
mod field_activity;
#[cfg(test)]
mod field_activity_tests;
mod field_vector;
pub mod fixtures;
pub mod footprint;
mod genealogy;
#[cfg(test)]
mod genealogy_tests;
pub mod genetics;
pub mod illumination;
#[cfg(test)]
mod illumination_tests;
pub mod initial_ecology;
#[cfg(test)]
mod interface_tests;
pub mod interfaces;
pub mod inventory;
pub mod lifecycle;
#[cfg(test)]
mod mechanism_tests;
mod medium_response;
#[cfg(test)]
mod medium_response_tests;
pub mod metabolism;
pub mod movement;
mod numeric;
pub mod observation;
pub mod opportunities;
pub mod optics;
#[cfg(test)]
mod optics_tests;
pub mod organism;
pub mod organization;
#[cfg(test)]
mod organization_tests;
pub mod phenotype;
mod phenotype_activity;
mod phenotype_commands;
mod phenotype_report;
#[cfg(test)]
mod phenotype_tests;
#[cfg(test)]
mod photoreception_tests;
mod population_diagnostics;
mod presentation;
pub mod random;
pub mod reaction_medium;
mod relationships;
pub mod render;
pub mod render_window;
pub mod reservoir_coupling;
#[cfg(test)]
mod reservoir_coupling_tests;
#[cfg(test)]
mod runtime_tests;
pub mod sensing;
pub mod source_footprint;
#[cfg(test)]
mod source_lifecycle_tests;
pub mod source_medium;
mod source_probe;
#[cfg(test)]
mod source_tests;
pub mod sources;
mod spatial;
mod spatial_carriers;
mod spatial_filter;
mod spatial_material;
mod spatial_members;
mod spatial_regions;
mod spatial_slots;
#[cfg(test)]
mod spatial_tests;
mod startup_probe;
mod storage_diagnostics;
#[cfg(test)]
mod structural_tests;
mod study_commands;
mod study_trace;
#[cfg(test)]
mod symmetry_tests;
pub mod terrain;
mod trace;
pub mod transformation_work;
#[cfg(test)]
mod transformation_work_tests;
pub mod transport;
pub mod weathering;
mod weathering_budget;
mod weathering_probe;
pub mod world;
mod world_validation;

#[cfg(test)]
mod binding_tests;
#[cfg(test)]
mod birth_capabilities_tests;
