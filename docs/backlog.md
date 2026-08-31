# Backlog

Planned-but-not-built work, grouped by release. Each item is a positive assertion of
future-state behavior. Scope derives from the [design spec](design-spec.md); section
references point there. Every release honors the binding constraint of §9: no architectural
decision may preclude colony mortality/refounding, nest decay, or oscillating carrying
capacity, even before the release that implements them.

## MVP — selection visible in one session

Goal: a browser simulation in which a genetically diverse colony forages, digs, and turns
over under continuous selection, with instrumentation proving selection is operating within
the first session (Act One of §10 — the wide prior being pruned, chart-legible). Single
colony, small map, stable population; no founding flights, seasons, or castes yet.

### World core (§5)

- Implement the voxel grid on a small single map (flat typed material array, scalable
  without structural change) with `AIR`, `TOPSOIL`, `CLAY`, `ROCK`, `FOOD`, `LOOSE_FILL`.
- Generate terrain with fBm noise over depth-layered materials with noise-warped boundaries.
- Implement chunked (16³) meshing with dirty-chunk remeshing and instanced ant rendering.
- Implement voxel-lattice movement (cling to solid, fall when unsupported) with render-side
  interpolation.
- Implement fixed-timestep simulation with speed control from 1× through charts-only mode
  (individual rendering disabled at high multipliers).

### Ecology (§5.4, §5.5, §6)

- Implement the energy economy: eating, size-scaled basal metabolism, movement, dig,
  deposition, sensor upkeep, think-cost, egg endowment, and spoil-carriage sinks; death at
  zero energy or age-out.
- Implement digging with conserved spoil: dig loads the ant, deposits stack as `LOOSE_FILL`.
- Implement the two-channel pheromone volume: sparse per-air-voxel storage, air-adjacency
  diffusion, multiplicative evaporation, energy-costed deposition, no assigned meaning.
- Persist corpses as edible energy.
- Implement food spawn with a static density-dependent governor (carrying-capacity
  oscillation arrives in the metapopulation release).

### Genetics and colony (§2, §3, §4, §7)

- Implement the fixed-topology RNN controller behind the pluggable
  `act`/`mutate`/`recombine`/`seed` contract; nothing outside the controller inspects
  genome internals.
- Seed founders with the structured chemotaxis initialization plus wide-σ noise on all
  other weights and physical genes ("instinct in erasable ink").
- Implement the physical genome (~10 tradeoff genes including evolvable mutation σ) and
  the ~20-input / ~8-output sensory-motor interface, including eat-anything (food or egg).
- Implement mutation at egg creation and haplodiploid recombination behind `recombine`.
- Implement one colony with a scripted polyandrous queen (mixed stored sperm, per-egg
  father draw), the egg lifecycle (world objects, incubation, edible), juvenile growth
  toward genetic target size, and per-patriline delivery bookkeeping.
- Implement queen aging with in-place merit-weighted royal succession (§7.1 channel 3), so
  worker success routes into the germ line and evolution accumulates without
  multi-colony refounding.

### Instrumentation and persistence (§11)

- Implement the live selection-differential readout (per-gene correlation with
  survival/food delivery among living ants) as the first chart online.
- Implement per-gene mean/variance tracks, population counts, and lineage/patriline
  coloring backed by day-one lineage bookkeeping in the ant record.
- Implement the selected-ant inspector (live inputs, outputs, hidden state).
- Implement checkpoint save/load via IndexedDB plus file export/import.

## Release 2 — metapopulation and recurrent regimes (§7.2, §9)

- Implement colony founding: stockpile-triggered winged queens, dispersal flight, scripted
  founding chamber, and colony death on queen death.
- Implement worker-laid haploid males and mating at founding, completing gene channel 2.
- Implement egg exposure rules (slope, depth).
- Implement nest decay: untrafficked underground air collapses to cheap-digging
  `LOOSE_FILL`, punishing abandonment while keeping healthy cores stable.
- Implement oscillating carrying capacity (slow sinusoid plus noise on food spawn).
- Widen the map, run multiple colonies at staggered life stages, and colony-tag pheromone
  deposits to prevent trail cross-contamination.
- Expose turnover (lifespan, aging, egg predation) as the first calibration dial for
  stalls at capacity.

## Release 3 — watching at scale (§11.2, §11.3, §11.4)

- Implement event detection with a timeline: colony founded/died, lineage share thresholds,
  gene-mean excursions, depth/spoil records, per-region r/K regime transitions, with
  optional auto-slowdown and camera moves.
- Implement headless burst mode for overnight runs and replay-from-checkpoint at 1×.
- Implement two-gene scatter plots colored by lineage.
- Implement offline behavioral assays: clone a genome into an isolated arena with
  controlled stimuli (controller-agnostic).

## Release 4 — emergence layers (§8, §13.5)

- Implement the larval-feeding caste dial: adult body scale as a function of food deposited
  during incubation, fed back as a sensory input.
- Implement inter-colony contact consequences, opening selective room for raiding and
  soldier morphs.
- Add soil/water ecosystem heterogeneity (reserved `WATER` and soil material IDs, rain
  accelerating nest decay).

## Release 5 — second controller (§2.2, §2.3)

- Implement the linear genetic programming controller behind the controller contract, with
  its own inheritance model and per-instruction energy cost.
- Add a WebGPU compute path for the RNN controller.

## Platform

- Add cloud-stored checkpoints (activates the Ahara ALB/database/Cognito integration steps
  for syncing overnight runs across machines).
