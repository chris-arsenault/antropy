# 0012 — Measurement harness with a SQLite ledger, outside the test tiers

- Status: Accepted
- Date: 2026-09-02

## Context

Tournaments, calibration sweeps, oracle-ladder runs, and diagnostic probes were encoded
as vitest slow tests. Their assertions pinned world-state numbers, so every deliberate
world change turned measurements into test failures; multi-minute simulation campaigns
ran inside the unit-test runner; results lived in scrollback and had to be re-simulated
to be re-read; and each diagnosis spawned a disposable probe test file.

## Decision

Measurements are a separate instrument layer under `frontend/harness/` (Appendix C
O-layer), run via `pnpm harness <command>` (tsx + Node's built-in `node:sqlite`):

- **Ledger** (`harness/ledger.db`, committed): every run records its experiment,
  driver, seed, ticks, parameter patches, git commit (+dirty), wall clock,
  ticks/second, a summary, sampled time series, and optional per-ant traces.
  Query via `pnpm harness recent` or `pnpm harness sql "..."`.
- **Parameterized runs**: `pnpm harness run --driver <seeded|rung1|rung2|rung2-degraded|
surface|shelter|architect> --seeds a,b --ticks N --patch TABLE.key=value --vault N
--queen-surface --follow antId`. Experiments compose drivers:
  `tournament`, `ladder`, `calibrate`, and `calibrate-colony-economy`. The colony-economy
  command measures fixed trained and perturbed controller populations across scoped food/work
  profiles; it never trains or selects a controller. `clone-colony-loop` trains one or more
  independent full recurrent initializations from recorded sensor/output sequences, and
  `evaluate-colony-cohort` evaluates fixed ledger vectors as a cohort without selection.
- **Determinism checker**: `pnpm harness determinism` runs the
  save/restore/checksum-series/first-divergence workflow as a command.
- **Seed derivation**: `pnpm harness derive`, `derive-vivo`, and `derive-digger` run the
  probe, live-colony, and constrained digging optimizers outside the application runtime.
- **Initial controller training**: `clone-colony-loop` records every independent recurrent clone
  and its aggregate cohort. `optimize-colony-loop` provides the fixed-budget, mirrored,
  rank-shaped closed-loop stage; its milestone ordering and candidate worlds are ledger data, and
  final acceptance uses `evaluate-colony-cohort` on separate worlds.
- The test suite keeps bounded mechanics and integration invariants. Long-horizon ecology,
  calibration, and comparative world outcomes do not run as timed test targets. No test asserts
  a long-run world-state number; recorded ledgers plus documentation replace pinned measurement
  gates.

## Alternatives

- **Measurements as tests** (status quo): rejected — see Context.
- **JSONL ledger with world-semantics fingerprints and ledger-driven CI gates**:
  rejected as over-engineered; SQLite plus git-commit provenance suffices, and gates
  over world-state numbers are not valuable regardless of where they run.

## Consequences

- Deliberate world changes are followed by explicit re-measurement (`pnpm harness
tournament ...`), and the ledger keeps the before/after comparable by commit.
- Rule 6/Rule 7 orderings are tracked as recorded measurements in
  [calibration.md](../calibration.md), not asserted in CI.
- Diagnostic probes are flags (`--follow`, series cadence) instead of throwaway
  test files; the sim source carries no debug instrumentation.
