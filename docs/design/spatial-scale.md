# Spatial hierarchy for terrain and resource neighborhoods

**Status:** Proposed design revision, September 30, 2026; design work authorized, runtime
implementation not yet authorized. Sulion documentation task `59485420-e321-4a89-b4fe-f97a73b93751`.
This document owns the next generator's spatial scale and placement design. It supersedes the
single-scale and center-free recommendations in [persistent geography](persistent-geography.md)
for future implementation. The [composed runtime](chemistry/composed-runtime.md) still describes
installed v46 physics. No world reset, parameter change or new generator is delivered here.

## Purpose and first principles

The world should contain many uneven resource neighborhoods: nearby opportunities within each,
occasional outlying reservoirs, and larger poor gaps between neighborhoods. Cells remain capable
of local movement; some longer crossings can succeed with suitable reserves, physiology and
encountered food. Separation must come from space and uneven opportunity, not making all motion
slow. Solar systems and archipelagos are analogies for these relationships, not literal physics,
fixed colony counts or required biological arrangements.

Three different lengths matter: neighborhood size, area per neighborhood, and local terrain
feature size. One fractal generator can serve all three without giving them the same value.
Geography does not assign organism roles, provide destinations or guarantee colonization.
Reservoir centers below are discarded boot scaffolding, never persistent anchors or forces.

## What the earlier implementation lost

The September 22 enlargement changed 320×240 to 720×540, seven resource-region centers to 35,
and 48 reservoirs to 240 while retaining an 18-unit region spread and three-unit reservoir
radius scale. Thus the fivefold area increase added neighborhoods at approximately unchanged
local scale. September 28 added a radial tail permitting outliers.

V46 replaced that placement with samples from `exp(6*N(x))`. All terrain channels inherited
`shadeScale=32`, giving dominant detail wavelengths near 128, 64, 32 and 16 units. The old region
count and spread ceased to participate in integrated placement. Fractal texture replaced an
explicit neighborhood scale; reservoir count alone did not preserve it.

The [execution record](../plans/archive/TERRAIN-AND-SEASONS-PLAN.md) reports nearest-reservoir
distances, numerical properties and short opportunities, but does not select scales from
within-neighborhood versus between-neighborhood travel. Its seed27 nearest-neighbor median
9.01 and 90th percentile 34.18 are not measurements of regional separation.

## Scale contract and starting values

Let `A=W*H`, `N` be reservoir count, and `delta` the physical mesh spacing. Use these controls:

| Quantity | Starting value | Meaning and reason for independence |
| --- | --- | --- |
| World W,H | 720,540 | Physical extent; enlargement must not enlarge bodies or local features |
| Reservoir count N and radius scale r | 240 and 3 | Existing supply/site-size controls; radius still varies through existing attributes |
| Regional spacing D | `sqrt(720*540/35)`, about 105.4 | Square root of area per placement center; controls how many neighborhoods fit |
| Neighborhood spread R | 18 | Width of each resource envelope; controls concentration inside a region independently of D |
| Local terrain wavelength F | 36 | Largest local height/conductance/cover detail wavelength; independent of resource envelope width |
| Mesh delta | 2 | Numerical resolution; unchanged |

The starting `F=2R` makes a broad local feature comparable to a neighborhood diameter. It is
a declared starting relationship, not a physical identity: later changing R does not silently
change F. Derive regional seasonal wavelengths from D, with no separate seasonal-space control
in this proposal. Independent seasonal and terrain seeds retain independent spatial values.
These three lengths replace the shared shade scale and the old count/spread interpretation;
they are not additional controls layered over those settings. Keep existing slope, conductance,
shade and seasonal amplitude/period controls with their existing meanings. Regional concentration
comes from R/D and the existing uneven center weights; retire `placementContrast` in the new
regional generator rather than letting an exponential noise gain override neighborhood size.

Derived quantities make the design interpretable:

```text
K = max(1, round(A / D^2))          for N > 0; no resource centers needed when N = 0
mean reservoirs per center = N/K   about 6.9 at the proposed defaults
R/D                               about 0.171: envelope width relative to region density
K*pi*R^2/A                        about 0.092: summed nominal core area, before overlap
```

K counts abiotic placement centers, not occupied islands or colonies. There is no minimum
reservoir allocation per center. D is not a nearest-neighbor distance or exclusion radius.
As a large-domain Poisson reference, nearest-center distances have median
`D*sqrt(log(2)/pi)≈49.5` and 90th percentile `D*sqrt(log(10)/pi)≈90.2`. Finite fixed-K sampling,
overlaps and fractal envelopes change actual gaps. Subtracting two nominal 18-unit radii gives
rough reference gaps of 14 and 54 units; the envelopes have tails, not hard boundaries.
These calculations explain the starting geometry, not the topology of a generated seed.

When increasing area, keep D, R, F, r and delta fixed. A world-resize preset scales N in
proportion to area, explicitly displaying the resulting count; K follows from area and D.
Changing dimensions alone while holding N fixed intentionally makes a sparser world and must
not be described as preserving the previous resource density. No automatic live replenishment
or source creation maintains either density after boot.

## One fractal generator, explicit spectral bands

Reuse periodic hashed noise, independent named streams, quintic interpolation, domain warping
and boot quadrature. The generator takes an explicit largest wavelength and smallest resolved
wavelength; remove the hidden interpretation that every channel starts at `4*shadeScale`.
For each band use `lambda_j=lambda_0/2^j`, amplitude `2^-j`, and normalize by the amplitude sum.
Warp conventions and anti-alias bounds remain the existing shared generator constants.

| Channel | Largest detail wavelength | Smallest requested wavelength |
| --- | --- | --- |
| Resource-envelope deformation, two vector components | 2R | 4delta |
| Elevation, conductance, overhead cover | F | 4delta |
| Seasonal cosine and sine | D | max(F,4delta) |

The starting local terrain requests 36, 18 and 9 units instead of beginning at 128. Seasons
request about 105 and 53 units, retaining regional coherence while local ground has finer
variation. Actual periodic lattice wavelengths and any omitted detail must be recorded.
Cap the largest supported wavelength by half the shorter world dimension as today; if a
requested band has no resolved octave, use its neutral field and report the omission. Tiny
diagnostic worlds do not acquire invented submesh features or a claim to contain full regions.

Use the existing bounded transforms for q, transmission, optional ceiling and seasonal vectors.
Set height `h=(F/4)*N_height`; this preserves the earlier height-to-largest-wavelength ratio,
so reducing feature size does not automatically increase slope strength. `slopeResistance`
still determines the mechanical consequence. Actual grades depend on retained octaves and
warping and remain observable. Shade is overhead, sunlight non-depleting, and terrain does not
become a consumable resource. No added per-channel octave gains or independently tuned mixtures.

## Fractal resource neighborhoods

Use a mixture of broad resource envelopes deformed by a bounded local fractal vector field. This
restores an explicit neighborhood scale with irregular contours, uneven local arrangements and tails.

1. Draw K centers independently and uniformly on the periodic XY plane, from a named boot stream.
   Draw existing uneven center weights `w_i=0.2+4*U_i^2` from a separate stream. No lattice,
   minimum center distance, target occupancy or seed rejection. Nearby centers may merge;
   other regions may be unusually isolated.
2. Generate independent resource-deformation components `V(x)=(N_x,N_y)` with largest wavelength
   2R. Each component is bounded by one. Compute B, an upper bound on the operator norm of its
   spatial derivative, from the bilinear mesh's component derivative bounds. Select
   `a=min(R/(2*sqrt(2)),1/(2B))`, omitting the second bound when B=0. This limits `|a*V|`
   to R/2 and derivative norm to 1/2 without a new warp-strength control. Subtracting the center's
   offset below bounds its relative displacement by R.
3. For each center, define `psi_i(x)=x+a*(V(x)-V(c_i))` on the torus. It leaves that center
   fixed and deforms its envelope. For toroidal distance `d_T`, normalize each positive envelope:

```text
k_i(x) = [1 + (d_T(psi_i(x),c_i)/R)^2]^-2
Z_i = integral_world k_i(x) dA
p(x) = sum_i w_i*k_i(x)/Z_i / sum_i w_i
```

Here k is dimensionless, Z has area units and p is a probability density per unit area.
Normalize each envelope before mixing so a chance local deformation changes its shape without
silently reallocating all its expected reservoir count to another region. No center is
guaranteed even one reservoir; expected allocations vary with the existing weights.

The derivative bound prevents folding: distances in each deformed coordinate map lie between
one-half and three-halves of their undeformed values. Consequently fractal detail changes
shape within a bounded scale instead of creating arbitrarily distant density peaks. This is
a normalized density defined through deformed coordinates, not a forward push of uniform
samples; no Jacobian factor is omitted from the stated distribution.

The undeformed infinite-plane kernel has `Pr(radius<=s)=s^2/(R^2+s^2)`: half its mass lies
within R and 10% beyond 3R. That recovers the earlier outlier mechanism without a separate
background mixture, outlier probability or enforced chain of stepping stones. Torus wrapping
and fractal deformation change those fractions: R is a nominal kernel scale, not a promise that
half the final sampled sites fall within 18 units. The shortest-distance envelope is continuous
at periodic seams; its far-side derivative crease is only a boot density, never a terrain force.

4. Integrate p into the existing mesh-cell cumulative distribution, using boot quadrature and
   normalized cell masses. Sample exactly N sites and uniform subcell coordinates as today.
   For explicit source-zone fixtures, condition these masses on exact zone intersections and
   retain the fixture's prescribed source counts. Do not move globally sampled sites afterward.
5. Assign radius, richness and mixture using the independent existing attribute stream.
   Resource totals and attributes do not depend on terrain quality. Preserve the ordinary
   first/farthest-source founder placement and genetic funding; do not select favorable niches.
6. Discard centers, weights, density and temporary tables after boot. Save actual reservoirs
   and canonical terrain through the ordinary owners. Reservoir movement, repulsion, renewal
   and eventual merging remain ordinary physics. No springs, home coordinates or restoring field.

The explicit uniform placement mode remains the uniform diagnostic. The existing `current`
radial placement mode uses derived K and retained R with its existing radial sampler; it does
not retain a second region-count setting. A constructed zero-V fixture exercises the new
density's undeformed limit; it does not need a new production feature switch.
Retiring the old fractal density/contrast law must appear in configuration documentation and
generator versioning.
The earlier prohibition on any fixed count of regional centers is superseded for boot placement.
Its prohibitions on population quotas, repeated map rejection and persistent source homes remain.

## Travel and material spreading set the useful ratios

Neighborhood size must be interpreted through physical travel, not a pixel count. For a frozen
healthy body with motor power P, radius a, viscosity eta, efficiency epsilon and swim effort u,
the existing laws give, in a flat otherwise neutral medium:

```text
v = |u|*sqrt(P*epsilon/(8*eta*a)) * sqrt(m)
expense = M + P*u^2
distance reference = v*E/(M+P*u^2)
```

m is geographic mobility, M ordinary maintenance and E usable reserve. This omits turning,
aging, repair, uptake costs, adhesion and passive drift. Internal conversion and food encountered
on the route can extend travel. It is a frozen-state reference, not a cell lifespan forecast.
For heterogeneous routes, evaluate the ordinary directional movement operation along the route
and integrate expenses in time; the controller receives no route or terrain map.

The existing local v46 budget (`terrain-seasons/baseline-budget.json`, ignored artifact) gives
one newborn reference `a=.358, P=.016, M=.01066`. At effort .5 and reserve .5 this implies
34.1 model seconds and 14.3 neutral units, or 7.1 units at flat q=.25, before the omitted terms.
These calculations reuse the recorded budget; no population simulation was run for this design.
Measure food-access edge distances, not just reservoir-center distances: radii and dissolved
material can materially shorten the unsupported crossing. Do not treat all 50-unit center gaps
as routes that one unfed newborn should cross.

The intended relationship is routine short movement within some neighborhoods and a broad
distribution of inter-neighborhood costs, with some routes requiring outliers, larger reserves
or encountered food. Not every region must be crossable from every other region. Retain the
current motor and maintenance laws; do not make the world seem larger by raising viscosity.
If all inter-neighborhood routes are unaffordable, revise the geometry or identify a specific
missing survival opportunity; do not label complete isolation successful scale design.

Food spreading can erase source gaps. Compare gaps with the existing reference
`sqrt(diffusion/washout)` and actual public material coverage. The recorded supplied-species
references are about 20.5 and 7.1 units before terrain, consumption and other interactions.
These are not hard food radii. This design does not change chemical conversion or manufacture
empty oceans by deleting dissolved material. Likewise, moving reservoirs can rearrange the
initial regions; durable initial scale is not a claim that region geometry persists forever.

## Seasons, display and configuration

Retain the existing supply-clock law and period 3000 model seconds. Only its spatial band
changes: sites nearby in one neighborhood tend to share timing, while farther neighborhoods
can differ. The seasonal field never reads placement-center identities or source membership.
A local terrain patch and a seasonal region therefore need not have the same boundary.
Seasonal phase contrast alone does not establish a useful relocation opportunity; a destination's
productive interval must overlap arrival after paid travel.

The default integrated view remains sufficient: smaller local contours/ground/cover features,
visible reservoirs, chemistry and seasonal markers. Add a world-unit scale bar that responds
to zoom, not decorative region borders or a second renderer. Preserve the layer selector.
Use the same physical source positions and terrain in all views; no display-only stretching,
extra texture standing in for missing geography, or fixed pixel-sized physical features.

Proposed configuration names are `landscapeRegionSpacing` (D), retained `landscapeSpread` (R),
and `terrain.featureWavelength` (F). Replace `landscapeRegions` and `shadeScale`, and remove
`placementContrast`, in the next physical schema rather than keeping conflicting aliases.
Validate finite positive D, R and F and the derived K against the existing boot resource limits;
reject unsupported requests rather than silently reducing centers or increasing mesh size.
Record resolved K and per-channel wavelengths as generation provenance. Existing physical switches remain independent; changing
optical settings must not alter source positions. The new generator is version 2 and the new
configuration requires an explicit physical-format change on implementation. No save adapter,
silent map regeneration or automatic live-world cutover is authorized by this document.

## Engineering scope and open assumptions

The concrete implementation would replace boot placement and scale plumbing, update native,
browser and harness configuration, persist the new settings/provenance, and adjust terrain
observation normalization and the scale bar. Ordinary movement, source lifecycle and field
operators are reused. At current dimensions, K times mesh nodes is about 3.4 million envelope
evaluations per quadrature sample. Stream one envelope into the aggregate density at a time;
retain O(mesh nodes + K) temporary storage, never a K-by-map array or per-tick regional work.
Budget boot quadrature separately from ordinary stepping. No new runtime spatial index is needed.

Implementers own bounded automatic mechanics and map checks. Report within-region distances,
edge gaps, empty-space distances, overlap/settling, density at R and D, retained wavelengths and
travel budgets together; nearest-neighbor medians alone are insufficient. Boot component labels
may describe the constructed map in diagnostics but never enter cell observations or runtime
biology. Inspect normal whole-world and local views with world-unit scales. Use existing short
fixtures for actual cue/action/access, not a new ecology campaign or seed search.

Starting D, R and F are explicit design hypotheses. The unresolved questions are how much
neighboring envelopes overlap, whether dissolved material or reservoir motion bridges the
intended gaps, and which routes actual reserves permit. Change the responsible
quantity when such evidence appears; no requirement for a chosen number of colonies, successful
evolution or user-operated verification keeps this documentation task open.

[Dynamic terrain](dynamic-terrain.md) remains a separate direction. Future changes and events
must state their footprint relative to F, R and D; evolving terrain does not recreate boot
centers, maintain a target number of islands or silently resize the continuing world.
