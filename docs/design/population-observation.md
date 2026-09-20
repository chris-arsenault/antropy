# Population observation

The goal is to observe a world where diverse strategies and adaptation can emerge over days or weeks.
Hypotheses guide opportunities and diagnose inert mechanisms; proving a prescribed strategy pair
or identifying each successful mutation is not a gate on development. Existing negative experiments
remain evidence about their particular bodies, controllers and environments.

<a id="population-independent-views"></a>

## Independent views

The map defaults to usable cell energy over field energy per material. Recent families are a
selectable map view and population-share chart. For the initial observation
scale, a family is an ancestry branch rooted at generation 0, 4, 8, and so on. Membership follows
parent links to the most recent such root. IDs are the root organism IDs, deterministic across
imports and unrelated to mutations, abundance or analysis sampling. Four generations is a viewing
convention, not a species boundary. Older groups can continue through younger families; disappearance
from a group is not automatically extinction of its descendants. Founder ancestry remains available.

The Lineage window shows recent family and founder share charts, current counts, percentage-point changes
and clickable identities. Family rows show parent family, root birth tick and generation; inherited
motor/core and membrane means are available separately. Family charts use retained samples from
the last 2,000 ticks; founder charts use the complete retained timeline. Stable hues match the map's
family/founder modes. Current leaders and previously prominent groups remain visible together.

Each saved sample contains at most the largest 64 families and founder ancestries. An absent group
has zero recorded members only when retained counts sum to the entire population. Otherwise its
share is unknown: chart paths break and changes are unavailable. A zero denominator is also
unavailable. Neither an omitted group nor a four-generation family rollover is reported as extinction.

Selected-cell genealogy shows its family origin, founder, ancestor path, children, siblings and
living descendants. It remains available after death or division. The inspector sends the nearest
12 ancestor records and up to 24 entries per relative list, with full counts; follow an earlier
ancestor or enter any recorded cell ID to navigate the retained tree. These display limits do not
remove parentage from checkpoints. Genetic comparisons explicitly distinguish a pruned genome
from zero genetic distance.

Selecting an organism permits separate genealogical and genetic comparisons. Genealogical distance
is the number of parent-child links through the most recent shared ancestor; separate founder trees
have no recorded common ancestor. Physical genetic distance includes expressed construction investments and fixed chemical alleles. Controller distance uses the controller's opaque genomeDistance operation,
including its learning genes. Neither raw weight proximity nor shared ancestry declares behavioral
equivalence. These distances are not merged into a single similarity score.

Inherited trait plots show core, motor, receptor, import and enzyme investment, membrane coordinates
and investment-weighted mean import targets. These are separate from actual grown bodies and current damage.
Observed effort distributions use organism decisions sampled at the latest 25-tick census. They are sample shares, not energy shares or full lifetime histories. Inherited trait
medians also retain a bounded trend history, so a stable population size need not hide changing traits.

<a id="population-strategy-clusters"></a>

## Strategy clusters

The browser uses membrane distributions and inherited trait histograms without prescribing a
number of groups. The invasion harness retains explicit deterministic k-means partitions over
membrane X/Y, motor/core, import/enzyme investment and import X/Y targets. Requested k is 2–8;
identical founders cannot supply a fabricated second occupied cluster. Representatives are
observed medoids, and chosen partitions remain descriptive rather than discovered species.

Rare-start comparisons retain the source physical/chemical configuration and explicit source
interventions, with ancestry-based cohort accounting. They can test conditional performance;
they cannot certify coexistence from cluster labels. See [frequency limits](experimentation.md#experiments-coexistence-criterion).

<a id="population-chemical-web"></a>

## Chemical roles and transformation web

The Web window groups living cells by installed enzyme capability. Its default primary view
assigns each cell to the strongest nonidentity input→output branch, weighted by funded enzyme
stock, compiled catalytic coefficient and product weight. Ties prefer smaller chemical IDs;
cells without funded conversions remain unassigned. Primary counts partition the population.
The Enzyme input and Enzyme output map colors use this same assignment and chemical identity hue.
Current map defaults remain unchanged.

All supported enzyme routes includes every positive compiled branch from funded machinery.
It counts each cell once per pair, even when duplicate enzyme slots support that pair. Counts
across pairs overlap. Installed machinery, rather than inherited targets awaiting paid refit,
determines both views. These are capabilities, not measured intake, export or cross-feeding.

Directed arcs occupy fixed positions on the 16×16 chemical manifold. Selecting a node filters
incoming/outgoing pairs and can select that chemical on the world map. The graph and table show
the same 64-route page with explicit totals and paging. Environmental pathways separately shows
the world's compiled possible local-medium transformations, including its energy gate; local
material and exposure determine whether those routes operate. Dashed arrows are not measured
flux. Rings identify chemicals present in currently releasing reservoirs.

Only an open Web window requests these bounded reductions. They never alter simulation state
or accumulate history. See the [implementation and verification record](../plans/archive/CHEMICAL-WEB-PLAN.md).

<a id="population-boundaries"></a>

## Boundaries

An observer projection owns grouping, distance caches and view history. It does not alter worlds,
genomes, random streams, actions, survival or reproduction. No family label enters a sensor or grants
cooperation. Current v11 browser packages preserve observer history separately from physical state.
Ancestry stays complete in compact numeric records; family queries can follow dead organisms. Genetic-distance
comparisons show unavailable when the selected dead organism's genotype was pruned. Existing zoom,
field layers, founder reporting and inspection remain available.

Bounded tests cover shared ancestry, family continuity across birth and restore, independent genetic
distances, sampling denominators and unchanged simulation state. A projection of the existing export
checks that one founder can contain several current families. No browser assay or new long ecological
campaign is needed to implement these observation views.

The historical pre-chemistry read-only projection of the tick-48,661 export found 78 recent families among 136 living cells
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

Current regions retain member IDs, founder-ancestry counts, origin links and mean inherited membrane X.
Historical frames retain locations, counts, trait means and global birth/death counters. The latest
2,048 events survive with an explicit dropped-event count; at most 240 frames retain older observations
through thinning. Missing frames never imply an unobserved route or extinction.
