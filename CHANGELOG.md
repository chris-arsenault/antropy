# Changelog

## 2026-09-07 — Modular runtime and independent environment controls

- Extract typed deterministic kernel, feature registrations and local controller adapters.
- Preserve cellular terrain with independent geometry, support, transport and sampling settings.
- Store immutable per-world chemistry and mechanism identities in checkpoint v8.
- Validate checkpoint state and automatically fingerprint extracted runtime source.
- Remove stale worker alias after extinction; retain frozen RNN and current map defaults.


All notable user-visible changes are recorded here.

## Unreleased

- Correct physical coupling: repair work/material scale with funded body mass; growth and birth
  reserves use actual capacities and daughter upkeep. Empty machinery slots cannot slow paid
  refitting. Price swimming/turning by squared effort, retaining stock construction and upkeep
  costs. Use finite enzyme throughput in the analytical construction ceiling. Checkpoint v19
  rejects previous physics and retired absolute-reserve configuration keys.

- Make weathering respond to the local chemical mixture, sharing one operator between reservoirs
  and dissolved material. Remove the independent weather clock; neutral mixtures do not convert.
  Update field and inspection displays to show local interaction activity. Use a shared 1e-9
  extracellular concentration floor and physical checkpoint v18; earlier saves and the retired
  weathering-period option fail explicitly. Retain core transport, biology and mutation.

- Correct ecology composition: reservoirs contribute to the shared medium and process retained
  inventory with the same local conversion operator as field material. Remove the diffusion-based
  reactivity rule and potential-drop rate ranking. Apply existing numerical activity limits,
  cache source material reductions, and translate compiled source footprints. Use checkpoint v17;
  earlier physical saves are rejected. Keep mutation, funded biology, mesh2 and borrowed rendering.
  Defaults are sourceDrift4/sourceProcessing0.25/sourceGap2400 with explicit external renewal.

Earlier ecology stages (superseded by the correction above):

- Move resource reservoirs through the local chemical medium and process their released mixtures
  into lower-potential chemicals with explicit material and heat accounts. External renewal remains
  active. Local delivery footprints avoid per-reservoir full-grid scans.
- Set source drift and processing to4/4 after short comparisons; expose both settings and scalar
  motion/conversion counters. Physical checkpoint v15 rejects earlier saves. Preserve borrowed
  WASM rendering and memory/storage retention. Record short source evidence separately from
  adaptation and sustained ecology.

- Add smooth geographic weathering, conservative extracellular transformations and chemical
  shelter to ordinary worlds. Paid exports can alter local exposure; no climate input or free
  energy enters a controller. Preserve full mesh2 and active chemical-group processing.
- Show chemical weathering through the existing worker WebGL2 texture, with local exposure
  in inspection and separate material/heat counters. That stage introduced physical checkpoint v14.
- Record paid shelter's costs and small conditional construction benefit, retaining negative
  barrier findings. Add bounded recording and checkpoint salvage for the registered overnight
  comparison; browser history and recovery retention are unchanged.
- Fix current evolution-report traits and wall-budget options, and retry GPU-backpressured
  redraws while paused. These were the concrete defects from the fresh-context review.

Earlier implementation stages in this unreleased sequence:

- Enforce the WASM/worker data-sharing contract: scalar ticks, borrowed reply decoding, bounded
  browser queries, incremental chart history, cached genealogy/genomes and acknowledged observation
  updates. Preserve the diagnostic displays while removing repeated bulk observation transfers.
- Restore worker-backed family and founder history charts, origin/share-change tables and
  navigable selected-cell genealogy. Keep dead/divided parents, siblings and living descendants
  inspectable; distinguish missing history coverage from zero membership. Document the other
  diagnostic displays still missing after the runtime migration.
- Replace the entire TypeScript simulation with one Rust/WASM kernel, shared by browser and
  experiments. Use compact machinery operators, contiguous chemical fields, vector math and
  separate movement/physiology clocks. Preserve 48 identical founders in two colonies.
- Move physics and OffscreenCanvas/WebGL2 rendering into one worker. Render from borrowed packed
  WASM buffers; send bounded summaries to React. Keep full chemistry out of the per-frame bridge.
- Add exact checkpoint v10, strict body/history validation and durable manual interventions.
  Migrate experiments and reports to schema 3; remove the old physics, renderer and persistence.
- Measure 217 ticks/s at 48 cells, 59.9 at 2,000 varied cells and 33.4 under reproductive load,
  including rendering preparation and observation. The slowest window is 31.0 ticks/s. GPU
  execution, human visual acceptance and days/weeks operation remain unverified.
- Verify short nutrition, chemical interaction and accumulated-history mechanisms without an
  evolution campaign. Two million synthetic ancestor records restore with exact continuation
  at 406 MiB sequential WASM high-water memory. See the
  [current evidence](docs/design/chemistry/numerical-results.md).

Earlier implementation stages in this unreleased sequence:

- Replace named A/B, toxin, matrix, sharing, prey-yield and carbon/oxygen pathways with a
  persisted 256-species digital chemistry: finite mixtures, funded transport, unary reactions,
  generic biomass, membrane stress, impedance and uniform washout. Cells carry fixed heritable
  machinery slots and a 39-input/nine-output RNN. Existing chemical checkpoints are rejected by v9.
- Add chemical atlas/inspection and generic population traits, typed experimental flows and
  versioned reports. Port optional typed gene transfer and disturbance; remove retired runtime
  controls and historical campaign defaults. Preserve old evidence under its original schema.
- Record bounded causal opportunities and negative findings without an evolution campaign.
- Repair founder material retention and membrane compatibility using single-cell and small-patch
  life-cycle probes. Restore 48 identical founders across two colonies; the ordinary default
  peaks at 74 cells and ends at 57 with generation four after 2,000 ticks. Withdraw the unsupported
  claim that reducing the initial population to eight was necessary for reproduction.
- Account numerical chemical losses separately and reuse receptor samples, affinities and sparse
  computation buffers. Indexed mixtures, shared transport supply and reusable reaction work
  improve the unchanged 48-founder workload from 27.4 to 52.6 ticks/s including display calculations
  and periodic stats; its slowest 250-tick window is 44.5 ticks/s. Complete final checkpoints match.
  A synthetic 128-cell start reaches 30.7 ticks/s. Default encode/restore takes 82/297 ms.
  Human motion, successful dispersal and days/weeks operation remain unverified.

- Seed new sparse worlds with two separated starting colonies of the same founder genotype.
  Existing saved populations retain their placement.
- Fix recovery in browsers without `crypto.randomUUID`; run and checkpoint IDs now use
  `crypto.getRandomValues`, with an end-to-end persistence regression test.

- Added a provisional sparse spatial world: 320 × 240 units, 48 unequal finite renewal sites,
  local startup food and viscosity 0.004. Short transit controls support local travel and
  reproduction, with starvation across a larger gap; long-term ecological outcomes remain open.
- Added spatial population regions, visible dispersers, stable inherited A/B colors, population
  selection, close cell detail and retained spatial samples. Groups are observer conventions,
  with explicit uncertainty around founding, migration and dissolution.
- Added checkpoint v8 with local landscapes, complete parentage in compact pages and versioned
  observer history. Rolling compressed recovery keeps six automatic and two manual points.
  Memory/storage limits pause execution; older checkpoints are rejected. Synthetic storage
  checks are recorded. The user accepted the world after review; days/weeks browser endurance
  remains unverified.

- Revised project purpose and active documentation: prepare a world where diverse ecosystems
  and adaptation are likely during days/weeks of user observation, using hypotheses and small
  proof points. Retired prescribed coexistence gates; recorded continuity, storage and history gaps.
- Corrected the seven-mechanism campaign analysis from saved results. Three of 24 evolved pairs
  increase share both ways at the endpoint, one nearly unchanged, rather than the reported 16
  coexistence passes. Gene transfer has none, predation two. These are not lasting-coexistence
  results. Reports now show denominators and share changes; source-linked audits preserve the
  corrected data. See [analysis correction](docs/analysis-correction.md).
- Recorded 24 evolution arms across element cycle, typed toxin, predation, disturbance, gene
  transfer, sharing and signal in patchy mixed-deposit worlds. Physical effects are retained
  evidence; named ecological roles and long-run readiness remain separate questions.
- Persistence: levers absent from a save load as off, rounding noise of one unit in the last
  place is tolerated on bounded values, and genotype records born after their organism are
  allowed when transfer is on. Repair and secretion no longer let a reserve go negative.

- Added reserve sharing between touching cells (`sharingRate`, default 0), accounted as
  `shared`, and harness flags to turn the neutral signal on (`--secretion-rate`).

- Added horizontal gene transfer (`transferRate`, default 0): touching cells copy one physical
  locus into a new genotype record descended from the recipient's own.

- Added abiotic disturbance (`config.disturbance`, off by default): random discs are mixed and
  thinned at a memoryless interval, deaths recorded as `disturbance`.

- Added predation (`preyYield`, default 0): a fraction of a damage-killed cell's material feeds
  the toxin-bearing neighbours touching it instead of detritus, accounted as `preyed`.

- Added family chemistry (`toxinTypes: 2`, default 1): a tenth physical locus tints a cell's
  toxin between two types, immunity follows the type produced, and the sensed toxin is what the
  cell is actually susceptible to. Checkpoints are v7; v6 saves are rejected.

- Added an optional cell-mediated element cycle (`config.cycle`): inorganic carbon and oxygen
  fields, a ninth physical locus for light harvesting that fixes carbon into reserve and releases
  oxygen, oxygen-dependent catabolic efficiency with carbon returned to the pool, and slow
  atmosphere exchange of both gases. Checkpoints are v6; v5 saves are rejected. A
  `machineryCrowding` lever (default 0) lets the three acquisition pathways compete for membrane.
  Harvesting maintenance and exudation levers were tried during calibration and removed again
  for simplicity; the recorded contests that used them are noted as such.
  Light is a finite per-raster-cell supply (`cycle.lightSupply`) gathered over a footprint
  (`cycle.lightRadius`) that overlapping harvesters share, so harvesting income falls with
  crowding and the world's light budget equals its deposit supply; with light unlimited per unit
  ground, evolution arms grew past 1,200 cells. Recorded in the [cycle study](docs/cycle-study.md):
  fixation and cost effects occur, but the reported evolved harvester/consumer coexistence was
  incorrect and used since-removed costs. Some constructed guilds reproduce while losing
  population share; the corrected study preserves the exact configuration-specific outcomes.

- Harness runs no longer fail when source changes while they run: both digests are recorded, a
  warning is printed, and the result, checkpoint and ledger row are written as usual.

- Built, measured and removed a Rust WebAssembly kernel for inference, contacts and sensing
  (44 versus 24 ticks/s at 1,324 cells) under ADR 0019: one TypeScript implementation per
  physical rule outranks speed. Kept the genotype blueprint cache, a 30 frames per second budget
  at maximum speed, and double arithmetic over float32 storage in the RNN. Exact cross-machine
  replay is no longer an invariant.

- Pruned genotype records that no living cell carries (founders retained), reducing genome storage
  under higher mutation supply; total checkpoints still grow with organism ancestry; dead organisms keep their genome id as provenance.
  Pilot assays may run up to 900 seconds of wall time.

- Made the medium thick (viscosity 0.4), deposits dense and balanced (24 at rate 0.2), decomposition
  symmetric (half A, half B) and mutation supply stronger (about 2.5 behavioural and, with ten physical loci, 1.0 physical
  loci selected per birth). Cells now stay in the band they are born in, and constructed diet specialists
  partition the zoned world by survival alone.

- Ran eight de novo evolution arms (70–127 generations, 180–660 cells, default, eightfold
  physical and fivefold behavioural mutation supply) in zoned and mixed worlds: economy evolves,
  band partition does not, and evolved cluster medoids do not mutually invade. Recorded the
  shared block, dispersal fast relative to replacement, as the next design decision.

- Added strategy clusters: deterministic k-means over inherited construction targets, now the
  default map color mode, with a scatter, cluster table and cluster-size history in stats. Added
  `evolve` (de novo runs with trait samples and checkpoints) and `invasion` (rare-invasion assay
  between a checkpoint's cluster medoid genotypes) harness commands and a clustering report.

- Added food zones: equal vertical bands with fixed composition and balanced deposit slots, now
  the Run default as pure A and B halves; the epoch calendar stays selectable. Constructed
  A/B-specialists each invade from rarity and persist with a generalist in the zoned world and
  not in mixed food, recorded with a reusable diet contest command.

- Added producer immunity to toxin machinery and optional contact-range toxin injury, both
  zero in saves that predate them, with a reusable producer/resistant/sensitive contest command
  and report. Twelve constructed settings establish all three pairwise dominances but no
  three-way coexistence; the record explains why mobile cells give the well-mixed outcome.

- Historically recorded a roadmap with coexistence outcome gates, retired by the September 13
  purpose revision because development prepares opportunities for the user's ongoing run. Optimized the spatial index, contact passes, sensing and RNN inference with
  bit-identical checkpoints, raising headless throughput about 1.7–1.9×. Bounded the browser
  statistics refresh to 250 ms and widened the maximum-speed frame budget.

- Added recent-family, genealogy and inherited-trait views, source provenance in checkpoints,
  configurable food-composition epochs and reusable short mechanism experiments with typed
  resource accounting. Recorded actual evolved food-access and B-processing benefits alongside
  failed motor, learning and food-specific selection hypotheses. At that stage spatial food heterogeneity was an untested next hypothesis; it was subsequently
  implemented. Neither stage establishes a finished diverse ecosystem.

- Archived the complete prior documentation tree and consolidated 38 mixed historical design
  documents into eight current bacterial contracts. Updated principles, calibration, backlog,
  evidence, entry points and documentation checks. Separate demonstrated physical mechanisms
  from still-unproven adaptive differentiation; simulation behavior is unchanged by this pass.

- Corrected the default injury/repair balance so toxin can cause visible impairment and reduce
  reproduction. Default-world controls demonstrate protection from porous matrix. Scale toxin
  brightness to injury pressure and report affected cells in stats. Disable solid walls and
  neutral signaling by default because useful construction/communication remains undemonstrated.

- Added finite, heterogeneous A/B food deposits, independently funded processing pathways,
  local toxin damage, costly defense/repair, porous matrix barriers and conserved decomposition.
  Expanded the local RNN to 35 inputs, 24 recurrent units and eight outputs; retained phasic reads,
  task byte and inherited learning. Reduced random mutation to about one behavioral locus and
  0.2 physical loci per birth. The combined ecology and its food/toxin/matrix layers are the Run
  default. Checkpoint v5 rejects older worlds. Bounded causal results establish several conditional
  advantages, but the proposed slow-movement advantage remains unproved.

- Added exact inherited-sequence counts, founder-relative construction-target distributions and
  founder-share histories. Histories retain their observation origin with bounded thinning.
  Added predeclared representative descendant selection and behavioral snapshots to matched
  ancestor/descendant assays; live reproduction never uses these diagnostic measurements.

- Replaced repeated bacterial world tiles with one clipped world, bounded pan and pointer-anchored
  zoom. Added visible energy fill, heading tips, supply markers, newborn/starvation cues, a scale
  bar and an always-visible population chart. Periodic physics and simulation defaults are unchanged.

- Replaced bacterial allocation tuples with independent construction targets and actual core,
  motor, transporter and storage material. Viscous drag, diffusion-limited uptake, construction
  and machinery maintenance couple capability to physical costs. Stored food and usable energy
  have separate conserved ledgers; offspring receive a physical share of existing machinery.
  Corrected learning inheritance: acquired recurrent-weight changes enter offspring chromosomes
  before crossover and mutation, with configurable retention. Hidden activity and task bytes reset.
  Checkpoint v4 preserves both resource books and learning provenance; older files are rejected.

- Added bacterial physical/behavioral chromosomes, paid private recurrent plasticity and three
  competing body allocations for motors, uptake and storage. Added configurable haploid/diploid
  expression, clonal/selfing transmission, crossover, mutation and fission/budding policies.
  Checkpoint v3 preserves complete inherited and acquired state. Run defaults enable physical
  mutation and learning; stats expose both. Seed/fertilize remains a documented lifecycle extension.

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
