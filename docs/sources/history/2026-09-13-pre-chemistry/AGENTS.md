# Agent Guide

Antropy is a browser-based 2D artificial-life simulation built as a Vite, React, TypeScript, and
Canvas SPA and deployed on the Ahara platform.

## Read first

| Topic                  | Link                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| Governing principles   | [docs/principles.md](docs/principles.md)                                         |
| Current work order     | [docs/design/README.md](docs/design/README.md)                                   |
| Current runtime contract | [docs/design/bacteria.md](docs/design/bacteria.md) |
| Current evolutionary contract | [docs/design/funded-bodies.md](docs/design/funded-bodies.md) |
| Current measurements | [docs/design/bacteria-results.md](docs/design/bacteria-results.md) |
| Historical ant certification | [docs/certifications.md](docs/certifications.md) |
| Documentation index    | [docs/README.md](docs/README.md)                                                 |
| Source archive         | [docs/sources/README.md](docs/sources/README.md)                                 |
| Architecture decisions | [docs/adr/README.md](docs/adr/README.md)                                         |
| Platform integration   | [../ahara/INTEGRATION.md](../ahara/INTEGRATION.md)                               |
| Ahara standards        | [../ahara-standards/standards/README.md](../ahara-standards/standards/README.md) |

## Current goal and boundary

Build a world where a diverse ecosystem and evolutionary adaptation are likely, for the user to
run for days or weeks and watch. Use hypotheses and small proof points to establish opportunities:
what cells can sense or physically exploit, what a choice costs, when it can repay that cost, and
what could remove its advantage. Development prepares this unresolved live experiment. It does
not certify a finished ecosystem in the harness, prescribe a number of surviving groups, or
require a long campaign to prove the user's future run has already delivered its value.

The implemented starting hypothesis is [sparse spatial ecology](docs/design/spatial-ecology.md): a genuinely
large, uneven world with capable movement and legible local populations. It changes the simulation
and its display. Retune viscosity, food density, dimensions and resource geometry together; preserve
intent and physical semantics rather than exact numerical settings. The first irregular patch
arrangement is a revisable hypothesis, not a permanent layout target. The design's work
sequence records implementation and its human review gate; [plan closeout](docs/design/plan-closeout.md) and the
[backlog](docs/backlog.md#backlog-plan-carryover) own disposition of earlier unfinished work.

The [current design](docs/design/README.md) governs top-down bacteria with heritable local RNNs.
The active contract is 35 inputs, 24 recurrent units, eight outputs, nine funded body stocks, ten
physical loci and checkpoint v8. Finite A/B deposits, toxin injury, paid defense/repair, porous matrix and decomposition
are implemented. Physical and behavioral mutation occur at local resource-funded reproduction;
acquired recurrent changes can transmit into offspring chromosomes. The default is 320 × 240 units,
viscosity 0.004, and 48 finite local renewal sites with unequal richness and mixed A/B composition.
Uniform initial food is zero; initial local food comes from finite deposit stock. Earlier
thick-medium A/B-half populations developed inherited
diet differences concentrated in opposite halves; two of three evolved pairs increased share in
both short rare-start contests ([evolution record](docs/evolve-study.md)). These are proof points
for local selection, not certification of lasting coexistence. The newer campaign's claimed
16/24 coexistence passes were incorrect; read the [correction](docs/analysis-correction.md).
Earlier studies isolated benefits from toxin savings, brief-food access and a B-processing allele.
Counts, chosen clusters and isolated advantages do not establish a diverse lasting ecosystem.

There is one periodic XY world. Production controllers receive local chemistry/body facts and
private memory, with no coordinates, compass, pathfinding, lineage identity or reproductive score.
No fallback controller, task dispatcher, offline optimizer or central parent selector runs in the
population. The task byte remains opaque. Genotypes are immutable; acquired experience belongs to
individuals until explicit birth-local assimilation.

Run starts seed 101, paused at tick zero, with 48 identical founder genotypes split between two
separated resource neighborhoods; most opportunities start unoccupied. New default worlds must
start with at least two spatial colonies. Food zones and epochs remain selectable.
Haploid clonal fission, mutation and paid inheritable plasticity remain active. The user reviews through Run and
stats. Active systems need an ecological purpose and a physical opportunity proof point; evolved
exploitation is not required before user observation. Record reasons for disabled systems.
Contact injury, predation, two-type toxin, element cycling, membrane crowding, disturbance, gene
transfer, sharing, solid walls and neutral signaling are off by default; porous matrix remains
active. Do not silently enable every experimental mechanism or seed diagnostic winners.

Automatic recovery retains six automatic and two manual compressed IndexedDB saves, within 256 MiB.
Checkpoints retain bounded spatial/chart history and complete organism parentage in compact pages.
Execution pauses visibly at memory/storage limits; ancestry defaults to a two-million-record limit.
See [continuing observation](docs/continuing-observation.md) for measurements and remaining browser
limits. These provisions do not assure uninterrupted days/weeks operation or enduring ecology.

Inspect startup configuration and headless evidence rather than running browser assays. Start a
development server only on explicit request. Substantial further designs require user review;
routine authorized repairs and proportional checks do not require repeated permission. Seed/fertilize,
outcrossing and environmental developmental reaction norms remain deferred.

The [documentation snapshot](docs/sources/history/README.md) preserves prior contracts and full
experiment records. The ant implementation is recoverable from commit `780fa4e`, tag
`ant-colony-checkpoint-2026-09-09`. Its construction, 2,000-worker gate and canceled training
campaigns are history, not bacterial prerequisites. Do not restore old schemas or work orders.
Current generated experiment dumps remain local (`frontend/harness/artifacts/` is ignored); the
ledger preserves named measurements, and a report a study document links to is copied into
`docs/evidence/`.

## Experiment operating policy

The [current work order](docs/design/README.md) supersedes earlier coexistence gates and roadmap
pass counts. A failed named prediction stays negative even if unrelated trait variation appears.
Never extend a horizon, sweep seeds or add mechanisms merely to produce a desired community.
The user's continuing live run is distinct from an agent experiment campaign.

Default to a small constructed experiment when testing a mechanism or a proposed strategic
opportunity. Do not substitute long runs, cell counts, biomass or founder dominance for evidence
that a cell senses a cue, acts on it and obtains a benefit that repays its cost.

1. State the question, competing explanations, initial conditions, predicted causal chain and
   decision the result can change before execution. Read existing negative findings first.
2. Use the shared simulation with handcrafted diagnostic RNN weights and physical genotypes.
   Simple biases and sensor-response connections are feasible; a programmed fallback or oracle
   is unnecessary. Freeze mutation and specify private learning, inherited-learning and contact
   gene-transfer settings. Physiological opportunities need a physical response, not an invented
   neural cue.
   Record funded bodies separately from genetic construction targets.
3. Start with single-cell probes lasting hundreds of ticks. Verify actual local readings, steering,
   displacement, uptake and expenses before testing population outcomes. A missing signal or
   unexpressed behavior is a finding, not a reason to launch a long population run.
4. When needed, use small paired populations, controlled food/exposure, swapped starting assignments and
   a few thousand ticks. Follow resource access through costs to funded growth/divisions and
   survival. Report percentages with explicit denominators; distinguish cumulative flow from
   standing field coverage. Compare group shares with their own initial whole-population
   denominators; more descendants alone is not invasion. Divisions per founder are not generations.
   Chosen k-means groups are descriptive partitions, not demonstrated strategies. Finite-food
   extinction is not an execution failure.
5. Stop at the declared horizon, terminal ecological outcome or wall cap. Preserve negative and
   incomplete results. No automatic seed expansion, parameter sweep or horizon extension.
   Replication is justified when conflicting results or needed precision can change the decision.

Use **long runs** for a question that requires many generations or long ecological timescales:
mutation discovery, invasion/coexistence, environmental epochs or sustained turnover. First
establish that the relevant sensory/action/physical opportunity exists in a short assay. Register
why the horizon is needed, a small pilot, controls, total run/tick/wall budgets, stopping criteria
and the escalation decision. Scaling from a pilot is not automatic. Broad requests to investigate
do not imply a large factorial campaign. Constructed tradeoffs, evolved adaptations and sustained
ecological dynamics are separate claims; no single experiment establishes all three.

From `frontend`, run the reusable short food-access panel:

```bash
pnpm harness quick-food-access --stage probe --output harness/artifacts/my-experiment/probe
pnpm harness quick-food-access --stage contest --output harness/artifacts/my-experiment/contest
python3 harness/quick_report.py harness/artifacts/my-experiment
```

Inspect probes before starting contests. Defaults are four 300-tick probes and four contests
capped at 3,000 ticks, one seed and swapped placement, with a 120-second per-case wall limit.
Existing case directories are never overwritten. The local report uses matplotlib and NumPy.
Extend `QuickScenario`/`runQuick` with fixtures and relevant observables for other mechanisms;
reuse ordinary inference/physics and the existing ledger. Do not build another observability
pipeline. Artifacts include exact initial/final checkpoints, configuration, source hashes,
sensor/action/position traces, typed resource flows and stopping reasons.
See [registration and results](docs/quick-food-access-study.md). Diagnostic genomes do not
automatically replace browser founders, and constructed behavior is not evolved discovery.

The six-area [capability study](docs/capability-investigation.md) extends the same runner with
funded body fixtures, saved-genotype interventions and ancestry-grouped resource/exposure traces.
`pnpm harness capabilities --case list` lists short screens; add `--stage followup` to list the
saved-genotype comparisons. A named case runs both placements, normally 1,500 ticks, with a strict
3,000-tick ceiling. Do not run every listed case by default. `capability-pilots` is a separately
registered four-pilot command, not a quick smoke test. `python3 harness/capability_report.py` reads
the completed study without advancing simulation. Keep physical opportunity, controller expression,
accessible variation and actual evolved exploitation separate in future reports. Spatial A/B
heterogeneity is now implemented. Its later proof points and the current world-design direction are in the [work order](docs/design/README.md); the study's old next-step
recommendation is historical, not an instruction to repeat it.

Vitest checks bounded invariants, including observers not changing simulation state. Headless
assays measure behavior; human review judges visible motion. Inspect browser startup configuration
rather than launching browser simulations. Run `make ci` after code changes, but do not repeat
expensive ecological panels merely for formatting or documentation changes.

## Critical rules

- The top-down periodic XY plane is the only runtime substrate. Do not add a spatial depth coordinate, a
  compatibility mode, an old-checkpoint adapter, or a second renderer. Recover the retired system
  from the annotated tag if historical code is needed.
- Author physical pressures and local carriers. Controllers receive thirty-five local chemical,
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
- Treat the controller as a pluggable module behind `seed`, `createState`, `act`, `assimilate`, `mutate`, `recombine`, and
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
| `cd frontend && pnpm harness rps --case pairwise` | Constructed producer/resistant/sensitive toxin contests |
| `cd frontend && pnpm harness zones --case three-way --shares 1,0` | Constructed diet contests in zoned or mixed food worlds |
| `cd frontend && pnpm harness evolve --world zones --seed 101` | De novo evolution with trait samples and checkpoints |
| `cd frontend && pnpm harness invasion --checkpoint path` | Mutual-invasibility assay of a checkpoint's strategy clusters |
| `cd frontend && pnpm harness recent`             | Read recent ledger rows                                                  |
| `cd frontend && pnpm harness sql "..."`          | Query the measurement ledger                                             |
| `cd frontend && pnpm run dev`                    | Local server, only when explicitly requested                             |
