# 0017 — Behavioral campaigns live in the harness ledger

- Status: Accepted; amended September 30, 2026 (visual-review gate retired)
- Date: 2026-09-06

## Context

Long simulation tests were slow, brittle, and poor evidence. Exact world-state assertions turned
deliberate model changes into CI failures while still missing visibly broken trajectories.

## Decision

Vitest covers bounded mechanics. Comparative and long-horizon runs execute through
`pnpm harness` and record parameters, seeds, commit state, timing, and summaries in SQLite. Human
visual review remains a separate gate where aggregate metrics can conceal motion defects.

September 21, 2026 clarification: this SQLite ledger is local experimental data at
`frontend/harness/artifacts/ledger.db`, not a committed repository artifact. Raw data,
genomes, traces, reports and plots stay ignored. Git preserves authored findings and
reproduction instructions. This replaces the earlier practice of checking in the database
and selected raw evidence; it does not discard local records or rewrite repository history.

Amendment (September 30, 2026): the separate human visual-review gate named above is retired
by the September 30 delivery policy ([plans README](../plans/README.md)). Headless assays
measure behavior; user feedback about visible motion informs subsequent fixes without being a
completion gate. Retiring the gate does not mark earlier reviews as passed.

## Consequences

Normal CI remains fast. Behavioral claims are reproducible from declared panels without pretending
that one threshold or one seed proves the simulation works.
