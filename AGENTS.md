# Agent Guide

Antropy is a browser-based 2D artificial-life simulation built as a Vite, React, TypeScript, and
worker WebGL2 SPA with a Rust/WASM physical kernel and deployed on the Ahara platform.

## Primary design constraint: shared mathematics and few controls

This applies to proposals as well as implementation. Build behavior from a small set of
fundamental parameters and shared, tractable vector operations. Extend the established
mathematical architecture before inventing a mechanism for an individual feature. A collection
of special-case rules does not become a shared model merely by putting it in one helper or
writing it in vector notation.

- Start with the common state, governing operation and existing parameters. Explain how the
  requested behavior follows from their composition, including bounds, ownership and cost.
- Do not default to feature-specific probabilities, scales, branches, thresholds or tunable
  mixtures for sources, climate, individual chemicals, machinery slots or gene categories.
  A new independent control needs a reason the shared rule cannot express the required behavior.
- Where quantities have different domains, use explicit representation transforms derived from
  those domains. Do not hide separately tuned behavior in per-category normalization constants.
- Prefer one algebraic update across the relevant vectors. Preserve sparse work elimination,
  immutable sharing and funded physical consequences; measure cost instead of assuming that
  vector notation guarantees speed.
- For mutation, propose a common distribution and operator over gene values before separate
  mutation laws for controllers, bodies, enzymes or transporters. Rare large changes should
  follow from that shared law rather than a special waste-consumer mutation path.

Current mathematical direction: the [transformation algebra white paper](docs/design/chemistry/transformation-algebra.md)
records the group-theoretic requirement and its completion evidence. Physical v27 retains
the selected finite action `(S16 × S16) semidirect C2` on actual discrete identities. Enzymes
compile smooth mixtures of at most eight exact actions; these irreversible mixtures are not
group elements. D4 is the geometry-preserving subgroup, not the whole catalytic repertoire.
The canonical plan's A0 derivation and A1–A4 evidence own the selected law and measured limits.
Pre-projection composition, rotated fixtures or cost corrections alone cannot justify completion.
The [enzyme correction and omission audit](docs/symmetry-completion-audit.md) retains prior evidence.
Use the single [canonical mathematical plan](MATHEMATICAL-SYMMETRY-PLAN.md#regenerative-ecosystem-implementation),
root `555cf223-16f7-4e8b-a10a-7160dbdeead2`, phases R0–R4. Old M0–M6 instructions are
historical. A0–A5 are complete; the user accepts deployed v23 through 100,000 ticks.
The current correction adds nonuniform potential basins, recognition-independent reflection
centers, specificity-radius-scaled common mutation and explicitly funded environmental returns. Group
membership alone does not establish accessible mutations, paid cycles or evolved recycling.
Keep environmental plans separate. The [viewport UI pass](UI-OBSERVATION-PLAN.md) reorganizes
observation before future phenotype work; it does not change the simulation.
Do not replace a requested transformation change with a cost-only correction, or treat a
founder-preservation clause authored in a plan as permission to omit the user's requirement.
Trace completion claims back to the request, including defaults and ordinary live consumers.
Preserve the established mathematical foundation. The seed27 run is a positive evolutionary
result whose observations remain useful after the microclimate correction; explaining every
phenotype's advantage is not a prerequisite for proceeding. Retain open questions in the
[hypothesis log](docs/hypothesis-log.md); future phenotype legibility belongs in the UI work.

## Read first

| Topic                  | Link                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| Governing principles   | [docs/principles.md](docs/principles.md)                                         |
| Current work order     | [docs/design/README.md](docs/design/README.md)                                   |
| Current runtime contract | [docs/design/bacteria.md](docs/design/bacteria.md) |
| Current evolutionary contract | [docs/design/funded-bodies.md](docs/design/funded-bodies.md) |
| Current measurements | [Environmental evidence](docs/design/chemistry/environmental-results.md), [rebuild evidence](docs/design/chemistry/rebuild-results.md) |
| Historical ant certification | [docs/certifications.md](docs/certifications.md) |
| Documentation index    | [docs/README.md](docs/README.md)                                                 |
| Source archive         | [docs/sources/README.md](docs/sources/README.md)                                 |
| Architecture decisions | [docs/adr/README.md](docs/adr/README.md)                                         |
| Platform integration   | [../ahara/INTEGRATION.md](../ahara/INTEGRATION.md)                               |
| Ahara standards        | [../ahara-standards/standards/README.md](../ahara-standards/standards/README.md) |

## Governing mathematical direction

**Shared attraction, September 19, 2026.** Physical v28 adds `attractionLength=6` to the
existing geographic response. One periodic, normalized scalar convolution of current
dissolved, source and body attraction drives all three mechanical consumers. Local
repulsion, nonlinear pressure, raw chemical exposure and release footprints remain.
No fixed wells or cluster identities are introduced. The
[binding plan](docs/design/resource-binding-proposal.md) owns bounded results and remaining
human motion review. Derived buffers are Rust-owned and omitted from checkpoints.

The browser default world seed is27 (`Engine.create`), distinct from chemistry seed101.
Validation of a default-run report must use the actual browser seed and reported failure window.
The initial v25 chemical mutation scale used full domain width15; the extinction investigation
replaces that unit with existing specificity radiusR, retaining the heavy-tail law and event rate.
Do not claim a600tick startup certifies later viability, or undo rare large mutations to hide a failure.

**Chemical geometry correction, September 18, 2026.** Definition v5 removes the privileged
potential slope while retaining smoothness/coverage and unchanged other physical surfaces.
Physical v27 retains separate enzyme recognition/action and shared impedance pressure
in field, reservoir and cell motion. It subtracts finite owners' actual self-load and applies
one pressure strength χ=.003. Shared environmental work ε=119.31341917861687 funds accepted
cellular and abiotic conversions through the same local profile contraction; abiotic branches
must afford their potential increase. It rejects earlier checkpoints. Preserve sparse bounded
operations and explicit accounts. The world remains open; there is no finite environmental
battery. The [current runtime](docs/design/chemistry/composed-runtime.md) and canonical R0–R4
plan govern these changes. Earlier acceptance and measurements remain version-specific.

**Exact chemical actions, September 18, 2026.** Physical checkpoint v23 replaces reflected
product projection with exact bounded interval permutations and quarter turns. Existing five
enzyme parameters select their continuous kinetic mixture; orientation no longer means a
projected arbitrary-angle rigid rotation. Weathering uses adjacent coordinate exchanges from
the same group with its existing local-medium rates. Ordinary reactions, atlas and economy
use one compiler; inheritance preserves installed identity and paid refitting. Mutation
constants, mesh2, material accounts and borrowed rendering remain unchanged. The
[canonical results](MATHEMATICAL-SYMMETRY-PLAN.md#a4-results) measure startup376ticks/s and
saturated capacity43.54/21.38/16.03ticks/s. The latter two remain below30ticks/s; matching
baseline does not meet that target. A5 human review passed on the deployed v23 run; the user
reports real differentiation and acceptable speed through 100,000 ticks. Old saves fail
explicitly; no compatibility adapter or alternative economy is added.

**Enzyme transformations, September 18, 2026.** Checkpoint v22 adds inherited rotation to
the compiled reflected translation map, periodic heavy-tail angle mutation and paid angular
refitting. Founder enzymes share one midpoint-derived displacement; export transporters follow
their separate product centers. They no longer individually target the same chemical.
The [omission audit](docs/symmetry-completion-audit.md) owns validation and remaining limitations.

**Shared transformations, September 18, 2026.** That stage introduced checkpoint v21 and rejected older
physical saves. Geographic drift uses Euclidean magnitude. Chemical recognition/refit use one
Euclidean metric; catalytic attenuation prices compiled reflected products. Weathering gives each
distinct adjacent destination one rate. Consuming reactions share frozen work before donor allocation;
productive reactions cannot be vetoed by an unfunded consuming request. Refit slots advance independently
subject to shared work. Chemical mutation uses isotropic vector events with preserved heavy-tail
magnitudes and event opportunities; scalar neural/body mutation is unchanged. No controls, field
resolution or observation ownership changed. The [plan](MATHEMATICAL-SYMMETRY-PLAN.md) owns
matched costs and retained asymmetries; human motion acceptance remains pending.

**Bound material, September 17, 2026.** That stage introduced checkpoint v20. Each cell owns a chemical
mixture whose mass funds its fifteen body stocks. Growth transfers inventory identity into this
mixture; repair exchanges frozen mixtures; division splits it and death returns it unchanged.
Assembly/repair pay work without chemical conversion. The [bound-material record](docs/bound-material.md)
owns accounting and bounded measurements. Initial founders retain their declared material;
descendants never reset to the founder's decomposition species. Preserve this through all fixtures,
diagnostics, checkpoints and live consumers. No new genes or environmental controls accompany it.

**Physical coupling correction, September 17, 2026.** That stage introduced checkpoint v19. Repair expense
scales with funded mass, reproductive reserves with actual capacities, and motor work with squared
velocity effort. Empty slots do not delay paid refitting. The [correction record](docs/physical-coupling-correction.md)
owns formulas, renamed reserve settings and bounded verification; the v18 audit remains historical.
No new chemical efficiency gene, environmental retuning or mutation change accompanies these fixes.

**Local weathering revision, September 17, 2026.** That stage introduced checkpoint v18. Weathering
depends on positive local chemical interaction differences through the existing shared profiles;
neutral medium does not convert. The independent geographic weather clock is removed. The
common extracellular concentration floor is 1e-9; tiny owned reservoir/cell stocks are retained.
The [weathering expansion](ENVIRONMENTAL-ECOLOGY-PLAN.md#weathering-redesign) records causal
and numerical/cost comparisons. Do not equate weathering's role with a particular formula or
require evolved shelter specialists to justify environmental chemistry. Human review remains open.

**Ecology composition repair, September 17, 2026 (v17 evidence).** Reservoirs
contribute to and sample the shared medium; retained inventory and extracellular material use
one compiled neighbor-conversion operator. Diffusion does not determine reactivity. Existing
reference values prevent unfunded uphill conversion; their magnitudes do not rank reaction rates.
Source material projections and geographic kernels have separate lifetimes. The existing local
concentration floor bounds conversion work and final extracellular products; owned tiny source
stocks are retained. Defaults are sourceDrift4/sourceProcessing0.25/sourceGap2400, full mesh2.
The [current runtime](docs/design/chemistry/composed-runtime.md) specifies these rules;
the [correction plan](ENVIRONMENTAL-ECOLOGY-PLAN.md#ecology-correction) records verification.
Earlier v14–v16 measurements below retain their original meaning. Human review remains pending.

**Mobile reservoirs, September 16, 2026.** The [source plan](MOBILE-SOURCES-PLAN.md) adds
medium-driven drift and downhill processing of released material. That stage introduced v15.
Its defaults were sourceDrift4/sourceProcessing4, selected through six
1,500-tick comparisons and bounded confirmations. [Source evidence](docs/design/chemistry/mobile-source-results.md)
records the short horizon and limits. External renewal continues indefinitely; finite deposits
do not constitute a closed system. No sun or usable-work grant has been added. Preserve local
footprint processing, full mesh2 and the borrowed worker rendering boundary. Human motion
review remains pending independently of these physical and operating checks.

**Environmental extension, September 16, 2026.** The
[environmental plan](ENVIRONMENTAL-ECOLOGY-PLAN.md) adds smooth geographic weathering,
conservative extracellular conversion and impedance-mediated shelter to ordinary World.
That extension introduced checkpoint v14. Full mesh2, active chemical groups and borrowed worker rendering
remain. The [environmental record](docs/design/chemistry/environmental-results.md) contains
selected artificial laws, paid short comparisons, negative barrier findings and operating
limits. M0–M3 are complete: both seed27 arms went extinct; both seed101 arms stopped safely
at the registered archive limit and retain incomplete horizons. The selected genotype had
no shelter-specific construction advantage. M4's human visual review remains pending.
Do not tune rates or expand seeds/horizons to obtain a preferred ecological result. Human
review of this changed environment is separate from the earlier rebuild acceptance.

**Fresh core implementation, September 15, 2026.** The removed executors and separate
candidate have been replaced with one new production World. The
[composed runtime](docs/design/chemistry/composed-runtime.md) and
[rebuild work order](DIGITAL-CHEMISTRY-PLAN.md) supersede the numerical formulas,
schema and implementation-status claims below. That rebuild introduced checkpoint v13;
enzyme offsets and actual installed coordinates are continuous, and transport direction
comes from signed neural effort. Native/WASM builds,69 Rust and56 Vitest checks pass. Bounded
opportunity, cold recovery and isolated browser rendering/save/fault checks are recorded.
The user accepts the performance correction and passes the initial visual review at mesh2;
M0–M3 and the rebuild plan are complete. The user's subsequent unattended run crashed;
the [follow-up repair](LONG-RUN-RELIABILITY-PLAN.md) addresses reproduced React development
timing retention. Initial acceptance makes no endurance or adaptation claim.
The200ticks/s high-population target remains deferred.
The subsequent processing-threshold correction restores default mesh2 and skips empty
chemical groups and numerical tails below1e-24 concentration. The h2 default600-tick run
measures372ticks/s versus62 with the dense solver. Saturated2,000-growth remains below
30ticks/s at23.4; see the current rebuild results for matched measurements and limits.
New worlds default to seed27 for centered review; the independent chemistry seed remains101.
Do not restore removed implementations or resume historical M0–M8 integration steps.
The earlier runtime descriptions remain evidence; ecological and ownership requirements
still govern the new implementation.

[Computable chemistry](docs/design/chemistry/computational-foundation.md) and
[ADR 0022](docs/adr/0022-computable-chemistry.md) govern the current redesign. Design artificial
rules for composed operations over the 16×16 chemical manifold: shared reductions, geographic
vector fields, diffusion plus drift, local recognition and bounded product mappings. Physics
supplies language, not required equations. Select rules, accounts, bounds and measured cost
together; optimizing a conventional physical solver after selecting it is insufficient.
Preserve discrete chemicals, genome/RNN cells, funded capabilities, explicit material/work
accounts and immutable sharing. The earlier M0 equations and canceled M2 expansion are reference
records. The removed M0/M1 candidate's 7.17/15.73 ms core measurements remain historical
evidence. They do not establish replacement performance. The new World step owns the complete
production lifecycle; do not replay historical M0/M1 step files.

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
four receptors/transporters/unary enzymes each, a membrane coordinate and physical checkpoint v27.
[Digital chemistry](docs/design/chemistry/README.md) replaces A/B processing, named toxins,
matrix binding, automatic catabolism, sharing, prey yield and the carbon/oxygen cycle.
A persisted smooth 16 × 16 chemical manifold supplies potential, diffusion, impedance and stress.
Finite sources, paid transport/reactions, generic biomass, washout and death close the resource books.
Cellular, extracellular and reservoir conversion share accounted local external work;
abiotic conversion dissipates the supplied work plus potential drop. Geographic
activity and chemical impedance set exposure; controllers see resulting local chemistry only.
Chemical definition version 5 adds multidirectional potential basins to the shared-profile and
joint diffusion/impedance coverage. The compiler serves live installed machinery and the atlas. World stepping uses the
composed artificial rules linked above. Inherited target changes
retain installed machinery identity until paid refitting; birth never grants replacement stock.

Physical and behavioral mutation occur at local resource-funded reproduction; acquired recurrent
changes can transmit into offspring chromosomes. The default is 320 × 240 units, viscosity 0.004,
48 unequal mobile renewing reservoirs and two colonies. New [measurements](docs/design/chemistry/rebuild-results.md)
contain constructed opportunities and negative findings, not evolved-community certification.
Historical A/B studies and their [corrected analysis](docs/analysis-correction.md) retain their
original meaning and do not establish current chemical behavior.

There is one periodic XY world. Production controllers receive local chemistry/body facts and
private memory, with no coordinates, compass, pathfinding, lineage identity or reproductive score.
No fallback controller, task dispatcher, offline optimizer or central parent selector runs in the
population. The task byte remains opaque. Genotypes are immutable; acquired experience belongs to
individuals until explicit birth-local assimilation.

Run starts seed 27, paused at tick zero, with 48 cells across four mutable founder genotypes
for0→128→136→8→0, six of each in each of two separated resource neighborhoods.
Reservoirs renew0/136; finite initial8/128 priming enters initial accounts. Most opportunities
start unoccupied. New default worlds must
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

The four founders start with input-centered membranes, mild product export, repair and reduced
swimming. Their free and bound material starts54.3698% input and45.6302% product. These are
mutable starting alleles and finite initial material, not physical exemptions.
[Numerical probes](docs/design/chemistry/numerical-results.md) establish supplied
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
