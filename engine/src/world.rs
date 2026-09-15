use crate::{
    accounting::Ledger,
    chemistry::Chemistry,
    config::Config,
    field::Field,
    genetics::Genotype,
    metabolism, movement,
    organism::{Cell, Flows},
    random::Random,
    sensing,
    sources::{self, Source},
    transport,
};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

pub const VERSION: u32 = 12;
pub use crate::ancestry::Ancestor;
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Event {
    pub tick: u64,
    pub kind: String,
    pub cell: u64,
    pub values: Vec<u64>,
    pub location: Option<[f64; 3]>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
    pub genomes: BTreeMap<u64, Genotype>,
    pub ancestry: Vec<Ancestor>,
    pub next_cell: u64,
    pub next_genome: u64,
    pub ledger: Ledger,
    pub events: Vec<Event>,
    pub stop_reason: Option<String>,
    pub field_elapsed: f64,
    #[serde(skip)]
    reaction_work: metabolism::Work,
    #[serde(skip)]
    transport_work: transport::Work,
    #[serde(skip)]
    pub trace: Option<crate::trace::Trace>,
}
impl World {
    pub fn new(seed: u64, mut config: Config) -> Result<Self, String> {
        config.validate()?;
        let chemistry = Chemistry::new(config.chemistry_seed)?;
        if config.source_species.is_empty() {
            config.source_species = chemistry.source_species();
        }
        let field = Field::new(config.width, config.height, config.mesh);
        let mut environment_rng = Random::new(seed ^ 0x7321);
        let (patch_centers, habitats) = sources::landscape(&config, &mut environment_rng);
        let sources = habitats
            .into_iter()
            .map(|h| Source::new(h, 0, &config, &mut environment_rng, &field))
            .collect();
        let genotype = Genotype::seed(&config, &chemistry);
        let mut genomes = BTreeMap::new();
        genomes.insert(1, genotype);
        let mut w = Self {
            version: VERSION,
            seed,
            tick: 0,
            rng: Random::new(seed),
            genetic_rng: Random::new(seed ^ 0x6713),
            environment_rng,
            chemistry,
            field,
            cells: vec![],
            sources,
            patch_centers,
            genomes,
            ancestry: vec![],
            next_cell: 1,
            next_genome: 2,
            ledger: Ledger::default(),
            events: vec![],
            stop_reason: None,
            field_elapsed: 0.,
            reaction_work: metabolism::Work::default(),
            transport_work: transport::Work::default(),
            trace: None,
            config,
        };
        for source in &mut w.sources {
            source.release(
                w.config.source_priming,
                &mut w.field,
                &w.chemistry,
                &mut w.ledger,
            );
        }
        w.place_founders()?;
        let (matter, energy) = w.held();
        w.ledger.initial_material = matter;
        w.ledger.initial_energy = energy;
        // Initialization is measured after priming; its rounding is part of the initial state.
        w.ledger.numerical_material = 0.;
        w.ledger.numerical_energy = 0.;
        Ok(w)
    }
    fn place_founders(&mut self) -> Result<(), String> {
        let c = &self.config;
        let compiled = self.genomes[&1].compiled.as_ref().unwrap();
        let first = self
            .sources
            .first()
            .map(|s| [s.habitat.x, s.habitat.y])
            .unwrap_or([c.width * 0.25, c.height * 0.5]);
        let far = self
            .sources
            .iter()
            .map(|s| [s.habitat.x, s.habitat.y])
            .max_by(|a, b| {
                movement::distance(*a, first, c).total_cmp(&movement::distance(*b, first, c))
            })
            .unwrap_or([c.width * 0.75, c.height * 0.5]);
        let far = if movement::distance(first, far, c) < c.width.min(c.height) * 0.1 {
            [(first[0] + c.width / 2.).rem_euclid(c.width), first[1]]
        } else {
            far
        };
        let centers = [first, far];
        let mut index = movement::Spatial::new(c, &[]);
        for i in 0..c.founders {
            let center = centers[i % 2];
            let mut cell = Cell::new(
                self.next_cell,
                1,
                compiled,
                c,
                center[0],
                center[1],
                self.rng.unit() * std::f64::consts::TAU,
            );
            let radius = cell.radius(c);
            let mut placed = false;
            for attempt in 0..10000 {
                let extent = (c.founders as f64 / 2.).sqrt().max(2.5) * radius * 1.5
                    + (attempt / 200) as f64 * radius;
                let angle = self.rng.unit() * std::f64::consts::TAU;
                let reach = extent * self.rng.unit().sqrt();
                cell.x = (center[0] + angle.cos() * reach).rem_euclid(c.width);
                cell.y = (center[1] + angle.sin() * reach).rem_euclid(c.height);
                if index.free([cell.x, cell.y], radius, usize::MAX, &self.cells, c) {
                    placed = true;
                    break;
                }
            }
            if !placed {
                return Err("Founder placement exceeds physical capacity".into());
            }
            sensing::initialize(&mut cell, compiled, c, &self.field);
            index.add(self.cells.len(), &cell, radius);
            self.ancestry.push(Ancestor {
                id: cell.id,
                parent: 0,
                lineage: cell.id,
                genome: 1,
                born: 0,
                ended: crate::ancestry::ALIVE,
                cause: crate::ancestry::Cause::Alive,
            });
            self.cells.push(cell);
            self.next_cell += 1;
        }
        Ok(())
    }
    pub fn step(&mut self) {
        self.step_measured(|| 0.);
    }
    /// The clock observes stage durations only; no physical decision reads it.
    pub fn step_measured(&mut self, mut clock: impl FnMut() -> f64) -> [f64; 9] {
        let mut times = [0.; 9];
        let mut mark = clock();
        if self.stop_reason.is_some() {
            return times;
        }
        for cell in &mut self.cells {
            cell.flows = Flows::default();
        }
        self.ledger.organism_time += self.cells.len() as f64 * self.config.dt;
        if let Some(trace) = &mut self.trace {
            trace.before(&self.cells, &self.config, &self.field);
        }
        for source in &mut self.sources {
            source.advance(
                self.tick,
                &self.config,
                &mut self.environment_rng,
                &mut self.field,
                &self.chemistry,
                &mut self.ledger,
            );
        }
        self.field_elapsed += self.config.dt;
        let physiology = self.field_elapsed + 1e-12 >= self.config.physiology_interval;
        let mut slow = self.config.clone();
        slow.dt = self.field_elapsed;
        if physiology {
            let b = self.field.advance(
                &self.chemistry,
                self.field_elapsed,
                self.config.washout,
                self.config.diffusion_impedance,
            );
            self.ledger.washed_out += b.matter;
            self.ledger.washout_energy += b.energy;
            self.ledger.numerical_material += b.roundoff_matter;
            self.ledger.numerical_energy += b.roundoff_energy;
            self.field_elapsed = 0.;
        }
        let now = clock();
        times[0] = now - mark;
        mark = now;
        self.disturb();
        let now = clock();
        times[1] = now - mark;
        mark = now;
        if physiology {
            for cell in &mut self.cells {
                crate::refitting::attempt(cell, &self.genomes, &slow);
                let g = self.genomes[&cell.genome].compiled.as_ref().unwrap();
                let installed = self.genomes[&cell.machinery_genome]
                    .compiled
                    .as_ref()
                    .unwrap();
                if sensing::infer(cell, g, installed, &slow, &self.field) {
                    self.ledger.task_writes += 1;
                }
            }
        }
        let now = clock();
        times[2] = now - mark;
        mark = now;
        movement::move_cells(&mut self.cells, &self.config, &self.field, &mut self.rng);
        let now = clock();
        times[3] = now - mark;
        mark = now;
        if physiology {
            for cell in &mut self.cells {
                sensing::injure(
                    cell,
                    self.genomes[&cell.genome].compiled.as_ref().unwrap(),
                    &slow,
                    &self.field,
                    &self.chemistry,
                );
            }
        }
        let now = clock();
        times[4] = now - mark;
        mark = now;
        if physiology {
            transport::exchange(
                &mut self.cells,
                &self.genomes,
                &slow,
                &mut self.field,
                &self.chemistry,
                &mut self.ledger,
                &mut self.transport_work,
            );
        }
        let now = clock();
        times[5] = now - mark;
        mark = now;
        for cell in &mut self.cells {
            let g = self.genomes[&cell.genome].compiled.as_ref().unwrap();
            if physiology {
                let installed = self.genomes[&cell.machinery_genome]
                    .compiled
                    .as_ref()
                    .unwrap();
                metabolism::react(
                    cell,
                    installed,
                    &slow,
                    &mut self.reaction_work,
                    &mut self.ledger,
                );
                if let Some(trace) = &mut self.trace {
                    trace.reactions(cell, &self.reaction_work);
                }
                metabolism::develop(
                    cell,
                    g,
                    &slow,
                    &self.chemistry,
                    &mut self.field,
                    &mut self.ledger,
                );
            }
            self.ledger.accumulate(&cell.flows);
            if let Some(trace) = &mut self.trace {
                trace.capture(cell, self.tick);
            }
        }
        let now = clock();
        times[6] = now - mark;
        mark = now;
        if physiology {
            movement::resolve(&mut self.cells, &self.config);
            self.reproduce();
        }
        self.transfer();
        self.tick += 1;
        if let Some(trace) = &mut self.trace {
            trace.finish(&self.cells, &self.config, self.tick);
            if let Some(study) = &mut trace.study {
                study.genomes(&self.genomes);
            }
        }
        let now = clock();
        times[7] = now - mark;
        mark = now;
        self.trim_events();
        if self.genomes.len() > 4 * self.cells.len() + 256 {
            let living: BTreeSet<_> = self
                .cells
                .iter()
                .flat_map(|c| [c.genome, c.machinery_genome])
                .collect();
            self.genomes
                .retain(|id, g| g.parent.is_none() || living.contains(id));
        }
        times[8] = clock() - mark;
        times
    }
    pub fn held(&self) -> (f64, f64) {
        let (mut matter, mut energy) = self.field.totals(&self.chemistry);
        let body = self.chemistry.properties[self.chemistry.decomposition].potential;
        for source in &self.sources {
            for (q, p) in source.inventory.iter().zip(&self.chemistry.properties) {
                matter += q;
                energy += q * p.potential;
            }
        }
        for cell in &self.cells {
            matter += cell.mass() + cell.material();
            energy += cell.mass() * body
                + cell.energy
                + cell
                    .inventory
                    .iter()
                    .zip(&self.chemistry.properties)
                    .map(|(q, p)| q * p.potential)
                    .sum::<f64>();
        }
        (matter, energy)
    }
    pub fn event(&mut self, kind: &str, cell: u64, values: Vec<u64>) {
        self.events.push(Event {
            tick: self.tick,
            kind: kind.into(),
            cell,
            values,
            location: None,
        });
    }
    pub fn intervention_budget(&self) -> Result<(), String> {
        if self
            .events
            .iter()
            .filter(|e| durable_event(&e.kind))
            .count()
            >= 4096
        {
            return Err("Manual intervention history limit reached; export this experiment".into());
        }
        Ok(())
    }
    fn trim_events(&mut self) {
        if self.events.len() <= 512 {
            return;
        }
        let recent = self
            .events
            .iter()
            .filter(|e| !durable_event(&e.kind))
            .count();
        let mut discard = recent.saturating_sub(512);
        self.events.retain(|e| {
            if discard > 0 && !durable_event(&e.kind) {
                discard -= 1;
                false
            } else {
                true
            }
        });
    }
    pub fn restore(bytes: &[u8]) -> Result<Self, String> {
        let payload = bytes
            .strip_prefix(b"ANTROPY12\0")
            .ok_or("Incompatible checkpoint; digital chemistry engine v12 required")?;
        let (mut w, remainder): (Self, _) =
            postcard::take_from_bytes(payload).map_err(|e| e.to_string())?;
        if !remainder.is_empty() {
            return Err("Trailing checkpoint bytes".into());
        }
        w.validate()?;
        w.field.rebuild();
        for g in w.genomes.values_mut() {
            g.compile(&w.config, &w.chemistry);
        }
        for s in &mut w.sources {
            s.rebuild(&w.config, &w.field);
        }
        Ok(w)
    }
    pub fn snapshot(&self) -> Result<Vec<u8>, String> {
        postcard::to_extend(self, b"ANTROPY12\0".to_vec()).map_err(|e| e.to_string())
    }
    pub fn validate(&self) -> Result<(), String> {
        if self.version != VERSION {
            return Err("Incompatible world version".into());
        }
        self.config.validate()?;
        self.chemistry.validate()?;
        self.field.validate()?;
        self.field.validate_reductions(&self.chemistry)?;
        if self
            .events
            .iter()
            .filter(|e| durable_event(&e.kind))
            .count()
            > 4096
            || self.events.len() > 4608
        {
            return Err("Event history exceeds its operating limit".into());
        }
        if !self.field_elapsed.is_finite()
            || self.field_elapsed < 0.
            || self.field_elapsed >= self.config.physiology_interval + 1e-12
        {
            return Err("Invalid integration clock".into());
        }
        if self.field.nx as f64 * self.field.spacing != self.config.width
            || self.field.ny as f64 * self.field.spacing != self.config.height
            || self.field.spacing != self.config.mesh
        {
            return Err("Field/configuration mismatch".into());
        }
        if self.cells.len() > self.config.max_population
            || self.ancestry.len() > self.config.max_ancestry_records
            || self.next_cell != self.ancestry.len() as u64 + 1
        {
            return Err("Invalid population history".into());
        }
        for (id, g) in &self.genomes {
            if *id == 0
                || *id != g.id
                || *id >= self.next_genome
                || g.born > self.tick
                || g.parent.is_some_and(|p| p == 0 || p >= *id)
            {
                return Err("Invalid genome identity".into());
            }
            g.validate(&self.config)?;
        }
        let mut ids = BTreeSet::new();
        for cell in &self.cells {
            cell.validate(&self.config)?;
            if !ids.insert(cell.id)
                || !self.genomes.contains_key(&cell.genome)
                || !self.genomes.contains_key(&cell.machinery_genome)
                || cell.id == 0
                || cell.id >= self.next_cell
            {
                return Err("Invalid cell identity".into());
            }
            let a = &self.ancestry[cell.id as usize - 1];
            if a.ended().is_some()
                || a.genome != cell.genome
                || a.parent() != cell.parent
                || a.lineage != cell.lineage
            {
                return Err("Invalid living ancestry".into());
            }
        }
        crate::world_validation::history(self, &ids)?;
        crate::world_validation::environment(self)
    }
}
fn durable_event(kind: &str) -> bool {
    matches!(
        kind,
        "override" | "intervention" | "study-policy" | "counterfactual" | "catalog"
    )
}
