# Genetic physiology, biomass and inherited learning

Physical checkpoint v43 removes machinery construction and retirement. Birth genes directly
specify physiology; biomass and damage scale capacity, and actions consume usable work.
There are no separately accumulated motor, receptor, transporter or enzyme inventories.

<a id="bodies-construction-and-physical-genes"></a>

## Physiology and physical genes

Each chromosome has twenty-two bounded float32 investment records plus chemical alleles:

| Loci | Physiological component / allele | Reference newborn capacity |
| --- | --- | ---: |
| 0 | Core | 1 |
| 1 | Motor | 0.08 |
| 2 | Storage | 0.08 |
| 3–6 | Four receptors, each with a chemical target coordinate | 0.01 each |
| 7–10 | Four transporters, each with a target; neural effort chooses direction | 0.04 each |
| 11–14 | Four unary enzymes, each with recognition target, independent reflection center and orientation mixture | 0.04 each |
| 15 | Photoreceptor, sampling local mean illumination | 0.01 |
| 16–19 | Additional enzyme program records 4–7 | 0.04 each when present |
| 20 | Cover builder, paid transfer to/from overhead film | 0.04 |
| 21 | Light emitter, paid optical power | 0.04 |

A membrane coordinate controls chemical compatibility, protection and passive solute retention.
The existing susceptibility law scales bidirectional diffusion; unmatched products escape
more readily, while the same pathway can lose useful material. Paid pumps remain independently
controlled. Free and bound chemistry provides the private light-reaction environment, and
genetic enzyme capacities bound accepted work; no photosynthesis flag grants energy.
One to eight enzyme programs occupy a bounded genetic arena. Four programs start present.
Duplication splits the genetic component weight, copies activity controls and splits sensory
contributions. Deletion immediately removes the program from the daughter's physiology.
Reference core is `birthMass × exp(g0)`; other reference components are
`referenceCore × referenceRatio × max(0,1+gi)`. Zero traits remain reachable and can mutate back.

For reference vector b, reference mass B=sum(b), and current biomass M, every capacity is
`body_i=M*b_i/B`. This one projection governs motors, sensing, storage, enzymes and optics.
Components share the finite body; larger biomass increases area, drag and basal metabolism.
Basal work rate is `(1+damage)*(maintenance*M+controllerCost)`. There are no component-specific
ownership charges. The vector is a derived runtime cache; only biomass chemistry and genetics
are persisted. Changing genetic proportions cannot create matter or usable energy.

[Photoreception](../photoreception.md) uses the same funded gain and adaptation law as chemical
receptors, with unit reference illumination. It adds no harvesting or automatic steering.

Growth automatically increases biomass toward `2*B`. Its requested increment is the minimum
of the biomass deficit, `dt*growthRate*M*(1-damage)`, and free inventory above its protected
reserve. Available work above the proposed body's action reserve bounds the paid increment.
Growth transfers that amount of free mixture to biomass and pays `growthEnergy` per unit;
all capacities increase proportionally. There are no neural construction or retirement outputs.
Biomass at `2*B` and actual daughter material/work reserves permit division. Birth halves
biomass, free material and usable energy. Each daughter immediately expresses its own mutated
physiology at that inherited mass. Mutation can remove access to parental food. Activity and
condition remain dynamic; there is no refitting or living-cell gene transfer.
See [birth-fixed capabilities](chemistry/installed-machinery.md).

<a id="bodies-geometry-motion-and-uptake"></a>

## Geometry, motion and uptake

Area = structure/bodyDensity + internal matter/inventoryDensity; radius = sqrt(area/π).
The API's `volume` name denotes this occupied area in the periodic XY plane.
Energy capacity follows actual core; chemical storage capacity follows actual storage.

Artificial drag is 8ηr. Funded motor power, damage, efficiency and local impedance mobility
bound swimming and turning. Shared chemical/body profiles also produce bounded passive drift,
without crediting usable work. There is no Brownian temperature or inertial coasting.
Motor work uses `power × (swim² + 0.25 × turn²)` and velocity scales with the square root
of available-work funding. At fixed biomass, more motor capacity occupies a larger body share;
it carries no separate ownership tax or operating penalty at the same actual speed and radius.

Each transporter divides finite funded throughput among its recognized local mixture.
Diffusion/drift and the finite body footprint determine delivery. Imports face shared
extracellular donors and pre-transfer internal headroom; both directions require usable work.
There is no separate spherical conductance ceiling. The [composed runtime](chemistry/composed-runtime.md)
specifies occupancy, shared demand and the simultaneous commitment.

<a id="bodies-accounting"></a>

## Accounting

Matter includes extracellular mixtures, unreleased source inventory, free cellular mixtures and
biomass. Ordinary fractional washout is an external sink. Energy includes each chemical's potential
in free and bound mixtures and usable energy, with all external supply, washout and dissipated work
recorded separately.

Unary reactions preserve scalar material and change identity. The shared local external-work term augments the potential difference before applying
0.8 conversion efficiency: a positive difference funds usable energy; a deficit charges it. A .05 catalytic price applies
per unit that changes identity and vanishes continuously for an idle offset. Enzymes share
starting substrate and cannot consume each other's new products in the same phase. Overflow is heat.

Every internal species can fund generic biomass. Assembly transfers matter proportionally into
the bound mixture and pays 0.5 work per unit. There is no privileged biomass ingredient or free
catabolic reserve. Bound material retains chemical identity and reference value. Repair exchanges
equal amounts of the frozen free and bound mixtures and pays work proportional to the repaired
damage fraction times total biomass. Bound mass equals the sum of derived body capacities.
Death returns both mixtures unchanged and dissipates remaining usable energy. Death-material
totals are throughput, not another sink. See [bound-material rules and checks](../bound-material.md).

The [v19 correction](../physical-coupling-correction.md) specifies capacity-based growth and
daughter reserves. Division retains enough work for both actual half-bodies' initial upkeep
and learning, and charges work per parent core. This removes absolute starter-size reserve
requirements while retaining ordinary growth, reproduction and basal metabolism costs.

<a id="bodies-lifetimestatic-and-lifetimedynamic-information"></a>

## Lifetime-static and lifetime-dynamic information

| Information | During life | Birth transmission |
| --- | --- | --- |
| Behavioral weights and plasticity genes | Immutable inherited genotype | Chromosomes, assimilation, crossover and mutation |
| Investments and chemical alleles | Immutable birth genotype | Current chromosomes, crossover and mutation |
| Acquired recurrent traces | Paid bounded local updates | Retained delta enters offspring baseline weights |
| Hidden state, byte, contacts and receptor baseline | Individual experience | Private state resets; receptors initialize locally |
| Biomass, free species mixtures, usable energy and injury | Growth and condition | Conservative split; daughter physiology is derived from its birth genotype |

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

Haploid/diploid, clonal/selfing transmission, uniform/one-point crossover,
fission/budding and static/plastic learning remain independent configured policies. Selfing requires
diploidy and uses two gametes from one parent; outcrossing and multi-parent ancestry remain deferred.

Diploid linear alleles average, including enzyme reflection centers. Angles use the circular mean;
antipodal alleles use a declared zero-angle convention because no unique mean exists.
Chemical coordinates and reflection centers mutate with reflection, while angles wrap periodically;
parameters compile mixtures of exact bounded chemical permutations with at most eight
product species per substrate. These mixtures are not group elements; component actions
have exact composition and inverses. Neural effort can reverse any transporter. Enzyme program
count mutates with the same scalar heavy tail in program units, stochastically rounded before
reflection into 1–8. An inactive genetic record is available for duplication immediately.

All mutations use the same heavy-tail law: for signed uniform u, the proposed scalar
step is b×u/(1−|u|), where b=0.67448975×scale. Its absolute median is b and
P(|step|>d)=b/(b+d). Stable period reduction handles extreme draws before reflection.
Default behavioral probability/scale is0.0015/0.08; physical probability/scale is0.1/0.12.
Chemical coordinates and reflection centers multiply scale by the existing specificity radius R.
Scalar neural and twenty-two investment loci retain independent opportunities.
Each of25 chemical coordinate pairs has Binomial(2,p) vector events: each event uses the same
absolute-step law and a uniform direction. Four inward fractions also mutate on [0,1].
The bounded arena includes dormant alleles, which do not confer a physical function.
Eight enzyme-angle loci use
physicalMutationScale radians, making the corresponding radius-R arc length use the same chemical
step units. Count mutation adds one physical-rate opportunity per birth. A vector event changes
both axes; changed genotype counts alone do not establish expressed phenotypic change.
The [symmetry measurements](../plans/archive/MATHEMATICAL-SYMMETRY-PLAN.md#m4-execution) check event
rates and realized magnitudes separately. Reflection respects the finite square's boundary;
arbitrary-angle covariance applies to interior proposals, not the square itself.

Mutation reflects weights within [-16,16], plasticity within [-1,1], investments within [-3,3],
chemical coordinates and reflection centers within [0,15]; angles wrap into [-pi,pi).
No score selects parents or filters mutants. Checkpoint v43 preserves alleles and biomass and
reconstructs derived physiology; earlier checkpoints are rejected without migration.
Unavailable pruned genotype payloads remain labeled provenance.
