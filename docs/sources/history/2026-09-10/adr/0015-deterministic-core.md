# 0015 — Deterministic, serializable simulation core

- Status: Superseded by [0018](0018-bacterial-runtime.md); determinism retained, ant checkpoint details historical
- Date: 2026-09-06

## Context

Seeded comparisons, checkpoint continuation, and diagnosis require reproducible worlds.

## Decision

The simulation uses integer ticks, a world-owned seeded PRNG, deterministic iteration, and
serializable typed state. Simulation modules cannot read wall time, unseeded randomness, React, or
DOM state. The canonical checkpoint declares the 2D dimension and rejects incompatible input. The September 7
physical-colony implementation uses version 4 to preserve changing populations, resource quantities,
staged brood, queen state, independent air chemistry and cumulative energy accounting.
The nutritional-yield follow-up advances to version 5, separating food quantity from energy density
and rejecting the former energy-only shape.
The task-memory follow-up advances to version 6, preserving each worker's byte and diagnostic
counters, the imported registered model, recurrent/command state and private sampling stream.
It rejects older checkpoints and verifies exact continuation through neural decisions.

## Consequences

Matched controller arms receive the same generated layout, and a restored checkpoint continues
identically. UI and harness layers remain outside the core.
