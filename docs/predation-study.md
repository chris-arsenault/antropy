# Predation: damaged cells can feed touching neighbors

Registered September 13, 2026 as phase 3 of
[roadmap two](design/README.md#design-roadmap-2), before reading any endpoint. Sulion plan
`Organism-generated selection`. Artifacts: `frontend/harness/artifacts/rps-2026-09-13/prey*` and
`frontend/harness/artifacts/evolve-2026-09-13/predation/`.

## Question

In the [family study](family-study.md) producers at contact injury 10 killed 130–160 cells per
20,000 ticks and were not repaid: the corpses fed everyone through detritus. With
[predation](design/strategic-ecology.md#ecology-predation) on, a kill feeds the killer. Does
that make toxin machinery a paid hunting trait, and does a single founder population split
into a hunting cluster and a fleeing or defended cluster that mutually invade?

## Setup

Constructed: the toxin study's producer / resistant / sensitive strategies at contact injury 10
and effort 0.003 in the 64-cell thick world (`pnpm harness rps --case three-way|invade-<s>
--contact-damage 10 --toxin-effort 0.003 --prey-yield 0.5 --size 64 --founders 64 --sources 8
--ticks 20000`), against the same cases already recorded at yield 0.

Evolution: `pnpm harness evolve --world mixed --contact-damage 10 --prey-yield 0.5 --seed
101|202|303`, 150,000 ticks, one toxin type, default mutation. Control: the one-type contact-10
arm of the family study (`families/mixed-101-rate0.2-contact10`), which differs only in yield.

## Predictions, recorded before results

1. Constructed: the producer's divisions per founder rise above the yield-0 record (3.6–4.2)
   and the rare producer still invades; the sensitive's rare invasion weakens.
2. Evolved: inherited toxin machinery becomes bimodal, or the evolved toxin effort does, and
   the clusters that emerge mutually invade. The general gate applies: any axis counts.
3. Control: the one-type contact-10 arm without yield shows whatever it shows; the comparison
   is on the toxin machinery and effort distributions.

## Results

Interpretation corrected September 13 from [saved endpoint shares](analysis-correction.md).
The questions and predictions above preserve the original registration, not the current work order.
The code shares a damage-killed cell's material among living toxin-equipped neighbors; it does
not attribute the kill to an attacker or demonstrate pursuit of prey.

### Constructed contests

64-cell thick world, contact injury 10, effort 0.003, 20,000 ticks; yield 0 figures are the
family study's record at the same setting.

| Case | Yield 0: final P / R / S (divisions per founder) | Yield 0.5: final P / R / S (divisions per founder) |
| --- | --- | --- |
| three-way | 40 / 16 / 45 (4.2 / 3.3 / 5.7) | 56 / 13 / 19 (4.8 / 2.5 / 4.1) |
| producer rare | 14 / 48 / 34 (3.6 / 3.4 / 4.6) | 9 / 54 / 33 (3.4 / 3.2 / 4.3) |
| resistant rare | not run | 52 / 4 / 33 (5.6 / 2.7 / 3.6) |
| sensitive rare | 71 / 16 / 4 (4.1 / 3.6 / 3.0) | 78 / 12 / 0 (4.2 / 2.8 / 3.0) |

Prediction 1 is mixed. The producer leads from the three-way start, but its rare-start divisions
fall from 3.6 to 3.4 per founder and its final share is 9/96 = 9.38%, below 7/64 = 10.94%.
The rare resistant ends at 4/89 = 4.49%, also a decline; the rare sensitive goes extinct.
Feeding occurs, but the claimed continuing rare-producer invasion is false.
Artifacts: `rps-2026-09-13/prey05-64`.

### Evolution arms

The first three arms (`evolve-2026-09-13/predation/`, contact injury 10, yield 0.5, 150,000
ticks) completed but their final checkpoints fail the material balance by 2.8 units (of about
100,000 absorbed): a predator that died in the same removal pass as its prey was still fed, and
the material it received vanished with it. The bug is fixed and covered by a test; those arms
are kept as a preview (populations 486–560, 85–94 generations, toxin machinery 4–7% of core
against the founder's 2%, 2,800–3,000 units eaten) and rerun as `predation2/`. The family
study's one-type contact-10 arm is the control (toxin machinery 4.4 / 6.5 / 8.4% of core at the
10th, 50th and 90th percentiles after 90 generations, damage deaths are a third of deaths (field and contact causes are not separated)).

The rerun (`evolve-2026-09-13/predation2/`, balances clean):

| Arm | Cells, maximum generation | Machinery % of core p10 / p50 / p90 | Eaten | Deaths (attributed to damage) | k = 2 clusters (n, A share %, core %, machinery %) | Rare-start endpoints (group/total, share) |
| --- | --- | --- | --- | --- | --- | --- |
| 101 | 487, 92 | 10.0 / 14.1 / 19.0 | 2,859 | 12,910 (4,466) | 240 at 43 / 39 / 16.0 versus 247 at 45 / 49 / 12.1 | 28/185 (15.14%) and 34/192 (17.71%): both increase |
| 202 | 579, 82 | 7.3 / 11.2 / 14.7 | 2,975 | 13,435 (5,027) | 302 at 65 / 33 / 12.5 versus 277 at 71 / 41 / 8.8 | 64/232 (27.59%) and 21/256 (8.20%): one declines |
| 303 | 469, 100 | 6.6 / 9.6 / 18.4 | 3,589 | 11,287 (5,069) | 237 at 63 / 58 / 8.4 versus 232 at 75 / 43 / 14.6 | 24/192 (12.50%) and 27/165 (16.36%): both increase |

All rare groups began at 7/64 (10.94%). Two pairs increase in both directions at the endpoint;
the third does not. The former all-seed pass and established hunter/prey interpretation are
withdrawn. Toxin machinery medians rose to 10–14% of core versus 6.5% in the recorded control,
and the chosen groups differ in machinery as well as diet and body size. This is compatible
with an opportunity for toxin investment, but neither its isolated advantage nor distinct hunting
and fleeing roles was demonstrated. The control checkpoint has the restoration defect recorded
in the family study. Eaten material is about 3% of intake; that fraction alone cannot apportion
selection between food gains, neighbor removal and immunity. A small matched test could inform
world design without requiring a lasting predator/prey pair.
