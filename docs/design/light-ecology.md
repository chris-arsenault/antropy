# One illumination field and opportunities around light

September 25 update: the selected extension is specified below. The older sections 3–6 retain
proposal history; their finite-sun requirement and lateral-sun screening are superseded by
the user's overhead, non-depleting sun decision. Execution:
[light ecology plan](../plans/LIGHT-ECOLOGY-PLAN.md). The extension is implemented locally in v42;
deployment, operating acceptance and human review are tracked separately in that plan.

Historical September 21 baseline: scalar correction was implemented in v34; shelter and
emission were design work. Sulion plan `ed492c49-dd7e-4a73-a33b-7375d4bd5a14`
tracks the correction, bounded evidence and this design. The [principles](../principles.md)
and [transformation algebra](chemistry/transformation-algebra.md) remain governing constraints.

## Intent

Let inherited behavior exploit when and where light is useful: activity in daylight or darkness,
retreat into shelter, illumination produced by cells, and responses to those local emitters.
These are possible strategies, not roles, mandatory niches or reward functions. Dense homeostatic
colonies remain valid. The concern is whether other organizations can obtain conditional advantages,
not whether colonies meet a prescribed size or movement target.

## Selected extension: physical owners and shared optical funding

Terrain generation now uses three equally weighted products of periodic cosines at
32, 64 and 128 world-unit target wavelengths, rounded to integral cycles on each axis.
Independent seeded phases make the map permanent. With the bounded mean signal f,
transmission is `1 - shade_strength * (0.5 + 0.5*f)^2`; default strength is 0.8.
The square concentrates strong shade into patches without renormalizing solar income.
Canonical transmissions and optional per-node ceilings are checkpointed. All physical
and observer samplers apply them before interpolation. There is no terrain material account.

The objective is local environmental agency and conditional returns: permanent refuges,
organism-built cover, emission, and ordinary neural responses. The sun remains the current
analytic scalar drive; it is neither a finite donor nor laterally blocked by a wide colony.
Static terrain supplies transmission t in [0,1] and an optional peak ceiling k:
`L_geo=min(t*L_sun,k)`. The initial ceiling is unrestricted. Seeded periodic broad/fine shade
is independent of cell outcomes, source placement, elevation and conductance. No mean-light
renormalization compensates for shade. Existing terrain slope/conductance projects stay separate.

### Cover and material accounting

Select a thin, mobile extracellular film above the sole cell plane. This is an artificial
material phase: paid assembly places actual molecules in the film; it does not simulate lift,
support beams or a bond network. The film has its own ordinary regional chemical rows and
uses the existing diffusion/drift, public conversion and washout operators. Cells cannot
move into it and do not gain Z coordinates. Its molecules can be recovered locally at a
paid interface; ordinary secretion into dissolved material does not create cover.

The film's mass per area sigma sets `tau=sigma/optical_column`. One shared reference column
mass supplies opacity for all chemical identities; do not reuse mechanical impedance as
opacity. Sun at the plane is `L_geo*exp(-tau)`. Uniform film material experiences the column
average `L_geo*(1-exp(-tau))/tau`, with the continuous limit L_geo at zero. This prevents the
upper material from receiving the darkness of its own bottom surface. Transform at nodes
before sampling footprints. Terrain is a boundary, not another deposited material owner.

A funded construction capability sets the maximum amount handled per model second through
the existing growth-rate and stock law. Signed local neural effort chooses assembly/recovery.
Assembly/recovery cost existing construction work per material; reserve competing donors
before committing actual mixtures. No free recovery, preferred chemical, producer ownership,
canopy maintenance discount, immortal deposit or hidden conversion of species is introduced.
New builder and emitter stocks follow the common body investment/mutation/inheritance law.

### Emission geometry and payment

An emitter spends usable work through a funded powered-stock rate and neural effort. The
existing conversion efficiency bounds emitted work; inefficiency is heat. The powered-stock
reference uses the existing motor-power-density units (work/material/time), with no new
per-species or per-emitter power multiplier. Stock still pays ordinary machinery upkeep.

Use the existing normalized finite spatial kernel for local lateral emission. Aggregate
sources into local scalar support; never retain emitter-to-receiver histories. Its physical
reach is a shared optical length, independent of world size. Half the emitted work travels
within the cell plane; half travels upward. The equal split is the fixed two-path quadrature,
not an evolvable or tuned mixture. Upward work crossing local film is absorbed by the fraction
`1-exp(-tau)`; transmitted upward work leaves the modeled system. Lateral paths below the
film do not cross it. There is no downward reflection or unsupported ray-traced geometry.
Thus an emitter under geographic shade remains visible locally without multiplying its
light by the overhead terrain factor. Film can intercept upward emission without producing
a fictitious lateral shadow. This selected geometry is deliberately less than full 3D optics.

The incident lateral power density divided by one reference `optical_power_density` gives
dimensionless local emitted light. This reference has work/area/time units; it cannot be
silently identified with environmental_work, whose units are work/material. The receptor
reads the sum of received solar and emitted light. Work funding is additional to that
incident stimulus, just as sensing chemical concentration does not allocate its material.

### Joint reservation without a second reaction solve

At a physiological boundary finish material transport, local cover transfer, and paid
emission before freezing chemical donors. Sources retain base-tick movement and renewal,
but public source conversion joins field, cover and cellular conversion at this boundary.
No conversion products or captured work finance emission or another conversion in the same
stage. The full accumulated interval is processed once. Held optical display/sensor values
describe the preceding interval's incident power, not stored spendable optical work.

Let E_n be lateral paid work delivered to node n in that interval, Q_i an owner's available
reacting material, and W_ni its normalized geographic footprint. A field row's W is identity.
Form `M_n=sum_i W_ni Q_i` from dissolved, reservoir and cell inventories. The allocation is
`A_i=sum_n E_n W_ni Q_i/M_n`, using zero where M_n=0. Therefore `sum_i A_i<=sum_n E_n`.
Film receives the separately intercepted upward work through the same local material rule.
This is a reservation by exposed material, not a reward for population, type or ancestry.

For all allowed chemical product mixtures, coefficient magnitude is bounded by
`G=max_k(max_s p_sk-min_s p_sk)/4`. The normalized medium has L1 norm below one, so
`max(0,a_e dot B)<=G`. Let L_emit be sampled incident emitted light. Use
`L_funded=min(L_emit,A_i/(epsilon*G*Q_i))` for its work contribution, with the zero limits
explicit. Each frozen substrate can be processed at most once in the bounded reaction update;
therefore total emitted work captured by owner i is at most A_i. The ordinary reaction
allocator still limits substrates and cellular uphill work. Affordability is evaluated
using this funded contribution before reactions are accepted, not corrected after a subsidy.

The same chemical coupling uses `L_solar+L_funded`. The incident value used by receptors and
public kinetic exposure is `L_solar+L_emit`. These are incident and absorbed/funded quantities
derived from one optical state, not independent spectral channels or a controller source label.
Unused reservations escape/dissipate; they are not a battery or a second finance loop.
This bound may leave paid work uncaptured when machinery is absent or incompatible, which is
an accounted physical loss. It does not require running every reaction twice.

Solar work is booked as external input. Captured emitted work is an internal transfer.
For each interval, emitter payment equals conversion heat, optical escape/unclaimed work
and paid work delivered to chemistry. Reaction heat still accounts for chemical potential
and ordinary efficiency. A receiver can release more usable work than its optical allocation
by consuming stored chemical potential; only the emitted contribution is bounded by payment.
No closed cycle restoring all material/potential/body state can profit with sunlight off.

### Public photochemistry and selected limits

Select the existing public weathering operator as photochemical: multiply its shared
nonnegative engagement rate by incident illumination. Zero illumination stops this public
operator, including downhill public conversion. Intracellular enzymes retain their current
kinetics and can execute affordable downhill conversions in darkness. There is no independent
dark fraction, toxin category or direct light-injury rule. This is a selected change from v41.
Terrain conductance, if installed, scales public elapsed time; material shelter scales exposure;
light scales photochemical rate and funds work. Each factor appears once. Discrete actions,
potentials, conservative donor fractions and actual-material accounting remain unchanged.

No material, neutral medium, absent emitter stock/payment and zero cover have their ordinary
zero/identity limits. Shade helps only where retained intermediates or avoided harmful public
products repay lost direct work. Light-timed activity uses existing sensors and RNN actions;
it does not grant a dormant state or certify survival through an entire long solar period.

### Reference budgets and computational obligations

Initial physical references are an optical column of 0.1 material/area, optical reach of two
world units, and optical reference power density of 0.01 work/area/time. These are distinct
dimensional roles; calibrate them against complete costs rather than adding response gains.
At mesh2, tau=1 requires 0.4 material and 0.2 construction work. Ordinary washout .001/second
removes about .0004 material/second, costing .0002 replacement work/second before handling.
A .04 builder at growth rate .06 handles .0024 material/second, enough for replacement but
about 167 model seconds for initial construction. This is a real investment, not free shelter.
A .04 emitter at power density .2 spends .008 work/second; efficiency .8 produces .0064
optical work/second, split .0032 lateral/.0032 upward. Ordinary upkeep adds .0004 work/second.

At L_sun=1.6, t=.5, no ceiling and tau=1, the plane receives .2943036 solar units while
film average exposure is .5056964. With E=.1 and collocated material owners Q=[1,3], allocations
are [.025,.075]; their combined contributed work cannot exceed .1 even with different enzymes.
At zero light public production stops, but an intracellular potential drop may still fund
conversion; actual chemical-table examples and movement budgets belong to the bounded checks.

Reuse regional field execution for film instead of a second World. Budget any geometry/cache
duplication explicitly; do not add per-worker worlds. Optical support contains only scalar
quantities and must not wake empty 256-species rows. The optical material allocation visits
occupied rows and existing footprints once; no population-squared search or global solve.
Static terrain is computed once and persisted. Existing local and remote ownership contracts,
checkpoint caps and target 30 ticks/second remain mandatory, with misses reported.

## 1. Implemented correction: a single optical quantity

V29–33 independently scaled two chemical-response components and displayed their average.
That choice was introduced to change reaction rankings, not because multiple rotational periods
require multiple kinds of light. It also hid chemically consequential variation from photoreceptors.
That rationale is rejected. Multiple phases describe the source's evolution; chemical basis
components do not become independent illumination channels.

Keep the current visible forcing and periods, evaluated directly as one scalar:

```
a = 2*pi*x/width - phaseFast
b = 2*pi*y/height - phaseSlow
L = 1 + contrast/2 * (cos(a)*cos(b-phaseModulation)
                     + cos(b)*cos(a-phaseModulation))
B_lit = L * B
work_e = epsilon * max(0, a_e dot B_lit)
```

The three circular phases retain periods 30k/90k/310k ticks at default dt. They compose into
one periodic source field. This is an artificial periodic-plane illumination pattern, not a
claim of literal spherical solar geometry or chaotic forcing. Its current visible pattern is
retained to isolate removal of the hidden chemical modulation. No independent channel survives
in the numerical, observation, sensing or display APIs.

L has spatial mean one and bounds [1-c,1+c]. Default c=.8 still means dim light rather than
literal darkness. Full darkness is an available c=1 limit, not a newly selected default.
Uniform c=0 yields L=1. Identity reactions, zero medium and absent substrates still collect
no work. Light scales the existing chemical vector without rotating it or introducing a chemical
axis preference. Chemical relabeling carries profiles and operators as before; multiplication by
a scalar commutes with every linear change of feature basis. Geographic frame changes carry
the forcing phases/directions with the world. All chemical actions and work accounts are retained.

Cells, sources, field reactions, receptors, selected inspection, phenotype reductions and WebGL
must use this one value. The worker continues to borrow packed WASM views. No second renderer,
full-field message, geographic depth coordinate or per-cell daylight policy is introduced.

## 2. What day/night behavior can currently mean

The controller already has paid local light level, recent change and body-relative contrasts.
It can alter movement, transport, repair, enzyme activity and construction; recurrence supplies
private memory. Different signs and timing of responses can express day-active or night-active
behavior without a nocturnal gene or global clock. Basal maintenance remains payable while waiting.

For fixed chemistry and substrate, external reaction work is nondecreasing with L. That gives
light a direct metabolic benefit but no direct harmful-light pressure. Dark activity can still
pay if daytime processing leaves food that is available later, competitors consume less at night,
or light changes public chemistry into materials the cell tolerates poorly. Those mechanisms
exist in parts, but their complete private benefits have not been established at current settings.
Calling an arbitrary response to brightness nocturnal adaptation would skip this missing return.

Compare a schedule using actual accounts:

```
net work over a cycle = accepted reaction work
                     - upkeep - movement - transport - repair - remodeling - learning
material change      = accepted input - output - construction + retirement - losses
```

A waiting strategy needs enough usable work to survive its inactive interval; stored chemical
potential only helps if a dark-affordable transformation can release it. The current solar periods
can far exceed an isolated cell's work reserve. A sleeping/dormant state is not implemented and
must not be implied by turning motors off. First determine whether ordinary allocation and reserves
can support the intended schedule; a distinct low-maintenance physiology would need a separate
funded-body design if they cannot.

## 3. Shelter must change exposure and have an opportunity cost

Current mechanical impedance and sheltered abiotic processing do not create optical shade.
The externally prescribed light field reaches cells irrespective of intervening material.
Thus a cell can move into a darker geographic region now, but cannot hide behind a neighbor or
produce a screening material to reduce illumination. Dense colonies do not yet cast shadows.

The proposed extension is a common optical transfer operator over existing geography. Actual
field material and funded bodies contribute to an optical-depth reduction; sources contribute
only through the material they actually expose. The same attenuation acts on external and
cell-produced light. There is no separate hide action, shade bonus or list of shading chemicals.

A tractable candidate is finite-volume, nonnegative optical transport:

```
incoming_n = external_n + emitted_n + incoming_from_neighbor_faces_n
transmitted_n = incoming_n * T(tau_n)
absorbed_n = incoming_n - transmitted_n
0 <= T <= 1; T(0)=1; T decreases with tau
```

Select the stencil, finite propagation/escape and attenuation together. A bounded transport
update and an accounted escape sink avoid both a dense radiation solve and indefinite wraparound
accumulation. A directional source can supply face weights; the scalar intensity is their sum,
and the chemical work law never treats transport directions as different chemical light types.
No height coordinate is required for local optical screening. Terrain shadows remain a later
geographic extension.

Optical depth must come from material quantities, not population counts or lineage. Reusing
existing nonnegative impedance as the shared opacity coefficient is a candidate artificial
coupling, not a physical identity: it links screening to transport/movement consequences and
avoids a species-specific pigment table. It must be checked for an unavoidable all-purpose
"best material" before selection. An independent optical property is an unresolved alternative
if that coupling cannot express conditional tradeoffs; no coefficient table is selected here.

Shelter forfeits incident energy and requires material, space, transport or movement. Its
potential benefit is reduced exposure to harmful light-mediated chemistry, protection of useful
intermediates, or reduced encounter with light-active consumers. Current chemical stress and
membrane compatibility should price resulting injury. Do not add direct sunlight damage merely
to force shelter to win. If the ordinary chemistry supplies no countervailing benefit, record that
the hiding opportunity is missing rather than compensate with a shelter reward.

## 4. Emitted light must be paid, finite and usable through the same pathway

The current external drive is throughput-bounded but not allocated from a finite local photon
donor. Simply adding emitted intensity to L would be wrong: many recipients could each claim
work against the same emission, exceeding its production cost. Saturating intensity does not
solve that accounting problem.

Before enabling emission, introduce a finite optical-work account using the existing frozen-donor
allocation principle. A cell pays work for emission; at most that amount enters the shared optical
carrier. Absorbed optical work is divided among competing reaction requests and unproductive
absorption. Only accepted material transformations can capture usable work; the remainder
dissipates or leaves through the explicit optical sink. Current conversion losses remain.

```
optical input = external input + work paid into emission
             = retained optical work + accepted work delivery + optical losses
usable return from a closed emit/recapture cycle < work spent
```

An emitted packet cannot finance its own same-stage capture and re-emission. No separate
bioluminescent bonus, attraction force or cost-free beacon is allowed. An RNN chooses effort
through a funded capability or work-allocation port whose exact representation still needs
selection; duplicating a sensor into a free emitter is not that design. A common conversion
fraction can bound output, with unconverted payment dissipated rather than refunded.

External sunlight should enter the same account if optical competition and shadowing are to
have one meaning. This requires a source power per area: the existing epsilon has units of
work per transformed material and cannot silently become a power density. The additional boundary
quantity must be derived and calibrated against existing demands. It is an explicit future
change to source accounting, not part of the scalar correction. No full thermodynamic model is
required; finite work ownership and loss suffice.

Cells can then gather toward emitted light through ordinary funded photoreception and motors.
The emitter does not choose recipients or receive a cooperation reward. A useful beacon might
attract partners that alter its medium or remove inhibitory material; it might instead attract
competitors or consumers. Signaling can be cheap relative to powering another cell because
detectable light need not deliver enough work for maintenance. A successful signal still needs
a local response whose benefit repays emission. These remain opportunities to test, not promises.

## 5. Dense colonies and alternative organizations

The [180k analysis](../cellular-180k-connections.md) found strong neighbor-supported chemical
drive, largely private recycling, substantial overflow, constrained field interfaces and weak
directional light cues. It also found different northern/southern cycles and fast-turnover
peripheral consumers. The system already differentiates; low internal visible motion alone
does not establish convergence or a defect.

However, more neighbors currently improve metabolic conditions without sharing a finite local
illumination budget. The available counterpressures are interface crowding, injury, upkeep and
resource access. Small cells sampling a world-scale light pattern receive very weak directional
contrasts. A slow light cycle plus profitable private recycling can leave little reason to move.

Optical screening and finite absorption offer a connected counterpressure: extra mass can
support a habitat but also block light and compete for its capture. Edge residents, sheltered
processors, mobile light seekers, stored-material consumers and emitters can then experience
different returns. Local emitters and screens can create stronger body-scale gradients without
enlarging sensor range or amplifying an invented compass cue. This does not guarantee motion;
remaining stationary when it pays is a valid outcome.

The design must not impose maximum colony sizes, automatic dispersal, anti-density deaths,
assigned day/night types, forced agitation or a requirement that every region host a strategy.
Do not weaken binding merely because it successfully produced colonies. Evaluate whether leaving
or remaining has different affordable opportunities, including the motor work of actually
escaping dense contacts. Optical changes cannot substitute for inspecting mechanical trapping
when powered cells fail to displace.

## 6. Work sequence and decisions

1. Complete the scalar correction and all live consumers now. Keep current periods, contrast,
   spatial pattern, chemical maps, cell budgets and binding unchanged.
2. Design the finite optical donor, shared attenuation and paid emission as one connected extension.
   Resolve power-density calibration, optical depth, boundary/escape, funded emission and sparse
   transport cost before implementation. Adding a beacon to the current unlimited external-drive
   formula is specifically rejected.
3. Establish conditional opportunities with bounded probes: day/night schedules with equal initial
   reserves, screen/no-screen under favorable and harmful photochemistry, and paid emitter/receiver
   with reversed response signs and self-recapture accounting. Use the ordinary RNN and movement.
4. Measure dense-colony and sparse-world cost together. Source forcing remains O(nx+ny) cache work;
   local transport must use bounded stencil passes, skip inactive emitted support and retain
   shared memory rendering. Global sunshine itself is not sparse; do not conceal full-grid cost.

Steps 2–4 are backlog design, not an authorized implementation or an experiment campaign in this
turn. No 200k rerun is required to establish the scalar correction or to select these questions.

## Scalar correction verification registration

Question: does one visible/sensed scalar consistently scale external chemical work, with
multiple composed periods, unchanged accounts and no material added execution cost?

- Bounded invariants: scalar bounds/mean, phase composition, zero/uniform light, field-frame
  behavior, chemical-vector direction, scalar work scaling, shared cellular/abiotic coupling,
  optical inputs and packed renderer agreement. Reject prior physical checkpoint semantics.
- Reuse the illumination example's two supplied cell fixtures at the darkest and brightest
  locations and uniform controls: eight cases, at most 300 ticks each, 120 seconds per case.
  Read zero-tick budgets first. Mutation and learning are frozen by the existing fixture;
  no source release/weathering/movement or automatic horizon extension. Predicted effect is
  changed return magnitude and possibly affordability, not a required reversal between roles.
- One ordinary seed-27 3,000-tick startup, 120-second wall cap. This checks startup, not diurnal
  adaptation or a complete light period. Preserve failures without tuning for population counts.
- Existing release-WASM capacity comparison, before/after sequentially: 48, 2,000 and growing
  2,000 cells; 10 warmup plus 100 measured ticks, 60-second cap per workload. Existing mature
  contact-search limitations are not part of this correction.
- Full CI and read-only startup configuration inspection. No new development server or user-tab
  access. Record results here before closing the plan.

## Scalar correction results

The [retained reports](../evidence/illumination-scalar-v34/README.md) include budgets, eight
short probes, before/after capacity measurements and a 3,000-tick startup. They establish the
scalar coupling and bounded execution cost, not nocturnal adaptation or varied colony forms.

The initial sampled dim/bright light levels are .3741/1.6259. Both supplied cell types survive
300 ticks in uniform and bright light. In dim light, role1 dies at 114 and role2 at 67. Role2's
initial .00955 reaction income per .8-second interval already falls below .01219 maintenance;
role1's .02030 leaves little for its other expenses. The failures remain recorded rather than
retuned. Maximum absolute material/work accounting residual is 6.41e-12 across these probes.

Ordinary seed 27 reaches tick 3,000 in 17.86 seconds with 187 cells, 240 divisions and 101 deaths.
This is shorter than any imposed light period and does not establish continuing viability.
The startup account checks pass; the physical residuals include explicitly recorded numeric loss.

| Capacity workload | V33 ticks/s | Scalar v34 ticks/s |
| --- | ---: | ---: |
| 48 fixed cells | 62.54 | 62.50 |
| 2,000 fixed cells | 29.74 | 29.66 |
| 2,000 with growth | 19.32 | 19.52 |

These are single sequential 100-tick samples including observation/render preparation, without
GPU execution. Differences are under 1.1%; they do not establish a speed improvement. Existing
mature contact-search and save-size limits remain. Illumination still uses O(nx+ny) cached
rotations, no extra chemical pass and borrowed packed render storage.

`make ci` passes: 170 Rust unit tests, 17 Rust integration tests, 71 Vitest tests, the Python
producer-contract check, formatting, typechecking, documentation and Terraform formatting.
The existing 17 lint warnings remain. Intermediate checks caught stale physical-version assertions,
three formatting differences and the worker validator's old ten-layer display shape; all were fixed.
Startup inspection confirms seed 27, paused state and existing default controls. Browser visual
review was not performed; no second server was started.

Physical checkpoint v34 rejects v33 bytes explicitly because the work semantics changed.
Historical v33 analysis and artifacts retain their original meaning. A new world is required
to observe this correction; the existing user session was not accessed or restarted.
