# Agent Guide

Antropy is a browser-based 2D artificial-life simulation built as a Vite, React, TypeScript, and
worker WebGL2 SPA with a Rust/WASM physical kernel and deployed on the Ahara platform.

## Read first

| Topic                  | Link                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| Governing principles   | [docs/principles.md](docs/principles.md)                                         |
| Current work order     | [docs/design/README.md](docs/design/README.md)                                   |
| Current runtime contract | [docs/design/bacteria.md](docs/design/bacteria.md) |
| Current evolutionary contract | [docs/design/funded-bodies.md](docs/design/funded-bodies.md) |
| Current measurements | [docs/design/chemistry/reliability-results.md](docs/design/chemistry/reliability-results.md) |
| Historical ant certification | [docs/certifications.md](docs/certifications.md) |
| Documentation index    | [docs/README.md](docs/README.md)                                                 |
| Source archive         | [docs/sources/README.md](docs/sources/README.md)                                 |
| Architecture decisions | [docs/adr/README.md](docs/adr/README.md)                                         |
| Platform integration   | [../ahara/INTEGRATION.md](../ahara/INTEGRATION.md)                               |
| Ahara standards        | [../ahara-standards/standards/README.md](../ahara-standards/standards/README.md) |

## Governing mathematical direction

[Computable chemistry](docs/design/chemistry/computational-foundation.md) and
[ADR 0022](docs/adr/0022-computable-chemistry.md) govern the current redesign. Design artificial
rules for composed operations over the 16×16 chemical manifold: shared reductions, geographic
vector fields, diffusion plus drift, local recognition and bounded product mappings. Physics
supplies language, not required equations. Select rules, accounts, bounds and measured cost
together; optimizing a conventional physical solver after selecting it is insufficient.
Preserve discrete chemicals, genome/RNN cells, funded capabilities, explicit material/work
accounts and immutable sharing. The earlier M0 equations and canceled M2 expansion are reference
records. Reopened M0 now has selected revision-4 laws, reusable Rust arithmetic and passing core
cost/CI evidence in the root plan and current specifications. M1's composition correction now
uses CSR local delivery, a single destination-row stencil, compiled engagement and separate
material/geographic lifetimes. Installed changes retain unaffected operators. The same core
workload measures 7.17/15.73 ms at 48/2,000 cells; this does not establish intended performance
or live integration. M2 spatial integration follows. Historical M0/M1 step files
must not be replayed. Ordinary World still executes the earlier spatial/biological pipeline;
the M0 arithmetic proof does not establish browser integration, viability or evolution.

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
The active contract is 39 inputs, 24 recurrent units, nine outputs, fifteen funded stocks,
four receptors/transporters/unary enzymes each, a membrane coordinate and physical checkpoint v12.
[Digital chemistry](docs/design/chemistry/README.md) replaces A/B processing, named toxins,
matrix binding, automatic catabolism, sharing, prey yield and the carbon/oxygen cycle.
A persisted smooth 16 × 16 chemical manifold supplies potential, diffusion, impedance and stress.
Finite sources, paid transport/reactions, generic biomass, washout and death close the resource books.
Chemical definition version 4 adds validated shared profiles to the joint diffusion/impedance
coverage. M1's canonical compiler serves the composed kernels and atlas, with live machinery
integration still pending; World stepping
still uses the earlier spatial and biological rules. Inherited target changes
retain installed machinery identity until paid refitting; birth never grants replacement stock.

Physical and behavioral mutation occur at local resource-funded reproduction; acquired recurrent
changes can transmit into offspring chromosomes. The default is 320 × 240 units, viscosity 0.004,
48 finite unequal renewal sites and two colonies. New [measurements](docs/design/chemistry/numerical-results.md)
contains constructed opportunities and negative findings, not evolved-community certification.
Historical A/B studies and their [corrected analysis](docs/analysis-correction.md) retain their
original meaning and do not establish current chemical behavior.

There is one periodic XY world. Production controllers receive local chemistry/body facts and
private memory, with no coordinates, compass, pathfinding, lineage identity or reproductive score.
No fallback controller, task dispatcher, offline optimizer or central parent selector runs in the
population. The task byte remains opaque. Genotypes are immutable; acquired experience belongs to
individuals until explicit birth-local assimilation.

Run starts seed 101, paused at tick zero, with 48 identical founder genotypes split between two
separated resource neighborhoods; most opportunities start unoccupied. New default worlds must
start with at least two spatial colonies. Generic source zones and epochs remain selectable.
Haploid clonal fission, mutation and paid inheritable plasticity remain active. The user reviews through Run and
stats. Active systems need an ecological purpose and a physical opportunity proof point; evolved
exploitation is not required before user observation. Record reasons for disabled systems.
Optional disturbance and complete typed machinery transfer are disabled by default. Binding,
nonchemical light input, multiple-substrate reactions and variable genome structure remain deferred.
Retired chemistry flags and checkpoints must fail explicitly; do not preserve a second economy.
The [runtime numerical record](docs/design/chemistry/numerical-engine.md) and
[migration dispositions](docs/design/chemistry/numerical-migration.md) describe the sole Rust/WASM
kernel, worker rendering and prior evidence migration. The computational foundation governs
new formula selection and the root plan tracks its integration. Older TypeScript implementation records are history.

Automatic recovery retains six automatic and two manual compressed IndexedDB saves, within 256 MiB.
Checkpoints retain bounded spatial/chart history and complete organism parentage in compact numeric records.
Execution pauses visibly at memory/storage limits; ancestry defaults to a two-million-record limit.
See [continuing observation](docs/continuing-observation.md) for measurements and remaining browser
limits. These provisions do not assure uninterrupted days/weeks operation or enduring ecology.

The implementer owns numerical methods, resolution, optimization and tuning within the stated
digital-chemistry and ecological semantics. Reason from the intended behavior, validate tradeoffs,
and deliver a usable system at a minimum of 30 ticks/second; do not turn ordinary engineering
choices into user approval gates. Preserve measured negative findings and state operating limits.
The user already keeps a development server running. Inspect startup configuration and headless
evidence; browser operational checks require a registered purpose and use an isolated session on
the existing server. Do not start another server. Seed/fertilize,
outcrossing and environmental developmental reaction norms remain deferred.

The [documentation snapshot](docs/sources/history/README.md) preserves prior contracts and full
experiment records. The ant implementation is recoverable from commit `780fa4e`, tag
`ant-colony-checkpoint-2026-09-09`. Its construction, 2,000-worker gate and canceled training
campaigns are history, not bacterial prerequisites. Do not restore old schemas or work orders.
Current generated experiment dumps remain local (`frontend/harness/artifacts/` is ignored); the
ledger preserves named measurements, and a report a study document links to is copied into
`docs/evidence/`.

The founder retains construction feedstock until storage is nearly full and has a membrane
compatible with its main retained metabolic product. These are mutable starting alleles, not
physical exemptions. [Numerical probes](docs/design/chemistry/numerical-results.md) establish supplied
funded reproduction and empty-source exhaustion; they do not establish sustained diversity or adaptation.

## Experiment operating policy

Model resource budgets before using runs to discover them. The
[resource-economy command and derivation](docs/design/chemistry/resource-economy.md) calculate
delivery limits, maintenance, reaction/assembly/repair, source turnover and conditional
machinery returns without advancing ticks. Use those predictions to choose bounded checks;
positive calculated surplus is not proof of controller expression or evolved benefit.

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
The earlier [registration and results](docs/quick-food-access-study.md) remain historical; new
chemical runs use schema v3 and the numerical-engine registration. Diagnostic genomes do not
automatically replace browser founders, and constructed behavior is not evolved discovery.

The six-area [capability study](docs/capability-investigation.md) extends the same runner with
funded body fixtures, saved-genotype interventions and ancestry-grouped resource/exposure traces.
`pnpm harness capabilities --case list` lists short screens; add `--stage followup` to list the
saved-genotype comparisons. A named case runs both placements, normally 1,500 ticks, with a strict
3,000-tick ceiling. Do not run every listed case by default. `capability-pilots` is a separately
registered four-pilot command, not a quick smoke test. `python3 harness/capability_report.py` reads
the completed study without advancing simulation. Keep physical opportunity, controller expression,
accessible variation and actual evolved exploitation separate in future reports. Follow-ups require
explicit current-schema checkpoint/candidate inputs. Old campaign outcomes and default input paths
must not become new chemical evidence. The [work order](docs/design/README.md) governs current work.

Rust and Vitest check bounded invariants, including observers not changing simulation state. Headless
assays measure behavior; human review judges visible motion. Inspect browser startup configuration
rather than launching browser simulations. Run `make ci` after code changes, but do not repeat
expensive ecological panels merely for formatting or documentation changes.

## Critical rules

- The [data-sharing contract](docs/design/chemistry/data-ownership.md) is immutable without an
  explicit user decision. Rust owns physical state; the same worker renders borrowed WASM views.
  Never serialize/copy full fields or population/private-state frames for rendering. Preserve
  scalar stepping, bounded revisioned observations and backpressure when adding diagnostics.
  CI ownership tests and runtime guards must remain enabled; a feature is not an exception.
- The top-down periodic XY plane is the only runtime substrate. Do not add a spatial depth coordinate, a
  compatibility mode, an old-checkpoint adapter, or a second renderer. Recover the retired system
  from the annotated tag if historical code is needed.
- Author physical pressures and local carriers. Controllers receive thirty-nine local chemical,
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
- Use Rust/WASM, pnpm, TypeScript, React, worker WebGL2, Rust tests and Vitest. ESLint limits complexity to 10, files to 400
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
| `engine/src/` | Sole Rust kernel: bodies, fields, local RNN, resource economy, inheritance and binary state |
| `frontend/src/engine/` | WASM client, worker, WebGL2, React observation and recovery |
| `frontend/src/persist/`, `frontend/src/ui/pacing.ts` | Local identity, retention policy and bounded pacing only |
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
| `cd frontend && pnpm harness bacteria-capacity` | Fixed 48/2000/2000-growth loads with census, inspection and render preparation |
| `cd frontend && pnpm harness rps --case pairwise` | Constructed chemical production/compatibility contests |
| `cd frontend && pnpm harness zones --case three-way --shares 1,0` | Constructed machinery-allocation contests in source-mixture worlds |
| `cd frontend && pnpm harness evolve --world zones --seed 101 --justification REGISTRATION` | De novo evolution with trait samples and checkpoints |
| `cd frontend && pnpm harness invasion --checkpoint path` | Rare-start comparisons of descriptive current-checkpoint clusters |
| `cd frontend && pnpm harness recent`             | Read recent ledger rows                                                  |
| `cd frontend && pnpm harness sql "..."`          | Query the measurement ledger                                             |
| `cd frontend && pnpm run dev`                    | Local server, only when explicitly requested                             |
