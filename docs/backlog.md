# Open questions and deferred features

This backlog serves [hypothesis-led world design and days/weeks observation](design/README.md).
Historical ant queues and completed outcome-gate roadmaps are not pending prerequisites.

The implemented candidate is [sparse spatial ecology and long observation](design/spatial-ecology.md):
the world and movement economy changed together with spatial population observation. Viscosity,
food density and geometry remain adjustable. The first irregular patch arrangement is a
revisable hypothesis; the enduring goal is a large, uneven world with capable movement and legible
local populations. Implementation phases and acceptance live in that design document.

<a id="backlog-multicore-scaling"></a>

## Deferred multicore scaling

The user deferred multicore implementation on September 18. Preserve
[the shared-memory design and P0–P4 milestones](../SCALING-PLAN.md#multicore-design)
in paused Sulion plan `e3517c4b-b3df-4786-bcf4-10a488a294d1`.
Current work remains single-threaded. Ecology, persistent geography and directional climate
design proceed in [the spatial isolation review](design/spatial-isolation-review.md);
they do not depend on first implementing multicore execution.

<a id="backlog-cell-interactions"></a>

## Deferred cell interaction research

Added September 19 at the user's request; **not selected as the next work item**.
[Cell interaction research](design/cell-interaction-research.md) owns the design: useful
crowding/contact pressure, phenotype-dependent chemical harm, and paid recovery of a
neighbor's actual material. Start from current pressure, contact sensing, membrane
susceptibility and transport. Damaged-membrane access is a conditional extension if ordinary
injury/release cannot provide a useful return. No phenotype enemy labels, kill rewards,
dedicated combat economy or live changes accompany this entry.

Selection requires a budgeted small opportunity check; no implementation or campaign is
scheduled. This does not reprioritize environmental work or the multicore backlog.

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

- Source identity, local depletion and machinery allocation can alter returns. The first chemistry
  implementation's allocation probes showed a constructed reversal; evolved specialization remains open.
  Current short nutrition probes establish acquisition-funded reproduction, but do not establish
  founding at another patch. Diagnose cue/action/displacement and
  resource lifetime before interpreting this as impossible dispersal or extending a horizon.
- Economical bodies and broad metabolic machinery may outperform costly specialization. Preserve
  genuine size/maintenance tradeoffs; do not impose a cost solely to prevent an observed winner.
- The [resource-economy model and checks](design/chemistry/resource-economy.md) establish positive
  local budgets, source-dependent machinery returns and repeated reproduction at one finite site.
  A weak isolated site starves its resident. The revised 600-tick default has 26 divisions and
  no deaths; both starting colonies reproduce. Continued turnover, migration and adaptation remain
  open. Use local budgets and observed cues/actions to diagnose them before extending a run.
- Generic stress, compatibility, repair and impedance now replace named toxin/defense/matrix
  pathways. Paid barriers affect motion and diffusion. The tested degrader reduced material
  returned at death but did not improve alive-cell external clearance; uptake limits are a
  specific unresolved ecological opportunity.
- Export/import can support cross-feeding and detectable cues. The current donor paid a substantial
  cost; receiver benefit is not cooperation and a sensed emission is not communication.
- Optional typed gene transfer and disturbance are implemented. Local recolonization, persistence
  of unchanged traits under transfer and effects on diversity remain open.
- Light and nonchemical energy, binding, extracellular reactions and variable genome structure
  remain deferred by the chemistry design; old named mechanisms are removed, not disabled.
- Paid acquired-weight transmission exists; adaptive usefulness is a conditional research question.
  Preserve the earlier negative findings under their old physics.
- Generic source epochs/zones are available. Earlier A/B cohort benefits remain historical and
  do not prescribe permanent specialists or a new campaign.

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
| Nonchemical energy, binding, multiple-substrate reactions and variable genome structure | A measured limitation of the present 256-species unary chemistry; no parallel named pathway |

Chemical attack, recipient feeding and resource capture must use the generic shared substrate.
Optional disturbance and gene transfer remain available. Their implementation does not establish
recognition, cooperation or strategic roles.

<a id="backlog-runtime-and-observation-limits"></a>

## Runtime and observation limits

The [diagnostic continuity audit](design/chemistry/diagnostic-continuity.md) records restored genealogy,
recent behavior windows, founder-relative/sequence comparisons, population body/learning summaries,
source-epoch/task summaries and membrane phenotype history. These are now implemented through
bounded observations. Current operating limits and remaining acceptance belong to the
[reliability plan](design/chemistry/reliability-plan.md).

Days or weeks of user observation is an intended use, not currently verified unattended operation.
A durable design must preserve the ongoing world and enough of its history to understand change.
The implementation and remaining operational checks are separate from ecological experiments:

| Requirement | Current implementation and gap |
| --- | --- |
| Continue after interruption | Six automatic and two manual compressed recovery points, plus file export; transactional retention tested with emulated IndexedDB. Actual browser termination, quota and suspension behavior still need review. A new session starts at tick zero; restore is explicit. |
| Bounded storage and memory | Complete ancestry uses compact numeric records; default limit two million records, with safe pause. Recovery caps are 256 MiB total and 192 MiB per uncompressed checkpoint. A 30-minute browser fixture with 70 cells/100k ancestors retains stable GPU and WASM memory; peak costs under large ecological growth and an archive beyond the limit remain open. |
| Preserve observation | Browser checkpoints retain 240 thinned spatial frames, 2,048 recent spatial events and the current population census. Dropped events are counted. The kernel retains 512 ordinary events and up to 4,096 explicit interventions; reaching the intervention limit rejects further manual changes. Complete replay and unobserved history remain unavailable. |
| Sustained execution | A worker owns physics and rendering. One queued task yields simulation work; the main animation loop permits one unanswered presentation request. GPU completion fences bound outstanding frames. Background throttling and sleep can still stop execution. Days/weeks responsiveness is unverified. |
| Useful throughput | Current headless capacity reaches 224.0/61.3/35.9 ticks/s for 48/2,000/2,000-growth. Actual software-rendered browser observations reach 214/54/32.6 ticks/s with drawing and diagnostics. Growth has little headroom; cold save pauses and frame rates are separate measurements. See [current evidence](design/chemistry/reliability-results.md). |
| Honest visual interpretation | Fixed membrane-X colors and spatial regions describe current cells. Independent controls and zoom transitions are tested. The prior spatial world was accepted; digital chemistry still needs human motion and legibility review. |
| Exact continuation | Preserve physical state, random streams, conservation, ancestry semantics and source provenance across saves and future performance changes. |

Design recovery, history retention and ancestry storage together, then validate their operational
properties proportionately. Do not discard scientific parentage silently to bound memory. Do not
add a backend, second simulation, or hosted storage without review. A small synthetic storage/load
test can assess durability without spending an ecological campaign on it.

Acceleration must retain one implementation per physical rule
([ADR 0020](adr/0020-complete-rust-kernel.md)). A worker owns the complete Rust/WASM kernel and
OffscreenCanvas renderer; [continuation measurements](continuing-observation.md) state its limits.
