# 0005 — Owner-tagged scent channels for multiple colonies

- Status: Accepted
- Date: 2026-09-02

## Context

Multiple colonies on one map must not read each other's pheromone trails (design spec §5.5:
deposits are colony-tagged, or colonies get per-colony channel pairs). A scent field at
192×64×192 costs ~9MB of typed arrays; the colony count is unbounded across a
metapopulation run.

## Decision

Each pheromone channel (and the nest-scent field) is one shared field plus a per-voxel
owner byte. Deposits stamp the depositor's colony id (last writer wins); sampling filters
by the sampler's colony — foreign scent reads as zero. Memory stays constant in colony
count.

## Alternatives considered

- **Per-colony channel pairs** — perfect isolation, but memory and diffusion cost scale
  linearly with colony count (~19MB and one more diffusion pass per colony), unbounded in
  a metapopulation. Rejected.
- **No tagging** — cross-colony trail contamination, which the spec names as the failure
  this machinery exists to prevent. Rejected.

## Consequences

- Overlapping deposits collide: the newer colony's deposit claims the voxel. Trail
  interference at territory boundaries is real ecology, not a bug.
- Owner arrays serialize into checkpoints alongside values and active lists.
