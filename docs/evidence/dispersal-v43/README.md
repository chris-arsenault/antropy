# Live dispersal: three independent design directions

September 28, 2026. Read-only analysis of the v43 live world's saved observation window,
ticks 606669–612671. No runtime changes, deployment, restart or live control operation.
Sulion investigation: `8b7b57ad-c133-4100-9fdc-5af1a52ac2e2`.

## Question and criteria

Cells need to survive travel between feeding locations and reproduce after arrival.
Growth during transit and indefinite survival without reservoirs are not requirements.
Separate physical endurance, effective movement, encounter probability and establishment.
Current bodies and actions describe phenotype; recent parent records only resolve daughter
fates. This study does not prescribe a colony count or select replacement founders.

Use the existing 1,200.4-model-second window: 267 bounded display frames plus initial and
final native checkpoints. Reservoir systems are connected components of source centers
within 15 units; membership is unchanged at 12 and 20. Contact includes both source and
cell radius. Departure requires prior contact followed by six units of clearance from the
origin system. Source positions update in each frame. Sampling has median interval 4.8
seconds and maximum eight, so brief contacts can be missed. Distance uses periodic geometry.

The completed observation contained 360 departures from 358 cells: 278 journeys ended in
starvation, 14 returned, and 68 remained underway. None completed an observed crossing to
another system. Fatal journeys reached a median maximum displacement of 10.54 units and
lasted a median 187.6 seconds from last contact to the final tracked branch's death.
Departures can include passive displacement and births; they are not all active swimmers.

Thirty-six cells were already away from reservoirs when capture began. Five arrivals were
observed from these cells or their daughters. Their origin contacts were not observed.
One cell travelled 83.45 units, arrived nearly full of energy, then produced 15 divisions
and left 11 living descendants at that destination. Combined living material grew from
0.472 to 3.341. The destination already had a colony; no new colony was founded in this window.
Another travelled 54.42 units to an initially unoccupied system, arrived nearly full of
energy, never divided and died 343 seconds later. This separates travel from establishment.

## Follow-up measurements

The initial checkpoint contains 7,202 cells, of which 2,069 have motors. Of the 21 initially
observed motor-equipped cells whose later departures ended in death, 20 commanded full
swimming and 15 full turning at this snapshot. These are snapshot actions, not whole-life
behavior. Both long-distance travellers allocate about 0.2% of body material to motors;
the median among motor-equipped cells is 0.83%. Neither had a nonzero external chemical
receptor reading at that saved position. This does not mean receptor capacity was absent.

A registered frozen audit used the ordinary production sensing, movement and controller
operators on 64 saved cells: all initial travellers plus departing cells present in the
initial checkpoint, deduplicated. Fifty-two have motors. Five conditions retained the same
genotype and cloned initial private state: current inputs, left/right receptor contrasts,
and energy fractions 0.1/0.9. The synthetic side contrast is 0.05 times each receptor's
external gain; absent receptors remain absent. It is a bounded sensitivity stimulus, not
a field observed along the path. Each condition runs for 32 neural intervals with learning
disabled. No World ticks, mutation or inherited learning occur. The audit finished within
its 120-second cap; it establishes response capacity, not behavioral fitness.

- Thirty-seven of 52 motor-equipped cells changed mean swimming by less than 0.01 between
  the low/high energy inputs. Thirteen changed mean turning by less than 0.01 between
  reversed chemical contrasts. Median absolute turning response was 0.113, so the result
  does not support saying that every controller is insensitive.
- The successful traveller commands full swimming and alternates exactly full left/right
  turning, with zero mean turn in the frozen sequence. Reversing the contrast or changing
  energy does not change this pattern. The failed traveller shows a similar oscillation.
  This can produce nearly straight net travel; a maximum-turn snapshot is not evidence
  of continuous circling. Recorded displacement aligns closely with heading.
- Passive speed at the successful traveller's saved position is 0.0000058 units/second,
  versus motor speed 0.1232. For the failed traveller the values are 0.00114 versus 0.1216.
  Passive drift therefore does not explain their initial travel speeds. This is a local
  calculation, not a decomposition of every later movement.

The 32 reservoir systems have a median nearest surface gap of 53.75 units. Only two systems
have another within 20 units, and only four within 30. Initially unoccupied systems are a
median 60.43 units from the nearest occupied system. This is geometric connectivity, not
a claim that 20 units is a universal maximum swimming range.

Eighteen systems were initially occupied and 14 unoccupied, using six-unit residence
clearance. The mean of each group's empty-sample fraction is 8.24% among occupied systems
and 60.01% among unoccupied systems. Their median source counts are 10.5 and 3.5 respectively.
These are equally weighted system/sample summaries, not long-run probabilities or causal
effects of occupancy. Source richness, chemistry and prior history also differ.

The failed colonist's destination first became stocked 307.2 seconds after arrival. The
cell was then almost ten units beyond its surface and died about 36 seconds later. It had
remained within six units in 59 of 75 post-arrival samples. The successful traveller's
destination had four or five stocked reservoirs while that parent remained alive after
arrival. Stock does not establish accepted uptake; dissolved food can remain after emptying.

## Recommendation 1: bound total neural drive, preserving conditional behavior

The current RNN bounds each individual weight at 16, sums many inputs and recurrent terms,
then saturates its activation at a drive magnitude of three. Independently bounded weights
do not bound total drive. The measured insensitive and oscillating policies make aggregate
gain a concrete candidate, rather than a reason to increase mutation or motor strength.

Prototype a shared incoming-weight budget for every neural row, including bias and the
effective recurrent contribution. For bounded inputs x and the augmented coefficient row a,
evaluate `z = (a dot x) / max(1, sum(abs(a))/3)` before the existing activation. The value
three comes from that activation's domain; it is not a per-action tuning constant. This
keeps drive within the responsive domain except at its extreme boundary. Apply the same
rule to hidden and output contractions. Effective learned coefficients must participate
in the recurrent budget; compile immutable contributions and update learned contributions
on the existing physiological clock. Preserve sparse contraction and paid learning.

This removes a magnitude-based route to overwhelming all other inputs. It does not impose
chemotaxis, a low-energy stop rule or a preferred movement pattern. Constant policies remain
possible, and there is no guarantee normalization will create useful responses. It changes
the meaning of existing controller weights, so it must be treated as a model change, not a
transparent repair to a continuing world.

First discriminator: repeat the frozen sensitivity comparison on the same saved genotypes,
then use a small food-patch assay to check cue, action, residence, uptake and costs. Reject
the proposal if it only makes actions numerically variable without improving useful control.
This addresses whether controllers can express conditional behavior. It is the least
certain intervention: many tested controllers did respond to the chemical contrast.

## Recommendation 2: give reservoir placement a sparse outer distribution

The current boot generator chooses unevenly weighted centers and places each source inside
a hard disk of `landscapeSpread` (18 units here). Extend that existing spatial distribution
so it produces dense centers and occasional outlying deposits with the same source count,
sizes, richness and total supply budget. Do not add routes, target colony locations or a
second resource. Keep physical source motion and the existing absence of stored anchors.

A concrete one-scale candidate is radial placement `r = L*sqrt(u/(1-u))` with uniform angle
and periodic wrapping, replacing the hard disk law `r = L*sqrt(u)`. Here L is the existing
spread and u is uniform in [0,1). On the unwrapped plane its median radius is L and 90th
percentile is 3L. It has a dense center and a sparse tail without a separate mixture knob.
Using the same L does broaden the typical cluster; it is not a matched-median comparison.

The expected opportunity is more short movements that can reach another feeding location,
while dense deposits still support colonies. It reduces dependence on the rare 54–83-unit
travellers. It does not guarantee connectivity, permanent satellites or colony establishment.
Reservoir interactions may pull outliers together or rearrange them; boot geometry alone
cannot certify a persistent opportunity.

First discriminator: compare source surface gaps and release budgets before and after a
bounded reservoir-only relaxation using one saved seed. Then test one mobile/stationary
pair on a newly reachable gap. Retain broad empty areas; do not turn all space into food.

## Recommendation 3: shorten reservoir pulses and empty waits together

Current saved configuration has `sourceLifetime=600` and `sourceGap=2400` model seconds.
Refill supplies `Q=r*T`; an empty site waits an exponential interval with mean G. The
nominal material supply per second is `r*T/(T+G)`. Shortening G alone would add more food.

The concrete first comparison is T=150 and G=600, with release rate r unchanged. Each
pulse contains one quarter as much material and opportunities recur four times as often.
Mean material supply and nominal stocked fraction remain unchanged. Chemical energy of
the evolved source mixture and finite-window totals need not match exactly. Initial stock
must be accounted for separately, rather than crediting a changed startup pulse as a benefit.

For n independent empty sites, the mean time until the first refill is G/n. At four sites,
this changes from 600 to 150 seconds. The latter is comparable to the observed median fatal
journey duration of 188 seconds, though that duration is not a stationary waiting tolerance.
The stationary probability that all four sites are empty remains `0.8^4`; the empty episodes
become shorter. Large systems still pool independent sources into more reliable feeding.

The expected benefit is a greater chance that a traveller arriving during an empty interval
can encounter a refill before dying or wandering far away. This changes temporal opportunity,
not travel range or the controller. It is distinct from the deferred proposal for correlated
local seasons, which intentionally synchronizes downturns.

First discriminator: a paired small destination assay with identical traveller physiology,
source count, positions and release rates; vary only T and G jointly. Track actual uptake
and first division after arrival, alongside total supplied material. Shorter food pulses
could hurt feeding and storage strategies; preserve that negative if it occurs.

## Interpretation and local reproduction

These are independent proposed interventions in neural response, spatial access and temporal
availability. Start with the spatial proposal because the measured gap mismatch is the most
direct constraint, and it does not reinterpret cell physiology or controller weights. Test
each separately before combining. Endurance is heterogeneous: common departures
failed, but the two long travellers arrived nearly full of energy. That does not justify
free off-reservoir growth, larger energy reserves for every cell, or extra mutation by default.

Local data and analysis helpers remain in the ignored directory
`frontend/harness/artifacts/dispersal-live-20260928/`. It contains the registration, raw
checkpoints, frame stream, fate analysis, compact phenotypes, frozen audit TSV and plots.
`explore.py` reduces the existing initial inspection and frames; it does not advance World.
`frozen_audit.rs` links the current release kernel and calls only sensing, motion calculations
and cloned controller inference. Its command takes initial checkpoint, selected-cell ID file
and a new TSV output path. The initial compilation required matching the kernel's
`-C panic=abort`; the corrected build and audit passed. No physical result depends on that
build-setting correction. Raw payloads are optional local evidence, not tracked documentation.
