# Colony knowledge, explicit actions and linear genetic programs

## Decision and scope

The September 8 user decision replaces RNN bootstrap training as the critical path to evolution.
Implement programmed ants and linear genetic programming (LGP) against the same structured
observations and explicit actions. Here "linear GA" means genetic variation of a linear instruction
program, not another offline search for neural weights. RNN-specific work is canceled; its artifacts
remain historical comparisons under their original interface.

This document records the design before experimentation. It supersedes the local-only production
sensor and oracle prohibitions for this controller family. Terrain-aware routing and instantaneous
colony knowledge are intentional abstractions. They do not certify evolved navigation intelligence.
Physical resources, mortality, funded brood development and variable population remain active.
Controller implementation does not itself implement reproductive inheritance or live evolution.

The subsequent user correction requires a sustainable, interactive colony near 2,000 workers
before genetics. The [scale work order](colony-scale.md) now governs the next steps: physical
capacity, support, storage and care, then measured population and runtime scaling. Pheromones
remain unchanged. The implementation and genetic operators below are retained.

## World and knowledge

Keep the cellular X/Y foreground/backing world, materials, exposed and buried food, chemical
fields, support queries and sequential physical resolver. Routes use actual walkable geometry;
buried resources remain inaccessible. No waypoint exploration system is introduced.

Each colony owns a registry of entrances, queen/care locations, caches and recently observed food.
Nest landmarks are known at initialization. A worker encountering food updates one shared record:
stable location identifier, position, kind, observed quantity and observation tick. Every worker
can immediately read it. There is no individual place catalogue, messenger or propagation delay.
Caches retain their location when empty; food sightings expire after a configurable interval.
An observation of depletion updates the record to zero. Regrowth does not refresh knowledge until
another observation. Knowledge never transfers food or consults unseen resource quantities.

The initial runtime still contains one colony. Knowledge is colony-owned state, not a global
resource oracle; multiple registries and independent discovery follow later. Queen/care-location
knowledge does not supply remote live hunger. Local recipient contact supplies current need.
Resource observations use existing occluded two-cell contact initially; larger recognition ranges
remain an explicit future experiment, not an implicit capability.

Food sightings also retain whether the observed cell had backing. This prevents the seed foraging
policy from treating its own underground deposits as newly discovered exterior supply. The ant
can observe this material fact locally; it is not a global classification of resource usefulness.

The subsequent [settling milestone](settling.md) adds gravity for loose objects while workers
retain backing or surface grip. Queens and cache markers start on floors; displaced landmarks
invalidate routes. The subsequent [construction extension](construction.md) implements excavation,
spoil hauling, queen transport and multiple cache creation/relocation. The original measurements
below predate these changes.

## Observation and action contract

Every ant receives body energy/load, existing local senses and contacts, the shared registry,
its task byte, route status and recent action results. The controller selects a destination from
known locations. Navigation may inspect terrain but never select a target based on hidden food.
Controllers never receive mutable world objects. Observation records are read-only values.

| Request | Semantics |
| --- | --- |
| Up, down, left, right | Attempt one world-axis step through the physical resolver |
| Acquire route(location id) | Plan from this ant to interaction reach of a known location; consumes a turn |
| Route forward | Attempt one step toward the destination |
| Route backward | Attempt one step toward the original start |
| Discard route | Clear the route and destination |
| Pick up, deposit, eat, feed | Attempt a directional local interaction; no remote transfers |
| Emit pheromone | Deposit a local signal and charge its existing energy cost |
| Wait | Time and metabolism continue |

Every request may additionally write a task byte. Null retains the previous value. Values 0–255
are private memory: the kernel never dispatches behavior by task or forces a transition. Seed
programs may label values for inspection; those labels are not action semantics.

The route is a sequence with a cursor. Arriving does not trigger pickup, feeding or a task write.
Backward follows the same path in reverse. Blockage returns failure and never advances the cursor.
Direct movement off the path marks it off-route; the ant must explicitly acquire another route.
Terrain edits invalidate route geometry. Replanning, cancellation and target changes are decisions,
not automatic fallback behavior. No request teleports or bypasses occupancy, support or energy.
Results distinguish success, blocked, empty, full, out of reach, unknown destination, unreachable,
off-route and arrival. Keep a short attempted-action/result ledger in each ant's private state.

## Programmed controller and LGP

The programmed seed chooses requests from observations, shared knowledge and private task state.
Exploration consists of direct movement decisions. Foraging, return and care are seed policy,
not kernel tasks or mandatory rescue behaviors. Ants run the same policy with separate state;
there is no centralized scheduler or fixed worker allocation.

LGP executes a bounded, inspectable linear instruction list over numeric registers. General
arithmetic, comparisons, conditional skipping and input/output register operations express the
policy. Actions and target selection decode through the same contract as programmed ants.
No instruction invokes a whole programmed forage/care controller. Execution is bounded, arithmetic
stays finite, and malformed genomes are rejected at persistence/import boundaries.

Seed a readable program directly; do not train an RNN to approximate it. The controller owns
seed, createState, act, mutate, recombine and genomeDistance. Mutation edits instructions, constants
and program length within declared bounds. Recombination exchanges instruction segments and
preserves executable validity. Genome internals remain inside the controller implementation.
Private registers, routes, task byte and acquired knowledge are not inherited genome data.

The first representation scores candidate requests with a 32-register VM. Register 0 is the score,
register 1 is an optional task write (negative retains the byte), and registers 24–31 persist from
the selected candidate. Inputs include request identity, body/contact facts, observed destination
metadata, route feedback and recent failed acquisitions. All candidates use the same program;
the controller chooses the highest score with deterministic tie breaking. A readable expression
seed is evaluated directly in the programmed arm and compiled to arithmetic instructions for LGP.
Instruction specialization folds constants and removes unused scratch work without changing output
or persistent-register semantics. Programs containing conditional skips use the ordinary VM.

The full observation also retains the original local chemical/light channels, eight fresh-air
samples, body heading and the candidate's colony-known location identifier/coordinates. These
are available to evolved instructions even when the seed does not use them. No hidden food
locations enter candidate construction. The viewer lists the complete input index mapping.

The construction extension adds nine explicit requests and observed work/storage facts. A colony
work request names a site; a worker must choose `claim` before the seed undertakes it. The claim
excludes competing owners but never moves an ant or chooses its next action. The same arithmetic
expression implements work and ordinary storage/care behavior in both controller arms. Checkpoint
v12 stores claims, partial excavation, recoverable spoil, multiple caches and queen attachment.

Initial short-run inspection found repeated acquisition of temporarily unreachable destinations
and excursions back toward deposited food. The seed now uses its four-entry failure history to
temporarily lower failed acquisition scores, observed backing to distinguish exterior supply, and
a local upward movement preference when backed near the entrance. These are mutable seed rules,
not navigation fallback or task dispatch. The predicted effects are fewer repeated failed queries
and fewer supply trips to the colony's own deposits; colony outcomes must still be measured.

## Traceability and validation

| Behavior | Information | Request | Physical consequence |
| --- | --- | --- | --- |
| Discover food | Local food/contact and openness | Direct movement | Travel cost; shared sighting after encounter |
| Reach known food | Shared sighting, body, route result | Acquire then route forward | Travel cost, possibly stale destination |
| Return | Known cache/care site or reverse route | Acquire/forward/backward | Same traversal as exploration |
| Sustain queen/brood | Local need, food and cargo | Pick up/feed/eat/deposit | Attributable transfers and funded development |
| Recover from failure | Recent results, task, route status | Wait/direct move/reacquire | No automatic task assignment |
| Vary behavior | Program genome | Different requests on identical observations | Heritable transmission remains later work |

Bounded tests establish hidden-food isolation, shared discovery, stale knowledge, route reversal,
failure results, task-byte independence, finite VM execution, variation validity and deterministic
checkpoint continuation. Long runs belong in the harness ledger and do not certify visible motion.

## Work order toward heritable populations

1. Record this contract and update governing documents before experiments.
2. Implement colony knowledge and the explicit request/resolution boundary.
3. Implement programmed and LGP ants, including executable seed and variation operations.
4. Integrate checkpoints and a viewer for knowledge, task, requests, route and program state.
5. Measure physical colony outcomes and prepare a multi-ant demonstration; pause for human review.
6. Complete the [2,000-worker physical and runtime milestone](colony-scale.md), including review.
7. After a separate genetics decision, add genome identity, parentage and mutation-disabled
   queen-to-worker transmission.
8. Add funded daughter-queen development, dispersal and founding with initially asexual inheritance;
   establish multiple reproductive lineages in shared finite resources.
9. Enable reproductive mutation and observe descendant success against neutral controls. Runtime
   selection is reproduction and death, never a score, tournament or population reset.
10. Add digging, seasons or microclimate one mechanism at a time to answer an evolutionary question.

Steps 1–5 reached implementation and visual-review handoff. Step 6 is the next planned milestone;
later genetic phases remain backlog, not claims that worker turnover provides heritable evolution.

## Implementation and review

The browser opens programmed ants on compact terrain at tick zero. Select "Linear-program ants"
to run the seeded VM on the same environment. The inspector shows the colony registry, last four
requests/results, task byte, route cursor and program/register contents. The Layers panel toggles
known-location identifiers and route traces. The historical RNN remains separately selectable.

The controller implementation introduced checkpoint v10, settling advanced it to v11 and
construction advances it to v12.
Both designs store the shared registry, every route/cursor, task, private registers, recent
requests and the exact linear genome. Unsupported checkpoint versions are rejected; there is no
old-world adapter. World food/energy remains separate from serialized knowledge.

Reproduce a physical-outcome run from `frontend/`:

```bash
pnpm harness knowledge-colony --driver colony-programmed --layout compact --seed 101 --ticks 48000
pnpm harness knowledge-colony --driver colony-lgp --layout compact --seed 101 --ticks 48000
```

Results, full configuration, source digest, genome digest, action counts and outcome time series
are written to the harness ledger. `--output <directory>` additionally saves a world checkpoint.
No fitting, genome selection or automatic mutation runs during these assays.

## September 8 measurements

| Ledger | Controller | Layout / seed | Ticks | Queen | Workers | Births | Survival gate |
| --- | --- | --- | ---: | --- | ---: | ---: | --- |
| 2716 | Programmed | Reference / 102 | 48,000 | Alive | 20 | 53 | Pass |
| 2717 | Programmed | Compact / 101 | 48,000 | Alive | 20 | 57 | Pass |
| 2718 | LGP | Compact / 101 | 48,000 | Alive | 20 | 57 | Pass |

All founders are gone, queen/brood feeding and births continue in both late windows, and maximum
sampled conservation residual magnitude is 2.21e-8. The compact programmed/LGP summary objects
are exactly equal, including outcome time series, action counts, knowledge and final worker
snapshots. These are two world cases and a matched implementation comparison, not three
independent demonstrations of generalization. Tiered-world survival and mutation-neighborhood
viability remain unmeasured.

The common run-start source digest is
`b61f91db45273a81fe407b1c2d47308396314ca88a1fa802f646d2c53403472d`.
The 484-instruction LGP seed digest is
`a74fd0c18022d34b104cc5e356075bff4a874c1d8d0d7175422c7cf56989af12`.
World checkpoints are under `frontend/harness/artifacts/knowledge-2026-09-08/` in the
`programmed-reference-48k`, `programmed-compact-48k` and `lgp-compact-48k` directories.
Wall times were 435, 919 and 1,251 seconds respectively; these are concurrent local batch timings,
not a browser frame-rate benchmark.

The final interface appends local channels and known destination coordinates to the campaign's
24-input projection (69 total inputs). The unchanged seed only reads indices 0–23. Final cleanup
also corrects the world checkpoint-version label and distinguishes full piles in action feedback.
The seed only distinguishes blocked movement from other last-result values, so this feedback
label does not change its decisions. These final representation changes have bounded coverage;
the full campaigns were not rerun after them. Their source digests remain the run-start versions.

Motion is not certified. The compact run records 19,744 failed deposit attempts. Continuing its
saved world located a failure at tick 49,850: worker 63 held 0.699 food and attempted another
deposit into cell (1024,267), already at its 96-unit capacity. This was previously reported as
out-of-reach; the resolver now reports full and preserves cargo/task writes. The seeded decision
policy can still retry full piles. Review this and route congestion visually before deciding
whether to alter the seed or retain them as opportunities for later genetic variation.

Short development runs 2713–2715 established physical transfers and early replacements, not
long-horizon viability. They also exposed temporary-route retry and shared-record serialization
defects; those repairs preceded the full panel. No recurrent fitting or evolutionary search ran.
