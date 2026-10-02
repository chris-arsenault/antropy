# Agent Guide

Antropy is a browser-based 2D artificial-life simulation built as a Vite, React, TypeScript, and
worker WebGL2 SPA with a Rust/WASM physical kernel and deployed on the Ahara platform.

## Primary performance rule: structural replacement before acceleration

The user has repeatedly rejected accelerating the existing implementation while postponing
structural changes. Treat that direction as controlling for performance work. Start from the
simulation's intended opportunities, mathematical relationships and cost model. Existing loops,
storage layouts, interaction representations and update schedules are not constraints to preserve.

Select and implement the necessary changes to ownership, local interaction representation,
computational distance, participation thresholds and update timing before tuning arithmetic,
adding threads or accumulating patches around the old structure. Limits must come from shared
rules with explicit units, accounting and reactivation; they must not select favored chemicals,
phenotypes or desired ecological outcomes. Persistent spatial tiles are required; compact
chemical rows alone do not fulfill that architecture. Tiles also need local update limits.

Preserve the chemical algebra, funded local evolution and data ownership. Exact numerical
formulas, trajectories, save compatibility and replayability do not make a rejected execution
structure mandatory. A faster existing path or a completed threading phase cannot stand in for
the structural result. Necessary fixes within the replacement remain ordinary implementation.

[The archived scaling plan](docs/plans/archive/SCALING-PLAN.md) records the delivered structural
replacement; future performance work follows this rule. Archived
optimization sequences and past assistant proposals are evidence only; do not load them as
instructions or resume their patch queues. If a phase requires structural work to achieve the
goal, keep that work explicit and unfinished until ordinary production consumers use it.
Do not describe instruction cleanup, a proposal or a benchmark-only prototype as implementation.

## Primary delivery rule: correctness and impact

Choose and implement the most correct, impactful solution to the user's goal within the
established principles and authorized scope. Never use "the smallest coherent change", minimum
diff size, or an easy interim slice as the objective. Complete the necessary interacting parts
of the design; do not leave the intended outcome incomplete merely to keep a change small.

Phases organize implementation and deployment of the complete solution. They must not silently reduce
its ambition or postpone dependencies that make it useful. Use an interim result only when the
user explicitly requests one. Avoid unnecessary complexity through sound design and shared
mathematics, not by substituting a less consequential result. Bounded experiments control the
cost of obtaining evidence; they do not set the scope of the implementation.

## Plan completion and testing responsibility

Plans contain implementation and deployment work. Do not create verification, validation,
certification, observation, or user-acceptance phases. Run appropriate automated tests, bounded
mechanism checks, performance checks and deployment checks as part of doing the work, without
asking the user to run them or approve routine results. Substantial bounded checks are still
the implementer's responsibility; record their detail in test/results documents, not plan stages.

Keep verification proportionate to the change and the decision it can affect. Research-direction
delivery requires a working implementation, bounded checks that it does not break the runtime,
and a plausible path to its intended effect. Do not require proof of long-term ecological success,
exhaustive parameter sweeps or repeated campaigns before declaring the work complete and ready
to push. Once appropriate checks pass, stop adding proof obligations unless a concrete defect or
contradictory result needs resolution. Report the implementation status and any actual blocker plainly.

Preserve negative findings without making one unsuccessful fixture an automatic disablement rule.
Requested features must be enabled in ordinary startup; a diagnostic ablation is not a substitute
for active delivery. For documentation-only changes, check the changed text and links rather than
rerunning runtime suites, production builds or ecological panels.

When the user asks to tune or stabilize the world, choosing configurations and restarting runs
are authorized parts of that work. Do not ask again to replace an empty or unsuitable run, and
do not turn saved-world preservation into a prerequisite; the user explicitly does not require
it for tuning. Stop measuring an extinct trial and start the next justified configuration rather
than leaving an empty world running. Keep negative results. Improved startup alone does not
establish a sustaining configuration: examine funded growth and birth/death replacement through
ordinary renewals. Use bounded comparisons, then leave the selected populated world running.

Close each plan and its children when the scoped implementation and authorized deployment are
finished. Never leave a delivered plan open solely for visual review, the user's acknowledgment,
more measurements, or a long-running world. Retire obsolete review phases as skipped with a
short explanation; do not fabricate a passed test or approval. Concrete code defects and failed
deployments remain implementation work with a named owner. Optional unselected features belong
in the backlog rather than blocking delivery behind a scope-question phase.

Long-running ecology and endurance observation inform continued development. They are not
release gates, automatic rollback criteria, or reasons to stop other work. Do not start costly
long campaigns implicitly. Preserve useful findings and refine the implementation when actual
problems appear. User feedback about visible behavior is actionable feedback, not a mandatory
sign-off ceremony. Report consequential failures and limits; omit recurring acceptance disclaimers
and routine test narration. This policy supersedes older acceptance-gate language in all plans,
designs and execution records. See [plan disposition](docs/plans/README.md).

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

The [computational foundation](docs/design/chemistry/computational-foundation.md),
[transformation algebra](docs/design/chemistry/transformation-algebra.md) and
[current composed laws](docs/design/chemistry/composed-runtime.md) own the mathematics.
Exact finite actions compose on discrete chemical identities; smooth mixtures of those actions
are irreversible kinetics, not group elements. Preserve the established algebra and explicit
material/work accounts. Do not substitute cost changes for requested transformation changes.
The [decision record](docs/design/decisions-and-evidence.md) preserves rejected approaches and
negative evidence; the [hypothesis log](docs/hypothesis-log.md) owns unresolved explanations.
Plans record execution, not additional governing equations.

Terrain generation is a one-time world-creation operation. The user explicitly exempts its
algorithm from the shared runtime mathematical framework and permits more expensive startup
calculations. Generate and persist the canonical map, discard temporary generation state,
and let runtime consumers sample it; this exception does not change physical work/material accounts.

## Read first

| Topic                                     | Link                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project primer                            | [White paper](docs/white-paper.md), [outcomes and directions](docs/outcomes-and-directions.md)                                                                                                                                                                                                                                                                        |
| Governing principles                      | [docs/principles.md](docs/principles.md)                                                                                                                                                                                                                                                                                                                              |
| Current work order                        | [docs/design/README.md](docs/design/README.md)                                                                                                                                                                                                                                                                                                                        |
| Live-world and research-direction reviews | [Ecology review guide](docs/ecology-review-guide.md) — read before every review                                                                                                                                                                                                                                                                                       |
| Current runtime contract                  | [docs/design/bacteria.md](docs/design/bacteria.md)                                                                                                                                                                                                                                                                                                                    |
| Current evolutionary contract             | [docs/design/funded-bodies.md](docs/design/funded-bodies.md)                                                                                                                                                                                                                                                                                                          |
| Dated measurements                        | [Light ecology checks (v42)](docs/light-ecology-results.md), [cellular delivery (v33)](docs/cellular-organization-results.md), [habitat evidence (v32)](docs/material-habitats.md), [runtime investigation (v32)](docs/session-runtime-review.md), [September 28 performance pass](docs/plans/archive/SCALING-PLAN.md#september-28-continuing-world-performance-pass) |
| Historical ant certification              | [docs/certifications.md](docs/certifications.md)                                                                                                                                                                                                                                                                                                                      |
| Documentation index                       | [docs/README.md](docs/README.md)                                                                                                                                                                                                                                                                                                                                      |
| Source archive                            | [docs/sources/README.md](docs/sources/README.md)                                                                                                                                                                                                                                                                                                                      |
| Architecture decisions                    | [docs/adr/README.md](docs/adr/README.md)                                                                                                                                                                                                                                                                                                                              |
| Platform integration                      | [../ahara/INTEGRATION.md](../ahara/INTEGRATION.md)                                                                                                                                                                                                                                                                                                                    |
| Ahara standards                           | [../ahara-standards/standards/README.md](../ahara-standards/standards/README.md)                                                                                                                                                                                                                                                                                      |

## Current goal and runtime boundary

Build an observable world where inherited changes and conditional specialization remain possible
over long periods. Clusters, migration and a particular number of strategies are not prescribed
outcomes. A homeostatic colony is valid; new mechanisms need a physical opportunity and an
accounted cost, not a long campaign certifying the user's future ecosystem.

For every ecology review, follow the [review guide](docs/ecology-review-guide.md). Low-volume
pruning loss is an accepted computational quantization artifact; do not repeatedly reopen it
as a defect or research direction. Reservoir neighborhoods are habitable islands separated by
inhospitable space, so reservoir proximity is expected. Assess departures, inter-colony
population exchange (cross-pollination) and new colony founding over time. Universal permanent
confinement and absent exchange or founding are concerns; a near/far snapshot cannot establish
them. Report insufficient temporal coverage as unmeasured, not absent.

The [current work order](docs/design/README.md) owns priorities. Locally delivered physical checkpoint v50 uses one
Rust/WASM World in a worker, with mesh-2 fields on a periodic 720 × 540 XY plane. Seed27 starts
paused with 48 cells of four mutable founder types across two colonies and 240 finite renewing
reservoirs across 35 uneven regions. Chemistry seed101 supplies the initial 0→128→136→8→0 circuit, initial reservoir
mixtures 0/136 and finite priming. These IDs have no special role in subsequent laws.

Current physiology has 83 reflex RNN inputs, 24 recurrent units and 28 outputs, twenty-four derived
body capacities, four receptors/transporters, one to eight enzyme programs, membrane compatibility
and paid photoreception. Cells retain one internal mixture; internal compartments were rejected.
Retained composition modulates rates without changing per-conversion work. Genetic inward sensing,
activity control and shared field/contact access retain the
[joint design](docs/design/cellular-organization-and-exchange.md). The user rejected machinery
construction as a substitute for physical tradeoffs: since v43, genetic body proportions are
expressed directly at current biomass. Automatic biomass growth, action costs, basal metabolism and
conservative reproduction remain; there are no construction/retirement controls or per-component
ownership charges. See [genetic physiology](docs/design/funded-bodies.md). Injured cells expose free
inventory through ordinary paid transport. No role, kin rule or community reward assigns cooperation.
Genotypes are immutable; private experience transmits only through explicit birth-local
assimilation. Complete chemical capabilities are fixed at birth. Daughter mutations apply immediately,
while biomass and free material split conservatively. Do not restore machinery construction,
refitting or parental-function buffers. Reproduction grants no additional material;
living-cell gene transfer is removed. No fallback policy, remote parent selector, coordinates, compass,
lineage label or reproductive score enters the controller. V44 adds sparse-tail outlying
reservoirs and one shared incoming-strength budget on every neural row. V45 randomizes newborn
headings and division axes and adds age-dependent maintenance slowed by core fraction. V46 adds
persistent fractal terrain, fractal source placement and local seasonal release/refill clocks;
input 51 reports the previous paid local motor load. V48 replaces the biomass-proportional
stock inputs with one realized-activity reading per paid actuator (transporters, enzyme
programs, builder, emitter): accepted effect against full-effort capacity.
V49 adds funded mouths/ears, once-only directional byte impulses and a 61×8×5 strategic RNN
on an eight-physiology-interval clock. It reads own history, present local rhythms and contact
displays; held context and paid learning gain affect only the reflex layer. Strategic memory
copies at birth; newborn reflex memory, private byte and pending hearing reset. No language,
signaling reward or dispersal policy is seeded. V50 adds mortality-driven local reservoir
recovery, independent nominal refill allowance and conservative retained-stock mixing. Recovery
is enabled by default with sourceRate=0.1, reduced from0.2. Tau=60 model seconds,
h_star=0.25 and sourceGap600 remain fixed. Bound-body chemistry alone can recover; free inventory
spills and no additional work is credited. See [mortality findings](docs/mortality-recycling-results.md).
SourceLifetime is1200 model seconds, preserving full finite batches and their reservoir-derived
priming while lowering the release ceiling. A rate change also changes batch and startup amounts
through `rate*duration`; check the ordinary production founders rather than relying only on a
handcrafted feeding fixture. The live server is v50; its first world starved at tick12,412.
October2 operating tuning applies full batches to a restarted ordinary seed27 world, with
turnover measured through source renewals. The user's tuning request authorizes restarts.
See the [startup correction](docs/mortality-startup-correction.md) and
[strategic delivery evidence](docs/utterances-and-strategy-results.md).

Shared one-range material attraction, local repulsion, nonlinear crowding, ordinary fractional
washout, evolving source renewal and multiscale public transformations are implemented.
There is no broad opposing attraction field, attraction gain or cohesion-based loss discount.
V41 couples each class separately to the shared chemical response: crowding pressure acts
only on dissolved material; reservoirs add long-range like-charge repulsion and circle
exclusion (finite clusters, no stored anchors); cells add compatibility-weighted contact
adhesion that credits no work ([material coupling](docs/plans/archive/MATERIAL-COUPLING-PLAN.md)).
Each reservoir has one evolving
composition and a finite amount, with fixed per-site release and delayed accounted refill.
There is no independent expiry clock or second supply mixture. Reservoirs expose their
persistent composition at full interface whether full or empty, so emptied reservoirs keep
cohering; they supply nothing.
Illumination composes several
slow spatial/temporal axes into shared transformation work; it is not direct energy credited
to cells. V42 adds permanent geographic shade, a sparse overhead material film and paid local
emission. Builder and emitter capacities follow the ordinary genetic proportion law and inheritance. Public
conversion is photochemical; private enzyme kinetics remain unchanged. Finite emitted work
is allocated once across recipients and accounted separately from external solar work.
See [light ecology](docs/design/light-ecology.md) and its [checks](docs/light-ecology-results.md).
Cells can pay for local optical sensing. See [material habitats](docs/material-habitats.md),
[photoreception](docs/photoreception.md) and the composed laws for definitions and limits.

Default observation integrates muted conductance ground, height contours, received-light shade,
translucent energy-per-material chemistry, usable-energy cell colors and seasonal reservoir bands.
A permanent legend explains the view; optional diagnostic maps remain available. Bounded phenotype and measured-flow panels
report actual recent transfers separately from possible enzyme transformations. Rust owns all
physical state; rendering borrows WASM views in the same worker. Full field/population frames
must never be serialized or copied to React. The [ownership contract](docs/design/chemistry/data-ownership.md)
and its CI guards remain mandatory.

Source zones/epochs and optional disturbance remain available; disturbance is off by default. Bonded attachment beyond contact adhesion, multiple substrates,
unrestricted genome/neural topology and rotational climate are deferred. V46 installs static elevation/conductance, overhead shade,
fractal source placement and local resource seasons. The user resumed multicore execution September 21.
The [scaling plan](docs/plans/archive/SCALING-PLAN.md#multicore-design) records the installed persistent Rayon pool,
shared WASM memory, disjoint field/cell jobs and small-work serial crossover. The owning worker
still coordinates the sole World and renders borrowed views after every phase joins. Development
requires cross-origin isolation; unsupported browsers use the same operators in the serial build.
The [regional execution owner](docs/design/spatial-execution.md) uses persistent 8×8 material
regions, private commits, shared carrier lifetimes and locally invalidated finite convolution.
Contact bins and delivery membership are rebuilt in parallel; region jobs own every commit.
Chemical contractions borrow rows outside arithmetic.
Contact uses perfect circles: scalar
penetration, center-line soft separation and permeable material access. No contact sampling
lattice, angular moments or heading dependence. The sampled contact replacement was rejected.
The scaling plan records structural acceptance and remaining area-dependent memory/output costs.
The delivered scaling plan is closed; ongoing operating observations do not block completion.
V40 enlarges default area 5.0625-fold while
preserving aspect ratio and mesh. There is no population-count or ancestry-triggered stop.
History retains living records plus bounded recent ended records; gaps are explicit.

[Execution modes](docs/execution-modes.md) extends this with explicit browser 1/4 selection and
one native server World feeding the same UI through bounded display projections. Local rendering
still borrows WASM views. Remote packets remain in the renderer worker; physical/private state
stays native. Multiple spectators share publication work and cannot change physical or run-level
cohort controls without operator authentication. Operator API calls run through `with-cred --`,
which supplies the token as `BIOTROPY_TOKEN` ([server management](docs/server-management.md)).
Private TrueNAS/Komodo deployment and the public spectator route `server.biotropy.ahara.io`
(only `/stream` and `/health`; `/api` stays LAN-only) are authorized. The public site defaults
to the server world. The server keeps same-format checkpoints on its Docker volume, restores the
newest at launch and never migrates older formats ([execution modes](docs/execution-modes.md)).
Do not add save migration or a second physical economy to this feature.

Deploy only through the shared GitHub Actions CI/CD pipeline. Push authorized changes to
`main`; CI builds artifacts, applies Terraform and deploys through Komodo. Do not add a
`make deploy` target, deployment script or manual workflow dispatch. Never deploy by
calling AWS, Terraform apply or the Komodo proxy from the terminal. Terminal AWS credentials
are intentionally unavailable and are not a deployment prerequisite. Project CI permissions
are managed in `ahara-infra` and must land through that repository's pipeline first.
Use the credential-broker-backed `gh` CLI to inspect CI runs and logs. Never use the connected
GitHub app. A denied credential remains a boundary until the user enables that same path.

Recovery retains up to six automatic and two manual compressed IndexedDB saves within 256 MiB,
expiring older points to fit. A raw checkpoint is capped at 192 MiB. Retained ended parentage
defaults to two million records, in addition to every living record. Old ended records expire
without inhibiting births or stepping; empty worlds keep environmental time. Bounded chart/spatial
history is distinct from ancestry. Recovery-save failures warn and preserve the last good save
while simulation continues. Fatal execution failures remain visible.
Assess diversity through current capabilities, funded bodies and expressed behavior, never founder
lineage counts or exact genotype counts. Genealogy is an optional historical diagnostic.
[Continuing observation](docs/continuing-observation.md) records measured limits.

Implementers own numerical methods, resolution, sparse thresholds and tuning within the stated
semantics. The operating goal is approximately 30 ticks/second at approximately 2,000 cells,
not at 20,000 cells. Performance currently has low priority; do not make large-population
throughput a routine review concern, research priority or release gate. Byte identity,
save compatibility and replayability are not optimization goals in themselves. Preserve physical
meaning, accounts, ownership and the user's continuing world. Do not silently lower resolution.

The user already runs a development server. Do not start another. Register a bounded purpose
before isolated browser operational checks; never access the user's tab or recovery database.
Use short constructed checks for opportunities, long runs only for questions requiring them,
and keep negative results. The [83,980-tick user checkpoint review](docs/material-habitats-review.md)
finds differentiated colonies and substantial nonseed uptake; it does not prove indefinite
diversity or independence from external feedstock.

Historical plans and superseded equations are preserved in the [plan archive](docs/plans/README.md).
The pre-reconciliation [agent guide](docs/sources/history/2026-09-20-agent-guide.md) retains older
chronology. The ant implementation remains available at tag `ant-colony-checkpoint-2026-09-09`,
commit `780fa4e`; it is not another runtime or a prerequisite.

## Experiment operating policy

Experimental data is local-only. The harness ledger lives at
`frontend/harness/artifacts/ledger.db`; checkpoints, samples, traces, raw reports and
generated plots stay in ignored files. Never commit the ledger or copy generated data
into tracked documentation. Preserve authored findings, decisions, registrations and
reproduction instructions in Git. `docs/evidence/` keeps only authored `README.md` notes
tracked; its existing raw files remain available locally and are optional on fresh checkouts.
This policy supersedes earlier instructions to commit measurements or report copies.

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
   is unnecessary. Freeze mutation and specify private learning, inherited-learning settings. Living-cell gene transfer is not supported. Physiological opportunities need a physical response, not an invented
   neural cue.
   Record expressed body capacities separately from genotype values.
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
assays measure behavior; user feedback informs subsequent motion fixes. Inspect browser startup configuration
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
- Author physical pressures and local carriers. Controllers receive fifty-two local chemical,
  light, body, actuator-activity, contact and private-byte inputs. They may not receive coordinates, a compass bearing,
  destination, hidden route, lineage identity or reproductive score.
- RNN weights alone choose physical efforts and register writes. Diagnostic competition summaries
  never select parents, filter mutants or promote a replacement founder automatically.
- Measurements outrank plans and historical appendices. Documents under
  [docs/sources/](docs/sources/README.md) preserve provenance and rejected work; they do not govern
  current implementation.
- Isolate causal changes when measuring mechanisms, predict their effects, and measure them.
  This is an evidence rule, not a limit on delivering a complete interacting design. When
  parameter motion does not change the claimed outcome, stop tuning and record a structural finding.
- Inspect motion through available bounded checks and act on user reports of circling, jitter,
  congestion or other defects. Do not require human motion approval to close a delivery plan.
- Treat the controller as a pluggable module behind `seed`, `createState`, `act`, `assimilate`, `mutate`, `recombine`, and
  `genomeDistance`. Code outside a controller does not inspect genome internals.
- Keep Vitest bounded to deterministic mechanics and integration invariants. Ecological and
  long-horizon results belong in ignored `frontend/harness/artifacts/ledger.db` and local artifacts.
- Use Rust/WASM, pnpm, TypeScript, React, worker WebGL2, Rust tests and Vitest. ESLint limits complexity to 10, files to 400
  lines, and functions to 75 lines.
- Run `make ci` before handoff after code or build-configuration changes. For documentation-only
  changes, check the changed text and links. Start a development server only when the user
  explicitly asks.
- Browser persistence is client-side through IndexedDB and file export. The native server's
  volume checkpoints and its public route are the only server-side exceptions. Do not add a
  database, another backend or listener, or new authentication without an explicit decision.
- Follow the Ahara platform contract: shared Terraform state and the `ahara-tf-patterns` website
  module; no project-specific bucket or load balancer.

## Code map

| Path                                                 | Purpose                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `engine/src/`                                        | Sole Rust kernel: bodies, fields, local RNN, resource economy, inheritance and binary state |
| `frontend/src/engine/`                               | WASM client, worker, WebGL2, React observation and recovery                                 |
| `frontend/src/persist/`, `frontend/src/ui/pacing.ts` | Local identity, retention policy and bounded pacing only                                    |
| `frontend/harness/`                                  | Experiment tooling; ignored `artifacts/` owns the local ledger and data                     |
| `infrastructure/terraform/`                          | Static website deployment                                                                   |
| `docs/`                                              | Current design, evidence, decisions, and archived source material                           |

## Commands

| Command                                                                                    | Purpose                                                                                                                       |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `make ci`                                                                                  | Lint, format check, typecheck, bounded tests, docs, and Terraform format                                                      |
| `make build`                                                                               | Production SPA build                                                                                                          |
| `cd frontend && pnpm harness bacteria`                                                     | Run live bacterial ecology and save evidence                                                                                  |
| `cd frontend && pnpm harness bacteria-compare --checkpoint path --candidate id`            | Assess ancestor/descendant competition                                                                                        |
| `cd frontend && pnpm harness bacteria-capacity`                                            | Fixed 48/2000/2000-growth loads with census, inspection and render preparation                                                |
| `cd frontend && pnpm harness rps --case pairwise`                                          | Constructed chemical production/compatibility contests                                                                        |
| `cd frontend && pnpm harness zones --case three-way --shares 1,0`                          | Constructed diet-specialist/generalist contests (genetic capacity split between two source mixtures) in zoned or mixed worlds |
| `cd frontend && pnpm harness evolve --world zones --seed 101 --justification REGISTRATION` | De novo evolution with trait samples and checkpoints                                                                          |
| `cd frontend && pnpm harness invasion --checkpoint path`                                   | Rare-start comparisons of descriptive current-checkpoint clusters                                                             |
| `cd frontend && pnpm harness recent`                                                       | Read recent ledger rows                                                                                                       |
| `cd frontend && pnpm harness sql "..."`                                                    | Query the measurement ledger                                                                                                  |
| `cd frontend && pnpm run dev`                                                              | Local server, only when explicitly requested                                                                                  |
