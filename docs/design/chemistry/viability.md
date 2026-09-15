# Reproductive viability

> Historical first TypeScript chemistry implementation (v9). Its measurements and decisions
> remain evidence for that version. The [Rust/WASM numerical contract](numerical-engine.md),
> [current results](numerical-results.md) and [migration dispositions](numerical-migration.md)
> supersede its runtime choices and unfinished work order.


The default world must support repeated resource-funded reproduction before it
is ready for long observation. A full energy store, living cells, or one division
paid from founder reserves does not establish that condition.

## Registered diagnosis

The previous 2,000-tick operating run (ledger 3545) ended with 19 of 48 founders,
no divisions, and 29 starvation deaths. Survivors held 0.81–1.51 usable energy,
but only 0.048–0.259 internal matter; division requires 0.6 internal matter and
all body stocks at twice their birth target. Their least-complete stock was
61–95% of that division target. Damage was 0.315–0.764. Placement blocked no births.

Competing explanations are insufficient uptake, wasteful constitutive product
export, repair consuming construction matter, and movement losing access to
usable deposits. The founder constantly activates both import and both export
slots. Its processed matter is usable for construction, so export is a plausible
avoidable loss rather than an obligatory waste-disposal step.

First screen: one founder, mutation and learning frozen, the existing finite
96-unit Gaussian resource patch or empty control, and production chemistry,
mechanics and RNN inference. Compare stationary ordinary transport against
stationary export-disabled transport. Keep all body stocks and their costs.
Use 300 ticks, one seed (101), 30 seconds per case. Inspect import, export,
repair, growth, damage, energy and inventory before any continuation.

Then test the causal candidate through daughter reproduction, at a declared
1,500 or 3,000 ticks with the same wall cap, and test the moving founder. These
longer short assays are justified by the measured construction rate and the
need to distinguish initial reserves from a repeated funded life cycle. Stop
at the declared horizon, extinction or wall cap; do not expand seeds or horizons
automatically. No selection or evolved coexistence claim follows from these tests.

Integration requires support on ordinary finite renewing deposits, small groups
and ordinary local movement. The default two-colony world must reproduce while
remaining sparse and sustaining at least 30 ticks per second. Local test results
establish physiological and ecological opportunity; days-long evolution remains
the user's experiment.

Run a named screen with `pnpm harness viability --case resident,retain,empty,empty-retain
--ticks 300 --output harness/artifacts/viability/screen` from `frontend`.
Each case uses the existing quick runner, accounting, traces, checkpoints and ledger.

## First result and integration registration

Rows 3558–3561: disabling exports increased 300-tick constructed matter from
0.505 to 2.746; the original resident imported 1.857 and exported 1.882. The
retaining cell divided at tick 137. Rows 3562–3564: its daughter divided at 738
with or without propulsion, while the empty control never divided and died at
318. Both finite-patch populations later starved (1356 stationary, 1313 moving).
This confirms the export loss and a repeated funded life cycle, not renewal support.

The proposed ordinary founder retains feedstock until storage exceeds 75%
capacity, using the existing inventory sensor and mutable RNN output weights.
Machinery, export physics, repair costs and chemical identities remain unchanged.

Next tests use the first and farthest default seed-101 deposits (the two startup
opportunities), isolated in a 64×64 periodic field. Preserve radius, richness,
composition, stock, release rate and priming; omit other deposits and freeze
mutation/learning. One cell per deposit tests access; four cells per deposit test
local demand and daughter growth. Use 1,500 ticks, 30 seconds per case. A moving
single cell on the earlier finite patch checks the storage response against the
export-disabled result. Then run the default 2,000-tick operating workload with
mutation and learning enabled, subject to its existing 90-second budget.

Rows 3565–3569: retention reproduced the finite-patch result, but the first
renewing deposit lost its single founder at 1216 and four founders at 906. The
second supported one division at 1493; its four-cell group had no divisions.
Repair consumed 1.84 matter versus 2.77 growth in the first group, and 4.38
versus 4.57 in the second. The default retained product has stress 0.763 and
the membrane matches the low-stress input instead of that internal product.

Next causal contrast: change only the membrane coordinate to the retained
product coordinate in those two four-cell fixtures. Keep actual body stocks,
transport, enzymes, resource supply, movement and all physical coefficients.
Use the same 1,500-tick/30-second horizon. Predict less repair replacement,
more material available for growth and daughter divisions if uptake is adequate.
The physical transport ceiling remains a competing explanation: the slow,
high-impedance source is not made more accessible just by adding its material.

Rows 3571–3572: compatible membranes reduced repair matter to 0.724 and 0.852;
growth rose to 5.743 and 10.401. The two groups produced one and four divisions,
respectively. This justifies seeding the ordinary membrane at its retained
metabolite coordinate, with no immunity or change to stress physics.

The initial interpretation that 24 founders per starting deposit necessarily overfilled
these opportunities was unsupported. Row 3570 already produced 39 divisions and fourth-generation
descendants at 48 founders. The temporary change to four per colony (eight total) was an
untested crowding hypothesis and invalidated the performance comparison. It is withdrawn:
startup again uses 48 cells while retaining the independently tested physiological repairs.

Follow-up registration: 3,000 ticks for the two compatible four-cell deposits,
30 seconds each, to observe daughter reproduction after measured first divisions
at ticks 929–1393. One additional 2,000-tick operating check tests the integrated
eight-founder default with mutation and learning. The retention-only default
load attempt (row 3570) hit its 90-second cap at 1419 ticks; new chemical diversity
made that workload slower. Performance therefore needs revalidation after this fix.

## Completed checks and remaining meaning

Rows 3573–3574 reached 3,000 ticks. The weaker isolated deposit retained one cell after
two divisions and five deaths, with no daughter division. The stronger deposit retained eight
cells after ten divisions and six deaths; six daughters reproduced at ticks 2501–2934.
Its resources support a repeated life cycle under these conditions. The weak result remains
a limit on local carrying capacity, not a failed command to rerun until it grows.

Historical eight-founder trial (3598): eight founders became 24 living cells after 2,000 ticks,
with 21 divisions, five deaths and generation three. Thirteen divisions were by descendants;
all eight initial lineages remained represented. Four founders per colony are placed compactly
enough to remain two visible starting groups; three-seed placement tests check the observer
groups without advancing ecology. There is no automatic reseeding or lineage protection.

For that smaller workload, computation including field pixels and summaries averaged 54.8 ticks/s, with every
250-tick window above 40.4. [Performance](performance.md) records the precision choice,
the rejected comparison, passing refinement, exact restoration and actual numerical sinks.

The restored 48-founder world produces 56 divisions and 47 deaths in 2,000 ticks, reaches
74 living cells and ends at 57 with fourth-generation descendants. The
[population performance record](population-performance.md) keeps its current timing evidence.

These results establish acquisition, construction and repeated reproduction, not successful
dispersal or evolved coexistence. The eight-founder trial recorded 8,000 blocked division attempts and only
6.35 total units of powered translation across all cells; contact displacement is not included.
Local crowding and resident behavior therefore remain material limits when interpreting the
world. Motion and spatial evolution are not certified by the birth count. No days/weeks
ecology was run, and no evolved winner was installed as the founder.

The revised founder and numerical defaults apply to new worlds. Restoring an older checkpoint
preserves its saved settings and immutable genotypes; it does not quietly retrofit these choices.
