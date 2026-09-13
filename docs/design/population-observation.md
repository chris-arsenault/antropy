# Population observation

The goal is to observe a world where diverse strategies and adaptation can emerge over days or weeks.
Hypotheses guide opportunities and diagnose inert mechanisms; proving a prescribed strategy pair
or identifying each successful mutation is not a gate on development. Existing negative experiments
remain evidence about their particular bodies, controllers and environments.

<a id="population-independent-views"></a>

## Independent views

The map defaults to inherited A/B allocation on a fixed 0–100% color scale. Recent families are a
selectable map view and population-share chart. For the initial observation
scale, a family is an ancestry branch rooted at generation 0, 4, 8, and so on. Membership follows
parent links to the most recent such root. IDs are the root organism IDs, deterministic across
imports and unrelated to mutations, abundance or analysis sampling. Four generations is a viewing
convention, not a species boundary. Older groups can continue through younger families; disappearance
from a group is not automatically extinction of its descendants. Founder ancestry remains available.

Selecting an organism permits separate genealogical and genetic comparisons. Genealogical distance
is the number of parent-child links through the most recent shared ancestor; separate founder trees
have no recorded common ancestor. Physical genetic distance is RMS difference in expressed log
construction genes. Controller distance uses the controller's opaque genomeDistance operation,
including its learning genes. Neither raw weight proximity nor shared ancestry declares behavioral
equivalence. These distances are not merged into a single similarity score.

Inherited trait plots show stock targets relative to core, A/B processing allocation, and core target
relative to the configured founder. These are separate from actual grown bodies and current damage.
Observed effort distributions use organism decisions sampled every 100 ticks over the most recent
2,000 ticks. They are sample shares, not energy shares or full lifetime histories. Inherited trait
medians also retain a bounded trend history, so a stable population size need not hide changing traits.

<a id="population-strategy-clusters"></a>

## Strategy clusters

Strategy clusters are an optional map color and a descriptive stats panel. Living cells are grouped
by inherited traits (A share of processing, motor, core, defense, toxin, matrix, harvesting and toxin tint), standardized and clustered by deterministic k-means with three centres seeded
at evenly spaced ranks of A share. Clusters are ranked by A share, so orange is the lowest-A
cluster and green the highest at any moment. The scatter plots every living cell over A share and
defense. The table gives each cluster's share and centre traits, and the history chart draws
cluster sizes over retained history, assigning each sample to that sample's own centres.

Up to three clusters are formed; identical founders form one, and empty clusters are not shown,
so nonempty groups can appear as inherited variation appears. Three is the requested grouping
count, not a discovered number of modes or ecological strategies. A continuous spread can be
partitioned this way. Rank colors can change membership over time as centers change; a color is
not a stable species identity. The same clustering, with two centers by default, supplies the
harness `invasion` command with representative genotypes for fresh-world rare-start comparisons.
That assay defaults to mixed deposits unless explicitly configured otherwise and does not
certify coexistence. See [frequency-comparison limits](experimentation.md#experiments-coexistence-criterion).

<a id="population-boundaries"></a>

## Boundaries

An observer projection owns grouping, distance caches and view history. It does not alter worlds,
genomes, random streams, actions, survival or reproduction. No family label enters a sensor or grants
cooperation. Current v8 browser checkpoints preserve observer history separately from physical state.
Ancestry stays complete in numeric pages; family queries can follow dead organisms. Genetic-distance
comparisons show unavailable when the selected dead organism's genotype was pruned. Existing zoom,
field layers, founder reporting and inspection remain available.

Bounded tests cover shared ancestry, family continuity across birth and restore, independent genetic
distances, sampling denominators and unchanged simulation state. A projection of the existing export
checks that one founder can contain several current families. No browser assay or new long ecological
campaign is needed to implement these observation views.

The earlier read-only projection of the tick-48,661 export found 78 recent families among 136 living cells
and 17 founder lineages. Founder 18 held 57.4% of living cells across 35 families; the largest single
family held 4.4% of the whole population. These are subdivisions of recorded ancestry, not evidence
of 78 distinct strategies. Serializing before/after projection produced identical world data, and
restoring the checkpoint reconstructed identical family counts. The bounded integration checks also
cover unchanged deterministic continuation and default UI access. View history cannot reconstruct
what happened before observation began. Current retained history survives restore, with explicit
sampling and thinning; it remains an incomplete record. See [continuation](../continuing-observation.md).

<a id="population-spatial-groups"></a>

## Spatial populations

The observer samples every 25 ticks. A core cell has at least three cells, including itself,
within six world units. Connected cores form a population; neighboring border cells can join
without expanding the group. Isolated cells remain visible and ungrouped. Periodic distances
join seam-spanning populations. A chain of core cells can connect regions; this distance/density
convention is revisable and does not discover species or resource ownership.

Identity matching uses previous member IDs and recorded ancestry, assigning the largest overlap
first. A merger retains one ID; a split gives additional groups new IDs with origin links.
Previously grouped cells retain an origin while dispersing, and descendants can inherit that
observation link. The largest overlap rule and 25-tick cadence reduce transient changes; there is
no separate persistence threshold or guarantee against label flicker near the grouping boundary.

Events record appearance, split, merger, migrant ancestry entering an existing group, dissolution,
and a first observed descendant birth after the group's first sample. The last is labeled founding:
it is an inference from birth tick and group membership, not exact birthplace or evidence of lasting
establishment. Migration events can include members of a merger. Dissolution means the group no longer
meets the convention; it does not claim every former cell died or that the site is empty.

Current regions retain member IDs, founder-ancestry counts, origin links and mean inherited A allocation.
Historical frames retain locations, counts, trait means and global birth/death counters. The latest
2,048 events survive with an explicit dropped-event count; at most 240 frames retain older observations
through thinning. Missing frames never imply an unobserved route or extinction.
