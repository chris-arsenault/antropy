# Normalized design and work order

Current architecture: [modular runtime and controlled environment configuration](modular-runtime.md).
The cellular terrain remains available; independent settings now isolate nest geometry from depth,
support and chemical transport.

Current implementation: [colony knowledge, explicit actions and linear genetic programs](colony-knowledge.md).
Programmed and LGP ants share colony knowledge, terrain routing, physical requests and task bytes.
RNN-specific plans are canceled; their experiments remain historical evidence.

Current work: [sustained chamber excavation](chamber-excavation.md). The user rejected the ten-cell
result from [surplus-driven growth](surplus-growth.md) as imperceptible and requires the default
nest to double from 148 to at least 296 connected underground cells through physical digging.
Population growth and occupied individual cuts do not satisfy this target. The
[controlled queen](controlled-queen.md) and food-supported growth remain prerequisites.
The corrected default reaches 298 cells by tick 4,000, with twenty workers, continued feeding,
110 soil units placed outside and eight brood occupying newly excavated floor.

Earlier implementation: [collective work and attributable behavior](collective-work.md).
The September 8 food-pack and scattered-digging rejection remains the review boundary. Event traces,
sampled spatial replay, private worksite memory, spoil handoff and local work recruitment are implemented;
the record separates failed development assays from the current integrated candidate.

Next work: review the measured chamber doubling and collective-work motion. Afterwards resume
[a sustainable, interactive colony near 2,000 workers](colony-scale.md),
before genetics.
Capacity and performance measurement and [support/settling](settling.md) are implemented.
[Digging, queen transport and cache creation/relocation](construction.md) have been extended with
[autonomous work, brood transport and material microclimate](construction-pressures.md).
Programmed/LGP ants choose work without manual orders; changed behavior requires visual review.
The earlier default failed that review after approximately 18,000 ticks. The
[default pressure audit](default-pressure-audit.md) traces the failure, and the
[autonomous colony repair](colony-repair.md) records the corrected policy and founding-nest default.
The repaired trajectory also failed human review: the queen and food concentrate at the entrance
while workers make scattered one-cell cuts. [Spatial construction repair](spatial-construction.md)
removes artificial cavity heating and adds observed connected-floor, access and preservation-cost
rules. The changed trajectory needs another human review; survival and completion counts do not
override the prior failure.
Measured nursery throughput and population/runtime scaling follow. The current roughly
20-worker results do not certify the large-colony goal.
The new pressure panel still fails tiered queen feeding and replacement; keep that terrain
experimental. The founding startup and the small construction assays are the current review scope.

This directory owns the current design. Archived appendices and earlier plans preserve ideas and
evidence under [sources](../sources/README.md), but their old mechanisms and sequencing do not
override current decisions or measured behavior.

Current terrain: [cellular materials, compact nests and tiered surfaces](cellular-terrain.md).
The browser opens programmed ants with climate and autonomous construction on the founding
2,048 × 512 map, paused at tick zero.
The Run-only review default starts at the normal material temperature, with daily surface exchange,
temperature visible, Metrics open, the camera framing the colony and a 30 ticks/s target.
Artificial cavity heating is off; the setting remains available for explicit assays.
Actual throughput appears in Metrics; explicit tick-rate controls also offer Maximum.
All other controls remain available. Storage holds 12 food units per cell. Completion totals for
all five construction kinds persist after individual work records expire. The repair record
separates browser checks, long survival measurements and the still-pending human motion review.
Foreground/backing materials govern the world; surface tiers and historical controllers remain
selectable. Camera pan and zoom are independent of simulation state.

<a id="design-categories"></a>

## Work categories

| Category                              | Owns                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| [Controller](controller.md)           | Sensors, actions, policies, genome boundary, memory, future controller representations |
| [Environment](environment.md)         | 2D substrate, materials, fields, resources, liabilities, future morphogenesis          |
| [Colony biology](colony-biology.md)   | Energy use, mortality, queen, brood, replacement, demographic persistence              |
| [Experimentation](experimentation.md) | Oracles, harnesses, gates, calibration, findings, certification                        |
| [Advanced systems](advanced.md)       | In-world evolution, selection signal, genetic diversity, learning, regimes             |

<a id="design-status"></a>

## Status vocabulary

- **Delivered** means the canonical 2D implementation and its proportional verification exist.
- **Needs human review** means numeric and mechanical checks pass but visual behavior is not yet
  accepted.
- **Backlog** means the idea is retained but has no active implementation in the canonical runtime.
- **OBE** means a prior implementation or prescription was overtaken by evidence or the 2D reset;
  provenance remains in sources and Git history.

<a id="design-current"></a>

## Current boundary

The current programmed/LGP colony gathers, stores and eats physical food, feeds queen and larvae,
and replaces workers through funded eggs, larvae and pupae. Mortality and conservation are active.
Shared knowledge and routing are explicit abstractions; they do not transfer resources remotely.
The [implementation record](colony-knowledge.md) preserves the exact comparison and known failures.

Runs 2717 and 2718 have identical compact-world summaries at 48,000 ticks: queen alive, 20 workers,
57 births and no founders. The programmed reference run also passes. These are two world cases
and one matched controller comparison, not evidence of 2,000-worker capacity or tiered-map survival.

The September 8 user correction makes colony size the prerequisite for later genetic work.
Current laying, brood space and food throughput cannot sustain that scale. Settling for queen,
brood and loose food is implemented; larger storage/care capacity and seed retries remain separate
work. The subsequent user decision authorizes digging, queen transport and cache relocation. Follow
[the scale work order](colony-scale.md). The later collective-work decision authorizes local work
recruitment on pheromone B. Positive feedback on
the earlier view does not certify changed physics or larger populations.

RNN studies are closed as current work. Their historical successes under former rules and later
transfer/training failures remain in [task memory](task-memory.md),
[nest generalization](nest-generalization.md) and [training recovery](training-recovery.md).
Do not resume training or treat neural certification as a prerequisite. Inheritance and live
genetics remain deferred. Construction and microclimate require visual review; collapse, flooding,
gas exchange, seasons and broad ecology remain later work.

<a id="design-order"></a>

## Cross-category implementation order

| Order | Status | Deliverable |
| ---: | --- | --- |
| 1 | Delivered | Canonical cellular 2D terrain, configurable nest/surface mechanisms and camera |
| 2 | Delivered | Conserved food/energy, mortality, queen upkeep, staged brood and replacement |
| 3 | Delivered | Shared colony knowledge, explicit route actions, task byte and programmed/LGP seed |
| 4 | Delivered | Capacity budgets and Node/headless Canvas measurements (SCALE-01) |
| 5 | Implemented; visual review required | Y-axis support and settling with checkpoint v11 (SCALE-02) |
| 5a | Implemented; visual review required | Local digging, spoil hauling, queen carrying and multiple cache creation/relocation; checkpoint v12 |
| 5b | Collective-work candidate implemented; human review pending | Checkpoint v17 adds private worksites, physical spoil handoff, ant-authored recruitment and attributable behavior traces. Programmed/LGP 2801/2803 and the Run-only browser agree at 4,000 ticks; sustained chamber growth remains unproved |
| 5c | Partially implemented | Nursery and distributed storage throughput measurements remain (SCALE-03) |
| 5d | Measured doubling; visual review required | Persistent chamber work, observed disposal routes and connected-area stats; default 148 → 298 cells at tick 4,000, checkpoint v19 |
| 6 | Planned | Staged population scaling and measured runtime performance (SCALE-04–05) |
| 7 | Planned; review required | Sustained roughly 2,000-worker replacement and interactive visual review (SCALE-06) |
| 8 | Deferred until scale and genetics decision | Inheritance, reproductive lineages, variation and in-world selection |
| 9 | Backlog | Evolved construction and additional ecology for selected physical or evolutionary questions |

The unfinished RNN plans are canceled, not deliverables in this sequence. Detailed category lists
retain their stable task IDs; this table defines their current cross-category priority.

<a id="design-change"></a>

## Changing the design

Use the [operating principles](../principles.md): classify the owner, state the governing
inequality, change one mechanism, and measure it. When a source document conflicts with the
canonical runtime or visible behavior, preserve the source and amend this design. Never make a
historical appendix pass by silently restoring an oracle sensor or hidden state. Shared knowledge
and routing permissions are explicitly recorded in the current controller design.
