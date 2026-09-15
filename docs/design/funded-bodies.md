# Funded bodies, genes and inherited learning

Capabilities depend on material actually installed. Genetic targets cannot grant free machinery.

<a id="bodies-construction-and-physical-genes"></a>

## Construction and physical genes

Each chromosome has fifteen bounded float32 investment loci plus fixed chemical alleles:

| Loci | Actual stock / allele | Reference newborn stock |
| --- | --- | ---: |
| 0 | Core | 1 |
| 1 | Motor | 0.08 |
| 2 | Storage | 0.08 |
| 3–6 | Four receptors, each with a chemical target coordinate | 0.01 each |
| 7–10 | Four transporters, each with target and import/export direction | 0.04 each |
| 11–14 | Four unary enzymes, each with target and integer product offset | 0.04 each |

A membrane coordinate controls chemical compatibility. Slot count is fixed; no variable-length
genome structure is implemented. Core target is reference core × exp(g0). Other stocks use
core target × reference ratio × max(0,1+gi). Zero investment is reachable and can mutate back.
All actual stocks occupy volume and require maintenance.

Growth shares paid assembly across deficits toward twice the newborn target. Birth splits actual
stock and inherits installed identity. Changed slot instructions retain their former function until
usable energy above the protected reserve pays refitting work on that stock. Refitting conserves
built material and dissipates work as heat; it grants neither new function nor new biomass for free.
See [installed machinery](chemistry/installed-machinery.md).

<a id="bodies-geometry-motion-and-uptake"></a>

## Geometry, motion and uptake

Volume = structure/bodyDensity + internal matter/inventoryDensity; radius = cbrt(3V/(4π)).
This reference sphere defines circular XY footprints, not a spatial depth axis.
Energy capacity follows actual core; chemical storage capacity follows actual storage.

Translational/rotational resistances are 6πηr and 8πηr³, divided by the square of local mobility.
Motor-limited speed therefore scales by mobility; Brownian rotation uses the same effective drag.
Damage reduces speed and turn capacity. There is no inertial coasting.

Each transporter requests affinity-weighted first-order transfer, limited by funded throughput.
Imports additionally face 4πDr conductance, local impedance, shared extracellular supply and
pre-transfer internal headroom. Import/export work requires usable energy. More machinery cannot
evade poor conductance or create material. The spherical conductance approximation over a 2D
field is an explicit modeling simplification.

<a id="bodies-accounting"></a>

## Accounting

Matter includes extracellular mixtures, unreleased source inventory, cellular mixtures and all
built stocks. Uniform washout is an external sink. Energy includes each chemical's potential,
generic body potential and usable energy, with all external supply, washout and dissipated work
recorded separately.

Unary reactions preserve scalar material and change identity. Downhill conversion captures
0.8×potential drop; uphill conversion charges potential rise/0.8. Both lose heat. Enzymes share
starting substrate and cannot consume each other's new products in the same phase. Overflow is heat.

Every internal species can become generic biomass. Assembly consumes matter proportionally,
pays 0.5 work per unit plus any uphill potential gap/0.8, and dissipates excess input potential.
There is no privileged biomass ingredient or free catabolic reserve. Generic body potential equals
the selected decomposition species' potential. Repair replaces material and pays additional work.
Death returns internal species unchanged, converts structure to the decomposition species and
dissipates remaining usable energy. Death-material totals are throughput, not another sink.
See [selected equations](chemistry/numerical-engine.md) and [closed-cycle tests](chemistry/numerical-results.md).

<a id="bodies-lifetimestatic-and-lifetimedynamic-information"></a>

## Lifetime-static and lifetime-dynamic information

| Information | During life | Birth transmission |
| --- | --- | --- |
| Behavioral weights and plasticity genes | Immutable inherited genotype | Chromosomes, assimilation, crossover and mutation |
| Investments and chemical alleles | Optional typed contact transfer creates a new genotype | Current chromosomes, crossover and mutation |
| Acquired recurrent traces | Paid bounded local updates | Retained delta enters offspring baseline weights |
| Hidden state, byte, contacts and receptor baseline | Individual experience | Private state resets; receptors initialize locally |
| Actual stocks, species mixtures, usable energy and injury | Physiology | Conservative split, retaining installed machinery identity |

<a id="bodies-inheritable-learning"></a>

## Inheritable learning

The parent acts with W + abs(alpha)×H. Birth copies receive
retention × abs(expressedAlpha)×H in the recurrent block, within weight bounds. Diploid homologs
receive the same acquired delta. Shared parent genotypes remain unchanged; newborn traces and
hidden state start at zero because the transmitted contribution is already in baseline weights.
A budding parent keeps its own experience without repeatedly assimilating into its own genome.

Default retention is one. This explicit artificial inheritance rule is not a claim about
bacterial genetic memory, and its adaptive usefulness in the new chemistry remains open.
Static learning and zero retained learning are distinct interventions.

<a id="bodies-policy-composition-and-mutation"></a>

## Policy composition and mutation

Haploid/diploid, clonal/selfing transmission, uniform/one-point crossover, Gaussian/uniform mutation,
fission/budding and static/plastic learning remain independent configured policies. Selfing requires
diploidy and uses two gametes from one parent; outcrossing and multi-parent ancestry remain deferred.

Diploid continuous alleles average; expressed offsets round and reflect in bounded chemical space.
Transport direction follows the first homolog, so homolog order is meaningful and sequence identity
must preserve it. Chemical coordinates mutate locally with reflection, enzyme offsets take bounded
integer steps, and transporter direction can flip. No slot count evolves.

Default behavioral mutation probability/scale is 0.0015/0.08; physical and chemical alleles use
0.1/0.12, with their declared discrete operators. Weights clamp to [-16,16], plasticity to [-1,1],
investments to [-3,3], coordinates to reflected [0,15] and offsets to [-15,15].
No score selects parents or filters mutants. Checkpoint v11 preserves complete allele and actual-state
distinctions; unavailable pruned genotype payloads remain labeled provenance.
