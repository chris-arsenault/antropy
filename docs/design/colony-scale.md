# A sustainable 2,000-ant colony before genetics

## Decision and boundary

The September 8 user correction puts a roughly 2,000-ant colony ahead of genetics. Colony size
is intended to provide redundancy and room for later behavioral variation. Genetics is not the
next implementation step. RNN-specific plans are canceled; their code, artifacts and measurements
remain historical comparisons. The programmed and compiled LGP seed are implemented.

Keep colony-owned knowledge, ant-selected routes, direct movement, the opaque task byte and
physical interactions. Leave pheromone behavior and field configuration as they are. Retain
selectable terrain mechanisms; do not revert cellular materials or surface tiers. No new training,
inheritance, live mutation, reproductive selection or broad ecology belongs in this milestone.

The target is a resource-supported population near 2,000 living workers, not a fixed census or
2,000 immortal display objects. Larger colonies may buffer impaired workers, but population size
alone does not establish genetic diversity or a reproductive selection channel. Those questions
remain for the later genetics design; they do not justify another controller-training detour.

The subsequent user instruction activates SCALE-01 and SCALE-02 and places digging immediately
after their review, ahead of distributed storage and population growth. Their implementation and
measurements are recorded in [settling](settling.md). The following user request authorizes
[digging, queen transport and cache relocation](construction.md), now implemented for review.

## Earlier evidence and current limiting rates

The programmed/LGP compact comparison ends with 20 workers, 57 births and a living queen after
48,000 ticks; its two summaries match exactly. The programmed reference case also passes. See
[the controller implementation record](colony-knowledge.md) for provenance and limitations.
These measurements do not establish larger populations, tiered-map survival or browser speed at
scale. The user gave positive feedback on the current view; changed physics and larger populations
still require their own visual review.

The base `PROGRAMMED_LIFECYCLE_CONFIG` sets worker lifespan to 16,000 ticks and laying interval to
800 ticks. Even with perfect brood survival, one queen supplies at most 20 workers per worker
lifespan. Steady replacement of 2,000 workers at that lifespan needs 0.125 successful hatches per
tick, or one every eight ticks, before additional losses. This is a rate bound, not a proposed
blind change to the laying interval.

The base egg, larva and pupa minimum durations total 2,400 ticks. At that replacement rate, at
least about 300 brood would be developing concurrently. The former radius-three automatic laying
and immobile brood have been replaced by explicit adjacent laying and physical brood transport.
Faster laying alone still cannot supply nursery capacity.

With 96 sources growing at 0.002 food units per tick and density 1, nominal regrowth is at most
0.192 energy per tick. Metabolism alone for 2,000 workers at 0.0005 costs 1 energy per tick, before
travel, queen upkeep or brood. Actual growth can be lower when sources are full or inaccessible.
Food supply, transport, storage, care throughput and physical room must be designed together.

The current [surplus-growth review](surplus-growth.md) overrides the base with an 80-tick minimum
laying interval, 960-tick minimum development and 0.02 food/source/tick. Eight founders, lifespan
and birth investment remain unchanged. Its measurements replace the older passive-queen results
as evidence for the current default. This first growth step does not establish the 2,000-worker
budget: even perfect 80-tick replacement sustains at most 200 workers at the existing lifespan.

Loose food, unsupported adults and brood have configurable downward settling; both adult castes
retain backing and surface grip. The seed can repeatedly try depositing into a full pile; the resolver reports
`full` without losing cargo. Distributed storage remains separate from this physical correction.

## Next implementation sequence

| Step | Status | Work and acceptance |
| --- | --- | --- |
| SCALE-01 | Delivered | Capacity budgets and reproducible Node/headless Canvas measurements identify birth, nursery, energy and runtime limits; see settling.md. |
| SCALE-02 | Implemented; visual review required | Configurable negative-Y settling, supported queen/cache placement, conserved food movement, landmark/route updates and checkpoint v11. |
| DIG-01 | Implemented; visual review required | Local material-dependent excavation, retained backing, partial work, spoil hauling/deposition and interrupted-load recovery; see construction.md. |
| SCALE-03 | Partially implemented | Cache/queen/brood relocation, supported nursery floors and autonomous seed care/work exist. Nursery capacity and sustained throughput measurements remain; never teleport brood or hide task dispatch in the kernel. |
| SCALE-04 | Initial growth work active | Surplus-growth work establishes the first resource response from eight founders. Later scale steps compare programmed and LGP ants at approximately 200, 500, 1,000 and 2,000 workers with declared energy, birth and nursery budgets. |
| SCALE-05 | Planned | Profile each scale and remove measured runtime bottlenecks while preserving sequential physical decisions. Establish responsive rendering, inspection and checkpointing at roughly 2,000 workers. |
| SCALE-06 | Planned | Demonstrate sustained replacement after founder turnover, conserved energy and credible traffic/care at scale on a declared small map panel; obtain visual review before any genetics work. |

Performance measurement begins in SCALE-01 and continues during the physical work; SCALE-05 is
its final acceptance, not a reason to defer profiling. Inspect occupancy/contact queries, repeated
candidate construction, route searches, chemical updates, VM execution and drawing separately.
Use spatial indexes, reusable buffers or shared terrain-derived route data only where measurements
justify them. Shared routing must not discover unseen food or choose an ant's destination.
Preserve the deterministic kernel and controller plugin boundary; do not begin another general
architecture rewrite or parallelize before identifying the cost.

Declare the browser/device and simulation tick-rate target before optimizing. As an initial
review target, aim for 30 rendered frames per second with responsive pan, zoom and inspection;
report measured simulation ticks per second separately. This is proposed acceptance, not a
measured capability. Avoid silently dropping ant decisions to improve the display rate.

High-count initialization is permitted as a labeled performance or capacity assay, with valid
positions and accounted initial reserves. It cannot certify sustainable demographics. Biological
acceptance must cross founder turnover and later replacement windows, with population remaining
near the intended scale without automatic census replenishment. A run that merely reaches 2,000
and then drains its initial food fails. Record birth/death rates, queen/brood feeding, accessible
food and storage, congestion, participation, conservation, wall time and configuration in the
harness ledger. Bounded tests cover mechanics and deterministic persistence, not long campaigns.

The subsequent approved [construction-pressure design](construction-pressures.md) adds autonomous
programmed/LGP site selection, brood carrying, temperature, moisture and food spoilage. This replaces
the explicit-work-order limitation. Authored nests remain controls; nursery throughput and scale
are not certified by completed construction jobs. Collapse, seasons and gas exchange remain later.

## Plan disposition

The following unfinished RNN plans were canceled on September 8, with unfinished phases skipped
and completed experiment results preserved:

- `b41b5bbb-2110-479f-931c-99b497ee055f`: nest-generalization training.
- `d97e6512-ccec-4504-8d41-e8e81caed552`: failure-driven replay recovery.
- `8685b496-0939-4c57-a601-f50530964066`: care correction preserving learned behavior.
- `2162dd93-ac54-40ff-b95b-6aa983aa7a5b`: stage-local curriculum fitting.
- `8a911d0a-4c4c-4cd8-b000-74de10df3c70`: physical-contract recurrent forager.

The three non-RNN historical plans remain paused: the long-term mortality/evolution parent,
standing-variation admission and canonical 2D migration. Their phase notes now point here;
retired 3D results are not current inheritance evidence, and RNN success is no longer an open
migration prerequisite. This roadmap update does not implement the scale steps or certify them.

After SCALE-06, revisit the inheritance and reproductive-lineage design with the user. The
previous proposed queen-to-worker transmission and daughter-colony sequence remains backlog;
it is not authorization to start genetics automatically when a numeric scale gate passes.
