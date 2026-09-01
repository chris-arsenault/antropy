# Antropy Release 2 — Implementation Plan

Build Release 2 from [docs/backlog.md](docs/backlog.md) (metapopulation and recurrent
regimes, spec §7/§9): real colony founding with flying males, expressed haploid males,
physical food transport, nest decay, oscillating carrying capacity, and multiple colonies
on a widened map. Out of scope: event detection, headless burst mode, assays (Release 3),
castes and inter-colony combat consequences (Release 4).

## Confirmed decisions

- Food transport reuses the one terrain-manipulation channel: DIG on a FOOD voxel picks it
  up (shares spoil capacity, one material type at a time); depositing food within the
  queen's radius credits the stockpile and the carrier's patriline. The meal tax is
  deleted. (ADR-0006)
- The scripted queen emits a colony-tagged nest scent (environmental signal like food
  scent); the sensory interface gains stereo nest-scent inputs → INPUT_COUNT 22, and the
  structured init gains an erasable transport instinct on hidden unit 2. (ADR-0006)
- Pheromone A/B and nest scent are owner-tagged single fields (values + owner byte,
  last-writer-wins, sampling filtered by colony). (ADR-0005)
- Genomes carry 1 (male) or 2 (female) copies; males express their single copy raw. The
  contract gains `haploidOffspring(genome, rng)` for worker-laid male eggs; LAY_EGG goes
  live for workers, costing the layer's own energy.
- Males are short-lived walking ants; mating draws uniformly from all living males
  map-wide and the drawn male dies. No males → no founding. (ADR-0007)
- Real founding replaces in-place succession (which is deleted): queen eggs are laid from
  the stockpile with merit-weighted father selection (channel 3 at egg creation); a hatched
  winged queen flies to a random distant point, mates with `spermCount` males, carves a
  chamber, and founds claustrally from body reserves. Queen death (age or starvation)
  collapses the colony; orphan workers live out their lives.
- Nest decay: per-voxel last-traffic ticks (Uint32, sim-owned) + stochastically sampled
  collapse of long-untrafficked subsurface air to LOOSE_FILL. The surface heightmap moves
  into sim world state (render and decay both consume it).
- Seasons: `world.foodTarget` follows base × (1 + amp·sin(2πt/period)) + rng noise,
  updated each governor pass. Egg exposure: surface-exposed eggs suffer a per-tick death
  hazard.
- Map widens to 192×64×192; food base scales with area. Checkpoints bump to version 2 and
  refuse version 1 loudly. The t=0 world bootstrap keeps the fast-forwarded first brood
  (curriculum, spec §10); all subsequent founding is raw.
- Turnover (lifespan) remains the documented calibration dial; no new machinery.

## Context / reuse map

- All Release 2 systems extend existing modules: `ScentField` (owner tag), `tryDig`
  (food pickup), `colony.ts` (founding/collapse), `eggs.ts` (sex, exposure),
  `foodSpawner.ts` (seasons), `rnn.ts` (ploidy, 22 inputs, instinct), `checkpoint.ts`
  (v2), `chunkMeshes.ts` (consume sim surface map instead of building its own).
- Source of truth: design spec §5.5, §7, §9, §10; ADRs 0004–0007.
- Verify: `make test` per phase; `make ci` + `make test-slow` at release close. Long-run
  behavior gates live in the slow tier; every test is fixed-seed deterministic.

## Cross-cutting constraints

- Determinism (ADR-0002) and serializability (ADR-0001) for every new field: owner arrays,
  lastVisit, sex flags, colony lifecycle state, drone deaths — all through the world PRNG
  and checkpoint v2.
- No hot-path allocation in new per-tick systems (decay sampling, delivery checks,
  owner-tag filtering) — scratch buffers and flat arrays, matching the perf rework.
- Genome layout changes once (22 inputs) in this release; every genome-length constant
  derives from INPUT_COUNT.
- The controller contract remains the only ploidy boundary; nothing outside
  `src/sim/controller` inspects copy counts.
- Lint limits (complexity 10, 75-line functions) still bind; colony lifecycle decomposes
  into small systems.

## Milestones

### M0 — Sim groundwork
Surface map into sim, wider map, seasons.
- Move the surface heightmap into `World` (built at creation; renderer consumes it).
- Widen the map to 192×64×192; scale food-governor base with area.
- Oscillating carrying capacity on `world.foodTarget` with rng noise.
- Exit: `make test` green; seasons unit test (foodTarget traces the sinusoid); terrain
  and mesher tests pass at the new size.

### M1 — Owner-tagged scent + nest scent + 22-input interface [depends on M0]
The signal substrate for multi-colony life and transport.
- Owner byte on `ScentField`; deposits stamp colony id; sampling filters by colony.
- Nest-scent field emitted at each living queen; stereo inputs NEST_SCENT_L/R
  (INPUT_COUNT 22); rnn genome length derives; transport instinct on hidden unit 2.
- Checkpoint v2 (owner arrays, new genome length; version 1 refused).
- Exit: `make test` green; tag-filter unit tests; chemotaxis assay re-verified.

### M2 — Physical food transport [depends on M1]
The meal tax dies; logistics becomes real.
- DIG on FOOD picks up; deposit within queen radius converts carried food to stockpile +
  patriline merit + ant.deliveries; deposit elsewhere re-places a FOOD voxel.
- Delete `creditDelivery`'s meal tax; eating is pure energy again.
- Exit: `make test` green; scripted transport integration test (pickup → carry → deliver
  → stockpile and merit credited); slow-tier colony gate recalibrated to delivery-driven
  egg production.

### M3 — Haploid males and worker-laid eggs [depends on M1]
Gene channel 2's substrate.
- Genome copies 1|2; male expression raw; `haploidOffspring` on the contract; egg and ant
  gain `sex`; male lifespan fraction in tunables.
- Workers firing LAY_EGG lay haploid male eggs from their own energy.
- Exit: `make test` green; ploidy unit tests (expression, inheritance directions); a
  worker in-world lays a male egg that hatches male.

### M4 — Real founding and colony lifecycle [depends on M2, M3]
The metapopulation loop closes; in-place succession is deleted.
- Queen eggs from stockpile threshold with merit-weighted father draw; winged queen
  hatches, flies to a distant random site, mates with living males (each dies), carves a
  chamber, founds claustrally from body reserves.
- Queen aging and starvation → colony collapse (laying stops, colony removed after
  orphans die out); succession code deleted.
- Colony-count instrumentation series.
- Exit: `make test` green; deterministic founding unit tests; slow-tier metapopulation
  gate — a long seeded run shows ≥1 real founding and ≥1 collapse with the world alive.

### M5 — Nest decay and egg exposure [depends on M0]
The anti-ratchet terrain loop (§9.2).
- Per-voxel lastVisit stamped by ant presence; sampled stochastic collapse of subsurface
  air untrafficked past a TTL; healthy cores stay open through traffic.
- Surface-exposed eggs suffer a per-tick death hazard.
- Exit: `make test` green; decay unit tests (abandoned tunnel collapses, trafficked
  tunnel persists — fixed seeds); exposure test.

### M6 — Release close: calibration, acceptance, docs [depends on M4, M5]
- R2 acceptance slow gate: one seeded long run exhibits seasons in the food series,
  founding + collapse events, multiple coexisting colonies, and a surviving world.
- Retire delivered Release 2 backlog entries; CHANGELOG v0.2.0; architecture doc updates;
  MVP-PLAN removed or archived alongside this plan's completion note.
- Exit: `make ci` and `make test-slow` green; commit and push; CI green.

### Decisions needing your input

| Where | Decision you own |
| ----- | ---------------- |
| — | None open; all shape decisions recorded above and in ADRs 0005–0007. Review the three instincts now seeded (chemotaxis, excavation, transport) at release review if you want a purer-emergence configuration. |
