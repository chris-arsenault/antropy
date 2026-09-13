# Local disturbance and recolonization opportunity

Registered September 13, 2026 as phase 4 of
[roadmap two](design/README.md#design-roadmap-2), before reading any endpoint. Sulion plan
`Organism-generated selection`. Artifacts: `frontend/harness/artifacts/evolve-2026-09-13/disturbance/`.

## Question

Every arm so far has run in a world that, once filled, stays filled: turnover is starvation at
carrying capacity and generation time is set by it. With
[disturbance](design/strategic-ecology.md#ecology-disturbance) on, a disc of about 6.5% of the
world is emptied and stirred roughly every 10,000 ticks, so there is always fresh ground and
the population is forever re-colonising. Does a single founder population split into cells
that reach and fill empty ground and cells that hold occupied ground, and do those clusters
mutually invade?

## Setup

`pnpm harness evolve --world mixed --disturbance on --seed 101|202|303`, 150,000 ticks, thick
medium, mixed deposits, default constants otherwise (interval 2,000 s, radius 10, mortality 0.9,
mixing 1). Control: the crowding-0 mixed arms of the [evolution record](evolve-study.md) and the
one-type contact-10 arm of the [family study](family-study.md), which differ in other levers;
no disturbance-off arm at otherwise identical settings is rerun, since the mixed default is
already recorded.

No constructed contest precedes the arms: disturbance acts on everyone alike and the
behaviours it could select (motility, chemotaxis toward emptied ground, small fast bodies) are
brain and body traits the existing capability assays already showed to be expressible.

## Predictions, recorded before results

1. Motor investment and core size become bimodal (small fast colonisers against large holders),
   or the evolved clusters differ on where they live relative to recent disturbances.
2. The clusters that emerge mutually invade from 10% in a disturbed mixed world (the invasion
   assay inherits the checkpoint's disturbance setting).
3. Generation counts exceed the undisturbed arms' at the same horizon, because disturbance
   deaths replace starvation deaths and shorten the wait for division.

## Results

Interpretation corrected September 13 from [saved endpoint shares](analysis-correction.md).
The questions and predictions above preserve the original registration, not the current work order.

Three arms completed (`evolve-2026-09-13/disturbance/`), 11–14 events each over 150,000 ticks
killing 316–424 cells of 7,600–9,700 deaths: at the defaults disturbance is a minor mortality
and the population rebuilt the emptied discs between events.

| Arm | Cells, maximum generation | Motor % of core p10 / p50 / p90 | Core (founder = 1) p10 / p50 / p90 | k = 2 clusters (n, A share %, motor %, core %) | Rare-start endpoints (group/total, share) |
| --- | --- | --- | --- | --- | --- |
| 101 | 972, 51 | 3.9 / 5.5 / 6.6 | 0.28 / 0.38 / 0.54 | 573 at 55 / 4.8 / 45 versus 399 at 57 / 6.2 / 33 | 15/283 (5.30%) and 42/272 (15.44%): one declines |
| 202 | 931, 64 | 3.7 / 5.2 / 6.9 | 0.26 / 0.35 / 0.46 | 673 at 43 / 5.2 / 32 versus 258 at 51 / 5.3 / 44 | 46/224 (20.54%) and 10/241 (4.15%): one declines |
| 303 | 762, 54 | 3.6 / 4.6 / 6.1 | 0.27 / 0.38 / 0.62 | 434 at 51 / 4.2 / 50 versus 328 at 70 / 5.6 / 31 | 7/255 (2.75%) and 119/267 (44.57%): one declines |

Prediction 1 fails: motor investment stayed unimodal (the founder's 8% fell to 4–7% in every
arm, as in undisturbed arms) and the clusters split on diet and body size, the axes every
mixed-world comparisons describe. All rare groups began at 7/64 (10.94%), and no pair gained
share in both directions; the former two-of-three pass is withdrawn. The reported 51–64 maximum
generations versus 45–50 in other arms is not a matched estimate of disturbance's effect because
those controls differ in other settings. Disturbance demonstrably kills cells and mixes chemistry.
A colonizer/holder advantage, faster evolution caused by disturbance, and unchanged selection
were not established. A small recolonization comparison could test the proposed opportunity
without requiring evolution to produce named roles.
