# Open questions and deferred features

This backlog serves [hypothesis-led world design and days/weeks observation](design/README.md).
Historical ant queues and completed outcome-gate roadmaps are not pending prerequisites.

The implemented candidate is [sparse spatial ecology and long observation](design/spatial-ecology.md):
the world and movement economy changed together with spatial population observation. Viscosity,
food density and geometry remain adjustable. The first irregular patch arrangement is a
revisable hypothesis; the enduring goal is a large, uneven world with capable movement and legible
local populations. Implementation phases and acceptance live in that design document.

<a id="backlog-plan-carryover"></a>

## Requirements migrated from earlier plans

The [September 13 closeout](design/plan-closeout.md) accounts for every unfinished phase of the
three remaining ant plans and all skipped phases in closed plans. Obsolete certifications and
training campaigns are retired without claiming success. Surviving work has these dispositions:

| Requirement | Owner and condition |
| --- | --- |
| Movement, food lifetime and body/controller coordination | Spatial design phases 1–3. Compare useful displacement, local sensing, travel expenses, food access and funded reproduction; earlier failed motor contests do not justify resuming their conditional invasion/discovery campaigns. |
| Uneven renewal and temporary resource opportunities | Spatial landscape design. Consider local variability, including the earlier boom/bust proposal, only when it creates a useful opportunity. No required synchronized global schedule. |
| Distinguish inherited benefit from drift or initial advantage | Conditional diagnostic after a live observation or configuration question warrants it. Record candidate choice, inherited target versus actual body, matched ancestor/descendant or reversion controls, initial denominators and uncertainty. No standing multi-seed evolution certification. |
| Heritability, mutation load and effective population | Optional instruments if they answer a concrete question. Define estimands for clonal reproduction, overlapping generations and the sampling interval before presenting them; do not copy ant-colony estimates or equate genome count with useful diversity. |
| Observable demographics, ancestry and trait change | Spatial design phases 4–6. Preserve births, deaths, lineage shares and inherited/body distinctions alongside spatial founding, movement, mergers and losses. Follow descendants even when a viewing group changes. |
| Durable continuation and measured execution costs | Spatial design phases 1, 2 and 6 plus the runtime limits below. Measure spatial field cost and accumulated history. The old shared-Wasm inference pool and isolation headers are OBE under ADR 0019; coherent execution placement remains a measured design choice. |
| Honest motion review and handoff | Spatial design phases 3, 5 and 7. Diagnose actual sensing/action/physical paths, retain negative results, preserve independent UI controls, run CI and obtain human trajectory review. Old missing visual evidence remains missing. |

These are design obligations or conditional questions, not authorization to run all listed assays.
Mating, seed/fertilize and multi-parent ancestry remain conditional extensions below; the retired
ant admission sequence and roughly 2,000-worker gate impose no new prerequisite.

<a id="backlog-evolutionary-questions"></a>

## Evolutionary questions

The next design decision is a coherent world to observe. For each candidate mechanism, state its
ecological purpose, existing proof point, competing explanation and smallest missing test. Select
settings on those grounds, not by the number of clusters produced in a long run.

- Local resource differences and residency can make food-processing choices matter. The A/B halves
  and thick medium were earlier defaults; local renewal sites and viscosity 0.004 now replace them.
  Symmetric recycling has already replaced the old B-only return.
  The question is how much environmental structure suits the observation world, not how to complete
  another A/B certification campaign.
- Bodies repeatedly evolved smaller and less costly in recorded studies. Determine whether this
  reflects a plausible economical strategy or a structural lack of situations that repay size and
  machinery. Do not impose a size cost solely to stop the observed outcome.
- Toxin, immunity, defense, repair and matrix interact. Binding may shield competitors as well as
  builders. Damage-related feeding may change that balance. A short benefit/cost comparison is
  more useful for choosing settings than requiring hunter/prey or producer/resistant/sensitive roles.
- Light fixation and gas exchange offer an additional material route. Current simplified settings
  differ from the evolution study; use a small physiological check if considering activation.
- Sharing, typed toxin, transfer and disturbance have implemented physical effects. Their named
  ecological roles remain uncertain. The [corrected analysis](analysis-correction.md) withdraws
  the claimed coexistence passes; it does not make those mechanisms useless.
- The neutral signal remains quiet in the recorded arms. Cost, weak founder output and missing
  receiver behavior are competing explanations; no causal diagnosis has selected among them.
- Paid acquired-weight transmission exists, but its adaptive usefulness remains uncertain.
  It need not be proved broadly before user observation; investigate only if it changes a design
  choice or explains an observed limitation.
- Food epochs are selectable and have recorded environment-dependent inherited benefits. They
  are another way to vary opportunities, not a requirement to evolve permanent specialist factions.

Existing negative results limit their exact hypotheses. Do not turn every unresolved mechanism
into a required experiment or keep tuning until a desired role appears.

<a id="backlog-conditional-extensions"></a>

## Conditional extensions

These are unimplemented choices requiring a reviewed purpose and design:

| Extension | Missing decision |
| --- | --- |
| Outcrossing, seed/fertilize and multi-parent ancestry | Local lifecycle, costs and durable parentage |
| Environmental developmental reaction norms | Which local pressure changes construction and what pays for it |
| Evolvable mutation machinery or neural topology | A demonstrated representation or variation limitation |
| Physical adhesion | Attachment, detachment, forces and costs; reserve sharing alone adds none |
| Dormancy or additional life stages | An opportunity current physiology cannot express |
| Additional resource species or microclimates | A useful pressure beyond the current material, gas and food mechanisms |

Contact injury, predation, typed toxin, gene transfer, reserve sharing and local disturbance are
already implemented optional mechanisms. Their existence is distinct from demonstrated kin
recognition, cooperation or strategic roles. No new feature is justified solely by an inactive label.

<a id="backlog-runtime-and-observation-limits"></a>

## Runtime and observation limits

Days or weeks of user observation is an intended use, not currently verified unattended operation.
A durable design must preserve the ongoing world and enough of its history to understand change.
The implementation and remaining operational checks are separate from ecological experiments:

| Requirement | Current implementation and gap |
| --- | --- |
| Continue after interruption | Six automatic and two manual compressed recovery points, plus file export; transactional retention tested with emulated IndexedDB. Actual browser termination, quota and suspension behavior still need review. A new session starts at tick zero; restore is explicit. |
| Bounded storage and memory | Complete ancestry compacts into numeric pages; default limit two million records, with safe pause. Recovery caps are 256 MiB total and 192 MiB per uncompressed checkpoint. Synthetic accumulated-state costs are measured; browser peak memory and an archive beyond the limit remain open. |
| Preserve observation | Browser checkpoints retain 240 thinned spatial frames, 2,048 recent events, 240 chart samples and a short recent window. Dropped events are counted. Complete replay and unobserved history remain unavailable. |
| Sustained execution | Bounded timers replace animation-only stepping on the main thread. Background throttling and sleep can still stop execution. Days/weeks responsiveness is unverified. |
| Useful throughput | The 500-tick default and 100,000/two-million-record synthetic fixtures are measured in the continuation record. Actual browser render/save responsiveness under accumulated load remains a human operational check. |
| Honest visual interpretation | Fixed inherited A/B colors and spatial regions replace requested trait clusters as the default map. Independent controls and zoom transitions are tested. The user accepted the current world after the startup and recovery fixes; future motion and legibility changes require human review. |
| Exact continuation | Preserve physical state, random streams, conservation, ancestry semantics and source provenance across saves and future performance changes. |

Design recovery, history retention and ancestry storage together, then validate their operational
properties proportionately. Do not discard scientific parentage silently to bound memory. Do not
add a backend, second simulation, or hosted storage without review. A small synthetic storage/load
test can assess durability without spending an ecological campaign on it.

Acceleration must retain one implementation per physical rule
([ADR 0019](adr/0019-single-language-kernel.md)). Worker placement and other runtime changes need a
measured bottleneck and coherent ownership boundary. The current implementation keeps main-thread
ownership; [continuation measurements](continuing-observation.md) state its limits.
