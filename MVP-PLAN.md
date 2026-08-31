# Antropy MVP — Implementation Plan

Build the MVP defined in [docs/backlog.md](docs/backlog.md) ("selection visible in one
session"): a single-colony, small-map, browser voxel ant simulation in which a genetically
diverse population forages, digs, and turns over under continuous selection, with
instrumentation proving selection operates within the first session. Out of scope: colony
founding/refounding, worker-laid males, nest decay, seasons, multi-colony maps, castes,
event detection, headless burst mode, GP controller (Releases 2–5).

## Confirmed decisions

- MVP scope is the user-approved backlog section; the gene-flow floor is polyandrous
  founding + in-place merit-weighted succession (design spec §7.1 channel 3).
- Simulation core is main-thread, pure, serializable, worker-portable (ADR-0001).
- Simulation is deterministic: seeded sfc32 PRNG owned by world state, fixed integer
  ticks, deterministic iteration; `Math.random`/`Date.now` banned in `src/sim` (ADR-0002).
- Module boundaries are lint-enforced: `src/sim` (pure core), `src/render` (three.js),
  `src/ui` (React + in-house canvas charts, ADR-0003), `src/persist` (IndexedDB/file).
  Only the controller module reads genome internals (design spec §2.3).
- MVP map is 128×128×64 voxels; grid is a flat typed array; pheromone channels are dense
  `Float32Array` fields at this size (sparse storage is a Release-2 concern at 256×256×96).
- No new runtime dependencies: hand-rolled sfc32 PRNG and value-noise fBm; charts are
  in-house canvas components; three.js is the only rendering dependency.
- The Braitenberg reference controller (spec §2.2) is implemented behind the controller
  contract and used to calibrate ecology (M4) before the RNN exists — it is the "frozen
  genetics" of spec §13 phase 2, and remains as a test fixture.
- Numeric constants (dig costs, metabolism curves, diffusion/evaporation rates, food
  governor) are calibrated inside their phases against that phase's exit gate, and live in
  one tunables module per the one-canonical-implementation rule.

## Context / reuse map

- Green-field: `frontend/src/` holds only the App shell (`App.tsx`, `main.tsx`,
  `styles.css`, `App.test.tsx`). Everything below is built new.
- Source of truth for behavior: [docs/design-spec.md](docs/design-spec.md) — §2 controller,
  §3 genome, §4 sensory/motor interface, §5 world, §6 energy, §7 reproduction,
  §10 initialization, §11 instrumentation.
- Verification harness: `make ci` (eslint incl. complexity 10 / 400-line files / 75-line
  functions, prettier, `tsc -b`, vitest, terraform fmt, docs-check). Tests are Vitest with
  happy-dom; the sim core is DOM-free and tests as plain functions.
- Dependencies available: `three` + `@types/three` (installed, unused until M2).
- Deployment surface is unchanged by this plan (static SPA via the website module).

## Cross-cutting constraints

- ESLint size/complexity limits are hard errors — decompose the simulation into small
  modules per system (movement, energy, pheromones, digging, reproduction…) rather than a
  world god-object.
- Determinism (ADR-0002) applies to every stochastic feature added in any phase; new
  randomness must draw from the world PRNG.
- Serializability (ADR-0001) applies to every piece of world state added in any phase;
  M8's save/reload-bit-identical gate retro-checks all of them.
- The controller contract (spec §2.3) is the only interface between genomes and the rest of
  the simulation; instrumentation reads behavior and bookkeeping, never genome internals.
- Hot-loop code (per-tick systems) avoids per-tick allocation where practical; charts and
  UI read simulation state via snapshots, never mutate it.

## Milestones

### M0 — Simulation kernel and enforced boundaries
Deterministic heartbeat and the module skeleton every later phase plugs into.
- `src/sim` skeleton: world-state type, sfc32 PRNG, fixed-timestep tick loop, tick counter.
- Speed control skeleton: run/pause, speed multiplier, budgeted stepping on the host side;
  charts-only mode stubbed (render detach lands in M2).
- ESLint boundary zones: `src/sim` restricted from react/three/DOM/`Math.random`/`Date`;
  layer import direction enforced.
- App shell hosts the loop and shows tick/speed (proves the kernel end to end).
- Exit: `make ci` green; a boundary-violating import and a `Math.random` use in `src/sim`
  each fail lint (demonstrated, then removed); same-seed runs produce identical tick states.

### M1 — Voxel world and terrain
The material world exists and is reproducible from a seed.
- Flat typed-array voxel grid (128×128×64) with materials `AIR`, `TOPSOIL`, `CLAY`, `ROCK`,
  `FOOD`, `LOOSE_FILL` and reserved IDs; index/coordinate helpers.
- Value-noise fBm terrain generator: heightmap surface, depth-layered topsoil/clay/rock with
  noise-warped boundaries, seeded from the world PRNG.
- Exit: `make ci` green; unit tests — same seed → identical grid, layer ordering holds,
  material distribution within sane bounds.

### M2 — Rendering and speed decoupling [depends on M1]
The world is visible and the watch/skip speed axis works.
- Chunked (16³) culled-face meshing to three.js `BufferGeometry`; dirty-chunk remesh API.
- Scene, lighting, orbit-style camera, material palette; fixed-timestep/render interpolation
  hook (consumed by M3 for ant motion).
- Speed control completed: rendering disabled above the threshold, charts-only mode real.
- Exit: `make ci` green; mesher unit tests (face counts on known grids, dirty-chunk
  invalidation); manual smoke — terrain renders and camera navigates.

### M3 — Ants and lattice movement [depends on M2]
Ants exist as entities and move legally on the voxel lattice.
- Ant record (position, facing, energy, age, body scale, carry state, lineage/patriline
  bookkeeping fields from day one — spec §11.4) in a deterministic entity store.
- Lattice movement: cling rule (adjacent solid), step legality, falling, turn/forward/
  vertical-bias motor semantics; spatial index for neighbor/contact queries.
- Instanced ant rendering with interpolation; scripted-walker test controller.
- Exit: `make ci` green; property tests — no ant ever occupies solid or floats unsupported
  after any legal step sequence; falling triggers when support is dug away.

### M4 — Ecology under frozen genetics [depends on M3]
The full energy economy runs, calibrated with known behavior (spec §13 phase 2).
- Energy sinks/sources: size-scaled basal metabolism, movement, dig, deposition, sensor
  upkeep, think-cost; eating food; death at zero energy or age cap; corpses persist as food.
- Digging with conserved spoil: carry load, `LOOSE_FILL` deposition, hardness-scaled costs.
- Pheromone fields: two dense channels, air-adjacency diffusion, multiplicative evaporation,
  energy-costed deposition.
- Food spawn with static density-dependent governor.
- Controller contract (`act`/`mutate`/`recombine`/`seed`) defined now; Braitenberg reference
  controller implements it; sensory encoding (~20 inputs) and motor decoding (~8 outputs)
  per spec §4.
- Exit: `make ci` green; calibration harness test — a fixed-genome Braitenberg population
  on a seeded world neither starves out nor explodes over a long run (bounds asserted);
  spoil conservation invariant holds (solid+carried+fill constant).

### M5 — RNN controller and genome [depends on M4]
Heritable behavior: the real controller behind the contract.
- Fixed-topology RNN (inputs → recurrent hidden → outputs) with per-ant hidden state;
  constant think-cost reported per tick.
- Physical genome (~10 tradeoff genes incl. evolvable mutation σ) wired into the systems
  built in M3/M4 (metabolism, speed, sensors, storage, egg endowment, lifespan).
- Structured initialization: chemotaxis backbone + wide-σ noise (spec §2.1, §10);
  haplodiploid `recombine` (diploid weight-average expression) and `mutate` (Gaussian σ +
  structural kicks) behind the contract.
- Exit: `make ci` green; behavioral assay test — a chemotaxis-seeded RNN ant approaches a
  food-scent source in an isolated arena significantly above a zero-weight control;
  contract test — nothing outside `src/sim/controller` imports genome internals (lint rule).

### M6 — Colony, reproduction, and succession [depends on M5]
The evolutionary loop closes: selection feeds the germ line.
- Scripted polyandrous queen: founding genetics, stored sperm draws per egg, egg production
  driven by delivered food; per-patriline delivery counters.
- Egg lifecycle: world objects, incubation, edibility, exposure to the eat output; hatch to
  juveniles growing toward genetic target size.
- Wide-prior founder initialization (independent draws per queen, per sperm, per egg).
- Queen aging and in-place merit-weighted succession: successor genome recombined from
  queen line × top-delivering patriline (spec §7.1 channel 3).
- Exit: `make ci` green; integration test — a seeded multi-generation run changes the
  population's gene distribution (successor-era genomes measurably diverge from founder
  draws) and the colony survives ≥ N successions without population collapse.

### M7 — Selection instrumentation [depends on M6]
The proof-of-life dashboards (spec §11.4), selection differential first.
- Snapshot/statistics module in `src/sim`: per-gene mean/variance, population counts,
  lineage/patriline shares, live selection differential (gene ↔ survival/delivery
  correlation among living ants).
- In-house canvas chart primitives (ring buffer + line renderer, ADR-0003); charts panel:
  selection differential, gene tracks, population.
- Lineage/patriline coloring in the 3D view; selected-ant inspector (live inputs, outputs,
  hidden state — read through the controller's introspection surface, not genome access).
- Exit: `make ci` green; statistics unit tests against hand-computed fixtures; manual
  smoke — a fresh run shows nonzero selection differentials and diverging lineage curves
  in-session (the Act One criterion).

### M8 — Persistence and MVP acceptance [depends on M7]
Runs survive the tab closing; the whole MVP gate is checked.
- Versioned checkpoint serialization of complete world state incl. PRNG state; IndexedDB
  save/load; file export/import; seed control in the UI.
- Exit: `make ci` green; determinism test — save at tick T, reload, advance both k ticks,
  states bit-identical; MVP acceptance — from a fresh seed, one session shows the wide
  prior being pruned on the charts, at every speed setting, and a reloaded checkpoint
  continues the same run.

### Decisions needing your input

| Where | Decision you own |
| ----- | ---------------- |
| — | None open. All shape decisions were delegated and are recorded under Confirmed decisions; review them (and the visual/art direction, which is placeholder-grade for MVP) at MVP acceptance. |
