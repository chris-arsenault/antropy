# 0001 — Simulation runs on the main thread with a worker-portable core

- Status: Accepted
- Date: 2026-08-31

## Context

The MVP simulates thousands of ants (each a ~550-weight RNN) plus voxel updates and
pheromone diffusion, at speed multipliers from 1× to charts-only. The simulation host
determines UI responsiveness at high speed and the complexity of every data path between
simulation, renderer, and charts.

## Decision

The simulation core runs on the main thread inside a budgeted fixed-timestep loop. The core
is written as pure TypeScript modules (no DOM, React, or three.js imports — lint-enforced)
whose full state is serializable, so it can be rehosted in a Web Worker later without
redesign.

## Alternatives considered

- **Web Worker + SharedArrayBuffer** — keeps the UI thread free at extreme speeds, but
  requires COOP/COEP response headers on the CloudFront distribution, structured state
  mirroring for the renderer, and message-protocol design. That cost buys headroom the MVP
  scale (small map, single colony) has not demonstrated a need for. Rejected as premature.
- **Web Worker with structured-clone messaging** — avoids SharedArrayBuffer but pays a
  per-frame copy of render state and still needs the protocol. Rejected for the same reason.

## Consequences

- At charts-only speed the main thread interleaves simulation batches with throttled UI
  updates; a long tick batch can still delay input handling, which is acceptable at MVP scale.
- The purity/serializability constraint on the core is mandatory, not stylistic — it is what
  keeps the worker migration a move instead of a rewrite. It is enforced by ESLint import
  restrictions.
