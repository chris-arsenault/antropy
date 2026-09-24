//! Sole production state and schedule. Browser stepping and every assay execute this owner.
pub use crate::ancestry::Ancestor;
use crate::{
    accounting::Ledger, chemistry::Chemistry, config::Config, field::Field,
    genetics::GenotypeStore, organism::Cell, random::Random, sources::Source,
};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;
#[path = "world_base.rs"]
mod base;
#[path = "world_physiology.rs"]
mod physiology;
pub const VERSION: u32 = 41;
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Event {
    pub tick: u64,
    pub kind: String,
    pub cell: u64,
    pub values: Vec<u64>,
    pub location: Option<[f64; 3]>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct World {
    pub version: u32,
    pub seed: u64,
    pub tick: u64,
    pub config: Config,
    pub rng: Random,
    pub environment_rng: Random,
    pub genetic_rng: Random,
    pub chemistry: Chemistry,
    pub field: Field,
    pub cells: Vec<Cell>,
    pub sources: Vec<Source>,
    pub patch_centers: Vec<[f64; 2]>,
    pub genomes: GenotypeStore,
    pub ancestry: Vec<Ancestor>,
    pub next_cell: u64,
    pub next_genome: u64,
    pub ledger: Ledger,
    pub events: Vec<Event>,
    pub stop_reason: Option<String>,
    pub field_elapsed: f64,
    #[serde(skip)]
    pub trace: Option<crate::trace::Trace>,
    #[serde(skip)]
    pub observer: Option<Box<crate::phenotype::Observer>>,
    #[serde(skip)]
    exchange: crate::transport::Exchange,
    #[serde(skip)]
    pub(crate) contact_cache: crate::movement::geometry::Cache,
    #[serde(skip)]
    reactions: crate::metabolism::Executor,
    #[serde(skip)]
    physiology_jobs: Vec<physiology::Job>,
    #[serde(skip)]
    sites: Vec<crate::footprint::Row>,
    #[serde(skip)]
    footprints: crate::footprint::Projection,
    #[serde(skip)]
    pub(crate) climate: crate::climate::Climate,
}
impl World {
    pub fn new(seed: u64, mut config: Config) -> Result<Self, String> {
        config.validate()?;
        let chemistry = Chemistry::new(config.chemistry_seed)?;
        if config.source_species.is_empty() {
            config.source_species = chemistry.source_species();
        }
        let mut rng = Random::new(seed);
        let mut environment_rng = Random::new(seed ^ 0x656e765f726e67);
        let mut field = Field::new(config.width, config.height, config.mesh);
        field.pressure_strength = config.pressure_strength;
        field
            .illumination
            .prepare(seed, 0, &config, field.nx, field.ny);
        let (patch_centers, habitats) = crate::sources::landscape(&config, &mut environment_rng);
        let mut sources: Vec<_> = habitats
            .into_iter()
            .map(|h| Source::new(h, 0, &config, &mut environment_rng, &field))
            .collect();
        let mut ledger = Ledger::default();
        for s in &mut sources {
            s.release(config.source_priming, &mut field, &chemistry, &mut ledger);
        }
        crate::initial_ecology::prime(&sources, &config, &chemistry, &mut field);
        let genomes: GenotypeStore = (0..config.founders.clamp(1, 4))
            .map(|i| {
                let g = crate::genetics::founder::circuit(&config, &chemistry, i);
                (g.id, g)
            })
            .collect();
        let first = sources
            .first()
            .map(|s| [s.habitat.x, s.habitat.y])
            .unwrap_or([config.width * 0.25, config.height * 0.5]);
        let second = sources
            .iter()
            .max_by(|a, b| {
                crate::movement::distance(first, [a.habitat.x, a.habitat.y], &config).total_cmp(
                    &crate::movement::distance(first, [b.habitat.x, b.habitat.y], &config),
                )
            })
            .map(|s| [s.habitat.x, s.habitat.y])
            .unwrap_or([config.width * 0.75, config.height * 0.5]);
        let mut cells = Vec::new();
        let mut ancestry = Vec::new();
        for i in 0..config.founders {
            let genome = (i % genomes.len()) as u64 + 1;
            let compiled = genomes[&genome].compiled.as_ref().unwrap();
            let center = if i < config.founders.div_ceil(2) {
                first
            } else {
                second
            };
            let angle = rng.unit() * std::f64::consts::TAU;
            let reach = 3. * rng.unit().sqrt();
            let mut cell = Cell::new(
                i as u64 + 1,
                genome,
                compiled,
                &config,
                &chemistry,
                [
                    (center[0] + angle.cos() * reach).rem_euclid(config.width),
                    (center[1] + angle.sin() * reach).rem_euclid(config.height),
                ],
                rng.unit() * std::f64::consts::TAU,
            );
            crate::initial_ecology::fund(&mut cell, &config, i % 4);
            crate::sensing::initialize(&mut cell, compiled, &config, &field);
            ancestry.push(Ancestor {
                id: cell.id,
                parent: 0,
                lineage: cell.id,
                genome,
                born: 0,
                ended: crate::ancestry::ALIVE,
                cause: crate::ancestry::Cause::Alive,
            });
            cells.push(cell);
        }
        let next_cell = cells.len() as u64 + 1;
        let climate = crate::climate::Climate::new(&config, &chemistry);
        let next_genome = genomes.len() as u64 + 1;
        let mut world = Self {
            version: VERSION,
            seed,
            tick: 0,
            config,
            rng,
            environment_rng,
            genetic_rng: Random::new(seed ^ 0x67656e655f726e67),
            chemistry,
            field,
            cells,
            sources,
            patch_centers,
            genomes,
            ancestry,
            next_cell,
            next_genome,
            ledger: Ledger::default(),
            events: vec![],
            stop_reason: None,
            field_elapsed: 0.,
            trace: None,
            observer: None,
            exchange: Default::default(),
            contact_cache: Default::default(),
            reactions: Default::default(),
            physiology_jobs: Vec::new(),
            sites: Vec::new(),
            footprints: Default::default(),
            climate,
        };
        let (m, e) = world.held();
        world.ledger.initial_material = m;
        world.ledger.initial_energy = e;
        crate::source_medium::project(&mut world);
        Ok(world)
    }
    pub fn held(&self) -> (f64, f64) {
        let (mut matter, mut energy) = self.field.totals(&self.chemistry);
        for c in &self.cells {
            matter += c.mass() + c.material();
            energy += c.energy;
            energy += c.inventory.projection(&self.chemistry).potential
                + c.bound_material.projection(&self.chemistry).potential;
        }
        for s in &self.sources {
            for (q, p) in s.inventory().zip(&self.chemistry.properties) {
                matter += q;
                energy += q * p.potential;
            }
        }
        (matter, energy)
    }
    pub fn step(&mut self) {
        self.advance(None);
    }
    pub fn execution_work(&self) -> serde_json::Value {
        let mut expiry = [0_u64; 6];
        for cell in &self.cells {
            for (total, count) in expiry
                .iter_mut()
                .zip(crate::controller::expiry_counts(&cell.brain))
            {
                *total += count;
            }
        }
        serde_json::json!({
            "geography":self.field.structural_counts(),
            "controllerExpiry": expiry,
            "reactions": self.reactions.counts(),
            "transport": self.exchange.counts(),
            "footprints": {"preparations": self.footprints.preparations,
                "reuses": self.footprints.reuses},
            "motion": {"preparations": self.contact_cache.motion.preparations,
                "geometry": self.contact_cache.local.counts(),
                "contactPreparations": self.contact_cache.motion.contact_preparations},
        })
    }
    pub fn step_measured(&mut self, clock: impl Fn() -> f64) -> [f64; 9] {
        self.advance(Some(&clock))
    }
    fn advance(&mut self, clock: Option<&dyn Fn() -> f64>) -> [f64; 9] {
        let mut stages = [0.; 9];
        if self.stop_reason.is_some() {
            return stages;
        }
        let now = || clock.map_or(0., |f| f());
        let mut started = now();
        self.field.pressure_strength = self.config.pressure_strength;
        self.field.attraction_length = self.config.attraction_length;
        if !self.cells.is_empty() || !self.sources.is_empty() || self.field.has_active_material() {
            self.field.illumination.prepare(
                self.seed,
                self.tick,
                &self.config,
                self.field.nx,
                self.field.ny,
            );
        }
        if let Some(o) = self.observer.as_mut().filter(|o| o.active()) {
            o.begin(&self.cells);
        }
        if let Some(t) = &mut self.trace {
            t.before(&self.cells, &self.config, &self.field);
        }
        stages[0] = now() - started;
        started = now();
        self.field_elapsed += self.config.dt;
        let physiology = self.field_elapsed + 1e-12 >= self.config.physiology_interval;
        let mut sites = std::mem::take(&mut self.sites);
        self.footprints
            .prepare(&self.cells, &self.config, &mut self.field, &mut sites);
        self.field.freeze_mechanical_stage();
        crate::source_medium::advance_scheduled(self, physiology);
        if physiology {
            self.climate.prepare(&self.config);
            let balance = self.field.advance_weathered(
                &self.chemistry,
                self.field_elapsed,
                self.config.washout,
                self.config.diffusion_impedance,
                Some(&mut self.climate),
            );
            self.ledger.washed_out += balance.matter;
            self.ledger.washout_energy += balance.energy;
            self.ledger.numerical_material += balance.roundoff_matter;
            self.ledger.numerical_energy += balance.roundoff_energy;
            self.ledger.weathering_heat += balance.weathering_heat;
            self.ledger.weathering_work += balance.weathering_work;
            self.ledger.weathered_material += balance.weathered_material;
            self.ledger.sheltered_conversion += balance.sheltered_conversion;
        }
        stages[1] = now() - started;
        started = now();
        self.contact_cache.prepare_local(&self.cells, &self.config);
        if physiology || self.tick == 0 {
            self.sense();
        }
        stages[2] = now() - started;
        started = now();
        self.advance_local(&sites, physiology);
        stages[3] = now() - started;
        started = now();
        if physiology {
            let field = &self.field;
            let signals: Vec<_> = sites
                .par_iter()
                .with_min_len(crate::parallel::TASK_NS / crate::parallel::cost::CELL_MARK)
                .map(|row| {
                    let signal = crate::weathering::signal(std::array::from_fn(|k| {
                        row.iter()
                            .map(|&(n, a)| a * field.medium_signal(n)[k])
                            .sum()
                    }));
                    crate::illumination::drive(signal, field.illumination.sample(row))
                })
                .collect();
            self.footprints
                .prepare(&self.cells, &self.config, &mut self.field, &mut sites);
            let mut interval_config = self.config.clone();
            interval_config.dt = self.field_elapsed;
            self.exchange.profile = clock.is_some();
            self.exchange.advance_prepared(
                &mut self.cells,
                &interval_config,
                &mut self.field,
                &self.chemistry,
                &sites,
                (
                    &mut self.contact_cache,
                    &mut self.ledger,
                    self.observer.as_deref_mut().filter(|o| o.active()),
                ),
            );
            stages[4] = now() - started;
            stages[8] = self.exchange.preparation_ms;
            started = now();
            self.physiology(self.field_elapsed, &signals);
            self.field_elapsed = 0.;
        }
        self.sites = sites;
        stages[5] = now() - started;
        started = now();
        if physiology {
            self.finish_cells();
        }
        self.tick += 1;
        crate::lifecycle::advance(self);
        if let Some(o) = self.observer.as_mut().filter(|o| o.active()) {
            o.finish(self.tick);
        }
        if self.tick.is_multiple_of(128) {
            self.prune_genotypes();
        }
        stages[6] = now() - started;
        self.field.finish_mechanical_stage();
        started = now();
        if let Some(t) = &mut self.trace {
            t.finish(&self.cells, &self.config, self.tick);
            if let Some(s) = &mut t.study {
                s.genomes(&self.genomes);
            }
        }
        stages[7] = now() - started;
        stages
    }
    fn sense(&mut self) {
        let interface = self.contact_cache.graph_prepared(&self.cells, &self.config);
        interface.prepare(&mut self.cells, &self.config, &self.chemistry);
        let cost = crate::parallel::cost::CELL_READ;
        crate::parallel::for_each(&mut self.cells, cost, |_, cell| {
            crate::sensing::observe_external(cell, &self.config, &self.field);
        });
    }
    pub(crate) fn observed_reactions(&self, group: usize) -> &[f64] {
        self.observer
            .as_ref()
            .map_or(&[], |o| &o.interval().groups[group].routes)
    }
    pub fn intervention_budget(&self) -> Result<(), String> {
        if self.events.iter().filter(|e| durable(&e.kind)).count() >= 4096 {
            Err("Manual intervention history limit reached".into())
        } else {
            Ok(())
        }
    }
    fn prune_genotypes(&mut self) {
        if self.genomes.len() <= self.cells.len() * 2 + 64 {
            return;
        }
        self.compact_genotypes();
    }
    /// Drops genotypes no live cell, founder or catalog entry references, unconditionally;
    /// the amortized prune above applies the same rule once the backlog doubles.
    pub fn compact_genotypes(&mut self) {
        let mut retained: BTreeSet<_> = self.cells.iter().map(|c| c.genome).collect();
        for e in self.events.iter().filter(|e| e.kind == "catalog") {
            retained.extend(e.values.iter().copied());
        }
        self.genomes
            .retain(|id, g| g.parent.is_none() || retained.contains(id));
    }
    pub fn event(&mut self, kind: &str, cell: u64, values: Vec<u64>) {
        let location = self
            .cells
            .iter()
            .find(|c| c.id == cell)
            .map(|c| [c.x, c.y, c.radius(&self.config)]);
        self.events.push(Event {
            tick: self.tick,
            kind: kind.into(),
            cell,
            values,
            location,
        });
        let mut recent = self.events.iter().filter(|e| !durable(&e.kind)).count();
        self.events.retain(|e| {
            if !durable(&e.kind) && recent > 512 {
                recent -= 1;
                false
            } else {
                true
            }
        });
    }
    pub fn release_cell(&mut self, cell: &Cell, cause: crate::ancestry::Cause) {
        crate::lifecycle::release(self, cell, cause);
    }
    pub fn snapshot(&self) -> Result<Vec<u8>, String> {
        postcard::to_extend(self, b"ANTROPY41\0".to_vec()).map_err(|e| e.to_string())
    }
    pub fn restore(bytes: &[u8]) -> Result<Self, String> {
        let bytes = bytes
            .strip_prefix(b"ANTROPY41\0")
            .ok_or("Unsupported physical checkpoint; v41 required")?;
        let (mut world, tail): (Self, &[u8]) =
            postcard::take_from_bytes(bytes).map_err(|e| e.to_string())?;
        if !tail.is_empty() || world.version != VERSION {
            return Err("Unsupported or trailing physical checkpoint data".into());
        }
        // Site projections are derived state: recompute them before validating the world.
        world.chemistry.validate()?;
        world.field.validate()?;
        world.field.refresh_features(&world.chemistry);
        world.validate()?;
        world.field.pressure_strength = world.config.pressure_strength;
        world.climate = crate::climate::Climate::new(&world.config, &world.chemistry);
        for s in &mut world.sources {
            s.rebuild(&world.config, &world.field);
            // Release accrues with the medium interval; checkpoints carry that shared clock.
            s.pending = if s.amount > 0. {
                world.field_elapsed
            } else {
                0.
            };
        }
        for g in world.genomes.values_mut() {
            g.compile(&world.config, &world.chemistry);
        }
        for cell in &mut world.cells {
            let target = world.genomes[&cell.genome].compiled.as_ref().unwrap();
            cell.operators = Some(target.operators.clone());
        }
        crate::source_medium::project(&mut world);
        Ok(world)
    }
    pub fn validate(&self) -> Result<(), String> {
        if self.version != VERSION {
            return Err("Unsupported physical checkpoint version".into());
        }
        self.config.validate()?;
        self.chemistry.validate()?;
        self.field.validate()?;
        self.field.validate_reductions(&self.chemistry)?;
        if self.ancestry.len() > self.config.max_ancestry_records
            || self.next_cell != self.ancestry.len() as u64 + 1
            || !self.field_elapsed.is_finite()
            || self.field_elapsed < 0.
            || self.field_elapsed >= self.config.physiology_interval
        {
            return Err("Invalid world capacity or schedule".into());
        }
        if self.field.spacing != self.config.mesh
            || self.field.nx as f64 * self.field.spacing != self.config.width
            || self.field.ny as f64 * self.field.spacing != self.config.height
        {
            return Err("Field and world dimensions disagree".into());
        }
        let mut living = BTreeSet::new();
        for (id, g) in &self.genomes {
            if *id != g.id
                || *id == 0
                || *id >= self.next_genome
                || g.parent.is_some_and(|p| p == 0 || p >= g.id)
                || g.born > self.tick
                || !g.learned.is_finite()
                || g.learned < 0.
            {
                return Err("Invalid genotype history".into());
            }
            g.validate(&self.config)?;
        }
        for cell in &self.cells {
            cell.validate(&self.config)?;
            if !living.insert(cell.id)
                || cell.id == 0
                || cell.id >= self.next_cell
                || !self.genomes.contains_key(&cell.genome)
            {
                return Err("Invalid living identity".into());
            }
            let a = &self.ancestry[cell.id as usize - 1];
            if a.parent() != cell.parent || a.lineage != cell.lineage || a.genome != cell.genome {
                return Err("Body and ancestry disagree".into());
            }
        }
        crate::world_validation::history(self, &living)?;
        crate::world_validation::environment(self)
    }
}
fn durable(kind: &str) -> bool {
    matches!(
        kind,
        "override"
            | "intervention"
            | "authored-founders"
            | "external-pulse"
            | "study-policy"
            | "replace-lineage"
            | "catalog-append"
            | "catalog"
            | "counterfactual"
            | "scheduled-source"
    )
}
