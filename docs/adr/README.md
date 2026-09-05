# Architecture Decision Records

Current controller, genome, world, reproduction, and evolutionary design is decomposed in the
[normalized design](../design/README.md). The founding specification and its alternatives remain
in the [source archive](../sources/design-spec.md). ADRs record implementation-time decisions.

| # | Title | Status | Date |
| - | ----- | ------ | ---- |
| [0001](0001-main-thread-simulation.md) | Simulation runs on the main thread with a worker-portable core | Accepted | 2026-08-31 |
| [0002](0002-deterministic-simulation.md) | Deterministic simulation with a seeded PRNG | Accepted | 2026-08-31 |
| [0003](0003-custom-canvas-charts.md) | Custom canvas charts instead of a charting library | Accepted | 2026-08-31 |
| [0004](0004-excavation-instinct.md) | Excavation instinct in the structured initialization | Accepted | 2026-09-02 |
| [0005](0005-owner-tagged-scent-channels.md) | Owner-tagged scent channels for multiple colonies | Accepted | 2026-09-02 |
| [0006](0006-nest-scent-and-transport-instinct.md) | Nest scent signal and food-transport instinct | Accepted | 2026-09-02 |
| [0007](0007-global-mating-pool.md) | Global mating pool abstracts the nuptial flight | Accepted | 2026-09-02 |
| [0008](0008-brood-care-instinct.md) | Brood-care instinct in the structured initialization | Accepted | 2026-09-02 |
| [0009](0009-oracles-outside-the-contract.md) | Diagnostic oracles live outside the controller contract | Accepted | 2026-09-02 |
| [0010](0010-derived-seed-portfolio.md) | Seed portfolio derived by direct optimization, baked as artifacts | Accepted | 2026-09-02 |
| [0011](0011-liability-shapes-and-bootstrap-tournament.md) | Liability shapes price asset placement; dominance de-scoped to asset ledgers | Accepted | 2026-09-02 |
| [0012](0012-harness-ledger.md) | Measurement harness with a SQLite ledger, outside the test tiers | Accepted | 2026-09-02 |
| [0013](0013-feature-config-gates.md) | Feature gates so build phases are data, not code | Accepted | 2026-09-02 |
