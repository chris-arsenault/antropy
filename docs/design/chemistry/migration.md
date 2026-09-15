# Chemistry migration requirements and proof points

Status: requirements retained during implementation. The [implementation plan](implementation-plan.md)
supersedes the original sequence below; [migration audit](migration-audit.md) gives actual dispositions,
[decisions](decisions.md) resolves formulas and [validation](validation.md) records new evidence.

## Current evidence and boundaries

Review used the complete supplied proposals, current world/controller/body/ecology contracts,
the current interface, accounting and reproduction code, and the
[September 13 analysis correction](../../analysis-correction.md). Individual historical experiment
artifacts were not re-audited for this design. The appendix's experiment summaries are provenance
and questions to retain; they are not new evidence for generic chemistry.

At design review, the runtime had 35 inputs, 24 recurrent units, eight outputs, nine funded body stocks,
ten physical loci and checkpoint v8. It contained explicit A/B, toxin, signal, matrix and optional
element-cycle rules. It also has two starting colonies, spatial observation, complete parentage
and bounded compressed recovery. The new chemistry must replace the relevant owners in the shared
kernel, not run beside a second named-chemical economy.

The corrected rare-start results describe historical endpoint changes, not completed coexistence
certifications. Preserve the distinction among a physical effect, an expressed behavior, a
conditional payoff and an evolved inherited advantage. Neither the old strategy counts nor every
ecological interpretation in the appendix becomes a new acceptance requirement.

## Replacement dispositions

These requirements are implemented or explicitly deferred as recorded in the migration audit.

| Current system | Proposed disposition |
| --- | --- |
| Food A/B, processing, stored nutrient and catabolism | Replace with generic source species, paid import, internal inventory and enzyme energy conversion. Generic assimilation builds material; no automatic reserve-to-energy shortcut. |
| Finite deposits and priming | Keep finite local inventory, release and accounted renewal; represent composition as sparse species mixtures. Release expired stock unchanged under the proposed boundary rule. |
| A/B zones and epochs | Express spatial/time-varying source mixtures. Record material and potential-energy budgets separately; preserve existing dissolved inventory during transitions. |
| Chemical sensor groups and release actions | Replace with fixed receptor blocks, per-slot transport effort and constitutive funded enzymes. Replace chemical-specific learning modulators too. |
| Toxin field, synthesis, typed toxin and tint | Replace with ordinary high-stress chemistry, synthesis/export and membrane compatibility. No toxin-family identifier or special immunity grant. |
| Universal defense stock | Retire under this proposal; retain ordinary repair, avoidance, compatibility and internal chemical processing/export. Reconsider extra physiology only for a measured limitation. |
| Contact toxin injury | Retire dedicated chemical contact damage. Low-diffusion compounds can create local exposure; normal mechanical contact remains. |
| Porous matrix and solid matrix mode | Replace chemical drag and transport effects with continuous impedance. No categorical chemical wall state or privileged producer passage. |
| Matrix toxin binding | Defer chemical binding; impedance changes transport but does not sequester another compound. Treat the lost binding behavior explicitly in protection tests. |
| Neutral signal field | Remove dedicated neutral field/action. Any emission sensed by a receptor may carry information; useful communication remains unestablished. |
| Carbon, oxygen and light harvesting | Remove named carbon/oxygen physiology and photo stock from the new chemical schema. Defer generic external nonchemical energy input; chemical potential arrives through sources in v1. |
| Membrane acquisition crowding | Do not port the A/B/photo-specific formula. Account generic installed stock, transport conductance, storage, work and maintenance first; added crowding needs a measured reason. |
| Predation yield | Remove direct death-to-neighbor rewards. Killing, local corpse release and capture are distinct physical events with no killer identity in allocation. |
| Reserve sharing | Replace contact equalization with paid export/import. Cross-feeding, benefit to relatives and exploitation are possible outcomes, not delivery rules. |
| Decomposition and detritus | Release internal species unchanged and convert built matter to one configured decomposition species at death. Immediate body conversion is a proposed simplification; no named detritus pool in v1. |
| Repair, movement, contact and body geometry | Preserve embodied, paid local physiology; adapt stocks, volume, stress and impedance. Retune coefficients when physical opportunities change. |
| Gene transfer | Implemented optional mechanism, off by default. Transfer uses complete typed machinery alleles with explicit funded expression and durable provenance. |
| Abiotic disturbance | Keep optional local killing and material-conserving mixing, off initially. Mixing visits generic mixtures and preserves each species and source inventory unless an explicit source intervention is configured. |
| Haploid/diploid, clonal/selfing, fission/budding | Preserve policy boundaries and funded lifecycle. Version new slot expression/recombination rules; no outcrossing, seed/fertilize or genome-length evolution. |
| Paid private learning and inherited assimilation | Preserve semantics, replace named chemical modulation and version controller state. No free inherited stock or duplicated trace assimilation. |
| Spatial groups, ancestry and history | Preserve observer-only grouping, continuity and event uncertainty. Replace A/B-specific trait summaries; do not replace physical population regions with chemical clusters. |
| Checkpoints, local recovery and export | New incompatible schema with exact chemical/genetic state; reject old saves without inventing chemistry or ancestry. Preserve local-only persistence and transactional recovery behavior. |

## Proposed implementation sequence

The user chose implementation; the four-milestone implementation plan supersedes this original six-step outline. Each phase should leave
concrete evidence and a stated limit. A phase's completion is not certification of an ecosystem.

| Phase | Deliverable | Check that can change the next decision |
| --- | --- | --- |
| 1. Chemistry definition and accounting | Versioned property generator, validation, generic amounts/energy and balance ledger | Property combinations exist; reflection, reaction and biomass/death cycles cannot create matter or energy |
| 2. Spatial chemical economy | Sparse fields, conservative diffusion, finite sources, washout, impedance and stress | Spatial flux and exposure are correct; storage growth and transport cost fit a declared runtime budget |
| 3. Funded organisms and inheritance | Fixed slots, controller contract, paid transport/metabolism/construction, birth/death and codecs | An authored cell senses and pays for a complete acquisition-to-construction chain; mutation grants no stock |
| 4. Migration and small causal checks | Replace named owners in the shared runtime, port relevant fixtures and adapt observations | A selected set of claimed opportunities has its missing physical/behavioral link checked; disabled/deferred mechanisms are explicit |
| 5. Starting world and continuing observation | Coherent sparse default with at least two colonies, chemical inspector/map views, retained history and recovery | Startup, motion, exact restoration and accumulated-state responsiveness are checked; human visual review occurs |
| 6. Documentation and handoff | Update governing contracts/indexes/changelog to actual implementation; record constants and limits | Required CI passes; remaining ecological and endurance questions are explicit; user receives an unresolved world to watch |

Intermediate modules may be exercised by bounded tests, but there is one production chemistry
and one browser/harness kernel at cutover. Do not offer permanent A/B compatibility mode or a
checkpoint adapter that guesses what old machinery should mean. Keep old implementation and
historical evidence recoverable through Git.

## Bounded invariants

Use ordinary tests for deterministic mechanics and integration boundaries:

- Encode every species byte; verify corner/edge reflection, local mutations, fixed genome length,
  whole-slot inheritance and explicit categorical expression.
- Reproduce property tables and generation rejection from the same definition; reject invalid
  coverage, ranges, coefficients, versions and table disagreement.
- Conserve species amounts across transport and diffusion; conserve total matter across reactions,
  repair, growth, death and division. Verify energy balance for uphill/downhill/isoenergetic
  reactions, capped energy storage and a chemical-to-biomass-to-corpse cycle.
- Check exact first-order washout against its analytical amount and energy loss, including species
  with different U; verify source priming, release, expiry and renewal are counted once.
- Limit simultaneous uptake by shared supply, headroom, work and conductance; shared substrates
  cannot be consumed twice. Swapping cell or slot traversal order must not grant earlier consumers
  privileged supply or same-tick reaction products.
- Check zero-funded receptor gain, local body-relative contrasts, newborn baselines, internal and
  external stress, compatibility tradeoffs, damage and paid repair.
- Restore all sparse inventory, actual machinery, baselines, private learning, source state,
  random streams and ancestry, then reproduce the same next ticks. Verify observers do not change
  chemistry, controller state or randomness.
- Preserve transactional recovery after failed writes, missing `crypto.randomUUID` support,
  retention limits and visible resource-limit pauses. Fail incompatible old saves explicitly.

These tests establish implementation properties. They do not show a lineage discovered a pathway,
maintained a barrier, communicated or adapted.

## Constructed proof points

Before executing a case, register its question, competing explanation, initial conditions,
expected causal chain, decision, tick/wall budget and stopping rule. Reuse `QuickScenario`/`runQuick`,
the common controller/physics and existing evidence ledger. Use hand-authored diagnostic genomes
and explicitly freeze mutation, private learning and inherited learning as the question requires.
Begin with hundreds of ticks; use paired populations only when individual flux/exposure traces
leave a population-dependent question. Do not run this whole table automatically.

| Opportunity or risk | Small differentiating check | Relevant observation and limit |
| --- | --- | --- |
| Bootstrap metabolism | Same cell and source with functional versus inactive import/enzyme, holding initial resources fixed | Local receptor reading, uptake charge, potential drop, net usable energy, construction and survival; no fallback or initial-energy-only explanation |
| Conditional substrate access | Swap two source mixtures and compare focused versus divided machinery with funded costs declared | Differential net return under changed context; generic growth alone does not establish a specialization tradeoff |
| Cross-feeding | Donor exports an intermediate; recipient uses it. Compare export off and recipient processing off, without separately supplying that intermediate | Track donor-derived material to recipient energy/growth; distinguish facilitation from reciprocal cooperation and subtract direct access to primary sources |
| Stress and compatibility | Equal exposure for two membrane coordinates, including internal synthesis; compare ordinary repair or transformation | Exposure, damage, self-harm, work and survival; nearby compatibility must not become global immunity |
| Impedance and degradation | Finite high-I/low-D deposit; compare empty region and a cell that can import/transform/export it | Changed movement and diffusion, paid removal and measured impedance reduction; an enzyme in a genome is not proof it can reach an obstructing compound |
| Detectable emission | Paid emission plus a receptor-driven RNN response; remove emission or disconnect the responding channel | Actual sensor level/gradient and changed action; communication requires a separate sender/cue/receiver/benefit comparison |
| Corpse capture | Same local death with a nearby capable consumer and an uptake-disabled control | Material/potential released, access, cost and captured benefit; no reward routed directly to a killer |
| Transit and colonization opportunity | Residents, reachable opportunity and unaffordable empty transit under the candidate landscape | Travel time, energy expense, local acquisition and paid birth; intended heading in a fixture is not evolved navigation |

If a result fails, report whether the physical opportunity, sensory signal, controller expression,
cost recovery or inherited variation was missing. Do not silently extend the horizon or select
new seeds until a favored role survives. Useful evidence can be negative and can justify revising
one mechanism, reducing scope or leaving a behavior for future observation.

The reusable food-access runner currently uses short registered budgets; new chemistry fixtures
must register their own justified budgets. Historical horizons, source genotypes and final counts
are not binding parameters for this redesign. No long mutation-discovery or coexistence campaign
is needed to implement a general substrate.

## Observation and endurance

Retain the visual hierarchy ecosystem -> spatial population -> individual cell. At world scale,
show occupied regions, empty gaps, visible dispersers and optional selected chemical or aggregate
physical-property layers. At close zoom, show actual cells and local material/exposure. Four 16 x 16
heatmaps explain U, D, I and S; overlay selected machinery targets and membrane coordinates.
These chemistry maps are explanatory UI, not additional controller inputs.

Replace the default A/B color meaning with an explicitly labeled inherited machinery view,
proposed initially as membrane-coordinate color with fixed chemical-space axes. It describes
one inherited trait, not metabolic role or kinship. Preserve separate ancestry inspection and
offer actual uptake/reaction/export observations for phenotype comparison. A descendant can
change chemistry without losing its recorded origin. Observer colors and field layers remain
independently controlled; history labels distinguish inferred founding from observed births.

Persist complete chemical definitions and active field blocks, all internal mixtures, slot genes
and funded stocks, controller/plasticity schema, sources and accounting. Continue to retain complete
organism parentage and versioned bounded spatial/chart history. Record genotype payload pruning
honestly: a retained ancestral ID does not imply an available ancestral metabolic genome.

Current recovery has six automatic and two manual compressed points within 256 MiB and a 192 MiB
uncompressed checkpoint limit. The current ancestry ceiling is two million records. These are
starting constraints to measure against, not evidence that generic chemistry fits. Measure empty,
patchy, widespread and dense-species fields separately from synthetic accumulated parentage.
Record step, snapshot, compression and restore time, process memory and encoded size. Do not run
weeks of evolution merely to manufacture a large storage fixture.

If a valid physical state exceeds a budget, pause visibly before losing state and preserve the
last good recovery point. A larger state shape may require a different encoding or budget before
handoff; changing limits must be explicit. Main-thread timers cannot bypass device sleep or
browser throttling. Passing short restoration tests is not days/weeks browser endurance evidence.

## Deferred extensions and open calibration

Keep multi-substrate reactions, cofactors, inhibition, chemical binding, extracellular enzymes,
passive permeability, evolvable affinity width, variable slot counts, genome rearrangement and
generic light/other nonchemical energy input deferred. Preserve their research questions without
adding parallel infrastructure preemptively. A specific missing causal opportunity should justify
an extension to the shared substrate.

The decision record resolves four slots per class, neural mapping, biomass/decomposition energy,
internal stress and versioned physical scales. Registered small checks test the complete cycle and
physical opportunities. Current default transit, throughput and human motion review remain limits.
The review question is whether these rules offer a credible first substrate, not whether their
eventual ecosystem can be predicted in advance.
