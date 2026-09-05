# Agent Guide

Antropy is a browser-based 3D ant evolution simulation (Vite + React + Three.js SPA) deployed
on the Ahara platform.

## Read first

| Topic                         | Link                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------- |
| Primary operating principles  | [docs/principles.md](docs/principles.md)                                         |
| Current work order            | [docs/design/README.md](docs/design/README.md)                                   |
| Controller design             | [docs/design/controller.md](docs/design/controller.md)                           |
| Colony biology                | [docs/design/colony-biology.md](docs/design/colony-biology.md)                   |
| Environment and morphology    | [docs/design/environment.md](docs/design/environment.md)                         |
| Experiments and certification | [docs/design/experimentation.md](docs/design/experimentation.md)                 |
| Evolution and advanced work   | [docs/design/advanced.md](docs/design/advanced.md)                               |
| Certification status          | [docs/certifications.md](docs/certifications.md)                                 |
| Documentation index           | [docs/README.md](docs/README.md)                                                 |
| Source archive                | [docs/sources/README.md](docs/sources/README.md)                                 |
| Architecture                  | [docs/architecture.md](docs/architecture.md)                                     |
| Architecture decisions        | [docs/adr/README.md](docs/adr/README.md)                                         |
| Backlog                       | [docs/backlog.md](docs/backlog.md)                                               |
| Changelog                     | [CHANGELOG.md](CHANGELOG.md)                                                     |
| Platform integration          | [../ahara/INTEGRATION.md](../ahara/INTEGRATION.md)                               |
| Ahara standards               | [../ahara-standards/standards/README.md](../ahara-standards/standards/README.md) |

## Critical rules

- Name which ordered goal the task serves: ultimately genuine evolution; currently admit genetic
  variation to the instrumented, certified living colony without claiming selection from standing
  variation alone; always attributable results, measured claims, and human-approved structural changes. The
  [operating principles](docs/principles.md) are the primary lens.
- Follow the [normalized cross-category order](docs/design/README.md#design-order) and the owning
  category's linear sequence one deliverable and one gate at a time. The fixed-genome colony loop
  is now the control arm: admit genetic variation only after its instruments are trustworthy, and
  keep digging, spoil, colony founding, seasons, and decay off until their ordered work. Isolate
  systems through per-world config, not source edits.
- Documents under [docs/sources/](docs/sources/README.md) preserve supplied wording and historical
  plans. They are provenance, not a parallel work queue. Reconcile a new source into the normalized
  categories and mark displaced ideas OBE instead of silently deleting them.
- Author the world, not the ant. Build pressures, physics, costs, and honest sensory carriers;
  never add an infallible answer, chosen destination, or self-targeting action to make behavior
  pass. Reflexes may be seeded as erasable genome weights, and oracles may diagnose outside the
  population. Quantities assigned to the genome stay genome-derived except for logged experiments.
- Function judges; shape describes. Pass conditions come from colony ledgers such as energy,
  survival, brood, and persistence. Log chambers, caches, trails, routes, and egg positions as
  observations, never required outcomes. The authored nest is a control arm for later comparison,
  not a template evolved digging must reproduce.
- Change one thing, predict its effect, then measure. State the governing inequality before tuning.
  When prediction and measurement disagree twice under material movement, stop and write the
  five-part structural finding: observed invariance, mechanism hypothesis, minimal structural fix,
  cost, and decision requested. Only the human authorizes new fields, sensors, mechanisms, or gate
  semantics.
- Measurements outrank conversation and documentation. Never certify around a contradiction;
  report the evidence and propose the amendment. Certify behavioral claims across varied world
  seeds, positions, food placement, headings, and jitter. Single-seed checks certify mechanics only.
- Run readable scripted oracles before opaque seeded controllers at each behavioral rung. Both use
  the identical sensor/output tuple and world resolution; no oracle-only action or privileged world
  mutation is allowed. Scoring and fitness machinery stays quarantined from the evolving population.
- Classify work as world, interface, seed, parameter, or oracle work using
  [the ownership model](docs/principles.md#principles-layers). Apply the tuning stop conditions and
  finding process in [the experimentation design](docs/design/experimentation.md#experimentation-loop).
- Treat the behavioral controller as a pluggable module behind the `act`/`mutate`/
  `recombine`/`seed` contract. Nothing outside the controller inspects genome internals.
- Follow the Ahara platform contract: shared Terraform state bucket, `ahara-tf-patterns`
  modules, no per-project buckets or load balancers. This project deploys only the `website`
  module — a static SPA behind CloudFront.
- Use pnpm, TypeScript (`.ts`/`.tsx` only), and Vitest. ESLint enforces complexity 10, files
  under 400 lines, functions under 75 lines, plus the `@ahara/standards` custom rules.
- Keep Vitest checks bounded to deterministic mechanics and integration invariants. Long-horizon
  simulation measurements and comparisons belong in the harness ledger, never in timed test gates.
- Run `make ci` before handoff after changing files.
- Start local development servers only when the user explicitly asks.
- Persistence is client-side (IndexedDB and file export). There is no backend, database, or
  auth; do not add ALB, RDS, or Cognito integration without an explicit decision.

## Code map

| Path                        | Purpose                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| `frontend/`                 | Vite React/TypeScript SPA — simulation, rendering, UI                        |
| `infrastructure/terraform/` | Project Terraform root using the Ahara `website` module                      |
| `scripts/`                  | Parameterless local deploy script                                            |
| `docs/`                     | Normalized design, evidence, architecture, ADRs, backlog, and source archive |

## Commands

| Command                             | Purpose                                                           |
| ----------------------------------- | ----------------------------------------------------------------- |
| `make ci`                           | Lint, format-check, typecheck, bounded tests, docs, and Terraform |
| `make build`                        | Production frontend build                                         |
| `make deploy`                       | Run the parameterless local deploy script                         |
| `cd frontend && pnpm harness <cmd>` | Parameterized measurements into `harness/ledger.db` (ADR-0012)    |
| `cd frontend && pnpm run dev`       | Local dev server (only when explicitly requested)                 |

Harness commands: `run`, `tournament`, `ladder`, `calibrate`, `calibrate-colony-economy`,
`colony-resilience`, `derive`, `derive-vivo`, `derive-digger`, `derive-colony-loop`, `clone-colony-loop`,
`bake-colony-run`, `robustness-colony-loop`, `correct-colony-energy`, `optimize-colony-loop`,
`optimize-colony-energy`, `colony-loop`, `determinism`, `recent`, and `sql`.
