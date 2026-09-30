# Current design and work order

Plans track implementation and deployment. Agents own appropriate automatic testing within the
work; verification, human acceptance and continuing observation are not plan stages or closure
gates. The [September 30 disposition](../plans/README.md) closes stale delivery queues and
supersedes older review-gate wording. Keep actual defects actionable and long-run questions in
their observation/backlog owners while development continues. The
[design directions registry](directions.md) lists every past and future direction with its
status, owner and decision record.

<a id="design-terrain-display"></a>

## Integrated terrain display — September 30

The default landscape view shows conductance ground, height contours, received-light shade,
translucent chemistry and seasonal reservoir bands together. Cells remain above these cues; a
permanent legend removes the need to select diagnostic layers. This presentation change, pushed
to main as `fc016c7`, changes no physical rule or checkpoint format. Its completed plan is listed
in the [plan index](../plans/README.md).

**Realized-activity controller inputs — September 30.** Physical v48 replaces the v43
biomass-proportional stock inputs, which all equalled `M/(M+B)`, with one reading per paid
actuator: accepted signed effect against full-effort capacity since the previous physiology
publication, `a/(|a|+C)`, for transporters, enzyme programs, builder and emitter. Seven
capacity-only slots were removed (59 → 52 inputs). Founder weights used none of the replaced
slots. The [controller contract](controller.md#controller-observation-contract) lists the
layout; v48 rejects older checkpoints without migration.

<a id="design-terrain-seasons"></a>

## Fractal terrain and local resource seasons — September 30

Physical v46 implements persistent elevation, conductance, overhead transmission and optional
ceilings, independent fractal source placement and local seasonal release/refill clocks.
World-start configuration exposes each coupling and current-behavior/integrated presets.
The [terrain plan](../plans/TERRAIN-AND-SEASONS-PLAN.md) records delivery of the implemented
motion, configuration and refill-timing corrections. [Dynamic terrain](dynamic-terrain.md) is a separate open design direction
for gradual change, tectonics and local events; it is not implemented or a static-delivery gate. The
[composed laws](chemistry/composed-runtime.md#geographic-composition) own the physical operations.
Format v47 rejects older checkpoints without migration. The original static implementation was pushed to
main as `569f1a0`.

The September 30 [spatial hierarchy revision](spatial-scale.md) addresses the loss of distinct
resource neighborhoods: explicit regional density and neighborhood spread, bounded fractal
placement, finer local terrain and separate regional seasonal bands. This is implemented in v47
through the existing generator, configuration, persistence and observation paths. Sulion
`0d03350f-9bc9-4c9f-a703-8f611940afe9` tracks publication and the user-authorized live-world reset.

<a id="design-birth-and-aging"></a>

## Birth orientation and aging — September 29

Physical v45 gives newborns independent uniform headings and a random local division axis.
Age progressively increases body maintenance; inherited core fraction slows that rise at the
expense of other body capacities. Fission rejuvenates daughter age while conserving injury,
material and work; a budding parent keeps its age. The [delivery plan](../plans/archive/BIRTH-AND-AGING-PLAN.md)
records bounded checks and limits. [Composed laws](chemistry/composed-runtime.md) own the equation.
Pushed to main as `79ea580`. Older checkpoints are rejected without migration.

<a id="design-dispersal-opportunities"></a>

## Dispersal geography and neural response — September 28

Physical v44 adds a sparse tail to regional reservoir placement and a shared incoming-weight
budget to every neural row, including effective learned recurrence. It preserves source
counts, supply rates and refill timing. The [delivery plan](../plans/archive/DISPERSAL-OPPORTUNITIES-PLAN.md)
records bounded before/after checks and their limits; the [live evidence](../evidence/dispersal-v43/README.md)
motivates the changes. Pushed to main as `f6f2a2a`. Older physical checkpoints are rejected
without migration.

<a id="design-genetic-physiology"></a>

## Genetic physiology — September 28

The [physiology plan](../plans/archive/GENETIC-PHYSIOLOGY-PLAN.md) removes machinery construction and
retirement. In v43, genes directly determine body proportions at current biomass. Growth and
reproduction conserve material and pay whole-body costs; physical actions retain their own
equations. The controller operates capabilities without constructing them. The
[body contract](funded-bodies.md) supersedes earlier development and ownership-tax requirements.
Pushed to main as `dc41e40`.

<a id="design-ecological-incentives"></a>

## Ecological incentives — September 26

The [ecological incentives plan](../plans/archive/ECOLOGICAL-INCENTIVES-PLAN.md) implements
compression-driven separation, passive membrane exchange and private light-supported
metabolism. Short probes show mobile growth in dilute material and receptor-driven reduction
of harmful exposure. Avoidance also sacrifices nutrient income; no evolved dispersal outcome
is claimed. Current equations belong to the [composed laws](chemistry/composed-runtime.md).
Pushed to main as `3ee29b3`/`a3a97ee`. Local resource seasons are implemented in v46 above.

<a id="design-model-simplification"></a>

## Completed model simplification

The [model-simplification plan](../plans/archive/MODEL-SIMPLIFICATION-PLAN.md) records unnecessary
modeled machinery in refitting, reservoir behavior, and binding/retention. M0 removes refitting:
complete chemical capabilities are fixed at birth, and daughter mutations apply immediately to
conservatively inherited stock; living-cell gene transfer is removed.
M0–M2 are complete with passing `make ci`. M1 replaces
duplicate reservoir mixtures and lifetime expiry with one composition, finite amount, release
and delayed refill. M2 removes the broad opposing attraction field, its gain control and
cohesion-based washout discount. One finite attraction range, local repulsion and nonlinear
crowding remain. Bounded mechanism checks pass. V43 later replaced inherited stock with
genetic capacities at current biomass. The separate structural execution work is recorded below.

<a id="design-light-ecology"></a>

## Light ecology (v42)

The [light ecology plan](../plans/archive/LIGHT-ECOLOGY-PLAN.md) implements static geographic shade,
funded overhead cover, paid emission and common public photochemistry in physical v42.
Sunlight remains overhead and non-depleting. The [results](../light-ecology-results.md) separate
physical/controller opportunities from failed or unproven ecological returns. The implementation
and publication are complete; the old operating/human-review gates are retired.

<a id="design-material-coupling"></a>

## Class-specific material coupling baseline

The v40 server world showed reservoir regions dispersing to a random layout and cells spreading
toward an even distribution. The [material coupling plan](../plans/archive/MATERIAL-COUPLING-PLAN.md)
keeps the shared chemical response but couples dissolved material, reservoirs and cells to it
separately, restoring reservoir cluster tension and adding cell adhesion. Its v41 implementation
underpins the light extension; its recorded observation limits remain valid.

<a id="design-structural-priority"></a>

## Regional structural execution

The user's repeated direction is to address computational structure before accelerating the
existing base. The [archived scaling plan](../plans/archive/SCALING-PLAN.md) records the delivered
structural replacement; future performance work follows the same rule.
Reconsider ownership, interaction representation, distance bounds, magnitude thresholds and
update timing together. Preserve the governing mathematical relationships and ecological
opportunities; do not treat the installed dense arrays, filters or phase schedule as requirements.
Installed threading is a tool for the replacement. V36 installs compact chemical ownership,
support-owned finite convolution and footprint-local dependencies. The sampled contact model
was rejected and replaced with simple circle overlap and permeability. Persistent spatial
tiles and local derived scheduling are now implemented in the
[regional execution contract](spatial-execution.md), with private material/feature commits and
shared carrier ownership. The user resumed multicore execution on September 21. The scaling
plan records acceptance measurements and remaining limits; its earlier withdrawn closeout
remains historical evidence.

<a id="design-installed-runtime"></a>

## Installed runtime

Physical v46 uses sparse chemical owners in persistent 8×8 regions and one finite shared
circle-overlap law for pressure, isotropic sensing and funded material exchange. Direct chemical
composition and physiological neural recurrence retain owner-published inputs. The earlier
single-thread investigation ended below its throughput target. Shared-memory execution
is recorded in the [multicore plan](../plans/archive/SCALING-PLAN.md#multicore-design), with one Rust
World, a persistent compute pool and the existing coordinator-owned renderer. It uses one scalar illumination field throughout chemistry,
photoreception and display, attenuated by terrain transmission and overhead film. It retains the
v33 retained-mixture organization and shared interfaces under v43 genetic physiology,
material-supported habitats with v41 class-specific coupling, composed source periods, local
seasonal supply clocks and bounded phenotype/chemical-flow observation.
Before the multicore runtime, the user reported dense, long-lived colonies and a promising visual result.
The [83,980-tick checkpoint review](../material-habitats-review.md) records differentiated
chemistry and continued turnover. The [session slowdown investigation](../session-runtime-review.md)
records the reload-related performance report and its unresolved attribution.

[Composed runtime laws](chemistry/composed-runtime.md) own the current equations.
[Browser/native execution](../execution-modes.md) adds explicit browser 1/4 and a shared
native server with the same UI. The server runs on private TrueNAS/Komodo; the public spectator
route `server.biotropy.ahara.io` forwards only `/stream` and `/health`, `/api` stays LAN-only,
and the public site defaults to the server world. This changes execution and observation, not chemistry.
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
retention, source renewal and extracellular chemistry. Local optical sensing is a paid genetic capacity.

The v31 [200k review](../integrated-200k-review.md) found differentiated bodies and inherited
light responses, but also feedstock dependence and source dispersion. V32 addresses those
limitations; its public-food acquisition probe remains negative. The user's newer checkpoint
shows broader uptake and dense colonies, with continued feedstock dependence in net material
flow. These are distinct results, not certification of a closed ecosystem.

The v33 [180k analysis](../cellular-200k-review.md) finds inherited local metabolic differences,
mixed uptake, changing enzyme repertoires and repeated die-off/recovery. Large colonies mainly
use private chemical cycles; selective enzyme activity and direct neighbor feeding remain minor.
The [connected review](../cellular-180k-connections.md) finds strong collective body effects on
local work conditions, persistent divergence between northern and southern processing, and
energy crises despite retained material. It corrects a derived body-signal omission in the
earlier inspector; recorded flows and ancestry are unaffected.
The run was stopped at the user's request. Its historical mature checkpoint measured 2.43 ticks/s
with observation disabled and exceeds the browser save/export limit. Contact search considers
5.2 million candidates for 38,071 real contacts in that baseline. Subsequent contact and threading
changes improved it; this historical diagnosis is not the current work order.

<a id="design-design-owners"></a>

## Design owners

| Document | Owns |
| --- | --- |
| [Design directions](directions.md) | Registry of every design direction with its status, owning document and decision record |
| [Computational foundation](chemistry/computational-foundation.md) | Governing mathematical design, composed manifold operations and cost-first selection |
| [Transformation algebra white paper](chemistry/transformation-algebra.md) | Group-theoretic direction, finite-state constraints and evidence contract; selected v23 implementation tracked in the canonical plan |
| [Digital chemistry](chemistry/README.md) | Chemical identity, funded machinery, implementation records and replacement decisions |
| [Cellular organization](cellular-organization-and-exchange.md) | Implemented v33: retained-mixture response, activity regulation, variable enzyme programs and shared interfaces; construction sections superseded by v43; [delivery evidence](../cellular-organization-results.md) |
| [Intracellular organization](intracellular-organization.md) | Historical strategic rationale for v33; internal compartments rejected |
| [Cell interaction research](cell-interaction-research.md) | Historical September 19 mechanism inventory; recommendations superseded by v33 |
| [Sparse spatial ecology](spatial-ecology.md) | Historical pre-chemistry world hypothesis, movement retuning, spatial populations and observation structure |
| [Persistent geography](persistent-geography.md) | Implemented v46 static fractal terrain; changing terrain and live switches unselected |
| [Local resource seasons](local-resource-seasons.md) | Implemented v46 local seasonal release/refill clocks |
| [Regional execution](spatial-execution.md) | Current contract for persistent 8×8 regional ownership, private commits and shared carriers |
| [Spatial isolation review](spatial-isolation-review.md) | Historical September 18 study; fixed basins rejected, directional climate unselected |
| [Resource binding investigation](resource-binding-investigation.md), [proposal](resource-binding-proposal.md) | Historical September 19 record of shared-attraction binding, implemented v28 and modified in v32, v39 and v41 |
| [World and lifecycle](bacteria.md) | Substrate, resources, turn order and persistence |
| [Controller](controller.md) | Local sensors/actions, recurrence, private byte and controller boundary |
| [Bodies and inheritance](funded-bodies.md) | Physical costs, genes and lifetime/inherited learning |
| [Strategic ecology](strategic-ecology.md) | Mechanisms, ecological hypotheses and active/disabled settings |
| [Composed runtime](chemistry/composed-runtime.md) | Current shared operators, illumination, material habitat laws and execution bounds |
| [Light ecology](light-ecology.md) | Implemented v42: scalar illumination, geographic shade, overhead film, paid emission and shared optical accounting |
| [Directional cell utterances](cell-utterances.md) | Deferred specification for paid bytes, coarse listener-relative bearing, funded inheritance and natural observation after implementation; no prior payoff or evolution gate |
| [Strategic controller](strategic-controller.md) | Deferred specification for a slow learned strategy layer: history transform, local rhythm phases, neighbor display, reflex context inputs and learning gain |
| [Rugged chemical interaction](rugged-interaction.md) | Deferred research direction for surprising mutations and co-located roles; [Kauffman research paper](kauffman-landscapes-research.md) |
| [Material habitats](../material-habitats.md) | Two-scale binding, retention, renewal, public chemistry and bounded evidence |
| [Experimentation](experimentation.md) | Small proof points, diagnostic comparisons and limits of inference |
| [Population observation](population-observation.md) | Families, traits, grouping conventions and retained history |
| [Evidence](bacteria-results.md) | Recorded findings and version-specific limits |
| [Display](bacterial-display.md) | Run defaults, visible meanings and observation limits |

[Principles](../principles.md) govern decisions. [Architecture](../architecture.md) maps owners;
[calibration](../calibration.md) records scales; [backlog](../backlog.md) owns unresolved work.
The [plan closeout](plan-closeout.md) records OBE dispositions and migrated requirements from
earlier plans. Current runtime documents describe implemented behavior; the spatial design records
the pre-chemistry direction and prior calibration.

<a id="design-current-default-and-disabled-scope"></a>

## Current default and disabled scope

Run starts seed 27, paused at tick zero, with 48 cells of four mutable founder genotypes in two
separated resource neighborhoods of a 720 × 540 periodic world. Two hundred forty mobile renewing reservoirs
have unequal richness, evolving mixtures and fixed per-site release rates. Chemistry seed101 and source IDs0/136
support the authored circuit0→128→136→8→0, with six cells of each role per colony.
Finite initial8/128 priming starts delivery; later processing follows ordinary laws. Free and
bound material retain actual identities through repair and death. No chemical has a privileged
waste role. Haploid clonal fission, mutation and paid inheritable plasticity are active.

The controller has 52 inputs, 24 recurrent units and 19 outputs. Genes express twenty-two derived
body capacities directly at current biomass, including four chemical receptors, four transporters,
one to eight enzyme programs, core, motor, storage and [photoreception](../photoreception.md); there
is no construction or retirement. The light sensor uses the same embodied sampling and
funded response law; no automatic light-seeking behavior is supplied. Physical
checkpoints use v48; the outer observation package remains v11.
The default area is 5.0625 times the previous 320 × 240 world, with the same aspect ratio,
mesh and founder count. The initial landscape now has 35 regions and 240 reservoirs, five times
the preceding counts. Local spread, reservoir sizes and per-site release are unchanged, keeping
resource density comparable instead of stretching seven neighborhoods across the larger map.
Reproduction has no population-count or historical-record ceiling. History retains living cells
and bounded recent ended records; old parentage expires without pausing. Recoverable save failures
warn while stepping continues. Current bodies, capabilities and behavior describe diversity;
founder lineage and sequence counts do not. See [continuation](../continuing-observation.md).
Memory and observation budgets remain finite. Larger area is not a speed guarantee.
The [material-habitat changes](../material-habitats.md) introduced shared attraction,
locally evolving source renewal and multiscale public chemistry. The
[simplification](../plans/archive/MODEL-SIMPLIFICATION-PLAN.md) now uses one normalized attraction
range and ordinary washout; the broad opposing field and cohesion discount are removed.
IDs0/136 are initial landscape choices; ordinary renewal no longer reinstates them.
Generic stress, compatibility, repair and impedance replace named toxin/defense/
matrix pathways. Source zones and epochs remain selectable. Disturbance is an experimental option, disabled by default. Living-cell genetic transfer is removed. V41 compatibility-weighted contact adhesion is installed; bonded attachment remains unselected.
Smooth geographic weathering and chemical shelter are active. The weathering display and
selected-cell exposure readings describe physical conditions without adding controller inputs.

The irregular resource arrangement is a revisable hypothesis. No region count or evolved community
is an acceptance criterion. Do not seed a diagnostic or evolved winner into the default.

The [resource-economy model](chemistry/resource-economy.md) governs current supply calibration:
delivery-aware source selection, mean renewal gap 600 model seconds and washout 0.001/second.
Batch duration remains 600 seconds. The [extinction correction](../extinction-correction.md)
shortens outages while preserving initial funding; nominal ongoing supply increases 2.5-fold.
It calculates budgets and a spatial reference without advancing organisms. Short checks show
repeated local reproduction and both ordinary starting colonies reproducing; a weak isolated
site still fails. This prepares an evolutionary opportunity, not an evolved community.

<a id="design-next-decisions"></a>

## Next decisions

The structural replacement is delivered; [the scaling record](../plans/archive/SCALING-PLAN.md)
records the circle simplification and installed tiled execution. The September 21 sampled-contact
implementation produced the following historical results, superseded for contact behavior. At 20× area,
the ordinary 48-founder workload improved from 20.6 to 129.5 ticks/s with one native worker.
The concentrated 2,000-cell case is almost independent of added empty area, but at the original
area it regressed from 50.1 to 34.8 ticks/s. These are stepping measurements, with full overview
preparation measured separately. Neither establishes browser motion quality or days-long speed.
Historical [contact](../contact-performance.md), [bounded-computation](../bounded-computation.md)
and [multicore evidence](../sources/history/2026-09-21-scaling-before-structural-correction.md)
record improvements and failures; they do not authorize another incremental optimization pass.
The reload-related slowdown remains an unresolved [operating observation](../session-runtime-review.md),
not a reason to displace the structural work with a garbage-collection or persistence investigation.

Future work belongs in the [backlog](../backlog.md): meaningful long-term specialization,
less dependence on original feedstock, useful public-food returns, operating headroom,
changing terrain, rotational climate and conditional biological extensions. Static terrain and
v33 cell interactions are implemented. The scaling plan owns the delivered
structural record and measured operating limits. Source geometry
is a revisable initial condition, not a requirement for predetermined wells or colony counts.
Do not turn these open questions into a mandatory verification campaign.

The [joint cellular organization and exchange design](cellular-organization-and-exchange.md)
connects retained composition, funded local control, evolvable enzyme repertoires and contested
material access. Cells retain one mixture. Its [execution plan](../plans/archive/CELLULAR-ORGANIZATION-PLAN.md)
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
| Kernel and stats performance | Faster headless execution and less frequent UI statistics | Pre-chemistry measurement; not a current throughput figure |
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
| [Gene transfer](../transfer-study.md) | Physical traits can spread through contact as well as descent | Ancestry-group counts cannot show persistence of unchanged strategies; no pair gained share both ways. Living-cell transfer was removed September 22 |
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
