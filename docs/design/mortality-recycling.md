# Mortality driven reservoir recycling

**Status:** Open design direction — agreed for documentation October 1, 2026; not implemented.

Lower the baseline resource supply at which the world can persist by returning a nonlinear
fraction of dead body material to nearby reservoirs during substantial die-offs. Ordinary
turnover should produce little reservoir recovery; severe mortality should produce much more.
Normal external replenishment continues. There is no fixed world biomass, target population,
population ceiling or automatic resurrection.

The purpose is to widen the useful replenishment range while retaining growth, evolution,
persistent colonies and opportunities for dispersal. This document records the selected design
direction, a candidate mathematical realization and the remaining implementation choices.
It does not change the installed [composed laws](chemistry/composed-runtime.md).

## The problem and intended feedback

The lower boundary is supply too weak or interrupted to sustain the world. The upper boundary
is supply so dependable at reservoirs that remaining there has an overwhelming evolutionary
advantage over travelling. The upper-bound concern is not too many cells. Both boundaries are
ecological hypotheses with dependence on terrain, physiology and behavior, not measured universal
constants. The [extinction correction](../extinction-correction.md) supports investigating the
lower boundary but does not establish a complete replenishment response curve.

This direction targets the lower boundary. Keep ordinary feeding relatively sparse, then make
body material more available through reservoir delivery during a serious decline:

```text
substantial mortality -> more body material recovered into reservoirs
                     -> additional finite feeding opportunities
                     -> improved prospects for survivors
                     -> declining mortality and reduced recovery fraction
```

The response must normally be weak enough to preserve the incentive differences created by
the baseline resource landscape. Temporarily sustaining an existing colony during a crisis
is an accepted tradeoff. Permanently subsidizing that colony through ordinary turnover is not
the intended behavior. This mechanism does not claim to raise the upper boundary or guarantee
an evolved mixture of stationary and mobile strategies.

## What changes from the current implementation

[Lifecycle release](../../engine/src/lifecycle.rs) currently deposits every chemical in a dead
cell's bound body and free internal inventory into its local field footprint. Remaining usable
energy becomes heat. Material is already conserved; it may be consumed, transported or lost
through ordinary washout. Fission endings are separate from actual deaths.

[Reservoir lifecycle](../../engine/src/source_lifecycle.rs) currently drains a finite batch at
the site's rate, waits after exhaustion, then imports a new batch. The source owns one chemical
composition and one physical amount. The same amount currently also determines cycle transitions.

The proposed change redirects part of the dead body's existing mixture into local reservoir
inventory. Free internal inventory and unrecovered body material still enter the field. The
body/inventory distinction already exists; it needs no new independently tuned split ratio.
Recovered stock can supply a reservoir during its ordinary empty wait. Subsequent delivery
remains finite and uses the source's existing rate and seasonal clock.

## Mortality severity and nonlinear response

Raw deaths per second confound world size with distress. Raw cell counts also jump at division
without creating body material. Use bound-body mass for the severity signal and material transfer.
Every actual death contributes, independent of cause, genotype or lineage; division contributes
nothing. No claim is made that food can remedy every cause of death.

The candidate severity estimator uses one physical-time memory tau. Maintain exponentially
weighted rates of dead body material d and funded body growth g, together with recent living
body mass b. Rates have units material/time; b has units material. With event measures D and G:

```text
tau * dd/dt = D - d
tau * dg/dt = G - g
tau * db/dt = B - b

h = tau * max(d - g, 0) / b
f(h) = h² / (h² + h_star²)
```

B is actual living bound biomass. Death and growth are event measures: in an interval dt,
rates use the actual transferred amounts divided by dt, or equivalent exponential event
updates. Use exact decay for held values. Initialize b to the founding biomass and d=g=0;
founder creation is not growth. There is no sensitivity to render frequency or observer sampling.

Subtracting funded growth distinguishes loss of living material from healthy replacement
turnover. It is the proposed refinement of the conversation's mortality-fraction signal, not
a second population target or a separate controller. A high death rate balanced by growth
does not activate substantial recycling under this definition. The tradeoff is that growth
elsewhere can mask a failing colony; the first design targets widespread decline, not every
local loss. Do not quietly add regional thresholds or selective death-cause weights.

Compute the same f for an entire death batch using the pre-removal population reference and
the batch's total deaths. This includes a sudden die-off in its own response without letting
cell iteration order change recovery. At zero reference mass with no death material, define
h=0. A positive death batch must carry a positive pre-removal reference rather than divide
by zero or substitute an arbitrary epsilon. Explicit population interventions must rebase the
estimator, not masquerade as ecological growth or death; an intentional mortality assay is
the separately declared exception.

h and h_star are dimensionless. At h/h_star of 0.1, 1 and 3, recovery fractions are approximately
1%, 50% and 90%. These describe the curve, not selected default settings. The exponent is fixed
at two rather than becoming another control. The response is continuous, bounded and small
near zero: f behaves as (h/h_star)² at low severity and approaches one at high severity.
There is no hard on/off gate. A large die-off cannot recover more matter than actually died.

Only tau and h_star are new numerical controls. Tau defines recent ecological loss; h_star
defines when that loss is substantial. They cannot be inferred from the replenishment setting
without coupling the response back to the parameter being made less sensitive. Select their
initial scales from ordinary turnover and survivor reserve duration, and retain them across
supply comparisons. A new narrow tuning window in either control would undermine the goal.
An enable switch in world configuration should restore the ordinary death path when disabled;
initialize the history at world creation or an explicit diagnostic intervention. This proposal
does not add live physical settings controls. No numerical defaults are selected here.

## Conservative local material transfer

For a dead cell with bound mixture m and free inventory i, construct the recoverable vector
c=f(h)m. Route c only to reservoirs intersecting the cell's existing finite local footprint.
Use nonnegative geometric overlap weights, normalized once across eligible reservoirs and
shared by every chemical component. Do not select recipients by genotype, food suitability,
population density, current success or death cause. If no reservoir is in local reach, c
also goes to the field. There is no nearest-reservoir fallback across a large empty gap.

For routing fractions a_j whose sum is one when recipients exist:

```text
reservoir j receives a_j * c
local field receives i + m - sum_j(a_j * c)
```

This guarantees componentwise conservation. Reuse existing footprints and local source lookup;
the precise geometric overlap implementation must be checked against those owners before code
is written. Do not introduce a new catchment radius or persistent map of corpse provenance.
The local capture rule is a proposed coarse model of material recovery, not resolved fluid
transport. A distant death cannot trigger teleportation of its body to an occupied colony.

For a source holding amount Q and normalized mixture p, accepting vector c_j gives:

```text
q = sum_species(c_j)
Q_new = Q + q
p_new = (Q*p + c_j) / Q_new
```

At q=0, keep the existing composition. All receiving events at a source aggregate before the
commit. Source chemistry remains one stored mixture; no second reserve chemistry or corpse
stock is introduced. Its ordinary transformations continue with their existing work accounts.
Do not overwrite incoming material with the source's old chemical profile, grant ATP-like
usable energy, or count recovery as imported supply. The dead cell's remaining usable energy
still becomes heat. There is no biochemical resurrection or machinery reconstruction system.

## Preserve normal replenishment while admitting recovered stock

Adding material to the current amount alone is insufficient. It would delay exhaustion and
therefore delay the next external refill. The current refill also assigns a new amount instead
of adding to a nonempty inventory. Both behaviors must be addressed in an implementation.

Keep the ordinary batch and wait schedule advancing independently of recovered stock, in the
existing seasonal supply time. When its normal refill event arrives, import the ordinary batch
and add it conservatively to any remaining inventory. Recovery cannot restart a wait, postpone
an import, change an initial batch, or cause the next refill to erase returned material.

The minimal design is a scalar schedule allowance for the nominal batch, separate from physical
amount Q. Exhausting that allowance starts the usual random wait even if recovered material
remains. During the wait, available Q may still discharge. The allowance describes a lifecycle
clock, not another material owner. Preserve the ordinary scheduled release/refill sequence when
recovery is zero. Source movement and seasons still affect that sequence through existing laws.

Keep the site's release-rate ceiling. This provides immediate delivery from recovered stock
at an otherwise empty source; it does not increase instantaneous flow at an already feeding
source. If most severe mortality occurs beside full sources, this actuator may be ineffective.
That result would require revisiting the delivery mechanism, not silently multiplying the rate.
Deposits admitted after the current release phase become eligible at the next ordinary source
commit; they must not wait for a random refill deadline or a UI observation cycle.

For normal source composition policy, a fresh batch uses the current evolving composition.
For optional zones/epochs, the existing policy supplies the incoming batch's profile. Mix that
batch into retained stock rather than resetting the retained chemicals at a boundary. This is
a necessary conservation correction once nonempty sources can receive scheduled imports.
Initial priming and ordinary startup amounts remain unchanged.

## Accounts and runtime ownership

The world remains open to new material and external work. Internal transfers obey:

```text
change in total owned material = external imports - washout - accounted numerical losses
```

Death recovery appears on neither side of that external balance. It moves existing material
from bodies into reservoirs rather than the field. Its proposed benefit is useful retention
and delivery during a downturn, not increased total material at the instant of death. Chemical
potential follows the same vectors. Stored material is not automatically usable food.

The Rust World owns the mortality history, routing and commits. The world-wide severity signal
is an explicit environmental feedback rule, not a local cue supplied to controllers and not an
observation panel controlling physics. Reservoir recipients remain local. Reuse spatial regions,
frozen reads and per-source aggregate commits; avoid a cells-times-reservoirs scan. Persist the
small history and lifecycle-clock state with a physical format revision if implemented. Do not
add checkpoint migration, a backend or full-state exports to React. The
[data ownership contract](chemistry/data-ownership.md) remains unchanged.

Bounded observations should distinguish dead body material, recovered material, local spill,
severity, response fraction and actual reservoir output. Recovery is not external supply and
an admitted deposit is not yet feeding a survivor. Integrate any recovery cue into existing
reservoir display marks and inspection; preserve the layer selector and normal default view.

## Competing priorities and decision changing questions

The intended outcome is a lower extinction boundary without materially strengthening ordinary
reservoir residence. A temporary advantage to survivors near reservoirs during a die-off is
accepted. Continuous crisis feeding, selection for destructive turnover, a new population target
or hidden reductions in normal replenishment are not intended consequences.

Important uncertainties remain:

- Direct field spill may feed survivors sooner than reservoir recovery. Account for actual
  uptake and timing, not just an increase in source stock or a passing conservation check.
- Corpse chemistry may be inaccessible or harmful. Preserve that result; do not turn returned
  biomass into preferred food or revisit chemical conversion laws to force a payoff.
- Spatially isolated deaths may have no reservoir recipient, and a small colony can collapse
  without a world-wide decline. Neither case receives an invented long-range rescue.
- Delayed release could create repeated crash/rebound cycles. The smooth bounded response
  avoids an unbounded payout but does not itself prove dynamical stability.
- A response that starts after all useful survivors are lost cannot prevent extinction. An
  empty world remains empty; increased reservoir stock does not authorize reseeding.

During implementation, use bounded cases with matched startup state to compare ordinary spill
and recovery under ordinary turnover and a finite die-off. Include deaths beside empty, waiting,
full and absent reservoirs; check simultaneous mixing and unchanged scheduled external input.
Then compare a small declared range of baseline supply with fixed feedback settings. Measure
survivor feeding and recovery as well as stationary/diffuse behavior in healthy periods. Do not
equate a larger final population with a wider useful range or expand runs to find a desired result.
These are implementer-owned questions, not user-acceptance phases or prerequisites for closing
the documentation task. Continuing ecological observation informs subsequent refinement.

## Relationship to earlier proposals

[Reservoir storage and local depletion](reservoir-storage.md) remains an unselected buffering
idea; it was insufficient as the primary answer to replenishment sensitivity. Its continuous
recharge, local backpressure and seasonal reinterpretation are not dependencies of this design.
Currents and regulated metabolic pace are separate possibilities, not this feedback mechanism.

The user rejected a finite world biomass budget and clarified that the upper-bound problem is
the incentive to remain at reservoirs, not population size. Population-targeted emission and
linear death-count bonuses are therefore not substitutes for the agreed response. Normal
external growth remains possible; only the routing of finite dead body material depends
nonlinearly on substantial recent loss.
