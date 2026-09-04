# Ladder certification ledger

This file tracks ladder status under the [operating principles](ant-sim-principles.md).
[Appendix E](ant-sim-appendix-e.md) is the current plan; Appendix D is completed diagnostic
evidence. Every green row names executable evidence. A contradiction with a written pass
condition stops the current ladder; measurements outside that condition remain visible without
silently becoming additional gates.

## Appendix E — current colony-loop ladder

| Step  | Status      | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | green       | `scenarios.test.ts` compares every authored air/cavity voxel with the programmed blueprint after occupant placement; `programmedNest.test.ts` records a connected graph with horizontal, vertical, and sloped passages, branches, joins, and cycles without an uninterrupted central shaft, and verifies across six terrains that only the designated entrance aperture reaches the surface                                                                                                                   |
| 2     | green       | `config.test.ts` isolates `terrainDigging`, `workerReproduction`, `colonyFounding`, and `geneticVariation`; `checkpoint.test.ts` round-trips the gates and cargo capacities; `EffectiveConfigPanel.tsx` renders the running values                                                                                                                                                                                                                                                                            |
| 3     | green       | After the surface-breach repair, sensor-limited Oracle runs 1035–1044 complete exit, surface pickup, homing, re-entry, and underground deposit in 10/10 untouched worlds. Nest-odor shape remains descriptive harness output rather than a Vitest outcome gate                                                                                                                                                                                                                                                |
| 4     | green       | After the surface-breach repair, runs 1035–1044 create an underground FOOD cache, drain it under imposed scarcity, and conserve food mass in 10/10 untouched worlds. Destinations vary and are recorded rather than asserted                                                                                                                                                                                                                                                                                  |
| 5     | in progress | The installed economy remains unchanged, and the repaired programmed colony is positive in 10/10 new 2,500-tick worlds (runs 1045–1054): median balance `+119.445`, worst `+76.325`, with physical caches in every world. The current 1,200-tick control is also positive in 5/5 worlds with median `+114.967` (run 1251). Its recurrent cohort supports 0/4 because three controllers gather no food, not because the energy margin is narrow                                                                |
| 6, 8  | green       | The explicit controller competence list and bounded sensor/output assays remain valid; the repair changed fixture placement and programmed-policy sequencing, not the shared tuple                                                                                                                                                                                                                                                                                                                            |
| 7, 9  | in progress | Run 824 and outcome runs 833–851 were trained on the former breached geometry. They establish that full recurrent training can close the physical loop, but do not certify a controller in the repaired fixture                                                                                                                                                                                                                                                                                               |
| 10    | in progress | In the current fixture, long-context clones complete 7/20 unseen loops after 512 epochs and 8/20 after 2,048 (runs 1252 and 1258), but only one of four gathers any food in a full colony and none meet the energy-support gate (run 1251). Recovery trajectories, doubled hidden width, vertical-band loss, and persistent recurrent initialization all fail to improve completion (runs 1268, 1275, 1281, 1294, 1296). Fixed-panel outcome training overfits; a true fixed-budget stochastic ES run is next |
| 11–19 | unadmitted  | Initial RNN training has not yet placed a broad controller cohort inside the calibrated viable region                                                                                                                                                                                                                                                                                                                                                                                                         |

### Appendix E step-5 governing inequality

For a fixed window, the pass quantity is exact:

`colony energy balance = external surface-food energy - basal - sensing - thinking - movement - action costs`.

The former default gave the programmed controller only a `+1.823` median and supported 0/9 trained
controller snapshots (run 908). One-axis changes to food value, aggregate work cost, or signal cost
also supported 0/9 (runs 909–914). The selected interior scales food and tank energy together by
8, all active work costs by 1/8, signal cost by another 1/4, and maintained food density by 2.

Run 924 certifies those installed defaults on ten untouched worlds: all nineteen predetermined
controllers—seven distinct task-capable snapshots and twelve perturbations through sigma `0.06`—
are positive in at least six worlds. Run 930 repeats the fixed distribution on ten further unseen
worlds and supports 18/19, with positive-episode fraction `0.874`; the sole miss is one sigma `0.06`
sample. Higher gathering predicts higher balance in both cohorts. Run 931 separately checks the
programmed reference and baked RNN at the original 2,500-tick horizon; the reference is positive in
10/10 and the RNN in 8/10.

Run 929 rejected an attempted eightfold rescaling of the absolute energy unit. It supported only
12/19 on the exact worlds where run 930 supports 18/19 because colony transfer and stockpile terms
also consume absolute energy. The installed `2.4/8` food/tank scale is therefore retained as part of
the measured environment rather than treated as a cosmetic unit choice.

The environment is therefore no longer calibrated to a zero-crossing. Runs 1045–1054 confirm after
the authored-nest repair that the programmed reference remains positive in 10/10 new worlds, with
median balance `+119.445` and worst balance `+76.325`. The remaining open result is training width:
all recurrent-controller evidence in this section predates the repaired geometry and now serves as
historical calibration evidence. Raising surface food from 1,600 to 3,200 changed neither the old
clone's 6/13 support count nor its median ordering, while increasing harness runtime; that denser
point remains rejected.

### Appendix E step-4 finding — the authored nest had extra surface openings

1. **Observed contradiction.** The programmed cache policy completed only 1/5 new worlds in runs
   1001–1005 despite the step-4 certification. Failed ants returned below the local surface but
   spent only 2–5 loaded ticks there; three repeatedly deposited food outside the cache boundary.
2. **Mechanism.** The fixture placed every passage from the terrain height at one central column.
   On varied terrain, shallow passages intersected the surface elsewhere. The programmed mouth
   transition also treated one downward voxel—or downhill surface travel—as completed entry, so a
   loaded ant could reverse away from the entrance before traversing the covered passage.
3. **Minimal structural fix.** Place the network from the minimum terrain height across its
   footprint, connect it through a covered offset collar, and complete the existing fixed sequence
   of down-biased mouth-transition actions before cache search. The repair adds no sensor, action,
   route, destination, or simulation-side behavior.
4. **Cost.** Nest vertical positions and every generated sensor trajectory changed, invalidating
   old controller training and geometry-dependent ledgers. The fixture invariant adds six bounded
   world constructions to Vitest; long behavioral recertification remains in the harness.
5. **Decision.** Retain the sealed geometry and completed entrance transition. Runs 1030–1034 pass
   all former failure worlds; runs 1035–1044 pass 10/10 untouched cache/retrieval worlds, and runs
   1045–1054 retain large positive programmed energy margins. Retrain recurrent controllers from
   the repaired world rather than certifying old vectors around the change.

The repaired geometry also invalidated the old field-shape preflight. All 4,031 authored and
nearby surface-air candidates remain physically connected to the entrance, but 2,238 paths do not
increase in odor concentration on every voxel step because the final entrance transition crosses
a local concentration maximum. The shared vertical-band oracle traverses that transition and
completes the functional ledger in 10/10 worlds. The former strict-gradient Vitest was therefore
retired: it prescribed a carrier shape that Appendix E does not require and contradicted the
operating principle that colony function, not shape, is the gate. The field analyzer remains
available in the harness for descriptive diagnosis.

### Appendix E step-10 finding — teacher-trajectory loss does not predict a living controller

1. **Observed invariance.** Eight independent clones trained on the same oracle corpus produce
   tightly grouped held-out sequence losses (`0.116`–`0.129`) but only one viable controller
   (runs 932–941). Increasing epochs (942–947), using full-population demonstrations (948–953),
   weighting rare actions (954–967), selecting the best validation epoch (968–973), retaining only
   successful teacher worlds (974–979), extending recurrent chunks and training (980–985), and
   adding parameter noise (986–992) do not widen full-loop behavior. The last condition supports
   2/4 controllers energetically but completes only 3/20 held-out food-loop episodes—the same 15%
   completion fraction as the original eight-controller cohort.
2. **Mechanism hypothesis.** Sequence loss is measured on sensor histories generated by the
   programmed policy. A trained controller's small action errors change its subsequent world state,
   producing histories absent from that corpus; low teacher-trajectory loss therefore does not
   order closed-loop competence. Rare-action weighting changes local regression penalties but does
   not repair this state-distribution gap.
3. **Minimal structural fix.** Treat initial training as one reproducible two-stage procedure for
   every independent initialization: full recurrent cloning, then a fixed-budget closed-loop stage
   using the existing ordered milestones, common world seeds, mirrored samples, and rank-shaped
   updates. Evaluate every result, not the best result, on a separate untouched world set.
4. **Cost and risk.** The second stage spends substantially more harness time and can overfit its
   training worlds or collapse diversity. Fixed budgets, identical settings, independent starts,
   and cohort-wide held-out acceptance expose those failures; no sensor, actuator, world mechanism,
   or runtime fitness path changes.
5. **Decision.** Proceed with the user-approved clone-then-closed-loop training direction, but make
   cohort breadth—not recovery of one peak—the gate. Further supervised-loss knob sweeps stop here.

### Appendix E step-10 post-repair finding — fixed training worlds do not transfer

1. **Observed invariance.** With the repaired odor carrier, increasing clean sequence training from
   512 to 2,048 epochs lowers held-out imitation loss but moves unseen completion only from 7/20 to
   8/20 (runs 1252 and 1258). A single-world clone reaches `0.02674` loss after 9,434 selected
   epochs and still completes 0/1 in that same world (runs 1284–1285). Recovery-trajectory training,
   doubling recurrent width, and a vertical-band margin produce 3/20, 3/20, and 6/20 respectively
   (runs 1268, 1275, and 1281); all were rejected and removed.
2. **Mechanism hypothesis.** Teacher-forced error does not preserve the closed-loop action sequence,
   and local outcome search learns its evaluation panels rather than the world distribution.
   Checkpoint 1286 improves its optimization panel from 2/5 to 3/5, then falls from its parent's 2/5
   to 0/5 on untouched worlds in run 1288. A disjoint guard rejects every proposal in the same
   three-generation budget (run 1289). Drawing a new focus batch each generation admits checkpoint
   1291 at 3/5 on the guard, but on untouched worlds it completes 1/5 while its parent completes 2/5
   (run 1292).
3. **Minimal structural fix.** Stop the closed-loop search family. Test whether the randomized
   recurrent matrix itself prevents supervised training from retaining state: its current standard
   deviation of `0.03` gives a 12-unit matrix an initial spectral scale near `0.1`. Add a recorded,
   trainable diagonal retention prior to the offline initializer, leaving inputs, outputs, sensors,
   world resolution, and runtime behavior unchanged.
4. **Cost and risk.** A persistent initial recurrence can improve gradient transport, but it can also
   saturate hidden units or merely lower teacher-forced loss without improving closed-loop behavior.
   Compare it against the zero-retention control on matched data and random initializations, then
   judge the cohort once on untouched worlds. Remove the option if terminal coverage does not
   improve materially.
5. **Decision.** Reject and remove changing-world outcome training after run 1292. Test the recurrent
   initialization mechanism before spending more compute on either supervised epochs or outcome
   search. A lower loss alone is not acceptance.

### Appendix E step-10 finding — persistent initialization does not repair cloning

1. **Observed invariance.** The zero-retention single-world control reaches `0.05592` imitation
   loss but completes 0/1 closed-loop episodes (runs 1282–1283). With every other input fixed,
   diagonal recurrent retention of `0.9` reaches only `0.08100` and never exits; retention of `0.5`
   reaches `0.08189`, exits, and advances no further (runs 1293–1296).
2. **Mechanism hypothesis.** Near-identity recurrence does not solve the measured distribution gap.
   It makes this tanh network harder to optimize on the teacher trajectory, while the trained
   controller still enters sensor histories absent from that trajectory during closed-loop use.
3. **Minimal structural fix.** Retain the small randomized recurrent initialization. Run the
   approved closed-loop stage as stochastic evolution strategy training: draw a fresh common world
   batch each generation, apply the mirrored rank-shaped update without accepting or rejecting it
   on a reused guard panel, and judge only the fixed-budget result on untouched worlds.
4. **Cost and risk.** Unconditional stochastic updates can temporarily reduce performance and cost
   more simulation time than guarded local search. The fixed budget and untouched final panel make
   that cost explicit and prevent a repeatedly consulted validation panel from becoming training
   data.
5. **Decision.** Reject and remove the recurrent-retention option. The earlier changing-world run
   changed its focus worlds but still selected every update against the same five guard worlds; it
   was guarded local search, not the full distributional training procedure now required.

### Appendix E step-3 finding — vertical carrier resolution

The authored fixture now has an offset sloped entrance rather than a central vertical throat, and
its standing nest odor is computed over connected cavity distance. Those world-side changes make
outbound travel reliable: all ten controlled runs exit and reach food. Loaded return remains
unreliable under Appendix D contract v1. Directional scent samples remain in the yaw plane while
movement may select an up/down band. At the mouth and at vertical or sloped transitions, an ant can
observe a strong or saturated nest field without observing whether a downward step is the nest
opening or ordinary surface relief. Some runs orbit the mouth; others descend through unsensed
interior bands to the rock layer.

Three carrier regimes were measured: the production accumulator preserved reach but spread a
clipped plateau; an experimental concentration cap of 1 preserved gradients but collapsed homing
reach; a cap of 10 retained more reach but did not clear return parity and regressed the certified
step-10e brood cohort. Both caps were rejected. Sensor-history policies based on solidity, depth
change, mouth strength, deliberate vertical probes, and failed-action feedback also failed the
ten-seed gate. These are general observable transitions, not route coordinates, so their failure is
evidence that more threshold tuning is not the missing competence.

The shared actuator was also reconciled while diagnosing this gate: food, spoil, and brood now all
deposit through the vertical-bias-selected target band. `ecology.test.ts`, `transport.test.ts`,
`spoil.test.ts`, and `broodTransport.test.ts` cover the common precondition contract. No oracle-only
drop path or ninth output was added.

This finding was resolved by the subsequently approved coupled vertical-band sensing contract.
Runs 587–596 established that result in the former fixture; post-repair runs 1035–1044 are the
current step-3 evidence. No additional carrier or oracle-only path was added.

## Appendix D — completed ladder

| Step | Status     | Evidence                                                                                                                                                                                                                                                                     |
| ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | historical | The former exact-shaft outcome assay was retired from Vitest; `spoil.test.ts` retains bounded material-conservation and actuator checks                                                                                                                                      |
| 2    | historical | The former mortal-oracle energy outcome assay was retired from Vitest; future comparison belongs in the harness                                                                                                                                                              |
| 3    | green      | `amplify.test.ts`: marking and marked-face preference preserve solo digging                                                                                                                                                                                                  |
| 4    | historical | The former fixed-world nest-shape outcome assay was retired from Vitest; the classifier remains descriptive                                                                                                                                                                  |
| 5    | green      | `seed-spec.md`: five-reflex amendment recorded                                                                                                                                                                                                                               |
| 6    | green      | `seed-spec.md`: 22-locus, six-relay, zero-recurrence weight specification                                                                                                                                                                                                    |
| 7    | green      | `diggerSeed.test.ts`, `senses.test.ts`: five reflex assays and full input loopback                                                                                                                                                                                           |
| 8    | historical | The former fixed-seed digging outcome assay was retired from Vitest                                                                                                                                                                                                          |
| 9    | historical | The former fixed-world RNN nest-shape outcome and ablation assays were retired from Vitest                                                                                                                                                                                   |
| 10a  | historical | The former placed-queen persistence outcome assay was retired from Vitest                                                                                                                                                                                                    |
| 10b  | green      | `colony.test.ts` isolates laying, incubation, larval transition, and juvenile hatching with automatic continuation disabled                                                                                                                                                  |
| 10c  | green      | `broodTransport.test.ts` covers the gate, tunable capacity, pickup, live carriage, putdown, persistence, and carrier death as bounded mechanics                                                                                                                              |
| 10d′ | green      | `broodExposureLadder.test.ts`: microclimate admitted before exposure and adult energy cost measured                                                                                                                                                                          |
| 10d  | green      | `broodExposureLadder.test.ts`: exposure live at depth without a shape assertion                                                                                                                                                                                              |
| 10e  | historical | `broodPayoff.test.ts` still checks the local exposure gradient. The former fixed-seed paired cohort was removed from Vitest after the entrance-source correction changed its calibrated outcome; Appendix E steps 14–17 must re-establish the live comparison in the harness |
| 11a  | historical | The former fixed-world food-transport outcome assay was retired from Vitest                                                                                                                                                                                                  |
| 11b  | historical | The former fixed-storm cache-retention outcome assay was retired from Vitest                                                                                                                                                                                                 |
| 11c  | historical | The former paired fixed-cache outcome assay was retired from Vitest                                                                                                                                                                                                          |
| 12   | historical | The former noisy construction, brood, and storage outcome assays were retired from Vitest; controller wiring remains covered by bounded unit tests                                                                                                                           |

The files under `frontend/test-results/` are historical snapshots from retired assays, not current
executable gates. Renewed long-horizon or comparative claims must be recorded through the harness
ledger. Bounded actuator, conservation, gate, and sensor contracts remain in Vitest.

## Invalidated step-10e evidence

The earlier `0/3` dug versus `1/3` founding result and its overflow-threshold follow-up are not
certification evidence. The dug arm began from bare terrain with eight stacked builders; the
control received the free founding chamber, while production founding creates that chamber and
spawns forty workers across the surrounding surface. Construction also advanced only the dug
arm's RNG before a three-egg stochastic comparison, and “relocated” meant any displacement rather
than completed delivery. Changing the stack geometry or overflow threshold would optimize this
fixture, not answer the marginal-elaboration question.

## Historical step 10e result and workforce observation

The paired result below records the completed Appendix D run; it is not an active certification
under the current carrier semantics. Its former test ran multi-thousand-tick fixed-seed simulation
outcomes in the ordinary Vitest gate and was removed in favor of Appendix E's harness discipline.
The local depth/exposure gradient remains mechanically covered by `broodPayoff.test.ts`.

Across terrain seeds 10401–10403, expected 600-tick survival at harsh midday rises monotonically
with each voxel below the founding chamber: `0.339234 → 0.588463 → 0.845201 → 1.000000`. The paired
assay then starts both arms from the same founded world and RNG state, constructs before the harsh
peak, and follows six fixed eggs for the 600-tick incubation window. Treatment survival is
`3/6, 4/6, 5/6`; control survival is `2/6, 3/6, 4/6`. Treatment completes `3, 3, 5` physical
deliveries. That satisfies step 10e's written ledger in all three worlds.

The treatment ends with `1, 11, 4` founding workers alive versus `7, 34, 11` in control while
adding `43, 71, 105` cavities. This is a real construction cost, but it is not step 10e's pass
condition. ADR-0011 assigns the ladder's comparisons to asset ledgers and defers whole-colony
worker-day stability to the evolution releases. The test records worker counts and energy without
requiring bad performance to persist or turning a later evolutionary question into an oracle
policy.

## Discarded return-traffic ablation

A three-point experiment tested channel B as a trail emitted only by spoil-loaded returners.
Thresholds `0.1`, `0.5`, and `1.0` did not simultaneously improve the brood ledger and preserve the
control's founding-worker count. The shared B trail's roughly 575-tick mass half-life couples two
timescales: low thresholds suppress work after the returner leaves; high thresholds allow repeated
work before the signal can limit recruitment. This negative result does not block step 10e because
founding-worker parity is not its gate. No channel physics or production policy changed; workforce
allocation remains a later whole-colony evolutionary pressure.

## Historical steps 11a–11c result

The former step-11a assay continued from the step-9 RNN artifact rather than constructing a
storage-shaped fixture. After the reproduction gate was corrected, the RNN produced an accessible route
in 298 ticks; the transport oracle then picked up one authored surface FOOD voxel and deposited it
through shared `DIG` into an existing underground cavity in 24 ticks. The recorded destination is
`(97,30,96)`; the assay required only underground relocation, not a named morphology.

Steps 11b–11c isolated the weather liability from transport. Equal 12-voxel caches were authored in
paired seed-10501 worlds, one connected underground and one exposed at each column's surface. After
one forced 300-tick production storm, underground retention is `12/12` and surface retention is
`0/12`. The authored placement was licensed world scaffolding; step 11a separately demonstrated that
an ant could create the underground placement through the real actuator.

## Historical step 12 result

The sixth-reflex amendment uses only shipped local inputs and the existing output tuple. Unloaded
egg or food contact drives shared-`DIG` pickup; cargo type changes vertical tendency; low
temperature releases brood; low channel A releases food. A FOOD band-pass separates its 4/8
material code from LOOSE_FILL at 5/8, so the amendment does not reverse certified spoil hauling.
All 54 nonzero loci remain in a 12-relay, zero-recurrence hand-written vector. Deterministic motor
jitter is enabled in both oracle and RNN arms, so colocated ants diverge without making runs
nondeterministic.

The retired integrated construction check used production `seed()` noise: the functional crew left
volume 92 across 10 levels, maximum width 35, and 26 branch voxels, so transport does not erase the
step-9 existence competence. The brood comparison ran three independent noisy eight-ant crews
against matched oracle crews. Both arms preserved 6/6 fixed eggs for 600 ticks, and every RNN egg
was picked up and delivered; final RNN depths were 8–11. Reproduction was off during the
fixed-cohort window, excluding fecundity and unrelated eggs from the ledger.

The storage comparison first verified that a noisy functional-seed crew constructed the route with
motor jitter active, then ran three independent fresh noisy transport crews through cloned copies
of that construction scenario. All three pickups produced storm-retained caches; recorded depths are
1, 0, and 1 voxel relative to the original local surface. Depth was descriptive, not a pass gate:
the depth-0 cache occupied an excavated surface-layer cavity and earned the same production weather
ledger. Transport is coordinate-free in the RNN; coordinates appear only in the O-layer fixture
and recorded output.

The summit uncovered one shared actuation defect before its historical certification: `CONTACT_*` was sampled
before movement while `EAT` resolved after movement, allowing an ant to consume an item it had not
sensed and making contact-gated care inexpressible. `EAT` now resolves at the sensed pre-translation
mandible pose; `DIG` remains post-translation because that order drives the certified dig/descend
and haul/deposit loop. `ecology.test.ts` locks the temporal boundary. The historical results above
were produced after the corrected order, but the retired outcome suites are no longer CI gates.
