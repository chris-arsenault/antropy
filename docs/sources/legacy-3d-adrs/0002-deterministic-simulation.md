# 0002 — Deterministic simulation with a seeded PRNG

- Status: Accepted
- Date: 2026-08-31

## Context

The design spec requires checkpointing (save, reload, continue overnight runs) and
re-watching notable events by reloading a prior checkpoint. Debugging evolved behavior also
needs reproducible runs: a stall or crash in hour three must be reproducible from a seed.

## Decision

The simulation is deterministic: a single seeded PRNG stream (sfc32) owned by the world
state, fixed integer tick steps, and deterministic iteration order over entities and voxels.
`Math.random` and wall-clock reads are banned inside the simulation core (lint-enforced).
Terrain generation, founder genome draws, mutation, and every stochastic simulation event
draw from the world's PRNG.

## Alternatives considered

- **Nondeterministic simulation** (`Math.random`, iteration order left to engine behavior) —
  simpler to write, but checkpoint-reload produces divergent futures, bugs are
  unreproducible, and replay-from-checkpoint (a design-spec commitment) becomes
  approximate. Rejected.
- **Determinism only for terrain/founders** — halves the discipline but still loses replay
  and reproduction of evolved-behavior bugs, which is where determinism pays most. Rejected.

## Consequences

- Checkpoint format is just serialized state + PRNG state; a reloaded world continues
  bit-identically, which doubles as the persistence test.
- Every simulation data structure must iterate in insertion or index order (arrays and
  index-keyed maps, no object-key iteration in the hot path).
- The renderer and UI may use unseeded randomness freely; the ban applies to `src/sim` only.
