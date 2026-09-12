# Current design and work order

Updated September 11, 2026. This section describes the running bacterial simulation.
The [reference snapshot](../sources/history/README.md) preserves the previous design tree,
including ant work orders, superseded bacterial contracts and detailed experiment records.

<a id="design-goal-and-present-evidence"></a>

## Goal and present evidence

Observe inherited behavioral and physical differences changing survival and reproductive success
inside a resource-limited world. The population has no external fitness scorer, parent selector,
synchronized generation boundary or automatic rescue. Biological motivation guides the model;
faithful bacterial physiology is not claimed.

The objective is consequential evolution in a population whose ecology remains dynamic over time.
Hypotheses guide the design of opportunities and the diagnosis of inert mechanisms. Explaining every
winner or making a prescribed pair of strategies succeed is not the project goal or a development gate.

Inheritance, mutation, acquired-weight transmission, funded reproduction and consequential ecology
are implemented. In the current default, a single founder population evolves two coexisting diet
specialists occupying the A and B halves of the world within about 100 generations, and the
evolved genotypes each invade the other from rarity; see the [evolution record](../evolve-study.md).
Earlier actual evolved genotypes have measured benefits from reduced toxin output,
improved brief-food access and greater B-processing investment. The
[exported-lineage investigation](../overnight-study.md) and
[six-area capability investigation](../capability-investigation.md) use fresh transfers and targeted
reversions to distinguish those effects. Broad strategic diversity and adaptive inherited learning
remain unproved. Founder dominance alone still does not establish adaptation.

<a id="design-design-owners"></a>

## Design owners

| Document | Owns |
| --- | --- |
| [World and lifecycle](bacteria.md) | Substrate, resources, turn order, physical reproduction and persistence |
| [Controller](controller.md) | Exact sensors/actions, recurrence, task byte and controller boundary |
| [Bodies and inheritance](funded-bodies.md) | Physical costs, genes, lifetime learning and transmission policies |
| [Strategic ecology](strategic-ecology.md) | Food opportunities, toxin, defense, repair, porous matrix and disabled systems |
| [Experimentation](experimentation.md) | World-design hypotheses, proportionate diagnosis and optional adaptation attribution |
| [Population observation](population-observation.md) | Recent families, genealogy, separate genetic distances, inherited traits and sampled behavior |
| [Evidence](bacteria-results.md) | Current outcomes, historical limits and unresolved conclusions |
| [Display](bacterial-display.md) | Run defaults, visual meanings and observation limits |

[Principles](../principles.md) govern decisions. [Architecture](../architecture.md) maps modules;
[calibration](../calibration.md) records current scales; [backlog](../backlog.md) owns deferred work.

<a id="design-current-default-and-disabled-scope"></a>

## Current default and disabled scope

Run starts seed 101, paused at tick zero, with 48 identical founder genotypes and finite A/B
deposits in a pure-A left half and a pure-B right half. Haploid clonal fission, random
mutation and paid inheritable plasticity remain active. The RNN is
35 inputs → 24 recurrent units → 8 outputs. Checkpoints are v5.

Toxin injury, repair and porous matrix have measured consequences in the default.
Solid walls and neutral signaling are disabled there: useful wall construction and communication
have not been established. Their experimental configurations remain available. This is an explicit
simulation setting, not merely a hidden display layer.

Implemented systems must visibly affect the Run population before handoff or have a recorded reason
to be disabled. The user reviews through Run and stats. Do not introduce a browser assay or request
repeated permission for routine repairs. Substantial new designs require review before implementation.

<a id="design-next-decisions"></a>

## Next decisions

1. Use the default recent-family view, inherited trait distributions/trends and sampled behavior to
   distinguish continuing population change from a permanent founder-color label. Genealogical and
   genetic comparisons are separate views; family splits alone do not establish adaptation.
2. Assess whether the existing ecology keeps offering consequential inherited choices as resources,
   neighbors and population composition change. Stable abundance need not mean static evolution,
   and continuous turnover is not required at every moment.
3. If observations reveal persistent stagnation or an inert mechanism, choose one bounded diagnostic
   that distinguishes a world limitation from insufficient variation or controller expression.
   A matched frozen-inheritance control can test the contribution of inherited change without
   identifying the exact winning trait. The completed [food-epoch campaign](../food-epochs-study.md)
   found a 26.20% mean final-phase population advantage across twelve paired seeds. Fresh-world
   post-B cohorts averaged 71.80% share in A-rich food and 76.99% in B-rich food, establishing
   inherited improvement with an environment-dependent component. No experiment is still running.
4. Propose the smallest pressure or inheritance change supported by that diagnosis for design review.
   Do not tune toward a required fast/slow crossover or preserve a particular family by intervention.

The [short food-access panel](../quick-food-access-study.md) established a constructed behavioral
tradeoff. The completed [capability investigation](../capability-investigation.md) rejects the tested
reserve-braking recipe as a universal improvement, then isolates actual evolved behavioral and
physical benefits. Four selection pilots show growth of a rare B-processing allele, but no consistent
B-specific frequency advantage across both seeds. No experiment is still running.

The next recommendation is simultaneous spatial A/B resource heterogeneity, starting with the
existing random deposit compositions before new physics. Review that configuration direction and
its four-case mixed-versus-separated-food falsifier. Current epochs, founders and controller remain
unchanged. Do not require high-motor success, evolved offense or adaptive learning before proceeding;
their negative or unresolved dispositions remain in the capability report.

The bounded [adaptation campaign](../overnight-study.md) preserves the current default and founder.
There is no ant population-scale gate, ant-RNN recovery campaign or pending conversion.
The follow-up toxin intervention retains secretion savings but substantially attenuates the
advantage when injury is disabled. The [motor study](../strategy-study.md) found lower investment
won all sixteen matched contests. This limits claims about that pair; it does not block development
until the pair succeeds. The unavailable later browser checkpoint is not a prerequisite.

<a id="design-roadmap"></a>

## Roadmap to strategic differentiation

Reviewed September 11, 2026. The completed studies establish real evolved advantages, but every
winner is a cost reduction, and the twelve epoch populations drift toward one economical body.
Three structural limits explain that outcome and set the work order:

- **One optimum.** Toxin injures its producer with no immunity, matrix is a shared good, and A/B
  arrive together from the same deposits. No interaction rewards a rare type and no two niches
  exist at once, so selection converges rather than diversifies.
- **Small populations, slow generations.** Steady state is about 150 cells at about 5,000 ticks
  per generation, roughly 30 generations per 150,000 ticks. Selection weaker than about 1% is
  invisible to drift at that size, and an hour at 30 ticks/s shows about twenty generations.
- **Behavioral mutation supply.** About one of 1,649 RNN loci changes per birth; physical loci
  evolve far faster, which is why the isolated wins are physical or single-weight.

The [coexistence criterion](experimentation.md#experiments-coexistence-criterion) is the acceptance
test. Phases, each with a yes/no gate, in order:

1. **Throughput and target.** Exact-arithmetic kernel optimization, a throttled statistics cadence
   in the browser and this criterion. Done; numbers in [calibration](../calibration.md). The
   500 ticks/s target was not reached; the remaining cost is float32 inference order and the
   four-pass contact model.
2. **Toxin with immunity.** Producers are immune to their own toxin; defense remains a separate,
   cheaper resistance; contact-range injury added. Gate not met: all three pairwise dominances
   hold, but every three-way pilot loses the sensitive type and fixes the resistant, the
   well-mixed outcome. See the [contest record](../rps-study.md).
3. **Persistent spatial A/B regions.** Pure A and B halves with balanced deposit slots, now
   the Run default. Gate met: constructed specialists each invade from rarity and persist with
   a generalist; the mixed control fixes the generalist. See the [zone record](../zones-study.md).
4. **De novo evolution.** Not met in the old thin-medium world (70–127 generations, eight arms:
   economy evolved, no partition). Met after the world was changed to a thick medium with dense
   balanced deposits, symmetric recycling and stronger mutation supply: all three zoned seeds
   split into A-side and B-side diet clusters from one founder by 100,000–200,000 ticks, the
   mixed control does not, and seed 303's evolved medoid genotypes mutually invade from rarity.
   See the [evolution record](../evolve-study.md).
5. **Strategy-space observation.** Done: cluster colouring, scatter, table and history in Run;
   `invasion` harness command for any checkpoint.
6. **Behavioral differentiation.** The RNN-supply arm ran inside phase 4 and did not change the
   outcome; the boom/bust regime was not built.

Authoring a world that theory says can support coexistence is authored pressure, not forced
coexistence: no genotype, route or winner is prescribed, and evolution must still find the
strategies. Attribution studies of past winners and sweeps of the current ecology are paused.

The block behind both early negatives was dispersal fast relative to replacement. Raising the
medium's viscosity a thousandfold gave residency (13% of cells ever cross a band, versus 96%),
and evolution then found the partition on its own. The toxin cycle has not been re-tested in the
thick medium; that is the next open question, since its failure had the same cause.

<a id="design-roadmap-2"></a>

## Roadmap two: organism-generated selection

Reviewed September 12, 2026. The zoned world proved the machinery but drew the niche itself.
The second roadmap adds mechanisms where the organisms generate the selective environment, each
as a configuration lever with rates, each measured in a homogeneous world against a
mechanism-off control, each gated by mutual invasibility of whatever clusters emerge:

1. **Element cycle** (implemented as `config.cycle` with `machineryCrowding`; see the
   [ecology contract](strategic-ecology.md#ecology-element-cycle)). Measured in the
   [cycle study](../cycle-study.md): constructed autotroph, heterotroph and mixotroph guilds each
   invade from rarity; evolved populations at crowding 0.5 stayed mixotroph over 35–50
   generations, and at crowding 0.75 one seed of three split into a harvester and a consumer
   cluster by 93 generations whose medoids mutually invade.
2. **Family chemistry**: heritable tags gating toxin immunity and matrix shelter. Planned
   encoding: a tenth physical locus sets the share of a cell's toxin that is type B rather than
   type A (two toxin fields under `toxinTypes: 2`, one under the default 1); installed toxin
   machinery is immune to each type in proportion to the share it produces, so relatives
   tolerate one another and a lineage that drifts in type is harmed by its own family. The
   sensed toxin input becomes the susceptibility-weighted concentration.
3. **Predation**: contact consumption of smaller cells with paid machinery.
4. **Abiotic disturbance**: random mixing, washout and dry-down events.
5. **Horizontal gene transfer** between touching cells.
6. **Adhesion and division of labor**.
7. **Quorum signaling** through the costed neutral chemical.

<a id="design-status-and-provenance"></a>

## Status and provenance

Implemented means code and bounded checks exist. Measured means a named experiment establishes
an outcome for its recorded conditions. Human observation addresses visible behavior. Adaptation
requires an inherited advantage with an identified causal basis; none of these statuses substitutes
for another.

Completed plans: bacterial conversion `d805a90c-31e7-4f20-8fb1-5b2c05d9b417`;
funded bodies `49f9eee2-3e74-4eb8-8643-5e927bf32eda`;
attribution `ea5aa160-3b74-4728-b117-4959140c919f`;
strategic ecology `c8d33225-63e2-4e48-960e-4ed88bbe4a87`;
default correction `e04af0f4-38dd-4a84-acd5-989bf2c22b0e`.
Documentation consolidation: `1dca00f8-0b66-46cc-9533-de7c46062e45`.
The ant implementation is recoverable from `ant-colony-checkpoint-2026-09-09`, commit `780fa4e`.
