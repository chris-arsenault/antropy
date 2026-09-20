# Current design and work order

Updated September 20, 2026. Physical v33 adds cellular organization and exchange to material-supported habitats, composed local
illumination, funded photoreception, and bounded phenotype/chemical-flow observation.
Before this feature, the user reported dense, long-lived colonies and a promising visual result.
The [83,980-tick checkpoint review](../material-habitats-review.md) records differentiated
chemistry and continued turnover. The [session slowdown investigation](../session-runtime-review.md)
records the reload-related performance report and its unresolved attribution.

[Composed runtime laws](chemistry/composed-runtime.md) own the current equations.
[Decisions and evidence](decisions-and-evidence.md) explain the selected direction and failures.
[Execution plans](../plans/README.md) preserve version-specific work without becoming a second
current specification. The pre-cleanup [work order](../sources/history/2026-09-20-design-work-order.md)
preserves the implementation chronology.

<a id="design-goal-and-present-evidence"></a>

## Goal and present evidence

Build a world where a diverse ecosystem and evolutionary adaptation are likely to occur, ready
for the user to run for days or weeks and watch. Organisms should encounter changing opportunities
through food, space, neighbors and their own effects on the environment. Different inherited choices
should sometimes repay their costs. No species list, strategy count or final community is prescribed.

Development uses hypotheses and small proof points to make those opportunities credible. It does
not need to evolve and certify a finished ecosystem before handoff. Long observation is the intended
use of the simulation, not a harness task to exhaust in advance. Broad diversity is an aspiration
supported by world design, not an outcome that can be guaranteed or inferred from colored groups.

The runtime supports paid bodies, local RNN decisions, inheritance, mutation, learning, births
and deaths on a nonuniform 256-species chemical manifold. External work can fund uphill
transformations, while each process pays its own costs. Shared material fields influence motion,
retention, source renewal and extracellular chemistry. Local optical sensing is paid machinery.

The v31 [200k review](../integrated-200k-review.md) found differentiated bodies and inherited
light responses, but also feedstock dependence and source dispersion. V32 addresses those
limitations; its public-food acquisition probe remains negative. The user's newer checkpoint
shows broader uptake and dense colonies, with continued feedstock dependence in net material
flow. These are distinct results, not certification of a closed ecosystem.

<a id="design-design-owners"></a>

## Design owners

| Document | Owns |
| --- | --- |
| [Computational foundation](chemistry/computational-foundation.md) | Governing mathematical design, composed manifold operations and cost-first selection |
| [Transformation algebra white paper](chemistry/transformation-algebra.md) | Group-theoretic direction, finite-state constraints and evidence contract; selected v23 implementation tracked in the canonical plan |
| [Digital chemistry](chemistry/README.md) | Chemical identity, funded machinery, implementation records and replacement decisions |
| [Cellular organization](cellular-organization-and-exchange.md) | Retained-mixture response, regulated machinery, variable enzyme programs and shared interfaces; [delivery evidence](../cellular-organization-results.md) |
| [Sparse spatial ecology](spatial-ecology.md) | Implemented world hypothesis, movement retuning, spatial populations, multiscale observation and handoff |
| [World and lifecycle](bacteria.md) | Substrate, resources, turn order and persistence |
| [Controller](controller.md) | Local sensors/actions, recurrence, private byte and controller boundary |
| [Bodies and inheritance](funded-bodies.md) | Physical costs, genes and lifetime/inherited learning |
| [Strategic ecology](strategic-ecology.md) | Mechanisms, ecological hypotheses and active/disabled settings |
| [Composed runtime](chemistry/composed-runtime.md) | Current shared operators, illumination, material habitat laws and execution bounds |
| [Material habitats](../material-habitats.md) | Two-scale binding, retention, renewal, public chemistry and bounded evidence |
| [Experimentation](experimentation.md) | Small proof points, diagnostic comparisons and limits of inference |
| [Population observation](population-observation.md) | Families, traits, grouping conventions and retained history |
| [Evidence](bacteria-results.md) | Recorded findings and version-specific limits |
| [Display](bacterial-display.md) | Run defaults, visible meanings and observation limits |

[Principles](../principles.md) govern decisions. [Architecture](../architecture.md) maps owners;
[calibration](../calibration.md) records scales; [backlog](../backlog.md) owns unresolved work.
The [plan closeout](plan-closeout.md) records OBE dispositions and migrated requirements from
earlier plans. Current runtime documents describe implemented behavior; the spatial design records
the accepted direction and prior calibration. Chemistry changes require a new motion review.

<a id="design-current-default-and-disabled-scope"></a>

## Current default and disabled scope

Run starts seed 27, paused at tick zero, with 48 cells of four mutable founder genotypes in two
separated resource neighborhoods of a 320 × 240 periodic world. Forty-eight mobile renewing reservoirs
have unequal richness, local mixtures and variable release. Chemistry seed101 and source IDs0/136
support the authored circuit0→128→136→8→0, with six cells of each role per colony.
Finite initial8/128 priming starts delivery; later processing follows ordinary laws. Free and
bound material retain actual identities through repair and death. No chemical has a privileged
waste role. Haploid clonal fission, mutation and paid inheritable plasticity are active.

The controller has 56 inputs, 24 recurrent units and 38 outputs. Twenty bounded stock records support
four chemical receptors, four transporters and up to eight enzyme programs plus core, motor, storage and
[photoreception](../photoreception.md). The light sensor uses the same embodied sampling and
funded response law; no automatic light-seeking behavior is supplied. Physical
checkpoints use v33; the outer observation package remains v11.
The [material-habitat changes](../material-habitats.md) add shared two-scale attraction,
reversible retention, locally evolving source renewal and multiscale public chemistry.
IDs0/136 are initial landscape choices; ordinary renewal no longer reinstates them.
Generic stress, compatibility, repair and impedance replace named toxin/defense/
matrix pathways. Source zones and epochs remain selectable. Disturbance and typed machinery
transfer are experimental options, disabled by default. Direct cell adhesion remains deferred.
Smooth geographic weathering and chemical shelter are active. The weathering display and
selected-cell exposure readings describe physical conditions without adding controller inputs.

The irregular resource arrangement is a revisable hypothesis. No region count or evolved community
is an acceptance criterion. Do not seed a diagnostic or evolved winner into the default.

The [resource-economy model](chemistry/resource-economy.md) governs current supply calibration:
delivery-aware source selection, mean renewal gap 1,200 model seconds and washout 0.001/second.
It calculates budgets and a spatial reference without advancing organisms. Short checks show
repeated local reproduction and both ordinary starting colonies reproducing; a weak isolated
site still fails. This prepares an evolutionary opportunity, not an evolved community.

<a id="design-next-decisions"></a>

## Next decisions

Keep current simulation semantics while investigating accumulated-session costs. The observed
8→40 ticks/s reload improvement is not yet explained; forced JavaScript collection did not
reproduce it. The retention repair expires older saves within the existing byte budget rather
than pausing merely because the preferred save counts do not fit.

Future work belongs in the [backlog](../backlog.md): meaningful long-term specialization,
less dependence on original feedstock, useful public-food returns, operating headroom, terrain
and climate, and conditional cell interaction research. Multicore stays paused. Source geometry
is a revisable initial condition, not a requirement for predetermined wells or colony counts.
Do not turn these open questions into a mandatory verification campaign.

The [joint cellular organization and exchange design](cellular-organization-and-exchange.md)
connects retained composition, funded local control, evolvable enzyme repertoires and contested
material access. Cells retain one mixture. Its [execution plan](../CELLULAR-ORGANIZATION-PLAN.md)
records integration and [bounded evidence](../cellular-organization-results.md). These mechanisms provide possible paths to cooperative larger
organizations and antagonism; they do not assign roles or establish evolved meta-organisms.

The math, binding, illumination and observation implementation plans are reconciled in the
[plan disposition](../plans/README.md). Older version-specific human gates are preserved as
superseded where they were never accepted; later positive reviews do not retroactively pass them.
Current operational and ecological limits remain explicit in [continuing observation](../continuing-observation.md).

<a id="design-roadmap"></a>

## Earlier roadmap: findings retained, outcome gates retired

The September 11 roadmap used prescribed coexistence gates. That work order is superseded by the
purpose above; its studies remain evidence for particular configurations:

| Work | Retained finding | Limit |
| --- | --- | --- |
| Kernel and stats performance | Faster headless execution and less frequent UI statistics | Current days/weeks browser readiness is unmeasured |
| Toxin immunity/contact injury | Damage and protection can change payoffs in constructed contests | No required producer/resistant/sensitive cycle; persistence was overstated |
| A/B regions | Constructed diet choices respond differently to food layout | An authored regional opportunity, not a target species count |
| Thick medium and evolution | Slower dispersal supports residency; recorded diet differences correlate with region | Several world parameters changed together; no isolated attribution of the whole result to viscosity |
| Trait grouping and contests | Saved genotypes can be compared and distributions viewed | Chosen k-means groups are not evidence of distinct strategies |
| Behavioral mutation experiment | More variation alone did not produce the proposed split in the older world | No instruction to continue tuning until it does |

See the [toxin](../rps-study.md), [zone](../zones-study.md) and [evolution](../evolve-study.md)
records. The former 20-generation invasion and 200-generation persistence requirements were not
demonstrated by the reported assays. Retiring them as development gates does not turn those assays
into stronger evidence. No outstanding experiment is required merely to complete the old roadmap.

<a id="design-roadmap-2"></a>

## Earlier roadmap two: opportunities and unresolved questions

The seven mechanisms are candidates for world design, not seven mandatory stages or a scorecard.
Their saved results are corrected in the [audit](../analysis-correction.md). Mixed deposits have
spatially varying positions and compositions; the experiments were not spatially uniform worlds.

| Mechanism | Opportunity to consider | What the studies leave open |
| --- | --- | --- |
| [Element cycle](../cycle-study.md) | Light versus organic food acquisition; organisms change local gases | Most evolve mixotrophy; the reported harvester/consumer coexistence is unsupported and used since-removed costs |
| [Typed toxin](../family-study.md) | Chemical compatibility changes the costs of neighboring producers | Tint did not split into separate modes; kin cooperation was not established |
| [Predation](../predation-study.md) | Material from damaged neighbors can repay toxin investment | Two endpoint pairs gained share both ways; active hunting and persistent prey roles were not shown |
| [Disturbance](../disturbance-study.md) | Open space could favor recolonization in some circumstances | Mortality occurs; a colonizer/holder tradeoff was not shown |
| [Gene transfer](../transfer-study.md) | Physical traits can spread through contact as well as descent | Ancestry-group counts cannot show persistence of unchanged strategies; no pair gained share both ways |
| [Reserve sharing](../sharing-study.md) | Transfers could change the value of gathering and contact | Food moves, but no adhesion or division of labor was demonstrated |
| [Neutral signal](../signal-study.md) | Local chemical information could support conditional behavior | Secretion stayed low; communication and the cause of its absence are unresolved |

Small tests should address the missing physical or behavioral link when that link matters to a
configuration choice. A hypothesis that fails on its named mechanism stays negative even if another
trait varies. A costly signal remaining quiet, or a family going extinct, is information rather
than a reason to manufacture a favorable endpoint.

<a id="design-status-and-provenance"></a>

## Status and provenance

Implemented means the mechanism exists. A proof point demonstrates a particular link under stated
conditions. An observed adaptation is a stronger claim about an inherited benefit. Operational
readiness concerns preserving and observing the user's continuing run. None substitutes for another.

Historical implementation plans: bacterial conversion `d805a90c-31e7-4f20-8fb1-5b2c05d9b417`;
funded bodies `49f9eee2-3e74-4eb8-8643-5e927bf32eda`;
attribution `ea5aa160-3b74-4728-b117-4959140c919f`;
strategic ecology `c8d33225-63e2-4e48-960e-4ed88bbe4a87`;
default correction `e04af0f4-38dd-4a84-acd5-989bf2c22b0e`.
Their completed status records work performed, not a certified ecosystem. The three remaining
paused ant plans are canceled by the [September 13 closeout](plan-closeout.md); their unfinished
certifications remain unfulfilled and surviving requirements have explicit backlog owners.
The ant implementation remains recoverable from tag `ant-colony-checkpoint-2026-09-09`, commit
`780fa4e`. It is not an additional runtime or a prerequisite.
