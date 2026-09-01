# 0009 — Diagnostic oracles live outside the controller contract

- Status: Accepted
- Date: 2026-09-02

## Context

Appendix B's oracle ladder (§B.4) requires scripted cheat-agents that drive the real ant
body through the real world — some omniscient (rung 1 reads all food positions), some
sensor-limited (rung 2). The controller contract (spec §2.3) deliberately exposes only the
sensory interface, which rung-1 oracles must violate to exist.

## Decision

Oracles are a separate driver layer in `src/sim/oracles/`: policy functions constructed
with a world reference that emit the same motor-output vector the controller path consumes.
`stepWorld` accepts an optional per-ant policy override used only by diagnostic harnesses.
Rung-2 (sensor-limited) oracles read the same input vector real ants get; rung-1 oracles
read the world directly, and that privilege is confined to this module.

## Alternatives considered

- **Oracles as Controller implementations** — rung 2 fits, but rung 1 cannot see food
  positions through the contract; widening the contract for diagnostics would let cheat
  inputs leak into the evolutionary surface. Rejected.
- **A parallel scripted-ant entity type** — duplicates the body (movement, energy, actions)
  the oracles exist to test; divergence between the copies would invalidate every oracle
  result. Rejected.

## Consequences

- Oracle results are attributable: an oracle failure indicts the world/interface, never a
  second body implementation.
- The override hook is diagnostic machinery; production worlds never set it, and
  checkpoints do not serialize it.
