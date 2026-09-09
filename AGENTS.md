# Agent Guide

Antropy is a browser-based 2D artificial-life simulation built as a Vite, React, TypeScript, and
Canvas SPA and deployed on the Ahara platform.

## Read first

| Topic                  | Link                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| Governing principles   | [docs/principles.md](docs/principles.md)                                         |
| Current work order     | [docs/design/README.md](docs/design/README.md)                                   |
| Canonical 2D contract  | [docs/design/2d-migration.md](docs/design/2d-migration.md)                       |
| Controller design      | [docs/design/controller.md](docs/design/controller.md)                           |
| Environment design     | [docs/design/environment.md](docs/design/environment.md)                         |
| Experiment design      | [docs/design/experimentation.md](docs/design/experimentation.md)                 |
| Certification status   | [docs/certifications.md](docs/certifications.md)                                 |
| Documentation index    | [docs/README.md](docs/README.md)                                                 |
| Source archive         | [docs/sources/README.md](docs/sources/README.md)                                 |
| Architecture decisions | [docs/adr/README.md](docs/adr/README.md)                                         |
| Platform integration   | [../ahara/INTEGRATION.md](../ahara/INTEGRATION.md)                               |
| Ahara standards        | [../ahara-standards/standards/README.md](../ahara-standards/standards/README.md) |

## Current goal and boundary

Next priority is [a sustainable colony near 2,000 workers](docs/design/colony-scale.md), before
genetics. The [programmed and linear-GP controllers](docs/design/colony-knowledge.md) are implemented.
The controlled-queen implementation shares ant actions and private controller state, with explicit
adjacent egg laying. The user has resumed [surplus-driven growth](docs/design/surplus-growth.md).
Resolve measured food delivery and nursery constraints before increasing population scale.
The ten-cell excavation result was rejected. The immediate target is
[sustained chamber excavation](docs/design/chamber-excavation.md) that doubles the default nest
from 148 to at least 296 connected underground cells through worker actions. Do not substitute
population growth, tiny cuts or passing mechanics tests for this result.
Inspect startup configuration instead of running browser assays.
The browser opens programmed ants on compact terrain, paused at tick zero; the LGP seed is selectable.
The user reviews through Run and the stats panel. Set the world conditions, camera, layers and
pacing needed for review as defaults; never require dropdown, layer or import operations to reveal
the behavior being reviewed. Retain existing controls for future use. The current default begins
at normal material temperatures, with visible temperature, a colony close-up and Metrics open with a
30 ticks/s target and measured throughput. The September 8 visual review failed after about
18,000 ticks. The subsequent food-pack and scattered-digging rejection is tracked in
[collective work](docs/design/collective-work.md). Follow its event and spatial evidence before scaling.
Shared colony knowledge, ant-selected terrain routes, direct movement and an opaque task byte are
authorized abstractions. Every worker still pays physical action costs and has private state.

Workers forage, store and consume food, feed queen and larvae, and die. Funded eggs, larvae and
pupae produce replacement workers. Population is resource-limited; founder count is initialization,
never a census target. The matched compact programmed/LGP runs sustain 20 workers with 57 births
through 48,000 ticks. This does not establish capacity for 2,000 workers or future genetic viability.

Capacity/performance measurements and Y-axis settling are implemented in
[the settling milestone](docs/design/settling.md). [Construction and relocation](docs/design/construction.md)
now add local digging, conserved spoil, queen carrying and multiple cache sites.
[Autonomous construction pressures](docs/design/construction-pressures.md) extend them with
brood carrying, material temperature/moisture and spoilage. Programmed/LGP ants select work from
observations; browser requests are optional diagnostics. Human review remains required for changed
motion. Both adult castes grip backing and nearby solids; unsupported adults, brood and loose food
settle downward through the same material grid.
Do not merely increase initial population or speed up laying without food, care and space budgets.
The September 8 collective-work decision permits ant-authored local work recruitment on pheromone B.
Preserve the cellular map, configurable surface tiers and pan/zoom.

RNN-specific plans are canceled, not paused for another training attempt. The
[task-memory results](docs/design/task-memory.md), [nest transfer](docs/design/nest-generalization.md)
and [recovery audit](docs/design/training-recovery.md) retain historical successes, failures and
artifacts. They do not govern current implementation or browser defaults. Do not resume a saved
training coordinator, evaluate pending neural candidates or require RNN certification.

Reproductive inheritance, live mutation and selection remain deferred until the scale milestone
and a separate genetics decision. Existing LGP variation hooks do not implement those systems.
Brood transport is implemented; nursery throughput remains a scale prerequisite. Collapse, seasons,
flooding and gas exchange remain backlog. Microclimate is active under the approved construction design.
Do not add the whole ecology package before reaching scale.

The [modular runtime](docs/design/modular-runtime.md) retains a static typed kernel and sequential
physical resolution. Profile before further architecture changes. Current checkpoint version 19
stores actual foreground/backing terrain, full configuration, resources, lifecycle, colony knowledge,
routes, task bytes, private registers, construction requests, partial work, spoil, caches, queen
carrier, brood loads, climate fields/budgets, timestamped site observations, private worksite memory,
bounded behavior events, full queen controller state, the original nest-area denominator and the LGP genome. Historical checkpoint versions and
retired 3D certification do not describe current runtime capabilities.

## Critical rules

- The 2D X/Y cross-section is the only runtime substrate. Do not add a spatial depth coordinate, a
  compatibility mode, an old-checkpoint adapter, or a second renderer. Recover the retired system
  from the annotated tag if historical code is needed.
- Shared-knowledge controllers follow colony-knowledge.md. The local-only restrictions below apply
  to historical controller comparisons.
- Author physical pressures and local carriers, not answers. Historical production controllers may sense
  local openness, local chemical concentration and contrast, contact, carried load, light, and
  deterministic individual variation. They may not receive coordinates, a bearing, a chosen
  destination, or a hidden route.
- The map-aware controller is a named harness and UI diagnostic. It may inspect the map to measure
  a ceiling, but it acts through the same turn, move, and mandible resolver as every other
  controller and may never enter an evolving population.
- Measurements outrank plans and historical appendices. Documents under
  [docs/sources/](docs/sources/README.md) preserve provenance and rejected work; they do not govern
  current implementation.
- Change one mechanism, predict its effect, and measure it. When parameter motion does not change
  the claimed outcome, stop tuning and record a structural finding.
- Human review is a real gate for motion. Ratios and final counts cannot certify circling, jitter,
  congestion, or other visibly broken trajectories.
- Treat the controller as a pluggable module behind `seed`, `act`, `mutate`, `recombine`, and
  `genomeDistance`. Code outside a controller does not inspect genome internals.
- Keep Vitest bounded to deterministic mechanics and integration invariants. Multi-trip and
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
| `frontend/src/sim/`         | Deterministic 2D world, sensing, action resolution, and policies      |
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
| `cd frontend && pnpm harness forager-comparison` | Run the matched 2D food-return panel                                     |
| `cd frontend && pnpm harness train-rnn`          | Regenerate the experimental RNN seed from local frames                   |
| `cd frontend && pnpm harness recent`             | Read recent ledger rows                                                  |
| `cd frontend && pnpm harness sql "..."`          | Query the measurement ledger                                             |
| `cd frontend && pnpm run dev`                    | Local server, only when explicitly requested                             |
