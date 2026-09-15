# Current design and work order

Updated September 13, 2026 after review of the project's purpose, saved experiment results and
the accepted spatial ecology direction.
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
the accepted direction, its provisional calibration and the completed user review.

<a id="design-current-default-and-disabled-scope"></a>

## Current default and disabled scope

Run starts seed 101, paused at tick zero, with 48 cells carrying the same founder genotype in a
320 × 240 periodic plane. Viscosity is 0.004. Forty-eight finite renewal sites have unequal richness,
local A/B mixtures and variable release. The initial arrangement uses seven irregular abiotic
centers; founders occupy two separated resource neighborhoods. Uniform food is zero; 10% of initial
finite stock is dissolved locally. Decomposition returns equal A/B. Haploid clonal fission,
physical/behavioral mutation and paid inheritable plasticity are active. The RNN has 35 inputs,
24 recurrent units and eight outputs. Checkpoints are v8 with ten physical loci.

Toxin secretion, producer immunity, defense, repair and porous matrix are active. Contact injury,
predation, two-type toxin chemistry, the element cycle, membrane crowding, disturbance, gene
transfer, reserve sharing, neutral signaling and solid walls are off by default. They are
implemented experimental settings, not a combined tested ecosystem. Food zones and epochs
remain selectable. Do not silently enable all mechanisms or replace the founder with a diagnostic
or evolved winner. A reviewed world may enable an opportunity without requiring its evolved outcome.

The irregular resource arrangement is the first candidate for local differences and consequential
transit. Its geometry and parameters can change when measurements or human observation warrant it.
No population-region count is an acceptance criterion.

<a id="design-next-decisions"></a>

## Next decisions

1. Review [continuation limits and measurements](../continuing-observation.md) before depending on
   unattended execution. Rolling recovery and compact parentage are implemented; actual browser
   suspension, quota behavior and days/weeks responsiveness remain unverified.
2. Watch the starting world. Ordinary mutation, reproduction and local physical interaction determine
   what persists. Later observations can justify focused diagnosis without making every extinct
   lineage a defect to repair or every surviving group a demonstrated adaptation.

The user accepted the world after the two-colony startup and recovery identity fixes. Sulion records
all seven phases completed on September 13, 2026. Acceptance does not establish long-term ecology
or browser endurance; [short controls](../spatial-probes.md) establish only the specified physical
opportunities. No development server or long evolution campaign was started for handoff.

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
