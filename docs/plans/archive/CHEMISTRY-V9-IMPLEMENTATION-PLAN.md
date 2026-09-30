# Replace the chemical economy with digital chemistry

> Historical first TypeScript chemistry implementation (v9). Its measurements and decisions
> remain evidence for that version. The [Rust/WASM numerical contract](numerical-engine.md),
> [current results](numerical-results.md) and [migration dispositions](numerical-migration.md)
> supersede its runtime choices and unfinished work order.


Revised September 13, 2026. Sulion plan `d80ddca6-d78c-4f29-ac65-1164fe8ba5a8`.
Status: laws/space, the complete chemical cycle and bounded physical-opportunity validation are
implemented. Product/content migration and removal are implemented locally; phase 4 remains open
for human motion/operating acceptance. The unusable initial throughput was rejected. The
[population performance repair](population-performance.md) and [viability repair](viability.md) establish a
reproducing 48-founder default, every 250-tick window above 30 ticks/s, explicit numerical-loss
accounting and validated short-run fidelity. Export loss and self-injury were isolated with
small causal probes; daughter reproduction was checked on ordinary renewing deposits.
Human motion acceptance and days/weeks endurance remain unverified.
This replaces the canceled
ten-phase plan `fda95ce9-a4a9-41b8-a6d5-58d04756635a`; no implementation was completed or
requirements discarded. Current implementation choices and executed checks are recorded in
[decisions](decisions.md). The worktree is an incomplete replacement until all milestones pass.

The deliverable is a physically coherent replacement of the existing chemical economy, with its
superseded implementation removed. Chemistry, cell physiology, accounting and the durable state
shape change together. Completion requires both functioning new behavior and evidence that the
old chemical economy can no longer execute. This is the execution sequence for the work; earlier
phase outlines in [migration](migration.md) do not govern its order. The
[original proposal](sources/chemistry-proposal.txt), [Appendix A](sources/migration-proposal.txt)
and the user's four clarifications define the intended system. The detailed
[substrate](substrate.md) and [machinery](machinery.md) documents supply candidate formulas and
architecture choices to resolve where needed, not additional settled requirements.

## Outcome and boundaries

Deliver one shared browser/harness chemistry with a bounded 16 x 16 chemical space, smooth
potential/diffusion/impedance/stress properties, sparse mixtures, fixed heritable machinery,
paid transport and unary reactions, generic biomass and explicit matter/energy accounting.
Preserve local sensing, individual funded reproduction, inherited variation and private learning.
Build credible opportunities for ecological differentiation without assigning biological roles
to chemical IDs or seeding a chosen final community.

The observation world remains large and uneven, with at least two initial spatial colonies of
one founder genotype. Useful movement, local scarcity and variation in resource density should
make migration consequential. Retune the physical economy as needed; neither current numerical
parameters nor the first spatial arrangement are permanent design targets.

Existing runtime documentation remains unchanged during planning. Update current contracts and
experiment instructions when their replacements land. Historical measurements retain their
original schemas, conditions and conclusions; they do not become results for the new chemistry.
No old-genome/checkpoint adapter, second simulation, backend or long evolution campaign is part
of implementing this substrate.

The replacement boundary is concrete: current `resources.ts` merges A/B into one reserve;
`development.ts` converts that reserve directly into energy; `ecologyFields.ts` implements named
decay, binding and decomposition. Bodies, secretion, reproduction, accounting and checkpoints
depend on those assumptions. Wrapping these pathways in a new chemical API would retain the
wrong physical system. Replace their chemical responsibilities while reusing sound geometry,
contact, ancestry, controller infrastructure and local persistence machinery.

## Four implementation milestones

| Milestone | Deliverable and completion criteria |
| --- | --- |
| 1. Establish and implement chemical laws and space | Shared mathematical functions and constrained U/D/I/S generation pass accounting, boundary, continuity and numerical checks. Necessary unresolved choices are justified; there is no parallel reference engine to maintain. |
| 2. Replace the complete cell-environment chemical cycle | Sources through metabolism, construction and death operate on generic chemistry, with new checkpoints and basic inspection. Old executable chemical pathways and their state/configuration dependencies are removed from the shared kernel. |
| 3. Validate the required physical opportunities | Actual cells demonstrate the specified causal opportunities at measured costs under small controlled tests. Fix physical failures in the common engine; introduce no assay-only substitute mechanics. |
| 4. Complete product integration and audit removal | Appendix A experiments, UI, reports and recovery use the new system. Obsolete code/configuration/fixtures/commands are removed, historical evidence is preserved as history, and the sparse world passes operational checks, CI/build and human review. |

The former phases 1–2 are milestone 1; phases 3–5 and foundational inspection/checkpoints are
milestone 2; phase 6 is milestone 3; phase 7 and the remaining observation, durability and handoff
work are milestone 4. Modules can be developed incrementally, but an incomplete chemical cycle
is not a completed runtime milestone. Do not ship a switch between old and new economies.

Measure field costs and design checkpoint encoding while introducing the new state. Milestone 4
finishes product views and combined load tests; it must not discover that the core chemistry is
unobservable, cannot be saved or cannot fit the intended world.

If a result requires a multi-step prerequisite or structural repair, mark the phase blocked and
use a Sulion sub-plan. A one-line repair stays in the phase. A failed hypothesis must not be
renamed a success because an unrelated trait or population count changed.

## Milestone 1: establish and implement chemical laws and space

Resolve the physical contract in code and a concise decision record: equations, units, valid
domains, limiting behavior, calibration parameters, numerical method and error tolerances. Use the
proposal's simple forms first. Compare an alternative only when a failed requirement or a measured
sensitivity can change the decision; do not launch an unconstrained formula search.

Implement the selected pure mathematical functions in their intended shared-kernel owners and
test them there. Local analytical plots and small numerical fixtures may compare candidates;
do not create a second physical engine to serve as the production reference.

| Mathematical choice | Starting candidate | Required selection/test work |
| --- | --- | --- |
| Chemical geometry | Byte coordinates, Euclidean distance, reflected edges | Exhaust all 256 encodings, edge/corner offsets and self-reactions. Distinguish chemical boundaries from periodic geography; measure discontinuities caused by product quantization. |
| Shared affinity | Gaussian distance response with one fixed sigma | Plot distance/target-step responses, effective number of species recognized and edge truncation. Select a width with meaningful overlap and differentiation; test the nearly exact-match and nearly indiscriminate limits. |
| Property functions | Small low-frequency two-dimensional basis, bounded property ranges and log-scaled diffusivity | Select basis order, coefficient distribution, normalization and slope constraints. Test that normalization does not magnify a nearly constant field into abrupt variation. |
| Diffusion | Conservative symmetric face flux, explicit stable substeps | Derive the stability bound including grid spacing; check paired flux cancellation, nonnegative amounts and step refinement. No asymmetric update may create directional transport. |
| Environmental impedance | `L = sum(C*I)`, movement `1/(1+kMove*L^2)`, diffusion `1/(1+kDiff*L)` | Plot low through high loads, test monotonicity and bounds, and compare movement against field transport. Map the chosen response consistently into motor-limited drag and Brownian rotation. |
| Membrane susceptibility and stress | Smooth inverse affinity with residual susceptibility; bounded load-to-damage response | Select susceptibility floor and damage scale. Test tolerant versus distant membranes, self-exposure and the proposed internal exposure term; avoid both universal immunity and unavoidable background death. |
| Transport | Affinity-weighted first-order demand, throughput and conductance limits, positive work cost | Define amount versus concentration, shared supply/headroom, import/export arbitration and energy reservation. Check conservation and permutation of traversal order. |
| Unary catalysis | First-order substrate use with funded throughput, shared-substrate limits and deferred product reuse | Test saturation only from declared capacity limits, competing enzymes, zero stock/effort/substrate and dt refinement. Do not introduce multi-substrate kinetics implicitly. |
| Reaction energetics | Downhill capture `eta*deltaU*q`; uphill charge `-deltaU*q/eta`, with `0<eta<1` | Test downhill/uphill pairs, closed cycles, reflected products, equal potentials and energy-capacity overflow. Select whether additional turnover work is needed and distinguish it from maintenance. |
| Biomass and decomposition | Any internal matter can become biomass with assembly energy; candidate body energy equals decomposition-species potential | Close low/high-potential input, repair replacement and death cycles. Test that no conversion creates usable energy or requires a privileged imported biomass species. |
| Generic turnover | One extracellular rate, `qAfter=qBefore*exp(-lambda*dt)` | Verify the analytical half-life and explicit matter/energy sink for every species; choose timescale relative to travel, diffusion, renewal and maintenance of a deposit. |
| Funded physiology | Stock-dependent capacity, volume, maintenance and local construction deficits | Select reference scales and conservation tolerances. Separate genetic targets from installed machinery; verify that zero stock gives zero chemical capability. |

Fixed heritable slots are required; four slots of each class is a candidate count. Per-enzyme
neural control and the resulting 39/24/13 interface, an extra catalytic charge, internal stress,
immediate corpse conversion and particular diploid expression rules were additions in the draft.
For each, establish whether it is needed to express the specified system, select a justified
rule, or leave it out. They are not mandatory fidelity requirements merely because they appear
in an earlier document. Do not add controls or costs to preserve an old implementation shape.

Conservation of scalar matter, chemical potential, affinity and unary transformations defines
the requested abstraction. Close the biomass/decomposition energy balance without inventing a
required biomass ingredient. More realistic molecular chemistry is not needed to implement
these rules faithfully. Numerical correctness must be tested in the functions the simulation uses.

### Design the physical chemical space

Implement the chosen basis and generation policy for 256 samples of one bounded smooth manifold.
Generate U, D, I and S from persisted coefficients; keep their physical ranges and units in the
world definition. Use a chemistry-generation stream independent of geography and organism
randomness. Generate no food, toxin, signal or matrix labels.

Construct the generator around the required joint combinations; do not rely on independently
random surfaces happening to align. Validate more than four independent ranges. The space must
contain high/low potential,
fast/slow diffusion, stressful regions and, especially, neighborhoods combining high impedance
with low diffusion. Inspect low-stress/low-impedance regions and attainable downhill steps as
other useful combinations. Check the actual affinity-weighted neighborhoods and allowed enzyme
offsets, not merely isolated attractive pixels in a heatmap.

Select the draft's numerical coverage thresholds and generation retry bound through declared
mathematical checks. Register a small fixed set of generator seeds before evaluating it, record
all successes and failures, and inspect rejection rate and property correlations. Do not select
worlds by running populations or quietly weaken coverage when a seed fails. An invalid generated
world must fail clearly rather than lack a category of physical opportunity silently.

Produce a local property atlas: four heatmaps, physical scales, neighboring-property differences,
joint-distribution plots, coverage regions and examples of local target/offset mutations. Include
an example path from high to lower impedance and its energy consequences. This establishes
expressibility; a cell's ability to reach, fund and use that path is checked later.

Persist coefficients, resolved tables, generator version, ranges, accepted attempt and validation
results. Test repeat generation, restore, invalid configurations, coefficient/table disagreement
and mutation/reflection near boundaries. Heatmap axes are chemical coordinates, never geography.

Exit: selected shared functions pass their bounded tests, the accounting contract closes, and a
reproducible chemical definition satisfies the physical coverage and continuity requirements.
Its useful regions are reachable through the allowed affinity/offset machinery, not isolated
pixels on a heatmap. Remove rejected experimental formula implementations from the runtime;
preserve their rationale in the decision record. Actual affordable use is checked in milestone 3.

## Milestone 2: replace the complete cell-environment chemical cycle

Implement this complete chemical cycle in the shared browser/harness kernel:

```text
sources -> extracellular mixtures -> transport -> intracellular reactions
        -> usable energy and construction -> export/death -> extracellular mixtures
```

Implement active tile/species storage, finite local source mixtures and renewal, priming,
source expiry, washout, diffusion, impedance and membrane stress. Define canonical reductions,
shared snapshots and resource-limit behavior. Verify material and potential-energy ledgers through
every boundary flow. Test diffusion against constant-field invariance and an isolated pulse's
analytical spread before periodic wrap; repeat at dt, dt/2 and dt/4. Add a uniform washout case
with the known exponential loss and an impedance discontinuity with conservative face transport.

Measure empty, patchy and widespread mixtures early. Positive diffusion and exponential washout
do not guarantee permanently sparse support. Do not discard trace species without an explicit
reviewed error policy; a storage optimization cannot silently become an extra ecological sink.

Implement fixed machinery genes and actual stocks, receptor gain and baselines,
energy-funded import/export, internal inventories, unary enzymes and generic biomass conversion.
Resolve shared material, capacity and energy requests before committing them. Products cannot
cascade through enzyme iteration order; prospective export cannot manufacture import headroom.
Add accounting checks for exergonic, endergonic, isoenergetic and biomass/decomposition cycles.

Integrate the resolved sensor/action contract, private RNN state, paid plasticity, birth-local
assimilation, physical mutation, body geometry, maintenance, repair, local reproduction and death.
Keep ploidy/transmission/reproduction policy boundaries. Define how a newly inherited or transferred
slot becomes expressed without a free material grant; optional lifetime transfer must not silently
retarget installed chemistry outside the declared development rule. Remove named chemical pathways
as their replacements integrate, retaining one production kernel. Carry the internal mixture
through volume, storage limits, repair, division and death; a scalar compatibility reserve must
not survive as a second material source. All usable chemical energy must follow the selected
reaction/construction laws, with no automatic old catabolic fallback.

Replace the old fields, A/B processors, weapon/builder/photo stocks, named release actions,
chemical-specific accounting and their configuration/schema branches together with this cycle.
Remove the old toxin/matrix binding and carbon/oxygen pathways rather than leave them disabled
inside the new kernel. Adapt motor budgeting so it no longer relies on the old secretion module.
Preserve mechanical contact and local funded placement independently of chemical categories.

Integrate the new incompatible checkpoint shape, conservation validation and basic recovery
round trip now, including chemical definitions, mixtures, machinery and private state. Add enough
cell/field inspection and typed flow observations to trace actual transfers. These are part of
making the replacement reviewable. Do not defer them to a later integration project.

Exit: the shared runtime can execute and restore a complete funded cell lifecycle. A diagnostic cell can
sense local chemistry, request import/reaction work and build material with correctly traced
resources. A source-free control must distinguish sustained acquisition from bootstrap reserves.
The production dependency path contains no old chemical economy or compatibility mode. Before
leaving the milestone, account for every displaced module and state field as replaced, removed
or retained for a specific nonchemical responsibility. Passing through new wrappers is not removal.

## Milestone 3: validate the required physical opportunities

Adapt the necessary existing short-assay fixtures alongside the replacement and use diagnostic
RNNs with actual funded bodies. Before each
case, register the question, competing explanation, conditions, predicted causal chain, numerical
observables, tick/wall budget and decision the result can change. Freeze random mutation, private
learning and inherited learning explicitly for mechanism isolation. Inspect individual probes
before adding small paired populations.

Cover the physical opportunities in Appendix A.6 with focused cases, reusing a case where it
answers more than one question:

| Opportunity | Decisive comparison |
| --- | --- |
| Substrate-dependent returns | Swap source chemistry for cells with different funded import/enzyme allocations; trace input, costs, usable energy and construction |
| Stress and differential compatibility | Match exposure across membrane coordinates; include producer self-exposure, repair and a detoxifying transformation |
| Cross-feeding | Track donor-generated intermediate to recipient uptake and benefit; disable donor export and recipient processing separately, without supplying the intermediate directly |
| Barriers and degradation | Measure movement and diffusion through paid high-I/low-D accumulation; compare maintenance stopped, washout and a capable importer/transformer that reduces impedance |
| Detectable emissions | Follow paid release through concentration, receptor activation and changed RNN action; sender/receiver benefit is a separate communication claim |
| Corpse-resource capture | Release a known inventory/body, compare ordinary capture against an uptake-disabled control, and separate killing from obtaining the released matter |

Tune physical scales using measured flux, work, stress, transit and construction, changing one
causal mechanism at a time. Test local parameter sensitivity around the selected values so a
claimed opportunity is not just a single finely tuned fixture. Fix the small comparison set and
its budget before execution; expand only if an unresolved result can change the choice.

In particular, check whether energy capture repays import and machinery costs, whether affordable
secretion outruns diffusion/washout enough to impede motion and transport, whether a cell can
actually access and degrade that accumulation, and whether compatible producers can tolerate
their own exposure without gaining universal protection. These coupled physical requirements
select useful coefficients; correct individual formulas alone cannot establish them.

A failed core opportunity requires diagnosis and either correction or an explicit design revision;
it cannot disappear from the report. The tests do not require evolved cooperation, a toxin cycle,
multiple lasting species or any chosen endpoint community. Mutation discovery and continuing
ecological history remain open for the user's observation.

Exit: required opportunities have causal evidence and stated limitations, and failed physical
links have been fixed or returned for explicit design revision. No special fixture-only physics,
automatic phenotype selection or hidden resource grant remains to make a check pass.

## Milestone 4: complete product integration and audit removal

Port experiment questions and their tooling to the validated substrate. Do not reproduce old
mechanisms behind renamed chemical constants or convert historical observations into new results.
Before changing a study, read its fixtures, registration, reports and corrected findings. Maintain
a migration checklist with a new command/fixture, validation result and any intentionally lost
capability for each active experiment.

| Appendix experiment family | New expression and validation responsibility |
| --- | --- |
| Food access, capability, zones and epochs | Generic source mixtures and funded transport/enzyme differences; preserve spatial/time interventions while accounting separately for supplied matter and potential energy |
| Toxin producer/resistant/sensitive | Paid synthesis/export, stress, membrane compatibility, ordinary repair and local range; no required three-way coexistence |
| Matrix/traversability | Impedance accumulation, movement and diffusion effects, upkeep and chemical degradation; binding is explicitly absent |
| Neutral signaling | Costed detectable chemistry with causal sender/cue/receiver comparisons; no dedicated signal species or automatic following |
| Element cycles and metabolic guilds | Source-powered metabolic chains and cross-feeding; generic light input stays deferred, with no named carbon/oxygen physiology |
| Family chemistry | Emitted coordinate and membrane compatibility, with measured exposure and ancestry observations; no family identity in physics |
| Predation | Chemical injury, death, local release and ordinary resource capture; no direct prey-yield transfer |
| Sharing/cooperation | Export/import and recipient benefit, including donor costs and exploitation controls; no automatic reserve equalization |
| Horizontal gene transfer | Port the optional mechanism and fixture to complete typed machinery alleles, expression/funding and donor/recipient provenance; keep default activation a separate world choice |
| Abiotic disturbance | Port local killing and mixing of generic mixtures, accounting source interventions explicitly; test material/species conservation and local recolonization opportunity |

Horizontal transfer is included here, rather than deferred wholesale as in the earlier draft's
first-world scope. It remains optional in the default but must have a chemistry-compatible
experimental path. Disturbance likewise remains available without mandatory default activation.
Multi-substrate reactions, chemical binding, extracellular catalysis, variable genome length and
nonchemical external energy stay deferred as specified by the proposal/appendix.

Cover all active entry points and their underlying cases, not only the main CLI: general runs,
capacity checks, ancestor/descendant and invasion comparisons, de novo evolution, causal/default
ecology, food-access/capability panels, spatial probes, continuation checks and separately invoked
study/batch/cohort tools. Read each body before assigning its migration disposition. Preserve
inherited-learning ablations, placement controls, per-case budgets and source provenance where
their research meaning survives. Archived ant training/certification is historical content, not
an instruction to restore the retired substrate.

Migrate fixture builders, configuration/CLI validation, sensor/action traces, generic resource
flows, genotype interventions, samples, comparison summaries, ledger writers and report readers.
Version new evidence and distinguish it from historical records in shared reporting. Old saved
genotypes stay historical; new comparisons require new-schema organisms. Preserve the corrected
share denominators and uncertainty rather than reviving count-based coexistence claims.

Validate new experiment paths with bounded fixture/command checks and selected causal cases from
milestone 3. Making a long-run command functional does not authorize running every historical campaign
again. Every active path must have a migrated implementation or an explicit appendix-supported
deferred replacement; no silent omissions based on a file name or an old status field.

### Observation, durability and the starting world

Finish the U/D/I/S atlas, machinery-target overlays, selected chemical and aggregate field
views, internal/external mixtures, compatibility/stress, capacity, effort and actual flux/cost
inspection. Replace A/B-specific summaries with labeled inherited machinery and observed phenotype
views. Retain spatial groups, founding uncertainty, ancestry, dispersers and the world/population/
cell zoom hierarchy. Preserve independent controls and test observer non-interference.

Extend milestone 2's working persistence to full product recovery and accumulated-state checks.
Verify the resolved chemical definition, mixtures, sources, genes, installed machinery, private
state, ledgers, random streams and complete parentage. Compare exact continued ticks after restore. Exercise
failed writes, retention, storage limits and the UUID fallback. Measure sparse through dense
chemical loads alongside accumulated ancestry using synthetic fixtures, including snapshot,
compression, restoration, memory and rendered responsiveness. Resource-limit pauses must not
destroy the current state or the last good recovery point. State remaining browser suspension
and endurance limits accurately.

Select finite source composition and release, washout, base viscosity, resource-density
variation, distances and founder funding together. Use short resident/transit/empty controls to
establish useful movement and local paid survival. Start at least two separated colonies with
the same ordinary mutable founder genotype; do not seed diagnostic roles or an evolved winner.
Have the user review motion, open space, population legibility and zoom behavior. A development
server requires an explicit request; headless counters cannot substitute for human motion review.

Update current runtime/controller/body contracts, calibration, experiment instructions, indexes,
agent guidance and changelog to implemented behavior. Preserve old studies and raw evidence with
their original provenance and corrected conclusions. Resolve or carry forward remaining work
explicitly. Run required CI and the production build after code changes, and record what was
actually measured. Close the implementation plan only after all required work and human review
are complete; days/weeks ecological success is not a completion criterion.

### Removal audit and definition of done

The migration is incomplete until the superseded implementation is gone from active code and
interfaces. Audit by responsibility and dependencies, not just by searching for old names:

- Remove old chemical modules and branches, redundant field/stock definitions, alternate
  accounting paths, unused imports, obsolete constants and dependencies introduced only for them.
  Reused files must contain the new rule or an identified retained responsibility, not a dormant
  copy of the old mechanism.
- Remove obsolete configuration toggles, codecs, checkpoint allowances, UI controls and labels.
  Reject retired options explicitly where necessary; never accept them as ignored settings.
- Replace old-behavior fixtures and tests with checks of the new physical contract. Port active
  experiment builders, commands, batch/cohort tools and reports, or retire an unsupported path
  with the appendix's specific reason. Do not retain an executable old engine to keep tests green.
- Check browser and harness entry points against the same kernel and schema. Exercise migrated
  controls, commands and exact continuation; inspect the source dependency paths to confirm
  that wrappers or disabled flags cannot invoke the old economy.
- Preserve immutable historical results and clearly scoped historical report readers as evidence.
  They may interpret old data but must not advance an old simulation. Git retains the retired
  implementation; it does not need a compatibility runtime in the working product.
- Update current docs and instructions to what actually landed. Archived claims remain labeled
  by their original version; no stale work order or old parameter contract governs the new world.

Exit: new physical behavior and product operation pass their checks, all appendix content has a
disposition, and the removal audit identifies no remaining executable old chemical pathway.
Record meaningful operational limits and obtain human visual acceptance. A clean build alone
does not establish physical fidelity; successful probes alone do not establish complete removal.

## Evidence and execution discipline

Each phase records source identity, resolved settings, checks run, negative results and the
decision reached. Keep formula tests, property-space validation, constructed opportunities,
new inherited-variant evidence and operating measurements separate. Store generated artifacts
locally; use the existing ledger/reporting path for executed assays. No hosted artifact service
or replacement observability pipeline is needed.

Select small, declared numerical and causal tests that can falsify a formula or opportunity.
Do not expand seeds, horizons or experiment combinations simply because outcomes look sparse.
The finished product is a coherent substrate and observable starting world whose future remains
unresolved, not a supplied history proving that evolution has already done what the user hopes
to watch.
