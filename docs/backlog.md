# Backlog

Planned-but-not-built work. Each item is a positive assertion of future-state behavior.
Ordering follows the build phasing in [design-spec.md §13](design-spec.md); every knob is
calibrated before the layer that depends on it.

## Phase 1 — World core

- Implement the voxel grid, material types, and fBm terrain generation.
- Implement chunked (16³) meshing with dirty-chunk remeshing and Three.js instanced rendering.
- Implement voxel-lattice movement with render-side interpolation.
- Implement the speed-decoupling skeleton (fixed-timestep simulation, renderer detach at high speed).

## Phase 2 — Ecology with frozen genetics

- Implement the energy economy, food spawning, and the density-dependent population governor.
- Implement the pheromone volume (two channels, air-adjacency diffusion, evaporation).
- Implement digging with conserved spoil and `LOOSE_FILL` deposition.
- Run scripted-queen colonies on fixed seed genomes to balance the ecology.

## Phase 3 — Evolution on

- Implement mutation, polyandrous founding, worker-laid males, and merit-weighted succession.
- Implement the egg lifecycle, death, turnover, and wide-prior initialization.
- Bring instrumentation online: selection-differential readout first, then gene tracks,
  lineage coloring, and the ant inspector.

## Phase 4 — Recurrent regimes

- Implement queen aging, colony mortality, and refounding on a shared map.
- Implement nest decay and seasonal (oscillating) carrying capacity.
- Widen the map and run multiple colonies.

## Phase 5 — Emergence layers

- Implement the larval-feeding caste dial.
- Implement inter-colony contact consequences.
- Add soil/water ecosystem heterogeneity.
- Add the linear-GP second controller behind the controller contract.

## Platform

- Add cloud-stored checkpoints (would activate the Ahara ALB/database/Cognito integration
  steps for syncing overnight headless runs across machines).
