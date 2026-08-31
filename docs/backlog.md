# Backlog

Planned-but-not-built work, grouped by release. Each item is a positive assertion of
future-state behavior. Scope derives from the [design spec](design-spec.md); section
references point there. Every release honors the binding constraint of §9: no architectural
decision may preclude colony mortality/refounding, nest decay, or oscillating carrying
capacity, even before the release that implements them.

The MVP ("selection visible in one session") shipped in v0.1.0 — see
[../CHANGELOG.md](../CHANGELOG.md) and [architecture.md](architecture.md).

## Release 2 — metapopulation and recurrent regimes (§7.2, §9)

- Replace the meal-tax delivery abstraction with physical food transport to the nest,
  keeping per-patriline merit tracking.
- Implement expressed haploid males behind the controller contract (removing the MVP
  all-diploid simplification).

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
