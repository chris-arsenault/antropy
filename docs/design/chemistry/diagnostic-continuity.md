# Diagnostic display continuity

September 14, 2026. The Rust/WASM migration changed the sidebar more than its data boundary
required. This audit compares the prior FamilyPanel, LineagePanel, RelationshipPanel,
InheritedTraits, GeneInspector, TraitPanel, EvolutionStats and StrategyPanel implementations with
the worker-backed displays. A table containing related numbers is not automatically a replacement
for a chart, comparison, or navigable relationship.

The reliability implementation closes the data/display gaps listed below. Current measurements
and remaining browser acceptance are in [reliability results](reliability-results.md).

## Genealogy restored

| Previous display | Current equivalent |
| --- | --- |
| Recent family-share chart, including previously dominant families | Stable-color share chart over retained samples in the last 2,000 ticks; present and historical leaders, whole-population denominators and explicit missing-coverage gaps |
| Family origin, share change and inherited profile | Clickable family root, parent-family ID, root birth/generation, living count, percentage-point change; motor/core and membrane coordinate means |
| Founder history chart and counts | Stable-color founder-share chart over retained history, living count and change; click through to the root's genealogy |
| Selected organism's family/root context | Family and parent-family identity, founder, family birth/generation and recorded cell age events |
| Parent/child relations and nearest relatives | Ancestor chain, children, siblings, living descendants and nearest living relatives with separate physical/RNN distances; ended organisms remain navigable |
| Persistence of parentage and history | V11 saves preserve complete Rust parentage and retained samples. Earlier saves are rejected. Chart samples initialize React once, then update by delta under the [sharing contract](data-ownership.md) |

Family disappearance is not descendant extinction. When the top-64 history omits a group, absence
is unknown unless the sample accounts for all living cells. Selected-cell descendant counts use
complete parentage. Founder roots are distinct even when their genotypes are identical.

## Other diagnostics: retained equivalents and gaps

| Previous capability | Current disposition |
| --- | --- |
| Population totals/history and throughput | Retained; kernel memory and balance measurements added |
| Inherited trait histograms and median trends | Retained with chemical machinery and membrane traits replacing obsolete named investments |
| Current body versus inherited construction targets | Retained as structured stock/target rows in the cell inspector |
| Local sensor readings, actions, private state and manual byte override | Retained; override history remains durable |
| Chemistry/property/mixture and transfer inspection | Chemical atlas, fixed-slot targets, internal/external mixtures and species-specific flows |
| Spatial population selection and event/history browsing | Retained independently of family/lineage identities |
| Recent 2,000-tick behavior distributions | Seven effort distributions aggregate at most 81 censuses spaced 25 ticks apart. Captured endpoints and the cell-observation denominator are explicit; missing earlier coverage is not reconstructed |
| Distinct inherited sequence count, founder-relative construction means and population RNN divergence | Rust counts equal chromosome sequences separately from IDs; reports living-cell-weighted target means relative to genotype 1 and inherited-controller RMS-distance quantiles |
| Population developed-body ranges and acquired-learning summaries | Fifteen actual stock distributions and controller-owned acquired-weight-change magnitudes, shown as p10/median/p90. Magnitude does not establish usefulness |
| Source-epoch status and population task distribution | Current source phase/next transition and a 256-value opaque-register histogram; no assigned task semantics |
| Three-way A/B strategy partition and frequency history | Named A/B axes are obsolete. Current chemical traits and a 16-bin membrane-X share history replace that view without forcing three populations. Marks use actual retained times and whole-population denominators; X does not capture Y divergence or identify species |

The expanded panel remains behind bounded reduced queries. Recent and longitudinal samples use
retained indices plus appends. Full genotype/controller arrays never cross for population statistics.
Selected inspection presents the cell's birth-fixed chemical configuration alongside actual
funded stock and activity. See [birth-fixed capabilities](installed-machinery.md).

These are descriptive observations. An ancestor comparison still needs controlled body funding,
private state and exposure; demographic recovery or trait movement alone does not establish adaptation.

<a id="verification-and-operating-cost"></a>

## Original genealogy verification and operating cost

`make ci` passes 40 Rust and 40 TypeScript tests, with the same 14 nonblocking lint warnings.
Tests cover unrelated founders, family rollover, shared-ancestor distance, divided parents,
living descendants, exact restore, bounded 100,000-record inspection and unchanged physics.
The UI test navigates from a restored divided parent to a living daughter. Chart tests retain
previous leaders and distinguish missing coverage, zero membership and zero population.

Ledger 3676–3678 repeats the registered capacity loads with the added genealogy summaries:
221.6 ticks/s at 48 cells, 61.0 at 2,000 varied cells and 33.8 under funded growth. Lowest
20-tick windows are 192.1, 59.2 and 31.5. This includes packed rendering preparation and worker
observation/inspection, but excludes GPU execution and React rendering. See the
[retained report](../../evidence/digital-chemistry/genealogy-capacity.json).

Ledger 3679 repeats the seven storage cases. All preserve exact continuation; the two-million-
ancestor case remains at 406 MiB sequential WASM high-water memory. Selected inspection takes
29.4 ms there, versus 7.6 ms before the additional genealogy projection. It traverses retained
parentage but sends bounded display records. Ordinary 48-founder inspection takes 0.73 ms.
The [retained storage report](../../evidence/digital-chemistry/genealogy-storage.json) includes
the exact binary digest and all cases. These checks are synthetic load and integration tests;
no development server, browser ecological assay or long evolution campaign was started.
