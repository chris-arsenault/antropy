# Horizontal gene transfer: traits that travel by contact

Registered September 13, 2026 as phase 5 of
[roadmap two](design/README.md#design-roadmap-2), before reading any endpoint. Sulion plan
`Organism-generated selection`. Artifacts: `frontend/harness/artifacts/evolve-2026-09-13/transfer/`.

## Question

Every evolved cluster so far is a lineage: a trait spreads only by descent, and clusters are
also families. With [transfer](design/strategic-ecology.md#ecology-gene-transfer) on, a physical
locus can move between touching cells of different genotypes. Does a population with transfer
still form clusters that mutually invade, and do those clusters cut across lineage (the same
construction traits in unrelated families) rather than coincide with it?

## Setup

`pnpm harness evolve --world mixed --transfer-rate 0.001 --seed 101|202|303`, 150,000 ticks,
thick medium, mixed deposits, defaults otherwise. At 0.001 per touching pair per second a cell
with three contacts receives a locus roughly every 1,700 ticks, about once per generation.
Control: the undisturbed mixed arms of the [evolution record](evolve-study.md).

## Predictions, recorded before results

1. Transfers occur at the expected order (thousands per 150,000 ticks) and the number of live
   genotype records per cell rises above the control's.
2. Clusters that emerge mutually invade from 10%, and cluster membership is less aligned with
   lineage than in the control: the largest cluster draws on more than one founder-rooted
   family.
3. If transfer homogenises the population instead (one cluster, no invasion pair), that is the
   finding: contact is frequent enough that transfer erases structure at this rate.

## Results

Interpretation corrected September 13 from [saved endpoint shares](analysis-correction.md).
The questions and predictions above preserve the original registration, not the current work order.

Three arms completed (`evolve-2026-09-13/transfer/`) with 8,726, 7,455 and 12,044 transfers
over 150,000 ticks, the expected order (prediction 1). Populations were larger than the
undisturbed mixed arms (774–947 cells) and generations similar (55–62).

| Arm | Cells, maximum generation | Transfers | k = 2 clusters (n, A share %, core %, machinery %) | Rare-start endpoints (group/total, share) |
| --- | --- | --- | --- | --- |
| 101 | 913, 62 | 8,726 | 304 at 49 / 45 / 1.7 versus 609 at 59 / 42 / 2.2 | 41/314 (13.06%) and 12/270 (4.44%): one direction declines |
| 202 | 774, 55 | 7,455 | 273 at 59 / 42 / 2.8 versus 501 at 64 / 53 / 2.0 | 71/271 (26.20%) and 21/279 (7.53%): one direction declines |
| 303 | 947, 58 | 12,044 | 517 at 53 / 32 / 2.3 versus 430 at 56 / 40 / 2.0 | 79/345 (22.90%) and 20/381 (5.25%): one direction declines |

Every rare group started at 7/64 (10.94%). None of the three pairs increased share in both
directions; the former all-seed pass is withdrawn. Transfer events establish that physical genes
can travel through contact. The reported diet/body variation does not establish distinct roles:
the analysis requested two groups rather than testing whether two modes exist. Smaller gaps
are compatible with mixing but do not isolate its effect.

Transfer remains enabled in these contests. The observer tracks descendants of the initial
groups, whose genes can change by contact, so ancestry persistence would not prove persistence
of the initial strategies. Whether traits spread across unrelated families was not measured.
The useful proof point is actual transfer; its effect on ecological opportunities remains a
world-design hypothesis rather than a completed coexistence result.
