# Agent Guide

Antropy is a browser-based 2D artificial-life simulation built as a Vite, React, TypeScript, and
worker WebGL2 SPA with a Rust/WASM physical kernel and deployed on the Ahara platform.

## Primary delivery rule: correctness and impact

Choose and implement the most correct, impactful solution to the user's goal within the
established principles and authorized scope. Never use "the smallest coherent change", minimum
diff size, or an easy interim slice as the objective. Complete the necessary interacting parts
of the design; do not leave the intended outcome incomplete merely to keep a change small.

Phases organize delivery and validation of the complete solution. They must not silently reduce
its ambition or postpone dependencies that make it useful. Use an interim result only when the
user explicitly requests one. Avoid unnecessary complexity through sound design and shared
mathematics, not by substituting a less consequential result. Bounded experiments control the
cost of obtaining evidence; they do not set the scope of the implementation.

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

## Read first

| Topic                  | Link                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| Governing principles   | [docs/principles.md](docs/principles.md)                                         |
| Current work order     | [docs/design/README.md](docs/design/README.md)                                   |
| Current runtime contract | [docs/design/bacteria.md](docs/design/bacteria.md) |
| Current evolutionary contract | [docs/design/funded-bodies.md](docs/design/funded-bodies.md) |
| Current measurements | [Cellular delivery](docs/cellular-organization-results.md), [habitat evidence](docs/material-habitats.md), [runtime investigation](docs/session-runtime-review.md) |
| Historical ant certification | [docs/certifications.md](docs/certifications.md) |
| Documentation index    | [docs/README.md](docs/README.md)                                                 |
| Source archive         | [docs/sources/README.md](docs/sources/README.md)                                 |
| Architecture decisions | [docs/adr/README.md](docs/adr/README.md)                                         |
| Platform integration   | [../ahara/INTEGRATION.md](../ahara/INTEGRATION.md)                               |
| Ahara standards        | [../ahara-standards/standards/README.md](../ahara-standards/standards/README.md) |

## Current goal and runtime boundary

Build an observable world where inherited changes and conditional specialization remain possible
over long periods. Clusters, migration and a particular number of strategies are not prescribed
outcomes. A homeostatic colony is valid; new mechanisms need a physical opportunity and an
accounted cost, not a long campaign certifying the user's future ecosystem.

The [current work order](docs/design/README.md) owns priorities. Physical checkpoint v35 uses one
Rust/WASM World in a worker, with mesh-2 fields on a periodic 320 × 240 XY plane. Seed27 starts
paused with 48 cells of four mutable founder types across two colonies and 48 finite renewing
reservoirs. Chemistry seed101 supplies the initial 0→128→136→8→0 circuit, initial reservoir
mixtures 0/136 and finite priming. These IDs have no special role in subsequent laws.

Current physiology has 56 local RNN inputs, 24 recurrent units and 38 outputs, twenty bounded
stock records, four receptors/transporters, one to eight enzyme programs, membrane compatibility
and paid photoreception. Cells retain one internal mixture; internal compartments were rejected.
Retained composition modulates rates without changing per-conversion work. Funded inward sensing,
activity/construction control, paid retirement and shared field/contact access implement the
[joint design](docs/design/cellular-organization-and-exchange.md). Injured cells expose free
inventory through ordinary paid transport. No role, kin rule or community reward assigns cooperation.
Genotypes are immutable; private experience transmits only through explicit birth-local
assimilation. Installed machinery retains its function until paid refitting. Reproduction cannot
grant newly targeted machinery. No fallback policy, remote parent selector, coordinates, compass,
lineage label or reproductive score enters the controller.

Shared two-scale material attraction, local repulsion, reversible retention, evolving source
renewal and multiscale public transformations are implemented. Illumination composes several
slow spatial/temporal axes into shared transformation work; it is not direct energy credited
to cells. Cells can pay for local optical sensing. See [material habitats](docs/material-habitats.md),
[photoreception](docs/photoreception.md) and the composed laws for definitions and limits.

Default observation is a full-screen viewport, usable-energy cell colors, energy-per-material
chemistry and independently controlled context layers. Bounded phenotype and measured-flow panels
report actual recent transfers separately from possible enzyme transformations. Rust owns all
physical state; rendering borrows WASM views in the same worker. Full field/population frames
must never be serialized or copied to React. The [ownership contract](docs/design/chemistry/data-ownership.md)
and its CI guards remain mandatory.

Source zones/epochs and optional disturbance/typed transfer remain available; disturbance and
transfer are off by default. Direct adhesion, multiple substrates, unrestricted genome/neural topology,
terrain and rotational climate are deferred. The user resumed multicore execution September 21.
The [scaling plan](SCALING-PLAN.md#multicore-design) records the installed persistent Rayon pool,
shared WASM memory, disjoint field/cell jobs and small-work serial crossover. The owning worker
still coordinates the sole World and renders borrowed views after every phase joins. Development
requires cross-origin isolation; unsupported browsers use the same operators in the serial build.
P3 large-world persistence and 16/32-core acceptance remain open; default dimensions are unchanged.

[Execution modes](docs/execution-modes.md) extends this with explicit browser 1/4 selection and
one native server World feeding the same UI through bounded display projections. Local rendering
still borrows WASM views. Remote packets remain in the renderer worker; physical/private state
stays native. Multiple spectators share publication work and cannot change physical or run-level
cohort controls without operator authentication. Private TrueNAS/Komodo deployment is authorized;
public VPN routing and the hosted server default must remain disabled until explicitly requested.
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
expiring older points to fit. A raw checkpoint is capped at 192 MiB. Compact complete parentage
defaults to two million records; bounded chart/spatial history is distinct from ancestry.
Actual storage/memory failures pause visibly. [Continuing observation](docs/continuing-observation.md)
records measured limits; uninterrupted days/weeks operation is not certified.

Implementers own numerical methods, resolution, sparse thresholds and tuning within the stated
semantics. Target at least 30 ticks/second and report workloads that miss it. Byte identity,
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
- Author physical pressures and local carriers. Controllers receive fifty-six local chemical,
  light, body, contact and private-byte inputs. They may not receive coordinates, a compass bearing,
  destination, hidden route, lineage identity or reproductive score.
- RNN weights alone choose physical efforts and register writes. Diagnostic competition summaries
  never select parents, filter mutants or promote a replacement founder automatically.
- Measurements outrank plans and historical appendices. Documents under
  [docs/sources/](docs/sources/README.md) preserve provenance and rejected work; they do not govern
  current implementation.
- Isolate causal changes when measuring mechanisms, predict their effects, and measure them.
  This is an evidence rule, not a limit on delivering a complete interacting design. When
  parameter motion does not change the claimed outcome, stop tuning and record a structural finding.
- Human review is a real gate for motion. Ratios and final counts cannot certify circling, jitter,
  congestion, or other visibly broken trajectories.
- Treat the controller as a pluggable module behind `seed`, `createState`, `act`, `assimilate`, `mutate`, `recombine`, and
  `genomeDistance`. Code outside a controller does not inspect genome internals.
- Keep Vitest bounded to deterministic mechanics and integration invariants. Ecological and
  long-horizon results belong in ignored `frontend/harness/artifacts/ledger.db` and local artifacts.
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
| `frontend/harness/`         | Experiment tooling; ignored `artifacts/` owns the local ledger and data |
| `infrastructure/terraform/` | Static website deployment                                             |
| `docs/`                     | Current design, evidence, decisions, and archived source material     |

## Commands

| Command                                          | Purpose                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `make ci`                                        | Lint, format check, typecheck, bounded tests, docs, and Terraform format |
| `make build`                                     | Production SPA build                                                     |
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
