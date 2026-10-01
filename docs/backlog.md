# Open questions and deferred features

This backlog serves [hypothesis-led world design and days/weeks observation](design/README.md).
Historical ant queues and completed outcome-gate roadmaps are not pending prerequisites. The
[design directions registry](design/directions.md) lists implemented, superseded and rejected
directions; this page holds only work that is not implemented.

The pre-chemistry [sparse spatial ecology](design/spatial-ecology.md) design set the enduring
intent: a large, uneven world with capable movement and legible local populations. Viscosity,
food density and geometry remain adjustable, and the irregular source arrangement remains a
revisable hypothesis. Ongoing observation is not a delivery gate.

<a id="backlog-multicore-scaling"></a>

## Future performance work

**Status:** Unselected — recorded September 30 after the structural scaling plan closed.

The [structural scaling record](plans/archive/SCALING-PLAN.md) contains the delivered regional
ownership, local scheduling, shared carriers and parallel execution. Future performance work
starts with ownership and avoidable work, following the structural-first rule in
[AGENTS.md](../AGENTS.md). Candidate questions are 16/32-core scaling, larger-world costs and
persistence limits; these are engineering observations, not open acceptance phases.

<a id="backlog-reservoir-storage"></a>

## Reservoir storage and local depletion

**Status:** Unselected buffering proposal — September 30; not implemented; lower-bound work proceeds through mortality recycling.

[Reservoir storage](design/reservoir-storage.md) proposes finite continuous recharge and
concentration-driven discharge in place of fixed drains and random empty waits. Existing stock,
footprint and timescales define the rates; local consumption affects delivery and seasons affect
recharge. The intended opportunity is buffered resident supply plus stored food at rested sites,
with less abrupt dependence on replenishment. It does not guarantee dispersal or survival below
the maintenance budget, add population feedback, or change cell chemistry. The document owns
the equations, conservative composition handling, execution boundaries and unresolved questions.
It is insufficient as the primary answer to the narrow useful replenishment range; the subsequent
[mortality recycling direction](design/mortality-recycling.md) does not depend on this replacement.

<a id="backlog-mortality-recycling"></a>

## Mortality driven reservoir recycling

**Status:** Locally delivered v50, October 1; recovery enabled by default, sourceRate0.1. Long-term ecological benefit remains a research question, not a delivery gate.

[Mortality recycling](design/mortality-recycling.md) targets the lower supply boundary with
a normally weak, nonlinear recovery of dead body material into nearby reservoirs during
substantial die-offs. External replenishment and growth continue without a biomass ceiling or
population target. The design owns mortality normalization, conservative chemical mixing,
delivery during empty waits, independent normal refill timing, runtime ownership and unresolved
questions. Healthy turnover should receive little support; temporary crisis support is an
accepted tradeoff. It does not claim to raise the upper boundary or guarantee dispersal.

The [delivery findings](mortality-recycling-results.md) show conserved delivery and higher
growth but shorter survivor life in both mirrored placements. The
[execution plan](plans/MORTALITY-RECYCLING-PLAN.md) is locally delivered; useful supply-range
widening and evolved dispersal remain unmeasured. No additional mechanism or campaign is selected.

<a id="backlog-dynamic-terrain"></a>

## Dynamic terrain

**Status:** Open design direction — separately specified September 30; not implemented.

[Dynamic terrain](design/dynamic-terrain.md) is a separate open design direction for gradual
geographic change, tectonic deformation and bounded local events. It owns the shared field
operation, fractal morphology, accounts, local invalidation, persistence and display boundaries.
It remains unimplemented and survives completion of the static-terrain plan. Live physical
feature switches are specified separately within that document; display toggles are unaffected.

<a id="backlog-terrain-refinement"></a>

## Seasonal ecology and continuing terrain refinement

**Status:** Continuing refinement — static terrain and seasons are implemented, with spatial hierarchy in v47.

The [spatial hierarchy revision](design/spatial-scale.md) is implemented in v47 following the September 30
scale review. It restores explicit resource-neighborhood geometry and separates local terrain
from regional seasonal variation. The terrain delivery plan tracks publication and the authorized
fresh live world; continued ecological observation does not block implementation completion.

Seasonal relocation benefit, affordable default reservoir gaps and long-term specialization
are refinement questions that longer observation can inform. Motion, configuration and refill-timing
corrections are implemented; their delivery is recorded in the
[terrain delivery record](plans/archive/TERRAIN-AND-SEASONS-DELIVERY-PLAN.md).

<a id="backlog-cell-interactions"></a>

## Cellular organization and remaining interaction research

**Status:** Unselected — research beyond the v33 implementation (September 20); v43 genetic
physiology replaced its construction mechanics.

[Cellular organization and exchange](design/cellular-organization-and-exchange.md) owns the
implemented v33 mathematics: retained chemical composition changes relative enzyme rates;
funded inward sensing, activity regulation and variable enzyme repertoires organize processing;
crowding divides interfaces between the field and paid uptake from injured neighbors.
Existing chemical injury, repair, export and death connect private and public consequences.
The [intracellular hypothesis](design/intracellular-organization.md) preserves the strategic
reasoning, and [earlier interaction research](design/cell-interaction-research.md) preserves
the original inventory. [Delivery results](cellular-organization-results.md) establish bounded
physical opportunities and costs, not evolved strategies. No phenotype enemy labels, kill
rewards, named chemical bonuses or automatic metabolic optimizer apply. Internal compartments
were rejected; meta-organism opportunities are intercellular.

Open research: evolved cooperation, bonded attachment beyond v41 contact adhesion, direct
consumption of living structure and larger reaction arity. No evolutionary campaign is required.

<a id="backlog-light-ecology"></a>

## Light ecology: shelter, emission and conditional activity

**Status:** Unselected research questions — the v42 implementation (September 25) and its plan
are closed.

The [light ecology design](design/light-ecology.md) owns the installed shade, overhead film and
paid emission. The [constructed checks](light-ecology-results.md) establish sensory agency and
physical effects but no positive whole-cell shelter or lamp return. Default isolated builders
lose small deposits to the existing numerical cutoff; larger funded investment can accumulate
film. Open questions: ecological payoff of shelter and emission, nocturnal endurance and evolved
differentiation. Dormancy is a separate extension.

<a id="backlog-cell-utterances"></a>

## Directional cell communication: mouths and ears

**Status:** Delivered locally in v49, October 1. Natural use and sender return remain open observation questions.

[Directional cell utterances](design/cell-utterances.md) specifies paid byte broadcasts through
mouths and ears: finite periodic reach, no distance falloff inside the disk, no material
deposit or usable-work delivery, and a brief input to the ordinary RNN. Ears report coarse
listener-relative bearing in 16 sectors (22.5 degrees), with no distance or absolute compass input.
Reach follows mouth capacity and paid work. Mouths and ears are genetic body capacities
expressed at current biomass under the v43 physiology; ears carry ordinary body maintenance
without a per-event charge.

The spec covers a signed-bit alphabet, bounded message/direction moments for simultaneous
speakers, once-only impulse reception across the physiological clock and shared mutation and
inheritance. Range/work calibration, shared action funding and explicit founder settings belong
to delivery. The user's direction is to implement when selected, then observe natural behavior
and use that baseline to guide corrections. Speaker return and evolutionary uptake are
post-implementation questions, not admission or release gates. Cheap eavesdropping, silence and
interference remain possible outcomes.

Consider this alongside optical emission, climate and existing interaction questions. Earlier
low chemical secretion did not demonstrate communication or establish why it failed. Profitable
signaling and evolved conventions are not prerequisites. Later causal probes should answer
questions raised by actual observation.

<a id="backlog-strategic-controller"></a>

## Strategic controller: a slow learned layer above the reflex RNN

**Status:** Delivered locally with utterances in v49, October 1. Evolved use remains an observation question.

[Strategic controller](design/strategic-controller.md) adds a third heritable construct: a small
Elman RNN on a slower clock whose outputs become four reflex-RNN inputs and a reflex learning
gain. It issues no physical actions. Inputs combine a shared level/surprise/volatility transform
over the cell's own history, life history, local light and supply phases, local reservoir state,
contact-read neighbor displays and internal noise. Both layers learn; daughters inherit the
parent's strategic state. The private byte remains reflex-owned and strategic read-only;
heard activity and byte diversity use the shared history transform. The
[delivery evidence](utterances-and-strategy-results.md) records calibration and bounded checks.

<a id="backlog-rugged-interaction"></a>

## Rugged chemical interaction: surprising mutations and co-located roles

**Status:** Deferred — research direction specified September 30; complementarity binding is the leading candidate, not yet selected.

[Rugged chemical interaction](design/rugged-interaction.md) seeks mutations that sometimes change
qualitatively how a cell relates to chemical space, and distinct roles among cells sharing one
smooth local mixture. The present genotype-to-interaction map is close to Kauffman's additive
limit; the [research paper](design/kauffman-landscapes-research.md) derives requirements from
rugged-landscape theory: reciprocal sign epistasis, one shared ruggedness control, neutral
networks with abrupt borders, and unchanged accounts, algebra and mutation law. The leading
candidate replaces radial recognition with an additive per-bit binding energy between genetic
keys and identity bits, passed through a sigmoid with one shared steepness λ. Calibrate λ, bias
bounds and support cost in constructed fixtures before any implementation plan.

<a id="backlog-plan-carryover"></a>

## Requirements migrated from earlier plans

**Status:** Unselected — carried over September 13; review gates retired September 30.

The [September 13 closeout](design/plan-closeout.md) accounts for every unfinished phase of the
three remaining ant plans and all skipped phases in closed plans. Obsolete certifications and
training campaigns are retired without claiming success. Surviving work has these dispositions:

| Requirement                                                   | Owner and condition                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Movement, food lifetime and body/controller coordination      | Spatial design phases 1–3. Compare useful displacement, local sensing, travel expenses, food access and funded reproduction; earlier failed motor contests do not justify resuming their conditional invasion/discovery campaigns.                                                              |
| Uneven renewal and temporary resource opportunities           | Implemented through v46 [local resource seasons](design/local-resource-seasons.md) and fractal source placement. Refine local variability when it creates a useful opportunity. No synchronized global schedule.                                                                                |
| Distinguish inherited benefit from drift or initial advantage | Conditional diagnostic after a live observation or configuration question warrants it. Record candidate choice, genetic physiology versus actual body, matched ancestor/descendant or reversion controls, initial denominators and uncertainty. No standing multi-seed evolution certification. |
| Heritability, mutation load and effective population          | Optional instruments if they answer a concrete question. Define estimands for clonal reproduction, overlapping generations and the sampling interval before presenting them; do not copy ant-colony estimates or equate genome count with useful diversity.                                     |
| Observable demographics, ancestry and trait change            | Spatial design phases 4–6. Preserve births, deaths, lineage shares and inherited/body distinctions alongside spatial founding, movement, mergers and losses. Follow descendants even when a viewing group changes.                                                                              |
| Durable continuation and measured execution costs             | Spatial design phases 1, 2 and 6 plus the runtime limits below. Measure spatial field cost and accumulated history. The multicore runtime with cross-origin isolation is installed; coherent execution placement remains a measured design choice.                                              |
| Honest motion interpretation                                  | Spatial design phases 3, 5 and 7. Diagnose actual sensing/action/physical paths, retain negative results, preserve independent UI controls and run CI. The human trajectory-review gate was retired September 30; old missing visual evidence remains missing.                                  |

These are design obligations or conditional questions, not authorization to run all listed assays.
Mating, seed/fertilize and multi-parent ancestry remain conditional extensions below; the retired
ant admission sequence and roughly 2,000-worker gate impose no new prerequisite.

<a id="backlog-evolutionary-questions"></a>

## Evolutionary questions

**Status:** Unselected research questions — open since September 15 chemistry; no campaign selected.

The environmental plan's optional E2 initial-geometry/supply review moves here. Change starting
neighborhoods only for a demonstrated delivery or opportunity limitation, using existing source
budgets and shared forces. No prescribed wells, cluster count or automatic new campaign follows.
The [latest checkpoint](material-habitats-review.md) supplies evidence of dense, differentiated
colonies while source renewal and net flow remain feedstock-heavy.

The next design decision is a coherent world to observe. For each candidate mechanism, state its
ecological purpose, existing proof point, competing explanation and smallest missing test. Select
settings on those grounds, not by the number of clusters produced in a long run.

- Source identity, local depletion and genetic capacity allocation can alter returns. The first
  chemistry implementation's allocation probes showed a constructed reversal; evolved
  specialization is an open question. Short nutrition probes establish acquisition-funded
  reproduction, but do not establish founding at another patch. Diagnose cue/action/displacement
  and resource lifetime before interpreting this as impossible dispersal or extending a horizon.
- Economical bodies and broad metabolic capacity may outperform costly specialization. Preserve
  genuine size/maintenance tradeoffs; do not impose a cost solely to prevent an observed winner.
- The [resource-economy model and checks](design/chemistry/resource-economy.md) establish positive
  local budgets, source-dependent returns and repeated reproduction at one finite site. A weak
  isolated site starves its resident. The September 15 600-tick default check recorded 26
  divisions and no deaths, with both starting colonies reproducing. Continued turnover,
  migration and adaptation are open questions. Use local budgets and observed cues/actions to
  diagnose them before extending a run.
- Generic stress, compatibility, repair and impedance replace named toxin/defense/matrix
  pathways. Paid barriers affect motion and diffusion. The tested degrader reduced material
  returned at death but did not improve alive-cell external clearance; uptake limits are a
  specific unresolved ecological opportunity.
- Export/import can support cross-feeding and detectable cues. The current donor paid a substantial
  cost; receiver benefit is not cooperation and a sensed emission is not communication.
- Optional disturbance is implemented; local recolonization and effects on diversity are open.
  Living-cell gene transfer was removed September 22
  ([decision](design/decisions-and-evidence.md#living-cell-gene-transfer-removed)).
- Shared external work, illumination, material binding and extracellular transformations are
  implemented. Useful public-food specialization is unestablished: the constructed v32
  consumer lost against its control. One to eight enzyme programs are genetic capacities that
  mutation can duplicate or delete; arbitrary genome and neural-topology changes are unselected.
- Paid acquired-weight transmission exists; adaptive usefulness is a conditional research question.
  Preserve the earlier negative findings under their old physics.
- Generic source epochs/zones are available. Earlier A/B cohort benefits remain historical and
  do not prescribe permanent specialists or a new campaign.

Existing negative results limit their exact hypotheses. Do not turn every unresolved mechanism
into a required experiment or keep tuning until a desired role appears.

<a id="backlog-conditional-extensions"></a>

## Conditional extensions

**Status:** Unselected — each needs a reviewed purpose and design.

| Extension                                                                          | Missing decision                                                                                                                        |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Outcrossing, seed/fertilize and multi-parent ancestry                              | Local lifecycle, costs and durable parentage                                                                                            |
| Environmental developmental reaction norms                                         | Which local pressure changes expressed body proportions and what pays for it                                                            |
| Evolvable mutation machinery or neural topology                                    | A demonstrated representation or variation limitation                                                                                   |
| Bonded attachment beyond v41 contact adhesion                                      | Attachment, detachment, forces and costs; reserve sharing alone adds none                                                               |
| Dormancy or additional life stages                                                 | An opportunity current physiology cannot express                                                                                        |
| Rotational climate, multiple-substrate reactions and unrestricted genome structure | A measured limitation of the present shared fields/unary chemistry; no parallel named pathway; bounded enzyme repertoires already exist |

Chemical attack, recipient feeding and resource capture must use the generic shared substrate.
Optional disturbance remains available; living-cell gene transfer is removed. Neither
establishes recognition, cooperation or strategic roles.

<a id="backlog-runtime-and-observation-limits"></a>

## Runtime and observation limits

**Status:** Unselected — standing operating limits and candidate engineering work, September 30.

The [diagnostic continuity audit](design/chemistry/diagnostic-continuity.md) records restored genealogy,
recent behavior windows, founder-relative/sequence comparisons, population body/learning summaries,
source-epoch/task summaries and membrane phenotype history. These are implemented through
bounded observations. Their v9 operating limits are recorded in the archived
[reliability plan](plans/archive/CHEMISTRY-RELIABILITY-PLAN.md).

Days or weeks of user observation is an intended use. A durable design must preserve the ongoing
world and enough of its history to understand change. The implementation and its operating limits
are separate from ecological experiments:

| Requirement                  | Current implementation and gap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Continue after interruption  | Up to six automatic and two manual compressed recovery points, expiring older points to fit256MiB, plus file export; transactional retention tested with emulated IndexedDB. Actual browser termination, quota and suspension behavior are untested. A new session starts at tick zero; restore is explicit. The native server keeps same-format checkpoints on its volume.                                                                                                                                                                                                                                                                                                                                                                       |
| Bounded storage and memory   | History retains every living record plus up to two million ended records; oldest ended records expire without pausing. Recovery caps are 256 MiB total and 192 MiB per uncompressed checkpoint. Failed saves warn while execution continues. The [v33 observation](cellular-200k-review.md#demonstrated-browser-persistence-limit) reaches 243.28 MiB at 180k and 6,975 cells. Removing unreferenced genotype slack still leaves 215.03 MiB. Save/export for necessary live state remains a separate boundary; bounded history does not certify that every population fits.                                                                                                                                                                       |
| Preserve observation         | Browser checkpoints retain 240 thinned spatial frames, 2,048 recent spatial events and the current population census. Dropped events are counted. The kernel retains 512 ordinary events and up to 4,096 explicit interventions; reaching the intervention limit rejects further manual changes. Complete replay and unobserved history remain unavailable.                                                                                                                                                                                                                                                                                                                                                                                       |
| Sustained execution          | A worker owns physics and rendering. One queued task yields simulation work; the main animation loop permits one unanswered presentation request. GPU completion fences bound outstanding frames. Background throttling and sleep can still stop execution.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Useful throughput            | The current goal is approximately 30 ticks/s at 2,000 cells, with low priority; it is not a target at 20,000 cells. See the [ecology review guide](ecology-review-guide.md). Pre-multicore measurement, September 21: [continued optimization](bounded-computation.md) raised the matched v33 180k world from 8.14 to 12.77 ticks/s (10.87 with measured panels active). Physical stepping averaged 71.74 ms; census added 4.77 ms per measured tick. Stage costs were exchange 18.30, physiology 17.42, sensing/controller 12.25 and movement 12.33 ms/tick. The regional multicore runtime replaced that structure. The separate earlier 8→40 reload difference remains unattributed in the [runtime investigation](session-runtime-review.md). |
| Honest visual interpretation | Default usable-energy colors and independent context layers describe current cells. The user reports promising dense colonies; that review does not establish indefinite diversity. Measured-flow route keys can repeat after zero-amount observations. The v33 study deduplicates exact copies and reconciles accepted totals, but the runtime observer still needs correction. Its full route sorting per page also makes exhaustive recording expensive.                                                                                                                                                                                                                                                                                       |
| Meaningful continuation      | Preserve physical state, random streams, conservation, ancestry semantics and source provenance across saves and future performance changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

Design recovery, history retention and ancestry storage together, then validate their operational
properties proportionately. Do not discard scientific parentage silently to bound memory. Do not
add a backend, second simulation, or hosted storage without review. A small synthetic storage/load
test can assess durability without spending an ecological campaign on it.

Acceleration must retain one implementation per physical rule
([ADR 0020](adr/0020-complete-rust-kernel.md)). A worker owns the complete Rust/WASM kernel and
OffscreenCanvas renderer; [continuation measurements](continuing-observation.md) state its limits.
