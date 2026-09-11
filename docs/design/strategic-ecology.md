# Strategic microbial ecology

The purpose is context-dependent inherited strategies with costs and benefits that can be tested.
This document owns active pressures, not a promise that the current population has evolved them.

<a id="ecology-resource-opportunities"></a>

## Resource opportunities

Finite A/B deposits vary in composition, radius, leakage and lifetime. Seventy percent of arrivals
are centered around one of three landscape clusters with bounded offsets; the remainder scatter
uniformly. Inventory and time limit each deposit; replacement waits are exponentially distributed.
Patchy mode mixes short/rich and long/modest deposits. Persistent/transient modes scale lifetimes
without changing finite-inventory semantics.

A/B are substitutable metabolic resources with separate funded processing pathways. Supporting both
costs construction and maintenance. Source placement is independent of organisms, and no patch
knows which genotype should prosper. Acquisition, storage, travel and crowding can therefore have
different costs across opportunities. A successful economical/slow niche is still unestablished.

The default [food-epoch schedule](../food-epochs-study.md) changes incoming A/B composition at
fixed tick boundaries without changing total supply. It tests whether changing processing demand
creates an inherited advantage beyond general cost reduction. Existing food and recycled B buffer
transitions, so neither an immediate population dip nor a subsequent recovery is prescribed.
New deposits alternate between 80% A and 20% A every 50,000 ticks. Each phase uses a fixed incoming
fraction; removing `foodEpochs` restores heterogeneous random deposit compositions. The completed
transfer panel found both general improvement and greater post-B advantage in B-rich contests;
the later [capability study](../capability-investigation.md) isolates a beneficial actual B-processing
allele. Its short invasion pilots do not consistently favor B supply more than A supply.

The recommended next direction is simultaneous spatial A/B heterogeneity, pending design review.
Begin with the existing non-epoch deposit distribution; its local contrasts and per-type processing
payoffs need the report's small mixed-versus-separated-food test before altering the Run default.
No new resource species or controller input is proposed. Evolved active food preference and stable
specialist coexistence are separate, currently unproved claims.

<a id="ecology-toxin-defense-and-repair"></a>

## Toxin, defense and repair

A local toxin diffuses and decays without ownership or producer immunity. Injury per second is

`damageRate × C/(C+toxinK) / (1+defenseStrength×defense/core)`.

Damage reduces uptake and motion by 1−damage and raises maintenance by 1+damage; unit damage kills.
Installed defense reduces exposure damage but consumes material and maintenance whether needed or not.
Repair is selected by the RNN, capped by effort, reserve and energy, and competes with growth.
Damage fraction survives division. No newborn healing grant exists.

Current injury/maximum-repair rates are 0.5/0.008 per model second. The previous 0.05/0.08 pair
let the founder erase most injury while it was visually negligible. This correction changes
timescales, not founder weights, food supply or sensing. At concentration 0.0019, reference-body
injury is approximately 0.0118/s, above maximum repair. These are authored model rates.

<a id="ecology-porous-matrix"></a>

## Porous matrix

Cells deposit precursor-funded matrix at their positions through installed builder machinery.
Matrix increases local drag, slows field diffusion, binds finite toxin and decays into detritus.
Binding capacity is matrix density × 0.15; saturating it leaves toxin free. Decaying capacity
releases excess bound toxin. Bound toxin also decays with accounted loss. There is no ownership,
remote placement, construction planner or shape target.

Mobility is 1/(1+8×local matrix density). Diffusion uses symmetric face permeability limited by
adjacent matrix. Thin deposits can protect while slowing their builders and restricting food
transport. Construction and retention therefore have costs as well as benefits.

<a id="ecology-disabled-systems"></a>

## Disabled systems

| System | Default | Reason and experimental boundary |
| --- | --- | --- |
| Solid matrix walls | `matrixMode: "porous"` | Ordinary deposits never approached the 1.5 hard-barrier threshold in the initial default. Strategic wall building is unproved. |
| Neutral signaling | `secretionRate: 0` | The founder has no established motor use of signal; useful communication is unproved. |

Experimental `matrixMode: "solid"` enables swept body-footprint entry checks, contact displacement
checks and blocked local offspring placement. Builders have no exemption; embedded cells may move
toward lower exposure. This mechanism has mechanics tests, not a live wall-building demonstration.

A positive neutral secretion rate restores a separate paid diffusing/decaying chemical. The RNN
sensor/action interface remains, and the display toggle remains available. There is no automatic
following or imposed meaning. Default empty signal transport is skipped.
Toxin and matrix remain active chemical actions even with neutral signal disabled.

<a id="ecology-consequences-and-boundaries"></a>

## Consequences and boundaries

[Current measurements](bacteria-results.md) show episodic visible injury, reduced reproduction,
matrix slowing and protection in ordinary Run worlds. Removing binding produces toxin deaths and
higher repair expenditure. Protected defaults have no toxin deaths over the measured horizon.

Those results do not demonstrate evolved offense/defense, stable strategy coexistence, strategic
construction, a slow-cell niche or useful inherited learning. Conditional advantages of hand-built
diagnostic variants belong to their recorded test conditions. Do not promote those variants into
the live default or imply that evolution found them.

Contact weapons, predation, dormancy, kin recognition, adhesion, new life stages, outcrossing,
microclimate and further resource species require a separately reviewed causal purpose.
