# Strategic microbial ecology

This document owns the physical opportunities in a world intended for days/weeks observation.
Use hypotheses and small proof points to choose a coherent set of pressures. An implemented
mechanism, an expressed behavior, a conditional benefit and an evolved ecological role are
different claims. No particular community or number of roles is prescribed.

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
different costs across opportunities. The return on investment must be assessed in the relevant context rather than inferred from body cost alone.

The default uses [food zones](bacteria.md#world-fields-and-finite-deposits): a pure-A left half
and a pure-B right half with equal numbers of deposit slots, not identical instantaneous supply.
The hypothesis is that local resource differences and slow dispersal let alternative processing
investments repay their cost. Constructed comparisons and the later regional inherited diet
differences are proof points; they do not prescribe two permanent species. See the corrected
[zone](../zones-study.md) and [evolution](../evolve-study.md) records.

The selectable [food-epoch schedule](../food-epochs-study.md) instead changes incoming composition
between 80% A and 20% A every 50,000 ticks, with total supply settings unchanged. Existing food
and balanced recycled A/B buffer transitions. When neither epochs nor zones is configured, deposit
compositions are independently mixed. The older epoch comparison found inherited benefits with an
environment-dependent component; its exact outcomes belong to its earlier physics.

For a configuration review, use these opportunity hypotheses rather than an outcome scorecard:

| Opportunity | Cost or competing explanation | Useful proof point |
| --- | --- | --- |
| Local resource differences | Dispersal or mixed recycling can erase local advantage | Local readings, residence and paid uptake differ by resource context |
| Movement toward brief food | Motor expenditure may exceed the captured food's value | Short food-access contrasts connect movement to net funded growth |
| Toxin/defense/repair | Immunity or shared matrix may shield everyone; attack may not pay | Matched exposure and expenditure with and without the relevant effect |
| Light versus organic food | Combined pathways may be cheap; light can saturate locally | Fixation, respiration and a paid allocation tradeoff in the selected constants |
| Sharing or gene transfer | Transfers may homogenize differences or benefit noncontributors | Actual recipient benefit and donor cost, with identity and trait changes distinguished |
| Disturbed space | No useful cue or advantage to arriving earlier | Local recolonization access and expenses under paired conditions |
| Neutral chemical information | Weak output, no useful response, or costs without return | A sensed cue changes ordinary RNN behavior and repays its cost |

These are examples of the link a test should establish, not seven mandatory assays. Reuse existing
evidence when its conditions apply. None requires a long run to produce a named ecological role.

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

Controllers receive no new gas or light inputs: harvesting is physiology, while existing local
chemistry/body inputs remain available. Light-focused and organic-food-focused bodies are possible
diagnostic designs, not established evolved guilds or mandatory roles. The [cycle study](../cycle-study.md)
records physical effects and the limits of its older cost settings. With the cycle off no harvesting
stock is built; this does not revalidate results from other changed versions.

<a id="ecology-predation"></a>

## Predation

Optional `preyYield` (default 0) redirects some material from damage deaths to nearby cells. When a cell dies of damage,
the fraction `preyYield` of its material (structure and reserve) enters the reserves of the
toxin-bearing neighbours touching it, split by their toxin machinery per core and capped by each
one's storage; the remainder, and every starvation death, becomes detritus as before. Nothing is
created: the ledger records the eaten material as `preyed`, and the corpse's chemical energy
follows the material. The code does not distinguish contact injury from field injury as the cause of a damage death,
or identify the killer. Living toxin-equipped neighbors can feed without having delivered the
fatal injury. No new stock, locus or input exists. Whether this repays aggression, immunity or
opportunistic feeding is a hypothesis about yield, costs and encounters, not demonstrated hunting.

<a id="ecology-disturbance"></a>

## Abiotic disturbance

Optional `config.disturbance` stirs and thins random discs of the world. Events arrive
memorylessly at `meanInterval` model seconds from the environment stream; each strikes a random
centre with `radius`, moves every dissolved field inside (foods, signal, both toxins, detritus,
carbon, oxygen; not matrix or what it binds) toward its disc mean by `mixing`, and kills each
cell inside with probability `mortality`, its material going to detritus as any death does and
its cause recorded as `disturbance`. Nothing enters or leaves the world. Disturbance opens ground
and erases local chemistry, which could change the value of reaching empty space relative to holding occupied space.
That tradeoff depends on local cues, costs, interval and radius and remains unestablished.

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

## Reserve sharing

Optional `sharingRate` (default 0) makes touching cells exchange stored nutrient. Each touching
pair, each tick, moves reserve from the richer to the poorer by the fraction
`1 − exp(−sharingRate × dt)` of half their difference, capped by the receiver's storage, and the
ledger records it as `shared`. Nothing is created. A gatherer feeds whoever touches it, so the
mechanism could change the return on gathering and contact. Matrix adds drag but does not attach
cells. Sharing adds no adhesion rule or heritable donation choice. Division of labor and exploitation
are hypotheses, not consequences established by the [sharing study](../sharing-study.md).

<a id="ecology-signal"></a>

## Neutral chemical signal

The neutral chemical (`secretionRate`, default 0) is a costed secretion cells sense through four
inputs (level, change, and two gradients) and that has no physical effect. With the rate above
zero, local concentration depends on nearby secretion, transport and decay. The controller can
condition effort on it, but concentration alone is not a cell count or demonstrated quorum behavior. The [signal study](../signal-study.md) turns
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
Injury sums each type's field and contact exposure over its own protection. Shared tint can
produce chemical compatibility, but no family identity, guaranteed tolerance or cooperation rule
exists. Defense also protects against other types. The sensed toxin is discounted by the cell's
protection, and matrix binds both types with shared capacity. With one type the tint is silent;
historical ecological results retain their original conditions. Contact exposure
has no field: it reaches only bodies within a 0.05-cell gap of a producer and cannot be sensed at a
distance. Its default rate is zero pending the [contest record](../rps-study.md); older checkpoint versions are rejected under the current v7 contract.

Damage reduces uptake and motion by 1−damage and raises maintenance by 1+damage; unit damage kills.
Installed defense reduces exposure damage but consumes material and maintenance whether needed or not.
Repair is selected by the RNN, capped by effort, reserve and energy, and competes with growth.
Damage fraction survives division. No newborn healing grant exists.

Current injury/maximum-repair rates are 0.5/0.008 per model second. The previous 0.05/0.08 pair
let the founder erase most injury while it was visually negligible. This correction changes
timescales, not founder weights, food supply or sensing. At concentration 0.0019, unprotected field injury is approximately 0.0353/s; current founder
defense and immunity give divisor 23, or about 0.00153/s before repair. This is a rate comparison
under one-type chemistry, not a current exposure measurement. These are authored model rates.

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
| Neutral signaling | `secretionRate: 0` | Useful cue/response benefit is unestablished. |
| Element cycle and membrane crowding | no `cycle`; `machineryCrowding: 0` | Experimental physiology and cost tradeoffs; simplified settings need review for the observation world. |
| Typed toxin | `toxinTypes: 1` | Chemical compatibility is experimental; distinct family roles were not established. |
| Contact injury and predation | `contactDamageRate: 0`, `preyYield: 0` | Feeding/damage opportunities exist in fixtures; integrated observation settings remain to be reviewed. |
| Disturbance, transfer and sharing | no `disturbance`; `transferRate: 0`, `sharingRate: 0` | Physical effects exist; their inclusion needs a coherent ecological purpose and settings. |

Experimental `matrixMode: "solid"` enables swept body-footprint entry checks, contact displacement
checks and blocked local offspring placement. Builders have no exemption; embedded cells may move
toward lower exposure. This mechanism has mechanics tests, not a live wall-building demonstration.

A positive neutral secretion rate restores a separate paid diffusing/decaying chemical. The RNN
sensor/action interface remains, and the display toggle remains available. There is no automatic
following or imposed meaning. Default empty signal transport is skipped.
Toxin and matrix remain active chemical actions even with neutral signal disabled.

<a id="ecology-consequences-and-boundaries"></a>

## Consequences and boundaries

[Recorded September 10 measurements](bacteria-results.md#evidence-corrected-default-ecology) show
injury, reduced reproduction and matrix protection in that earlier default. Later viscosity,
immunity and supply changes prevent treating those exact timings or death counts as current.
The mechanisms remain implemented; current observations should be interpreted under their own settings.

Those results do not demonstrate evolved offense/defense, stable strategy coexistence, strategic
construction, a slow-cell niche or useful inherited learning. Conditional advantages of hand-built
diagnostic variants belong to their recorded test conditions. Do not promote those variants into
the live default or imply that evolution found them.

Further mechanisms such as dormancy, adhesion, new life stages or outcrossing require a reviewed
ecological purpose. Activating existing experimental mechanisms also needs a coherent configuration
decision. It does not require a certified evolved community before user observation.
