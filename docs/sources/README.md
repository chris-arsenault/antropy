# Source archive

This directory preserves the design material that was supplied to the project or used as a
historical execution plan. These files are evidence and provenance, not the current work queue.
They are intentionally retained in their source voice, including supersession claims, obsolete
rules, old links, and measurements that later work invalidated.

Current decisions and implementation order live in [the current design index](../design/README.md).
Current evidence lives in [the certification ledger](../certifications.md) and
[calibration record](../calibration.md).

The [September 10 documentation archive](history/README.md) preserves the preceding complete
design tree and records which material was retained in the current bacterial contracts. The
destination categories below describe the historical normalization, not active implementation
owners. Their full mapping remains in the archived source-coverage document.

## Supplied design sources

| Source | What it contributed | Historical normalized destination |
| --- | --- | --- |
| [Design specification](design-spec.md) | Original controller, genome, world, colony, evolution, legibility, and technology design | All five design categories |
| [Operating principles](ant-sim-principles.md) | Goal order, five principles, and standing invariants | [Current principles](../principles.md) |
| [Appendix A](ant-sim-appendix-a.md) | Evolutionary dynamics, plasticity, reaction norms, compute, and instruments | Controller, experimentation, advanced systems |
| [Appendix B](ant-sim-appendix-b.md) | Bootstrap viability, ratios, oracles, liabilities, and construction economics | Environment, experimentation, controller |
| [Appendix C](ant-sim-appendix-c.md) | Change classification, legality, tuning limits, and findings | Current principles and experimentation |
| [Appendix D](ant-sim-appendix-d.md) | Digging ladder, actuation contract, config gates, and morphogenesis | Controller, environment, colony biology, experimentation |
| [Appendix E](ant-sim-appendix-e.md) | Authored-nest colony-loop ladder | Colony biology and roadmap |
| [Appendix E2](ant-sim-appendix-e2.md) | Division of labor between field navigation, controllers, and instruments | Controller, environment, experimentation, advanced systems |
| [Appendix F](ant-sim-appendix-f.md) | Viable-space diagnosis and world-affordance repair | Controller, environment, experimentation |
| [Appendix G](ant-sim-appendix-g.md) | Ecological viability floors and resilience measurement | Colony biology, environment, experimentation, advanced systems |
| [Appendix H](ant-sim-appendix-h.md) | Scentless-search fallback, escalation order, and return-reserve calibration | Controller and experimentation |
| [Digging seed specification](seed-spec.md) | Exact five-reflex construction seed and sixth cargo reflex | Controller and environment |

## Historical execution sources

| Source | Status |
| --- | --- |
| [Release 2 plan](R2-PLAN.md) | Completed historical plan; its mechanisms are classified individually in the normalized documents |
| [Release 3 plan](R3-PLAN.md) | Completed historical plan; unresolved work was redistributed by topic |
| [Phase 2 plan](PHASE2-PLAN.md) | Completed and superseded by Appendix D; retained because it records the obsolete three-reflex draft |
| [Digging-ladder review note](paste-2026-09-02_11-17-56-033Z.txt) | Source of the casting, dig-site gating, and deposit anti-gating amendment |
| [RNN-training review note](paste-2026-09-04_03-56-08-254Z.txt) | Source of the behavior-cloning and evaluation critique; later measurements superseded parts of its prescribed procedure |
| [Underground-nest reference image](paste-2026-09-03_17-00-44-361Z.png) | Qualitative morphology reference only; never a shape target or certification gate |

## Retired architecture records

ADRs 0001–0013 describe the runtime preserved at the 2026-09-06 checkpoint tag. They moved here
unchanged when the canonical 2D substrate replaced that implementation:

- [0001 — main-thread simulation](legacy-3d-adrs/0001-main-thread-simulation.md)
- [0002 — deterministic simulation](legacy-3d-adrs/0002-deterministic-simulation.md)
- [0003 — custom Canvas charts](legacy-3d-adrs/0003-custom-canvas-charts.md)
- [0004 — excavation instinct](legacy-3d-adrs/0004-excavation-instinct.md)
- [0005 — owner-tagged scent channels](legacy-3d-adrs/0005-owner-tagged-scent-channels.md)
- [0006 — nest scent and transport instinct](legacy-3d-adrs/0006-nest-scent-and-transport-instinct.md)
- [0007 — global mating pool](legacy-3d-adrs/0007-global-mating-pool.md)
- [0008 — brood-care instinct](legacy-3d-adrs/0008-brood-care-instinct.md)
- [0009 — oracles outside the contract](legacy-3d-adrs/0009-oracles-outside-the-contract.md)
- [0010 — derived seed portfolio](legacy-3d-adrs/0010-derived-seed-portfolio.md)
- [0011 — liabilities and bootstrap tournament](legacy-3d-adrs/0011-liability-shapes-and-bootstrap-tournament.md)
- [0012 — historical harness ledger](legacy-3d-adrs/0012-harness-ledger.md)
- [0013 — historical feature gates](legacy-3d-adrs/0013-feature-config-gates.md)

<a id="source-sections"></a>

## Supplied source section index

This is a navigation index into the unchanged source bodies. The
[historical coverage map](history/2026-09-10/design/source-coverage.md) records the preceding
ant-era owners and dispositions. Current retained material is mapped in the [history guide](history/README.md).

**Original design specification**

- [1. Design Principles](design-spec.md#1-design-principles)
- [2. Behavioral Controller](design-spec.md#2-behavioral-controller)
  - [2.1 Chosen model](design-spec.md#21-chosen-model-fixed-topology-recurrent-neural-network-with-structured-initialization)
  - [2.2 Considered alternatives](design-spec.md#22-considered-and-deferredrejected-alternatives)
  - [2.3 Controller substitutability](design-spec.md#23-controller-substitutability-requirement)
- [3. Genome](design-spec.md#3-genome)
  - [3.1 Behavioral genome](design-spec.md#31-behavioral-genome)
  - [3.2 Physical genome](design-spec.md#32-physical-genome-10-real-valued-genes-each-on-a-tradeoff)
  - [3.3 Mutation and recombination](design-spec.md#33-mutation-and-recombination)
- [4. Sensory and Motor Interface](design-spec.md#4-sensory-and-motor-interface)
- [5. The World](design-spec.md#5-the-world)
  - [5.1 Voxel volume](design-spec.md#51-voxel-volume)
  - [5.2 Materials](design-spec.md#52-materials)
  - [5.3 Movement](design-spec.md#53-movement-voxel-lattice-hopping)
  - [5.4 Digging and spoil conservation](design-spec.md#54-digging-and-spoil-conservation)
  - [5.5 Pheromones](design-spec.md#55-pheromones-in-the-volume)
- [6. Energy Economy](design-spec.md#6-energy-economy)
- [7. Reproduction, Gene Flow, and Colony Structure](design-spec.md#7-reproduction-gene-flow-and-colony-structure)
  - [7.1 Core tension and resolution](design-spec.md#71-the-core-tension-and-the-chosen-resolution)
  - [7.2 Queen and colony objects](design-spec.md#72-queen-and-colony-objects)
  - [7.3 Eggs and development](design-spec.md#73-eggs-and-development)
- [8. Castes](design-spec.md#8-castes-one-dial-emergence-does-the-rest)
- [9. Recurrent Regimes](design-spec.md#9-recurrent-regimes-the-anti-ratchet-requirements)
  - [9.1 Colony mortality and refounding](design-spec.md#91-colony-mortality-and-refounding-metapopulation)
  - [9.2 Nest decay](design-spec.md#92-nest-decay)
  - [9.3 Oscillating carrying capacity](design-spec.md#93-oscillating-carrying-capacity-seasons)
- [10. Initialization](design-spec.md#10-initialization-diversity-is-free-at-t0)
- [11. Legibility and Timescale](design-spec.md#11-legibility-and-timescale)
  - [11.1 Speed decoupling](design-spec.md#111-speed-decoupling)
  - [11.2 Checkpointing](design-spec.md#112-checkpointing)
  - [11.3 Event detection](design-spec.md#113-event-detection-the-sim-tells-you-when-to-look)
  - [11.4 Genetic instrumentation](design-spec.md#114-genetic-instrumentation-from-tick-one)
- [12. Technology Frame](design-spec.md#12-technology-frame)
- [13. Build Phasing](design-spec.md#13-build-phasing)
- [14. Open Questions](design-spec.md#14-open-questions-deliberately-unresolved)

**Supplied operating principles**

- [The goals, in order](ant-sim-principles.md#principles-goals)
- [The principles](ant-sim-principles.md#principles-core)
  - [Author the world, not the ant](ant-sim-principles.md#principle-author-world)
  - [Function judges; shape describes](ant-sim-principles.md#principle-function-judges)
  - [Change one thing, predict, then measure](ant-sim-principles.md#principle-change-measure)
  - [Measurements outrank everyone](ant-sim-principles.md#principle-measurements-outrank)
  - [It has to work in unseen worlds](ant-sim-principles.md#principle-unseen-worlds)
- [The invariants](ant-sim-principles.md#principles-invariants)
- [How to hold the appendices](ant-sim-principles.md#principles-appendices)

**Appendix A — evolutionary dynamics**

- [A.1 Scope and relationship](ant-sim-appendix-a.md#a-1)
- [A.2 Throughput](ant-sim-appendix-a.md#a-2)
  - [A.2.1 Tick and selection-event budget](ant-sim-appendix-a.md#a-2-1)
  - [A.2.2 Information-rate bound](ant-sim-appendix-a.md#a-2-2)
  - [A.2.3 Information demand](ant-sim-appendix-a.md#a-2-3)
- [A.3 Signal-to-noise](ant-sim-appendix-a.md#a-3)
  - [A.3.1 Heritability](ant-sim-appendix-a.md#a-3-1)
  - [A.3.2 Population-level averaging](ant-sim-appendix-a.md#a-3-2)
  - [A.3.3 Fluctuating selection](ant-sim-appendix-a.md#a-3-3)
  - [A.3.4 Aggregation estimators](ant-sim-appendix-a.md#a-3-4)
  - [A.3.5 Effective population size](ant-sim-appendix-a.md#a-3-5)
- [A.4 Self-adaptive evolution failure modes](ant-sim-appendix-a.md#a-4)
  - [A.4.1 Mutation-scale collapse](ant-sim-appendix-a.md#a-4-1)
  - [A.4.2 Convention-aligned recombination](ant-sim-appendix-a.md#a-4-2)
- [A.5 Anti-pre-locking measures](ant-sim-appendix-a.md#a-5)
- [A.6 Memory hierarchy](ant-sim-appendix-a.md#a-6)
- [A.7 Learnability taxonomy](ant-sim-appendix-a.md#a-7)
- [A.8 Evolved plasticity](ant-sim-appendix-a.md#a-8)
  - [A.8.1 Rationale](ant-sim-appendix-a.md#a-8-1)
  - [A.8.2 RNN mechanism](ant-sim-appendix-a.md#a-8-2)
  - [A.8.3 Inheritance and hazards](ant-sim-appendix-a.md#a-8-3)
  - [A.8.4 Linear-GP mechanism](ant-sim-appendix-a.md#a-8-4)
- [A.9 Development and colony-state inputs](ant-sim-appendix-a.md#a-9)
  - [A.9.1 Reaction norms](ant-sim-appendix-a.md#a-9-1)
  - [A.9.2 Colony-state sensory inputs](ant-sim-appendix-a.md#a-9-2)
- [A.10 Compute discipline](ant-sim-appendix-a.md#a-10)
- [A.11 Instrumentation](ant-sim-appendix-a.md#a-11)
- [A.12 Parameter constraints](ant-sim-appendix-a.md#a-12)
- [References](ant-sim-appendix-a.md#a-references)

**Appendix B — bootstrap viability**

- [B.1 Scope and diagnostic posture](ant-sim-appendix-b.md#b-1)
- [B.2 Controller capacity](ant-sim-appendix-b.md#b-2)
  - [B.2.1 Capacity theory](ant-sim-appendix-b.md#b-2-1)
  - [B.2.2 State-variable audit](ant-sim-appendix-b.md#b-2-2)
  - [B.2.3 Constructive proof](ant-sim-appendix-b.md#b-2-3)
  - [B.2.4 Trainability probe](ant-sim-appendix-b.md#b-2-4)
- [B.3 Viability ratios](ant-sim-appendix-b.md#b-3)
- [B.4 Oracle ladder](ant-sim-appendix-b.md#b-4)
- [B.5 Calibration harness](ant-sim-appendix-b.md#b-5)
- [B.6 Circling checklist](ant-sim-appendix-b.md#b-6)
- [B.7 Liability principle](ant-sim-appendix-b.md#b-7)
  - [B.7.1 Behavior channels](ant-sim-appendix-b.md#b-7-1)
  - [B.7.2 Merit and Goodhart accounting](ant-sim-appendix-b.md#b-7-2)
  - [B.7.3 Liability features](ant-sim-appendix-b.md#b-7-3)
- [B.8 Comparative calibration](ant-sim-appendix-b.md#b-8)
  - [B.8.1 Strategy policies](ant-sim-appendix-b.md#b-8-1)
  - [B.8.2 Tournament protocol](ant-sim-appendix-b.md#b-8-2)
  - [B.8.3 Payback inequalities](ant-sim-appendix-b.md#b-8-3)
  - [B.8.4 Increment series](ant-sim-appendix-b.md#b-8-4)
- [B.9 Seeded construction](ant-sim-appendix-b.md#b-9)
  - [B.9.1 Dig triggers](ant-sim-appendix-b.md#b-9-1)
  - [B.9.2 Stigmergic amplification](ant-sim-appendix-b.md#b-9-2)
  - [B.9.3 Seed derivation](ant-sim-appendix-b.md#b-9-3)
- [B.10 Constraints](ant-sim-appendix-b.md#b-10)
- [References](ant-sim-appendix-b.md#b-references)

**Appendix C — layer model and work loop**

- [C.1 Diagnosis](ant-sim-appendix-c.md#c-1)
- [C.2 Five layers](ant-sim-appendix-c.md#c-2)
  - [C.2.1 Observed failures](ant-sim-appendix-c.md#c-2-1)
  - [C.2.2 World-side preference](ant-sim-appendix-c.md#c-2-2)
- [C.3 Interface tests](ant-sim-appendix-c.md#c-3)
- [C.4 Untunability](ant-sim-appendix-c.md#c-4)
  - [C.4.1 Stop signatures](ant-sim-appendix-c.md#c-4-1)
- [C.5 Structural-finding report](ant-sim-appendix-c.md#c-5)
- [C.6 Instruction ranking](ant-sim-appendix-c.md#c-6)
- [C.7 Work loop](ant-sim-appendix-c.md#c-7)
- [C.8 Adjudicated edge cases](ant-sim-appendix-c.md#c-8)
- [C.9 Constraints](ant-sim-appendix-c.md#c-9)
- [References](ant-sim-appendix-c.md#c-references)

**Appendix D — oracle ladder and morphogenesis**

- [D.1 Scope, fence, gates, and state](ant-sim-appendix-d.md#d-1)
  - [D.1.1 Config gates](ant-sim-appendix-d.md#d-1-1)
- [D.2 Micro-step ladder](ant-sim-appendix-d.md#d-2)
  - [D.2.1 Shape vocabulary](ant-sim-appendix-d.md#d-2-1)
- [D.3 Actuation contract](ant-sim-appendix-d.md#d-3)
  - [D.3.1 Oracle parity](ant-sim-appendix-d.md#d-3-1)
  - [D.3.2 Yaw-only body](ant-sim-appendix-d.md#d-3-2)
  - [D.3.3 Resolution function](ant-sim-appendix-d.md#d-3-3)
- [D.4 Deferred morphogenesis](ant-sim-appendix-d.md#d-4)
  - [D.4.1 Carrier audit](ant-sim-appendix-d.md#d-4-1)
  - [D.4.2 Rule-set tournament](ant-sim-appendix-d.md#d-4-2)
  - [D.4.3 Morphometrics](ant-sim-appendix-d.md#d-4-3)
  - [D.4.4 Function coupling](ant-sim-appendix-d.md#d-4-4)
- [D.5 Constraints](ant-sim-appendix-d.md#d-5)
- [References](ant-sim-appendix-d.md#d-references)

**Appendix E — colony loop**

- [Goal](ant-sim-appendix-e.md#e-goal)
- [Work discipline](ant-sim-appendix-e.md#e-work)
- [Foundation](ant-sim-appendix-e.md#e-foundation)
- [Ladder](ant-sim-appendix-e.md#e-ladder)
- [Temptations](ant-sim-appendix-e.md#e-temptations)
- [After the summit](ant-sim-appendix-e.md#e-after-summit)

**Appendix E2 — pathing boundaries**

- [World-computed paths](ant-sim-appendix-e2.md#the-reframe-the-world-already-computes-paths)
- [Three instrument jobs](ant-sim-appendix-e2.md#where-pathfinding-algorithms-belong-three-jobs-none-of-them-in-ants)
- [Pathing prohibition](ant-sim-appendix-e2.md#where-pathing-must-not-go-and-the-real-reason-why)
- [Transferability tiers](ant-sim-appendix-e2.md#the-transferability-tiers-kept-straight)
- [Delta to Appendix E](ant-sim-appendix-e2.md#the-delta-to-appendix-e)

**Appendix F — viable-space repair**

- [F.1 Problem](ant-sim-appendix-f.md#f-1)
- [F.2 Narrowness](ant-sim-appendix-f.md#f-2)
- [F.3 Candidates](ant-sim-appendix-f.md#f-3)
  - [F.3.1 External memory](ant-sim-appendix-f.md#f-3-1)
  - [F.3.2 More pheromone streams](ant-sim-appendix-f.md#f-3-2)
  - [F.3.3 Simpler programmed behavior](ant-sim-appendix-f.md#f-3-3)
  - [F.3.4 Temporal input](ant-sim-appendix-f.md#f-3-4)
  - [F.3.5 Attention](ant-sim-appendix-f.md#f-3-5)
- [F.4 World mechanisms](ant-sim-appendix-f.md#f-4)
- [F.5 Audit and decision rule](ant-sim-appendix-f.md#f-5)
- [F.6 Experimental benefit](ant-sim-appendix-f.md#f-6)
- [F.7 Failure modes](ant-sim-appendix-f.md#f-7)

**Appendix G — viability floors**

- [G.1 Goal and failure modes](ant-sim-appendix-g.md#g1-the-goal-and-the-two-failure-modes-to-design-against)
- [G.2 Mechanisms](ant-sim-appendix-g.md#g2-the-mechanisms)
  - [Two-sided resource governor](ant-sim-appendix-g.md#resource-the-two-sided-governor)
  - [Metabolic depression](ant-sim-appendix-g.md#physiology-metabolic-depression)
  - [Brood liquidation](ant-sim-appendix-g.md#brood-the-larder-that-walks)
  - [Queen recovery kernel](ant-sim-appendix-g.md#queen-the-recovery-kernel)
  - [Genetic portfolio](ant-sim-appendix-g.md#genetics-the-portfolio)
  - [Conspicuousness-scaled threats](ant-sim-appendix-g.md#threats-deferred-conspicuousness-scaling)
- [G.3 Resilience curve](ant-sim-appendix-g.md#g3-the-instrument-the-resilience-curve)
- [G.4 Build order](ant-sim-appendix-g.md#g4-build-order)
- [G.5 Failure modes](ant-sim-appendix-g.md#g5-failure-modes-to-avoid)

**Appendix H — scentless search**

- [H.0 Fallback branch](ant-sim-appendix-h.md#h0-level-0-the-fallback-branch-build-this)
- [H.1 Measured search failures](ant-sim-appendix-h.md#h1-level-1-fixes-for-measured-search-failures-build-only-on-evidence)
- [H.2 Directional exit cues](ant-sim-appendix-h.md#h2-level-2-directional-exit-cues-build-only-if-level-1-is-not-enough)
- [H.3 Memory-based search](ant-sim-appendix-h.md#h3-level-3-memory-based-search-deferred-arrives-with-other-work)
- [H.4 Decision record](ant-sim-appendix-h.md#h4-the-record-of-how-this-decision-went-wrong-before-it-went-right)

**Digging seed specification**

- [Architecture constraint](seed-spec.md#architecture-constraint)
- [Reflex 1: marked-site dig-down](seed-spec.md#reflex-1--marked-site-dig-down)
- [Reflex 2: spoil haul/deposit](seed-spec.md#reflex-2--spoil-hauldeposit)
- [Reflex 3: amplify](seed-spec.md#reflex-3--amplify)
- [Reflex 4: overflow](seed-spec.md#reflex-4--overflow)
- [Reflex 5: casting reacquisition](seed-spec.md#reflex-5--reacquisition-by-casting)
- [Reflex 6: local cargo transport](seed-spec.md#reflex-6--local-cargo-transport)
  - [Contact and occupied mandibles](seed-spec.md#contact-and-occupied-mandibles)
  - [Cargo direction](seed-spec.md#cargo-direction)
  - [Brood release and stable storage](seed-spec.md#brood-release-and-stable-storage)
- [Total and certification](seed-spec.md#total-and-certification)

## Preservation policy

The archived files are not edited to repair links or reconcile terminology. References from live
documents point into this directory when the original wording matters. A new supplied source is
added here, indexed above, and incorporated only where relevant to current design owners; it does not
become a second work queue.
