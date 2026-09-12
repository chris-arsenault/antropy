# Funded bodies, genes and inherited learning

Physical and behavioral genes are independently inherited. An organism's capacities come from
material it has actually built, not directly from gene values.

<a id="bodies-construction-and-physical-genes"></a>

## Construction and physical genes

Each chromosome has nine bounded float32 physical log targets in [-3,3].

| Locus | Target | Reference newborn stock |
| ---: | --- | ---: |
| 0 | Core; scales the whole blueprint | 1 |
| 1 | Motors relative to core | 0.08 |
| 2 | Food A processing relative to core | 0.08 |
| 3 | Storage relative to core | 0.08 |
| 4 | Food B processing relative to core | 0.05 |
| 5 | Defense relative to core | 0.025 |
| 6 | Toxin machinery relative to core | 0.02 |
| 7 | Matrix machinery relative to core | 0.02 |
| 8 | Light harvesting relative to core | `cycle.photoRatio`, 0.05 when the element cycle is on, else 0 |

Core target is reference core × exp(g0); other targets are core target × reference ratio × exp(gi).
Targets are independent, not a zero-sum allocation tuple. Every actual stock has construction and
maintenance costs. Growth shares available assembly in proportion to deficits toward twice the
newborn target. Mutation never replaces existing stock, grants resources or skips construction.

<a id="bodies-geometry-motion-and-uptake"></a>

## Geometry, motion and uptake

Volume = structure/bodyDensity + reserve/reserveDensity; radius = cbrt(3V/(4π)).
This spherical reference is used for circular XY footprints. Stored nutrient adds volume and drag.
It does not model intracellular pressure or a resolved third spatial dimension.

Translational/rotational resistance are 6πηr and 8πηr³. Installed motor power is motor stock ×
power density. Speed and turn-rate capacities follow sqrt(efficiency×power/resistance), multiplied
by 1−damage. Brownian rotation uses thermal energy / rotational resistance. There is no coasting.
Greater motor investment buys power while charging material, maintenance and body drag; it is not
automatically an advantage.

A/B uptake each combines transporter kinetics with the near-body conductance 4πDr as serial
limitations. Acquisition pathways (A and B processing and light harvesting) share finite
membrane: with `machineryCrowding` above zero, each pathway's effective stock is its stock times
its share of all three raised to that exponent, so an even split deploys half of each at
exponent one while a single pathway deploys all of it. Zero, the default, keeps additive returns. Damage lowers capacity; field supply and shared storage further limit acquisition.
More processing machinery cannot evade diffusion or create food. Using a spherical conductance
with a unit-depth raster is a coarse approximation, not a resolved physical diffusion model.

Storage capacity follows actual storage scaffold; usable-energy capacity follows core. Catabolism
consumes reserve at a finite core-dependent rate and efficiency. Construction protects configured
reserve/energy fractions; repair is paid before growth. Coefficients are simulation scales, not
empirical bacterial constants. See [calibration](../calibration.md).

<a id="bodies-accounting"></a>

## Accounting

Material balance includes environmental fields and unreleased deposit inventory, living structure,
stored nutrient, metabolic waste and true field-loss sinks. Energy balance includes usable energy
plus configured chemical energy in held material, and dissipated maintenance, motors, learning,
synthesis, secretion, repair, division, catabolic inefficiency and field-loss energy.

Each constructed material unit costs one reserve unit plus synthesis energy. Secretions likewise
consume reserve plus processing energy. Repair records replacement material as metabolic waste
and separately accounts its chemical energy and repair energy. Bound toxin remains held material.

Death transfers actual structure/reserve to detritus and dissipates residual usable energy.
Matrix decay and expired deposits also feed detritus; decomposition yields food B. These transfers
are not new external grants. Death-material totals are throughput, not a second mass sink.
Conservation must hold through starvation, damage, birth, secretion, decay and checkpoint restore.

<a id="bodies-lifetimestatic-and-lifetimedynamic-information"></a>

## Lifetime-static and lifetime-dynamic information

| Information | Changes during life | Birth transmission |
| --- | --- | --- |
| Input/output weights, biases and physical targets | No | Chromosomes, then crossover/mutation |
| Recurrent baseline weights | Registered genotype remains immutable | Baseline plus retained acquired delta, then crossover/mutation |
| Nine plasticity coefficients | No; rule is inherited | Chromosomes, subject to behavioral mutation |
| Acquired recurrent traces H | Paid bounded local updates | Converted into baseline-weight delta at configurable retention |
| Hidden activity, task byte, contacts, receptors | Individual experience and body state | Newborn hidden/byte/traces/contacts reset; receptors initialized locally |
| Actual body stocks, nutrient, energy, damage | Physiology | Resource split and inherited damage fraction |

<a id="bodies-inheritable-learning"></a>

## Inheritable learning

The parent acts with W + abs(alpha)×H. Before transmission, copies of its chromosomes receive
retention × abs(expressedAlpha)×H in the recurrent block, within weight bounds. For additive
diploids, the same delta enters both homologs. Parent/shared genotypes remain unchanged.

Default retention is one. Newborn traces and hidden state start at zero: the acquired contribution
already resides in baseline weights exactly once. A budding parent keeps its own baseline and
experience, without accumulating its delta again into its own genome after each birth.
This explicit Lamarckian mechanism is an artificial inheritance choice, not a claim about bacterial
genetic memory. Its adaptive usefulness remains unproven.

Static learning disables new trace effects/updates and assimilation. Retention zero prevents
transmission but leaves private plasticity active. Disabling random mutation alone does not freeze
the inherited sequence when retention remains enabled.

<a id="bodies-policy-composition-and-mutation"></a>

## Policy composition and mutation

| Config dimension | Implemented options | Default |
| --- | --- | --- |
| Ploidy | Haploid / diploid with mean allele expression | Haploid |
| Transmission | Clonal copies / selfing via two gametes from one diploid | Clonal |
| Crossover | Uniform / one-point, applied within behavioral and physical vectors | Uniform |
| Mutation distribution | Uniform / Gaussian perturbations | Gaussian |
| Physical reproduction | Fission / budding | Fission |
| Lifetime learning | Static / plastic | Plastic |
| Acquired retention | Fraction [0,1] | 1 |

These are independent static policy modules selected by persisted configuration. Selfing requires
diploidy. Selfing is not mating with another organism; seed/fertilize, outcrossing and multi-parent
ancestry are not implemented. Uniform crossover is configured but unused by default clonal
transmission.

At birth, behavioral loci are independently selected with probability 0.0015 and scale 0.08;
physical loci use 0.1 and scale 0.12. A haploid has 1,649 behavioral/plasticity loci and nine
physical loci: about 2.5 and 0.9 selected loci per child. Selection count is not guaranteed
sequence change because of bounds and numerical effects. Weights clamp to [-16,16], plasticity
coefficients to [-1,1], and physical targets to [-3,3].

No reproductive score selects parents or filters mutations. Immutable genotype records track
ancestry; exact inherited sequence counts are distinct from record counts and founder lineages.
Checkpoint v5 preserves genotype schema, actual bodies, private traces and transfer provenance.
