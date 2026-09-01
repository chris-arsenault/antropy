# 0006 — Nest scent signal and food-transport instinct

- Status: Accepted
- Date: 2026-09-02

## Context

Release 2 replaces the meal-tax delivery abstraction with physical food transport: eggs are
provisioned only by food actually deposited at the queen. Founders under a random prior
cannot navigate home or deliver, so every colony would starve at its first stockpile
exhaustion — a bootstrap-viability failure the spec assigns to initialization and world
design (§1.6, §10), not to hand-coded behavior.

## Decision

Two additions:

1. **Nest scent** — the scripted queen continuously emits a colony-tagged scent field,
   exactly as FOOD voxels emit food scent. It is an environmental signal from a
   special-cased entity (like food scent), not a third meaning-free pheromone channel; the
   sensory interface gains stereo nest-scent inputs (INPUT_COUNT 20 → 22).
2. **Transport instinct in the structured init** — a third erasable backbone entry: when
   carrying food, steer up the nest-scent gradient and deposit where nest scent is strong.
   Ordinary weights, mutable like the chemotaxis (unit 0) and excavation (unit 1,
   ADR-0004) instincts.

## Alternatives considered

- **Keep the meal tax** — no logistics substrate, so transport, recruitment, and stockpile
  behavior can never evolve; scheduled for removal since M6. Rejected.
- **Home-vector compass input** — cheaper to follow than a gradient but hands ants a
  solved navigation problem with no physical carrier; nest scent flows through tunnels, so
  architecture and homing co-evolve (spec §5.5). Rejected.
- **No instinct, wide priors only** — the excavation experience (ADR-0004) showed
  expression is seed luck; here non-expression is colony death, not a missing behavior.
  Rejected.

## Consequences

- Genome length changes (22 inputs); checkpoints bump to version 2 and older saves are
  refused loudly.
- Delivery credit (stockpile + patriline merit) moves from eating to depositing food near
  the queen; foraging success and delivery success become different things selection can
  see.
- Early-run homing/delivery is seeded prior, not emergence, and must be read as such.
