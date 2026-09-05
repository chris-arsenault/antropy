# Evolutionary and advanced systems

This document owns genuine selection, population genetics, open-ended controller development,
within-lifetime learning, emergent castes, multiple colonies, threats, and later ecology. These
systems follow—not substitute for—the fixed-genome living-colony baseline.

<a id="advanced-evolution"></a>

## Continuous evolution

Ants reproduce and die on individual schedules in one persistent world. There is no synchronized
generation and no in-world fitness function. Selection is implicit in survival and successful
gene transmission through colony biology.

At demographic equilibrium, selection events occur roughly at population divided by mean
lifespan. Controller arithmetic is small compared with world updates, so evolutionary throughput
is expected to be limited by world simulation and by the information quality of each death and
birth, not by RNN multiply-accumulates.

Sexual recombination matters because it can test useful loci across backgrounds instead of moving
only linked genome bundles. The information-rate advantage is an optimistic ceiling when effects
are additive; strong epistasis reduces it. Throughput claims therefore require measured
heritability and effective population size rather than theoretical reassurance.

<a id="advanced-signal"></a>

## Selection signal and population health

Realized phenotype combines genetic and environmental variance. Parent-offspring regression of
delivery and lifespan estimates heritability. A sustained value near zero means environmental
luck or systematic regime changes dominate; increasing mutation is the wrong repair.

Merit aggregated across a patriline can reduce individual environmental noise, but concentrated
royal succession increases offspring-number variance and lowers effective population size. Track
both. Worker-laid male flux must remain material, and the succession weighting exponent must not
drive effective population size below roughly one hundred without an explicit result.

Environmental regimes must last long enough for selection to see a coherent sign. The planning
constraint is approximately `10 * genome generation time <= season period << run length`.
Turnover controls selection-event rate near carrying capacity; lifespan is the first clock dial,
not mutation.

<a id="advanced-genetic-floor"></a>

## Genetic diversity and collapse resistance

One destructive mutation can collapse a colony only when brood is genetically monolithic.
Polyandry and multiple stored sires make brood a portfolio: a broken patriline can fail while
siblings continue. This diversity is a biological viability floor and becomes active with genetic
variation.

Three additional safeguards preserve exploration without taxing every egg equally:

- a hard positive mutation-scale floor plus log-normal meta-mutation prevents absorption at zero;
- most eggs use conservative mutation while a small hot-egg minority carries large exploratory
  changes;
- a cheap hatch-time sanity probe rejects catastrophically broken genomes, such as controllers
  with zero output variation or saturated outputs, before full rearing investment.

Screening removes only catastrophic breakage, not low performance. It must not become a hidden
fitness function. Effective-population monitoring is most important at low population, where
mutational meltdown is most likely.

<a id="advanced-prelock"></a>

## Avoiding evolutionary pre-lock

The starting population should contain several viable behavioral hypotheses: foraging,
construction, wandering, pheromone response, and a minority of unstructured genomes. Founding
queens and stored sires draw independently. Hot eggs supply local basin escape; later invasion
events may inject fresh portfolio draws or mutated historical-checkpoint genomes into open
territory.

Track distance from initial seeds in both genome and behavior space. An early permanent plateau is
evidence of pre-locking and triggers portfolio, mutation, or invasion analysis—not claims that the
seed was optimal.

<a id="advanced-plasticity"></a>

## Within-lifetime learning

A behavior belongs in lifetime learning only when feedback arrives before death, many trials are
available, early errors are survivable, and a local value signal exists. Route learning, cue-value
association, motor calibration, and task thresholds qualify. Reproductive strategy, one-shot
lethal hazards, reward wiring, and architecture whose payoff spans worker lives remain innate or
colony-selected.

For the RNN, each connection can combine an inherited weight with a bounded plastic trace. A
genomic gain scales each connection class. A neuromodulated generalized Hebbian update uses
pre/post activity, class-shared learning coefficients, Oja-style decay, and clipping. The
modulation signal is an evolvable weighted combination of local observables such as energy change,
food or brood contact, gradient progress, and crowding change. Reward wiring is itself genomic so
motivation is not preselected.

Plastic state starts empty and dies with the ant. Lamarckian trace inheritance remains off unless
explicitly chosen as a different experiment. Learning has a metabolic cost and juvenile/error cost
so it cannot mask genotype quality indefinitely. Naive and standardized-experienced clones are
assayed separately to expose learned competence and later genetic assimilation.

<a id="advanced-development"></a>

## Development, roles, and castes

No caste enumeration is authored. Each physical trait may instead follow a genomic reaction norm
over larval feeding, incubation temperature/depth, and maternal signal, with evolvable baseline,
slope, and developmental noise. Shallow norms produce continuous variation; steep norms may
produce morphs; noise permits developmental bet-hedging. A sigmoidal threshold form is added only
if linear norms measurably cannot express useful bimodality.

Local demand carriers—stockpile odor, brood hunger, congestion—combine with body state, patriline
variation, and learnable task thresholds. Division of labor is the observed interaction of
development, genetics, experience, and colony demand, not a role label.

<a id="advanced-regimes"></a>

## Colonies, regimes, and ecological pressure

After one colony closes its replacement loop, genetic variation returns first, then new-colony
founding. Queens age, colonies collapse, new queens disperse and mate, and multiple colonies occupy
one map at staggered life stages. Seasons vary carrying capacity; traffic-keyed decay rents nest
space; together they repeatedly create founding, growth, saturation, competition, collapse, and
recovery regimes.

Threats and raids arrive only after sustainable multiple colonies. Predators and attackers respond
to conspicuous activity such as trail traffic, spoil, and forager flux, so collapse reduces threat
without a rescue flag. Raids may consume brood, steal stockpiles, and kill workers, creating a
colony-level channel for defensible architecture and possible soldier morphs. Surface life remains
survivable so new colonies can still enter the system.

Water and soil heterogeneity later add spatial regimes. Abandoned nests may collapse to loose fill
and become cheap founding opportunities. None of these mechanisms may be bundled with the first
evolution run.

<a id="advanced-controller"></a>

## Alternative controller substrate

Linear genetic programming is the intended second controller. Programs use persistent registers,
conditionals, homologous variation, an inheritance model owned behind the controller contract, and
per-instruction metabolic cost. The reliable plasticity path provides built-in plastic registers
updated by the same evolvable modulation signal. The open-ended path permits programs to evolve
their own counters and learning algorithms; it remains a research outcome rather than a bootstrap
requirement.

RNN and linear-GP populations are compared on viability-region width, mutation robustness,
evolutionary results, cognition cost, and interpretability. GPU acceleration naturally favors the
dense RNN; divergent program execution may not share that scaling. This computational asymmetry is
measured, not hidden.

<a id="advanced-order"></a>

## Linear implementation order

| ID | Status | Work and finish |
| --- | --- | --- |
| ADV-01 | Delivered | Per-ant genomes, mutation and recombination at egg creation, diploid females, haploid worker-laid males, polyandrous founding data, queen aging/collapse, seasons, nest decay, and multiple-colony mechanics exist in the isolated full world. |
| ADV-02 | Backlog | Finish the fixed-genome authored-nest replacement loop and resilience floors before enabling any evolutionary system. |
| ADV-03 | Backlog | Add live heritability and effective-population-size estimates, net-energy merit accounting, lineage survival, and seed-distance instruments before genetic variation. |
| ADV-04 | Backlog | Admit genetic variation alone to the certified living colony. Track selection, mutation robustness, diversity, and colony viability without founding or digging. |
| ADV-05 | Backlog | Activate the genetic portfolio: multiple stored sires, conservative and hot eggs, positive mutation floor, log-normal meta-mutation, and catastrophic-only embryonic screening. |
| ADV-06 | Backlog | Make worker-laid male gene flux material and calibrate merit succession against heritability and effective-population alarms. Add convention-aligned RNN recombination before plasticity. |
| ADV-07 | Backlog | Admit colony founding and mortality on the shared map. Demonstrate repeated sustainable founding, growth, collapse, and recovery without automatic continuation in measured runs. |
| ADV-08 | Backlog | Reintroduce optional digging and spoil. Dug colonies compete with the authored-nest control on survival, storage, brood, congestion, and persistence rather than morphology. |
| ADV-09 | Backlog | Admit traffic-keyed decay, seasons, and stronger liabilities one at a time. Confirm each changes the intended selection channel without collapsing ordinary viability. |
| ADV-10 | Backlog | Add evolved synaptic plasticity, genomic reward wiring, positive cognition cost, and naive-versus-experienced assays. Observe task learning and genetic assimilation rather than requiring named roles. |
| ADV-11 | Backlog | Add genomic reaction norms and local colony-demand carriers. Describe body morphs, task allocation, and developmental bet-hedging as outcomes. |
| ADV-12 | Backlog | Add invasion events, inter-colony contact, activity-scaled threats, raiding, stockpile theft, brood predation, and combat after multiple-colony persistence is established. |
| ADV-13 | Backlog | Implement and compare linear GP behind the existing contract, including architected plastic registers and an explicitly chosen inheritance model. |
| ADV-14 | Backlog | Add water/soil heterogeneity and measured compute acceleration as later ecological and scale experiments. |

<a id="advanced-obe"></a>

## OBE and rejected directions

| Direction | Status and reason |
| --- | --- |
| Evolution before a viable fixed-genome colony | **OBE.** Selection cannot repair a world that supports only near-perfect controllers or a colony lifecycle that is not closed. |
| Mutation rate increases as the response to low heritability | **Rejected.** Low selection signal is an environmental/design problem and extra variation increases noise. |
| Self-adaptive mutation without a floor or exploration stream | **Rejected.** Selection near an optimum drives mutation scale toward zero. |
| One structured founder seed with no portfolio or lock instrumentation | **OBE.** It cannot distinguish evolved persistence from initialization pre-lock. |
| Cheap or inherited lifetime learning | **Rejected by default.** It masks genetic differences or changes the experiment to Lamarckian inheritance. |
| Authored caste types or fixed feeding-to-size outcomes | **OBE.** Genomic reaction norms and local demand allow morphs and roles to emerge. |
| Automatic continuation as the metapopulation process | **Rejected for evidence.** Sustainable founding and ecological recovery must occur inside the world; operational continuation remains outside certification. |
| Defensible architecture before inter-colony or threat pressure | **Rejected.** The behavior has no paying selection channel and would be decorative. |
| NEAT-style topology evolution as the next controller | **Deferred.** It assumes generational speciation machinery; fixed RNN and linear GP answer nearer questions first. |
| WebGPU or world-layout rewrites before profiling | **Deferred.** World active sets, memory layout, WASM, and GPU work follow measured bottlenecks. |

<a id="advanced-sources"></a>

## Source provenance

Primary source sections: [design specification §§2–3 and §§7–14](../sources/design-spec.md),
[Appendix A](../sources/ant-sim-appendix-a.md),
[Appendix B §§B.7–B.9](../sources/ant-sim-appendix-b.md),
[Appendix E after the summit](../sources/ant-sim-appendix-e.md),
[Appendix E2 transferability tiers](../sources/ant-sim-appendix-e2.md),
[Appendix F controller decision](../sources/ant-sim-appendix-f.md), and
[Appendix G genetic and threat floors](../sources/ant-sim-appendix-g.md).
