# Controller, genome, and embodiment

This document owns what an ant can sense, what it can intend, how a controller maps one to the
other, and how that mapping is inherited. It normalizes the controller portions of the original
specification and Appendices A–F. Evidence belongs in [certifications](../certifications.md), not
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
  stereo, and phasic change values;
- food scent, deep-nest scent, colony/material odor (including contact-marked handled food), and the
  two unlabeled pheromone carriers without controller-side semantic labels;
- energy, age, load fraction, carried material, body scale, local slope and solidity, crowding,
  temperature, and contact with food, brood, or ants.

The current append-only tuple has 105 inputs. Parallel vertical and phasic readings are body facts:
receptor adaptation and spatial sampling expose world state without deciding how the ant should
respond. Colony odor and handled-food odor can fade, wash out, transfer to the wrong object, or be
absent, so they remain senses rather than answers.

Future senses must pass the carrier, locality, cost, question-not-answer, and evolutionary-
displacement tests in [the principles](../principles.md#principles-layers). Sun or polarized-light
azimuth can qualify; home direction, food direction, danger, and should-dig signals do not.

<a id="controller-rnn"></a>

## Current RNN

The production controller is a fixed-topology tanh RNN with 12 recurrent hidden units and eight
outputs. Behavioral weights and seven physical genes form the genome. Recurrence is part of every
genome even though the current initializer holds recurrent weights at zero while fitting the
same-frame food-loop policy. Later mutation may recruit memory without an architecture migration.

Female ants express two genome copies; haploid males express one. Mutation occurs at egg creation.
Physical genes currently cover body scale, leg length, sensor gain, storage, egg endowment,
lifespan, and mutation scale. Each capability has an energy, speed, or opportunity cost. A global
constant must not pin one of these traits.

Deterministic motor jitter varies by world seed, ant identity, and tick. It prevents colocated ants
from remaining in artificial lockstep while preserving reproducibility.

<a id="controller-initialization"></a>

## Initialization and seeded competences

The authored-nest colony uses one predetermined RNN initialization trained from balanced,
shuffled, independent sensor/output frames emitted by the zero-state programmed policy. Every
frame resets hidden state; recurrence starts and remains zero during initialization. All
predetermined starts receive the same corpus construction, epoch budget, and acceptance process.
No controller receives terminal outcome polishing or individual repair.

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

<a id="controller-order"></a>

## Linear implementation order

| ID | Status | Work and finish |
| --- | --- | --- |
| CTRL-01 | Delivered | Pluggable controller contract; no non-controller module inspects genome internals. |
| CTRL-02 | Delivered | Fixed 12-unit RNN, diploid females, haploid males, seven physical genes, mutation, recombination, and per-tick cognition cost. |
| CTRL-03 | Delivered | Shared eight-output body resolver with yaw-only embodiment, local mandible preconditions, failed-dig cost, and no privileged oracle action. |
| CTRL-04 | Delivered | Honest 105-input surface with parallel vertical bands, phasic sensing, deep nest field, absorbed colony odor, handled-food marking, temperature, contacts, and load/body state. |
| CTRL-05 | Delivered | Deterministic per-ant motor jitter and checkpointed controller/sensory state. |
| CTRL-06 | Delivered | Fixed balanced-frame initialization yields a multi-start viable cohort; recurrent genes remain zero initially and evolvable. |
| CTRL-07 | Delivered | Five construction reflexes plus local cargo transport exist as an isolated, zero-recurrence diagnostic seed. Construction remains off in the current colony world. |
| CTRL-08 | Backlog | Extend the initial seed portfolio with independently predetermined forager, wander-heavy, pheromone-reactive, construction, and unstructured minorities; assess the whole distribution rather than selecting winners. This waits for the living-colony summit and genetic variation. |
| CTRL-09 | Backlog | Add convention-aligned hidden-unit matching inside RNN recombination before evolved synaptic plasticity makes representation mismatch more damaging. |
| CTRL-10 | Backlog | Add metabolically priced, neuromodulated within-lifetime plasticity only after its colony-level selection environment and naive-versus-experienced assay exist. |
| CTRL-11 | Backlog | Implement linear genetic programming behind the same contract, with persistent registers, homologous program variation, per-instruction energy cost, and architected plastic registers. Compare substrates by viable-space and colony ledgers. |
| CTRL-12 | Backlog | Consider path integration, learned routes, or additional controller memory only as evolutionary upgrades supported by measurements; none may become initial viability requirements. |

<a id="controller-obe"></a>

## OBE and rejected directions

| Direction | Status and reason |
| --- | --- |
| One hand-constrained reflex topology as the complete colony controller | **OBE.** It optimized a designer-selected problem and did not represent the broad initialization goal. The construction seed remains an assay artifact. |
| Stateful eighteen-field food-loop oracle | **OBE.** World carriers removed its timers, latches, remembered samples, and entrance protocol; the current teacher has zero persistent state. |
| Sequence cloning followed by terminal evolution-strategy search | **OBE.** Teacher loss did not predict closed-loop behavior, and a 24-generation terminal run consumed 42.9 minutes while degrading completion. Balanced independent-frame distillation replaced it. |
| Controller-specific acceptance, best-of-run baking, or hard behavioral assay rejection | **OBE.** Predetermined cohorts receive one procedure and are judged as a distribution on untouched worlds. Behavioral assays diagnose; mechanics remain hard checks. |
| Home-angle, home-distance, chosen destination, storage-room, or should-dig inputs | **Rejected.** They provide answers without carriers and displace navigation or task choice. |
| Procedural memory wrapped around the network | **Rejected.** It creates a second unattributable controller. |
| Attention heads for scalar ant inputs | **Rejected.** The input has no token structure and current evidence does not justify the mechanism. |
| Latch registers, frame stacking, or another pheromone stream for the food loop | **OBE for the current target.** The zero-state teacher and measured robustness removed the need. A future structural finding may reopen a specific mechanism. |
| Continuous preference resolver as an automatic replacement for threshold bands | **OBE.** Parallel band sensing repaired the measured defect. Migration requires a new finding that band quantization blocks a colony ledger and would reopen interface assays. |
| Naively random RNN founders as the only starting population | **Rejected.** Most starve before continuous selection can discover viability. Unstructured minorities remain valid within a viable portfolio. |
| Parameterized authored behavior, tree GP, or algorithmic pathfinding | **Rejected.** They either cap evolution at the authored algorithm, produce destructive/rugged variation, or solve the navigation problem outside the intended substrate. |

<a id="controller-sources"></a>

## Source provenance

Primary source sections: [design specification §§2–4 and §10](../sources/design-spec.md),
[Appendix A §§A.4–A.9](../sources/ant-sim-appendix-a.md),
[Appendix B §B.2 and §B.9](../sources/ant-sim-appendix-b.md),
[Appendix C §§C.2–C.3](../sources/ant-sim-appendix-c.md),
[Appendix D §§D.2–D.3](../sources/ant-sim-appendix-d.md),
[Appendix E §§foundation and ladder](../sources/ant-sim-appendix-e.md),
[Appendix E2](../sources/ant-sim-appendix-e2.md), and
[Appendix F](../sources/ant-sim-appendix-f.md).
