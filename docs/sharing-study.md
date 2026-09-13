# Adhesion and sharing: a division of labour between touching cells

Registered September 13, 2026 as phase 6 of
[roadmap two](design/README.md#design-roadmap-2), before reading any endpoint. Sulion plan
`Organism-generated selection`. Artifacts: `frontend/harness/artifacts/evolve-2026-09-13/sharing/`.

## Question

With [sharing](design/strategic-ecology.md#ecology-sharing) on, stored nutrient flows between
touching cells from richer to poorer. Does a single founder population split into cells that
gather and cells that receive, or into cells that stay in contact and cells that avoid it, and
do the clusters mutually invade? The exploitable side of the lever is the point: a receiver
that gathers nothing is a cheat, and whether cheats fix, coexist with gatherers, or are held
off by kin clustering in a thick medium is the general outcome to read.

## Setup

`pnpm harness evolve --world mixed --sharing-rate 0.05 --seed 101|202|303`, 150,000 ticks,
thick medium, mixed deposits, defaults otherwise. At 0.05 per second a touching pair closes
half its reserve gap in about 14 s (70 ticks). Control: the undisturbed mixed arms of the
[evolution record](evolve-study.md).

## Predictions, recorded before results

1. Shared material is a substantial flow (comparable to a tenth of absorbed food or more), so
   the lever is active.
2. Transport investment becomes bimodal (gatherers and receivers) or motor investment does
   (stayers and leavers), and the clusters mutually invade from 10%.
3. If receivers fix and gatherers vanish, sharing is a pure tax at this rate; recorded as the
   finding, not tuned away.

## Results

Three arms completed (`evolve-2026-09-13/sharing/`). Shared material was 6,077, 6,635 and 6,086
units against 95,000–97,000 absorbed, about 6% of intake (prediction 1 holds at a modest level).
Populations were the largest of any lever (849–1,042 cells) with the smallest bodies (median
core 0.25–0.36 of the founder's).

| Arm | Cells, generations | Shared | k = 2 clusters (n, A share %, core %, transport gap) | Rare invasion (final cells, divisions per founder) |
| --- | --- | --- | --- | --- |
| 101 | 983, 66 | 6,077 | 596 at 53 / 28 versus 387 at 63 / 35 | 9 (2.6) and 199 (48.3): one way |
| 202 | 1,042, 59 | 6,635 | 399 at 52 / 28 versus 643 at 60 / 24 | 4 (12.1) and 112 (21.7): one way |
| 303 | 849, 60 | 6,086 | 368 at 53 / 40 versus 481 at 63 / 34 | 22 (10.4) and 47 (15.1): mutual |

Prediction 2 fails on its named axes: transport and motor investment stayed unimodal, so no
gatherer/receiver or stayer/leaver split appeared; the clusters are the diet-and-body-size pair.
Sharing's visible effect is demographic: more, smaller cells, because a poorer neighbour is
topped up from a richer one and the storage that pays for a large body pays less. The gate
passes in one arm of three, the weakest showing of the seven levers. Prediction 3 is not what
happened either: nobody fixed as a cheat, because with every cell both giving and receiving
there is no heritable way to receive without giving at this rate.
