# 0008 — Brood-care instinct in the structured initialization

- Status: Accepted
- Date: 2026-09-02

## Context

The eat output fires tonically from the seeded forage instinct, and the excavation and
transport instincts concentrate ants at the nest — exactly where eggs incubate. Traced in
Release 2 integration: queen-destined eggs were eaten within ~200 of their 600 incubation
ticks, so real founding (spec §9.1) could never complete. Unconditional brood consumption
is a bootstrap-viability failure, which the spec assigns to initialization (§1.6, §10).

## Decision

A fourth erasable backbone entry: egg contact drives a hidden unit that inhibits EAT.
Founders default to leaving brood alone; worker policing and egg cannibalism (spec §4,
§7.1) remain one weight-erasure away for evolution.

## Alternatives considered

- **Rule-based egg protection near the queen** — a hand-coded behavioral rule outside the
  genome, removing egg-policing and cannibalism from the possibility space the spec
  explicitly constructs. Rejected.
- **Shorter incubation / hidden queen eggs** — narrows the window instead of fixing the
  default, and special-cases royal brood invisibly. Rejected.

## Consequences

- Egg survival rises across the board (worker brood too), shifting population dynamics;
  ecology gates recalibrated with it.
- "Ants don't eat eggs" is a seeded prior, not an emergent norm; lineages that erase it
  become egg predators, which the instrumentation can now actually witness.
