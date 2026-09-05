# Experimentation, harness, and certification

This document owns how Antropy asks questions, separates causes, records measurements, trains
initial controllers, and certifies claims. Experiments may score and hard-code. The evolving
population may not.

<a id="experimentation-boundary"></a>

## Evidence boundary

Vitest covers bounded deterministic mechanics and integration invariants: conservation, sensor
marshalling, action preconditions, configuration isolation, checkpoint round trips, and small
fixtures. Long-horizon survival, training, controller comparisons, morphology, and stochastic
outcomes run through the harness and write provenance to `frontend/harness/ledger.db`.

The certification ledger interprets named runs against written gates. It does not turn every
measurement into a new gate. A source document or conversation cannot make contradictory evidence
green.

<a id="experimentation-loop"></a>

## Work loop

Each experiment follows one sequence:

1. Classify the proposed change as world, interface, seed, parameter, or oracle work.
2. Check interface legality and genome ownership where applicable.
3. State the governing inequality and predicted change in the colony's master ledger.
4. Change one mechanism, gate, or parameter axis.
5. Measure through the smallest oracle, harness scenario, and seed distribution that answer the
   question.
6. Compare the prediction with the result. After two material contradictions, a stop signature,
   or the three-configuration budget, write a structural finding rather than another tuning run.

A structural finding records the invariance, mechanism hypothesis, smallest legal fix, reopened
gates and recalibration cost, and the decision reserved for the human.

<a id="experimentation-oracles"></a>

## Oracle ladder and parity

Oracles are readable diagnostic policies driving the real body. They emit the same output tuple as
controllers and receive the same world resolution. A sensor-limited oracle receives the shipped
sensor vector plus its private state, never coordinates or a world reference. An omniscient oracle
may use world knowledge only when measuring a world ceiling, and its behavior is not a training
target.

The ordered fault isolation is:

1. **Omniscient world ceiling:** can any competent policy survive the economy?
2. **Sensor-limited policy:** can the shipped interface express the task?
3. **Bounded controller assays:** are inputs and outputs wired as intended?
4. **Degraded policy:** how much sensor/actuation error can the world tolerate?
5. **Controller cohort:** does one predetermined initialization procedure place a broad population
   in the viable region?

An oracle success and controller failure localize the remaining fault only when parity and the
preceding mechanics checks hold.

<a id="experimentation-calibration"></a>

## Calibration and comparative experiments

World tuning uses dimensionless relationships rather than isolated constants: trip profitability,
satiation, scent horizon, foraging radius, trail lifetime, excavation payback, and ecosystem
closure. A sweep first maps viability with readable policies, then repeats the same worlds with a
fixed controller population. Defaults belong inside the viable region, not on its zero boundary.

Comparative experiments change one treatment and use one master ledger. Construction comparisons
use worker-days, net nest energy, brood survival, stockpile retention, or persistence. Liability
ablations must remove the corresponding strategy advantage. Partial construction must show smooth
marginal benefit before evolution is expected to cross it.

Common world seeds within a comparison, independent untouched panels for final judgment, mirrored
samples where evolution strategies are used, deterministic jitter, and explicit world/config
provenance reduce noise without hiding variation. Behavioral claims vary worlds, food placement,
starts, and headings.

When genetic variation is off, evaluation materializes one controller genome and clones that exact
serialized value into every comparison world. A world seed may change terrain, food, headings, and
jitter; it must not silently select a different controller. Otherwise a multi-world score averages
different agents and turns controller evaluation into a noise source.

<a id="experimentation-training"></a>

## Controller initialization experiments

Capacity is measured, not inferred from universal approximation. Start with a state-variable
audit, construct simple reflexes directly, then use an offline training probe when a competence is
not hand-verifiable. Failure under direct optimization can indict capacity; easy fit clears only
representation, not in-world selection.

The intended food-loop initializer distills the sensor-limited policy into the existing RNN. The
current programmed teacher has no private state: body heading persists, the shared locomotion
resolver handles contact, and ordinary scent/depth inputs separate entrance, food, and homing
contexts. Training therefore uses balanced independent sensor/output frames while recurrence
remains initialized and held at zero.
One fixed procedure applies to each predetermined start. Acceptance comes from the whole cohort on
untouched closed-loop worlds and a separate energy-support panel. Teacher loss remains diagnostic
rather than an outcome gate.

Behavioral assays remain diagnostics during search. A candidate that violates a designer's
expected reflex but improves untouched colony ledgers may have found a better behavior. Hard
rejection is reserved for mechanics and interface violations.

<a id="experimentation-robustness"></a>

## Mutational robustness and viable space

Every certified initialization substrate is perturbed at increasing production mutation scales. The curve
of retained colony performance estimates the width and flatness of the viable region. A gradual
decline leaves evolutionary room; a cliff means the seed occupies an unstable peak even if its
unperturbed ledger is good.

The curve compares controller substrates after the smallest honest behavioral target has been
established. It does not justify selecting the best sample from a failed cohort.

<a id="experimentation-resilience"></a>

## Colony resilience curve

The colony-level companion to mutational robustness starts from a healthy colony, removes a
controlled fraction of workers or energy, and measures recovery probability and time across the
world-seed distribution. The perturbation at which recovery falls below 50% estimates the basin of
attraction around viability.

The harness records an untreated baseline before any floor mechanism. If a later mortality or
replacement result justifies one conditional floor, rerun the identical curve and the healthy
colony ledger so recovery is not purchased by making healthy reproduction worse or the floor
attractive.

Recovery means regaining 90% of the pre-shock worker count for a workforce shock or 90% of mean
worker energy for an energy shock. Four worlds are sufficient for an exploratory comparison;
certification uses at least eight, with the same warmed state reused across treatment arms. The
largest shock recovered by at least half the worlds is the reported basin edge.

The current implementation sequence uses these quantitative gates before any tuning:

| Gate                        | Predeclared acceptance                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mortality admission         | With mortality and queen upkeep as the only new gates, at least 6/8 worlds retain a living queen and 30 workers through 4,200 ticks—two complete 2,100-tick replacement latencies. Death cause, energy removed at death, and recycled corpse energy are attributable; no tick loses more than four bootstrap workers to an initialization artifact; energy residual is at most `1e-8`. |
| Resource-funded replacement | A reared worker costs its genome endowment plus `COLONY.eggLayCost` plus `LARVA.rearingCost`; the current founder value is `1.0`. The first possible worker matures by tick 2,100, every birth is conserved through the brood ledger, and post-pipeline births equal or exceed natural deaths in at least 6/8 worlds without external replenishment.                                   |
| Fixed-genome continuity     | One 24,000-tick smoke crosses the 20,000-tick founder lifespan; four new varied worlds repeat it. Every world keeps the queen alive, ends with post-4,200 births at least deaths, keeps population in `[20, 80]`, and does not lose colony energy relative to tick 4,200. Automatic continuation remains off and conservation residual remains at most `1e-8`.                         |
| In-world selection          | On at least 16 paired continuous worlds, a heritable genome or trait change has a positive parent-offspring estimate and improves survival, reproduction, or conserved colony energy relative to both fixed-genome and neutral-parent controls; the paired 95% bootstrap interval excludes zero. No explicit fitness or offline replacement enters the population.                     |

<a id="experimentation-observation"></a>

## Observation without prescription

Descriptive instruments may compute chambers, voids, branches, cache and brood positions, scent
field shape, path efficiency, route traces, caste-like groupings, and trail networks. These
measurements explain a winning strategy but do not define success.

Shortest-path and field analyzers may verify world connectivity and grade realized efficiency.
Event detection may later identify colony births/deaths, lineage-share changes, gene excursions,
depth and spoil records, and local resource-regime transitions, then link observers to a prior
checkpoint. Detection never affects selection.

<a id="experimentation-order"></a>

## Linear implementation order

| ID     | Status                                        | Work and finish                                                                                                                                                                                                                                                                        |
| ------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXP-01 | Delivered                                     | Deterministic simulation seeds, checkpoint provenance, bounded mechanics tests, and a parameterized harness writing git/config/run metadata to SQLite.                                                                                                                                 |
| EXP-02 | Delivered                                     | Layer classification, interface legality tests, inequality-first tuning, stop signatures, and the five-part structural-finding discipline govern work.                                                                                                                                 |
| EXP-03 | Delivered                                     | Shared-action oracle infrastructure, omniscient and sensor-limited policies, bounded controller assays, degradation tools, and world-versus-controller fault isolation.                                                                                                                |
| EXP-04 | Delivered                                     | Viability ratios, calibration sweeps, strategy tournaments, liability ablations, and interpreted calibration/certification ledgers exist.                                                                                                                                              |
| EXP-05 | Implemented; review pending                   | One bounded exact-web-world check and untouched harness runs 2438–2441 measure population ratios over 500 ticks. All 4/4 harness worlds clear exit, sampled surface presence, external-food participation, loaded return, and repeated productive-window floors. Human review remains. |
| EXP-06 | Backlog, reopened                             | Train balanced independent frames from the reviewed stateless policy, then evaluate the predetermined cohort. No terminal outcome selection or controller-specific repair.                                                                                                             |
| EXP-07 | Backlog, reopened                             | Repeat the production-mutation robustness curve for the newly certified cohort. The former curve describes an invalidated controller baseline.                                                                                                                                         |
| EXP-08 | Delivered instrument; recertification pending | The reusable colony-resilience harness records matched shocks, conserved energy, lifecycle attribution, and demographic time series. Repeat the untreated baseline after EXP-05–EXP-07.                                                                                                |
| EXP-09 | Backlog, reopened                             | Rerun mortality, resource-funded replacement, and fixed-genome continuity after the controller baseline passes. Runs 1927–1963 remain historical evidence.                                                                                                                             |
| EXP-10 | Backlog                                       | Add standing path-efficiency measurement to food and homing trips. Keep shortest-path planning outside sensor-limited behavior.                                                                                                                                                        |
| EXP-11 | Delivered / backlog                           | Live completed-life heritability, effective population, genetic diversity, founder distance, and line survival are persisted with sample counts and unavailable states. Naive-versus-experienced assays remain ordered before plasticity.                                              |
| EXP-12 | Backlog                                       | Add event detection, lineage/genome exploration, controller-agnostic offline assay UI, headless burst execution, and checkpoint-linked replay for long evolutionary runs.                                                                                                              |
| EXP-13 | Backlog                                       | Before reintroducing digging, establish authored-versus-dug paired ledger scenarios and descriptive morphometrics in the harness.                                                                                                                                                      |

<a id="experimentation-obe"></a>

## OBE and invalid evidence

| Direction or evidence                                                                                                                                                      | Status and reason                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-minute behavioral outcome tests in normal or slow Vitest gates                                                                                                       | **OBE.** They proved fixture-specific trajectories and made routine validation expensive. Their mechanics were retained; their claims require harness runs.      |
| Single-ant entrance-adjacent forage assays as colony certification                                                                                                         | **Invalid.** Removing 39 workers, filling the survivor's tank, and placing food beside the mouth did not exercise the exact web population or its environment.   |
| Fixed-seed nest-shape, brood-cohort, and storm-cache assays as current certification                                                                                       | **OBE.** World and carrier changes invalidated them. Historical measurements remain in the certification ledger.                                                 |
| Milestone success that allows pickup before surface exit or return before surface pickup                                                                                   | **Invalid.** A round trip is an ordered physical event sequence. Corrected aggregation rejects impossible historical combinations.                               |
| Strict field-gradient success from every voxel                                                                                                                             | **OBE as a gate.** The sealed entrance contains a local maximum while agents still complete the functional loop. Field analysis remains descriptive.             |
| Teacher-trajectory loss as controller acceptance                                                                                                                           | **Rejected.** Similar loss produced materially different closed-loop behavior.                                                                                   |
| More sequence epochs, rare-action weights, selected validation epochs, successful-world filtering, long recurrent chunks, or parameter noise applied to the former teacher | **OBE.** Measured sweeps did not broaden that controller cohort; this does not answer the new short-sequence target.                                             |
| Guarded or changing-world terminal outcome search                                                                                                                          | **OBE.** It overfit consulted worlds or degraded the initial controller and solved the wrong post-Appendix-F problem.                                            |
| Milestone reward shaping for initial food-loop training                                                                                                                    | **OBE.** It was proposed to repair outcome search; direct policy distillation is the current initializer. It remains a diagnostic pattern, not a training stage. |
| Behavioral reflex assays as hard optimization constraints                                                                                                                  | **Rejected.** They protect the designer's decomposition instead of controller function.                                                                          |
| Single best controller, single seed, or positive median as a population claim                                                                                              | **Rejected.** Cohort breadth and unseen-world distributions are the acceptance unit.                                                                             |
| Auto-continue in measured runs                                                                                                                                             | **Rejected.** It masks colony death, which is the datum under study.                                                                                             |

<a id="experimentation-sources"></a>

## Source provenance

Primary source sections: [design specification §§10–13](../sources/design-spec.md),
[Appendix A §§A.2–A.3 and A.11](../sources/ant-sim-appendix-a.md),
[Appendix B §§B.2–B.6 and B.8](../sources/ant-sim-appendix-b.md),
[Appendix C](../sources/ant-sim-appendix-c.md),
[Appendix D ladders and classifier](../sources/ant-sim-appendix-d.md),
[Appendix E](../sources/ant-sim-appendix-e.md),
[Appendix E2](../sources/ant-sim-appendix-e2.md),
[Appendix F §§F.1 and F.5](../sources/ant-sim-appendix-f.md),
[Appendix G §G.3](../sources/ant-sim-appendix-g.md),
[Appendix H](../sources/ant-sim-appendix-h.md), and both archived review notes in
[the source index](../sources/README.md#historical-execution-sources).
