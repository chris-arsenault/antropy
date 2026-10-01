# Ecology review guide

**Status:** Current reference — mandatory interpretation rules for live-world reviews and research-direction comparisons.

Read this guide before sampling a world or ranking design directions. The October 1 user
corrections settle the boundaries below; older reports and generic performance targets do
not reopen them. Review actual behavior over time and identify what the evidence can change.

## Accepted computational approximation

Low-volume chemical pruning saves computation. Its material loss is an accepted quantization
artifact, recorded in the accounts. Do not repeatedly present its magnitude as a newly
discovered defect, ecological bottleneck or research priority. Do not propose loss attribution,
threshold changes or retention experiments as prerequisites to unrelated ecology research.
Revisit this decision only if the user explicitly reopens it. A separate accounting error
remains a correctness issue; recorded pruning loss is not an accounting error.

## Reservoirs are habitable islands

Treat reservoir neighborhoods as planets separated by relatively inhospitable space. Most
living cells being near reservoirs is expected. Empty gaps, a small distant population and
low survival away from food do not by themselves indicate a design problem. Do not optimize
for diffuse occupancy or require cells to remain in transit.

The questions are whether cells leave established neighborhoods, exchange populations between
them and found new colonies. A homeostatic colony is valid; universal permanent confinement,
absent inter-colony exchange or absent new colony founding are research concerns. The goal
does not require every cell or colony to migrate, nor prescribe a migration frequency.

Use temporally linked observations to distinguish:

- Departure: a cell leaves its prior reservoir neighborhood, rather than merely changing
  distance from the nearest reservoir or switching an observer's group label.
- Arrival and cross-pollination: cells or their descendants enter another established
  neighborhood and persist or reproduce there. This concerns population exchange; it does
  not imply living-cell gene transfer or outcrossing, which the installed runtime lacks.
- Founding: arrivals establish a reproducing population at a previously unoccupied habitat.
  A passing cell, a shifted grouping boundary or a colony splitting in place is insufficient.

Track reservoir movement and neighborhood identity as well as cell motion. Record births,
deaths and coverage gaps when matching descendants. Distinguish movement, arrival, establishment
and persistence; do not silently infer later stages from earlier ones. Endpoint displacement
and a near/far cohort comparison cannot answer all these questions. If the sampled window or
retained history cannot establish exchange or founding, report them as unmeasured, not absent.
This requirement does not authorize a long campaign: use existing history first and register
any further bounded observation separately.

## Performance scope and priority

The operating goal is approximately 30 ticks/second at approximately 2,000 cells. It is not
a 30-tick requirement at 20,000 cells, and performance currently has low priority. Do not
promote large-population throughput to an engineering priority or ecology release gate in
routine reviews. Retain population, configuration and observation load with measurements;
compare the goal only to a relevant workload when performance is actually in scope. Concrete
execution or recovery failures remain reportable independently of throughput.

## Research-direction review

Read the current work order, complete open proposals and relevant negative findings. Separate
what a mechanism could make possible from what controllers express, descendants inherit and
populations exploit. Reservoir dependence and seed-feedstock dependence are different claims;
neither a nonseed import nor a visual colony proves an ecological role or complementary exchange.

Rank directions against the user's questions about between-habitat movement, cross-pollination,
new colony founding and continuing adaptation. State a missing measurement when it could
change that ranking. Do not use accepted quantization, expected reservoir proximity or an
out-of-scope speed target as reasons to favor a direction. Preserve negative findings and
limits without turning every unmeasured outcome into a prerequisite experiment.

Before reporting, check that each proposed problem is unsettled, each absence has adequate
temporal coverage, and each recommendation follows from the user's ecological goals. Keep
raw numerical accounts and detailed operating data in local artifacts rather than repeating
settled observations in the review's conclusions.
