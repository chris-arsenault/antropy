# Dynamic terrain

**Status:** Open design direction — specified separately September 30, 2026. No dynamic
terrain is implemented or enabled. This direction survives completion of the static
[terrain plan](../plans/archive/TERRAIN-AND-SEASONS-DELIVERY-PLAN.md); it is not an acceptance stage for that plan.

## Purpose and scope

Persistent geography gives locations different travel, retention and illumination conditions.
Dynamic geography would let those conditions change during a continuing world, creating costs
of remaining, relocating and maintaining useful arrangements. Neither migration nor a chosen
number of strategies is a required outcome. A disturbance must represent an environmental
operation, never a response to population count, colony dominance or measured diversity.

This direction owns slow changes to elevation, substrate conductance and overhead cover,
including tectonic deformation, and bounded local events that can change those properties
more quickly. It also owns the persistence and observation needed to understand those changes.
It does not implement water inventories, an erosion/fluid solver, digging, a depth coordinate,
source anchors, new organism categories or a second physical economy.

[Local resource seasons](local-resource-seasons.md) already vary reservoir supply clocks on
static maps. Ordinary light cycles already vary received illumination. Neither mechanism is
dynamic terrain. Live feature switches are a separate configuration concern below.

The implemented [spatial hierarchy](spatial-scale.md) distinguishes local terrain wavelength F,
resource-neighborhood spread R and area-per-neighborhood spacing D. Dynamic forcing and event
footprints must declare which of these physical scales they affect; they must not resume the
old single shade-scale convention. Changing a local ridge should not silently deform an entire
resource region. Boot placement centers remain absent from runtime state: no event regenerates
them or restores a desired region count. This scale revision does not implement dynamics.

## State and common operation

Extend the existing Rust-owned substrate `g(x) = (h,q,t,k,c,d)` on the periodic XY mesh.
Retain its domains: height in world lengths; positive conductance no greater than one;
transmission in [0,1]; optional ceiling in light units; seasonal components inside the unit disk.
Existing consumers continue to derive movement, transport, processing, optics and supply
from that state. Dynamic terrain must not introduce a parallel set of habitat bonuses.

Use a shared spatial forcing operation over these fields. A candidate representation is
`z_next(x) = z(x) + integral f(x,time) dt`, followed by the fields' explicit domain transforms.
For example, conductance can use the existing bounded noise/log-conductance transform;
seasonal components must remain in their disk rather than evolve wrapped angles separately.
The representation, transform and interpolation are part of the physical contract, not hidden
per-feature tuning. Units of each forcing component are its represented quantity per model
second. A zero forcing must recover the current static operators exactly.

Two time profiles express the scope through that common operation:

- **Gradual change:** spatially coherent forcing varies slowly in model time. Preserve named
  independent random streams and periodic warped multiscale morphology. Continuously evolve
  coarse coefficients or warp coordinates; do not replace the map with independent snapshots,
  regenerate it every tick or scroll a repeated tile beneath the cells. Height, conductance
  and cover need not change together or share the same favorable regions.
- **Local events:** an event applies a finite increment over a bounded irregular footprint.
  Reuse the fractal scale hierarchy for the footprint, with continuous edges and periodic
  wrapping. Event size is a physical length and event duration a model time. The event's
  affected fields and any material displacement must be explicit; a generic “catastrophe”
  label is not a physical rule.

Temporal law, timescale, amplitude and event family remain implementation-design decisions.
Choose the smallest common parameter set with distinct units; do not add separate rates for
each chemical, phenotype or named biome. The static generator remains a boot operation;
runtime evolution needs bounded local work rather than repeating that expensive operation.

## Physical accounts and ownership

Current height describes constitutive resistance, not stored gravitational energy. Changing
that boundary alone credits no energy or material to cells. If a future design makes elevation
a recoverable potential, it must account for its change across every affected material owner.

Changing a coefficient and physically pushing matter are different actions. An event that
displaces, injures or removes bodies must also define what happens to dissolved material,
overhead film and reservoir inventory. Commit transfers conservatively through the existing
owners. Any injected material or work has a declared external account; removed material has a
recorded sink. No free relocation, silent deletion, duplicated stock or unexplained heating.
Sunlight remains overhead and non-depleting; cell-paid emission retains its donor account.

Each update owns its affected regions and neighboring faces. Refresh movement dependencies,
transport faces, processing coefficients, optical samples and any seasonal samples that actually
changed. A cached coefficient must not remain valid merely because the chemicals did not move.
Schedule from bounded environmental change and the existing local execution resolution.
Keep empty chemistry sparse, while still updating physical terrain in unoccupied regions on
its own declared schedule. Never freeze geography because there are no nearby cells.

## Configuration, continuation and observation

Gradual change and local events require independent world-start enable switches, both off until
implemented and deliberately selected. Existing static coupling switches continue to work.
No deployment silently enables dynamics, changes generation seed or resets a continuing world.

Persist the canonical maps, forcing provenance, temporal phase, pending event state and relevant
event history. Restore must continue an in-progress change rather than redraw it. Derived
caches rebuild from that state. Extend the physical checkpoint format explicitly if new durable
state is required; do not introduce an old-save adapter or automatic map regeneration.

The ordinary integrated map should show evolving contours, substrate texture and actual shade.
Bounded inspection should distinguish an environmental change from cell-made cover or chemical
motion, and recent events should identify their time, affected region and accounted consequence.
Reuse the same renderer and revisioned terrain projection; no full physical maps or private
state flow into React. Numerical checks, conservation checks and bounded cost measurements
belong to implementation, not a separate user-acceptance plan.

## Live physical switches

Changing existing couplings in a running world is not terrain evolution. If implemented later,
use the existing authenticated operator boundary, retain canonical maps, invalidate affected
caches and persist the transition and effective configuration. Changing generation seed,
scale or initial resource placement remains a new-world operation. Display-layer toggles
already work independently and do not modify physics.

## Next design work

Before implementation, select one temporal forcing law and the physical meaning of the first
local event. Specify the affected fields, units, update bounds and accounts, then implement
those through all ordinary consumers, persistence and display. This is a design prerequisite,
not a request for an ecological proof campaign. Static-terrain repairs and seasonal calibration
can proceed independently; neither closes or silently discards this direction.
