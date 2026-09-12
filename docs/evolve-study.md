# De novo evolution in the zoned world

Registered September 11, 2026 as phase 4 of the
[roadmap to strategic differentiation](design/README.md#design-roadmap), before reading any
endpoint. Sulion plan `ac1df944-ed66-4d21-8461-9e7f4ab19509`.
Artifacts: `frontend/harness/artifacts/evolve-2026-09-11/`.

## Question

The [zone experiment](zones-study.md) shows that constructed A- and B-specialists coexist in the
pure-band world. Does a population of identical founders, with ordinary mutation and inherited
learning, discover that partition on its own, and do the evolved clusters pass the
[coexistence criterion](design/experimentation.md#experiments-coexistence-criterion)?

## Setup

`pnpm harness evolve` runs the current Run default from tick zero with all inheritance active.
Every 1,000 ticks it records each living cell's inherited construction targets, position and
damage; every 100,000 ticks it saves a checkpoint. Five runs of 500,000 ticks:

| Label | World | Supply rate | Purpose |
| --- | --- | --- | --- |
| zones-101-rate0.3, zones-202-rate0.3 | pure A/B halves, 80 × 60 | 0.3 (default, about 180 cells) | The population the user watches |
| zones-101-rate0.9, zones-202-rate0.9 | pure A/B halves | 0.9 (about 500 cells) | Larger population, weaker drift |
| mixed-101-rate0.3 | heterogeneous mixed deposits | 0.3 | Control without spatial partition |
| zones-101-rate0.3-pm0.2x0.15, zones-202-rate0.3-pm0.2x0.15 | pure A/B halves | 0.3 | Eightfold physical mutation supply (0.2 per locus, scale 0.15), 300,000 ticks |

The mutation-supply arm was registered after the 200,000-tick checkpoints of the first five runs
showed no band differentiation (A share 59–63% in both halves, spread under 3%), and before any
of its own results. Its prediction: if supply limits discovery, this arm splits by band where the
default supply does not. If it also fails, supply is not the limiter at this population size.

`python3 harness/evolve_report.py <root> [k]` clusters the final living cells by standardized
inherited traits (A share of processing, motor, core, defense, toxin and matrix machinery) with
k-means, reports cluster sizes, centres and band occupancy, and draws the A-share distribution
over time. `pnpm harness invasion --checkpoint <file> --k 2` takes the medoid genotype of each
cluster and runs rare-invasion contests between those actual genotypes in a fresh zoned world.

## Predictions, recorded before results

1. In zoned runs the A-share distribution becomes bimodal, with one mode above the founder's
   61.5% and one below, and the modes occupy opposite bands. In the mixed control it stays
   unimodal or drifts as a whole.
2. Evolved medoid genotypes from the two zoned clusters each invade from 10% against the other.
3. The larger populations reach the split earlier and more cleanly than the default supply.
4. Behavioural preference (steering on one food) may or may not evolve; the physical split alone
   can satisfy predictions 1 and 2 because survival sorts cells into bands.

Failure of prediction 1 with a bimodal constructed result would point at mutation supply or at
the generalist's structural advantage under diffusion-limited uptake, which the zone record
already notes. Failure of prediction 2 with a bimodal distribution would mean the clusters are
drift, not partition. Neither failure authorizes tuning the world toward the prediction.

## Results

All runs completed their horizons. Every manifest reads `failed` because observation and
harness files (`src/observe`, `src/ui`, `harness/lib`) were edited while the runs were in flight
and the end-of-run source digest no longer matched; kernel and persistence files were last
modified three minutes before the first run started, so the physics did not change. Samples and
checkpoints were written; ledger rows and `result.json` were not. The digest check did its job.

Final living population, highest generation, A share of processing by band (mean ± sd, left
band is pure A), and the two-cluster split.

| Run | Ticks | N | Gen | A share left | A share right | Core % of founder | Two clusters differ mainly in |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| zones-101-rate0.3 | 500k | 264 | 70 | 50.9 ± 2.7 | 50.8 ± 2.8 | 84 | core (90 v 75), same A share, both bands |
| zones-202-rate0.3 | 500k | 246 | 97 | 60.5 ± 2.2 | 60.5 ± 2.2 | 72 | motor (6.6 v 4.9), both bands |
| mixed-101-rate0.3 | 500k | 278 | 89 | 58.5 ± 3.1 | 58.0 ± 2.4 | 81 | nothing distinct |
| zones-101-rate0.3-pm0.2x0.15 | 300k | 435 | 116 | 57.7 ± 10.9 | 57.8 ± 9.3 | 22 | weapon (2.2 v 4.2), A 55 v 62, both bands |
| zones-202-rate0.3-pm0.2x0.15 | 300k | 454 | 127 | 50.8 ± 8.4 | 49.2 ± 7.9 | 21 | A 46 v 55, defense 3.0 v 4.2; high-A cluster 54% left, low-A 44% left |
| zones-101-rate0.9 | 250k | 605 | 72 | 56.7 ± 2.8 | 56.5 ± 2.6 | 91 | core (94 v 78), both bands |
| zones-202-rate0.9 | 250k | 660 | 79 | 58.2 ± 3.7 | 58.0 ± 3.8 | 95 | core (104 v 87), motor, both bands |
| zones-101-rate0.3-pm0.2x0.15-bm0.003x0.1 | 300k | 452 | 99 | 53.9 ± 12.0 | 50.8 ± 11.4 | 28 | core and defense, same A share, both bands |

The last row is the behavioural-supply arm (RNN mutation 0.003 per locus at scale 0.1, five
times the default, with the physical-supply settings), registered after the physical-supply
arm's 100,000-tick checkpoint showed no band difference and before its own results. Its band
difference of three points is within one standard deviation and its clusters do not differ in
diet.

Rare-invasion assays between the medoid genotypes of the two clusters, 12,000 ticks or the
120-second wall cap, fresh pure-band world (invader starts at 7 of 64; divisions per founder,
invader v resident):

| Source checkpoint | Cluster 0 rare | Cluster 1 rare | Mutual? |
| --- | --- | --- | --- |
| zones-101-rate0.3 at 500k | 20 cells, 3.0 v 4.4 | 12 cells, 2.6 v 4.4 | no, neither invades |
| zones-202-rate0.3 at 500k | 14 cells, 3.9 v 6.9 | 29 cells, 5.6 v 6.7 | no, neither invades |
| zones-101-rate0.3-pm at 300k | 38 cells, 7.0 v 10.4 | 81 cells, 13.7 v 10.4 | no, one direction |
| zones-202-rate0.3-pm at 300k | 17 cells, 2.7 v 12.7 | 44 cells, 12.1 v 8.9 | no, one direction |
| zones-101-rate0.3-pm-bm at 300k | 42 cells, 7.6 v 7.5 | 82 cells, 10.9 v 10.0 | neutral in both directions, not partition |

Predictions 1 and 2 fail in every arm. Prediction 3 (larger populations split sooner) fails.
The population does evolve, and quickly under the higher supply: core targets fall to a fifth of
the founder's, motor investment falls by a third, and A share drifts toward B, which recycled
detritus makes ubiquitous. That is directional selection on economy, the same axis the earlier
epoch campaign found, not partition. The trait spread widens under higher supply (sd 8–11
versus 2–3) without any band correlation, which locates the block: cells with the founder's
shared chemotaxis do not stay in a band, so a small processing step gains in one band and
loses in the other and averages to nothing. The constructed specialists that passed the phase 3
gate carried both a large processing step and a steering preference; evolution reaches neither
by single steps at these population sizes.

## Second campaign: the thick medium

After the first campaign, the world was changed rather than the conclusion accepted. The
[residency measurement](calibration.md#calibration-residency) showed that at the old viscosity
96% of cells crossed into the other half of the world during their life; at viscosity 0.4 only
13% do, while division and turnover rise. The new default is that viscosity, 24 balanced
deposits at rate 0.2 (about 340 founder-sized cells, more as bodies shrink), decomposition
returning half A and half B, and about 2.5 behavioural and 0.8 physical mutated loci per birth.
A constructed check first confirmed that specialists without any steering preference now sort by
survival alone (A-specialists 41 left v 10 right, B-specialists 6 v 85 at 12,000 ticks, all three
diets persisting) and that the rare A-specialist invades at 12.9 divisions per founder.

Then `pnpm harness evolve` ran from the single founder: zoned seeds 101, 202 and 303 and a
mixed-world control, all at the new default. Artifacts: `frontend/harness/artifacts/evolve-2026-09-12/`
(first attempt, crashed at the 200,000-tick checkpoint because every genotype ever born was
retained and the checkpoint exceeded the JSON string limit; samples to 195,000 ticks survived) and
`evolve-2026-09-12b/` (deterministic replay with genotype pruning, 250,000 ticks).

Mean inherited A share of processing, A half / B half, every 25,000 ticks:

| Run | 0 | 50k | 100k | 125k | 150k | 175k | 200k |
| --- | --- | --- | --- | --- | --- | --- | --- |
| zones-101 | 62/62 | 65/62 | 74/59 | 75/54 | 74/53 | 71/56 | 71/50 |
| zones-202 | 62/62 | 63/61 | 65/59 | 68/52 | 68/48 | 69/46 | 68/42 |
| zones-303 | 62/62 | 76/68 | 78/59 | 79/44 | 77/31 | 80/28 | 82/30 |
| mixed-101 | 62/62 | 61/62 | 61/60 | · | · | · | 50/52 |

Two-cluster split of the living population at 200,000 ticks (about 80–90 generations):

| Run | N | Cluster A: A share, cells A half / B half | Cluster B: A share, cells A half / B half | Bimodality |
| --- | ---: | --- | --- | ---: |
| zones-101 | 1,089 | 76%, 375 / 30 | 53%, 189 / 495 | 0.55 |
| zones-202 | 1,137 | 69%, 411 / 95 | 41%, 102 / 529 | 0.79 |
| zones-303 | 1,128 | 85%, 624 / 35 | 27%, 39 / 430 | 0.93 |
| mixed-101 | 988 | no band difference (50% / 52%) | | |

Every zoned seed evolves two diet clusters on opposite halves from one founder, with no steering
preference constructed and no genotype introduced; the mixed control does not. The split begins
between 50,000 and 100,000 ticks and widens through 200,000. Bodies still shrink (core targets
20–30% of the founder), so economy evolution continues alongside partition rather than instead
of it. Predictions 1 and 3 of the registration hold in this world.

Mutual invasibility of the actual evolved medoid genotypes at 200,000 ticks (`pnpm harness
invasion --k 2 --founders 48 --sources 20 --wall 600`, fresh pure-band world, invader 7 of 48;
cells at 12,000 ticks and divisions per founder, invader v resident):

| Source | B-side cluster rare | A-side cluster rare | Verdict |
| --- | --- | --- | --- |
| zones-303 (27% v 85% A) | 260 cells, 70.4 v 34.4 | 221 cells, 74.4 v 30.4 | **mutual invasion** |
| zones-202 (41% v 69% A) | 267 cells, 82.8 v 36.3 | 101 cells, 49.0 v 49.2 | B-specialist invades; A-side grows but holds frequency |
| zones-101 (53% v 76% A) | 13 cells, 2.8 v 45.3 | 155 cells, 299 v 3 | A-specialist invades; B side not yet specialised |

Seed 303, the furthest along, meets the [coexistence criterion](design/experimentation.md#experiments-coexistence-criterion)
with genotypes that evolved from one founder: each rare type doubles the resident's per-founder
division rate and rises to a quarter of the population within 12,000 ticks. Seeds 202 and 101
are earlier on the same trajectory.

At the 250,000-tick endpoint (94–110 generations) the splits are sharper: seed 101 45% v 79% A
(120/515 v 483/29 cells in the A/B halves), seed 202 36% v 80% (146/681 v 479/16), seed 303
30% v 87% (66/568 v 653/46); bimodality 0.74–0.87. The same assay on the endpoint medoids:

| Source | B-side cluster rare | A-side cluster rare | Verdict |
| --- | --- | --- | --- |
| zones-101 (45% v 79% A) | 191 cells, 67.8 v 42.9 | 241 cells, 84.2 v 42.8 | **mutual invasion** |
| zones-202 (36% v 80% A) | 302 cells, 93.6 v 37.5 | 62 cells, 46.6 v 48.0 | B-specialist invades; A-side holds |
| zones-303 (30% v 87% A) | 343 cells, 98.0 v 36.4 | 154 cells, 64.0 v 39.3 | **mutual invasion** |

Two of three seeds pass the criterion in both directions with evolved genotypes; the third
passes in one direction and is neutral in the other. All three populations hold both clusters
at the endpoint with each above 37% of the population, in opposite halves. **The phase 4 gate is
met in the current default world.** Prediction 4 is also answered: the split is physical (the
A/B processing loci) and arises without a constructed steering preference; whether steering
preferences have also evolved is not measured here.

## Finding and next decision

The world now exhibits the behaviour the project exists for: from one founder, mutation and
local resource-funded reproduction produce two heritable diet strategies that occupy different
regions and each invade the other from rarity. What changed was not the evolutionary model but
the physical world: cells that stay where they are born make local selection possible. Open
next: re-test the toxin producer/resistant/sensitive cycle in the thick medium, since its
failure had the same cause; measure whether steering preferences evolve alongside the physical
split; and decide whether the continuing shrinkage of core targets (to a fifth of the founder)
needs a cost of its own.

The first-campaign record follows unchanged.

**First campaign, old world: the phase 4 gate is not met.** The zoned world can hold constructed specialists but the
founder population has not evolved them in 70–127 generations, with or without an eightfold
physical mutation supply or a threefold larger population. The block is residency: differential
survival by band cannot select on diet while every cell forages across both bands.

The behavioural-supply arm did not change that outcome in 99 generations. The smallest world
change that gives residency without prescribing a route is physical: slower dispersal relative
to generation time, for example a wider world or lower motor power, so that a lineage born in a
band mostly stays there. The toxin study reached the same block from the other side, where
mobility turned a local interaction into a global one. That is a design decision for review,
not a tuning of the outcome. Local artifacts: `evolve-clusters.png`, `evolve-summary.json`,
per-run `samples.json` and checkpoints, and the `invasion-*` case directories.
