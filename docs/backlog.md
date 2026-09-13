# Open questions and deferred features

This backlog serves [hypothesis-led world design and days/weeks observation](design/README.md).
Historical ant queues and completed outcome-gate roadmaps are not pending prerequisites.

<a id="backlog-evolutionary-questions"></a>

## Evolutionary questions

The next design decision is a coherent world to observe. For each candidate mechanism, state its
ecological purpose, existing proof point, competing explanation and smallest missing test. Select
settings on those grounds, not by the number of clusters produced in a long run.

- Local resource differences and residency can make food-processing choices matter. The A/B halves
  and thick medium are implemented; symmetric recycling has already replaced the old B-only return.
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
This is the next operational prerequisite, separate from ecological experiments:

| Requirement | Current implementation and gap |
| --- | --- |
| Continue after interruption | Manual IndexedDB save/restore and file export exist. IndexedDB keeps one latest checkpoint; there is no automatic recovery checkpoint. A new session starts at tick zero. |
| Bounded storage and memory | Unreferenced genotype records are pruned, but organism ancestry grows with every birth and is serialized in full. Long-duration save sizes, memory and latency are unmeasured. |
| Preserve observation | Charts retain up to 240 thinned samples plus a short recent window in the opened view. They are not checkpointed; resuming cannot reconstruct earlier charts. |
| Sustained execution | The browser steps in its animation loop on the main thread. Background-tab behavior, device interruptions and sustained responsiveness have not been tested for this use. |
| Useful throughput | Short headless measurements do not establish browser performance after days of births. Measure at representative accumulated state, not only with a large initial census. |
| Honest visual interpretation | The map defaults to three requested trait groups, not a discovered species count. Its present strategy-panel wording still encourages a regional-cluster outcome; revise that UI interpretation with observation work. |
| Exact continuation | Preserve physical state, random streams, conservation, ancestry semantics and source provenance across saves and future performance changes. |

Design recovery, history retention and ancestry storage together, then validate their operational
properties proportionately. Do not discard scientific parentage silently to bound memory. Do not
add a backend, second simulation, or hosted storage without review. A small synthetic storage/load
test can assess durability without spending an ecological campaign on it.

Acceleration must retain one implementation per physical rule
([ADR 0019](adr/0019-single-language-kernel.md)). Worker placement and other runtime changes need a
measured bottleneck and coherent ownership boundary; none is selected by this documentation revision.
