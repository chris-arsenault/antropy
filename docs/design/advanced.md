# Evolutionary and advanced systems

This document preserves the program beyond the accepted living-colony baseline. The
[colony-knowledge decision](colony-knowledge.md) delivered the LGP controller and variation hooks.
The [2,000-worker milestone](colony-scale.md) precedes inheritance and in-world selection.
Genetics is deferred; explicit navigation permissions supersede older restrictions below.

<a id="advanced-evolution"></a>

## Continuous evolution

The intended simulation has no explicit fitness function and no synchronized generation
boundary. Creatures inherit controllers and physical traits at birth; survival, resource work,
mating, brood investment, and descendant contribution create selection inside the world.

<a id="advanced-signal"></a>

## Selection signal and population health

Selection needs enough births, deaths, parent-offspring variation, and environmental repeatability
to distinguish inherited effect from noise. Monitor selection-event rate, generation-equivalent
time, heritability, effective population, mutation scale, diversity, founder-line representation,
and resource-conservation residuals from the first evolving run.

<a id="advanced-instrument-contract"></a>

## Selection instrument contract

Ancestry and merit ledgers observe parentage, lifespan, physical work, external resource delivery,
brood contribution, and descendants. They never choose parents, grant resources, alter actions, or
feed a score into the population. Unavailable estimates remain unavailable with sample counts
rather than becoming zero.

<a id="advanced-genetic-floor"></a>

## Genetic diversity and collapse resistance

Mutation-scale collapse, convention-misaligned recombination, low effective population, one-line
takeover, and founder-distance collapse are explicit failure modes. Countermeasures include bounded
mutation loci, representation-aware recombination, mate portfolios, and ecological recovery
floors—but only after instruments identify the failure.

The user's intended first buffer is a colony near 2,000 workers, allowing later variation within
a functioning population. Establish that demographic capacity before genetic experiments. Worker
count is not itself effective reproductive population size; the later inheritance design must
explain how variants reach descendants. Do not replace the scale prerequisite with another search
for one unusually mutation-tolerant controller.

<a id="advanced-prelock"></a>

## Avoiding evolutionary pre-lock

Initialization must occupy a broad viable region and leave useful gradients for change. Avoid a
controller that survives only at peak efficiency, hard-coded castes, fixed behavioral modules,
free capabilities, or one environmental optimum. Validate across resource levels, worlds, and
perturbation radii.

<a id="advanced-plasticity"></a>

## Within-lifetime learning

Recurrent state, synaptic plasticity, linear-GP writable registers, learned routes, and inherited
learning rates are possible later mechanisms. Compare naive and experienced behavior before adding
plasticity, charge for memory and computation, and prevent acquired state from being mistaken for
inherited genotype.

<a id="advanced-development"></a>

## Development, roles, and castes

Age, size, nutrition, colony state, and local conditions may become ordinary inputs to evolved
reaction norms. Role labels or caste-specific controller selection are rejected; differentiated
work must emerge from shared heritable mechanisms and physical tradeoffs.

<a id="advanced-regimes"></a>

## Colonies, regimes, and ecological pressure

Colony founding, queen loss, multiple colonies, seasons, nest decay, weather, predation, disease,
resource oscillation, and activity-scaled threats can prevent permanent ratchets and expose
recovery strategies. Each regime must serve a named evolutionary question and follow a stable
single-colony control.

<a id="advanced-controller"></a>

## Alternative controller substrate

Linear genetic programming is the intended first evolvable representation because mutation,
recombination, execution cost, and program structure are direct objects of evolution. Compare it
with recurrent networks only through the same sensors, actions, worlds, initialization budget, and
viability-region measurements. Do not normalize away their different compute or mutation
semantics.

<a id="advanced-order"></a>

## Linear implementation order

| ID | Status | Finish |
| --- | --- | --- |
| ADV-01 | Delivered | Linear GP seed, bounded VM, mutation, recombination and genome distance; no live inheritance |
| ADV-02 | Deferred until SCALE-06 and genetics decision | Establish inheritance, ancestry and reproductive diversity instruments |
| ADV-03 | Deferred until inheritance | Admit standing variation within the established large-colony capacity |
| ADV-04 | Deferred until reproductive lineages | Demonstrate measurable in-world selection against fixed and neutral controls |
| ADV-05 | Backlog | Fund daughter-queen founding and multiple lineages before claiming reproductive selection; mating may follow |
| ADV-06 | Backlog | Compare recurrence, plasticity, development, roles, and ecological regimes |
| ADV-07 | Backlog | Evolve construction behavior using the digging mechanism scheduled after settling review |

<a id="advanced-obe"></a>

## OBE and rejected directions

- Retired genomes, baked RNNs, ancestry schemas, lifecycle implementations, and automatic survivor
  continuation are not partially delivered 2D features.
- Offline genetic algorithms may derive a starting distribution in the harness, but they may not
  masquerade as continuous in-world evolution.
- NEAT-style topology, plasticity, castes, seasons, and microclimate are not defaults merely because
  the source documents discuss them.

<a id="advanced-sources"></a>

## Source provenance

The original specification and Appendices A, B, E, F, and G retain detailed hypotheses about
selection throughput, genetic structure, mutation, recombination, plasticity, development,
resilience, and ecological regimes. [Source coverage](source-coverage.md) keeps those ideas mapped
without treating their old implementation status as current.
