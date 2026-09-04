# Documentation

## Core documents

| Topic                         | Link                                           |
| ----------------------------- | ---------------------------------------------- |
| Primary operating principles  | [ant-sim-principles.md](ant-sim-principles.md) |
| Current work ladder           | [ant-sim-appendix-e.md](ant-sim-appendix-e.md) |
| Viable-space companion        | [ant-sim-appendix-f.md](ant-sim-appendix-f.md) |
| Certification status          | [certifications.md](certifications.md)         |
| Design specification          | [design-spec.md](design-spec.md)               |
| Architecture                  | [architecture.md](architecture.md)             |
| Development                   | [development.md](development.md)               |
| Calibration record            | [calibration.md](calibration.md)               |
| Current backlog               | [backlog.md](backlog.md)                       |
| Architecture decisions        | [adr/README.md](adr/README.md)                 |
| Appendix D seed specification | [seed-spec.md](seed-spec.md)                   |
| Changelog                     | [../CHANGELOG.md](../CHANGELOG.md)             |
| Agent guide                   | [../AGENTS.md](../AGENTS.md)                   |

Historical implementation plans are retained as records: [Phase 2](../PHASE2-PLAN.md),
[Release 2](../R2-PLAN.md), and [Release 3](../R3-PLAN.md). Their commands and acceptance
criteria describe the releases as executed; current work follows the operating principles and
Appendix E.

## Operating principles

[Open the primary operating principles](ant-sim-principles.md).

- [The goals, in order](ant-sim-principles.md#principles-goals)
- [The principles](ant-sim-principles.md#principles-core)
  - [1. Author the world, not the ant](ant-sim-principles.md#principle-author-world)
  - [2. Function judges; shape describes](ant-sim-principles.md#principle-function-judges)
  - [3. Change one thing, predict its effect, then measure](ant-sim-principles.md#principle-change-measure)
  - [4. Measurements outrank everyone](ant-sim-principles.md#principle-measurements-outrank)
  - [5. It has to work in worlds you haven't seen](ant-sim-principles.md#principle-unseen-worlds)
- [The invariants](ant-sim-principles.md#principles-invariants)
- [How to hold the appendices now](ant-sim-principles.md#principles-appendices)

## Appendix A — Evolutionary dynamics

[Open Appendix A](ant-sim-appendix-a.md).

- [A.1 Scope and Relationship to the Frozen Specification](ant-sim-appendix-a.md#a-1)
- [A.2 Throughput: The Arithmetic of “Seconds per Generation”](ant-sim-appendix-a.md#a-2)
  - [A.2.1 Tick and selection-event budget](ant-sim-appendix-a.md#a-2-1)
  - [A.2.2 Information-rate bound: why recombination is load-bearing](ant-sim-appendix-a.md#a-2-2)
  - [A.2.3 Information demand of the search](ant-sim-appendix-a.md#a-2-3)
- [A.3 Signal-to-Noise: The Binding Constraint](ant-sim-appendix-a.md#a-3)
  - [A.3.1 Heritability under environmental dominance](ant-sim-appendix-a.md#a-3-1)
  - [A.3.2 Population-level averaging of individual luck](ant-sim-appendix-a.md#a-3-2)
  - [A.3.3 Fluctuating selection and the season-period rule](ant-sim-appendix-a.md#a-3-3)
  - [A.3.4 Aggregation estimators: merit succession as variance reduction](ant-sim-appendix-a.md#a-3-4)
  - [A.3.5 The cost: reproductive skew and effective population size](ant-sim-appendix-a.md#a-3-5)
- [A.4 Failure Modes of Self-Adaptive Continuous Evolution](ant-sim-appendix-a.md#a-4)
  - [A.4.1 σ-collapse](ant-sim-appendix-a.md#a-4-1)
  - [A.4.2 Competing conventions and convention-aligned recombination](ant-sim-appendix-a.md#a-4-2)
- [A.5 Anti-Pre-Locking Measures](ant-sim-appendix-a.md#a-5)
- [A.6 The Memory Hierarchy: Organizing Principle](ant-sim-appendix-a.md#a-6)
- [A.7 Learnability: The Four-Gate Taxonomy](ant-sim-appendix-a.md#a-7)
- [A.8 Evolved Plasticity](ant-sim-appendix-a.md#a-8)
  - [A.8.1 Rationale](ant-sim-appendix-a.md#a-8-1)
  - [A.8.2 Mechanism (RNN controller)](ant-sim-appendix-a.md#a-8-2)
  - [A.8.3 Inheritance discipline and known hazards](ant-sim-appendix-a.md#a-8-3)
  - [A.8.4 Mechanism (linear-GP controller)](ant-sim-appendix-a.md#a-8-4)
- [A.9 Developmental Reaction Norms and Colony-State Inputs](ant-sim-appendix-a.md#a-9)
  - [A.9.1 Genomic reaction norms](ant-sim-appendix-a.md#a-9-1)
  - [A.9.2 Colony-state sensory inputs](ant-sim-appendix-a.md#a-9-2)
- [A.10 Compute Discipline for World Subsystems](ant-sim-appendix-a.md#a-10)
- [A.11 Instrumentation Additions](ant-sim-appendix-a.md#a-11)
- [A.12 Parameter Constraints Summary](ant-sim-appendix-a.md#a-12)
- [References](ant-sim-appendix-a.md#a-references)

## Appendix B — Bootstrap viability

[Open Appendix B](ant-sim-appendix-b.md).

- [B.1 Scope and Diagnostic Posture](ant-sim-appendix-b.md#b-1)
- [B.2 Controller Capacity: Auditing Instead of Formulas](ant-sim-appendix-b.md#b-2)
  - [B.2.1 Why the theory you’d want doesn’t exist](ant-sim-appendix-b.md#b-2-1)
  - [B.2.2 Method 1 — state-variable audit](ant-sim-appendix-b.md#b-2-2)
  - [B.2.3 Method 2 — constructive proof](ant-sim-appendix-b.md#b-2-3)
  - [B.2.4 Method 3 — trainability probe](ant-sim-appendix-b.md#b-2-4)
- [B.3 Viability Ratios: Nondimensionalize Before Tuning](ant-sim-appendix-b.md#b-3)
- [B.4 The Oracle Ladder: Fault Bisection by Scripted Cheat-Agents](ant-sim-appendix-b.md#b-4)
- [B.5 The Calibration Harness](ant-sim-appendix-b.md#b-5)
- [B.6 Diagnostic: The Circling Checklist](ant-sim-appendix-b.md#b-6)
- [B.7 Incentive Architecture: The Liability Principle](ant-sim-appendix-b.md#b-7)
  - [B.7.1 Per-behavior channel map](ant-sim-appendix-b.md#b-7-1)
  - [B.7.2 The merit counter and Goodhart accounting](ant-sim-appendix-b.md#b-7-2)
  - [B.7.3 Required liability features](ant-sim-appendix-b.md#b-7-3)
- [B.8 Comparative Calibration: Tuning the World So Underground Construction Wins](ant-sim-appendix-b.md#b-8)
  - [B.8.1 The strategy-spectrum oracles](ant-sim-appendix-b.md#b-8-1)
  - [B.8.2 Tournament protocol and target ordering](ant-sim-appendix-b.md#b-8-2)
  - [B.8.3 Payback inequalities](ant-sim-appendix-b.md#b-8-3)
  - [B.8.4 The gradient must be smooth](ant-sim-appendix-b.md#b-8-4)
- [B.9 From Tuned World to Building Behavior](ant-sim-appendix-b.md#b-9)
  - [B.9.1 Reflexive dig triggers](ant-sim-appendix-b.md#b-9-1)
  - [B.9.2 Stigmergic amplification](ant-sim-appendix-b.md#b-9-2)
  - [B.9.3 Seed derivation and portfolio integration](ant-sim-appendix-b.md#b-9-3)
- [B.10 Constraint Summary](ant-sim-appendix-b.md#b-10)
- [References](ant-sim-appendix-b.md#b-references)

## Appendix C — Layer model and work loop

[Open Appendix C](ant-sim-appendix-c.md).

- [C.1 Diagnosis: One Disease, Two Symptoms](ant-sim-appendix-c.md#c-1)
- [C.2 The Five Layers](ant-sim-appendix-c.md#c-2)
  - [C.2.1 The observed failures, classified](ant-sim-appendix-c.md#c-2-1)
  - [C.2.2 The world-side preference](ant-sim-appendix-c.md#c-2-2)
- [C.3 The Five Litmus Tests](ant-sim-appendix-c.md#c-3)
- [C.4 Untunability: Operational Definition and Stop Signatures](ant-sim-appendix-c.md#c-4)
  - [C.4.1 The four stop signatures](ant-sim-appendix-c.md#c-4-1)
- [C.5 The Structural-Finding Report](ant-sim-appendix-c.md#c-5)
- [C.6 Instruction Ranking: Invariants ≻ Mechanisms ≻ Parameters](ant-sim-appendix-c.md#c-6)
- [C.7 The Work Loop](ant-sim-appendix-c.md#c-7)
- [C.8 Adjudicated Edge Cases](ant-sim-appendix-c.md#c-8)
- [C.9 Constraint Summary](ant-sim-appendix-c.md#c-9)
- [References](ant-sim-appendix-c.md#c-references)

## Appendix D — Oracle ladder and morphogenesis

[Open Appendix D](ant-sim-appendix-d.md). This completed ladder remains diagnostic evidence and
shared-contract history; its execution evidence is in the [certification ledger](certifications.md).

- [D.1 Scope, Fence, Gates, and Current State](ant-sim-appendix-d.md#d-1)
  - [D.1.1 The config-gate system](ant-sim-appendix-d.md#d-1-1)
- [D.2 The Micro-Step Ladder](ant-sim-appendix-d.md#d-2)
  - [D.2.1 Shape vocabulary](ant-sim-appendix-d.md#d-2-1)
- [D.3 The Actuation Contract](ant-sim-appendix-d.md#d-3)
  - [D.3.1 Oracle parity](ant-sim-appendix-d.md#d-3-1)
  - [D.3.2 Body model: yaw only](ant-sim-appendix-d.md#d-3-2)
  - [D.3.3 The resolution function](ant-sim-appendix-d.md#d-3-3)
- [D.4 Staged Morphogenesis: The Deferred Program](ant-sim-appendix-d.md#d-4)
  - [D.4.1 Carrier audit](ant-sim-appendix-d.md#d-4-1)
  - [D.4.2 Rule-set tournament](ant-sim-appendix-d.md#d-4-2)
  - [D.4.3 Morphometrics](ant-sim-appendix-d.md#d-4-3)
  - [D.4.4 Function coupling](ant-sim-appendix-d.md#d-4-4)
- [D.5 Constraint Summary](ant-sim-appendix-d.md#d-5)
- [References](ant-sim-appendix-d.md#d-references)

## Appendix E — The colony loop

[Open Appendix E](ant-sim-appendix-e.md). This is the current work ladder.

- [What we're trying to do](ant-sim-appendix-e.md#e-goal)
- [How we work](ant-sim-appendix-e.md#e-work)
- [What exists to build on](ant-sim-appendix-e.md#e-foundation)
- [The ladder](ant-sim-appendix-e.md#e-ladder)
- [Things that will tempt you, and why to resist](ant-sim-appendix-e.md#e-temptations)
- [After the summit](ant-sim-appendix-e.md#e-after-summit)

## Appendix F — The viable-space problem

[Open Appendix F](ant-sim-appendix-f.md). This companion records why the original colony-loop
target occupied too little RNN weight space and the world-affordance repair.

- [F.1 The problem, stated correctly](ant-sim-appendix-f.md#f-1)
- [F.2 Where the narrowness came from](ant-sim-appendix-f.md#f-2)
- [F.3 The candidates](ant-sim-appendix-f.md#f-3)
  - [F.3.1 External memory](ant-sim-appendix-f.md#f-3-1)
  - [F.3.2 More pheromone streams](ant-sim-appendix-f.md#f-3-2)
  - [F.3.3 Simplify the programmed behavior](ant-sim-appendix-f.md#f-3-3)
  - [F.3.4 Temporal input](ant-sim-appendix-f.md#f-3-4)
  - [F.3.5 Attention heads](ant-sim-appendix-f.md#f-3-5)
- [F.4 The world mechanisms](ant-sim-appendix-f.md#f-4)
- [F.5 The audit and the decision rule](ant-sim-appendix-f.md#f-5)
- [F.6 What this buys the experiment](ant-sim-appendix-f.md#f-6)
- [F.7 Failure modes to avoid](ant-sim-appendix-f.md#f-7)
