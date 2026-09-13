# Current design and work order

Updated September 13, 2026 after review of the project's purpose and saved experiment results.
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

<a id="design-current-default-and-disabled-scope"></a>

## Current default and disabled scope

Run starts seed 101, paused at tick zero, with 48 cells carrying the same founder genotype in an
80 × 60 periodic plane. Viscosity is 0.4. Twenty-four finite deposit slots are assigned equally
to a pure-A left half and a pure-B right half; individual deposits vary in size, timing and rate.
Initial dissolved food is mixed, and decomposition returns equal A/B. Haploid clonal fission,
physical/behavioral mutation and paid inheritable plasticity are active. The RNN has 35 inputs,
24 recurrent units and eight outputs. Checkpoints are v7 with ten physical loci.

Toxin secretion, producer immunity, defense, repair and porous matrix are active. Contact injury,
predation, two-type toxin chemistry, the element cycle, membrane crowding, disturbance, gene
transfer, reserve sharing, neutral signaling and solid walls are off by default. They are
implemented experimental settings, not a combined tested ecosystem. Mixed deposits and food epochs
remain selectable. Do not silently enable all mechanisms or replace the founder with a diagnostic
or evolved winner. A reviewed world may enable an opportunity without requiring its evolved outcome.

The A/B halves are a deliberately simple configuration for local resource differences. They are
not a commitment to a two-species product. Changing that default requires a reason tied to the
world's opportunities and a configuration review, not a desire to obtain a particular picture.

<a id="design-next-decisions"></a>

## Next decisions

1. Use the corrected evidence to choose a coherent observation world. For each proposed active
   mechanism, name the opportunity, its cost, a competing explanation and the small existing or
   missing proof point. Consider interactions between mechanisms; seven independent experiments
   do not establish that enabling all seven produces a useful world.
2. Resolve readiness for days or weeks of user observation. Current saves are manual, IndexedDB
   holds one latest save, organism ancestry grows with every birth, and charts are view-local.
   Execution runs in the browser animation loop. Memory, save/restore latency, history retention,
   interruptions and sustained throughput need proportionate checks and a durable design.
3. Hand over a reviewed starting world with active settings, known limits and useful observation
   controls. Leave mutation and ordinary reproduction to explore it. Do not populate authored
   factions or require a successful long evolution campaign before the user begins.
4. Let observations guide later diagnosis. If a mechanism appears inert, or one cheap body appears
   universally favored, ask what opportunity is missing and use a bounded comparison that could
   change the design. Do not chase every extinct lineage or explain every winning mutation.

This revision changes documentation and saved-result reporting only. It does not change the
default world, implement long-run storage, start a server or authorize a new campaign.

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
Their completed status records work performed, not a certified ecosystem.
The ant implementation remains recoverable from tag `ant-colony-checkpoint-2026-09-09`, commit
`780fa4e`. It is not an additional runtime or a prerequisite.
