# Persistent geography and conditional survival

Proposed September 24, 2026. **Backlog candidate, not an accepted runtime law or the next
work item.** The user requests seeded map variation beyond initial reservoir placement:
local elevation differences, permanent shade, and broad terrain regions with finer variation.
Start static so their effects can be judged. Later tectonics and catastrophes remain separate
extensions. This document authorizes no runtime implementation or experiment campaign.

Design tracking: Sulion `95e0ca28-0f12-459f-9e3b-8b482c8f9488`, a documentation task only.
The [current work order](README.md) and [scaling plan](../../SCALING-PLAN.md) retain priority.

September 25 reconciliation: the [light ecology plan](../plans/LIGHT-ECOLOGY-PLAN.md)
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
it does not turn sunlight into a finite donor. This proposal's remaining elevation and
conductance operators must consume the same geographic boundary, not stack a second sun.

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

Height has no absolute reward. Adding a constant to h must change nothing. Neither elevation
nor conductance changes chemical identity, chemical reference potential, mesh volume, birth
requirements or enzyme maps. Keep the existing material-dependent resistance and responses;
geography composes with them instead of replacing cell-made habitats.

Use one seeded, periodic multiscale generator with an environment random stream independent
of biology and source renewal. Broad correlated modes define terrain regions; smaller modes
provide local relief and cover. Share the generator and scale conventions, but not identical
values: low terrain must not automatically be wet, shaded and rich. A sea-level threshold alone
would collapse several ecological axes into height. Correlated low/wet areas can be considered
later if they leave meaningful exceptions; no independent per-biome rules are needed.

Choose region widths from travel-before-reserve-exhaustion and chemical spreading lengths.
Keep fine variation resolved by the existing mesh and cell footprints; pixel noise is not an
ecological opportunity. Scaling world area should add regions at comparable physical scales.
Generator seed/version and chosen coefficients are physical configuration. A seed is a
reproduction identifier, not another ecological tuning parameter.

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

For dissolved transport, multiply the existing directed outgoing coefficients by m before
joint donor allocation; use the same sampled resistance for passive finite-owner translation.
Preserve frozen donors, antisymmetric material commits and existing speed limits. Opposite
directions can have different rates while accepted transfer is still added and subtracted
exactly once. Do not multiply a transport request and its already-adjusted mobility twice.
Flat q=1, beta=0 must recover current transport and motion.

Asymmetric exchange can concentrate material in hollows and impede crossing ridges without
an extra height-to-density formula. That is a prediction to check with diffusion, crowding,
binding and supply active, not an assigned concentration or guaranteed basin equilibrium.
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
variation. Stronger motors need not defeat steep terrain if their construction/upkeep costs
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

At 720x540 and mesh2 there are 97,200 nodes. Four f32 scalar fields use 1,555,200 bytes
(about 1.48 MiB); every additional scalar cache adds 388,800 bytes. This is a lower-bound
storage calculation, excluding face coefficients, renderer buffers and metadata. Budget these
and local arithmetic before implementation. Do not add N-by-256 terrain or light arrays.

Persist canonical field values plus generation provenance/configuration so restoration does
not depend on a later generator implementation. Reconstruct derived face caches. A new physical
format must be explicit; no save migration is proposed. Continuation within that format must
preserve geography. Check browser and native-server paths, physical caps and rejection behavior.

Provide terrain/elevation/cover views and bounded local readings of slope, conductance,
transmitted light and movement expenses. Retain legible chemical and cell overlays. Same-worker
rendering borrows Rust views; remote spectators receive bounded display projections. No private
or full physical field messages to React, second renderer, new listener or separate economy.

## Later changing geography

Static geography comes first as the complete selected candidate, not a promise that every
future mechanism ships with it. Tectonics could slowly alter h and substrate coefficients;
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
slope effects on the XY substrate, permanent optical cover, initially static behavior, and
backlog placement without changing active priorities.

Provisional recommendations: wet/dry as continuous conductance; directional uphill resistance;
common external transport/reaction timing; attenuation first, with optional clipping; independent
but spatially coherent geography layers. Their formulas are reviewable candidates, not additional
governing equations. The user owns whether water means an actual fluid and whether cliffs,
impassable land or water-exclusive bodies are wanted; those would change this candidate's scope.

If selected, create implementation phases from these acceptance milestones:

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
   if progressing to short contests. Measure dense and sparse whole-runtime cost and require
   human motion review. CI and ownership guards remain mandatory; report misses of 30 ticks/s.

No assay runs with this proposal. Mechanism, controller expression, inherited advantage and
long-term ecological diversity are separate claims. Later evolutionary observation is selected
for its own question; no automatic seed sweep, horizon extension or replacement founder follows.
