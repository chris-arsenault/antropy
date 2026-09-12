# Element cycle: guild emergence in a homogeneous world

Registered September 13, 2026 as phase 1 of
[roadmap two](design/README.md#design-roadmap-2), before reading any endpoint. Sulion plan
`Organism-generated selection`. Artifacts: `frontend/harness/artifacts/evolve-2026-09-13/`.

## Question

With the [element cycle](design/strategic-ecology.md#ecology-element-cycle) on, does a single
founder population in a homogeneous world (mixed deposits, no zones, thick medium) split into
guilds that the organisms themselves make necessary, and do the evolved guilds pass the
[coexistence criterion](design/experimentation.md#experiments-coexistence-criterion)?

## Setup

`pnpm harness evolve --world mixed --cycle on --crowding 0.5 --source-rate 0.2`, seeds 101, 202
and 303, 150,000 ticks, current defaults otherwise (viscosity 0.4, 24 deposits, symmetric
recycling, mutation 0.0015/0.08 and 0.1/0.12, cycle constants as in
[calibration](calibration.md#calibration-default-scales)). Control: the same with `--cycle off`,
seed 101, so the control has the crowding lever and no harvesting locus; it completed at 735
cells (`evolve-2026-09-13/cycle/mixed-101-rate0.2-crowd0.5`, ledger row 3304). The founder
carries the reference harvesting stock.

### Calibration before launch

The first registration used a quarter of the default organic supply (`--source-rate 0.05`) and no
cost specific to harvesting. Three problems were found and fixed, each with a constructed guild
contest (`pnpm harness zones --case guilds|guild-invade-<guild> --world mixed --cycle on
--preference off --sources 20 --ticks 12000`, mutation off, 64 founders in a 64 × 64 world;
autotroph = five-fold harvesting and no transport, heterotroph = no harvesting, mixotroph =
founder), rather than by reading the evolution endpoint:

1. Runaway: at light 1 and exchange 0.002/s the population passed 2,500 cells by 15,000 ticks;
   at light 0.5 and exchange 0.00025/s, 2,000 by 55,000, because evolved cores shrink and cell
   counts scale with the material pool. Atmosphere carbon 0.3, initial carbon 0.15 and exchange
   0.0001/s bound the pool.
2. Mixotroph drift: with harvesting stock paying only the general machinery rate, the 150,000-tick
   seed-202 arm at light 0.35 kept every lineage a mixotroph. Harvesting now pays
   `photoMaintenance` and a fraction `exudation` (0.3) of fixed material leaks into the water as
   food, so consumers have something to eat where harvesters are dense.
3. Cost balance: with maintenance 0.1 at light 0.35 the pure autotroph could not invade (0 cells,
   0.43 divisions per founder when rare) while the mixotroph made 8–13. Light 0.5, maintenance
   0.05 and the new `machineryCrowding` lever, under which each acquisition pathway deploys its
   stock times its share of all three to the configured power, give the table below.

| Crowding, rate | Three-way final (A/H/M) | Autotroph rare | Heterotroph rare | Mixotroph rare |
| --- | --- | --- | --- | --- |
| 0, 0.05 | 39 / 45 / 144 | 0 (0.43 div/founder) | 16 (5.1) | 82 (12.9) |
| 1, 0.05 | 10 / 8 / 9 | 3 (0) | 4 (0) | 4 (0) |
| 1, 0.2 | 20 / 32 / 20 | 7 (0) | 11 (0.57) | 8 (0.14) |
| 0.5, 0.05 | 34 / 27 / 30 | 14 (1.0) | 12 (0.71) | 21 (2.0) |
| 0.5, 0.2 | 47 / 90 / 121 | 19 (1.7) | 35 (6.0) | 60 (8.0) |

Crowding 1 stops reproduction altogether (surviving founders only). Crowding 0.5 at the default
supply is the first setting where all three constructed guilds reproduce and each invades from
10%; the autotroph is the weakest guild, and the mixotroph is no longer dominant when rare.

4. Density-independent light: three arms launched at that setting (seeds 101, 202, 303, 150,000
   ticks) reached 1,221, 988 and 785 cells by 85,000, 80,000 and 115,000 ticks and were still
   growing, holding about twice the control's biomass, because a harvester's income did not
   depend on how many neighbours it had; the carbon pool had also grown to about 4 per raster
   cell from respired deposit food. The arms were stopped (checkpoints to 75,000–100,000 ticks
   kept under `evolve-2026-09-13/cycle/`, not restorable under the later cycle schema). Light is
   now a finite supply per raster cell per tick (`lightSupply`) that the cells standing on it
   claim in body order. Single-population probes on light alone (48 founders, no deposits,
   8,000 ticks) at supply 0.01 with the carbon pool at 1 per raster cell: founder-sized cells
   with one-, two- or five-fold harvesting die or break even, and small-cored (half) three-fold
   harvesters grow from 48 to about 110 and plateau; with the original 0.15 carbon pool every
   pure harvester dies whatever the light. The constructed autotroph guild is therefore the
   half-core three-fold harvester, and the pool starts and relaxes at 1.

| Light supply per raster cell, autotroph guild | Three-way final (A/H/M) | Autotroph rare | Heterotroph rare | Mixotroph rare |
| --- | --- | --- | --- | --- |
| 0.005, five-fold core 1 | 0 / 47 / 64 | 1 (0) | 12 (4.0) | 30 (4.7) |
| 0.01, five-fold core 1 | 21 / 56 / 88 | 7 (0) | 14 (4.3) | 40 (6.0) |
| 0.01, two-fold core 1 | 17 / 44 / 77 | 5 (0) | 20 (4.7) | 37 (4.9) |
| 0.01, three-fold half core, carbon 1 | 90 / 66 / 152 | 28 (3.0) | 19 (5.9) | 99 (13.4) |

5. Light budget: three arms at the one-raster cap of 0.01 (`evolve-2026-09-13/cycle2/`,
   stopped at 70,000–90,000 ticks) reached 815, 1,229 and 1,374 cells and were still climbing
   with harvesting investment at only 6–7% of core: 4,800 raster cells at 0.01 offer 48 fixation
   units per second against 4.8 from deposits, so light is not contested until several thousand
   cells. A harvester now gathers light from the ground within `lightRadius` 2 (13 raster cells)
   at `lightSupply` 0.001, so an isolated cell can fix at most 0.013 per second and the world's
   light budget equals its deposit supply. Traced alone, the half-core three-fold harvester
   fixes 0.013/s against a 0.017/s burn of maintenance and swimming, divides about every 3,000
   ticks and 48 of them plateau near 45–60 cells; at 0.0006 the same cell fixes 0.0078/s and
   starves.

| Light supply, footprint | Three-way final (A/H/M) | Autotroph rare | Heterotroph rare | Mixotroph rare |
| --- | --- | --- | --- | --- |
| 0.0006, radius 2 | 1 / 45 / 76 | 1 (1.0) | 12 (5.0) | 34 (5.7) |
| 0.001, radius 2 | 27 / 51 / 106 | 9 (1.6) | 8 (4.6) | 49 (7.7) |

The last row is the launched setting: each guild reproduces and invades from 10%, the autotroph
being the weakest and the only guild that lives on the light budget alone. Artifacts:
`frontend/harness/artifacts/zones-2026-09-13/guilds*`.

## Predictions, recorded before results

1. Inherited light-harvesting investment becomes bimodal: a high cluster (autotrophs) and a low
   cluster (heterotrophs), with harvesting and transport investment negatively correlated.
2. The two cluster medoids mutually invade from 10% in a fresh mixed world with the cycle on.
3. The population holds carbon below and oxygen above their atmosphere concentrations
   (measured as field totals versus equilibrium), the sign that the organisms run the cycle.
4. In the control the harvesting locus is absent and no such axis appears; core shrinkage
   continues as before.

Failure of 1 with the constructed probes succeeding would mean the guild boundary is not
reachable by single steps at this mutation supply, or that a mixotroph dominates because the
harvesting stock is cheap; that is a finding about the cost structure, to be changed, not a
reason to draw a niche.

## Results

### Crowding 0.5, 150,000 ticks

Three cycle arms and the control completed (`evolve-2026-09-13/cycle3/` and
`cycle/mixed-101-rate0.2-crowd0.5`, ledger rows 3339, 3334, 3333 and 3304). Populations were
bounded: 697, 459 and 362 cells at the horizon (41, 50 and 35 generations) against 735 in the
control. Light supplied about a third of the organic input (fixed 50,556 / 45,397 / 36,716
material units against 107,786 / 105,025 / 100,792 absorbed from the water), and 14% of what was
absorbed was exudate.

| Prediction | Outcome |
| --- | --- |
| 1. Bimodal harvesting investment, anticorrelated with transport | No. Inherited harvesting rose from 5.0% of core to medians of 7.1, 8.6 and 5.9% (90th percentiles 8.5, 11.5 and 7.9%) with correlation to transport +0.03, +0.39 and −0.41; k-means at k = 2 splits on core size and A share, not harvesting, and at k = 3 the most harvesting-rich cluster (seed 202, 90 cells at 11.2%) still carries the founder's transport. Every lineage remains a mixotroph. |
| 2. Cluster medoids mutually invade | Seed 101 yes: both k = 2 medoids (core 74% and A share 53% versus core 54% and A share 60%) invade from 10% (28 and 58 cells, 3.9 and 11.6 divisions per founder). Seeds 202 and 303 one way only (the second medoid ends at 3 and 7 cells). `invasion-2026-09-13/cycle-*-k2`. |
| 3. Carbon below and oxygen above atmosphere | Opposite sign. Carbon ends at 6.2–6.3 per raster cell against an atmosphere of 1, oxygen at 0.045–0.060 against 0.2: the population respires deposit food faster than it fixes, and the slow exchange (0.0001/s) lets the imbalance accumulate. The organisms run the cycle, as heterotrophs. |
| 4. Control has no harvesting axis | By construction; the control's k = 2 clusters split on core (48% versus 64%) and A share (52 versus 56%). |

The constructed guild contests establish that the autotroph, heterotroph and mixotroph niches
exist under these constants; the evolved populations did not partition them within 35–50
generations. The registered failure clause applies: a mixotroph dominates because holding both
pathways is cheap relative to light at crowding 0.5. Constructed contests at crowding 0.75 (same
light, 12,000 ticks) make the mixotroph the weakest guild while every guild still invades:
three-way 33 / 73 / 49, autotroph rare 12 cells (1.0 divisions per founder), heterotroph rare
30 (4.6), mixotroph rare 26 (3.7). At crowding 1 the mixotroph makes 0.05–0.29 divisions per
founder and the contest world stops turning over. The next arms ran at crowding 0.75 for
250,000 ticks (`cycle4/`).

### Crowding 0.75, 250,000 ticks

Three cycle arms completed (`evolve-2026-09-13/cycle4/`, ledger rows 3353, 3356 and 3350):
576, 810 and 279 cells at the horizon, 93, 68 and 54 generations. The crowding-0.75 control
(`cycle4/mixed-101-rate0.2-crowd0.75`) was stopped at 170,000 ticks with checkpoints to 150,000
kept and no ledger row, to free the source tree. Light supplied a fifth to a quarter of the
organic input; carbon ended at 6.2–6.4 and oxygen at 0.02–0.06 per raster cell, the same net
respiration as before.

| Seed | k = 2 clusters (size, harvesting % of core, A share %, core %) | Rare invasion (final cells, divisions per founder) |
| --- | --- | --- |
| 101 | 281 cells at 13.0 / 40 / 47 versus 295 at 5.7 / 57 / 50; A-share bimodality 0.575 | Harvester 40 (10.0); consumer 26 (11.4): mutual |
| 202 | 195 at 6.7 / 39 / 39 versus 615 at 8.9 / 51 / 58 | Small B-leaning cluster 96 (27.0); majority cluster 11 (2.1) from 7: both persist, axis is diet and body size |
| 303 | 166 at 5.9 / 58 / 91 versus 113 at 5.7 / 62 / 73 | 19 (4.3) and 12 (5.3) from 7: both persist, neither axis is light |

Seed 101 is the first evolved harvester–consumer pair: one cluster more than doubled its
inherited harvesting stock while shifting to food B and a smaller body, the other kept the
founder's pigment and moved toward food A, and each invades the other from 10% in a fresh
mixed world. It took about 90 generations; at 50 generations the same arm showed only drift.
Seeds 202 and 303 had not split on the harvesting axis by 54–68 generations, and their clusters
differ on diet and body size, as in the crowding-0.5 arms.

### Structural finding

Under a per-area light supply the marginal return on pigment is zero once a cell's footprint is
claimed, while transport near a deposit keeps paying, so the harvester niche is empty lit ground
away from deposits and selection for it acts through where cells end up as much as through
what they build. The seed-101 split shows the route exists; whether it is reached in a given
arm within 250,000 ticks depends on generation count (populations of 150–300 cells give 50
generations, not 90). The constants that changed during calibration (`photoMaintenance`,
`exudation`, `lightSupply`, `lightRadius`, `machineryCrowding`, the carbon pool) are all
recorded levers; none was needed by the original registration, and the mechanism could be
simplified again if the harvester niche were carried by light alone.
