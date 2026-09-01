# Backlog

Planned-but-not-built work, grouped by release. Each item is a positive assertion of
future-state behavior. Scope derives from the [design spec](design-spec.md); section
references point there. Every release honors the binding constraint of §9: no architectural
decision may preclude colony mortality/refounding, nest decay, or oscillating carrying
capacity, even before the release that implements them.

The MVP ("selection visible in one session") shipped in v0.1.0 and Release 2
(metapopulation and recurrent regimes) in v0.2.0 — see
[../CHANGELOG.md](../CHANGELOG.md) and [architecture.md](architecture.md).

## Ecology calibration

- Calibrate long-horizon (30k+ tick) unassisted world persistence: the delivery economy,
  trophallaxis budget policy, and instinct-drift rate currently sustain a colony for one
  session but seed-dependently bleed out over several queen generations. Build a headless
  parameter-sweep harness (multiple seeds × tunable grid) so this is measured, not probed
  one knob at a time.
- Tune founding cadence so provisioned colonies reach the queen-egg threshold in the wild
  (the loop is machinery-gated; unassisted frequency is a calibration outcome).

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
