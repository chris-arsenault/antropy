# Ant Evolution Simulation — Design Specification

A browser-based, 3D, continuous-time artificial life simulation in which ants with heritable
genomes forage, dig, reproduce, and evolve. There is no fitness function and no generational
boundary: selection is implicit in survival and reproduction inside a persistent, shared world.

This document records the design decisions reached through discussion, including the reasoning
behind rejected alternatives where that reasoning constrains future work. It is a design-level
document; algorithms appear only where the design discussion produced them.

---

## 1. Design Principles

1. **No explicit fitness.** Ants are never scored. Genomes propagate because their bearers
   survive and reproduce in continuous simulation; genomes disappear because their bearers die.
   Fitness is an emergent statistic, not an input.
2. **No generational boundary.** Ants live, reproduce, and die on individual schedules.
   Populations turn over continuously. There are no synchronized resets, no batch evaluation
   phases, and no "run N seconds, breed the top 20%."
3. **Hand-code the interface, not the behavior.** The simulation defines what an ant can
   *perceive* (sensory inputs) and what an ant can *do* (motor outputs). The mapping between
   them is entirely genomic. If trail-following, digging strategy, egg-guarding, cannibalism,
   or caste-like division of labor appear, they appear because they evolved.
4. **Every trait sits on a tradeoff.** Any gene that buys capability must cost energy,
   speed, or opportunity. Free traits get maximized and produce boring convergence.
5. **Each ant carries its own genome copy.** Genetic identity is per-individual. Colonies
   contain genuine internal genetic diversity, not clones of a template.
6. **The environment carries the teaching load.** Bootstrap viability and long-run
   interestingness come from initialization and world design (wide genetic priors, structured
   seeding, food curriculum, recurrent regimes), not from hand-authored behavior.
7. **Legibility is instrumented, not imposed.** The simulation runs as fast as evolution
   needs; watching is made possible by speed decoupling, event detection, checkpointing, and
   live genetic instrumentation — not by slowing evolution down to viewing speed.

---

## 2. Behavioral Controller

### 2.1 Chosen model: fixed-topology recurrent neural network with structured initialization

Each ant's behavior is computed by a small RNN whose weights are genes.

- **Topology:** fixed. Approximately 20 sensory inputs → 10–12 recurrent hidden units →
  8 motor outputs (final counts set by the sensor/motor spec in §4). Roughly 550 weights.
- **Recurrence is mandatory.** The hidden state is the ant's only memory; it is what allows
  de facto behavioral modes, persistence after losing a scent, and other memory-dependent
  behavior to evolve without any hand-coded state machine.
- **Structured initialization ("instinct in erasable ink"):** founder genomes are not random.
  They are initialized as a working Braitenberg-style chemotaxis mapping (food scent →
  approach) with all other weights near zero plus wide noise (see §10). This guarantees
  day-one viability without permanently hand-coding any behavior — the instinct is just
  weights, and lineages may strengthen, repurpose, or abandon it.
- **Per-tick cost:** the controller reports a metabolic "thinking" cost each tick. For the
  RNN this is a constant; the field exists for controller swappability (§2.3).

### 2.2 Considered and deferred/rejected alternatives

The controller possibility space was analyzed in depth; recording the map because it governs
future substitutions:

- **Parameterized fixed algorithm** (evolvable steering weights on authored behaviors):
  rejected. Bootstraps trivially but the possibility space is exactly what was authored;
  evolution reduces to tuning the designer's algorithm.
- **Braitenberg matrix** (pure linear sensor→motor): rejected as the primary model (no
  memory, hard expressiveness ceiling) but recognized as the natural *initialization
  target* for the RNN and as a trivial reference controller for testing.
- **Naively initialized RNN:** rejected — under continuous selection with no batch rescue,
  random-init populations are a single point of failure (spinners and statues starve before
  selection finds anything).
- **Evolvable rule lists / tree GP:** rejected for rugged landscapes and destructive
  crossover (trees especially).
- **Linear genetic programming** (register-machine programs, persistent registers,
  homologous crossover, per-instruction energy cost): assessed as the strongest alternative
  and the likely second controller. Its advantages are legibility (effective-code extraction
  makes evolved strategies literally readable), ecologically priced cognition, and
  punctuated dynamics; its costs are a rougher landscape and an incompatible diploid
  expression model. **Deferred, not rejected.**
- **NEAT-style topology evolution:** deferred; its speciation machinery presumes
  generational populations. Structural mutation on the fixed topology is the cheaper
  upgrade path if hidden capacity bottlenecks.

### 2.3 Controller substitutability requirement

The simulation must treat the controller as a pluggable module behind a fixed contract, so
the GP controller (or others) can be substituted without redesigning the simulation:

- `act(genome, inputs, internalState) → (outputs, thinkCost)`
- `mutate(genome, σ) → genome`
- `recombine(genomeA, genomeB) → genome` (may be null/asexual for some controllers)
- `seed() → genome` (structured-init founder)

Constraints this imposes on the rest of the design:

- Nothing outside the controller may inspect genome internals.
- The inheritance/ploidy model lives *behind* `recombine` (diploid weight-averaging is
  RNN-specific and does not transfer to programs; swapping controllers may legitimately
  swap the genetic system).
- Evolvable mutation rate σ is a normalized 0–1 physical gene; each controller interprets
  it internally.
- Instrumentation must be controller-agnostic (lineage tracking, assays, population
  statistics operate on behavior and bookkeeping, not genome internals).

---

## 3. Genome

Two linked components, both carried per-ant, both mutated at egg creation.

### 3.1 Behavioral genome

The controller genome (RNN weights under the chosen model). Majority of total genome size.

### 3.2 Physical genome (~10 real-valued genes, each on a tradeoff)

Representative set (exact list finalized during build):

| Gene | Buys | Costs |
|---|---|---|
| body size (target adult scale) | dig strength, carry capacity, starvation buffer | superlinear basal metabolism, worse slope/climb economics |
| leg length | speed | energy per step, turn-rate penalty |
| sensor gain | perception range/acuity | metabolic drain scaling superlinearly with range |
| storage capacity | famine survival | movement cost when full |
| egg energy endowment | offspring head start | direct maternal energy transfer |
| lifespan cap | more reproductive lifetime | metabolic tradeoff (allows senescence strategies to evolve) |
| mutation σ | evolvability | expressed as offspring genome noise; self-tuning (expected to run hot early, breed downward as lineages find conserved structure) |

### 3.3 Mutation and recombination

- Mutation occurs at egg creation: Gaussian perturbation with per-lineage evolvable σ, plus
  occasional larger structural kicks (zero a weight, randomize a weight).
- Recombination per the reproduction system (§7); crossover is valued because it lets two
  half-good genomes combine.

---

## 4. Sensory and Motor Interface

The only hand-authored behavioral surface in the simulation. Approximate composition
(normalized floats; final layout fixed in the build spec):

**Inputs (~20):**
- Stereo (left/right antenna) samples of pheromone channel A and channel B — 4 values.
  Stereo sampling provides gradient information without computing gradients for the ant.
- Stereo food scent intensity — 2.
- Internal: energy level, age fraction, carrying-load fraction, carried-material type,
  own body scale (required for emergent caste behavior, §8).
- Local geometry: depth/darkness, facing-direction slope, compact local-solidity summary
  (surrounding voxel occupancy).
- Social/contact: local crowding; contact flags for food, egg, other ant.

**Outputs (~8):**
- Turn rate; forward thrust; vertical bias (up/down preference in the lattice).
- Eat (attempt to consume whatever is at mandibles — food **or egg**; cannibalism and
  egg-policing are in the possibility space by construction, never specifically coded).
- Dig (§5.4).
- Deposit pheromone A intensity; deposit pheromone B intensity.
- Lay egg (role-dependent; see §7).

**Pheromone channels carry no assigned meaning.** They are blank, energy-costed signaling
channels. Evolved use (trails, dispersal signals, anything) is an emergent result, not a
labeled mechanic.

---

## 5. The World

### 5.1 Voxel volume

- Finite 3D voxel grid; initial target on the order of 256×256×96 at a scale of one ant per
  voxel, one-voxel tunnel bore. Multiple colonies imply pressure toward wider maps; the
  design must scale the grid without structural change.
- **Single interconnected map.** Multiple colonies share one world — never parallel
  instances — because inter-colony contact (competition, raiding, eventual warrior morphs)
  is a core long-run driver.
- Storage: flat typed array of material IDs; chunked meshing (16³) with dirty-chunk
  remeshing, since digging touches few voxels per tick.

### 5.2 Materials

From day one: `AIR`, `TOPSOIL` (cheap dig), `CLAY` (expensive dig), `ROCK` (undiggable),
`FOOD`, `LOOSE_FILL` (spoil/collapsed tunnels; digs cheaper than virgin soil), with
reserved IDs for `WATER` and additional soils for the future ecosystem stage.

Initial terrain: fBm noise surface over depth-layered materials with noise-warped
boundaries (topsoil skin, clay bands, rock basement). Material layering makes dig-cost a
function of place — terrain as selection pressure.

### 5.3 Movement: voxel-lattice hopping

- An ant occupies an air voxel adjacent to at least one solid voxel (ants cling; gravity
  does not govern locomotion). Movement steps to adjacent air voxels that also touch solid.
- Tunnels, chimneys, overhangs, and ceiling-walking come free; no surface-constraint
  physics. An ant with no solid neighbor falls (rare; minor energy cost).
- Rendering interpolates between voxel positions so motion reads as continuous. This
  decision deliberately trades continuous-position physics (rejected as a physics project)
  for near-equivalent behavior at a fraction of the engineering cost.

### 5.4 Digging and spoil conservation

- Dig is a genomic motor output: converts the faced solid voxel to air at an energy cost
  scaled by material hardness.
- **Spoil is conserved.** Digging loads the ant with spoil (visible in the carrying-load
  input); spoil must be deposited in an air voxel, where it stacks as `LOOSE_FILL`.
  Consequences that motivated this choice: surface spoil heaps *are* the anthill (the cone
  emerges from logistics, not art direction); dumped fill can re-block passages, giving
  nest architecture real constraints and future adversarial uses. Vanishing spoil is the
  documented fallback only if spoil logistics stall early evolution.

### 5.5 Pheromones in the volume

Two scent channels stored per **air** voxel (sparse), diffusing along air-adjacency and
evaporating multiplicatively. Deposition costs energy. Structural consequence embraced by
the design: tunnel architecture shapes signal propagation (galleries channel gradients,
chambers pool scent), so nest shape and communication co-evolve.

With multiple colonies, deposits are colony-tagged (or per-colony channel pairs) to prevent
trail cross-contamination. This is the main per-colony machinery cost.

---

## 6. Energy Economy

- Universal currency: energy. Sources: eating `FOOD` voxels/items, eggs, and corpses
  (corpses persist as edible energy — closes the nutrient loop and stabilizes the ecology).
- Sinks: basal metabolism (size-scaled, superlinear), movement (leg-length-scaled),
  digging (hardness-scaled), pheromone deposition, sensor upkeep, controller think-cost,
  egg endowment, spoil carriage.
- Death at energy ≤ 0 or age-out. Death is the selection event; there is no other grader.
- **Population governor:** food spawn is tied to a carrying-capacity relationship
  (density-dependent), preventing boom-extinction oscillation. Carrying capacity is
  deliberately non-static (§9.3).

---

## 7. Reproduction, Gene Flow, and Colony Structure

### 7.1 The core tension, and the chosen resolution

Colony realism and individual-level selection pull in opposite directions: eusociality *is*
the suppression of individual reproduction. Pure queen-line genetics (colony as sole unit of
selection) was rejected as too slow and too low-variance — worker genomes would be
evolutionary dead ends, within-colony diversity a decorative mutational cloud, and the
GA's value invisible until deep colony-generations. Pure individual reproduction (no
enforced colony) was rejected because eusociality will not plausibly self-assemble and the
colony-level content (castes, architecture, warfare) is a project goal.

**Chosen: a colony chassis with three gene channels, one of them deliberately unbiological.**

1. **Polyandrous founding (real biology).** A founding queen mates with several males and
   stores mixed sperm; each fertilized egg draws a father. A *young* colony therefore
   contains multiple genetically distinct patrilines from its first eggs — early
   within-colony variance is a starting condition, not a late-stage achievement.
2. **Worker-laid males (real biology).** Workers can fire the lay-egg output unmated,
   producing haploid male eggs. Successful workers pass their genomes into the wider gene
   pool through sons that fly and mate with new queens. Worker egg-policing (workers eating
   each other's eggs) is supported for free by the existing eat-egg mechanic and is an
   open evolutionary question, not a rule.
3. **Merit-weighted royal succession (deliberate departure from biology).** When a colony
   produces a new queen egg, its genome is recombined from the queen line *and* a
   high-performing worker lineage — weighted by tracked per-patriline food delivery. This
   is the wire that routes individual worker success directly into the germ line within a
   single colony generation, making selection fast while colonies stay coherent. If pure
   biology is later preferred, channel 2 alone is the purist fallback (slower).

Haplodiploid inheritance (haploid males expressing a single genome copy raw; diploid
females expressing, under the RNN controller, the average of two copies) is retained, and
lives entirely behind the controller's `recombine` boundary (§2.3).

### 7.2 Queen and colony objects

- For the initial build, the queen is a special-cased deterministic egg factory holding the
  colony's founding genetics (sperm list, egg production driven by delivered food).
  Queen-destined eggs are flagged by the colony-founding trigger.
- A colony is deliberately lightweight: a queen entity, home position, sperm list, and
  bookkeeping counters. Ants are just ants. Scaling colony count is a loop, not a subsystem.
- Colony founding: at a stockpile threshold, winged-queen eggs are produced; a matured
  queen disperses a flight distance, digs a scripted founding chamber, and begins laying.
  Colony death: queen death (starvation; later, raids and senescence).

### 7.3 Eggs and development

- Eggs are physical world objects: they occupy voxels, tick an incubation timer, inherit
  genome at lay-time, are edible by any ant, and can suffer exposure rules (slope, depth).
- Hatchlings are juveniles at a fraction of adult scale, growing toward genetic target size
  by converting food to body mass. Most deaths should be young deaths — the survivorship
  curve is the continuous-simulation embodiment of selection.

---

## 8. Castes: One Dial, Emergence Does the Rest

No caste types are built. One developmental mechanism is authored: **adult body scale is a
function of larval feeding** (food deposited on the egg/larva by workers during
incubation). Body scale drives the existing physical tradeoffs, and every ant receives its
own body scale as a sensory input.

If lineages evolve controllers that branch behavior on that input — large ants dig, small
ants forage — then behavioral castes have genuinely evolved from a single genome via
developmental plasticity, mirroring real ant polymorphism. Soldier/warrior morphs get their
selective opportunity when inter-colony contact matures. Queens remain special-cased until
there is a reason not to. If castes fail to emerge and are required, the documented
fallback is differentiated input/output channels — forced structure, acknowledged as such.

---

## 9. Recurrent Regimes: The Anti-Ratchet Requirements

The identified failure mode: the world matures monotonically (nest grows, map fills,
population pins at carrying capacity), the intense transient regimes (founding, growth,
land-grab) occur exactly once at t=0 to genomes that cannot exploit them, and thereafter
evolution grinds inside a static capped space. Carrying capacity itself is not the problem —
at capacity, selection changes character (r-selection below K, zero-sum K-selection at K)
rather than stopping — but a *static* environment at K converges and stalls, and slow
turnover at K starves selection of events.

**All three mechanisms below are binding requirements of the design.** The initial build may
run a reduced configuration (small map, few colonies, stable-population evolution only),
but no architectural decision may preclude them.

### 9.1 Colony mortality and refounding (metapopulation)

Queens age and die; colonies collapse; new queens found on the shared map. At any moment
the map holds colonies at staggered life stages, so founding competence and growth
competence remain under *continuous* selection rather than being one-shot events. The
~99% founding-mortality funnel — the most concentrated selection event in real ant
biology — recurs indefinitely. This, not lineage parallelism, is the load-bearing argument
for multiple colonies.

### 9.2 Nest decay

Underground air voxels without ant traffic for a duration have a chance to collapse to
`LOOSE_FILL` (which digs cheap — abandoned nests become attractive refounding sites, as in
real ants; rain events may later accelerate decay). Nest architecture is thereby *rented*:
it tracks the living workforce, shrinks with the colony, keeps digging permanently under
selection, and prevents the map from becoming a fossil of every tunnel ever dug. Decay
rates must punish abandonment, not existence — a healthy colony's core must be stable.

### 9.3 Oscillating carrying capacity (seasons)

Food spawn rates follow a slow sinusoid plus noise. K breathes; populations overshoot and
crash cyclically; the map alternates between r-regimes (post-scarcity rebound, open niches)
and K-regimes (saturation) forever. This is the canonical driver of storage and bet-hedging
strategies — colony stockpiling acquires an evolutionary reason to exist. The future
soil/water/ecosystem work layers spatial heterogeneity on top of this temporal
heterogeneity.

Supporting knob: turnover (worker lifespan, aging, egg predation) is the selection clock in
the K-regime. If evolution stalls at capacity, lifespan is the first dial, not mutation
rate.

**Resulting shape of the simulation:** the repeating unit is the regime cycle
*founding → growth → saturation → competition → collapse → refounding*, with different
traits under selection in each phase and lineages graded on the whole loop.

---

## 10. Initialization: Diversity Is Free at t=0

Rejected framing: "a genetically diverse colony is by definition a late-stage colony."
Diversity does not need to be generated by mutation over time — founder genomes are
initialized anyway, so they are initialized *wide*:

- Structured chemotaxis backbone (§2.1) plus large-σ noise on all other weights and
  physical genes.
- Independent draws per founding queen, per stored-sperm male, per egg.
- Opening era is food-dense (curriculum), with the carrying-capacity squeeze applying
  gradually.

Evolution's first act is therefore *subtractive* — differential death pruning a wide
prior — which is visible in instrumentation within the first session, long before any
constructive novelty appears. Expected arc of interestingness:

- **Act one** (minutes–hours): selection prunes the prior; lineage survival curves diverge.
  *Chart-legible.*
- **Act two** (hours–days): recombination assembles working combinations; first competent
  foraging sweeps. *Assay-legible.*
- **Act three** (days+): novel strategies, evolved signaling, caste hints, architecture.
  *World-legible.*

---

## 11. Legibility and Timescale

Principle: wall-clock evolution rate = ticks/second × selection-events/tick. Legibility
constrains only the rendered tick rate, and only while watching. The two factors are
attacked independently, and watching is made *targeted* rather than evolution made slow.

### 11.1 Speed decoupling

- Fixed-timestep simulation; renderer interpolates.
- Speed control: 1× (ant-watching) → ~10× (hurried but readable) → 100–1000×
  (individual rendering off; charts only) → headless burst mode.
- Simulation load (thousands of ants × ~550-weight RNNs × lattice moves) is far below the
  rendering cost; at high speed rendering is simply disabled.

### 11.2 Checkpointing

Full world + genome serialization to local storage / downloadable files. A continuous
simulation that cannot be saved will be lost at generation 900. The expected usage pattern
is overnight headless runs plus replay-from-checkpoint.

### 11.3 Event detection ("the sim tells you when to look")

Cheap triggers logged to a timeline, optionally auto-dropping speed to 1× and moving the
camera: colony founded/died; lineage crosses population-share thresholds; mean gene moves
> 2σ in a window; first ant reaches depth X; spoil heap exceeds height Y; per-region
regime transitions (population vs. local food budget — watch selection change character
across the r/K cycle). Combined with checkpoints, notable events can be re-watched by
reloading the prior checkpoint at 1×.

### 11.4 Genetic instrumentation (from tick one)

- Per-gene mean/variance tracks over time; population counts; two-gene scatter colored by
  lineage.
- Lineage/patriline coloring in the 3D view (per-ant lineage bookkeeping — father ID,
  patriline tag, delivery counters — lives in the core ant record from day one; cheap now,
  miserable to retrofit).
- **Live selection-differential readout:** per-gene correlation between gene value and
  survival/food-delivery among currently living ants — shows selection *operating* before
  accumulated results exist. The earliest proof-of-life for the GA.
- Selected-ant inspector: live sensory inputs, motor outputs, hidden-state activity.
- Offline behavioral assays: clone a genome into an isolated test arena with controlled
  stimuli to characterize what a dominant lineage actually does (controller-agnostic by
  construction).

---

## 12. Technology Frame

- Browser-based; Three.js rendering with instanced meshes for ants and chunked voxel
  meshes for terrain.
- Spatial hash / voxel adjacency for all neighbor and contact queries.
- Simulation core in JS/WASM; controller math is trivially vectorizable (a future WebGPU
  compute path exists for the RNN; noted that divergent-branching GP does not vectorize
  comparably — a scaling asymmetry, not a v1 concern).
- Persistence via IndexedDB and file export.

---

## 13. Build Phasing

Ordered so that every knob is calibrated before the layer that depends on it, and so early
failures are attributable (world bugs vs. brain bugs):

1. **World core.** Voxel grid, materials, terrain generation, chunked meshing, lattice
   movement, rendering, speed decoupling skeleton.
2. **Ecology with frozen genetics.** Energy economy, food spawn/governor, pheromone volume,
   digging + spoil, scripted-queen colonies running *fixed* seed genomes — no mutation.
   Balance the ecology with ants whose behavior is known.
3. **Evolution on.** Mutation, polyandrous founding, worker-laid males, merit succession,
   egg lifecycle, death and turnover, wide-prior initialization. Instrumentation (§11.4)
   comes online no later than this phase, selection-differential readout first.
4. **Recurrent regimes.** Queen aging/colony mortality and refounding, nest decay, seasons.
   Multiple colonies on a widened map. (Initial evolution runs may precede this on a small,
   stable-population configuration, but the architecture supports all of §9 throughout.)
5. **Emergence layers.** Larval-feeding caste dial; inter-colony contact consequences;
   soil/water ecosystem heterogeneity; second controller (linear GP) behind the §2.3
   interface if desired.

---

## 14. Open Questions (deliberately unresolved)

- Exact sensor/motor layout and counts (fixed during Phase 1–2 as the world settles).
- Dig-cost, decay-rate, and season-period constants (Phase 2 calibration).
- Whether worker policing, evolved signaling, and caste branching actually emerge — these
  are experiments the design enables, not features it promises.
- GP inheritance model if/when the GP controller lands (single-expressed-copy diploidy vs.
  haploid-sexual vs. asexual + horizontal transfer).
- Map size vs. colony count ambitions — "many colonies" at 256² means small territories and
  early contact; widening the map defers contact pressure. Start small per the phasing;
  the world scales.
