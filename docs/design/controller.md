# Controller, genome, and embodiment

This document owns what an ant can sense, what it can intend, how a controller maps one to the
other, and how that mapping is inherited. It normalizes the controller portions of the original
specification and Appendices A–H. Evidence belongs in [certifications](../certifications.md), not
in this design.

<a id="controller-goal"></a>

## Goal and boundary

The current controller goal is a broad class of initial genomes that can run the authored-nest
food loop while leaving room for selection to improve them. The seed is a viable starting
condition, not a peak to preserve. Behavior remains genome-owned from the first tick.

The world may expose local physical facts. It may not expose a home bearing, selected destination,
safe-place label, desired action, or automatically chosen target. A programmed policy may be used
as a diagnostic teacher only through the same production interface.

<a id="controller-contract"></a>

## Controller and body contract

Controllers implement `act`, `mutate`, `recombine`, and `seed`. Ploidy and genome layout remain
behind this contract. The rest of the simulation sees controller-agnostic genomes, transient
controller state, outputs, and physical traits.

The current body has continuous yaw and no pitch. Vertical bias selects an adjacent action band;
it is attention, not body rotation. Directional sensors expose every vertical band in the same
tick used for action, so an ant can compare above, level, and below without scanning or remembering
an earlier sample. The current threshold-band resolver remains authoritative.

The eight outputs are turn, forward thrust, vertical bias, pheromone A, pheromone B, eat, lay egg,
and the shared mandible trigger. World preconditions give the mandible trigger its local meaning:
excavate diggable solid, collect contacted cargo when unloaded, or deposit carried spoil, food, or
brood into air. Failed excavation has a token cost. Rock is undiggable. No ninth drop action and no
oracle-only action path are permitted.

<a id="controller-senses"></a>

## Sensory surface

The interface exposes normalized, local, fallible observations:

- stereo and vertical-band samples for the five scent fields, including center, up/down, vertical
  stereo, directly ahead at each height, and phasic change values;
- food scent, deep-nest scent, colony/material odor (including contact-marked handled food), and the
  two unlabeled pheromone carriers without controller-side semantic labels;
- energy, age, load fraction, carried material, body scale, local slope and solidity, crowding,
  temperature, and contact with food, brood, or ants.

The current append-only tuple has 120 inputs. The fifteen newest channels sample the voxel directly
ahead for each scent and vertical band; they close the physical blind spot between the two diagonal
antennae without reporting a bearing or destination. Parallel vertical and phasic readings are body
facts: receptor adaptation and spatial sampling expose world state without deciding how the ant
should respond. Colony odor and handled-food odor can fade, wash out, transfer to the wrong object,
or be absent, so they remain senses rather than answers. Older 23- and 105-input RNN artifacts are
migrated with the new receptors disconnected.

Future senses must pass the carrier, locality, cost, question-not-answer, and evolutionary-
displacement tests in [the principles](../principles.md#principles-layers). Sun or polarized-light
azimuth can qualify; home direction, food direction, danger, and should-dig signals do not.

<a id="controller-rnn"></a>

## Current RNN

The production controller is a fixed-topology tanh RNN with 12 recurrent hidden units and eight
outputs. Behavioral weights and seven physical genes form the genome. Recurrence is part of every
genome. The rejected Appendix H teacher was a pure function of one sensor frame, but direct review
found universal translated-circle motion and entrance congestion. A fresh sensor-limited
single-forager now passes the matched five-load gate, but it is not an accepted RNN teacher until
its trajectory passes human review. Recurrence remains available to evolution; its initialization
is undecided until that review.

Female ants express two genome copies; haploid males express one. Mutation occurs at egg creation.
Physical genes currently cover body scale, leg length, sensor gain, storage, egg endowment,
lifespan, and mutation scale. Each capability has an energy, speed, or opportunity cost. A global
constant must not pin one of these traits.

Deterministic motor jitter varies by world seed, ant identity, and tick. It prevents colocated ants
from remaining in artificial lockstep while preserving reproducibility.

<a id="controller-initialization"></a>

## Initialization and seeded competences

The authored-nest colony is intended to use one predetermined RNN initialization trained from an
accepted sensor-limited programmed policy. The former Appendix H policy is not that teacher: its
population ratios passed while every visible ant circled and workers accumulated at the entrance.
The accepted physical ceiling and the fresh candidate now appear as matched web scenarios. The
full-map ant reads food coordinates and the complete legal movement graph. The candidate receives
only the current shipped sensor tuple and has no private state. Physical pheromone A records its
nest-to-entrance traffic. It follows natural food odor outside and natural nest odor while loaded;
no food or larder route is written into either pheromone field.

Runs 2460–2462 record five external-food returns from each arm into the same queen-core
neighborhood. The candidate finished 1.8–6.9% faster than the full-map arm and made no immediate
turn reversals. The harness counts crop deliveries and physical cache deposits together, while
requiring five external pickups so recycled food cannot pass the gate. Human trajectory review is
the remaining teacher gate. After acceptance, one fixed initialization procedure and whole-cohort
judgment on untouched worlds can resume. No controller receives terminal outcome polishing or
individual repair.

The separately retained construction seed proves six local competences are expressible without
memory: marked-site dig-down, spoil haul and deposit, mark amplification, crowding overflow,
trail reacquisition by casting, and local brood/food transport. Its exact weights remain in the
[archived seed specification](../sources/seed-spec.md). This seed is a delivered diagnostic
artifact, not the current colony controller or a required evolved topology.

<a id="controller-memory"></a>

## Memory and navigation

Memory belongs at the timescale of the regularity it stores: recurrent activations hold immediate
context, future plastic state holds within-lifetime experience, scent fields hold shared colony
memory, and genomes hold recurring environmental structure.

Nest and food navigation currently use taxis on diffusing fields. The field computes topology-
respecting potential; the ant reads local samples. Path integration is representable with two
recurrent accumulators but requires a delicate near-marginal regime and is never a bootstrap
dependency. Learned routes and place memory arrive with within-lifetime plasticity. Algorithmic
graph search inside the ant is outside the intended controller problem.

<a id="controller-search"></a>

## Search without a target signal

The rejected Appendix H worker used this ordered policy over ordinary senses and actions:

```text
IF carrying food
    follow deep-nest odor; deposit after returning underground
ELSE IF touching food
    eat when hungry; otherwise pick it up
ELSE IF below the surface in colony odor
    follow marked stored food when hungry; otherwise follow the entrance trail
ELSE IF food scent is detectable
    follow its local gradient
ELSE IF energy can cover the return reserve
    keep the current heading
ELSE
    follow deep-nest odor
```

This decomposition remains historical design input, not an accepted implementation. Human review
showed that its steering composition produced translated circles in open terrain and chambers, and
that more than half of the workers could accumulate at the nest mouth within 100 ticks.

Authored route marks are a configurable initial condition of the artificial mature world, not an
ant-side route. The colony fixture uses ordinary owner-tagged pheromone A for standing traffic to
the entrance. The matched single-forager fixture seeds only its one worker's queen-to-entrance
traffic trace. Outside that trace it navigates with emitted food odor and the queen's diffusing nest
odor. All carriers are sampled through the same center, stereo, directly-ahead, and vertical
channels available to an RNN. Local positive depth plus colony odor establishes nest context; odor
leaking around the mouth does not classify surface workers as still inside.

The heading persists across ticks. Motor jitter differentiates ants but does not select a new
heading every frame. A blocked thrust is resolved by shared locomotion: try the controller's full
vertical/sloped step set, then local yaw alternatives by increasing angular distance, retaining the
first legal physical heading. This applies to every controller and target context; it is neither a
food-policy mode nor remembered wall-side state.

Food contact or a stronger adjacent food carrier immediately preempts search. The programmed policy
rotates in place by one lattice octant until its strongest sensed neighbor is directly ahead, then
steps; it never turns while translating. Moderate vertical bias selects the sensed forward slope,
while near-maximal bias selects the sensed voxel directly above or below. Unloaded nest egress
requires both a strong local A trace and decreasing nest odor, so diffusion halo cannot pull the ant
off the trace. Loaded homing climbs the natural nest-odor gradient and unloads only at its physical
source neighborhood. This policy is entirely current-frame and uses body heading as ordinary
physical orientation, not controller memory.

The return threshold follows this governing inequality:

`return reserve >= maximum homing cost from the blind-search radius + safety margin`.

The current unloaded outward and home marginal costs are equal, so the implemented reserve is one
half of the normalized tank. That value follows the cost equality rather than an arbitrary
percentage. The threshold becomes a genome-derived risk trait when standing variation is admitted.

The mature fixture starts workers at a tunable full-tank fraction. The prior `1/8` start plus one
`2.4/8` meal reached only `0.425`, below the `0.5` return reserve, so initialization—not ongoing
work cost—forced a newly fed worker home before its first transport. Long-horizon energy balance
remains a separate colony gate. Sky-connected light, airflow, personal breadcrumbs, and path
integration remain later evolutionary candidates rather than bootstrap dependencies.

<a id="controller-order"></a>

## Linear implementation order

| ID      | Status                            | Work and finish                                                                                                                                                                                                                                                                      |
| ------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CTRL-01 | Delivered                         | Pluggable controller contract; no non-controller module inspects genome internals.                                                                                                                                                                                                   |
| CTRL-02 | Delivered                         | Fixed 12-unit RNN, diploid females, haploid males, seven physical genes, mutation, recombination, and per-tick cognition cost.                                                                                                                                                       |
| CTRL-03 | Delivered                         | Shared eight-output body resolver with yaw-only embodiment, local mandible preconditions, failed-dig cost, and no privileged oracle action.                                                                                                                                          |
| CTRL-04 | Delivered                         | Honest 120-input surface with parallel vertical bands, direct-ahead scent samples, phasic sensing, deep nest field, absorbed colony odor, handled-food marking, temperature, contacts, and load/body state. Older RNN artifacts migrate with new inputs disconnected.                |
| CTRL-05 | Delivered                         | Deterministic per-ant motor jitter and checkpointed controller/sensory state.                                                                                                                                                                                                        |
| CTRL-13 | Implemented; human review pending | The former policy and runs 2438–2441 remain invalid. Its stateless replacement receives only shipped sensors and passes the five-return, larder-neighborhood, slowdown, and turn-reversal gates in runs 2460–2462 without full-map access.                                           |
| CTRL-06 | Backlog, blocked                  | Review the fresh sensor-limited trajectory, then train one predetermined RNN initialization procedure and judge its whole cohort on untouched worlds. The omniscient policy is never a teacher.                                                                                      |
| CTRL-07 | Delivered                         | Five construction reflexes plus local cargo transport exist as an isolated, zero-recurrence diagnostic seed. Construction remains off in the current colony world.                                                                                                                   |
| CTRL-08 | Backlog                           | Extend the initial seed portfolio with independently predetermined forager, wander-heavy, pheromone-reactive, construction, and unstructured minorities; assess the whole distribution rather than selecting winners. This waits for the living-colony summit and genetic variation. |
| CTRL-09 | Backlog                           | Add convention-aligned hidden-unit matching inside RNN recombination before evolved synaptic plasticity makes representation mismatch more damaging.                                                                                                                                 |
| CTRL-10 | Backlog                           | Add metabolically priced, neuromodulated within-lifetime plasticity only after its colony-level selection environment and naive-versus-experienced assay exist.                                                                                                                      |
| CTRL-11 | Backlog                           | Implement linear genetic programming behind the same contract, with persistent registers, homologous program variation, per-instruction energy cost, and architected plastic registers. Compare substrates by viable-space and colony ledgers.                                       |
| CTRL-12 | Backlog                           | Consider path integration, learned routes, or additional controller memory only as evolutionary upgrades supported by measurements; none may become initial viability requirements.                                                                                                  |

<a id="controller-obe"></a>

## OBE and rejected directions

| Direction                                                                              | Status and reason                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One hand-constrained reflex topology as the complete colony controller                 | **OBE.** It optimized a designer-selected problem and did not represent the broad initialization goal. The construction seed remains an assay artifact.                                                                            |
| Stateful eighteen-field food-loop oracle                                               | **OBE.** World carriers and parallel local sampling removed its task timers, remembered samples, wall-side state, entrance protocol, and final actuator-synchronization bit. The fresh single-forager is stateless.                |
| Sequence cloning followed by terminal evolution-strategy search                        | **OBE.** Teacher loss did not predict closed-loop behavior, and a 24-generation terminal run consumed 42.9 minutes while degrading completion. Balanced independent-frame distillation replaced it.                                |
| Controller-specific acceptance, best-of-run baking, or hard behavioral assay rejection | **OBE.** Predetermined cohorts receive one procedure and are judged as a distribution on untouched worlds. Behavioral assays diagnose; mechanics remain hard checks.                                                               |
| Home-angle, home-distance, chosen destination, storage-room, or should-dig inputs      | **Rejected.** They provide answers without carriers and displace navigation or task choice.                                                                                                                                        |
| Procedural memory wrapped around the network                                           | **Rejected.** It creates a second unattributable controller.                                                                                                                                                                       |
| Attention heads for scalar ant inputs                                                  | **Rejected.** The input has no token structure and current evidence does not justify the mechanism.                                                                                                                                |
| Task latches, frame stacking, or another pheromone stream for the food loop            | **OBE for the current target.** Existing carriers, body heading, phasic inputs, and shared contact resolution cover the programmed loop without private oracle state. A future structural finding may reopen a specific mechanism. |
| Continuous preference resolver as an automatic replacement for threshold bands         | **OBE.** Parallel band sensing repaired the measured defect. Migration requires a new finding that band quantization blocks a colony ledger and would reopen interface assays.                                                     |
| Naively random RNN founders as the only starting population                            | **Rejected.** Most starve before continuous selection can discover viability. Unstructured minorities remain valid within a viable portfolio.                                                                                      |
| Parameterized authored behavior, tree GP, or algorithmic pathfinding                   | **Rejected.** They either cap evolution at the authored algorithm, produce destructive/rugged variation, or solve the navigation problem outside the intended substrate.                                                           |

<a id="controller-sources"></a>

## Source provenance

Primary source sections: [design specification §§2–4 and §10](../sources/design-spec.md),
[Appendix A §§A.4–A.9](../sources/ant-sim-appendix-a.md),
[Appendix B §B.2 and §B.9](../sources/ant-sim-appendix-b.md),
[Appendix C §§C.2–C.3](../sources/ant-sim-appendix-c.md),
[Appendix D §§D.2–D.3](../sources/ant-sim-appendix-d.md),
[Appendix E §§foundation and ladder](../sources/ant-sim-appendix-e.md),
[Appendix E2](../sources/ant-sim-appendix-e2.md), and
[Appendix F](../sources/ant-sim-appendix-f.md), and
[Appendix H](../sources/ant-sim-appendix-h.md).
