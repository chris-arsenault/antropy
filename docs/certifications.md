# Appendix D certification ledger

This file tracks ladder status; `docs/ant-sim-appendix-d.md` remains the normative specification.
Every green row names executable evidence. A finding against a row's normative pass condition
stops the ladder there; measurements outside that condition remain visible without silently
becoming additional gates.

## Current ladder

| Step | Status | Evidence                                                                                                                                                                                    |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | green  | `shaft.test.ts`: exact column, conserved spoil, supported materials only                                                                                                                    |
| 2    | green  | `digEconomy.test.ts`: mortal oracle completes with positive energy                                                                                                                          |
| 3    | green  | `amplify.test.ts`: marking and marked-face preference preserve solo digging                                                                                                                 |
| 4    | green  | `nestShape.test.ts`: shared classifier detects oracle branch points; dig-down control remains corridor-only                                                                                 |
| 5    | green  | `seed-spec.md`: five-reflex amendment recorded                                                                                                                                              |
| 6    | green  | `seed-spec.md`: 22-locus, six-relay, zero-recurrence weight specification                                                                                                                   |
| 7    | green  | `diggerSeed.test.ts`, `senses.test.ts`: five reflex assays and full input loopback                                                                                                          |
| 8    | green  | `seededDigger.test.ts`: seed 9950, depth 8, six spoil round trips, energy 0.532631                                                                                                          |
| 9    | green  | `nestShape.test.ts`: shared classifier existence gate passes for the RNN crew; shaft ablation stays corridor-only                                                                           |
| 10a  | green  | `broodLadder.test.ts`: placed queen persists with reproduction off                                                                                                                          |
| 10b  | green  | `broodLadder.test.ts`: reproduction alone lays and hatches                                                                                                                                  |
| 10c  | green  | `broodTransport.test.ts`, `broodLadder.test.ts`: gate, tunable capacity, pickup, live carriage through a one-wide shaft, putdown, persistence, and carrier death                            |
| 10d′ | green  | `broodExposureLadder.test.ts`: microclimate admitted before exposure and adult energy cost measured                                                                                         |
| 10d  | green  | `broodExposureLadder.test.ts`: exposure live at depth without a shape assertion                                                                                                             |
| 10e  | green  | `broodPayoff.test.ts`, `broodComparison.test.ts`: fixed cohorts survive better after local-policy construction in all three paired worlds                                                   |
| 11a  | green  | `foodStorageLadder.test.ts`: surface food is picked up and deposited underground in the step-9 RNN's ant-dug network through shared `DIG`                                                   |
| 11b  | green  | `foodStorageLadder.test.ts`: a 12-food underground cache retains 12/12 through one 300-tick storm                                                                                           |
| 11c  | green  | `foodStorageLadder.test.ts`: paired equal caches retain 12/12 underground versus 0/12 on the surface                                                                                        |
| 12   | green  | `functionalSeed.test.ts`, `nestShape.test.ts`, `functionalBroodLadder.test.ts`, `foodStorageLadder.test.ts`: noisy functional crews retain construction and match both oracle asset ledgers |

The step-4/9 classifier writes complete morphology distributions to
`frontend/test-results/nest-shape.txt`. The rebuilt step-10e work writes the liability increment
series to `frontend/test-results/brood-payoff.txt`, local-policy measurements to
`frontend/test-results/thermal-construction.txt`, and the paired live cohort to
`frontend/test-results/founded-brood-ledger.txt`. Step 11 writes the completed physical food trip
to `frontend/test-results/food-transport.txt` and the storm comparison to
`frontend/test-results/storage-ledger.txt`. Step 12 writes its noisy-founder comparisons to
`frontend/test-results/functional-brood-ledger.txt` and
`frontend/test-results/functional-storage-ledger.txt`.

## Invalidated step-10e evidence

The earlier `0/3` dug versus `1/3` founding result and its overflow-threshold follow-up are not
certification evidence. The dug arm began from bare terrain with eight stacked builders; the
control received the free founding chamber, while production founding creates that chamber and
spawns forty workers across the surrounding surface. Construction also advanced only the dug
arm's RNG before a three-egg stochastic comparison, and “relocated” meant any displacement rather
than completed delivery. Changing the stack geometry or overflow threshold would optimize this
fixture, not answer the marginal-elaboration question.

## Step 10e certification and workforce observation

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

## Steps 11a–11c certification

Step 11a continues from the certified step-9 RNN artifact rather than constructing a storage-shaped
fixture. After the reproduction gate was corrected, the RNN produces an accessible ant-dug route
in 298 ticks; the transport oracle then picks up one authored surface FOOD voxel and deposits it
through shared `DIG` into an existing underground cavity in 24 ticks. The recorded destination is
`(97,30,96)`; the test asserts only underground relocation, not a named morphology.

Steps 11b–11c isolate the weather liability from transport. Equal 12-voxel caches are authored in
paired seed-10501 worlds, one connected underground and one exposed at each column's surface. After
one forced 300-tick production storm, underground retention is `12/12` and surface retention is
`0/12`. The authored placement is licensed world scaffolding; step 11a separately proves that an ant
can create the underground placement through the real actuator.

## Step 12 certification

The sixth-reflex amendment uses only shipped local inputs and the existing output tuple. Unloaded
egg or food contact drives shared-`DIG` pickup; cargo type changes vertical tendency; low
temperature releases brood; low channel A releases food. A FOOD band-pass separates its 4/8
material code from LOOSE_FILL at 5/8, so the amendment does not reverse certified spoil hauling.
All 54 nonzero loci remain in a 12-relay, zero-recurrence hand-written vector. Deterministic motor
jitter is enabled in both oracle and RNN arms, so colocated ants diverge without making runs
nondeterministic.

The integrated construction check uses production `seed()` noise: the functional crew leaves
volume 92 across 10 levels, maximum width 35, and 26 branch voxels, so transport does not erase the
step-9 existence competence. The brood comparison runs three independent noisy eight-ant crews
against matched oracle crews. Both arms preserve 6/6 fixed eggs for 600 ticks, and every RNN egg is
picked up and delivered; final RNN depths are 8–11. Reproduction is off during the fixed-cohort
window, excluding fecundity and unrelated eggs from the ledger.

The storage comparison first verifies that a noisy functional-seed crew constructs the route with
motor jitter active, then runs three independent fresh noisy transport crews through cloned copies
of that construction scenario. All three pickups produce storm-retained caches; recorded depths are
1, 0, and 1 voxel relative to the original local surface. Depth is descriptive, not a pass gate:
the depth-0 cache occupies an excavated surface-layer cavity and earns the same production weather
ledger. Transport is coordinate-free in the RNN; coordinates appear only in the O-layer fixture
and recorded output.

The summit uncovered one shared actuation defect before certification: `CONTACT_*` was sampled
before movement while `EAT` resolved after movement, allowing an ant to consume an item it had not
sensed and making contact-gated care inexpressible. `EAT` now resolves at the sensed pre-translation
mandible pose; `DIG` remains post-translation because that order drives the certified dig/descend
and haul/deposit loop. `ecology.test.ts` locks the temporal boundary, and the affected construction,
foraging, brood, and storage suites pass under the corrected order.
