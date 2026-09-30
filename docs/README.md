# Documentation

The [current design and work order](design/README.md) prepares a world where diverse ecosystems
and adaptation are likely during the user's days/weeks observation. Hypotheses and small proof
points guide settings; a pre-evolved community is not the deliverable. Every design direction,
past or future, is listed with its status in the [design directions registry](design/directions.md).
The [historical snapshot](sources/history/README.md) preserves superseded contracts and full evidence.

Each document opens with one `**Status:**` line. Kinds: *Current contract* (governs the installed
runtime), *Current reference* (operation, commands, observation), *Implemented (vNN)*, *Partly
implemented*, *Deferred proposal*, *Unselected proposal*, *Rejected* and *Historical record (era)*.
Historical records keep their original measurements and context; they are not instructions.

Experimental data is local-only: the SQLite ledger and new run output live under ignored
`frontend/harness/artifacts/`. Historical raw reports and plots under `docs/evidence/` are
also ignored. Git retains written analyses, registrations and evidence README notes.
Links to raw data require the corresponding local files; a fresh checkout does not include
them. See the [storage policy](evidence/README.md).

## Current contracts and references

| Need | Document |
| --- | --- |
| What Biotropy is: question, philosophy and mathematics | [White paper](white-paper.md) |
| Observed outcomes, negative results and open research directions | [Outcomes and open directions](outcomes-and-directions.md) |
| September 30 starvation investigation and renewal correction | [Extinction correction](extinction-correction.md) |
| Work order, installed runtime and design owners | [Current design](design/README.md) |
| Every design direction and its status | [Design directions registry](design/directions.md) |
| Decisions, rejected approaches and negative evidence | [Decision record](design/decisions-and-evidence.md), [ADR index](adr/README.md) |
| Goals, evidence standards and delivery boundary | [Principles](principles.md) |
| World substrate, lifecycle and persistence | [Bacterial world](design/bacteria.md) |
| Installed artificial laws, accounts and checkpoint format | [Composed runtime](design/chemistry/composed-runtime.md), [chemistry index](design/chemistry/README.md) |
| Chemistry design rules and exact finite actions | [Computational foundation](design/chemistry/computational-foundation.md), [transformation algebra](design/chemistry/transformation-algebra.md) |
| Rust/WASM ownership, borrowed rendering and bounded observation | [Data-sharing contract](design/chemistry/data-ownership.md) |
| Local RNN controller inputs, actions and learning | [Controller](design/controller.md) |
| Genetic physiology, bodies and inheritance | [Funded bodies](design/funded-bodies.md), [birth-fixed capabilities](design/chemistry/installed-machinery.md) |
| Regional execution and multicore ownership | [Spatial execution](design/spatial-execution.md) |
| Terrain, fractal maps and resource placement | [Persistent geography](design/persistent-geography.md) — static v46 implemented; [active repair plan](plans/TERRAIN-AND-SEASONS-PLAN.md) |
| Local supply clocks | [Local resource seasons](design/local-resource-seasons.md) — implemented v46 |
| Reservoir neighborhoods, intervening gaps and local terrain scale | [Spatial hierarchy revision](design/spatial-scale.md) — implemented v47; terrain plan tracks deployment |
| Changing terrain, tectonics and local events | [Dynamic terrain](design/dynamic-terrain.md) — separate open design direction; not implemented |
| Shade, overhead film and paid emission | [Light ecology](design/light-ecology.md) — implemented v42; [results](light-ecology-results.md) |
| Paid local light sensing | [Photoreception](photoreception.md) |
| Strategic ecology scope | [Strategic microbial ecology](design/strategic-ecology.md) |
| Viewport, integrated landscape and visual meanings | [Display contract](design/bacterial-display.md) |
| Families, traits, grouping and history | [Population observation](design/population-observation.md), [phenotype and chemical-web views](phenotype-observation.md) |
| Experiment method and evidence levels | [Experimentation](design/experimentation.md), [development commands](development.md) |
| Analytical resource budgets | [Resource economy](design/chemistry/resource-economy.md) |
| Runtime ownership and module map | [Architecture](architecture.md) |
| Browser 1/4, native server and public spectator route | [Execution modes](execution-modes.md), [server management API](server-management.md) |
| Recovery, retention and history limits | [Continuing observation](continuing-observation.md) |
| Default scales and dated throughput | [Calibration](calibration.md) |
| Open hypotheses | [Hypothesis log](hypothesis-log.md) |
| Planned and unselected work | [Backlog](backlog.md) |
| Active and archived plans | [Plan index](plans/README.md) |
| Shipped changes by date | [Changelog](../CHANGELOG.md) |

## Deferred proposals

| Direction | Document |
| --- | --- |
| Paid byte broadcasts with coarse listener-relative hearing | [Directional cell utterances](design/cell-utterances.md) |
| Slow learned strategy layer feeding the reflex RNN | [Strategic controller](design/strategic-controller.md) |
| Gradual geographic change, tectonics and bounded local events | [Dynamic terrain](design/dynamic-terrain.md) |
| Rugged chemical interaction: surprising mutations and co-located roles | [Direction](design/rugged-interaction.md), [Kauffman research paper](design/kauffman-landscapes-research.md) |

## Historical design records

| Topic | Document |
| --- | --- |
| Cellular organization, specialization and interactions (implemented v33; construction removed v43) | [Cellular organization and exchange](design/cellular-organization-and-exchange.md), [strategic rationale](design/intracellular-organization.md), [earlier interaction research](design/cell-interaction-research.md) |
| Resource binding (investigation v27; implemented v28, later changed) | [Investigation](design/resource-binding-investigation.md), [proposal](design/resource-binding-proposal.md) |
| Pre-chemistry sparse spatial world (September 13) | [Sparse spatial ecology](design/spatial-ecology.md) |
| Spatial isolation review (fixed basins rejected; rotational climate unselected) | [50k study and staged proposal](design/spatial-isolation-review.md) |
| Regenerative initial ecosystem (implemented v27) | [Initial ecosystem white paper](design/chemistry/regenerative-ecosystem.md) |
| Earlier plans and migrated work | [Plan closeout](design/plan-closeout.md) |
| Pre-chemistry world-design evidence | [Evidence](design/bacteria-results.md), [corrected analysis](analysis-correction.md) |
| Deleted M0/M1 chemistry specification | [Digital chemistry specification](specs/digital-chemistry/README.md) |
| September 10–11 ant/A-B certification | [Certification](certifications.md) |

## Historical studies by era

Studies retain the physical version and configuration stated in each record. Archived commands
are provenance, not instructions to rerun old campaigns. Read the
[corrected ecological analysis](analysis-correction.md) before reusing September 12–13 conclusions.

| Era | Studies |
| --- | --- |
| v42, September 25–26 (before ecological incentives) | [Cluster placement](cluster-placement-study.md), [cluster bottleneck](cluster-bottleneck-study.md), [movement opportunity](movement-opportunity-study.md) |
| v33–v34, September 20–21 | [Cellular delivery results](cellular-organization-results.md), [180k analysis](cellular-200k-review.md), [connected 180k analysis](cellular-180k-connections.md), [contact performance](contact-performance.md), [bounded computation](bounded-computation.md) |
| v31–v32, September 19–22 | [Integrated 200k review](integrated-200k-review.md), [material-supported habitats](material-habitats.md), [83,980-tick review](material-habitats-review.md), [session runtime](session-runtime-review.md) |
| v18–v22, September 16–18 | [Local-weathering 50k](local-weathering-50k-study.md), [physical coupling audit](physical-coupling-audit.md), [v19 correction](physical-coupling-correction.md), [bound material](bound-material.md), [bound-material impact](bound-material-impact-study.md), [mathematical symmetry audit](mathematical-symmetry-audit.md), [v22 completion audit](symmetry-completion-audit.md), [#186 investigation](186-symmetry-investigation.md), [#186 causality](186-symmetry-causality.md), [mature checkpoint cost](mature-checkpoint-cost.md) |
| v14–v15, September 16 | [Default-seed cycles](default-seed-cycles-study.md), [environmental chemistry](design/chemistry/environmental-results.md), [mobile sources](design/chemistry/mobile-source-results.md) |
| Pre-chemistry TypeScript A/B-food world, September 10–13 | [Overnight adaptation](overnight-study.md), [strategy](strategy-study.md), [quick food access](quick-food-access-study.md), [capability investigation](capability-investigation.md), [six 50k runs](population-50k.md), [food epochs](food-epochs-study.md), [spatial probes](spatial-probes.md), [RPS](rps-study.md), [zones](zones-study.md), [evolve](evolve-study.md), [cycle](cycle-study.md), [family](family-study.md), [predation](predation-study.md), [disturbance](disturbance-study.md), [transfer](transfer-study.md), [sharing](sharing-study.md), [signal](signal-study.md) |
| Chemistry-era records (September 13–18) | [Chemistry index historical table](design/chemistry/README.md) |
| Original supplied sources | [Source index](sources/README.md) |

The following index covers every active design, principle, calibration and backlog section.
Historical indexes remain in the archive; they are not additional work queues.

## Computable chemistry

- [Design rules for computation](design/chemistry/computational-foundation.md#design-the-rules-for-their-computation)
- [Chemical and geographic domains](design/chemistry/computational-foundation.md#two-domains-with-different-jobs)
- [Composed field and transport operations](design/chemistry/computational-foundation.md#compose-the-calculation-end-to-end)
- [Machinery on chemical space](design/chemistry/computational-foundation.md#machinery-is-computation-on-chemical-space)
- [Accounting and consistency](design/chemistry/computational-foundation.md#consistency-belongs-to-the-designed-system)
- [Historical acceptance and evidence (September 15)](design/chemistry/computational-foundation.md#acceptance-before-integration)
- [Computable artificial rules](principles.md#principles-computable-rules)
- [Structural performance work](principles.md#principles-structural-performance)

## Current design and work order

- [Goal and present evidence](design/README.md#design-goal-and-present-evidence)
- [Birth orientation and physiological aging](design/README.md#design-birth-and-aging)
- [Integrated terrain display](design/README.md#design-terrain-display)
- [Fractal terrain and local resource seasons](design/README.md#design-terrain-seasons)
- [Dispersal geography and bounded neural drive](design/README.md#design-dispersal-opportunities)
- [Genetic physiology without machinery construction](design/README.md#design-genetic-physiology)
- [Crowding, waste and independent light metabolism](design/README.md#design-ecological-incentives)
- [Completed model simplification](design/README.md#design-model-simplification)
- [Light ecology (v42)](design/README.md#design-light-ecology)
- [Class-specific material coupling baseline](design/README.md#design-material-coupling)
- [Regional structural execution](design/README.md#design-structural-priority)
- [Installed runtime](design/README.md#design-installed-runtime)
- [Design owners](design/README.md#design-design-owners)
- [Current default and disabled scope](design/README.md#design-current-default-and-disabled-scope)
- [Next decisions](design/README.md#design-next-decisions)
- [Earlier roadmap: findings retained, outcome gates retired](design/README.md#design-roadmap)
- [Earlier roadmap two: opportunities and unresolved questions](design/README.md#design-roadmap-2)
- [Status and provenance](design/README.md#design-status-and-provenance)

## Sparse spatial ecology (historical, pre-chemistry)

- [Intent and preserved semantics](design/spatial-ecology.md#spatial-intent)
- [First landscape hypothesis](design/spatial-ecology.md#spatial-landscape)
- [Movement and local resource economy](design/spatial-ecology.md#spatial-movement)
- [Population observation and rendering](design/spatial-ecology.md#spatial-observation)
- [Continuation and retained history](design/spatial-ecology.md#spatial-continuation)
- [Work sequence and acceptance](design/spatial-ecology.md#spatial-work-sequence)

## Bacterial world and lifecycle

- [Substrate and embodied state](design/bacteria.md#world-substrate-and-embodied-state)
- [Fields and finite deposits](design/bacteria.md#world-fields-and-finite-deposits)
- [Turn order and resource economy](design/bacteria.md#world-turn-order-and-resource-economy)
- [Growth, death and reproduction](design/bacteria.md#world-growth-death-and-reproduction)
- [Determinism and persistence](design/bacteria.md#world-determinism-and-persistence)

## Local RNN controller

- [Observation contract](design/controller.md#controller-observation-contract)
- [Action contract](design/controller.md#controller-action-contract)
- [Topology and founder](design/controller.md#controller-topology-and-founder)
- [Learning and module boundary](design/controller.md#controller-learning-and-module-boundary)

## Funded bodies, genes and inherited learning

- [Genetic physiology and physical genes](design/funded-bodies.md#bodies-construction-and-physical-genes)
- [Geometry, motion and uptake](design/funded-bodies.md#bodies-geometry-motion-and-uptake)
- [Accounting](design/funded-bodies.md#bodies-accounting)
- [Lifetime-static and lifetime-dynamic information](design/funded-bodies.md#bodies-lifetimestatic-and-lifetimedynamic-information)
- [Inheritable learning](design/funded-bodies.md#bodies-inheritable-learning)
- [Policy composition and mutation](design/funded-bodies.md#bodies-policy-composition-and-mutation)

## Strategic microbial ecology

- [Resource opportunities](design/strategic-ecology.md#ecology-resource-opportunities)
- [Metabolic chains and external energy](design/strategic-ecology.md#ecology-element-cycle)
- [Injury, death and resource capture](design/strategic-ecology.md#ecology-predation)
- [Abiotic disturbance](design/strategic-ecology.md#ecology-disturbance)
- [Horizontal gene transfer removed](design/strategic-ecology.md#ecology-gene-transfer)
- [Export, uptake and recipient benefit](design/strategic-ecology.md#ecology-sharing)
- [Detectable emissions](design/strategic-ecology.md#ecology-signal)
- [Stress, compatibility and repair](design/strategic-ecology.md#ecology-toxin-defense-and-repair)
- [Family chemistry](design/strategic-ecology.md#ecology-family-chemistry)
- [Accumulation, impedance and degradation](design/strategic-ecology.md#ecology-porous-matrix)
- [Optional and deferred scope](design/strategic-ecology.md#ecology-disabled-systems)
- [Consequences and boundaries](design/strategic-ecology.md#ecology-consequences-and-boundaries)

## Experiments for world design

- [Evidence levels](design/experimentation.md#experiments-evidence-levels)
- [Frequency comparisons and the retired coexistence gate](design/experimentation.md#experiments-coexistence-criterion)
- [Competing hypotheses](design/experimentation.md#experiments-competing-hypotheses)
- [Comparison method](design/experimentation.md#experiments-comparison-method)
- [Existing harness and provenance](design/experimentation.md#experiments-existing-harness-and-provenance)
- [Proportionate verification](design/experimentation.md#experiments-proportionate-verification)

## Evidence for world-design decisions

- [World-design proof points and corrected claims](design/bacteria-results.md#evidence-world-design-proof-points)
- [Pre-chemistry capability investigation](design/bacteria-results.md#evidence-capability-investigation)
- [Exported lineage adaptation](design/bacteria-results.md#evidence-exported-lineage-adaptation)
- [September 10 default ecology, before later changes](design/bacteria-results.md#evidence-corrected-default-ecology)
- [Earlier evidence and its limits](design/bacteria-results.md#evidence-earlier-evidence-and-its-limits)
- [Open conclusions](design/bacteria-results.md#evidence-open-conclusions)

## Display and observation

- [World and camera](design/bacterial-display.md#display-world-and-camera)
- [Integrated landscape](design/bacterial-display.md#display-integrated-landscape)
- [Visual meanings](design/bacterial-display.md#display-visual-meanings)
- [Chemical map audit](design/bacterial-display.md#display-chemistry-map-audit)
- [Stats and history](design/bacterial-display.md#display-stats-and-history)
- [Implementation boundary](design/bacterial-display.md#display-implementation-boundary)

## Population observation

- [Population views and definitions](design/population-observation.md#population-independent-views)
- [Chemical roles and transformation web](design/population-observation.md#population-chemical-web)
- [Strategy clusters](design/population-observation.md#population-strategy-clusters)
- [Spatial grouping, identity and event uncertainty](design/population-observation.md#population-spatial-groups)
- [Observation boundaries and verification](design/population-observation.md#population-boundaries)

## Simulation goals and operating principles

- [Goal and evidence](principles.md#principles-goal-and-evidence)
- [Author pressures and local carriers](principles.md#principles-author-pressures-and-local-carriers)
- [Mechanisms before expansion](principles.md#principles-mechanisms-before-expansion)
- [Review and working boundary](principles.md#principles-review-and-working-boundary)
- [Durable architecture](principles.md#principles-durable-architecture)

## Open questions and deferred features

- [Future performance work](backlog.md#backlog-multicore-scaling)
- [Terrain extensions and continuing refinement](backlog.md#backlog-terrain-refinement)
- [Cellular organization and remaining interaction research](backlog.md#backlog-cell-interactions)
- [Light ecology: shelter, emission and conditional activity](backlog.md#backlog-light-ecology)
- [Directional cell communication: mouths and ears](backlog.md#backlog-cell-utterances)
- [Strategic controller: a slow learned layer above the reflex RNN](backlog.md#backlog-strategic-controller)
- [Dynamic terrain: gradual change, tectonics and local events](backlog.md#backlog-dynamic-terrain)
- [Rugged chemical interaction: surprising mutations and co-located roles](backlog.md#backlog-rugged-interaction)
- [Requirements migrated from earlier plans](backlog.md#backlog-plan-carryover)
- [Evolutionary questions](backlog.md#backlog-evolutionary-questions)
- [Conditional extensions](backlog.md#backlog-conditional-extensions)
- [Runtime and observation limits](backlog.md#backlog-runtime-and-observation-limits)

## Current calibration

- [Default scales](calibration.md#calibration-default-scales)
- [Measured throughput](calibration.md#calibration-throughput)
- [Motion and residency](calibration.md#calibration-residency)
- [Chemistry and injury selection](calibration.md#calibration-why-the-injury-balance-changed)
