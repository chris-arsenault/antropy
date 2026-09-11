# Environment and future morphogenesis

[Autonomous construction pressures](construction-pressures.md) now implement local material
temperature and finite moisture, body water exchange, maintenance/development consequences and
food spoilage. These mechanisms and excavation are independently configurable. Climate defaults
to one cell after a coarse-grid comparison failed. Broad weather, collapse and gas exchange remain
backlog; the earlier absence statements below preserve the preceding runtime description.

The September 7 [cellular terrain change](cellular-terrain.md) supersedes the height-based runtime
described below. Foreground and backing materials now govern local support, transport and light;
the browser uses a 2,048 × 512 compact world; connected tiers remain selectable. The older dimensions and
surface rules below document the reference implementation, not a constraint on new terrain.

Next work follows [the 2,000-worker prerequisite](colony-scale.md). Y-axis settling for loose food,
queen and brood is now implemented; worker grip remains distinct. Review it, then re-establish
digging before nursery/storage capacity and population scaling. That subsequent
[construction implementation](construction.md) now exists, including queen and cache relocation.
The older gravity limitations
below are superseded by [the settling contract](settling.md). Pheromone mechanisms remain unchanged.

This document owns the physical substrate, local carriers, resources, and later construction or
ecological pressure. The current [physical colony](programmed-colony.md) uses the canonical cross-section and preserves the retired world's authored topology
and a large external foraging range.

<a id="environment-world"></a>

## World substrate

The canonical world is a 2,048 × 128 X/Y lattice; Y is height. SOIL fills terrain, ROCK forms the
lower boundary, AIR is traversable, food objects occupy explicit surface cells, and CACHE is a
physical deposit target. A deterministic rolling surface varies within five cells of its datum.
There is no spatial depth coordinate, volumetric grid, chunk system, mesh, or alternate substrate.

Eight-neighbor movement supports horizontal, vertical, and sloped travel. AIR is walkable below
the surface and within two cells above it, allowing physical passing. Workers, queen and brood
occupy cells; worker movement cannot enter occupied cells. Every controller uses the same collision and action resolver.

The September 7 inspection confirmed that there is no gravity or underground support resolver.
Queens and loose food remain at their placement cells, and workers can cross open chamber interiors
without visible wall contact. Y is height, but collision alone does not enforce that physical
contract. This remains an uncorrected embodiment limitation; the [nutritional-yield panel](nutritional-yield.md)
holds it constant and does not certify support or climbing.

<a id="environment-authored-nest"></a>

## Authored-nest control world

World construction ports the earlier authored topology into one connected cross-section: eight
elliptical chambers, thirteen junctions, and thirty-one bent passages. The graph includes branches,
joins, cross-links, and horizontal, vertical, and sloped travel, with no central straight shaft.
The creature begins adjacent to the food cache and oriented toward one physical exit route. The
nest is an artificial control arm, not an evolved-shape target.

Ninety-six food objects are stratified across the surface and placed at seeded-random positions
outside a forty-cell entrance clearance. Food remains a separate cargo object rather than an
impassable terrain cell; otherwise a one-cell-high 2D surface lane would turn every food item into
a wall. The comparison changes placement by seed and cannot pass because a fixed patch sits beside
the mouth.

<a id="environment-carriers"></a>

## Navigation and material carriers

Food amounts determine food odor emission. The queen sources nest odor in the survival scenario;
the cache remains its source in the immortal diagnostics, and two blank pheromone channels
carry deposited marks. A fifth field models fresh air entering at the physical opening, spreading
locally and decaying independently from traffic. All five fields diffuse through current walkable neighbors, evaporate,
and disappear below a sensory floor. The authored fixture begins with pheromone A physically
impregnated from the entrance and nest odor equilibrated from its physical source by repeated local
relaxation. This is permitted fixture setup; neither field is a shortest-path or distance transform.
The colony's initial air field copies the pre-traffic entrance field; workers subsequently sample
neighboring air concentrations to leave the nest. Run 2508 showed that using deposited traffic
pheromone for this job eventually trapped unloaded workers near the queen; run 2509 measures the
independent air carrier through 64,000 ticks.

These are fallible physical scalar carriers. A creature samples center concentration plus signed
relative contrast at forward, left, right, and wide-left/right adjacent cells—not a bearing or
source coordinate. It also receives attenuated light from vertical occlusion. Carrier overlays are
optional display layers and do not affect simulation state.

Future odor transfer, airflow, heat, humidity, carbon dioxide, or other fields must answer a named
physical information gap and remain fallible local carriers.

<a id="environment-config"></a>

## Configuration and action physics

`SimConfig` contains dimensions, surface height, food count and clearance, cache capacity,
chemistry cadence, work costs, and initial energy. There is no runtime dimension switch or
retired-system feature matrix. Values are stored on the world and checkpointed.

Food, crops, regrowth and storage capacities use food quantities. `initialFoodQuantity` names the
starting quantity at each source; `foodEnergyDensity` independently sets usable energy per food
unit. Odor depends on quantity, so changing density does not directly change scent strength.

Pickup transfers a contacted quantity into a bounded crop. Local release deposits it at a cell,
where it remains visible and available for later eating or feeding. Eating replenishes worker
reserves; feeding transfers crop energy to an occluded two-cell queen or larva contact. Sensing,
movement, turning, mouth actions, pheromones and metabolism have attributable energy costs.

<a id="environment-liabilities"></a>

## Resources and liabilities

The survival scenario has renewable sources with per-cell capacity and a finite regrowth rate.
Worker and queen reserves fund action and maintenance; queen and brood development consume
physically gathered food. Rot, weather, seasons, predation, disease and additional ecological
floors remain backlog. The immortal forager diagnostics retain a finite source configuration.

A later liability is admitted only because it creates a required evolutionary pressure or tests a
specific resilience claim. A healthy control must accompany shock experiments so a survival floor
cannot pass by making normal operation worse.

<a id="environment-morphogenesis"></a>

## Morphogenesis model

Local excavation, material work, spoil transport and deposition are implemented in
[construction](construction.md). Collapse, gas exchange and moisture remain later pressures.
The desired output is improved colony function under pressure, not a prescribed chamber count or
copy of a reference nest.

The archived digging ladders, shape vocabulary, organic nest reference, and carrier proposals are
design input. Their spatial implementations and fixed seed weights are not current code.

<a id="environment-order"></a>

## Linear implementation order

| ID | Status | Finish |
| --- | --- | --- |
| ENV-01 | Delivered | Cellular foreground/backing grid, heterogeneous materials and independent environment settings |
| ENV-02 | Delivered | Reference/compact branching nests, distributed food, optional connected tiers and pan/zoom |
| ENV-03 | Delivered | Finite local food/nest odor and pheromone A/B with optional overlays |
| ENV-04 | Delivered | Shared physical pickup, deposit, chemical emission, and attributable costs |
| ENV-05 | Needs human review | World geometry supports credible directed programmed foraging in the browser |
| ENV-06 | Delivered; measured in the colony harness | Renewable sources and conserved physical economy |
| ENV-07 | Partially implemented; review required | Temperature, moisture and food spoilage now motivate construction; other ecological liabilities remain backlog |
| ENV-08 | Implemented; visual review required | Local digging, partial material work, carried/dropped spoil and physical deposition; evolved morphogenesis remains later |
| ENV-09 | Implemented; visual review required | Negative-Y settling, floor landmarks and support-removal response on the material grid |
| ENV-10 | Planned before genetics | Physical storage/nursery space and supply/traffic capacity for roughly 2,000 workers |

<a id="environment-obe"></a>

## OBE and rejected directions

- The retired spatial grid, chunks, terrain generator, renderer, weather, climate, digging,
  spoil, larder, brood, decay, and colony-world implementations are OBE as code.
- A dimension configuration option or old-checkpoint migration is rejected; the tagged commit is
  the recovery mechanism.
- Fixed entrance-adjacent food, hidden stockpile counters, teleporting cargo, and oracle-only world
  mutations are rejected.
- Shape gates and exact nest metrics remain descriptive observations, not pass conditions.

<a id="environment-sources"></a>

## Source provenance

The original world, energy, liabilities, morphogenesis, microclimate, construction, and nest-form
ideas remain in [the source archive](../sources/README.md). [Source coverage](source-coverage.md)
maps them to current backlog or OBE status.
