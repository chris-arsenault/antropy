# Current design and work order

**September 15, 2026: a fresh production core is implemented.** The
[composed runtime](chemistry/composed-runtime.md) and
[rebuild work order](../../DIGITAL-CHEMISTRY-PLAN.md) govern its formulas, owners and
accepted handoff. Native/WASM builds,69 Rust and56 Vitest checks pass. Bounded
opportunities, cold recovery and isolated browser rendering/save/fault checks pass their declared
checks. Default mesh2 and active chemical-group processing are restored; the user accepts this
performance correction. Saturated-field limits remain recorded. The user's initial visual
review passes at this resolution; M3 and the rebuild plan are complete. The user has started
a long run for continuing observation. It subsequently crashed during an unattended hour;
the [follow-up repair](../../LONG-RUN-RELIABILITY-PLAN.md) addresses reproduced development
timing retention. Initial visual acceptance does not establish endurance.
Seed27 supplies a centered review layout.
See [current measurements](chemistry/rebuild-results.md). Earlier
implementation statuses and integration sequences below are historical; their ecological
and ownership requirements remain. Do not restore the discarded kernels.

Updated September 15, 2026. [Computable chemistry](chemistry/computational-foundation.md),
[ADR 0022](../adr/0022-computable-chemistry.md) and the [root plan](../../DIGITAL-CHEMISTRY-PLAN.md)
govern the redesign: artificial rules composed over the chemical manifold, designed for their
execution cost. M0 formulas and the old M2 expansion are superseded as prescriptions.
[Runtime numerical design](chemistry/numerical-engine.md), [measurements](chemistry/reliability-results.md)
and [migration dispositions](chemistry/numerical-migration.md) retain earlier implementation evidence.
The [reference snapshot](../sources/history/README.md) preserves earlier designs and work orders.

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

The runtime now uses a smooth 256-species chemical space, fixed funded machinery, generic reactions,
membrane compatibility and bounded dense extracellular arrays. Short constructed tests show several
physical opportunities, with negative results and operating limits retained in the validation record.
Earlier chemical mechanisms and checkpoints have been replaced; their results below are historical.

The runtime supports resource-funded bodies, local RNN decisions, inheritance, mutation, paid
learning, births and deaths. Earlier isolated variants gained from food access, B processing and
lower toxin expense. The thick-medium A/B studies found inherited diet differences concentrated
in different regions; two of three endpoint pairs gained population share in both rare-start
contests. These are useful proof points for local selection, not certification of lasting diversity.
The newer seven-mechanism campaign overstated its results by confusing growing counts with growing
shares. See the [corrected analysis](../analysis-correction.md) and [evidence](bacteria-results.md).

<a id="design-design-owners"></a>

## Design owners

| Document | Owns |
| --- | --- |
| [Computational foundation](chemistry/computational-foundation.md) | Governing mathematical design, composed manifold operations and cost-first selection |
| [Digital chemistry](chemistry/README.md) | Chemical identity, fixed machinery, implementation records and replacement decisions |
| [Sparse spatial ecology](spatial-ecology.md) | Implemented world hypothesis, movement retuning, spatial populations, multiscale observation and handoff |
| [World and lifecycle](bacteria.md) | Substrate, resources, turn order and persistence |
| [Controller](controller.md) | Local sensors/actions, recurrence, private byte and controller boundary |
| [Bodies and inheritance](funded-bodies.md) | Physical costs, genes and lifetime/inherited learning |
| [Strategic ecology](strategic-ecology.md) | Mechanisms, ecological hypotheses and active/disabled settings |
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

Run starts seed 27, paused at tick zero, with 48 cells of the same founder genotype in two
separated resource neighborhoods of a 320 × 240 periodic world. Forty-eight finite renewal sites
have unequal richness, local mixtures and variable release. Chemistry seed 101 resolves initial
source IDs 0 and 80; decomposition uses ID 186. These are ordinary locations in the generated space,
not biological roles. Haploid clonal fission, mutation and paid inheritable plasticity are active.

The controller has 39 inputs, 24 recurrent units and nine outputs. Fifteen funded stocks support
four receptors, four transporters and four enzymes plus core, motor and storage. Physical
checkpoints use v13; the outer observation package remains v11.
Generic stress, compatibility, repair and impedance replace named toxin/defense/
matrix pathways. Source zones and epochs remain selectable. Disturbance and typed machinery
transfer are experimental options, disabled by default. Light input and binding remain deferred.

The irregular resource arrangement is a revisable hypothesis. No region count or evolved community
is an acceptance criterion. Do not seed a diagnostic or evolved winner into the default.

The [resource-economy model](chemistry/resource-economy.md) governs current supply calibration:
delivery-aware source selection, mean renewal gap 1,200 model seconds and washout 0.001/second.
It calculates budgets and a spatial reference without advancing organisms. Short checks show
repeated local reproduction and both ordinary starting colonies reproducing; a weak isolated
site still fails. This prepares an evolutionary opportunity, not an evolved community.

<a id="design-next-decisions"></a>

## Next decisions

The rebuild's M0 design, M1 complete production World and M2 consumer/opportunity work are
complete. The sole Rust/WASM step integrates fields, machinery, local controllers, paid bodies
and inheritance. M3's automated operating checks now pass, including the existing browser,
worker WebGL2, isolated save/recovery and injected graphics/worker failures. The user passes
the initial visual review at mesh2, completing M3 and the rebuild handoff.

The user accepts the restored-resolution threshold correction. Headless default startup
measures372ticks/s; the short software-rendered browser check observes about292ticks/s.
Fully saturated2,000-cell growth remains slower and is a documented worst case, not a
reason to delay continuing observation. See the [current evidence](chemistry/rebuild-results.md).
Emission benefit, net movement payoff, colonization, sustained diversity and days/weeks
operation remain unresolved observations. Do not invent a required long campaign to close them.

Review [continuation limits](../continuing-observation.md) before depending on unattended execution.
The user's initial visual acceptance does not establish browser endurance. The user's long run
is ongoing; no days/weeks ecological campaign is required to finish this rebuild.

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
