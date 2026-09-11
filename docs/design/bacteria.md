# Bacterial world and lifecycle

This is the current top-down runtime contract. [Controller](controller.md),
[bodies and inheritance](funded-bodies.md) and [strategic ecology](strategic-ecology.md)
own its detailed interfaces and tradeoffs.

<a id="world-substrate-and-embodied-state"></a>

## Substrate and embodied state

One periodic 80 × 60 XY plane contains continuous circular body footprints and unit-spaced
raster fields. Neither axis is height. Sensing, transport, contact, placement and rendering agree
at periodic seams. There is no map oracle, pathfinder, gravity axis, nest or alternate substrate.

A cell owns position, heading, eight actual material stocks, nutrient reserve, usable energy,
functional damage, four adaptive receptor baselines, contact state, private brain state, genotype
reference and ancestry. Radius derives from structural and stored-food volume using a spherical
reference approximation. Low-Reynolds-number drag motivates overdamped swimming; there is no
inertial coasting or resolved fluid solver. Rotational Brownian perturbation uses body randomness.

Contact uses bounded displacement, spatial bins and four separation passes. This is an approximate
local overlap solver, not an exact rigid-body constraint solver. More mass or storage changes
footprint and drag. Changed construction targets never grant instant capability.

<a id="world-fields-and-finite-deposits"></a>

## Fields and finite deposits

Seven material fields are persisted: food A, food B, neutral chemical, toxin, matrix, bound toxin
and detritus. A/B use separate processing pathways but become the same intracellular feedstock.
Matrix and bound toxin remain local deposits; soluble fields diffuse and decay. Detritus decomposes
into B. Transport subdivides unstable steps and preserves nonnegative material.

Eight deposits hold separate finite A/B inventories, position, radius, release rate, lifetime and
arrival delay. Most arrivals fall near three seeded landscape clusters; others scatter across the
world. Composition, size and duration vary. Depleted/expired deposits wait before replacement;
expired inventory becomes local detritus. Resource schedules use independent environment randomness,
never organism need, identity or success. Controllers receive local concentrations only.

Optional `config.foodEpochs = { phaseTicks, shares }` replaces new deposits' random composition
with a repeating calendar of food-A fractions. It preserves total inventory, energy density,
source geometry, arrival timing and environment random draws. Existing inventories and dissolved
food keep their composition across transitions. Absence retains mixed deposits; the resolved
schedule persists in v5 checkpoints and its phase derives from world tick. Controllers receive
no calendar input. See the [registered epoch experiment](../food-epochs-study.md).

The initial uniform food field and initial source inventories are accounted once. Later arrivals
enter the external-supply ledger; leaking inventory into a field is a transfer, not new supply.
Persistent and transient configurations alter finite deposit lifetimes. Neither means an infinite
spout. [Ecology](strategic-ecology.md) defines the opportunities and construction/interference effects.

<a id="world-turn-order-and-resource-economy"></a>

## Turn order and resource economy

Each tick is 0.2 model seconds:

1. Advance deposits, field reactions and transport.
2. Form each cell's local observation and run its RNN against the same chemical snapshot.
3. Pay affordable swimming, turning and secretion; resolve movement/contact and deposit chemicals.
4. Apply local toxin injury.
5. Allocate supply-limited A/B uptake simultaneously across consumers and shared intracellular space.
6. Catabolize reserve, pay maintenance, repair damage and construct missing machinery.
7. Correct contact, remove dead cells and attempt local funded reproduction.

Learning is paid during inference. Motion reserves due basal expenditure before solving the shared
quadratic-motor/linear-secretion energy budget. All secretions share precursor reserve. Damage
reduces uptake and locomotion and raises maintenance. No same-tick secretion leaks into a later
cell's observation through iteration order. Daughters first act on the following tick.

Material and usable energy have distinct ledgers. Initial founders and accounted external deposits
are the only material grants. Catabolism dissipates energy and records spent material as waste.
Dead structure/reserve returns as detritus; residual usable energy is lost. Recycling does not
recover dissipated energy. See [accounting](funded-bodies.md#bodies-accounting).

<a id="world-growth-death-and-reproduction"></a>

## Growth, death and reproduction

Growth fills actual deficits toward twice the genetic newborn blueprint, in proportion to those
deficits and within assembly, material and energy limits. It is a fixed physiological allocation
law; construction scheduling is not independently evolved.

Reproduction requires every stock to meet the parent's division target, sufficient reserve/energy
for the resulting bodies, the division charge and locally available physical space. Failed placement
leaves the parent alive to pay maintenance and try later. No remote space search or displacement
manufactures a birth site.

Fission replaces the parent with two daughters. Budding uses the same resource split, retaining one
experienced parent and producing one daughter. Every stock, reserve and post-cost energy splits
equally; damage fraction persists. Birth-local mutation changes future targets, not transferred
stocks. [Inheritance](funded-bodies.md) controls the chromosomes and learned information.

Energy exhaustion or unit damage causes death. There is no age timer, fixed census, fitness culling,
generation sweep or automatic reseeding. Extinction stops visibly. The population safety ceiling
pauses rather than silently changing ecological reproduction or deleting cells.

<a id="world-determinism-and-persistence"></a>

## Determinism and persistence

Environment, body and genetic randomness have separate persisted streams. Consuming a genetic draw
without changing inherited information must not alter placements, headings or source schedules.
Physical fields and ledgers use float64; observations and neural state use float32.

Checkpoint v5, substrate `bacteria-xy`, stores resolved configuration, all fields/inventories,
body/receptor/brain state, immutable genotype records, organism/genotype ancestry, random streams,
ledgers, bounded recent events, durable manual interventions and stop reason. Validation checks
encodings, physical capacities, record consistency and conservation. Incompatible or incomplete
older saves are rejected; no adapter invents missing state.

Optional v5 execution metadata records source segments by tick; file exports also identify the
exporter's source. Legacy histories remain unknown until execution is observed. Development hot
reloads are labeled as mixed code, and metadata stays outside physical state and controller inputs.

Persistence is local IndexedDB and explicit files. A new browser session starts at tick zero,
not from an automatically restored checkpoint. Genotype and ancestry retention grows with births;
indefinite-run memory use has not been established.
