# Regional spatial execution

The September 22 replacement implements the ownership work in
[SCALING-PLAN.md](../../SCALING-PLAN.md). It retains the current chemistry, finite reservoirs,
funded organisms and circle-overlap law. The physical mesh remains two units.

## Owners and boundaries

`Geometry` defines the periodic node/region mapping and finite halos. Regions contain 8×8 nodes;
partial edge regions wrap at the actual world dimensions. `Regions<T>` owns sparse allocations,
lookup and removal for chemical buffers, scalar filter stages, carrier reference counts,
movement dependencies, contact membership and transport lookup. There is no inheritance tree
or dynamic dispatch in the numerical loops.

`Field` owns material, chemical support, reduced physical features and their publication.
Each occupied site's row, group mask and feature projection (material, potential, impedance,
stress and two signal axes) live together in its region; every commit updates all three, and
readers take impedance, stress and material signal from the projection. There are no separate
geographic feature arrays. Restore recomputes projections from saved material.
Production readers receive immutable material and feature views. Deposits and exchange commits
use actual capped, rounded changes. A no-op commit does not allocate material or publish a
change. Withdrawing the final chemical clears the row's reductions exactly. Cold fixture
replacement rebuilds its reductions before returning; tests have a separate compiled-only
medium-editing boundary.

Current and destination chemical regions persist across physical updates. Destinations clear
previously active chemical groups before reuse; redistribution and conversion explicitly zero
removed values and publish the surviving product mask. Destinations are the occupied regions
and their four neighboring regions. Each region job derives its candidate groups from its own
and neighboring masks and commits its masks, projections, totals and signal changes; no serial
write-back follows the pass. Regions left empty return to a reuse pool. Exchange rows and
reservoir release commit through the same region-parallel batch. Missing regions read as zero
without allocation. Each allocated chemical region contains contiguous 256-species rows; this deliberately
retains the existing vector arithmetic. Region padding has a memory cost.

One carrier contribution owner replaces source and body contributions. It remembers the old
footprint and profile, applies only the actual difference, and removes old support when an owner
moves or disappears. Reference counts distinguish an emptied node from a node still shared by
other contributors. Reservoir interface saturation and cellular mass projection keep their
different physical formulas; ownership and invalidation use the same implementation.

## Local operators and physical time

Attraction uses the existing normalized three-box filter on each axis. Each axis pass gathers
one input line per destination row and applies its three boxes in sequence; only the x-pass
and y-pass keep sparse regional outputs. Carrier writes queue affected regions. The operator compares each input
with its last published anchor using the existing dimensionless resolution 0.1 and the existing
concentration floor as its reference scale. Small changes accumulate; zero/sign changes wake
immediately. Explicit replacements prepare exact initial coefficients.

Only changed regions and the composed finite halo execute. Halo expansion uses region intervals,
including partial periodic edges; it does not enumerate every site merely to find neighboring
regions. The numerical support remains three box radii per axis. Regional work can over-cover
that support at region boundaries, and a gradient adds its immediate neighboring nodes.
Unchanged distant populated regions retain their outputs. All destination regions read the
same committed prior stage and can run on separate Rayon workers.

Derived dirtiness is not a physical sleep flag. Renewal, illumination and paid cellular work
retain their existing clocks. Reservoir release accrues stocked time and commits `rate × elapsed`
at the physiology boundary, where the medium diffuses, is sensed and exchanges. At each physiology boundary, all active material
and immediate delivery neighbors advance diffusion, drift, weathering and washout over elapsed
time. Consequently the field pass still sums all physical output regions. It does not use a
partial total update while silently omitting unchanged material.

The base stage freezes attraction for source/field/cell motion. Local repulsion and impedance
continue to read the committed carrier/material values appropriate to their existing stage.
This retains the prior split schedule; it does not claim a simultaneous snapshot of every medium
channel. Movement marks footprint nodes, refreshes dependency anchors and gradients per region
in parallel, and then prepares each cell's coefficients in parallel without mutation.

## Contacts, delivery and consumers

Contact search retains persistent center membership at diameter-class resolution. A large body
does not widen every small-body search. Each class uses the common periodic regional index;
stable cell IDs own membership, while current array indices are contiguous query payloads.
Crossings, size-class changes and population changes update membership. Neighborhood discovery
runs once per occupied bin, and each same-class bin pair is visited once. Current class radii
bound the search; each candidate still uses exact circle overlap. All-overlapping populations
still have quadratic pair cost.

Transport retains the transpose of cell footprints: each geographic donor owns its current
list of receiver contributions. Changing one footprint edits its old/new donor rows. Material
requests still read current concentrations and work budgets every exchange, and all receivers
compete for the same donor before commitment. No regional boundary creates an additional supply.
Reverse positions allow direct weight updates and swap removal; changing a contribution never
scans the whole crowded donor list. Sensing, exposure and exchange contractions borrow each
regional chemical row before their coefficient loops, keeping geographic lookup outside chemical
arithmetic.

Rendering and observations read immutable committed material/features. The display's current-body
projection remains an observer-only calculation, so observing cannot change the solver cache.
Local WASM borrowing, helper-worker joins, bounded native publication and backpressure remain as
specified by the [data-sharing contract](chemistry/data-ownership.md).

## Limits and acceptance

Not every array is sparse: carrier planes, illumination and topology lookup still reserve
space proportional to geographical area. Parallel sections follow one scheduling rule: each
task carries at least 20 µs of estimated work, and smaller sections run on the calling thread. Their ordinary work follows
local support or queries; cold initialization and full-map export/rendering still scale with
requested area. Chemical storage follows owned regions, and derived invalidation follows local
changes. This does not remove every cost of a larger world. Dense occupied chemistry remains
real physical work.

Bounded tests cover account closure, zero transactions, reclamation and reactivation, reused
buffers, partial/periodic edges, delayed-anchor translation/reflection, local changes surrounded
by distant populated regions, and membership removal/reordering. Existing tests cover donor
competition, illumination clocks, birth/death, one/four-worker execution and observation ownership.
The scaling plan records populated-world timings, publication costs and failures. It does not
certify long-run evolutionary outcomes or a 32-core deployment.

The standalone `source_binding` probe now exercises the selected compact filter through its
configuration. Its earlier Gaussian mutation of raw carrier arrays is retired; earlier candidate
measurements remain historical and must not be reproduced by bypassing the owner.
