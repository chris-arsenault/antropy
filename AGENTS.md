# Agent Guide

Antropy is a browser-based 2D artificial-life simulation built as a Vite, React, TypeScript, and
Canvas SPA and deployed on the Ahara platform.

## Read first

| Topic                  | Link                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| Governing principles   | [docs/principles.md](docs/principles.md)                                         |
| Current work order     | [docs/design/README.md](docs/design/README.md)                                   |
| Current runtime contract | [docs/design/bacteria.md](docs/design/bacteria.md) |
| Current measurements | [docs/design/bacteria-results.md](docs/design/bacteria-results.md) |
| Historical ant certification | [docs/certifications.md](docs/certifications.md) |
| Documentation index    | [docs/README.md](docs/README.md)                                                 |
| Source archive         | [docs/sources/README.md](docs/sources/README.md)                                 |
| Architecture decisions | [docs/adr/README.md](docs/adr/README.md)                                         |
| Platform integration   | [../ahara/INTEGRATION.md](../ahara/INTEGRATION.md)                               |
| Ahara standards        | [../ahara-standards/standards/README.md](../ahara-standards/standards/README.md) |

## Current goal and boundary

Current work is [top-down bacteria with heritable RNN controllers](docs/design/bacteria.md).
The September 9 user decision supersedes the ant work order: first design sensors and actions,
then convert the runtime. The reviewed design is implemented, including live inheritance and mutation.
Sulion plan `d805a90c-31e7-4f20-8fb1-5b2c05d9b417` tracks the conversion and initial comparisons.
Viable reproduction is measured; reliable adaptation remains unproven. Human motion review is next.
The architecture correction follows [ADR 0018](docs/adr/0018-bacterial-runtime.md): checkpoint v2,
separate environment/body/genetic random streams, controller-owned codecs, durable intervention
provenance and matched body/ancestry invariants. Initial v1 comparisons are historical; do not
silently upgrade their checkpoints or treat their seeded trajectories as current.

The ant runtime is preserved at commit `780fa4e`, annotated tag
`ant-colony-checkpoint-2026-09-09`, pushed to origin. Bacteria have replaced it in the browser.
Its physical lifecycle, programmed/LGP controllers and sustained excavation are historical evidence.
Ant construction, the 2,000-worker prerequisite and canceled ant-RNN training campaigns are not
the new work order. Do not resume old neural experiments or apply their interfaces to bacteria.

The bacterium has tonic/phasic nutrient and released-chemical readings, local spatial
contrasts, body/contact sensors, a small float32 RNN, private recurrent state and an inspectable
opaque task byte. Physical swimming, turning and chemical release have costs; uptake, growth,
death and division are local physiology. Offspring inherit weights and receive mutations at
resource-funded division. No fitness scorer, central reproduction selector or prescribed task
sequence enters the living population. Genetic implementation follows the viable body/controller
loop directly, without another colony-scale or ecology prerequisite.

There is one top-down XY world. Recover the ant substrate from its tag; do not maintain two runtime
modes or translate old checkpoints. The bacteria contract governs current work. No queen, digging,
backing, vertical gravity, shared map or route service is part of the bacterial interface.

The user reviews through Run and stats. Keep review conditions as tick-zero paused defaults,
retain useful camera/pacing controls, and inspect startup configuration instead of running browser
assays. Start a development server only on explicit request. Current generated experiment dumps
remain local; the preserved commit contains the ledger and test-required model, not every dump.

## Critical rules

- The top-down periodic XY plane is the only runtime substrate. Do not add a spatial depth coordinate, a
  compatibility mode, an old-checkpoint adapter, or a second renderer. Recover the retired system
  from the annotated tag if historical code is needed.
- Author physical pressures and local carriers. Controllers receive fifteen local chemical,
  body, contact and private-byte inputs. They may not receive coordinates, a compass bearing,
  destination, hidden route, lineage identity or reproductive score.
- RNN weights alone choose physical efforts and register writes. Diagnostic competition summaries
  never select parents, filter mutants or promote a replacement founder automatically.
- Measurements outrank plans and historical appendices. Documents under
  [docs/sources/](docs/sources/README.md) preserve provenance and rejected work; they do not govern
  current implementation.
- Change one mechanism, predict its effect, and measure it. When parameter motion does not change
  the claimed outcome, stop tuning and record a structural finding.
- Human review is a real gate for motion. Ratios and final counts cannot certify circling, jitter,
  congestion, or other visibly broken trajectories.
- Treat the controller as a pluggable module behind `seed`, `createState`, `act`, `mutate`, `recombine`, and
  `genomeDistance`. Code outside a controller does not inspect genome internals.
- Keep Vitest bounded to deterministic mechanics and integration invariants. Ecological and
  long-horizon results belong in `frontend/harness/ledger.db`.
- Use pnpm, TypeScript, React, Canvas, and Vitest. ESLint limits complexity to 10, files to 400
  lines, and functions to 75 lines.
- Run `make ci` before handoff after changing files. Start a development server only when the user
  explicitly asks.
- Persistence is client-side through IndexedDB and file export. Do not add a backend, database,
  ALB, or authentication without an explicit decision.
- Follow the Ahara platform contract: shared Terraform state and the `ahara-tf-patterns` website
  module; no project-specific bucket or load balancer.

## Code map

| Path                        | Purpose                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `frontend/src/sim/`         | Deterministic bodies, fields, sensing, RNN, resource economy and inheritance |
| `frontend/src/ui/`          | Canvas view, field controls, charts, inspector, and simulation pacing |
| `frontend/src/persist/`     | Current 2D checkpoints, IndexedDB, and file import/export             |
| `frontend/harness/`         | Comparative measurements and committed SQLite ledger                  |
| `infrastructure/terraform/` | Static website deployment                                             |
| `docs/`                     | Current design, evidence, decisions, and archived source material     |

## Commands

| Command                                          | Purpose                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `make ci`                                        | Lint, format check, typecheck, bounded tests, docs, and Terraform format |
| `make build`                                     | Production SPA build                                                     |
| `make deploy`                                    | Parameterless local deploy script                                        |
| `cd frontend && pnpm harness bacteria` | Run live bacterial ecology and save evidence |
| `cd frontend && pnpm harness bacteria-compare --checkpoint path --candidate id` | Assess ancestor/descendant competition |
| `cd frontend && pnpm harness bacteria-capacity` | Measure a 2,000-cell initialization load probe |
| `cd frontend && pnpm harness recent`             | Read recent ledger rows                                                  |
| `cd frontend && pnpm harness sql "..."`          | Query the measurement ledger                                             |
| `cd frontend && pnpm run dev`                    | Local server, only when explicitly requested                             |
