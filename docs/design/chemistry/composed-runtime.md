# Composed artificial chemistry runtime

Updated September 18, 2026. This contract governs the fresh implementation under
[the canonical math plan](../../../MATHEMATICAL-SYMMETRY-PLAN.md#canonical-work-order). It supersedes the removed
runtime's numerical formulas and the candidate-only integration sequence. The
[computational foundation](computational-foundation.md), [principles](../../principles.md),
[funded bodies](../funded-bodies.md) and [data ownership](data-ownership.md) remain binding.
Implementation and acceptance are tracked separately in the plan; this document does
not claim that performance, opportunity or human motion gates have passed. The
[symmetry correction](../../../MATHEMATICAL-SYMMETRY-PLAN.md) records the v21 laws
and matched measurements. The [enzyme completion](../../symmetry-completion-audit.md)
records the v22 correction and its omitted founder scope. V23 replaces projected rigid maps
with exact finite actions and bounded kinetic mixtures, selected in the
[A0 derivation](../../../MATHEMATICAL-SYMMETRY-PLAN.md#a0-execution--bounded-permutation-algebra).
V25 corrects the privileged potential gradient, separates recognition from the global action,
scales chemical mutation in specificity units, and funds environmental return paths. The
[geometry correction](../../../MATHEMATICAL-SYMMETRY-PLAN.md#chemical-geometry-correction)
owns the new evidence; v23 human acceptance does not certify this revision.
Runtime measurements and human motion review remain separate from implementation.
V27 implements the [regenerative initial ecosystem](regenerative-ecosystem.md): shared
local external work for cellular and abiotic conversion, finite-owner self-load subtraction,
and four mutable founder types. Its evidence is recorded in the canonical plan's R0–R4 section.

## Meaning and owners

This is an artificial material and work system. It has no temperature, entropy,
electrochemical capacitor, detailed balance or global thermodynamic acceptance solver.
The 256 discrete chemical IDs inhabit a smooth bounded 16×16 chemical manifold.
Geography is a separate periodic XY plane. U prices material conversions; D controls
spread; I impedes motion; S creates compatible or incompatible exposure. Two shared
signed profiles supply geographic transport signals. They store no usable work.

Rust owns the dense f32 geographic mixture, f64 intracellular mixtures, fifteen funded
body stocks, usable work, damage, private controllers and complete compact ancestry.
The same worker renders borrowed WASM views. Checkpoint v27 persists actual installed
coordinates independently of inherited instructions and rejects earlier physical bytes.
There is no exporter allele or thermal-energy setting in this version.

Chemical definition v5 retains the persisted cosine coefficients and property ranges.
Potential uses seeded modes with squared wavenumber4–8, normal coefficients weighted by
inverse squared wavenumber, treating both axes alike. Valid definitions have at least60
rising and60 falling edges per axis, at least two strict maxima/minima, original coverage
and maximum normalized adjacent change0.15. Generation has a256-candidate cold limit and
fails explicitly. Diffusion, impedance, stress and interaction profiles retain their prior
laws. Those surfaces describe different physical roles; their retained gradient is not a
universal energy ordering. No organism outcome selects a landscape.

## Geographic composition

The default grid is h=2 on 320×240 geography: 19,200 nodes and 4,915,200 material
values. The initial h4 selection was rejected after visual and performance review.
dt=.2 model seconds and physiology=.8 remain explicit. Sources advance every
tick. Diffusion/drift integrate the full accumulated interval at physiology boundaries;
movement and maintenance run every tick. The schedule remainder is checkpointed.
Resolution comparisons use matched physical fixtures and time.

Four quadrature points at radius / sqrt(2), composed with bilinear grid interpolation,
form normalized finite body footprints W. Sampling and local deposition use the same W.
Material profiles are C times the two species-property rows. W-transposed body mass times
installed membrane response adds embodied contributions. Membrane response averages the
profile through its compact recognition kernel. No body contribution enters a work bank.

Each neighboring node pair computes one shared impedance factor and three bounded feature
differences. The third is the pressure difference `deltaP=χ*(L_left+L_right)*deltaL/2`,
where `P(L)=χL²/2`, χ=.003, and L includes field, reservoir-interface and embodied impedance.
For a species, directional drift contracts its two signed profiles and positive impedance
with `deltaA, -deltaB, -deltaP`. The first profile attracts and the second repels;
crowding increasingly opposes concentration regardless of chemical identity. Drift magnitude
is divided by `1+abs(deltaA)+abs(deltaB)+maxSpeciesImpedance*abs(deltaP)`, bounding every
species with one face calculation; default drift is .25. Impedance mobility is
1/(1 + scale × load). A derived index tracks occupied four-species SIMD groups at each
node. Each substep visits those groups and their periodic neighbor halo; empty groups
do not execute the stencil or property reductions. After a substep, concentrations below
`1e-6` are rounded to zero. This local numerical floor applies equally to every species;
it does not delete a species by its global abundance. Material and reference-value losses
enter the signed numerical error accounts. The September18
[scaling pass](../../../SCALING-PLAN.md) raises the preceding1e-9 floor after inspecting
material and occupied-group distributions and comparing ordinary continuations.
Intracellular stocks retain their material. There is no equilibrium shortcut.

The destination-row stencil gathers incoming material and retains donor remainder.
Substeps bound total outgoing fractions by .9, retaining a positive donor coefficient;
the default worst-case bound of .8 therefore needs one pass. f32 rounding has explicit signed material
and reference-value accounts. Exponential washout removes material and its reference
value as a boundary loss. No passive spatial change can increase usable work.

Uptake/export scratch contains only nodes touched by current body footprints. Four-species
request masks restrict deposition, shared donor fractions, acceptance and field commits to
requested support. All competing requests at a node share its frozen available material;
same-event exports cannot fund imports. Inactive rows do not allocate256-species scratch.

### Mobile resource reservoirs

Forty-eight externally renewing reservoirs start in uneven neighborhoods. Independent renewals
continue to import accounted material and reference value. Defaults are sourceDrift4,
sourceProcessing0.25 and sourceGap2400; sourceProcessing multiplies the common weathering rate.
The world remains open. Environmental transformations now have an explicit external work
account; a spatial sunlight model remains deferred.

Reservoir conversion screens changes below `totalInventory * f32::EPSILON`, relative to the
finite owner. It retains unprocessed tiny stocks. Applying the dissolved concentration floor
times interface area here would prevent small reservoirs from processing useful fractions.

Reservoir inventory projects through the same chemical interaction and impedance properties as
field material. Its interface area is mesh area divided by the sum of squared footprint weights.
Exposed material is Q/(1+Q/interfaceArea), bounded by that area. This is a finite interface signal,
not a transfer of ownership: cells cannot consume held reservoir inventory. The same footprint
deposits the signal, samples the medium and releases material. Passive velocity uses the common
body response, including embodied and reservoir signals; an isolated source cannot propel itself.
Empty sources retain the incoming mixture's response and can continue drifting.

For finite owners, gather the shared features and their centered gradients through the same W.
Their unbounded response is `a*grad(A)-b*grad(B)-χ*i*Lother*grad(L)` at that footprint scale, with
a,b,i the inventory or installed-membrane property means. Apply the existing mobility and
rotation-invariant velocity bound afterward. This pressure vanishes in a uniform medium;
at low load chemical attraction remains, while at high load the positive impedance channel
opposes concentration. `Lother=max(0,L-(S/meshArea)*sum(W²))` subtracts the owner's actual
projected impedance amount S, retaining other owners and dissolved background. Bodies use
mass times installed membrane impedance; sources use their bounded exposed inventory times
inventory-weighted impedance. The shared χ also scales dissolved pressure. Matched
sampling/deposition and the skew-adjoint periodic gradient
give `W^T D W=0`, including for the pressure term: no isolated-owner self propulsion.
Evaluating pressure after gathering is a finite-owner constitutive closure, not the exact
derivative of a global spatial energy functional. No stored work or thermodynamic state is
introduced. Existing viscosity and weathering exposure still use field/reservoir impedance;
embodied impedance is a derived mechanical signal, parallel to embodied signed profiles.
The [source correction](../../../MATHEMATICAL-SYMMETRY-PLAN.md#source-concentration-correction)
owns the derivation, symmetry limits and bounded measurement registration.

Chemical conversion acts on retained inventory before proportional release. Release preserves
the actual stored identities, without a second reaction. All source responses are frozen before
any source moves or releases. Body profiles are refreshed first; source projections are refreshed
after all sources advance. Renewal imports a fresh accounted batch at the current location.

Source inventory reductions and occupied chemical groups are derived once during release/commit,
then reused by response and projection. Restore and explicit interventions reconstruct them.
Geographic projection clears only previously touched nodes, with at most one projection per update;
unchanged source geometry and inventories retain the previous projection.
A radius/grid-dependent Gaussian kernel is compiled once. Motion translates it using the ordinary
bilinear geographic stencil; no Gaussian evaluation occurs for translation. This defines a
discrete interpolated footprint, with continuous motion across grid cells and periodic seams.

### Environmental conversion from the local medium

Environmental conversion reuses the two local interaction profiles H, including dissolved
material, embodied signals and reservoir interfaces. B=H/(1+|H0|+|H1|) bounds the shared response.
For each in-bounds adjacent product t of s, compile a=(p0[t]-p0[s], -(p1[t]-p1[s]))/4.
The edge uses the same exact interval-reflection action as an enzyme centered halfway
between the endpoints. Applied to this donor it exchanges s and t; outward
directions select identity and have zero coefficient. Edge rows retain fewer distinct
neighbors; rates are not renormalized to match interior totals.
Engagement is max(0,a dot B): the medium favors a product whose attraction/repulsion response
to it is stronger. There is no constant branch activity. Different mixtures can favor different
products; neutral mixtures do not convert, and dilution continuously weakens conversion.
Four local directions provide compact compiled support and continuity in chemical identity;
they are a selected artificial rule, not a required physical reaction network.

For each edge, external work per accepted material is `w=ε*max(0,a dot B)`, with
ε=119.31341917861687 shared by all owners. Let `Δu=U(s)-U(t)`. Abiotic branches require
`Δu+w>=0`; unaffordable engagement is zeroed before donor allocation. Among eligible branches,
reference-value differences do not rank rates. Diffusion controls spread only.
Exposure uses the existing impedance mobility 1/(1+diffusionImpedance×load). For branch hazards
r=weatheringRate×elapsed×exposure×engagement, allocate r/(1+sum(r)). All branches reserve against
the original donor; products cannot cascade during that update. Field and reservoir material
use the same compiled operator; sourceProcessing multiplies reservoir exposure. Accepted amount q
records `q*w` external input and `q*(Δu+w)` heat, never usable cell work. Favorably oriented
downhill conversions can also receive external work; it is dissipated abiotically. For owned
material M, rate-time-exposure h and bounded signal B, supplied work per update is at most
`(ε/2) M |B|_1 min(2h|B|_1,1)`. Absent material or zero medium receives no work. This rate-bounded open
drive can continue indefinitely; it is not stored energy in the vector field or a finite battery.
Cells must still import and process the products with funded machinery. No geographic
oscillator or weatheringPeriod setting remains.

Conversion runs in the final active field pass. Zero rate, neutral medium and inert species/pairs
skip reaction arithmetic. Sum engagement is bounded by 2|B|_1; skip a source donor or a complete
pair of field lanes when each q×min(1,2×|B|_1×weatheringRate×elapsed×exposure)≤f. A small field
lane can accompany an active partner. Here f is the concentration floor times mesh area for
field material, or interface area for reservoir material. Skipped donors retain their material.
Final extracellular products face the same floor and numerical accounts. Only surviving groups
wake future work. Repeated conversion can still broaden chemical support; compact mapping is
not a guarantee of sparse long-term chemistry. No global chemical pruning is used.

Deposits affect both chemical direction and exposure regardless of who produced them. Diffusion,
drift, washout, conversion and funded uptake change this context over time. habitatFeedback removes
impedance attenuation for diagnostic comparisons; it does not remove the mixture's direction.
The render/inspection activity is |B|_1 with and without attenuation, not a universal reaction rate.
Observers derive current body contributions through shared projection arithmetic instead of
reading the physical solver's previous-stage body cache. Rendering reuses its own two-component
derived buffer; inspection reduces contributions at its sample sites without mutating World.
Chemical operators, source projections and footprint kernels are derived caches; physical owners
and configuration determine conversion and exact continuation.
The [correction plan](../../../ENVIRONMENTAL-ECOLOGY-PLAN.md#ecology-correction) records current
checks; the earlier [environmental](environmental-results.md) and [source](mobile-source-results.md)
studies describe their original v14/v15 rules and cannot certify this revision.

Bodies sample centered differences through W. The shared antisymmetric difference and
identical deposition/sampling cancel an isolated body's own response. Paid propulsion
uses actual motor stock, damage, drag from body extent, viscosity and impedance. Passive
response uses `drift × mobility × f / (1 + hypot(fx,fy))`, shared with reservoirs.
Local overlap correction supplies body-relative contacts;
neither movement nor contact resolution credits usable work.
At exact coincidence, the normalized difference of heading vectors supplies the separation
direction. Swapping bodies reverses it and rotating both headings rotates it. Identical headings
give zero correction: no distinguished axis exists. This degenerate tie cannot be continuous
with every possible approach direction. Ordinary noncoincident contact geometry is unchanged.
In v19, requested motor work is `power × (swim² + .25 × turn²) × dt`; paid velocity scales
by `sqrt(paid/requested)`. The same work-rate function prices growth/refit reserves and budgets.

## Local recognition and paid operators

Recognition uses max(0, 1 − distance²/R²)² with Euclidean distance, initially R=3.
The kernel samples each existing discrete species once, without edge normalization; corners
therefore have less total recognition support. Product mixtures instead preserve unit-sum
material weights. These operators have different roles and need not share normalization.
Each cell retains four receptor,
four transporter and four enzyme targets plus a membrane coordinate. Enzymes carry continuous
recognition center a, global reflection center c and periodic orientation theta. Exact chemical actions
belong to `(S16 × S16) semidirect C2`, represented by two 16-entry permutations and an axis
exchange bit. Bounded interval reflections and axis exchange generate this closed group;
composition and inverse act exactly on the stored IDs, including boundaries.

The continuous parameters compile a mixture of at most eight such actions. Theta interpolates
adjacent quarter turns Qq; reflection parameters2cx and2cy interpolate neighboring integers.
Each component is `J_(kx,ky) Qq`. Recognition a never enters this action. At zero orientation,
the midpoint center(a+b)/2 exchanges any two discrete endpoints a,b exactly; moving recognition
to the product can retain the same operation and express its reverse. Products undergo
no clipping, reflection or projection after the exact action. Component maps are bijective;
the kinetic mixture and funded reaction are irreversible and are not called group elements.
All product coefficients compile once per changed enzyme; live reactions use sparse rows.
The 48 founders comprise twelve of each circuit role `0→128→136→8→0`, with six of each
in each of two separated colonies. Alternating zero-angle X/Y interval reflections centered
at(4,0)/(0,4) compose to identity on the entire manifold. Each founder has four copies of its
ordinary enzyme, two input and two output transporters, and an input-centered membrane.
Initial free and bound mixtures contain54.3698% input and45.6302% product. Ordinary RNN alleles
start with mild product export, repair and reduced swimming; all remain mutable. No role is
recognized by runtime physics. Reservoirs renew0/136 with source0 shares0.55–0.65. Finite initial
8/128 priming uses the existing priming fraction and is included in initial accounts; those
products have no new replenishment rule. This arrangement establishes an opportunity, not
permanent coexistence. The earlier two-feedstock founder remains an explicit diagnostic template.
Targets and installed coordinates have separate owners. Immutable compiled arrays are
shared; refitting refreshes only affected slots. Birth inherits actual installation.

Five receptor sample rows are composed before projecting local chemical rows. Each funded
receptor supplies tonic, temporal, body-forward and body-left readings. Stock-dependent
gain vanishes with absent stock. The 39-input, 24-recurrent-unit, nine-output private RNN
has no coordinates, property table, route, ancestry or reproductive score. Four-lane
controller arithmetic is deterministic within each supported runtime.

Transport action storage is [0,1]: zero exports, .5 holds and one imports. Effort is the
absolute signed distance from .5. Installed stock × turnover × effort gives finite
capacity, divided between recognized species by their weighted local concentration and
the shared occupancy denominator. Internal concentration uses actual body/inventory
volume. Pre-transfer inventory determines export donors and import headroom; available
work bounds all requests before any transfer. Exports cannot supply same-stage imports.

W-transposed demand allocates each geographic donor once. Accepted imports use W and the
same donor fraction. A complete chemical row is then committed once per affected node,
including exports. This avoids repeated material/reduction updates for overlapping cells.
Contiguous per-cell request rows and shared geographic donor rows use paired f64 arithmetic
for deposition and gathering. Field commits and refreshes project material through the same
five property rows, retaining six f64 reductions including total material. Exactly zero
donor demand is handled explicitly. Exchange does not prune material; the extracellular
numerical floor is applied at field substeps as described above.

Enzymes act constitutively. Recognition, finite-action mixtures and the pullback of
product occupancy are compiled once. Each substrate s has attenuation
`1/(1 + sum_t(productWeight(t) × distance²(s,t))/R²)`, using actual compiled products
and the shared affinity radius R. Binding times attenuation is compiled into its catalytic
coefficient; live conversion performs no new distance calculation. Equivalent conversions have
equal kinetic cost even when their parameter representations differ. Occupancy still uses binding affinity
for recognized substrates and mapped products, independently of kinetic attenuation.

Reserve frozen work proportionally across work-consuming requests; productive requests retain
their full request. Then share each frozen material donor among those funded requests. Newly
captured work and new products cannot fund the same event. This one-pass allocation can leave
some reserved work unused when material is scarce; it does not iterate or select a profitable slot.

Compile each row's weighted potential drop Δu and weighted profile difference
`a=(sum_t P(t)*p0(t)-p0(s), -(sum_t P(t)*p1(t)-p1(s)))/4`.
Once per physiology stage sample B at frozen pre-movement footprints, after field/source advance
and before exchange. For occupied reaction rows compute `w=ε*max(0,a dot B)` once and use
the same yield for funding and commit. With `d=Δu+w`, usable work is .8d when d is positive
and d/.8 when negative, less .05 per unit that actually changes chemical identity. Accepted
amount q adds `q*w` to cellular external input and dissipates `q*(d-yield)`. The atlas's static
work/heat values are explicitly zero-medium references; the web shows possible routes, not flux.
The catalytic charge and reported transformed flow vanish continuously at the identity
map. Idle binding can occupy finite substrate capacity but neither changes material nor
charges catalytic work. Conversion efficiency remains configurable below one.

## Bodies, inheritance and accounts

All internal species can fund biomass, selected proportionally. Assembly pays .5 work per
unit and transfers the consumed mixture into bound material without changing chemical identity.
Bound reference value is its mixture dotted with chemical reference values; no usable work is
captured by construction. Bound mass equals total funded stock. Growth approaches twice the inherited newborn
blueprint, bounded by actual material, work and core-dependent construction rate.
Growth protects work for the proposed larger body's upkeep, current motor effort and learning
through a complete physiology interval plus one movement tick. Refitting uses the same reserve
for the current body. This prevents optional construction from consuming the next interval's upkeep.

Maintenance charges actual stock and damage. Repair exchanges equal proportional amounts of
free and bound material, frozen before the exchange. Material demand and work costs scale with
total installed mass times the repaired damage fraction. Available free material, bound mass and
work limit repair; returned material cannot fund the same exchange. Death releases both mixtures
unchanged. Checkpoint v20 persists and validates bound material; see [the correction](../../bound-material.md).
Paid refitting
moves installed coordinates toward inherited coordinates on affected actual stock.
Each funded slot requests at most .25 distance units per model second. Distance is Euclidean
for recognition/transport/membrane coordinates; enzymes sum recognition-center and reflection-center
edit lengths plus R times the shortest angular edit in radians. Work is constructionEnergy × stock × requested distance, allocated proportionally
from available surplus. One distant target cannot delay another slot except through shared work.
This prices continuous changes to installed parameters, so distinct edit paths with equivalent
end-product maps may cost differently. It is separate from per-conversion kinetics.
Empty slots can finish freely without creating stock. Completed slots borrow target compiled
arrays immediately, even while others remain partial. Unpaid funded target changes leave installed
response intact. Excess usable work dissipates.

Local division requires funded double body, inventory, work and division cost. Fission
ends the parent and creates two daughters; budding retains a reduced parent and one
daughter. Stocks and inventories split, damage fraction persists, private memory resets,
and inherited targets can mutate or receive paid birth-local assimilation. Supported
haploid/diploid and clonal/selfing policies remain. Optional contact transfer copies a
whole typed genetic unit and grants no installed replacement stock. It defaults off.
Newborn contact readings reset with private memory; receptor baselines initialize locally.
Extinction stops visibly without reseeding. Unused genetic payloads can be pruned while retaining
living target/installed origins, diagnostic catalogs, founder roots and every compact ancestor record.

All chemical point coordinates use the common heavy-tail vector mutation with scale
`R × physicalMutationScale`; orientation uses the corresponding arc length divided by R.
R is the existing recognition radius: a local specificity change is measured against this
radius, not the full chemical-domain width. The initial v25 width15 multiplier caused excessive
ordinary changes and was rejected after the user's early-extinction report.
Event rates, body-unit scales and neural scales are unchanged. The same reflected distribution
has local and rare large steps. Chemical centers lie in[0,15]; orientation is periodic.
There is no special mutation aimed at waste or a known useful route.

V19 requires inventory at daughterInventoryFraction (.1875) times actual parent storage capacity.
Retained work is the larger of daughterEnergyFraction (.125) times actual energy capacity and
both actual daughters' initial upkeep/learning reserve. Division additionally costs
divisionWorkPerCore (.04) times parent core. Growth protects protectedInventoryFraction (.125)
of current storage capacity. These replace absolute newborn allowances, with no new controls.
The [coupling correction](../../physical-coupling-correction.md) records units and verification.

Death returns inventory and generic body locally and dissipates remaining work. Finite
source reservoirs and demand-independent renewal are explicit boundary inputs. Material
closure includes sources, field, inventories, body, washout and rounding. Work closure
includes reference material value, usable work, separately recorded external cellular/field/reservoir
work, all dissipative expenses and boundary losses. A closed unfunded cycle cannot create
work; an environmentally driven cycle can harvest only its accounted external supply.

## Verification boundaries

Rust tests cover dense product expectations, donor contention, conservation, exact
continuation, zero self response, mutation continuity and funded installed inheritance.
The zero-tick economy report distinguishes import-only upper bounds from finite enzyme
processing under an explicitly chosen internal mixture. Neither predicts controller
expression or evolutionary exploitation by itself.

Production capacity uses 48/2,000/2,000-growth, all 256 channels, distinct genomes and
learning: ten warmup plus 100 measured ticks, with census, inspection and rendering
preparation. The target is 200 ticks/s headlessly and at least 30 ticks/s through the
complete browser. GPU work, accumulated-state recovery and human motion judgment have
separate acceptance. No population campaign or prescribed evolved ecosystem is a gate.
Current bounded registrations and outcomes are in the [rebuild evidence](rebuild-results.md).
