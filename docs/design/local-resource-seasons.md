# Local resource seasons

Proposed September 25, 2026; backlogged September 26 and **included in the terrain design
review September 30**. The static supply-clock design is implemented locally in v46;
the [terrain plan](../plans/TERRAIN-AND-SEASONS-PLAN.md) owns delivery and bounded evidence.
This is not a live-world reset or evidence of evolved migration. The [current work
order](README.md) retains priority. Earlier documentation tracking: Sulion
`1eb5b783-638b-4ac5-9034-b4d970eda46e`.

The subsequent [ecological incentives delivery](../plans/ECOLOGICAL-INCENTIVES-PLAN.md)
addresses crowding, byproduct exchange and off-reservoir light metabolism first. This supply
timing proposal is now reviewed with persistent geography; its earlier movement evidence
predates that delivery.

## Purpose and evidence

Create circumstances where remaining in a productive colony and moving to another
feeding location can each repay their costs. Independent reservoir interruptions can
average into nearly continuous supply when several reservoirs share a neighborhood.
The proposed intervention changes the correlation of local supply over time, rather
than granting a dispersal reward or prescribing a mixture of organism types.

The September 25 [movement study](../movement-opportunity-study.md) used the current
kernel, identical physical founders and different authored motor policies. In two
swapped competitions, eight swimming founders produced 20–24 divisions versus eight
from eight stationary founders, with greater material capture and construction after
paying motor costs. Starting directly on food, stationary and swimming families had
equal construction over the short probe. These results establish a constructed
access opportunity. They do not test the supply law below, explain the live world's
clustering conclusively or establish evolved coexistence. The study retains initial
conditions, costs, negative findings and local reproduction instructions.

The hypothesis is that shared local supply downturns would make departure useful more
often. Weakly fluctuating areas would retain relatively dependable feeding grounds.
Strongly fluctuating areas and their edges could reward searching, relocation and
return. Dense colonies remain valid outcomes; no colony-size feedback or community
target enters the environmental law.

## Current implementation boundary

In [sources.rs](../../engine/src/sources.rs), each reservoir has finite stock, a fixed
per-site release rate r and an empty waiting interval. On exhaustion, `Source::finish`
draws an independent exponential wait with mean G = `sourceGap`. `Source::renew`
refills Q = r T, where T = `sourceLifetime`, at its current position. Reservoirs
continue to move through ordinary physical interactions; refill does not relocate them.
The current defaults are T = 600 and G = 2400 model seconds.

Nominal long-run supply per site is r T / (T + G). Its stocked fraction is T / (T + G),
or 0.2 at these defaults. For n independent stationary sites, the simplified probability
that all are empty is 0.8^n: about 33% for five and 3.5% for fifteen. This illustrates
pooling of availability, not an observed famine rate. Dissolved material persists,
release rates differ, reservoirs move and nearby sites need not feed the same cells.

The [terrain generator](../../engine/src/terrain_noise.rs) already creates smooth,
periodic, irregular multiscale geography at boot. Reuse its generation machinery with
independent environmental seeds. Supply geography must not make shaded locations
automatically poor, or read cells, lineage identities or initial reservoir centers.
This complements [persistent geography](persistent-geography.md); it neither implements
that proposal's remaining elevation/conductance operators nor changes static shade.

## Proposed common operation

Generate two static periodic component maps c(x), d(x) using the concrete
[fractal generation and placement algorithms](persistent-geography.md#fractal-map-generation-and-placement).
Independent warped octave fields, restricted to the shared coarse scale subset, produce
`(c,d) = A_max * (N_cos,N_sin) / sqrt(2)`. Since each N is in [-1,1] and A_max is in
[0,1], vector length A is bounded by one. Broad irregular regions contain resolved finer
variation; the seasonal channels are independent of shade, elevation and resource placement.
Interpolate components with convex weights, not wrapped angles or normalized unit vectors.
Cancellation creates weakly seasonal regions without singularities or a separate patch rule.

For interpretation, `A = sqrt(c*c+d*d)` and `phi = atan2(d,c) + theta_0`, where theta_0
is a seeded uniform global phase stored at world creation. Phase is irrelevant where A=0.
Runtime evaluates `a = 1 + c cos(2 pi t/P + theta_0) - d sin(2 pi t/P + theta_0)`;
the amplitude/phase form below expresses the same law. Persist the components, phase origin
and generator provenance. Calibration remains open; the map-generation algorithm does not.

Use the bounded environmental multiplier

```text
a(x,t) = 1 + A(x) cos(2 pi t / P + phi(x))
d tau = a(x,t) dt
```

Here t is ordinary model time, P is a period in model seconds, a is dimensionless,
and tau measures effective supply time. Since 0 <= A <= 1, a lies in [0,2] and never
runs a supply clock backward. A near zero leaves the existing lifecycle nearly
unchanged. A near one produces pronounced slow and fast supply intervals. The sine
law is a proposed first forcing model, not a claim of chaotic weather; further temporal
complexity needs an observed purpose rather than an extra family of tuning controls.

Apply this one clock to both parts of the reservoir lifecycle:

- While stocked, request release r d tau, bounded by actual remaining stock.
- While empty, decrement the remaining wait by d tau. Retain the existing independent
  exponential wait draw in supply-time units and the existing refill amount Q = r T.
- Account for refill and release through the existing material and work ledgers.
  Carry remaining elapsed supply time through a within-step lifecycle transition;
  do not apply the same interval once to waiting and again to release.

Both consumers matter. Modulating refill alone can leave stocked neighbors supplying
a supposedly quiet area. Applying a common clock reduces their release together while
also delaying replenishment. Reservoir contents are retained during slow periods;
no drought rule deletes or teleports material. At A = 1, zero supply occurs only at
the trough instant; whether the surrounding low-supply interval causes depletion
depends on consumption, diffusion, stored food and ordinary washout.

Only release and refill waiting use tau. Chemical conversion, reservoir movement,
cell physiology, propulsion, decay and optical forcing continue on ordinary time.
Chemical conversion and performance thresholds are explicitly outside this proposal.
Sunlight remains overhead and non-depleting. Cells receive existing local physical
readings, not the supply clock, phase, coordinates or a destination cue.

## Budget and scale selection

For a stationary source, a averages one over P, and tau(t) - t is bounded. The existing
renewal process expressed in tau therefore retains its nominal long-run material
supply r T / (T + G), while changing its timing in ordinary time. This is not equality
of material supplied over a finite observation window. Initialization and cycle phase
affect that window. The source's changing composition also means equal material supply
does not imply identical supplied chemical potential.

For a moving reservoir, integrate a along its actual trajectory. A mean-one map at
each fixed point does not guarantee mean-one exposure along that path. Preferential
residence in productive areas could alter total supply. Measure actual external input
before interpreting a population response as a timing benefit. The integrated design
recommends accepting this path-dependent change in externally supplied material and reporting
it through the ordinary input ledger. It does not promise invariant moving-source income.
Do not silently renormalize against population or add a second unaccounted food inventory.
This explicit budget choice remains a reviewable recommendation.

Initially consider P = T + G, currently 3000 model seconds, to reuse the existing
supply timescale. This is a calibration hypothesis, not a validated period. Spatial
correlation length has distinct units and must be selected from reservoir spacing,
food spreading and affordable travel. It cannot be inferred from P alone.

An alternative patch at distance d needs an availability window longer than d / v,
where v is realized travel speed. Transit must fit reserves plus income encountered
en route after motor and upkeep costs. The movement study supports access over eight
units for its founder; it does not justify crossing map-sized barren areas. Select
reachable productive edges and retain weakly fluctuating regions. Broad synchronized
starvation would contradict the intended opportunity.

## Ownership, persistence and observation

Generate the canonical maps once and persist them with their generation provenance
and selected scales. Reuse Rust-owned geography and local sampling. Evaluate temporal
factors once per relevant update and sample at reservoir locations; do not regenerate
terrain, scan the entire field each tick or add a per-chemical seasonal grid. With
240 current reservoirs, the additional lifecycle work should scale with reservoirs.
Measure runtime cost rather than assume it is negligible.

Changing the meaning of stored waits and accrued release needs an explicit checkpoint
version and consistent native/WASM restoration. Preserve pending release across saves;
do not reinterpret an ongoing world's state silently or add a save migration. The
initial stocked state and finite priming remain those of the existing initializer. Draw the
independent global phase once; do not force all regions to begin at a peak or backdate source
history to manufacture an equilibrium. Initial priming can still create a starting transient,
which must be distinguished from seasonal supply. No map rejection or automatic phase balancing
is proposed. Setting A_max=0 or disabling seasons recovers the ordinary source clock.

Expose the local supply multiplier and actual reservoir release/refill through bounded
inspection. A supply overlay should distinguish environmental opportunity from food
already present. Preserve the existing worker/native ownership and rendering contracts;
no second simulation, renderer, backend or hosted evidence service is required.

## Investigation when selected

Start with budgets and bounded mechanics checks: ordinary behavior at A = 0,
nonnegative clocks, donor-bounded release, exactly-once transition accounting,
stationary mean supply and save/restore continuity. Check moving-source input explicitly.

Then compare small matched landscapes with independent timing and shared local timing,
using the existing harness. Verify that actual local food availability changes, nearby
alternatives remain reachable, and the comparison has not simply changed total input.
Observe local cues, displacement, uptake and expenses during a supply transition.
An informed initial phase can expose that transition without automatically running
an entire long season. Register any longer horizon for its specific question.

Use the result for experimental direction, not a campaign to prove or manufacture
coexistence. Reject or revise the mechanism if diffusion erases local differences,
downturns cause widespread starvation without reachable alternatives, or cells simply
follow the same persistent source clump. Preservation of colonies, useful mobile
behavior, storage-based endurance and evolutionary uptake remain observation questions.
The terrain plan records implementation checks separately from these open ecological questions.
