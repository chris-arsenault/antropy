# Bacterial world and lifecycle

This is the current top-down runtime contract. [Controller](controller.md),
[bodies and inheritance](funded-bodies.md) and [strategic ecology](strategic-ecology.md)
own its detailed interfaces and tradeoffs.

<a id="world-substrate-and-embodied-state"></a>

## Substrate and embodied state

One periodic 320 × 240 XY plane contains continuous circular body footprints and unit-spaced
raster fields. Neither axis is height. Sensing, transport, contact, placement and rendering agree
at periodic seams. There is no map oracle, pathfinder, gravity axis, nest or alternate substrate.

A cell owns position, heading, nine actual material stocks, nutrient reserve, usable energy,
functional damage, four adaptive receptor baselines, contact state, private brain state, genotype
reference and ancestry. Radius derives from structural and stored-food volume using a spherical
reference approximation. Low-Reynolds-number drag motivates overdamped swimming; there is no
inertial coasting or resolved fluid solver. Viscosity is provisionally 0.004; geography and local
resource economics provide separation, while motors still buy useful movement. See
[short movement probes](../spatial-probes.md). Rotational Brownian perturbation uses body randomness.

Contact uses bounded displacement, spatial bins and four separation passes. This is an approximate
local overlap solver, not an exact rigid-body constraint solver. More mass or storage changes
footprint and drag. Changed construction targets never grant instant capability.

<a id="world-fields-and-finite-deposits"></a>

## Fields and finite deposits

Ten material fields are persisted: food A, food B, neutral chemical, two toxin types, matrix,
two bound-toxin pools, detritus and inorganic carbon, plus oxygen outside the material balance. A/B use separate
processing pathways but become the same intracellular feedstock. Matrix and bound toxin remain
local deposits; soluble fields diffuse and decay. Detritus decomposes half into A and half into B.
Carbon and oxygen belong to the optional [element cycle](strategic-ecology.md#ecology-element-cycle)
and stay empty without it. Transport subdivides unstable steps and preserves nonnegative material.

Forty-eight deposits hold separate finite A/B inventories, position, radius, release rate, lifetime and
arrival delay. The initial landscape has seven irregular abiotic centers with unequal source density.
Sites have persistent positions, radii, richness and A/B shares; renewal timing and release vary.
This arrangement is a revisable hypothesis, independent of occupants. Depleted/expired deposits wait before replacement;
expired inventory becomes local detritus. Resource schedules use independent environment randomness,
never organism need, identity or success. Controllers receive local concentrations only.

Optional `config.foodEpochs = { phaseTicks, shares }` replaces new deposits' random composition
with a repeating calendar of food-A fractions. It preserves total inventory, energy density,
source geometry, arrival timing and environment random draws. Existing inventories and dissolved
food keep their composition across transitions. When neither epochs nor zones is present, deposits have mixed compositions; the resolved
schedule persists in v8 checkpoints and its phase derives from world tick. Controllers receive
no calendar input. See the [registered epoch experiment](../food-epochs-study.md).

Optional `config.foodZones = { shares }` instead fixes composition by position: the world is
split into equal vertical bands, deposit slot *i* always lands in band *i* mod *N* at its drawn
offset, and a new deposit takes its band's food-A fraction. Each band therefore has the same number of deposit slots, while actual arrival times,
inventory and release rates can differ. Inventory, energy density, timing and random draws are unchanged; only
the x coordinate is remapped into the slot's band. Zones and epochs are alternatives; a
configuration declares at most one, and both persist in v8 checkpoints. Controllers receive no
band input. See the [registered zone experiment](../zones-study.md).

The default uniform food field is zero. Ten percent of each initial finite stock is dissolved locally
before founders arrive, subtracting the same material from its source. The 48 founders start near
two separated sites: the first site and the site farthest from it by periodic distance. Placement
alternates between them, trying the other if local space fills. Both colonies share the same
founder genotype; no later colony count or survival is prescribed. Diagnostic worlds with a single
site or no sites retain single-site or scattered placement. Initial fields and source inventories
are accounted once. Later arrivals
enter the external-supply ledger; leaking inventory into a field is a transfer, not new supply.
Persistent and transient configurations alter finite deposit lifetimes. Neither means an infinite
spout. [Ecology](strategic-ecology.md) defines the opportunities and construction/interference effects.

<a id="world-turn-order-and-resource-economy"></a>

## Turn order and resource economy

Each tick is 0.2 model seconds:

1. Advance deposits, field reactions and transport, then any configured local disturbance.
2. Form each cell's local observation and run its RNN against the same chemical snapshot.
3. Pay affordable swimming, turning and secretion; resolve movement/contact and deposit chemicals.
4. Apply local toxin injury.
5. Allocate supply-limited A/B uptake simultaneously across consumers and shared intracellular space.
6. Apply optional light fixation and oxygen-dependent catabolism; pay maintenance, repair damage and construct missing machinery.
7. Correct contact, apply optional gene transfer and reserve sharing, remove dead cells with any
   configured damage-related feeding, and attempt local funded reproduction.

Learning is paid during inference. Motion reserves due basal expenditure before solving the shared
quadratic-motor/linear-secretion energy budget. All secretions share precursor reserve. Damage
reduces uptake and locomotion and raises maintenance. No same-tick secretion leaks into a later
cell's observation through iteration order. Daughters first act on the following tick.

Material and usable energy have distinct ledgers. Initial founders and accounted external deposits
supply material in the default. Optional element cycling adds an accounted atmospheric carbon
exchange and light energy input. Catabolism dissipates energy; spent material leaves as waste
or returns to carbon when the cycle is on. Dead structure/reserve returns as detritus or feeds
eligible neighbors when damage-related feeding is on; residual usable energy is lost. Recycling does not
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

Checkpoint v8, substrate `bacteria-xy`, stores resolved configuration, habitats, all fields/inventories
(both toxin types and their matrix-bound pools included),
body/receptor/brain state, immutable genotype records, organism/genotype ancestry, random streams,
ledgers, bounded recent events, durable manual interventions and stop reason. Validation checks
encodings, physical capacities, record consistency and conservation. Incompatible or incomplete
older saves are rejected; no adapter invents missing state. The one allowance is a lever that
is off when absent (`preyYield`, `transferRate`, `sharingRate`, and their ledger counters): a
v8 save missing that disabled lever loads with it at zero. Versions through v7 are rejected.

Optional execution metadata records source segments by tick; file exports also identify the
exporter's source. Legacy histories remain unknown until execution is observed. Development hot
reloads are labeled as mixed code, and metadata stays outside physical state and controller inputs.

Persistence is local IndexedDB and explicit files. A new browser session starts at tick zero,
not from an automatically restored checkpoint. Genotype records are retained while a living
cell carries them, plus every founder record; once records exceed four times the population
plus a margin, unreferenced non-founder records are pruned. Dead organisms keep their genome id
in ancestry as provenance only, and a genome record's parent id may name a pruned record.
Organism parentage is retained in full. Older closed lifetimes move to numeric pages; living/recent
records remain mutable objects. The default two-million-record limit pauses before a birth would
exceed it. Dead genotype IDs remain provenance when their genotype payload is pruned; genealogical
queries still work, while unavailable genetic comparisons are labeled.

Browser checkpoints include separately versioned spatial identity, events and thinned chart samples.
IndexedDB retains six automatic and two manual compressed recovery points within a 256 MiB budget.
Automatic saves occur every 30 wall seconds and on pause; visibility/page-exit saves are best effort.
A failed save pauses execution. An individual uncompressed checkpoint is limited to 192 MiB.
No old save is deleted unless its replacement transaction commits. See
[continuing observation](../continuing-observation.md) for measurements and remaining limits.
