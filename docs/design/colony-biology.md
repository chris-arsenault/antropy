# Colony biology and survival

The September 9 [controlled-queen decision](controlled-queen.md) replaces automatic laying with
an explicit local action. Queen and workers share an ant body and programmed/LGP execution.
Physiology supplies readiness without choosing egg locations. The [surplus-growth experiment](surplus-growth.md)
changes the review time budget; substantial growth and nursery expansion remain unmeasured.

The [construction-pressure milestone](construction-pressures.md) adds brood carrying, supported
nursery placement and climate-dependent maintenance/development. Body water comes from finite
local reservoirs and returns there on death or emergence. Transported brood retains its reserves;
adult emergence waits for placement. The older brood-transport absence below is superseded.

The canonical runtime now implements a programmed physical colony. The September 7 user decision
permits local sensors and actions to establish that behavior before genetics or RNN work. The
[programmed colony contract](programmed-colony.md) records the actual state, energy flows and
measurements; the later biological ideas below remain guidance.

The next target is [roughly 2,000 sustainable workers](colony-scale.md), before genetics. The
current one-egg-per-800-ticks laying rate and 16,000-tick worker lifespan imply a best-case
steady replacement capacity of about 20 workers. Scale requires funded birth throughput, nursery
space, food and care access; changing the founder count does not resolve those limits.

<a id="colony-goal"></a>

## Functional goal

Build one colony that physically gathers and stores food, consumes conserved resources, survives
ordinary work, raises brood, and replaces dead workers. The target is a broad stable operating
region that later evolution can improve, not survival at one tuned optimum.

<a id="colony-energy"></a>

## Energy and food economy

Food quantities occupy explicit cells or crops. Eating and local feeding transfer energy into
worker, queen or brood reserves. Metabolism and work dissipate it. Death returns remaining reserves
and carried food. Environmental growth is the only ongoing external input. No hidden stockpile or
population-maintenance debit exists. Independent biomass and ownership genetics are not modeled.

Judge the operating region by local harvest, reserves, recruitment and mortality across worlds.
Global food abundance alone does not prove that workers can provision the colony.

<a id="colony-brood"></a>

## Queen, brood, and replacement

Queen upkeep, age and starvation mortality, eggs, locally fed larvae, pupae and adult emergence
are implemented. Egg energy comes from the queen, larval reserve and investment come from local
worker feeding, and the adult receives the energy actually left in the pupa. Laying requires a
controller request, reserves, elapsed time and free adjacent space, never worker census. A carried queen
continues metabolism and can receive food; laying pauses until she is released. Queen transport
is implemented through the [construction actions](construction.md); brood transport is still absent.

Staggered founder ages avoid a synchronized initial death wave. Runs must cross the founder
lifespan and later recruitment cycles; population may vary with food and care.

<a id="colony-floors"></a>

## Homeostatic floors

Standing crops, rot, metabolic depression, edible brood, queen reserves, preferential feeding,
stored-sperm portfolios, and activity-scaled threats are candidate resilience mechanisms. Measure
the untreated resilience curve first. Add a floor only when a named low-population or low-resource
failure appears and verify that the same floor does not suppress healthy colony work.

<a id="colony-selection"></a>

## Reproduction and selection channels

Individual survival, resource acquisition, brood investment, mating, and descendant contribution
may create selection. The population may not receive a harness score, chosen parent ranking, or
offline replacement. Parentage, merit, and energy attribution are instruments; they do not decide
who reproduces.

Polyandry, haploid males, worker-laid males, colony founding, queen loss, and inter-colony gene
flow remain candidate mechanisms for later continuous evolution.

<a id="colony-order"></a>

## Linear implementation order

| ID | Status | Finish |
| --- | --- | --- |
| BIO-01 | Historical prerequisite | The user advanced the work to a complete programmed colony |
| BIO-02 | Delivered; visual review pending | Multiple workers and spatial food storage |
| BIO-03 | Measured; broader region remains open | Tune renewable food and routine costs to a broad positive operating region |
| BIO-04 | Delivered | Add mortality and queen upkeep with attributable death causes |
| BIO-05 | Delivered | Add conserved brood investment, development, and worker replacement |
| BIO-06 | Numerically measured; visual review pending | Certify fixed-controller continuity across complete worker turnover |
| BIO-07 | Backlog | Measure resilience curves and add only evidenced homeostatic floors |
| BIO-08 | Delivered assessment | Food/laying/nursery bounds documented in settling.md; capacity implementation follows digging |
| BIO-09 | Planned before genetics | Sustain that scale beyond founder turnover without a census target or free replacements |

<a id="colony-delivered-later"></a>

## Historical implementations not carried forward

The retired runtime's implementations remain at the checkpoint tag. Current 2D energy, mortality,
queen, brood and replacement were implemented directly against the new physical state. The old
genetics, climate, brood transport, digging and automatic continuation are not active.

<a id="colony-obe"></a>

## OBE and rejected directions

- Earlier certifications do not transfer across the substrate replacement.
- Automatic continuation, scripted worker replacement, free resource creation, and hidden larder
  balances cannot certify a living colony.
- Exact worker counts, chamber use, brood positions, or one lucky surviving world are not adequate
  outcome gates; use ratios and deltas across seeded worlds and time.
- No later biological system may be reintroduced merely because an appendix once listed it.

<a id="colony-sources"></a>

## Source provenance

The source archive retains the original energy economy, lifecycle, colony structure, viability
floors, replacement ladder, and selection-channel proposals. [Source coverage](source-coverage.md)
assigns each family to this design or to advanced systems.
