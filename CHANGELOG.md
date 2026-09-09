# Changelog

## 2026-09-07 — Modular runtime and independent environment controls

- Extract typed deterministic kernel, feature registrations and local controller adapters.
- Preserve cellular terrain with independent geometry, support, transport and sampling settings.
- Store immutable per-world chemistry and mechanism identities in checkpoint v8.
- Validate checkpoint state and automatically fingerprint extracted runtime source.
- Remove stale worker alias after extinction; retain frozen RNN and current map defaults.


All notable user-visible changes are recorded here.

## Unreleased

- Replaced frame-batch speed multipliers with wall-clock tick targets and Maximum. The default
  target is 30 ticks/s; Metrics reports actual throughput and computation cost. Recorded the
  failed 18,000-tick construction review and a matched excavation-disabled replay: both colonies
  reach 19 descendants, while the default stops completing construction by tick 3,435. The
  trace exposes an empty named cache despite growing loose stockpiles. Behavior remains unaccepted.

- Made autonomous construction review visible through Run alone: a finite warm-nest starting
  condition, temperature overlay, colony close-up and open Metrics with construction
  statistics. All existing controls remain available. Checkpoint v14 preserves initial warming
  and continued fields; the default colony digs and places spoil by tick 305 without work orders.

- Added autonomous programmed/LGP construction from observed climate, space, storage and traffic
  conditions. Workers excavate, haul spoil, carry queen and brood, create caches and move food
  without manual orders. Material temperature/moisture, finite body water and food spoilage have
  separate configuration switches and field overlays. Climate defaults to one-cell resolution;
  checkpoint v13 persists fields, observations, carriers and work provenance. The browser starts
  at tick zero with autonomous work enabled; manual construction controls are collapsed diagnostics.
  Visual review and larger-colony throughput remain required before genetics.

- Added material-dependent digging with conserved carried/dropped spoil, physical queen carrying,
  multiple cache creation and food-by-food relocation. Programmed and LGP ants execute explicit
  browser work requests through common paid actions. Checkpoint v12 preserves claims, partial
  excavation, spoil, cache identities and queen attachment. Construction needs visual review;
  nursery expansion and population scaling remain ahead of genetics.

- Added configurable Y-axis settling for queen, brood and loose food, distinct from worker grip.
  Queens and cache markers start on floors; exposed food falls and stacks without changing the
  energy balance. Moving landmarks invalidate routes. Checkpoint v11 preserves the physical state.
  Added capacity budgets and Node/headless Canvas probes for 2,000-worker planning. RNN plans are
  canceled; digging follows settling review, with genetics deferred until the colony-scale milestone.

- Added shared colony location knowledge, explicit direct movement and reversible routes, action
  results and retained task bytes. Programmed ants and seeded linear genetic programs use the same
  request interface. LGP supports mutation, recombination and private registers without neural
  training or fallback. The browser opens programmed ants at tick zero; knowledge, routes and
  instructions are inspectable. Checkpoint v10 preserves the new state. Reproductive inheritance,
  population evolution remain later work.

- Replaced runtime surface-height rules with foreground/backing material cells, local climbing
  support, terrain-based light and separate airborne/surface chemical transport. Added compact
  nests, deeper worlds, clay and loose-soil pockets, and connected wood tiers. The frozen RNN
  starts on the new map at tick zero; terrain selection retains reference comparisons. Added
  anchored zoom, panning, fit controls, minimap and a collapsible observation dock. Version 7
  checkpoints preserve edited terrain and buried food quantities; digging remains deferred.

- Added a private numeric task byte to programmed and registered neural workers, with controller
  writes, inspector overrides and exact version 6 checkpoints. Registered models support learned
  sensory modulation, private stochastic execution and local browser import. Added recurrent
  outcome-gradient training and supervised curriculum experiments; independent physical survival
  remains the acceptance gate, with no automatic promotion or runtime task rules.
  Demonstration replay followed by outcome PPO yields a frozen model passing all six reserved
  48,000-tick worlds with living queens and continued funded replacement. The gated arm passes
  3/6; programmed controls pass 5/6 under the strict gate, with all queens alive. Training is
  stopped for visual review; a local checkpoint preserves the successful neural run.

- Added outcome-based recurrent colony search with physical energy, recipient feeding, queen
  survival and multigeneration replacement gates. Recorded flat terminal fitness, revised early
  outcome credit and explicitly uncertifiable assisted-start curricula. Assisted care improves,
  but the frozen RNN loses all three fresh colonies without queen feeding or births. Failed models
  and reports remain in the harness; physics and the programmed browser default are unchanged.

- Separated food quantity from nutritional energy, conserved digestion, feeding and recycling,
  and advanced checkpoints to version 5. Added per-worker activity and long-turn context to a
  matched 100%/75%/50% yield panel. Lower yield generally reduces recruitment, population and
  long turning; occupied neighboring cells explain much of the baseline turn exposure. Recorded
  missing gravity and underground support as an unresolved physical-model limitation.

- Matched programmed and neural colony observations at float32 precision, retained the carrying
  Boolean in new directional artifacts, and rejected stale teacher datasets. Added conditional
  direction/care probes. Three programmed worlds survive 40,000 ticks; existing long turn sequences
  remain unaccepted motion. Verified export parity without further fitting.

- Tested a jointly trained shared directional RNN with optional four-command per-worker history.
  History improves movement in an ablation, but both final learned arms fail all three fresh
  survival worlds; matched programmed controls pass 3/3. Recorded scorer and input-mapping repairs,
  retained failed artifacts, and stopped fitting without changing physics or the browser default.
- Added bounded full-colony neural training, local input/action encoding, recurrent and zero-memory
  inference, dataset aggregation, exported-weight parity, held-out survival and perturbation panels.
  Both final learned candidates pass 0/3 held-out worlds while programmed controls pass 3/3.
  Failed models and evidence remain in the harness; the programmed browser default is retained.
- Added the programmed physical colony: renewable spatial food, bounded crops, local eating and
  queen/larva feeding, egg–larva–pupa development, age/starvation mortality, and variable worker
  populations. Energy transfers and dissipation are conserved; newborns inherit funded brood
  reserves. A separate locally diffusing fresh-air clue prevents traffic scent from trapping
  outbound workers underground. Checkpoint v4 restores changing populations and monotonic IDs. The default UI displays
  queen, brood stages, stored quantities, population and energy ledgers. Genetics and RNN training
  remain paused for human visual review.

- Replaced the simulation with one deterministic 2,048 × 128 vertical cross-section. The active
  runtime now ports the earlier eight chambers, thirteen junctions, and thirty-one branching and
  joining passages; distributes 96 seeded-random surface food objects; and initially restored an immortal
  forager diagnostic before the physical colony implementation. Canvas replaced
  the former renderer; the prior runtime and dependencies were deleted rather than retained behind
  a mode or migration layer.
- Restored finite local food odor, deep nest odor, and two blank pheromone fields with emission,
  diffusion, evaporation, deposits, browser overlays, and an authored pre-impregnated entrance
  trace. Local creatures receive 33 body-relative concentrations, signed contrasts, contact,
  carried state, light, and deterministic individual signals—never coordinates or solved paths.
- Added matched map-aware, stateless programmed, and recurrent foraging scenarios through
  one physical action resolver, plus charts, map layers, ratios, effective configuration, and the
  creature inspector in the right-hand UI. Harness run 2492 completed five pickup/deposit cycles in
  all eight programmed worlds at 9.988% median completion overhead and 10.361% median movement
  overhead. The recurrent arm completed 0/8 and remains visibly failed with no policy fallback.
- Corrected an out-of-range deterministic jitter generator, stale-frame imitation labels,
  non-aggregating DAgger, and neural motor decoding that admitted contradictory commands and an
  arbitrary dead zone. These repairs did not certify the RNN; they make its failure attributable.
- Reset active documentation, ADRs, tests, checkpoints, and harness commands around the canonical
  2D baseline. The annotated tag `3d-simulation-checkpoint-2026-09-06` and the source archive retain
  the previous implementation and design provenance.

## 3D checkpoint — 2026-09-06

- Reset the food-loop review to one immortal worker and restored a two-arm scenario selector. The
  full-map arm knows all food coordinates and the legal 3D movement graph. The programmed arm is a
  stateless function of the shipped local sensors: a movement-valid pheromone-A traffic trace leads
  from its queen chamber to the entrance, natural food odor leads to food, and natural nest odor
  leads home. Fifteen append-only forward chemoreceptor inputs let every controller sample the
  directly ahead voxel in all three vertical bands. Strong vertical bias now selects a direct climb
  while moderate bias selects a sloped step, and a carried food load unloads before the same
  mandible action may collect another voxel. Matched harness runs 2460–2462 record five external
  returns into the same queen-core neighborhood in all three worlds; the sensor arm finishes
  1.8–6.9% faster than the pathfinding ceiling with no immediate turn reversals. The former
  Appendix H policy and its passing population-ratio panel remain invalid after human review found
  universal translated circles and severe nest-mouth congestion. The replacement still requires
  direct human trajectory review before it becomes an RNN teacher.
- Added a world-wide genetic identity that follows eggs into workers, males, queens, and stored
  sperm; real parent links, founder lines, offspring contribution, completed deaths, net-energy
  merit, retained founder genomes, and checkpoint version 22 replace mixed ant/patriline ids.
- Added live evolutionary-health instrumentation to the web app and harness: completed-life
  delivery and lifespan heritability, offspring-variance effective population, controller-owned
  genome diversity and founder distance, and per-line survival. Every estimate retains its sample
  count and unavailable values remain null in the new `evolution_series` ledger table.
- Replaced event-count delivery merit with one-time net external-food energy credit. Provenance
  follows food through carriage, caches, death drops, and checkpoints; recycled food, owned food,
  eating, and internal trophallaxis cannot manufacture germ-line merit.
- Certified fixed-genome demographic continuity across complete founder turnover: one smoke and
  four new 24,000-tick worlds keep their queens, replace deaths with descendants, hold 37–49
  workers, gain colony energy, and never invoke automatic continuation. A redundant eight-world
  repeat was stopped rather than turning long fixed-controller verification into ongoing work.
- Replaced the authored-nest-specific larder radius with physical access to colony-marked
  underground stored food across the multi-chamber nest. Remote unmarked and surface stores remain
  inaccessible, and all withdrawals retain source attribution.
- Admitted mortality and queen upkeep to the authored-nest colony without enabling reproduction
  or later ecology. Mortal bootstrap workers now begin at evenly spaced ages instead of dying as
  one synchronized cohort; worker and queen death causes are separately attributable. Eight new
  4,200-tick worlds retained their queens and 32/40 workers with closed energy ledgers.
- Made egg endowment, larval feeding, and metamorphosis separately attributable. Metamorphosis now
  records consumed rearing capital instead of silently dropping it; checkpoint version is 20.
- Added named mortality and replacement nest presets and admitted resource-funded worker
  replacement without later systems. Eight new worlds each matured eight female workers by tick
  4,200, matching eight natural deaths and restoring the founder population to 40.
- Added a matched colony-resilience harness with demographic time series and source-attributed
  corpse/brood recycling. The first eight-world control establishes the untreated worker-energy
  basin before mortality or reproduction is admitted.
- Made the checked-in run-1784 colony controller the shipped RNN founder default; the obsolete
  pre-Appendix-F forager artifact no longer seeds normal worlds.
- Replaced overlapping appendix work plans with five normalized design categories and one
  cross-category implementation order. Every item is marked delivered, backlog, or OBE; a
  section-level coverage map traces the original specification and Appendices A–G into the new
  owners. Supplied documents, historical plans, review notes, and the nest reference now live
  unchanged under `docs/sources/`.
- Established the five operating principles as the primary decision lens and the authored-nest
  colony loop as the current goal.
- Added per-world feature configuration and scenario selection. The default programmed-colony
  review disables terrain digging and later lifecycle systems while presenting an authored,
  branching 3D nest for inspection. The web app displays its effective gates, energy values, and
  cargo capacities.
- Implemented Appendix F's world-affordance repair: parallel vertical and phasic sampling for all
  scent fields, a deep-source homing carrier, absorbed colony odor in nest material, and passive
  colony-odor transfer to handled food. The re-derived shared-interface oracle now uses no
  persistent procedural state.
- Completed the Appendix D ladder through the functional RNN summit: shared excavation,
  deposit, food pickup, and brood pickup/putdown semantics; conserved spoil hauling; brood and
  food transport; and deterministic per-ant motor jitter.
- Added tunable brood carrying capacity and checkpoint persistence for carried brood and
  unrecovered recycled food. Checkpoint version is now 20; earlier checkpoint versions are refused.
- Moved long-horizon simulation measurements out of the test targets. The bounded Vitest suite
  retains mechanics and integration invariants; campaigns and calibration remain in the
  harness ledger.
- Recalibrated the authored-nest food and work economy against fixed trained-controller
  populations instead of one optimized RNN. The installed defaults support 19/19 and 18/19
  task-capable and perturbed controllers across two separate ten-world distributions; the web app
  now displays the effective energy costs, food value, tank size, and maintained food supply.
- Replaced sequence cloning plus terminal outcome search with fixed balanced-frame distillation for
  the zero-state Appendix F oracle. Four predetermined RNN starts now clear the 75% food-loop floor
  across 24 held-out worlds, support positive colony energy without environmental retuning, retain
  evolvable but initially zero recurrent weights, and train in 138.6 seconds total. Exact-genome
  production-mutation curves and reproducible ledger-to-seed baking remain harness measurements.
- Sealed the authored nest below varied terrain using a footprint-wide underground datum and a
  covered offset entrance collar. A bounded fixture invariant permits only the intended entrance;
  the sensor-limited programmed policy now completes cache-and-retrieval in ten new worlds before
  recurrent controllers are retrained against the corrected geometry.

## v0.3.0 - 2026-09-02

### Release 3 — bootstrap viability and the living colony

- Added the liability world (Appendix B): multiplicative seasonal × diurnal microclimate
  stress with depth attenuation, climate-keyed egg exposure, year-round storms that wash
  exposed food and surface pheromone, and deep seasonal food troughs. Surface life is
  survivable but strictly inferior on the measured ledgers.
- Added brood as capital: eggs incubate into larvae reared on stockpile feedings over a
  real rearing period; starved larvae perish into food. Worker replacement costs energy
  and time, so famine and brood losses bind.
- Added physical hoarding: the queen's crop is small and overflow deliveries become food
  voxels whose placement matters (rain reaches surface piles, not buried larders);
  attendants restock the crop from the larder.
- Added automatic continue: when the population collapses, a new colony is force-founded
  from the survivor genome pool — the world is never left dead, and selection operates
  across continuations (visible in the readouts).
- Legalized the sensory interface (Appendix C): the nest-bearing inputs were removed;
  homing rides a real nest-scent plume (measured detect radius 24), and a thermoreceptor
  input plus a heat-escape instinct give ants midday burrows. Founding nests carve a
  descendable 2×2 entrance shaft.
- Added viability-ratio and continuation readouts to the UI; live ratios R1–R7 with
  out-of-band flags.
- Added the measurement harness (`pnpm harness`): parameterized simulation runs into a
  committed SQLite ledger (tournaments, oracle ladder, calibration, seed derivation,
  determinism bisect). Measurements left the test tiers.
- Fixed a checkpoint-corrupting egg-id collision (ghost brood granting phantom energy),
  entombment of ants by dropped biomass, and falling into solid voxels. Checkpoints
  bumped to version 8 (older saves are refused).

## v0.2.0 - 2026-09-02

### Release 2 — metapopulation and recurrent regimes

- Added real colony founding: provisioned queens lay merit-fathered queen eggs; hatched
  queens fly, mate with living males (who die), and found claustrally with an entrance
  shaft; queens age and starve, collapsing their colonies. In-place succession removed.
- Added expressed haploid males: workers lay unfertilized male eggs from their own energy;
  males walk, live short, and carry whole-genome gametes into new colonies.
- Replaced the meal tax with physical provisioning: food-voxel transport plus scripted
  bidirectional trophallaxis at the queen — the stockpile is a real energy buffer and
  delivery merit is earned, not imputed.
- Added path-integration home sense, nest scent, and colony-tagged pheromone channels so
  multiple colonies coexist without cross-reading signals.
- Added nest decay (untrafficked tunnels collapse to loose fill), egg exposure hazards,
  and an oscillating seasonal carrying capacity on a widened 192×64×192 map.
- Added colony-count chart and metapopulation counters; checkpoints bumped to version 2
  (older saves are refused).

## v0.1.0 - 2026-08-31

### MVP — selection visible in one session

- Added the voxel world: 128×64×128 layered fBm terrain, chunked culled-face rendering,
  lattice-hopping ants with instanced rendering and motion interpolation.
- Added the ecology: energy economy, digging with conserved spoil, two blank pheromone
  channels plus food scent, density-governed food spawn, corpses persisting as food.
- Added heritable behavior: a fixed-topology RNN controller behind the pluggable
  controller contract, chemotaxis-seeded wide-prior founders, a seven-gene physical
  genome on energy tradeoffs, mutation and recombination at egg creation.
- Added the colony: a scripted polyandrous queen, edible incubating eggs hatching
  juveniles, per-patriline delivery bookkeeping, and in-place merit-weighted royal
  succession.
- Added instrumentation: live selection-differential bars, population and patriline-share
  charts, gene-mean sparklines, patriline-colored ants, and a click-to-inspect ant panel.
- Added persistence: deterministic checkpoints to IndexedDB and JSON file export/import;
  seed control and speed presets up to charts-only mode.
