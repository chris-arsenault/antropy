# Travel cost and access to food

September 25, 2026. Chemical conversion and its performance thresholds are excluded.
The previous investigation's numerical recommendation is withdrawn from this task.

September 26 disposition: the user backlogged the resulting [local resource seasons
proposal](design/local-resource-seasons.md). The recommendation below is retained as
experimental direction, not an active implementation work order.

The measurements below predate the September 26
[ecological incentives](plans/ECOLOGICAL-INCENTIVES-PLAN.md) changes. New runs use the current
kernel and are new comparisons; the archived kernel retains the historical evidence.

Question: does the current cost of reaching a food patch prevent a mobile cell from
recovering the advantage of access? A competing explanation is that sensing, steering,
or residence after arrival dominates, so faster movement would not help.

The earlier [food-access study](quick-food-access-study.md) found a benefit to movement
for distant brief food. The [capability study](capability-investigation.md) then found
that inventory braking sacrificed that benefit. Those results predate the current
kernel. This assay tests travel and residence directly without repeating that brake.

## Registered comparison

Six single-founder probes, seed 701, 300 ticks and 120 wall seconds per case. Use the
ordinary founder genotype and actual newborn stocks, no target-body reconstruction.
Mutation, private learning and birth assimilation are frozen. All worlds are 32 by 32,
mesh 2, with no reservoirs and one finite 96-material Gaussian patch of source species 0,
sigma 2, centered at (16,16). Ordinary washout and chemistry remain active. Constant
external illumination 1 and no terrain shade remove positional light differences.

Compare three treatments at the patch center and eight units away:

- Resident: founder controller with both motor outputs zero.
- Swimmer: founder controller with swim-logit bias increased by 0.3.
- Lower-drag swimmer: identical swimmer, viscosity 0.001 instead of 0.004.

Both near and far cases use the same washout, food quantity and composition. Far cells
start facing 45 degrees away from the patch direction; local sensing must steer them.
No controller receives a target coordinate. The near resident is a feeding control.
Actual initial bodies, inventory, energy and analytical movement budgets are archived
before any case steps. These are diagnostic founder policies, not sampled live strategies.

For motor power P, radius r, local mobility m and viscosity eta, the installed law gives
maximum speed sqrt(P * efficiency * m / (8 * eta * r)). At swimming effort u and turning
effort w, motor expense is P * (u squared + w squared / 4). Quartering eta doubles the
unimpeded speed at unchanged motor power. It also doubles turning speed; improved net
displacement is therefore a prediction, not an algebraic certainty. Passive chemical
motion does not receive this viscosity multiplier. Food income must cover travel,
upkeep, pumping, repair and construction; initial reserve expenditure is not profit.

Prediction: the far swimmer gains access that the resident cannot, and reduced drag
improves arrival or intake per motor expense. Near food, residence should save travel
expense. If steering fails, inspect the recorded local contrasts and paths before
recommending more motor power or more environmental variation. A reversal between
contexts supports heterogeneous opportunities; it need not establish coexistence.

Run probes first. At most two paired 16-founder follow-ups of 1,500 ticks each may be
registered after inspection, with swapped placement if spatial assignment matters.
No seed sweep, automatic horizon extension or production configuration change.
Use the existing quick runner, observer and ledger. Raw evidence stays under ignored
`frontend/harness/artifacts/movement-opportunity-20260925/`. The running world is
unchanged; its authenticated status query was denied because the token is locked.

Reproduce from `frontend`:

```sh
pnpm exec tsx harness/numerical/movementOpportunity.ts harness/artifacts/NEW_DIRECTORY
```

## Probe result and registered competition

All six probes reached 300 ticks. At distance eight, the ordinary swimmer family
imported 17.79 material and built 12.06, versus 10.98 imported and 7.71 built for the
resident family. Motor expense was 0.476 energy. The lower-drag swimmer imported 19.87
and built 12.46, with 0.598 motor expense. At the food center all three families built
12.46 material. These flows include descendants; the original founder divided before
entering the two-unit target circle. A missing founder-arrival event is not failure
to feed from the patch's spreading outskirts. Initial bodies and stores match, with
0.8 inventory in capacity 1.6; there is no overfilled reconstructed-body confound.

The ordinary movement law already provides a useful access advantage. A general drag
reduction is therefore not the first recommendation. Compare eight residents and eight
ordinary swimmers around the same patch, alternating positions on an eight-unit ring.
Two runs swap assignments; keep initial headings 45 degrees off inward, 96 total food,
ordinary viscosity and all other probe settings. Stop at 1,500 ticks or extinction,
120 seconds per case. Observe intake and expenditure by initial family, and whether
swimmers capture the patch while resident families rely on its outskirts. No lower-drag
population run: the decision is whether ordinary mobility can exploit temporary local
food under competition, not which viscosity maximizes population.

```sh
pnpm exec tsx harness/numerical/movementOpportunity.ts harness/artifacts/NEW_CONTEST_DIRECTORY contest
```

## Result and deferred direction

**Deferred recommendation: spatially coherent variation in resource renewal.**
The current movement and local sensing can already make access to a temporary patch
repay motor expenditure. Merely adding more shade or reducing drag does not address
whether leaving an established feeding area is worthwhile.

Both competitions completed at tick 1,500. Each group began with eight founders of
identical physical construction; only the controller motor policy differed.

| Measurement | Residents, assignment 1 / 2 | Swimmers, assignment 1 / 2 |
| --- | --- | --- |
| Cumulative imported material | 36.74 / 33.58 | 89.27 / 91.27 |
| Cumulative constructed material | 19.63 / 16.76 | 48.94 / 49.12 |
| Total divisions | 8 / 8 | 20 / 24 |
| Motor energy spent | 0 / 0 | 26.84 / 27.75 |
| Living descendants at horizon | 3 / 4 | 11 / 11 |

At tick 300 the swimming families occupy the patch outskirts while resident families
remain near the initial ring. By tick 1,500 the surviving swimmers are distributed
across the arena. The local figure `competition.png` shows both arrangements at
ticks 0, 300 and 1,500. These snapshots establish spatial redistribution, not smooth
motion quality. Later roaming may include unsuccessful searching as supply declines.
Imports include recycling and are not a fraction of the original 96-material dose.
This is a finite-meal advantage for an authored policy, not evolved coexistence,
an invasion result or evidence that a colony loses in every setting.

### Why individual source gaps may not create patch turnover

The current `Source::finish` draws an independent exponential waiting interval after
each reservoir empties. `Source::renew` refills that reservoir at its current position;
its ordinary physical movement continues, but renewal does not relocate it. With a
600-second stocked period and mean 2,400-second wait, its long-run stocked fraction
is 600 / (600 + 2400) = 0.2. For n independent neighboring sources, the simplified
probability that every source is empty at a random time is 0.8 to the power n:
32.8% for five sources and 3.5% for fifteen. This is an illustrative availability
calculation, not a measured famine frequency; rates differ and dissolved food persists.

In the saved mature world at tick 134,921, fifteen reservoirs lie within twelve units
of at least one cell in the largest 2,648-cell group; five contain material. The
982-cell group has five nearby reservoirs, one stocked. Twelve units is a descriptive
geometric neighborhood, not a feeding radius, and these overlapping counts do not
assign food to colonies. The checkpoint predates the new terrain and is not today's
live measurement. Together with the renewal implementation, it supplies a plausible
reason for enduring feeding locations despite independently intermittent reservoirs.

The recommended change should make neighboring supplies sometimes decline together
while other nearby areas remain productive. Retain ordinary finite reservoirs and
their material/work accounts, and preserve mean external supply in the comparison.
Use a spatially continuous environmental timing field with differing local phases,
rather than a worldwide synchronized drought or a rule responding to colony size.
This implements the backlog's uneven-renewal direction; it is a design recommendation,
not an implemented or experimentally validated renewal law.

Set the spatial and temporal scales from reachable travel: an opportunity at distance
d must remain available longer than d divided by effective swimming speed, and the
journey must fit the cell's reserves plus food encountered en route. The present test
establishes access across eight units for this founder, not across an entire map region.
Large stable feeding areas can still reward residence and collective living; changing
edges and smaller temporary opportunities can reward leaving, searching and returning.
The desired coexistence is plausible from those different returns, not prescribed.
Static terrain resistance may further shape routes, but resistance alone cannot create
a benefit to departure. No source homes, lineage rewards or added chemical rules follow.

## Delivery and validation

Added a reusable assay command and this decision record; corrected the prior document's
selected direction. Production defaults, chemistry and the running world are unchanged.
The eight runs advanced 4,800 total ticks, ledger rows 4380–4387. Their archived kernel
source digest is `83a97ae485d1c66cb1c6fab8ad7c344be66bb9e03961da83f8b330d29869fc27`,
independently checked against the Rust sources, compiler and build flags at measurement time.
Maximum energy/material residuals are below 1.45e-12% / 1.09e-13% of the runner's
initial-plus-supplied budgets. The six probes took under 0.4 seconds of stepping in
total; the paired competitions took about 3.6 seconds. These small worlds do not
measure mature-server throughput.

Raw checkpoints, manifests, traces and ledger remain ignored. The local `report.py`
reads saved evidence and writes `analysis.json` and `competition.png`; it advances no
simulation. The authenticated live status check was denied with broker HTTP 403,
`secret is not unlocked for this terminal`. No alternate credential path was attempted.

`make ci` passed after correcting TypeScript numeric conversions in the new budget
report: 350 Rust tests, 80 Vitest tests, the Python producer check, formatting,
typechecking, documentation/storage guards and Terraform formatting. The existing
nineteen lint warnings and WASM atomics warning remain. `git diff --check` passed.
