# Family chemistry: kin tolerance through typed toxin

Registered September 13, 2026 as phase 2 of
[roadmap two](design/README.md#design-roadmap-2), before reading any endpoint. Sulion plan
`Organism-generated selection`. Artifacts: `frontend/harness/artifacts/rps-2026-09-13/` and
`frontend/harness/artifacts/evolve-2026-09-13/families/`.

## Question

The [toxin study](rps-study.md) found that a producer immune to every toxin fixes: there is
nothing a producer's toxin cannot reach except other producers. With
[family chemistry](design/strategic-ecology.md#ecology-family-chemistry) on, a producer is immune
only to the type it makes, so its toxin now reaches producers of the other type. Does that give
producer families a reason to hold ground against each other, and does a single founder
population split into families of different tint that persist together?

## Setup

Constructed contests, mutation off, founder brain with toxin effort 0.02 and the producer body
of the toxin study (`pnpm harness rps --case families|family-invade-<family-a|family-b|sensitive>`,
32 × 32 world, 24 founders, 3 deposits, 10,000 ticks). Family A and family B are the same
producer with tint −3 and +3 (95% of one type); the sensitive makes no toxin and has no immunity.

Evolution: `pnpm harness evolve --world mixed --toxin-types 2 --seed 101|202|303`, 150,000 ticks,
thick medium, mixed deposits, no cycle, default mutation. Control: the same with one toxin type
(the existing mixed-world arms at crowding 0, or `--toxin-types 1` if none is comparable).

## Predictions, recorded before results

1. Constructed: each family persists when rare among the other family and the sensitive
   (holding a cluster rather than spreading through it), and the sensitive persists only where
   both families are absent. A rare family that is wiped out at 10% is the classic bistable
   outcome and would be recorded as such, not tuned away.
2. Evolved: the inherited tint, which starts at 0.5 for every founder, becomes at least bimodal
   with spatially separated modes, and each mode's medoid persists from rarity in the mutual
   invasion assay (`pnpm harness invasion`), which now clusters on tint as well as the other
   traits.
3. Control: with one toxin type the tint locus drifts without structure and the producer-only
   outcome of the toxin study is unchanged.

Failure of 2 with 1 succeeding means the tint's selection is weak at this mutation supply and
toxin effort, which is a finding about the founder's toxin effort, not a reason to author family
identity. The gate is the general one: whatever clusters emerge must mutually invade.

## Results

### Constructed contests

At the toxin study's default settings (matrix on, effort 0.02, no contact injury) both families
went extinct within 10,000 ticks with 0.1–0.7 divisions per founder while the sensitive made 4–12
and no toxin deaths occurred: the founder's matrix still shields everyone, so there is no toxin
interaction to type. At the study's set 12 (contact injury 3, effort 0.01), in the 32-cell world
and now in the thick medium:

| Case | Final (A / B / sensitive) | Divisions per founder | Deaths (toxin) |
| --- | --- | --- | --- |
| families | 4 / 5 / 21 | 1.1 / 1.1 / 5.4 | 55 (28) |
| family A rare | 1 / 13 / 10 | 1.3 / 1.1 / 4.9 | 54 (20) |
| family B rare | 4 / 2 / 24 | 0.9 / 1.7 / 4.6 | 70 (46) |
| sensitive rare | 18 / 1 / 5 | 1.9 / 0.9 / 6.3 | 51 (23) |

The plain producer / resistant / sensitive three-way at the same settings ended 9 / 13 / 10 with
all three present in the second half, where the thin medium had lost the sensitive by 3,000
ticks; rare producers and rare sensitives still went extinct (3 founders each).

In the 64-cell world (64 founders, 8 deposits, 20,000 ticks) at set 12 the sensitive dominated
every case: families 0 / 2 / 108, each family rare 0–2 cells, sensitive rare 79; producers made
0.7–2 divisions per founder against 7–22 for the sensitive, with 51–103 toxin deaths that did not
repay the producers. The plain three-way ended 1 / 27 / 86 and a rare producer went extinct.
Pairwise 3,000-tick contests in the thick medium give one generation and margins of 1–1.7
divisions per founder at contact injury 3 or 10, so they decide nothing; at contact 10 and
effort 0.003 the producer led the sensitive in both placements (27 v 18, 22 v 13). Contact
killing is rarer in a thick medium because contacts are rarer, so the producer's cost is paid
against fewer kills than in the thin-medium study.

At contact injury 10 and effort 0.003 in the 64-cell world (20,000 ticks) the toxin economy
turns over: the plain three-way ended producer / resistant / sensitive 40 / 16 / 45 with all
three present throughout, a rare producer grew from 7 to 14 cells and a rare sensitive held 4,
against the thin-medium study where sensitives were gone by 3,000 ticks. Families at the same
setting:

| Case | Final (A / B / sensitive) | Divisions per founder | Deaths (toxin) |
| --- | --- | --- | --- |
| families | 24 / 24 / 40 | 3.5 / 4.0 / 6.1 | 266 (160) |
| family A rare | 2 / 47 / 39 | 2.6 / 3.8 / 6.1 | 256 (136) |
| family B rare | 18 / 4 / 81 | 3.4 / 2.6 / 5.5 | 251 (129) |
| sensitive rare | 40 / 21 / 23 | 3.5 / 4.4 / 9.7 | 262 (147) |

Both families persist together at equal size when they start equal, and each dwindles from 7
to 2–4 cells when rare while still dividing 2.6 times per founder: a rare family is killed at
its boundary faster than it grows, the bistable outcome prediction 1 allowed for. Family
chemistry therefore gives a producer family territory it can hold but not territory it can
take, and the sensitive invades either way. That is the constructed opportunity: what evolution
does with it is the arms' question.

### Evolution arms

Family chemistry on at contact injury 10, mixed world, three seeds, 150,000 ticks, with a
one-type control at the same contact injury (`evolve-2026-09-13/families/`, ledger rows for the
four arms). Toxin effort, machinery, defense and tint were all free to evolve.

| Arm | Cells, generations | Tint p10 / p50 / p90 | Toxin machinery % of core p10 / p50 / p90 | Deaths (by contact) | k = 2 clusters (n, A share %, machinery %, tint %) | Rare invasion (final cells, divisions per founder) |
| --- | --- | --- | --- | --- | --- | --- |
| 101 families | 390, 104 | 0.41 / 0.51 / 0.58 | 4.9 / 7.3 / 11.9 | 14,169 (8,181) | 247 at 42 / 8.8 / 48 versus 143 at 60 / 6.0 / 54 | 13 (8.0) and 16 (10.6): mutual |
| 202 families | 457, 120 | 0.47 / 0.55 / 0.61 | 3.2 / 7.9 / 11.0 | 21,504 (11,887) | 346 at 51 / 8.4 / 56 versus 111 at 63 / 4.7 / 48 | 17 (12.4) and 74 (41.3): mutual |
| 303 families | 409, 103 | 0.45 / 0.55 / 0.63 | 2.3 / 4.1 / 5.9 | 13,674 (8,488) | 134 at 52 / 4.6 / 50 versus 275 at 68 / 4.2 / 56 | 0 (1.3) and 41 (15.3): one way |
| 101 one type | 494, 90 | silent | 4.4 / 6.5 / 8.4 | 13,365 (4,507) | 293 at 47 / 6.6 versus 201 at 65 / 6.2 | no assay: one cell in the saved endpoint carries a secretion effort of −1.5 × 10⁹, an overflow from dividing by a reserve of −3 × 10⁻²⁰ (rounding), which the restore rejects; the division is now clamped and the arm is not rerun |

Contact injury made toxin machinery the most strongly selected trait in every arm: the founder's
2% of core became 4–8% at the median and up to 12%, and contact kills were more than half of all
deaths with family chemistry on (a third in the one-type control). Prediction 2 fails on its
named axis: the tint stayed unimodal around 0.5 in every arm, with a spread of 0.41–0.63 that
drifts rather than splits. The general gate passes in two arms of three: seed 101's and seed
202's clusters, which differ on diet, body size and toxin machinery, each invade the other from
10%; seed 303's smaller-machinery cluster does not. Family chemistry did not produce families;
it did not prevent the diet-and-body-size partition that every mixed-world arm produces, and it
raised contact mortality. The constructed contests explain why the tint has no purchase: two
families of opposite tint each hold ground but neither can take it, so a lineage that drifts in
tint gains nothing until it is already common.
