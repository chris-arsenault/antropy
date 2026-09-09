# Experimentation, harness, and certification

This document owns how behavioral and world claims are separated, measured, and accepted.

Current work follows [the 2,000-worker milestone](colony-scale.md). The programmed/LGP comparison
is implemented; unfinished RNN plans are canceled. Neural protocols below are historical evidence,
not pending training or prerequisites. Measure physical capacity and computational cost separately
before genetic experiments.

<a id="experimentation-boundary"></a>

## Evidence boundary

Vitest proves bounded deterministic mechanics and integration invariants. The harness measures
behavior over time and persists results in SQLite. Human review decides visible trajectory
quality. None substitutes for another.

Every result records the world seed, parameters, controller arm, tick cap, commit state, wall time,
and summary. A single seed can prove deterministic mechanics; behavioral claims require a declared
panel of varied worlds.

<a id="experimentation-loop"></a>

## Work loop

1. Name the colony or evolutionary question and the owning layer.
2. State the governing inequality or predicted metric movement.
3. Run the simplest readable policy through the production action path.
4. Change one mechanism or parameter.
5. Compare ratios, medians, and changes over time across seeded worlds.
6. Stop after repeated invariance or exhausted tuning and record the structural finding.

A finding records observed invariance, mechanism hypothesis, smallest structural fix, cost of
recalibration, and the decision needed. Do not silently change the gate to fit the result.

<a id="experimentation-oracles"></a>

## Oracle ladder and parity

The retained immortal-forager ladder has three arms. The current programmed colony uses its own
survival and deprivation campaign described in [the colony contract](programmed-colony.md).
The subsequent user-authorized [colony training study](colony-training.md) is complete and failed;
its held-out and perturbation results do not certify a neural controller. The map-aware policy answers whether the world admits repeated
physical foraging at all. The stateless local-sensor policy answers whether available carriers
support the same loop without privileged knowledge. The recurrent arm tests whether the current
neural representation and initialization can close that loop. All use identical world generation
and the same turn, move, mandible, and pheromone resolver.

The oracle may inspect the map only because it is clearly named and quarantined from future
populations. It is a ceiling and diagnostic, not a training target or permission to add map inputs.

<a id="experimentation-calibration"></a>

## Calibration and comparative experiments

`pnpm harness forager-comparison` runs all three arms on identical seeded-random layouts. The
declared panel is seeds 1–8, five completed loads per successful arm, and a 5,000-tick cap. The
programmed panel passes when at least 75% of its worlds complete, median programmed completion
overhead is at most 10%, and immediate turn reversals are at most 2% of ticks. RNN completion is
reported separately and cannot be hidden by the programmed pass.

The harness also records route overhead, turn count, failed movement, pickup and deposit ticks, and
energy cost. Those are diagnostic metrics rather than extra pass gates.

<a id="experimentation-training"></a>

## Controller initialization experiments

The historical recurrent experiments progressed from 24 units to the current 32+32 model. Balanced programmed frames are
paired with their exact action frame, counterfactual jitter/handedness prevents seed-identity
shortcuts, and DAgger rounds retain every prior off-policy dataset. Explicit competing motor heads
remove the signed-turn dead zone. The resulting seed still completes 0/8 in run 2492, so no neural
behavior is certified.

Any next initialization must be evaluated as a distribution: predetermined starts on held-out
worlds, no terminal polishing, no selection of one lucky run, and no privileged interaction space.
Linear genetic programming is implemented as the first evolutionary substrate. RNN repair is
canceled, and neither fitting nor a new mutation search precedes the population-scale milestone.

The subsequent user decision authorizes [physical outcome training](outcome-training.md): real
queen survival, recipient feeding, funded replacement and conservation replace action agreement
as the optimizer objective. Assisted-start curricula are labeled and cannot pass the survival
gate. Only fresh-world, long-horizon runs can establish a viable candidate; perturbation and visual
review remain separate requirements.

<a id="experimentation-robustness"></a>

## Mutational robustness and viable space

Once a heritable controller exists, measure completion across perturbation radius and across
unseen worlds. Report the width and occupancy of the viable region, not just the best score. A
single optimum surrounded by failure is an unsuitable founder condition even if it passes.

<a id="experimentation-resilience"></a>

## Colony resilience curve

After a multi-worker sustainable baseline exists, restore exact snapshots into matched untreated,
worker-loss, and resource-loss arms. Measure survival, worker ratio, resource balance, recovery
time, brood flow, and complete-turnover persistence. Add biological floors only after the untreated
curve exposes a specific failure.

<a id="experimentation-observation"></a>

## Observation without prescription

Record routes, occupancy, clustering, cache locations, fields, branches, chamber shapes, lineage,
and event traces to explain results. Do not make those forms pass conditions. Human trajectory
review is required when aggregates can hide circling, congestion, drift, or invisible cargo.

<a id="experimentation-order"></a>

## Linear implementation order

| ID | Status | Finish |
| --- | --- | --- |
| EXP-01 | Delivered | Seeded mechanics, checkpoints, bounded tests, and ledger provenance |
| EXP-02 | Delivered | Matched map-aware, programmed, and recurrent single-forager harness |
| EXP-03 | Delivered | Run 2492 programmed pass and explicit recurrent failure across eight randomized worlds |
| EXP-04 | Review gate retained | Review changed physical behavior and traffic at scale; no RNN acceptance prerequisite |
| EXP-05 | Historical evidence; remaining RNN work canceled | Preserve neural successes under old rules and subsequent failures; LGP direction is settled |
| EXP-06 | Implemented; visual review pending | Multi-worker ratios and time-sampled participation without luck or perfection gates |
| EXP-07 | Measured for the programmed colony | Broad resource-economy calibration before mortality |
| EXP-08 | Delivered harness | Held-out viability and weight perturbation measurements; no viable learned region found |
| EXP-09 | Partly delivered | Mortality, replacement and deprivation panels exist; inheritance and selection remain off |
| EXP-10 | Delivered | Programmed/LGP compact outcomes match at 48,000 ticks; programmed reference also passes |
| EXP-11 | Next milestone | Capacity budgets, 200/500/1,000/2,000-worker performance measurements and sustained demographic panel |
| EXP-12 | Delivered assessment | Initial 8/2,000-worker Node and headless Canvas probes; sustainable 2,000-worker population remains unmeasured |

<a id="experimentation-obe"></a>

## OBE and invalid evidence

- Long-running simulation tests, exact tick snapshots, and multi-minute CI gates are rejected.
- Earlier population gates that passed while creatures visibly circled or congested are invalid.
- Old spatial-world ledger rows remain evidence about that world but cannot certify the 2D system.
- Stale-frame imitation, non-aggregating DAgger, searching for one perfect genome, or tuning an
  immortal world for later mortality is rejected.

<a id="experimentation-sources"></a>

## Source provenance

The archived appendices contain oracle ladders, layer classification, tuning stop conditions,
comparative strategy tests, liability ablations, controller-capacity probes, resilience curves,
heritability, effective population, and compute-budget proposals. They remain design input through
[source coverage](source-coverage.md), with obsolete gates explicitly displaced by this protocol.
