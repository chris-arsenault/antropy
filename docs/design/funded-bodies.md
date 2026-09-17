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
| 7–10 | Four transporters, each with a target; neural effort chooses direction | 0.04 each |
| 11–14 | Four unary enzymes, each with target and continuous product offset | 0.04 each |

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

Area = structure/bodyDensity + internal matter/inventoryDensity; radius = sqrt(area/π).
The API's `volume` name denotes this occupied area in the periodic XY plane.
Energy capacity follows actual core; chemical storage capacity follows actual storage.

Artificial drag is 8ηr. Funded motor power, damage, efficiency and local impedance mobility
bound swimming and turning. Shared chemical/body profiles also produce bounded passive drift,
without crediting usable work. There is no Brownian temperature or inertial coasting.
Motor work uses `power × (swim² + 0.25 × turn²)` and velocity scales with the square root
of available-work funding. Extra motor capacity costs construction, upkeep and occupied area;
it does not add an operating penalty at the same actual speed and radius.

Each transporter divides finite funded throughput among its recognized local mixture.
Diffusion/drift and the finite body footprint determine delivery. Imports face shared
extracellular donors and pre-transfer internal headroom; both directions require usable work.
There is no separate spherical conductance ceiling. The [composed runtime](chemistry/composed-runtime.md)
specifies occupancy, shared demand and the simultaneous commitment.

<a id="bodies-accounting"></a>

## Accounting

Matter includes extracellular mixtures, unreleased source inventory, cellular mixtures and all
built stocks. Uniform washout is an external sink. Energy includes each chemical's potential,
generic body potential and usable energy, with all external supply, washout and dissipated work
recorded separately.

Unary reactions preserve scalar material and change identity. Downhill conversion captures
0.8×potential drop; uphill conversion charges potential rise/0.8. A .05 catalytic price applies
per unit that changes identity and vanishes continuously for an idle offset. Enzymes share
starting substrate and cannot consume each other's new products in the same phase. Overflow is heat.

Every internal species can fund generic biomass. Assembly transfers matter proportionally into
the bound mixture and pays 0.5 work per unit. There is no privileged biomass ingredient or free
catabolic reserve. Bound material retains chemical identity and reference value. Repair exchanges
equal amounts of the frozen free and bound mixtures and pays work proportional to the repaired
damage fraction times total installed body mass. Bound mass always equals total funded stock.
Death returns both mixtures unchanged and dissipates remaining usable energy. Death-material
totals are throughput, not another sink. See [bound-material rules and checks](../bound-material.md).

The [v19 correction](../physical-coupling-correction.md) specifies capacity-based growth and
daughter reserves. Division retains enough work for both actual half-bodies' initial upkeep
and learning, and charges work per parent core. This removes absolute starter-size reserve
requirements while retaining ordinary material, construction and maintenance costs.

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

Diploid continuous alleles average, including enzyme offsets. Chemical coordinates and offsets
mutate locally with reflection; reflected product positions distribute material bilinearly
among at most four discrete species. Neural effort can reverse any transporter. No slot count evolves.

Default behavioral mutation probability/scale is 0.0015/0.08; physical and chemical alleles use
0.1/0.12. Weights clamp to [-16,16], plasticity to [-1,1],
investments to [-3,3], coordinates to reflected [0,15] and offsets to [-15,15].
No score selects parents or filters mutants. Checkpoint v20 preserves complete allele and actual-state
distinctions; unavailable pruned genotype payloads remain labeled provenance.
