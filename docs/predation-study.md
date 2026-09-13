# Predation: contact kills that feed the killer

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

### Constructed contests

64-cell thick world, contact injury 10, effort 0.003, 20,000 ticks; yield 0 figures are the
family study's record at the same setting.

| Case | Yield 0: final P / R / S (divisions per founder) | Yield 0.5: final P / R / S (divisions per founder) |
| --- | --- | --- |
| three-way | 40 / 16 / 45 (4.2 / 3.3 / 5.7) | 56 / 13 / 19 (4.8 / 2.5 / 4.1) |
| producer rare | 14 / 48 / 34 (3.6 / 3.4 / 4.6) | 9 / 54 / 33 (3.4 / 3.2 / 4.3) |
| resistant rare | not run | 52 / 4 / 33 (5.6 / 2.7 / 3.6) |
| sensitive rare | 71 / 16 / 4 (4.1 / 3.6 / 3.0) | 78 / 12 / 0 (4.2 / 2.8 / 3.0) |

Prediction 1 held in direction: the producer became the leading strategy when all three start
together and the rare sensitive went extinct instead of holding, while the rare producer still
grew from 7. Predation therefore pays the killer and tilts the cycle toward it; it does not by
itself widen coexistence, and the resistant's rare invasion (4 from 7) is marginal at either
yield. Artifacts: `rps-2026-09-13/prey05-64`.

### Evolution arms

The first three arms (`evolve-2026-09-13/predation/`, contact injury 10, yield 0.5, 150,000
ticks) completed but their final checkpoints fail the material balance by 2.8 units (of about
100,000 absorbed): a predator that died in the same removal pass as its prey was still fed, and
the material it received vanished with it. The bug is fixed and covered by a test; those arms
are kept as a preview (populations 486–560, 85–94 generations, toxin machinery 4–7% of core
against the founder's 2%, 2,800–3,000 units eaten) and rerun as `predation2/`. The family
study's one-type contact-10 arm is the control (toxin machinery 4.4 / 6.5 / 8.4% of core at the
10th, 50th and 90th percentiles after 90 generations, contact kills a third of deaths).

The rerun (`evolve-2026-09-13/predation2/`, balances clean):

| Arm | Cells, generations | Machinery % of core p10 / p50 / p90 | Eaten | Deaths (by contact) | k = 2 clusters (n, A share %, core %, machinery %) | Rare invasion (final cells, divisions per founder) |
| --- | --- | --- | --- | --- | --- | --- |
| 101 | 487, 92 | 10.0 / 14.1 / 19.0 | 2,859 | 12,910 (4,466) | 240 at 43 / 39 / 16.0 versus 247 at 45 / 49 / 12.1 | 28 (12.0) and 34 (12.6): mutual |
| 202 | 579, 82 | 7.3 / 11.2 / 14.7 | 2,975 | 13,435 (5,027) | 302 at 65 / 33 / 12.5 versus 277 at 71 / 41 / 8.8 | 64 (18.0) and 21 (10.6): mutual |
| 303 | 469, 100 | 6.6 / 9.6 / 18.4 | 3,589 | 11,287 (5,069) | 237 at 63 / 58 / 8.4 versus 232 at 75 / 43 / 14.6 | 24 (13.0) and 27 (7.6): mutual |

Prediction 2 holds. Toxin machinery is the most strongly selected trait in every arm, at
roughly twice the control's level (medians 10–14% of core against 6.5%), and in every arm the
two clusters differ on it (16 against 12, 12.5 against 8.8, 8.4 against 14.6) alongside diet
and body size; every pair mutually invades from 10%. Predation is the second lever after gene
transfer to pass the gate in all three seeds, and the only one whose evolved axis is the lever's
own trait: hunters with more machinery and smaller or larger bodies coexist with less-armed
cells. Eaten material (2,900–3,600 units) is about 3% of intake, so the selection runs through
the kills' effect on neighbours as much as through the meal.
