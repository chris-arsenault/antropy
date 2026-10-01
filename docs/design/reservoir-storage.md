# Reservoir storage and local depletion

**Status:** Open design direction — September 30, 2026; not implemented or selected for delivery.

October 1 disposition: this buffering proposal is insufficient as the primary answer to the
narrow useful replenishment range. [Mortality driven reservoir recycling](mortality-recycling.md)
is the subsequent agreed design direction for lowering the extinction boundary. It preserves
ongoing external input and does not depend on this document's source-law replacement.

Make reservoirs retain unused supply and respond to local consumption. Replace the fixed
drain, empty wait and instantaneous refill cycle with continuous finite storage, limited
discharge and recharge into available space. The purpose is to make replenishment change
local carrying capacity more smoothly, while creating a difference between heavily used
and rested sites. Survival and dispersal remain consequences of physical budgets and behavior.

This proposal extends the source boundary in the [composed laws](chemistry/composed-runtime.md).
It preserves the [spatial hierarchy](spatial-scale.md), [seasonal geography](local-resource-seasons.md),
one evolving reservoir composition and ordinary cell physiology. It does not implement
[dynamic terrain](dynamic-terrain.md) or make that direction a dependency.

## Problem and evidence

Currently a reservoir releases at its site rate while stocked, whether cells use the material
or not. After exhaustion it waits an exponentially distributed interval, then imports a full
batch. Local seasons advance both release and refill waiting in supply time. Consumption
affects the surrounding field but does not regulate the source's discharge or next refill.
An unvisited reservoir can therefore exhaust itself and lose discharged food to washout.

The [extinction investigation](../extinction-correction.md) found starvation, but did not
establish one unique cause. Shorter cycles at the same nominal mean did not lower deaths per
cell-time; their smaller startup stocks also performed poorly. The delivered correction kept
full batches and shortened the mean wait from 2,400 to 600 model seconds. It increased nominal
mean supply 2.5-fold and supported renewed growth in a bounded startup run.

Those results justify investigating the source law. They do not establish that every larger
input prevents dispersal or that eliminating blackouts alone resolves extinction. The target
is a wider useful operating range, not a preferred population count or guaranteed migration.

## Common state and governing operation

Use the existing reservoir amount Q, normalized composition vector p, site rate r, storage
timescale T (`sourceLifetime`) and recovery timescale G (`sourceGap`). Their units are material,
dimensionless fraction, material/time and model time, respectively. G would cease to mean a
random empty wait. Define the nominal recharge target Qbar = r T; it is not a second inventory.

For the existing normalized footprint weights w, mesh area a and dissolved field amounts F:

```text
A = a / sum_n(w_n²)                         existing effective interface area
C = sum_n(w_n sum_species(F_n)) / a         local dissolved material / area
B = A C                                    equivalent exterior stock

discharge J = min(r, max(Q - B, 0) / T)
recharge  I = s(x,t) max(Qbar - Q, 0) / G
dQ/dt = I - J
```

s is the existing nonnegative seasonal multiplier. The ordinary case has T > 0 and G > 0.
All terms in I and J have units of material/time. B is a local reading, not stored material,
an extra field, or a claim that neighboring footprints own disjoint baths.

The discharge law is one-way concentration-driven exchange: conductance A/T multiplied by
the difference between Q/A and C, capped at the existing site rate. Depositing amount q with
weights w raises the same sampled C by q/A. This derives the internal/external comparison
from the installed interface instead of introducing an independently tuned saturation scale.

This is a proposed bulk-flow constitutive law, not a law already implied by chemical attraction.
It uses total dissolved material as mechanical backpressure. All chemical identities contribute;
there are no preferred food IDs or waste labels. Composition determines the value of discharged
material through the existing chemistry. Unlike cell membrane transport, the source outlet
does not selectively exchange individual species: it releases J p and takes nothing back.

Consumption that lowers surrounding dissolved stock increases discharge. Discharge draws down
the bank, while recharge restores its deficit. Accumulated exterior material slows discharge,
allowing the source to retain more inventory. Diffusion and washout can also lower C: unused
sites are not guaranteed to become full. Cells transforming and re-exporting material without
removing much bulk may produce little relief of backpressure. This is an important distinction
between local chemical turnover and actual depletion.

## Why the response should be less abrupt

With a neutral season and an empty exterior, the unsaturated stock equation is:

```text
dQ/dt = (Qbar - Q)/G - Q/T
Q* = Qbar T/(T + G)
J* = Qbar/(T + G) = r T/(T + G)
relaxation time = T G/(T + G)
```

The reference steady throughput equals the current batch-cycle mean. With current defaults
T=G=600, both yield 0.5r; the proposed stock relaxes over 300 model seconds. This comparison
isolates temporal behavior without requiring more nominal food. Actual world input need not
match: backpressure, moving sources and seasons alter realized imports and must be accounted.

This does not flatten the reference mean's sensitivity to G: in both models its logarithmic
sensitivity is -G/(T+G). The proposed improvement concerns interruptions, retention and the
feedback between consumption and delivery. A wider ecological operating range is a hypothesis,
not a mathematical consequence of the matched mean. Changing T also changes the concentration
head Qbar/A; it would no longer be merely a batch-duration adjustment.

For a fixed exterior stock B below Qbar, steady discharge becomes (Qbar-B)/(T+G). For B at
or above Qbar, discharge can cease while the source remains stocked. Recharge cannot force
discharge above r, even during a strong wet season. As G approaches zero, the high-supply
response saturates; as G grows, throughput decreases continuously rather than creating longer
random intervals with exactly zero release. This removes a source of sudden interruptions,
not the lower energetic limit for life.

There is a local negative feedback: uptake reduces exterior stock, discharge restores it,
and reservoir depletion reduces further discharge. For an isolated fixed footprint, write
exterior loss as uptake U(B) plus washout lambda B. In the uncapped flowing regime, with
constant season, k=1/T and gamma=s/G, the two-stock Jacobian is:

```text
[ -gamma-k,                 k ]
[        k, -k-lambda-U'(B)   ]
```

For positive recharge and nondecreasing uptake its trace is negative and determinant is
gamma k + (gamma+k)(lambda+U'). This supports local buffering under those assumptions. It is
not a stability claim for evolving populations, overlapping sources or spatial chemistry.

## Seasons, crowding and movement

Seasons modify recharge only. A dry interval cuts replenishment while stored material remains
accessible; a wet interval restores depleted stocks without increasing outlet capacity.
This gives the resource landscape memory. An exhausted site can remain poor after weather
improves, while a rested site can remain useful after weather worsens. The existing spatial
season scales remain unchanged; no new noise field or event schedule is needed.

The expected opportunities are:

- Established colonies can use a buffered continuous supply. Several neighboring reservoirs
  can still support a large persistent colony; that is a valid outcome.
- Heavy net uptake can draw down a site's stored capital. Additional cells then share limited
  throughput and existing crowding costs. No cell-count rule expels daughters.
- A less-used destination can offer a larger temporary reserve. A moving cell pays ordinary
  travel costs to reach it and can found a colony if the acquired material repays those costs.
- Exported dissolved material can suppress further delivery without receiving a special toxin
  classification. Existing chemical injury and sensing continue independently.

More dependable supply could also strengthen permanent residence. If every source supports
its residents comfortably, or travel remains unaffordable, this design will not produce
dispersal. The relevant comparison is the attainable net benefit of a rested destination
against staying, including journey survival and founder growth. Source fill alone cannot
certify that comparison. Existing local chemical sensing must expose a usable cue; cells
receive no map, destination, source identity or knowledge of hidden stored food.

## Material, work and composition

Recharge is the existing external material boundary, spread through time. Credit imported
material and its chemical potential when it enters Q. Discharge transfers that same material
and potential into the field; it credits no cell energy and no extra work. The concentration
law determines a rate and introduces no recoverable pressure-energy account. Ordinary source
photochemistry and its work/heat accounts remain responsible for composition changes.

Normal recharge has the source's current evolving p. Optional authored source zones/epochs
instead provide a transient incoming composition p_in at the recharge position and time.
For an admitted amount dq, conservative mixing is:

```text
p_new = (Q p + dq p_in) / (Q + dq)
Q_new = Q + dq
```

There is still one persistent composition. Crossing a zone boundary or an epoch change cannot
reset existing stock to the incoming profile for free. This deliberately replaces the current
discrete-refill policy, which assigns a composition when an empty source refills. Retain the
existing defined composition at Q=0; it continues to provide the structural interface and
ordinary chemical evolution. Never divide by zero when both Q and dq are zero.

Initial amounts currently vary around rT before finite priming. Preserve those quantities in
comparisons: do not clamp away an initial amount greater than Qbar. Recharge stops above the
target and ordinary discharge drains the excess. For fixed parameters, stock is bounded by
max(initial Q, Qbar). Changing a configured target must not delete existing material either.
This direction does not revive the rejected startup-priming rewrite.

G=0 denotes the instantaneous-recharge limit when seasonal exposure is positive, with imports
accounted and discharge still bounded by r. At zero seasonal exposure there is no recharge.
Implement this limiting case explicitly, not by inventing an epsilon control. A zero site rate
admits and releases nothing. Existing validation continues to require positive T.

## Delivery boundaries if selected

Replace the lifecycle in the ordinary native/WASM source owner. Do not introduce an alternate
physical economy, controller module, groundwater field, source anchors or extra machinery
construction. The new meanings of `sourceGap` and seasons require documentation and a physical
format revision; do not silently reinterpret an old checkpoint or add a migration layer.

Reuse the persistent region scheduler, footprint reductions and private source commits.
The existing accrued supply-time scalar cannot simply drive both flows: discharge advances
in physical time while recharge uses seasonal exposure. Use a positive, conservative local
integration with the existing error budget; resolve the stock/field exchange sufficiently
often for changing local demand. Sources read a shared frozen field, then commit releases
through the existing field owner. Overlapping footprints must not acquire serial update bias.
There is no reason to scan the entire map or every chemical for each source; reduce existing
local total-material data and retain sparse composition work.

The ordinary display should distinguish stored quantity from actual outflow on the existing
reservoir marks. Seasonal shading describes recharge conditions. A full but backpressured
source should not appear actively feeding simply because it is full. Keep the layer selector
and integrated default view; do not require users to select diagnostic layers. Observations
remain bounded under the [data ownership contract](chemistry/data-ownership.md).

## Questions that can change the design

Start with short constructed source/field cases using the existing harness: unchanged nominal
supply, no removal versus controlled local removal, a recharge-season transition, and local
accumulation from exports. Measure admitted material, released material, inventory and exterior
stock. Check whether installed field concentrations place most sources permanently behind
backpressure; matching dimensions alone does not establish a useful scale.

Then compare a resident and a locally responsive moving cell at a depleted origin and rested
destination, with actual default travel distances and costs. Measure cue, action, journey
expenses, arrival stock and funded growth. Separate the benefit of continuous delivery from
the benefit of destination reserves. Retain negative results; do not tune new gains to force
a particular winner or launch a population campaign before resolving the physical opportunity.

The eventual ecological question is whether a wider replenishment range produces gradual
changes in occupied sites, turnover and dispersal instead of collapse. It requires continuing
observation, not a promise in a delivery plan. Very low sustained usable input can still cause
extinction; changing source timing cannot pay a permanently negative maintenance budget.

Dormancy could separately lower that budget, but introduces activity floors and waking costs
and could favor staying indefinitely. Population-targeted recharge would conceal ecological
failure behind an observer-controlled subsidy. Neither is part of this proposed direction.
