# Persistent geography and conditional survival

**Status:** Static implementation v47 — fractal elevation, conductance, overhead transmission, optional ceilings and regional fractal reservoir placement are implemented; dynamic terrain, tectonics, catastrophes and live physical switches remain separate unselected work.

**September 30 scale revision:** [Spatial hierarchy](spatial-scale.md) implements the
replacement of shared shade-scale generation and center-free resource placement. It restores
explicit neighborhood size and area per neighborhood, with finer local terrain and regional
seasons. Its generator/configuration sections govern v47. The explicitly historical v46
generation section below preserves the earlier design and its rationale.

First proposed September 24, 2026; expanded September 30 for integrated terrain and local-season
design and implementation. The user requested the full terrain direction,
configuration switches and concrete fractal generation/placement algorithms. The static
substrate and [local resource seasons](local-resource-seasons.md) form one design, implemented
initially in physical v46 and extended with the v47 spatial hierarchy. The [composed laws](chemistry/composed-runtime.md#geographic-composition)
record the installed operations; the implementation plan owns concrete repairs and delivery.
Slow terrain changes and catastrophes remain unselected backlog proposals, not a delivery gate.
The earlier static-first recommendation does not approve or reject that future scope. This document
does not authorize a live-world cutover.

Design tracking: Sulion `95e0ca28-0f12-459f-9e3b-8b482c8f9488`, a documentation task only.
The [terrain delivery record](../plans/archive/TERRAIN-AND-SEASONS-DELIVERY-PLAN.md) holds the
execution history. Static terrain, its integration corrections and the v47 spatial hierarchy are
published and live.
The [original results](../plans/archive/TERRAIN-AND-SEASONS-PLAN.md) retain their limits.
The [current work order](README.md) retains priority.

September 25 reconciliation: the [light ecology plan](../plans/archive/LIGHT-ECOLOGY-PLAN.md)
incorporates this proposal's permanent shade boundary. Its selected light design supersedes
the older finite-sun requirement below: sunlight remains externally prescribed and
non-depleting; only cell-paid emitted work has a finite donor account. Elevation, conductance
and later changing geography remain separately scoped. Static overhead transmission does not
automatically attenuate light emitted underneath it.

## Intended world

A location should retain physical characteristics after its original food is consumed or its
reservoir moves. Those characteristics change travel, material delivery, chemical persistence
and available illumination. Different inherited allocations may then repay their costs in
different places. No terrain selects a lineage, grants a reproductive bonus, or requires a
particular community. Geography can create selection pressures; it cannot guarantee adaptation.

Recommend one static substrate with three properties: elevation, conductance and optical
exposure. Wet/dry describes the conductance initially. It is a continuously varying artificial
substrate, not yet a water inventory, fluid solver, drowning rule or swimming/walking taxonomy.
Broad wet and dry regions organize the map; smaller ridges, hollows and shade patches supply
variation within them. Preserve viable combinations rather than putting every advantage in
one named biome. Labels are display descriptions, never runtime dispatch keys.

## Existing mechanisms and prior decisions

The [composed laws](chemistry/composed-runtime.md) already provide paid propulsion, bounded
chemical drift, diffusion, impedance, chemical shelter, public conversion, mobile renewing
reservoirs and scalar illumination. Cells alter their material surroundings. Actual material
and funded stocks retain ownership; terrain supplies boundary conditions, not consumable stock.

[Light ecology](light-ecology.md) now implements material shade, finite emitted-work allocation
and paid emission in v42. Static geographic shade reduces the existing external forcing;
it does not turn sunlight into a finite donor. The v46 elevation, conductance and overhead
transmission operators consume the same geographic boundary rather than stacking a second sun.

The September 18 [fixed-basin proposal](spatial-isolation-review.md) was rejected as a remedy
for reservoir dispersion. This request explicitly introduces geography for survival differences;
it does not revive source homes, forced colony separation or source placement in prescribed wells.
Keep current material attraction, class-specific coupling and reservoir exclusion. Do not feed
initial reservoir centers into terrain forces. Their previous rejection remains recorded.

Older [barrier evidence](chemistry/environmental-results.md) includes failed movement/spread
and net-return predictions. Physical resistance alone does not establish useful habitat
engineering. Current public-food evidence likewise includes a negative whole-cell survival
result in [material habitats](../material-habitats.md). These constrain claims, not the user's
choice to explore a heterogeneous world.

## A small common state

Generate a bounded periodic field vector on the existing XY mesh:

| Quantity | Meaning and units | Used by |
| --- | --- | --- |
| `h(x)` | Elevation in world-length units; no organism Z coordinate | Local directional resistance |
| `q(x)` | Positive dimensionless substrate conductance, at most one | Motion, material exchange across geographic faces and public reaction timing |
| `t(x)` | External-light transmittance in [0,1] | The shared illumination evaluator |
| `k(x)` | Optional illumination ceiling, in existing mean-one light units | The same evaluator; unrestricted by default |
| `c(x), d(x)` | Dimensionless circular seasonal components, with length at most one | The reservoir release/refill clock; no direct cellular cue |

Height has no absolute reward. Adding a constant to h must change nothing. Neither elevation
nor conductance changes chemical identity, chemical reference potential, mesh volume, birth
requirements or enzyme maps. Keep the existing material-dependent resistance and responses;
geography composes with them instead of replacing cell-made habitats.

The generation algorithms below share scale conventions and numerical machinery, but not
identical values: low terrain must not automatically be wet, shaded and rich. A sea-level
threshold alone would collapse several ecological axes into height. Correlated low/wet areas
can be considered later; no independent per-biome rules are needed.

## Fractal map generation and placement

This section records the historical v46 generator. For the current implementation, use the
[spatial hierarchy revision](spatial-scale.md): distinct D/R/F lengths, bounded fractal resource
envelopes and their normalized mixture. In particular, the single shared L and prohibition on
boot regional centers below do not govern that revision. No persistent source homes are proposed.

Generate the environment once at world creation. Boot may use denser sampling, filtering and
weighted placement tables; none belongs in the tick loop. Here **fractalized** means a finite
hierarchy of irregular, correlated features across resolved physical scales: broad regions
contain smaller ridges, pockets, cover and resource clusters. It does not mean independent
pixel noise, repeated tiles, a stack of visible sine grids or an infinite mathematical fractal.
Do not add an erosion simulation, drainage network or biome classifier merely to obtain it.

The existing [noise generator](../../engine/src/terrain_noise.rs) already supplies periodic
hashed value noise, independently offset octaves and domain warping. Extend that implementation
into one shared boot generator. Existing [reservoir placement](../../engine/src/sources.rs)
retains weighted random centers and radial offsets in the current-behavior preset. V46's
integrated preset uses the fractal density placement below. This describes local code, not
the continuing live world's configuration.

### Seed ownership and generation order

Derive each random stream from `(world seed, generator version, stable channel name)` using a
specified stable integer hash. Channels include height, conductance, cover, seasonal cosine,
seasonal sine, resource density, resource positions, resource attributes and founder placement.
Each map channel owns its octave and warp substreams. Do not use language-dependent hashes or
a single sequential random stream whose position changes when a feature is disabled.

1. Validate dimensions, mesh, physical scales and parameter domains.
2. Generate independent scalar terrain fields and the paired seasonal field.
3. Transform/filter them onto the canonical periodic mesh; derive local operator caches.
4. Generate a separate fractal resource-density map and sample exactly the configured sources.
5. Assign source properties, then place and fund founders through the existing initialization.
6. Persist canonical physical maps, positions, configuration and generation provenance.

No stage reads population density, phenotype, lineage or future survival. Changing a shade
switch must not reshuffle sources or consume mutation draws. Changing source count may change
founder locations through their existing dependency on sources, but must not change terrain.

### Periodic warped octave field

Use world dimensions W,H, mesh spacing delta and one shared region scale L in world units.
Retain the existing shade convention: the largest detail wavelength is
`ell_0 = min(4 L, min(W,H)/2)`. Subsequent wavelengths and amplitudes are
`ell_j = ell_0 / 2^j` and `w_j = 2^-j`. Stop before a wavelength falls below four mesh
spacings. On undersized diagnostic worlds, use only resolved octaves or a uniform field;
never invent submesh detail. Hold L fixed when enlarging the world so enlargement adds regions
instead of stretching the same few features. The domain cap only constrains small worlds.

For each octave, choose integer lattice counts `n_x = max(2, round(W/ell_j))` and likewise
for y. Actual wavelengths are W/n_x and H/n_y; check their resolution after rounding. Hash
wrapped lattice indices to values in [-1,1]. Interpolate with
`s(u) = 6u^5 - 15u^4 + 10u^3` independently along each axis, with independent seed and
offset per octave. Integer periodic lattices preserve value and derivative continuity across
the torus. Reuse neither an interior tile nor a common octave offset. Arbitrarily rotating a
rectangular periodic image is not a valid way to remove its grid because it breaks its seam.

Before sampling detail, bend coordinates with two independent coarse octave fields:

```text
p'(p) = p + (ell_0 / 2) * [warp_x(p), warp_y(p)]
N(p) = sum_j w_j * noise_j(p'(p)) / sum_j w_j
```

Each warp component uses the same periodic construction, spanning nominal scales `2 ell_0`
down to `max(ell_0/2, 4 delta)`, as in the current generator. Its lattice counts still obey
the domain and resolution rules. N remains in [-1,1], and periodic warp plus periodic detail
preserves wrapping. Coarse bending makes boundaries meander; finer independent octaves add
irregular edges and internal structure. The octave falloff and warp ratio are generator
constants, versioned together, rather than separate ecological tuning controls.

Warping can compress wavelengths. Four-mesh lattice spacing alone is therefore not an
anti-alias guarantee. At boot, use the analytic noise derivatives to bound the local warp
Jacobian, oversample the transformed maps accordingly and area-average into mesh cells.
If the required sampling exceeds the boot budget, omit unresolved finest octaves and record
the retained scales; do not silently lower the physical mesh resolution. Filter height before
deriving slopes, and filter bounded seasonal components together. Runtime interpolation must
be periodic and preserve bounds. Avoid cubic overshoot for q, transmission and seasonal length.

The v46 design intended to select L against measured affordable travel, source spacing and material spreading lengths;
the current shade scale is a starting value, not validated terrain calibration. Smaller
features supply local alternatives; broad regions supply persistent differences. Do not force
their boundaries onto execution tiles or require a particular number of islands or colonies.

### Transform noise into physical maps

For each independent map channel use `u = (N + 1)/2`. Fixed domain transforms give the fields
their physical meaning; there are no per-biome lookup rules or seed-specific histogram edits.

| Field | Proposed transform | Physical control |
| --- | --- | --- |
| Elevation | `h = L * N_height` | The proposed beta below controls resistance to slope; no second relief-strength knob |
| Conductance | `q = exp(log(q_min) * u_conductance)` | `0 < q_min <= 1` sets maximum substrate resistance |
| Transmission | `t = 1 - shadeStrength * u_cover^2` | Existing shade strength in [0,1] |
| Optional ceiling | `k = k_min + (k_max-k_min) * (1-u_cover^2)` | Finite ordered endpoints in light units; disabled means unrestricted |
| Seasons | `(c,d) = A_max * (N_cos,N_sin) / sqrt(2)` | `A_max` in [0,1]; period P remains a time control |

The height convention gives comparable grades as L changes; beta is the independent strength
control. Increasing octave count can still change the slope distribution, so report actual
grade quantiles rather than claiming resolution invariance. q is generated in log space
because its meaning is multiplicative resistance and it must remain positive. The transmission
transform preserves the current shade law. Ceiling and transmission share cover morphology
deliberately: clipping is another optical property of cover, not another independent biome.
Do not normalize final light or conductance against the map mean.

Seasonal channels use the same warped octave generator with only scales from ell_0 through
`max(ell_0/4, 4 delta)`. This fixed coarse subset retains fractal regional structure while
avoiding unresolvable alternating seasons at individual sources. It is not another tunable
noise recipe. Independent signed components give different regional phases and weak seasons
where they cancel. Their vector length cannot exceed A_max. Interpolate components directly;
never interpolate wrapped angles or normalize a near-zero vector to full strength. Define
`a(x,t) = 1 + c(x) cos(omega*t+theta_0) - d(x) sin(omega*t+theta_0)`, with `omega=2 pi/P`.
This is the [seasonal clock](local-resource-seasons.md#proposed-common-operation), with
amplitude `sqrt(c*c+d*d)` and total phase `atan2(d,c)+theta_0`. At zero length phase is
irrelevant. A_max is a ceiling, not the typical amplitude: octave averaging and filtering
reduce contrast. Report the realized amplitude distribution and quiet-interval lengths;
this construction does not by itself establish substantial regional supply downturns.

The global phase theta_0 is a seeded uniform draw, persisted with the world. It avoids an
explicit world-start peak; a finite random map can still be temporarily synchronized. Retain
the existing finite source priming and stocked initialization as declared initial conditions,
and do not interpret their transient as a seasonal result. No automatic phase balancing,
map rejection or source relocation is used to obtain a desired population outcome.

### Fractal reservoir placement

Use an independent full-octave field N_resource to define positive placement intensity
`rho(x) = exp(kappa * N_resource(x))`, with finite `kappa >= 0`. kappa replaces the old
center-count/spread description in this placement mode: zero is uniform, larger values give
denser clusters within larger clusters while retaining nonzero probability between them.
It changes positions, not source richness or total configured resource income. The theoretical
maximum/minimum density ratio is `exp(2*kappa)`; validate representability before generation.

1. Integrate rho over each mesh cell using the boot sampling above. Normalize these masses
   to a cumulative distribution (or alias table). This normalization chooses positions only;
   it does not normalize any physical supply or illumination.
2. For each of exactly `sourceCount` sites, sample a cell from that distribution and a uniform
   subcell position, then wrap XY. This defines a deliberate piecewise-constant placement
   density at mesh resolution. It is not a claim of exact continuous-density sampling.
3. Assign existing source radius, richness and mixture distributions from the independent
   source-attribute stream. Preserve configured counts, initial stock and priming accounts.
   Do not turn low-q, sunny or favorable-season locations into automatically richer sites.
4. Release the temporary sampling table after initialization. Initial density creates no
   persistent anchor, restoring force or source home; subsequent movement and renewal use
   ordinary physics at the source's actual position.

Do not use Poisson-disc spacing, a fixed number of regional centers, a minimum source count
per region or repeated rejection until all gaps are crossable. Those would suppress the
irregular clusters and sparse gaps this algorithm is intended to generate. Overlapping
reservoir footprints use ordinary circle exclusion; do not add a terrain-specific packing
force. Report starting overlaps and displacement during settling so they cannot masquerade
as terrain-induced migration. Dense placement can be a poor calibration without being an
excuse to install a hidden spacing law.

Explicit source-zone fixtures retain their configured membership and counts by sampling the
same density conditioned on each allowed zone. Do not sample globally and then remap x, which
would detach placement from its density map. Uniform/handcrafted diagnostic placement remains
available through configuration. These are boot choices, not separate runtime economies.

### Founder placement and feature switches

Preserve the present biological initialization: two founder groups near the first and the
most toroidally distant source, uniform disk offsets of radius three, existing genotype
allocation and funding, and independently random headings. For no-source fixtures retain the
existing quarter/three-quarter-world fallback centers. Their circular starting footprints
are deliberate controlled initial conditions; fractal environmental placement does not imply
fractalizing every cell's initial offset. Do not place different genotypes into hand-picked
terrain niches or change starting endowments to make the map succeed.

Expose typed configuration for elevation, conductance, transmission, ceiling and seasons,
plus reservoir placement mode (`current`, `fractal`, or the existing diagnostic fixture).
Keep independent conductance coupling switches for movement, external material transport and
public processing so each causal effect can be isolated. Disabled operators use h=constant,
q=1, t=1, no ceiling and c=d=0 as appropriate. Turning off transmission need not turn off
clipping. A current-behavior preset preserves installed shade and current source placement
while leaving new physical couplings off. The integrated preset selects fractal placement
and the reviewed terrain/seasonal operators; values remain subject to budget calibration.

The exposed generation controls are seed/version, shared physical scale, slope sensitivity,
minimum conductance, existing shade strength, optional ceiling endpoints, seasonal amplitude
and period, and placement contrast. Each has a distinct domain or physical meaning. Avoid
additional octave, warp, per-region gain, favorable-area quota or noise-mixture controls.
Old center-count/spread settings apply only to current placement, never secretly to fractal
placement. All effective choices must appear in browser, native and harness configuration.

The [scale revision](spatial-scale.md#scale-contract-and-starting-values) replaces these generation
controls in v47. It does not reinterpret settings or maps in a saved v46 world.

World-start switches are required. Live changes remain a review decision: changing a seed,
scale or placement method requires a new world, not regeneration beneath existing cells.
If live coupling switches are selected, retain the canonical generated maps and persist the
switch transition with correct cache invalidation. This proposal does not authorize them.

### Generation checks and review evidence

Verify periodic seams in values and slopes, deterministic named streams, field bounds,
uniform disabled limits, circular phase continuity, exact source counts and conditional zone
membership. Check that toggling unrelated maps leaves source positions, initial genotypes and
funding unchanged; initial sensory state and later physical outcomes may legitimately change.
For density placement, compare sampled counts with integrated density using declared sampling
uncertainty; do not demand equal counts in each region. Inspect source-attribute independence.

Produce local map previews at whole-world and close-up scales, including resource density,
actual positions, slope, cover and seasonal amplitude/phase. Inspect horizontal/vertical
autocorrelation and directional power for repeated tiles or visible grid preference; inspect
multiscale variance to establish that detail is present beyond a single broad blob. Domain
warping is a proposed remedy, not proof that lattice artifacts are gone. A failed visual check
requires correcting the generator, not covering the pattern with another renderer texture.

Report regional source occupancy, nearest-neighbor/gap distributions, map cross-correlations,
terrain grades and reachable neighboring supply over a seasonal transition. A finite seed may
correlate independent fields by chance; report that rather than reseeding until they decorrelate.
Use measurements to choose scale/contrast and identify unreachable or nearly uniform maps,
not to certify evolved diversity or require successful colonization. Record boot time, peak
temporary memory and retained map/cache bytes separately from ordinary tick performance.

## Elevation: local directional resistance

Recommend an artificial uphill-resistance law before introducing gravitational energy.
For a local directed crossing of horizontal length d, let

```text
s_ij = (h_j - h_i) / d
q_face = 2 q_i q_j / (q_i + q_j)
m_ij = q_face / (1 + beta * max(0, s_ij))
```

Slope and beta are dimensionless. beta sets the shared slope sensitivity; express its
calibration as the grade that halves conductance. The face's wet/dry conductance is symmetric;
the uphill factor is deliberately directional. A flat dry region remains slow. A high plateau
and low plateau with equal q behave alike. Downhill is easier than uphill, but never faster
than the same substrate's flat baseline because of this term alone.

This candidate enters the existing mobility operation once. Paid motor power faces the same
drag law, so speed follows the square root of effective mobility at fixed funded effort.
Slope is sampled along actual proposed translation, not merely heading; sideways adhesive
motion and contact correction cannot bypass geography. Stationary turning does not climb.
The exact placement relative to adhesion and exclusion must be resolved with the update order;
neither free uphill contact displacement nor overlap deadlock is an acceptable shortcut.

For dissolved transport, multiply each face's exchange by the m of its net direction
([composed laws](chemistry/composed-runtime.md#geographic-composition)); use the same sampled
resistance for passive finite-owner translation.
Preserve frozen donors, antisymmetric material commits and existing speed limits. Opposite
directions can have different rates while accepted transfer is still added and subtracted
exactly once. Do not multiply a transport request and its already-adjusted mobility twice.
Flat q=1, beta=0 must recover current transport and motion.

Asymmetric exchange can concentrate material in hollows and impede crossing ridges without
an extra height-to-density formula. That is a prediction to check with diffusion, crowding,
binding and supply active, not an assigned concentration or guaranteed basin equilibrium.
With net-direction face rates a uniform field stays uniform and slope skews spreading from
local supply only slightly downhill ([measurement](decisions-and-evidence.md#review-corrections-and-actuator-feedback)).
Reservoirs may also redistribute; reject a calibration that merely funnels the entire world
into one sink. Do not fix that failure by tethering them to initial sites.

This is constitutive resistance, not literal gravity: h stores no spendable energy and
downhill travel credits no work. Motor effort remains paid, and passive transport keeps the
current explicit non-harvesting interpretation. If the selected design instead requires a
downhill force or recoverable gravitational work, replace this candidate with a potential and
account for its changes through transport, growth, uptake, division, death and source refill.
Do not call an asymmetric rate rule conservative gravity or add an unaccounted downhill boost.

## Terrain: transport and reaction opportunity

Use q as one external-medium conductance, not a list of movement, chemistry and survival
bonuses. q=1 is the most mobile substrate; dry regions have lower, strictly positive values.
The shared geographic mobility above affects travel and diffusion. The same q scales elapsed
time for public field and exposed reservoir conversion, alongside existing material shielding.
It changes accepted amounts per time, never work per converted unit, products or affordability.
It does not scale intracellular enzyme rates: private chemistry has its own material and
machinery. Membrane pumping keeps its paid law and actual available donors.

This common coupling is a provisional model of substrate-mediated contact. Wet regions permit
fast transport and public processing, but also faster dispersal and loss of useful intermediates
to conversion. Dry regions retain local mixtures longer, but impede nutrient arrival, movement
and public replenishment of useful products. Public processing can be beneficial or harmful
according to actual chemistry; there is no preferred chemical category.

Do not add washout discounts, free nutrient production, per-biome mutation laws, substrate
immunities or independent reaction multipliers. Uniform fractional washout and source renewal
remain as they are. Slower spreading does not mean immunity from washout. Fast delivery is
also not automatically more total supply. Whether this one conductance produces enough
conditional tradeoff is an open question; a uniform improvement in every useful return would
invalidate the hypothesis rather than justify adding compensating bonuses.

Distinguish habitat quality from specialization: fewer survivors in a dry patch only shows
that the patch is harder. The stronger target is a reversal in the relative net returns of
two feasible funded allocations across conditions, such as mobility versus retained storage.
Seek that reversal through delivery, persistence and upkeep accounts, not different rewards
for named terrain types. A generalist may still prevail in the evolving population.

## Shade: attenuation and clipping have different effects

Use one boundary transform of the existing scalar illumination:

```text
L_external(x, time) = min(t(x) * L_existing(x, time), k(x))
```

With an unrestricted ceiling, t=.5 halves illumination at every point in the cycle. With
t=1 and k=.5, dim light below .5 is unchanged while bright peaks are clipped. Together, t=.5
and k=.5 both attenuate dim periods and cap the remaining peaks. The ceiling is .5 of the
existing unit reference, not .5 of that location's current brightness or maximum.

Recommend attenuation as the base terrain property. Retain clipping as an explicit candidate
for regions whose purpose is suppressing peaks while admitting dim light; it adds a distinct
response shape, so its independent parameter needs that reason. No post-shade normalization
restores the world's mean light or brightens other regions to compensate. Reduced forcing is
a real reduction in available work. Sample the transformed field over each consumer's normal
footprint; chemistry, optics and display must agree.

Static cover represents an imposed geographic boundary, not deposited chemical mass, literal
ray-traced mountain shadow or a cell-built canopy. It can vary independently of h. Moving sun
direction and terrain-normal shadows are later choices, not needed to express permanent cover.
V42 material screening attenuates external sunlight without a finite solar allowance. Paid
emitters use finite shared work allocation; subsequent terrain operators must preserve that
distinction and compose with the installed optical owner.

Light currently provides no direct injury law. Shade therefore loses energy opportunity and
can help only through consequences such as preserving useful substrates, reducing harmful
public products or changing competition. All-dark extinction remains possible. Do not promise
a shade specialist or invent sunlight damage to guarantee one.

## What might repay its cost

| Setting | Conditional opportunity | Counterpressure to retain |
| --- | --- | --- |
| Wet, exposed region | Rapid travel, delivery and light-supported processing | Dispersal, fast chemical turnover, competition and actual chemical injury |
| Dry pocket | Retaining useful local products and investing in residence | Poor resupply, ongoing washout and costly relocation |
| Ridge or steep boundary | Different routes can have different motor costs | Longer detours cost upkeep; crossing requires funded propulsion |
| Shaded pocket | Preserve light-sensitive intermediates or avoid harmful products | Less external reaction work; no guaranteed survival benefit |
| Wet/dry or light/shade boundary | Reach adjacent resources and processing conditions | Movement, interface competition and incompatible mixtures |

These are hypotheses, not organism classes. Existing motor investment, storage, receptors,
transporters, enzyme repertoires, membranes and neural allocation provide initial axes of
variation. Stronger motors need not defeat steep terrain if their body allocation, drag and paid effort
exceed the additional access. Dense stationary colonies remain a legitimate outcome.

Local light and chemistry are already sensed. Height, map coordinates, region labels, absolute
heading and distance to desirable habitat must not enter the controller. Passive sorting and
local physiological adaptation need no terrain oracle. Informed route choice, however, is
not established by slower movement alone: audit whether present body/contact inputs expose
useful load feedback. If they do not, a funded local effort/load cue needs an explicit sensory
design. Do not claim navigation or add a compass under the name of slope sensing.

## Ownership, durability and cost

Rust owns the static substrate and its revision. Precompute values, neighbor-face coefficients
and geographic derivatives once; let persistent 8x8 execution regions borrow these immutable
arrays. Ordinary operators sample cached local coefficients. Crossing a region or changing a
footprint invalidates relevant sampled conditions, even when no chemical state changed.
Static geography must not wake empty chemical support or add per-tick full-map work.

At 720x540 and mesh2 there are 97,200 nodes. Six f32 scalar fields, including optional ceiling
and seasonal components, use 2,332,800 bytes (about 2.22 MiB); every additional f32 scalar
cache adds 388,800 bytes. The installed shade arrays currently use f64: retaining that type
for all six doubles the estimate to about 4.45 MiB. Select precision explicitly and check its
effect on slopes; the smaller figure is not measured current storage. These estimates exclude
face coefficients, boot sampling tables, renderer buffers and metadata. Disabled optional maps
may use implicit constants. Budget caches and local arithmetic before implementation. Do not
add N-by-256 terrain or light arrays.

Persist canonical field values plus generation provenance/configuration so restoration does
not depend on a later generator implementation. Reconstruct derived face caches. A new physical
format must be explicit; no save migration is proposed. Continuation within that format must
preserve geography. Check browser and native-server paths, physical caps and rejection behavior.

The ordinary view integrates conductance ground, elevation contours, received-light shade,
translucent chemistry, clear cells and seasonal reservoir bands, with a permanent compact legend.
Terrain/elevation/cover diagnostic views and bounded local readings of slope, conductance,
transmitted light and movement expenses remain available. Same-worker
rendering borrows Rust views; remote spectators receive bounded display projections. No private
or full physical field messages to React, second renderer, new listener or separate economy.

## Later changing geography

The separate [dynamic terrain direction](dynamic-terrain.md) now owns this future scope,
including gradual change, tectonics, local events and their accounts, cache invalidation,
continuation and observation. Closing static-terrain work does not close that direction.

The earlier recommendation was static geography first; v46 delivered static geography, and
dynamics are unselected backlog proposals. Tectonics could slowly alter h and substrate coefficients;
catastrophes could make local topological changes and displace material and cells. Neither
belongs in initial calibration or the current optional disturbance implementation by default.

A later event must own its affected region, clock, displacement/injury rule, external work and
material accounts, cache invalidation and persisted event history. An impact cannot scatter
only cells while silently discarding field material, duplicate stock, or inject energy without
an external account. No population-triggered rescue, automatic niche reset or diversity target.
Changing height would also change stored potential if a gravitational model were selected.
These obligations explain why dynamics should follow an understood static world.

## Decisions and eventual selection

Settled by this request: persistent pseudorandom geography, macro and micro variation, local
slope effects on the XY substrate, permanent optical cover, configuration-controlled terrain
and seasons, and fractal map/placement design. Execution was subsequently authorized through
the terrain plan. The installed static operators are recorded in the composed laws; dynamic
terrain and live physical switches are unselected.

Adopted static model: wet/dry as continuous conductance; directional uphill resistance;
common external transport/reaction timing; attenuation first, with optional clipping; independent
but spatially coherent geography layers. The composed laws own their current equations and
the delivery plan owns measurements. The user owns whether water means an actual fluid and whether cliffs,
impassable land or water-exclusive bodies are wanted; those would change this candidate's scope.

The following engineering responsibilities belong within implementation. They are not separate
verification phases or human-acceptance gates:

1. **Select laws and budgets.** Resolve water meaning, slope/contact composition, the role of
   clipping, observable effort feedback, generation scales and complete accounts. Calculate
   traversal/reserve and reaction/delivery budgets before advancing ticks. The implementer
   selects numerical scales within the chosen semantics. A missing shade payoff stays missing.
2. **Integrate static geography.** Implement all selected consumers, generation, persistence,
   regional invalidation and display together. Check periodic seams, h-offset invariance,
   opposite grades, uniform recovery, conservative transfer, closed movement cycles, donor
   bounds, shade examples and continuation through ordinary browser/native owners.
3. **Establish bounded opportunities and operating cost.** Register cell-free transport checks
   and single-cell, few-hundred-tick uphill/downhill, wet/dry and shade/open comparisons. Use
   ordinary funded diagnostic RNNs, matched resources and explicit mutation/learning settings.
   Include conditions predicted to lose, and separate direct shade effects from public chemistry.
   Follow actual cue, action, delivery, work expense and funded benefit; use swapped placement
   if progressing to short contests. Measure dense and sparse whole-runtime cost as appropriate
   to the change. CI and ownership guards remain mandatory; report misses of 30 ticks/s.
   User motion feedback informs fixes without blocking plan completion.

When written, this proposal ran no assay; the bounded checks that later ran are in the
[execution record](../plans/archive/TERRAIN-AND-SEASONS-PLAN.md). Mechanism, controller expression, inherited advantage and
long-term ecological diversity are separate claims. Later evolutionary observation is selected
for its own question; no automatic seed sweep, horizon extension or replacement founder follows.
