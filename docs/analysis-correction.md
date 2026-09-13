# Correction of September 12–13 ecological analysis

Reviewed September 13, 2026 from saved result and manifest bodies. No simulation was advanced.
The earlier reports confused an increase in descendants with an increase in population share,
and used the presence of chosen k-means groups as evidence of ecological differentiation.
Their coexistence passes are withdrawn. The project direction is now
[hypothesis-led world design for continuing user observation](design/README.md), not completion
of those outcome gates. This change of purpose does not excuse the analysis errors.

## Method and durable evidence

For each starting ancestry group, compare `100 × initialCells / sum(initialCells)` with
`100 × living / sum(living)`. The difference is in percentage points. If the whole population
is extinct, the final share is undefined. Cumulative divisions per founder do not measure either
frequency advantage or generations of persistence.

[The audit JSON](evidence/contest-audit-2026-09-13/evolved.json) preserves 60 contest endpoints:
48 from the seven-mechanism campaign and 12 from the thick-medium zoned study. It includes all
group counts, denominators, exact shares, stopping reasons, settings, source-change flags and
SHA-256 hashes of the source results and manifests. Original checkpoints, traces and ledger rows
are unchanged. Source-change flags describe provenance limits; an endpoint recalculation neither
repairs a mixed-source run nor certifies its physics. The audit uses ancestry groups, which can
change their traits during the gene-transfer contests.

The [constructed-contest audit](evidence/contest-audit-2026-09-13/constructed.json) retains another
168 saved endpoints from the September 11 zone and September 13 cycle/toxin fixtures. It supplies
the denominators used in their corrected study narratives. These are historical fixtures across
several parameter revisions, not 168 new tests or one coherent current-world comparison.

Reproduce to a new local file from `frontend`:

```bash
python3 harness/rps_report.py harness/artifacts/invasion-2026-09-13 harness/artifacts/evolve-2026-09-12b --audit harness/artifacts/corrected-endpoints.json
python3 harness/rps_report_test.py
```

The existing reporter now includes initial/final shares and changes in its ordinary summaries.
The audit option reads saved endpoints recursively and refuses to overwrite its output.

## Seven-mechanism campaign

All rare groups started at 7/64 = 10.9375%. Each table entry is the final share in the two
separate rare-start contests for that seed, rounded to two decimals. Each contest ran 12,000
ticks to its declared horizon. These are endpoint comparisons, not coexistence verdicts.

| Configuration | Seed 101 | Seed 202 | Seed 303 | Pairs with both endpoint shares above their starts |
| --- | --- | --- | --- | ---: |
| Cycle, crowding 0.5 | 7.04% / 17.68% | 31.31% / 1.28% | 21.62% / 5.43% | 0/3 |
| Cycle, crowding 0.75 | 27.03% / 6.36% | 36.50% / 6.25% | 25.00% / 11.01% | 1/3, second direction nearly unchanged |
| Typed toxin | 9.85% / 11.03% | 8.72% / 41.34% | 0.00% / 34.45% | 0/3 |
| Predation, corrected rerun | 15.14% / 17.71% | 27.59% / 8.20% | 12.50% / 16.36% | 2/3 |
| Disturbance | 5.30% / 15.44% | 20.54% / 4.15% | 2.75% / 44.57% | 0/3 |
| Gene transfer | 13.06% / 4.44% | 26.20% / 7.53% | 22.90% / 5.25% | 0/3 |
| Sharing | 2.91% / 62.19% | 0.93% / 27.93% | 7.36% / 15.16% | 0/3 |
| Signal | 2.44% / 24.28% | 25.00% / 6.67% | 2.97% / 34.67% | 0/3 |

Thus three of 24 pairs increased both ways at the endpoint, not the reported 16 passes.
One of the three is only a +0.072 percentage-point change in its weaker direction. No statistical
confidence or persistent coexistence follows from this count. Gene transfer did not pass in any
seed by this comparison; predation has two positive pairs rather than three. The reported
harvester/consumer pair in cycle seed 101 loses share in the consumer direction. Those cycle
evolution runs also used harvesting maintenance and exudation, which were subsequently removed.

The mechanisms still have physical findings: resources were fixed from carbon, food was shared,
genes transferred, disturbances killed cells, and damage-related feeding occurred. These are
different claims from diverse ecological roles. Typed toxin did not develop separated tint modes;
sharing did not develop gatherer/receiver roles; signal use was not demonstrated. A failed named
prediction cannot be rescued by unrelated variation in body size or diet.

## Thick-medium zoned study

At the 250,000-tick source endpoints, the rare groups actually start at 5/48 = 10.4167%, not
the report's 7/48. Final shares in the two 12,000-tick contests:

| Source seed | Lower-A group rare | Higher-A group rare | Endpoint interpretation |
| --- | --- | --- | --- |
| 101 | 191/1,067 = 17.90% | 241/1,047 = 23.02% | Both increase |
| 202 | 302/1,008 = 29.96% | 62/1,112 = 5.58% | One direction declines; not neutral |
| 303 | 343/1,076 = 31.88% | 154/1,040 = 14.81% | Both increase |

The recorded inherited diet differences and opposite-band occupancy are meaningful proof points
for local resource selection. The old-world comparison changed viscosity, deposit density/supply,
recycling and mutation together, so the full ecological change is not attributable solely to
viscosity. A separate residency probe supports the narrower movement mechanism.

At seed 101's 200,000-tick checkpoint the old table also selected the wrong group's count in
the higher-A rare contest: the rare group ended at 894/1,049, not 155. The corrected row is in
the evolution study and the full audit. This does not alter the 250,000-tick comparison above.

## Limits and decisions

The former protocol demanded 20 generations of increasing frequency and 200 generations above
5%; those conditions were not demonstrated. Source-run maximum generations are not durations of
two established strategies coexisting. No new long campaign is required to fill that old gate.

The assays start both groups in fresh environments and change the world dimensions and deposit
counts from the source runs. They test those declared contest conditions. They do not introduce
rare organisms into an established resident population, isolate each differing trait, measure
all source-population diversity, or certify a days/weeks live run. Mixed deposits remain spatially
patchy, so they cannot establish that all selective heterogeneity was generated by organisms.

Use these findings to choose which physical opportunities deserve a place in the observation
world and which need a small missing-link test. Separately address continuity, storage and
observation over days or weeks. Leave the actual long evolutionary history to the user's run.
