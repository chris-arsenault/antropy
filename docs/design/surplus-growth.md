# Surplus-driven population growth

The September 9 instruction changes the immediate target to a doubling or tripling of the
eight-worker colony from physically gathered surplus, with expanding brood creating nursery
demand. The prior four-cut, two-birth result did not show the change the user expected.
Plan `af769106-fb92-4056-bce0-016f701e86e0` tracks this work.

## Mechanism and budget

The previous default limited laying to one egg per 800 ticks and required at least 2,400 ticks
of development. With a 16,000-tick lifespan, even perfect reproduction sustained only twenty
workers. The review default now uses an 80-tick minimum laying interval and stage durations
120 / 600 / 240 ticks. These are simulation time scales, not claims about a particular ant species.
Founder count, lifespan, initial reserves and energy cost per worker are unchanged.

Egg synthesis slows as the queen's own reserve drops below 90% of capacity; laying stops when
she cannot pay the egg cost while retaining half her reserve capacity. Remote food stocks never
enter this calculation. Workers must deliver food to her and fund larval growth through feeding.
At full nutrition, birth investment is at most 8/80 = 0.1 energy per tick, before metabolism and
physical work. The original nominal regrowth of 96 × 0.002 = 0.192 hid a spatial bottleneck:
seed 101 has only eight sources within 125 cells of the entrance, supplying at most 0.016/tick.
Run 2805 harvests 65.23 energy in 4,000 ticks while colony expenditure totals 60.11. Most remote
regrowth never enters the colony. This is not the intended surplus condition.

The review default now grows 0.02 food/source/tick, retaining source count, initial food, source
capacity, travel and feeding costs. The nearby eight sources can supply up to 0.16/tick; this
provides a declared budget for growth, conditional on harvesting and delivery. No remote-food
sensor is added. Shorter development still does not waive larval investment.

The subsequent [controlled-queen decision](controlled-queen.md) replaces automatic laying with an
explicit controller action. The user has resumed the parent growth work after that implementation.
Laying requires unoccupied supported
space immediately adjacent to the queen. Brood must be carried to other
floors to release that space; new nursery space must be excavated and spoil moved physically.
The existing private worksite and local crowding mechanism remains the first construction policy
to exercise under this demand. No desired worker count or chamber blueprint enters the kernel.
A daughter queen requires a reproductive caste and colony-founding design; this change retains
one queen rather than spawning another to bypass the food and nursery constraints.

## Necessary verification only

Inspect `withReviewPressures` and startup wiring to establish browser defaults. The visible stats
show workers versus founders, births/deaths, brood stages, unfunded larvae and the immediate laying
constraint. The headless `collective-work` assay uses the same configuration and records those
values alongside existing care, energy and excavation-use evidence. Do not run a browser assay.
Use bounded conservation/reproduction tests, one diagnostic growth run, and required CI. Repeat a
behavior run only after a measured failure requires a correction. Human motion review stays with
the user. Doubling/tripling is an observation target, never a census maintenance rule.

## Controlled-queen baseline and task continuity

Run 2804 uses the default programmed seed, map seed 101 and 4,000 ticks. It ends with eight
workers, two births, two founder deaths, eight unfunded larvae and no stored food. The queen
survives with reserve 18.63. Seventeen cells are excavated, four are occupied by brood during
the run, and twelve soil loads are placed outside. These counts do not establish chamber quality.

The decision trace and five-tick checkpoint replay identify interruptions in the shared seed:
recruitment scent repeatedly pulls an ant down from an entrance route endpoint; exterior soil
haulers reacquire the entrance; empty workers visit old hungry-recipient observations without
food. The continuity correction restricts recruitment to ants without a usable route, restricts
soil exit routing to the interior, and requires food for stale-care visits. Six bounded tests
exercise both programmed and compiled LGP controllers. Rates and resource supply stay fixed for
the follow-up measurement. The baseline artifact is
`frontend/harness/artifacts/surplus-growth-2026-09-09/controlled-queen/behavior.json`.

Run 2805 ends with eleven workers, five births and two founder deaths. Worker empty returns fall
from fourteen to eleven; larval feeding rises from 26.48 to 34.48 energy. This still fails the
growth target. The queen spends roughly 1,500 ticks on the surface while adequately fed and ready
to lay. Her shared seed now reserves exterior food trips for low body reserves, returns toward
observed nursery locations after feeding, favors supported sheltered floor when seeking laying
space, and discards blocked routes. No kernel rule fixes her location or chooses a nursery.
Four bounded programmed/LGP cases cover retaining and returning to a reproductive site.

## Supply comparison and sampling repair

Runs 2806/2807 use the same reproductive-site controller with food regrowth 0.002/0.02 per source.
At tick 4,000 the low-supply arm has ten workers, four births, ten unfunded larvae and no stores.
The surplus arm reaches twenty workers at tick 2,500 and ends with nineteen, thirteen births,
no brood deaths and 129.11 stored food. Twelve excavations include three cells used by brood;
twelve soil loads are hauled and placed, and two new caches are created. This proves a resource
response, but the colony then stops laying despite adequate nutrition. It is a failed continuation
result, not a completed growth certification.

The queen's nearest eight observed sites contain no usable floor, while 1,208 observations make
the old four-site, 32-tick sampling rotation too slow. Candidate enumeration now advances four
observations every tick and wraps correctly, with no suitability ranking. A fixed remembered set
is offered in at most `ceil(siteCount / 4)` ticks; changing observations can change that bound.
The replay first covered only 200 ticks (run 2808), before a suitable floor was offered. Continuing
to tick 4,600 (run 2809) restores five explicit eggs and 18.23 additional larval feeding energy,
without moving bodies or supplying food from the harness. A bounded test covers full sampling
coverage. A fresh default run follows this repair; the replay is not a tick-zero default result.

## Final default result and remaining work

Run 2810 starts from tick zero with the final programmed default, seed 101. It reaches sixteen
workers by the 2,500-tick sample and ends at tick 4,000 with **22 workers**, sixteen births and
two founder age deaths. The queen has 23.69 reserve, 33 eggs have been laid, and seventeen brood
remain (one egg, fourteen larvae, two pupae). Thirteen larvae still need investment. Queen and
larval feeding total 69.76 and 169.26 energy; stored food is 7.53. There are no starvation or
brood deaths. Energy residual is below `6e-10` in magnitude.

Ten cells are excavated, ten soil loads are dropped for handoff, nine recovered and nine placed;
one loose load remains. Six excavated cells hold uncarried brood at the endpoint. Completed job
records also establish four brood relocations into three excavated cells. The original aggregate
`space.cuts[].brood` included carried transit, so its seven-cell count is not a nursery-use claim.
Future construction-use sampling excludes carried brood and requires a floor; adult traversal
now includes the queen. No simulation rerun is needed to establish the six endpoint placements.

This meets the first population-growth target and demonstrates use of excavated nursery floor.
It does not establish wide chambers, acceptable motion or founder turnover. Space still delays
laying, and 2,066 route changes, thirteen empty entries and 88 empty queen-route steps remain
traffic concerns. No new cache is completed in this final run; the earlier surplus arm's two
cache creations are a separate result. The user subsequently rejected this excavation as
imperceptible. Next is [doubling the nest through chamber excavation](chamber-excavation.md),
before visual handoff and the declared 200/500/1,000/2,000 scale stages. Genetics and
reproductive caste development remain deferred.

The default wiring is `App` → `withReviewPressures` → fresh `useSimulation` world, programmed
controller and seed 101. Reload and use Run; no import, dropdown or browser verification is required.
The final artifact is `frontend/harness/artifacts/surplus-growth-2026-09-09/final-default/behavior.json`.
Full CI passes 232 tests in 62 files, with the existing optional-property lint warning.
