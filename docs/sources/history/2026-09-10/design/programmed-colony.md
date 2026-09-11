# Programmed physical colony

The September 7 decision advances the canonical 2D world to a living colony. Design documents
provide physically motivated guidance; the user explicitly permits local sensor and action
changes to make the programmed behavior work. Every worker runs the same algorithm. Genetics,
controller training and digging are outside this implementation. Human visual review is the next
gate before any RNN work.

The user subsequently authorized a bounded frozen-physics training study. Its separate
[training record](colony-training.md) documents the failed learned candidates; the programmed
implementation described here remains the browser default.

## State and physical boundaries

The existing 2,048 × 128 authored nest remains the only substrate. Workers occupy individual cells
and cannot move into occupied cells. Their ground contact spans two cells above the surface,
providing a passing lane. Underground locomotion retains the existing cross-section abstraction.
This is an energy-and-transport model, not a biomechanical reconstruction of ants.

Food is a map from cell to food quantity. `foodEnergyDensity` converts that quantity to usable
energy; the default is one energy unit per food unit. External sources regrow at a finite rate up to a local
capacity. Stored food is ordinary food below the surface, visible at its deposited location.
The cache marker remains a diagnostic affordance; it is not a hidden colony bank. A crop holds a
finite quantity. Queen reserves, worker reserves, and brood reserves and investment are explicit.

Every step preserves:

```text
initial energy + environmental regrowth energy
  = (food quantity + crop quantity) * foodEnergyDensity
    + worker reserves + queen reserves + brood reserves and investment
    + cumulative dissipated energy
```

Pickup and release transfer food quantity. Eating converts food or crop quantity into worker energy.
Feeding transfers crop energy to a contacted queen or larva. Actions, sensing and metabolism
dissipate energy. Age death returns remaining reserve and cargo at the body position; starvation
returns any remaining crop or brood investment. Spent energy is never recycled. Body mass is not
tracked independently from these energy quantities. Recycling converts remaining reserve energy
back to food quantity at the world's density. This is an energy-equivalent resource abstraction,
not a conserved body-mass model. See [the yield experiment](nutritional-yield.md) for its limits.

## Local programmed behavior

The policy receives the original body-relative 33-value navigation frame plus eight local contact
samples, eight neighboring fresh-air concentrations, its crop load and its reserve fraction. Contact probes reach two cells along a ray and
stop at an intervening solid cell. They report nearby food, a physically present queen, a hungry
recipient, and whether the next movement cell is occupied. No coordinates, selected destination,
route, global population or world reference enter the policy. It retains no private state.

An underfed worker eats available food. A carrier feeds a nearby hungry queen or larva. An unloaded
worker beside both a hungry recipient and food picks up food for feeding. Otherwise carriers follow
nest odor back to the queen and release surplus into a neighboring cell. Unloaded workers follow
a fresh-air gradient underground and food odor outside. Fresh air enters at the physical nest
opening and spreads by local diffusion with loss; it is independent of worker traffic marks.
Deposited pheromones persist in separate fields.

Food odor emission is proportional to the amount remaining. The prior constant-strength source
attracted workers to nearly empty patches and suppressed provisioning. Nest odor originates at the
queen in the survival scenario. The authored nest starts with locally relaxed nest and entrance
fields, without a route solution being exposed to the ants. The initial entrance field is copied
into the separate air carrier before any traffic; subsequent changes use that carrier's diffusion,
loss and opening source. This models an already ventilated nest, not simulated fluid dynamics.

The shared action resolver supports turn, move, mandible pickup, release, eat, feed, and pheromone
emission. Feeding has two-cell occluded reach; pickup and release act one cell forward. All
controllers remain subject to the same resolver. The historical RNN has not been trained for the
new feeding interface and is not a colony controller.

## Queen, brood and turnover

Eight workers bootstrap the default world with staggered ages. This number initializes the world;
no running mechanism compares the population with it. Queen laying depends on her reserves, a
laying interval and physical space beside her. It continues when there are already eight workers,
and stops when reserves are insufficient.

An egg receives energy from the queen. It becomes a larva after 600 ticks. The larva requires at
least 1,200 ticks and six units of locally supplied investment; feeding also replenishes its
metabolic reserve. A pupa requires another 600 ticks. The adult inherits the actual remaining
brood energy at the brood's position and receives a new monotonic ID. It receives no free founder
energy. A blocked hatch waits for physical space.

Workers die from starvation or at a 16,000-tick lifespan. Queens pay upkeep and have a separate
finite lifespan. Empty worker populations remain empty unless already funded brood matures.
There is no restart, population target, mutation, recombination or fitness calculation.

## Parameters and interpretation

| Quantity | Default survival value |
| --- | ---: |
| External sources | 96 seeded surface positions |
| Initial food quantity per source | 4 |
| Energy per food unit | 1 |
| Source capacity / regrowth per tick | 12 / 0.002 |
| Worker initial / maximum reserve | 8 / 10 |
| Crop capacity | 4 |
| Worker metabolism / move cost | 0.0005 / 0.0003 |
| Queen reserve / upkeep per tick | 24 / 0.001 |
| Laying interval / egg energy | 800 ticks / 2 |
| Larval investment | 6 |

These are transparent authored parameters, not biological measurements. Near 20 workers, routine
worker expenditure plus queen upkeep and development must be covered by actual local harvest.
Global food abundance alone does not establish provisioning. Population can rise or fall as
transport and care constrain recruitment.

## Persistence and inspection

Checkpoint version 6 records nutritional density, food quantities, active renewable sources, all living workers, queen,
brood stages, chemical fields, cumulative economy and next IDs. It restores reduced or extinct
populations without recreating founders. Earlier checkpoint versions are rejected.
It also stores the private task byte and diagnostic counters; registered neural colonies retain
their imported model, recurrent state, command history and private random stream.

The default browser scenario is the programmed colony with lifecycle. The canvas shows the queen,
white eggs, blue larvae, purple pupae, worker orientation, carried-food coloring and stored food
quantities. Charts show population, brood, queen reserves, births, deaths and storage. The inspector
and ledgers expose local actions, reserve, food transfers and conservation residual.

## Evidence and review

`pnpm harness colony-survival` records trajectories and economy snapshots in the SQLite ledger.
Run 2505 covers seeds 1–3 for 40,000 ticks. Final worker populations were 20, 20 and 19, all
descendants; all queens survived. Adult births were 47, 47 and 38, with 35, 35 and 27 worker deaths.
The third world lost six brood and exhausted stored food. At 64,000 ticks, run 2508 found workers
trapped by their own traffic pheromone near the queen. Separating the environmental exit clue fixed
this measured failure: run 2509 reaches 64,000 ticks with 20 workers, 76 births, 64 age deaths,
no worker starvation, one brood death, queen reserve 21.109 and stored food 154.646. External
harvest continues to 971.072 units; absolute energy residual is 1.41e-8. The final matched panel and
deprivation results are recorded in [certifications](../certifications.md). Run 2512 also extends
the low-reserve seed 1 to 64,000 ticks: population recovers from eight to 19, queen reserve reaches
23.494, and stored food reaches 62.492 without changing parameters.

Run 2506 removes external food and regrowth at tick 8,000 on the same seeds, retaining crops and
interior food. Its removed energy is reported separately when checking conservation. This control
tests whether continued reproduction and survival depend on external supply. All three colonies
lost their queens and workers; no replacement bypass restored the population.

Bounded tests cover physical transfers, wall occlusion, development prerequisites, death
attribution, deterministic continuation and policy purity. Behavioral runs do not live in Vitest.
Human review must still judge motion, congestion, visible feeding and storage. Numerical survival
does not certify those visual properties.
