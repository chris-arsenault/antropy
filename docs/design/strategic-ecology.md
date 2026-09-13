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

Simultaneous spatial A/B heterogeneity is implemented as [food zones](bacteria.md#world-fields-and-finite-deposits):
a pure-A band and a pure-B band with equal supply. The [zone experiment](../zones-study.md) shows
that constructed A- and B-specialists each invade from rarity and persist with a generalist in
that world, while a generalist beats either specialist alone and in mixed worlds. The mechanism
is negative frequency dependence: a rare specialist has an under-exploited private resource. This
is a constructed result; evolved food preference and evolved specialization are phase 4 claims.

<a id="ecology-element-cycle"></a>

## Element cycle

Optional `config.cycle` turns the world into a cell-mediated cycle of one element in two states:
inorganic carbon in the `carbon` field, and organic material in food, reserve, structure and
detritus. An installed light-harvesting stock (physical locus 8, reference `photoRatio` × core)
fixes local carbon at `photoRate × stock × light × C/(C+carbonK)` per second, limited by free
storage, by carbon actually present at the body's stencil and by the light still unclaimed this
tick on the ground within `lightRadius` of the body (`lightSupply` fixation per raster cell per
second, gathered evenly over that footprint and claimed in body order, so harvesters whose
footprints overlap shade one another), and releases `oxygenPerMaterial` oxygen per unit fixed
into the `oxygen` field. The world's light budget is `lightSupply` times its area; at the
defaults it equals the deposit supply, and it is only realized where harvesters stand. Fixed
material enters reserve; harvesting stock pays the general machinery maintenance like any other
pathway, and the chemical energy of fixed material enters the energy ledger as light energy.
Membrane crowding (`machineryCrowding`, see
[bodies](funded-bodies.md#bodies-geometry-motion-and-uptake)) makes a cell that runs all three
acquisition pathways deploy less of each than a specialist, so specialization has a return that
does not depend on which food happens to be present.

Catabolism consumes oxygen. Its efficiency interpolates from `anaerobicEfficiency` to the
configured aerobic `catabolicEfficiency` by the oxygen available for the rate-limited demand at
the body's position, so oxygen-poor water yields less usable energy per unit reserve. Respired
and repaired material returns to the carbon field instead of leaving as waste; with the cycle
off the waste sink applies as before. Both gases diffuse through matrix and relax toward
atmosphere concentrations (`atmosphereOxygen`, `atmosphereCarbon`) at `exchangeRate` per second;
net exchange is accounted, carbon inside the material balance and oxygen in its own ledger.

Controllers receive no new inputs in this phase: harvesting is physiology, and the only
behavioural cue is the existing food chemistry. The guild structure the cycle can support is
autotrophs (harvesting stock, little transport) and heterotrophs (transport, little harvesting),
coupled through oxygen and carbon; whether evolution finds it is the phase 1 question of the
[roadmap](README.md#design-roadmap-2). With the cycle off no harvesting stock is built and every
earlier result stands unchanged.

<a id="ecology-predation"></a>

## Predation

Optional `preyYield` (default 0) turns contact killing into eating. When a cell dies of damage,
the fraction `preyYield` of its material (structure and reserve) enters the reserves of the
toxin-bearing neighbours touching it, split by their toxin machinery per core and capped by each
one's storage; the remainder, and every starvation death, becomes detritus as before. Nothing is
created: the ledger records the eaten material as `preyed`, and the corpse's chemical energy
follows the material. A predator is therefore any cell with toxin machinery in a world with
contact injury; no new stock, locus or input exists, and whether killing pays is a property of
the yield, the machinery's cost and how often bodies touch in a thick medium.

<a id="ecology-disturbance"></a>

## Abiotic disturbance

Optional `config.disturbance` stirs and thins random discs of the world. Events arrive
memorylessly at `meanInterval` model seconds from the environment stream; each strikes a random
centre with `radius`, moves every dissolved field inside (foods, signal, both toxins, detritus,
carbon, oxygen; not matrix or what it binds) toward its disc mean by `mixing`, and kills each
cell inside with probability `mortality`, its material going to detritus as any death does and
its cause recorded as `disturbance`. Nothing enters or leaves the world. Disturbance opens ground
and erases local chemistry, so it selects for reaching and filling empty space against holding
occupied space; the balance depends on the interval and radius, not on who is present.

<a id="ecology-gene-transfer"></a>

## Horizontal gene transfer

Optional `transferRate` (default 0) lets touching cells of different genotypes exchange
physical loci. Each touching pair, each tick, with probability `1 − exp(−transferRate × dt)`, the
recipient's chromosomes take the donor's expressed value at one random physical locus, and the
recipient carries a new immutable genotype record whose parent is its previous one. Its body is
unchanged; only its construction targets and tint are. Behavioural loci live inside the
controller and are not transferred. Transfer breaks the tie between a trait and the lineage
that evolved it, so a trait can spread through contact faster than by descent, and families
sharing ground share genes.

<a id="ecology-sharing"></a>

## Adhesion and sharing

Optional `sharingRate` (default 0) makes touching cells exchange stored nutrient. Each touching
pair, each tick, moves reserve from the richer to the poorer by the fraction
`1 − exp(−sharingRate × dt)` of half their difference, capped by the receiver's storage, and the
ledger records it as `shared`. Nothing is created. A gatherer feeds whoever touches it, so the
lever rewards staying with cells that gather in turn and is exploited by cells that only
receive; together with matrix, which keeps bodies in place, it is the material basis on which a
division of labour between touching cells could pay. Whether one evolves is the
[sharing study's](../sharing-study.md) question.

<a id="ecology-signal"></a>

## Quorum signal

The neutral chemical (`secretionRate`, default 0) is a costed secretion cells sense through four
inputs (level, change, and two gradients) and that has no physical effect. With the rate above
zero it is a quorum signal: its local concentration tracks how many secreting cells are near,
and the controller may condition any effort on it. The [signal study](../signal-study.md) turns
it on and asks whether evolved populations use it.

<a id="ecology-toxin-defense-and-repair"></a>

## Toxin, defense and repair

A local toxin diffuses and decays without ownership. Injury per second is

`(damageRate × C/(C+toxinK) + contactDamageRate × Σ weapon/core of touching neighbours) / protection`,

with `protection = 1 + defenseStrength×defense/core + immunityStrength×weapon/core`.

Installed toxin machinery therefore carries immunity, as colicin plasmids bundle toxin and
immunity genes; a producer is protected from every producer, not only itself.

<a id="ecology-family-chemistry"></a>

**Family chemistry** (`toxinTypes: 2`, default 1) splits the toxin into two chemical types held
in the `toxin` and `toxinB` fields. Physical locus 9, the tint, sets through a logistic the share
of a cell's toxin that is type B, and immunity applies per type in proportion to the share
produced: `protection_X = 1 + defenseStrength×defense/core + immunityStrength×weapon×share_X/core`.
Injury sums each type's field and contact exposure over its own protection. Relatives share a
tint and tolerate one another; a lineage that drifts in tint is harmed by its own family, and two
families of different tint deny ground to each other with the same machinery. Nothing identifies
kin: the sensed toxin input is each type's concentration discounted by the cell's protection
against it relative to an undefended cell, so a producer barely senses its family's toxin and
senses a foreign type in full. The matrix binds both types, sharing its capacity evenly. With
one type the tint is silent and every earlier result stands. Contact exposure
has no field: it reaches only bodies within a 0.05-cell gap of a producer and cannot be sensed at a
distance. Its default rate is zero pending the [contest record](../rps-study.md); saves that
predate either term load with that term zero and keep their physics.

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
