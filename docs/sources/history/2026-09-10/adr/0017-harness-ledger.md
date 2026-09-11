# 0017 — Behavioral campaigns live in the harness ledger

- Status: Accepted
- Date: 2026-09-06

## Context

Long simulation tests were slow, brittle, and poor evidence. Exact world-state assertions turned
deliberate model changes into CI failures while still missing visibly broken trajectories.

## Decision

Vitest covers bounded mechanics. Comparative and long-horizon runs execute through
`pnpm harness` and record parameters, seeds, commit state, timing, and summaries in SQLite. Human
visual review remains a separate gate where aggregate metrics can conceal motion defects.

## Consequences

Normal CI remains fast. Behavioral claims are reproducible from declared panels without pretending
that one threshold or one seed proves the simulation works.
