# One illumination field and opportunities around light

September 21, 2026. Scalar correction is implemented in v34; shelter and emission below are
design work, not enabled mechanisms. Sulion plan `ed492c49-dd7e-4a73-a33b-7375d4bd5a14`
tracks the correction, bounded evidence and this design. The [principles](../principles.md)
and [transformation algebra](chemistry/transformation-algebra.md) remain governing constraints.

## Intent

Let inherited behavior exploit when and where light is useful: activity in daylight or darkness,
retreat into shelter, illumination produced by cells, and responses to those local emitters.
These are possible strategies, not roles, mandatory niches or reward functions. Dense homeostatic
colonies remain valid. The concern is whether other organizations can obtain conditional advantages,
not whether colonies meet a prescribed size or movement target.

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
