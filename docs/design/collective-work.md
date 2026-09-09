# Collective work and attributable behavior

Plan `747008ac-ccc1-4fde-a842-90e34ad1eea0` follows the rejection of food packs and
minimal excavation. The user authorizes implementation and observability on September 8.
The previous repair remains evidence, not accepted behavior.

## Contract

Keep shared observed locations, ant-selected terrain routes, task bytes and the common
programmed/LGP decision boundary. Do not add a global worker allocator, leader election,
automatic room blueprint, hidden demand score or new training. Physical actions remain local.

First trace food acquisition, route changes, empty returns, per-source convergence and
successful transfers. Establish the actual empty-return trigger before changing the policy.
Use private experience and observable local competition to reduce wasted trips. Do not merely
add recruitment to a colony that already sends too many workers to a food item.

Construction must support continued work around an occupied area, rather than terminating
its purpose after one cell. Workers may divide excavation and spoil transport, using physical
loads and locally encountered signals. Controller-authored recruitment is permitted by this
decision where participation needs information not already supplied by ordinary contact.
It supersedes the earlier instruction to leave pheromones unchanged within this scope.
Signal labels are seed conventions; transport never supplies tasks, counts or destinations.

Demand and geometry must be measured together. Current reproduction supports roughly twenty
workers. A larger nursery demonstration must account for funded laying, food throughput,
occupied space and tending access. Neither founder multiplication nor artificial heat is a
substitute. Larger chamber volume must have an attributable use in the vertical 2D model.

## Observability and acceptance

The harness records event-level ant identity, position, action/result, cargo, old/new destination,
and contemporaneous decision inputs. It retains spatial frames for inspection, per-target trip
histories and construction participation/use. Counts distinguish observations from explanations.
Default Metrics must expose failed/empty trips and ongoing work; review uses Run at tick zero.
Detailed diagnostics never feed policy decisions.

Compare each changed mechanism with its baseline. Keep programmed/LGP parity, mortality,
conservation and deterministic continuation checks. Test negative feedback on depleted/crowded
food, sustained multi-worker excavation, physical spoil handoff, stopping after demand is relieved,
and ordinary care during construction. Record unproductive excavation and failed runs explicitly.
Do not infer motion acceptance from colony survival. Human review follows the measured default;
leaders, cooperative heavy loads, genetics and neural training remain separate work.

## Implemented mechanisms

The common seed first preserves a viable food route, reacts to observed depletion and scores food
quantity, travel distance, stable individual preference and competition visible within two cells.
Shared care need no longer sends empty outdoor foragers back to a cache. These are controller rules;
neither food reservations nor a colony worker allocator was added.

`remember-site` records the adjacent cell selected by the ant, its observed backing and the tick.
`forget-site` releases that private memory. Only its owner can acquire a route to this landmark.
The seed starts work at an accessible floor edge beside locally crowded brood, works along that floor
and clears headroom, and releases commitment after space relief, loss of accessible work, an acquired
food/transport load, low reserve or a bounded interval. These geometric preferences live in the seed;
the dig resolver still permits any physically legal local excavation. Other policies can choose
different shapes and release conditions.

`drop-spoil` releases the actual carried material to an adjacent supported loose pile; another ant
may recover it using the existing mandible action and haul it to the surface. Dropping is not itself
evidence that another ant received the load. Manual single-cell jobs retain their existing spoil
completion semantics. Pheromone B emission is a chosen, paid action. Empty workers can follow its
locally sampled contrast; the signal contains no destination, crew count or task assignment.
Autonomous spoil haulers use the known entrance to reach the surface, then move at least nine
cells away before depositing on supported ground. An earlier trial built a spoil tower at the
entrance; this seed rule prevents that observed obstruction without changing legal dig actions.

Brood-placement scoring favors proximity to other recently observed brood on the same floor level.
This uses the existing shared observation table, not remote worker intentions. Existing relocation
can otherwise disperse brood into spare space and remove construction pressure before a chamber
grows. No room blueprint or automatic brood assignment was added.

Checkpoint v17 persists private worksite memory and a bounded 64-event behavior history with totals.
The default Metrics tab shows food-route convergence, loaded/empty nest entries, loose-soil drops and
recoveries, worksite commitment and signal emissions. Purple squares identify remembered worksites.
These viewer observations never become controller inputs.

## Measurement tools

`pnpm harness collective-work --collective true --ticks 4000 --output harness/artifacts/example`
runs the default conditions from tick zero. `--collective false` disables worksite commitment,
recruitment and autonomous spoil-hauling preferences. Foraging repairs and brood-placement scoring
remain common to both arms;
`--digging false` disables excavation in the physical resolver. `--laying 160` is a separate demand
assay, not a new browser default. `--arena true --ticks 256` uses supplied brood and reserves in a
small mechanics arena and cannot establish survival. `--driver colony-lgp` runs the compiled seed.

The generated `behavior.json` contains action-level identities, request/results, target quantities,
construction decisions and worksite movement, plus bodies and terrain sampled every 20 ticks.
The current trace captures the state immediately before resolution, including any prior settling.
Its earlier development revisions used the previous decision's endpoint. Final checkpoints and
summaries are written to the ordinary construction ledger with configuration and source digest.

Against an already-running local Vite instance, the existing `browserCapacity.mjs` runner accepts
`behavior` plus the checkpoint's `/harness/artifacts/...` path. It produces a six-frame spatial
contact sheet using the production renderer. The `pressures` mode exercises the actual Run/Pause
controls and requires the default behavior panel. Sampled images cannot certify motion between
frames; the event trace and human visual gate remain necessary.

## Development findings

| Run | Conditions | Finding |
| --- | --- | --- |
| 2785 | Original default, 2,000 ticks | 28 empty nest entries and 23 loaded entries. At tick 519 two outdoor foragers switch to the same cache under shared care demand. |
| 2786 | Only outdoor care-fetch guard | 1 empty entry, 29 loaded entries. This isolates a controller error before adding recruitment. |
| 2787 | Depletion and local competition | 1 empty entry, 24 loaded entries. Food-route arrivals without pickup within 12 ticks fall from 18 to 2; storage falls and acquisitions rise. The pickup window is an association, not proof of intent. |
| 2788 | First persistent-work attempt, laying 160 | 2,830 acquisitions by tick 2,000; repeated worksite/entrance switching. Failed. |
| 2789–2792 | Commitment and local geometry trials | Physical dig/drop/recovery occurs, but small cuts and route conflicts remain. Failed as chamber evidence. |
| 2793–2795 | Supplied mechanics arena, 256 ticks | Two adjoining cuts, one traversed. Programmed/LGP summaries match for 2793/2794. Brood relocation removes the original pressure; the pile drop has no observed recovery in this arena. |
| 2796 | Development default, 4,000 ticks | Four cuts, four loose drops and four recoveries; queen alive with two births. No cut is used by brood or food. Trace exposes a cache builder collecting unrelated spoil and care/storage route oscillation. Both mechanisms were subsequently corrected. |
| 2797 | Earlier occupied-floor trial, laying 160, 8,000 ticks | Sixteen cuts, four later occupied by brood, connected expansion of the queen floor. Five births and queen reserve 17.46, but 7,664 acquisitions and 191 empty entries. Failed traffic quality; not the integrated candidate. |
| 2798–2799 | Intermediate default comparisons | 2798 repairs care/cache conflicts but still has 12 empty entries; 2799 matches the earlier 2796 seed, not the final candidate. |
| 2800 | Brood aggregation, laying 160, 8,000 ticks | Seven cuts, one used by brood, three births. Queen reserve falls to 8.207 and feeding stops early. Failed care continuity. |
| 2802 | Integrated care/cache repair, laying 160, 8,000 ticks | Twelve cuts, three used by brood, five births and queen reserve 15.934. 104 empty entries and 3,977 acquisitions; predates the entrance disposal repair. Failed traffic quality. |

## Current review candidate

September 9 runs **2801 / 2803** compare the programmed controller and compiled LGP seed on
seed 101, ordinary default laying every 800 ticks and collective work enabled. Their sampled
colony outcomes, behavior totals and construction-use records match through 4,000 ticks:

- 38 loaded nest entries and zero empty entries; 61 pickup actions include cache pickups.
- Four cuts, four loose drops, four recoveries and four physical spoil placements.
- Two cut cells traversed and one occupied by brood; no cut used for food storage.
- Three worksite commitments and five ant-authored B signals.
- Queen alive with reserve 21.458, eight workers including two births, stored energy 10.563.
- 1,330 route acquisitions and 531 destination changes. These still merit scrutiny; zero empty
  entries does not establish that all route churn or congestion is solved.

The trace establishes actual cross-worker soil transfer: ant 3 contributes two units to a pile
at ticks 1,800 and 1,806; ants 3 and 4 recover those units at 2,226 and 2,260. Ant 5 drops a
separate load at 2,406 and ant 6 recovers it at 2,954.
The inspected production-renderer spatial sheet shows a brood-occupied extension, the queen
remaining at the bottom and spoil deposited away from the entrance. It does not show a large
new chamber. The default completes four brood relocations and no queen relocation, cache
creation or cache relocation during this horizon; those zero counts remain visible.

The actual browser reaches tick 4,000 from tick zero using only Run and Pause, reproducing
38/0 entries and four excavations. The behavior panel is visible by default. Its endpoint was
inspected separately from harness replay; motion between sampled images remains uncertified.
Artifacts are under `frontend/harness/artifacts/collective-work-2026-09-09/`: `review-default`,
`review-lgp` and `browser-final`. Each assay retains configuration, source digest and event data.

Full `make ci` passes 209 tests in 57 files, lint, formatting, typechecking, documentation and
Terraform formatting. The production build passes. The existing optional-property lint warning
and bundle-size warning remain. One loaded test invocation timed out; its targeted repeat and
the subsequent full suite passed without weakening the timeout. A latest-seed faster-laying
run and one browser attempt exited 143 without completion; their termination cause is unverified.
Interrupted checks are not behavioral results. The subsequent default browser check completed.

No 2,000-worker or genetic claim follows from these runs. The faster-laying assay increases demand
but does not establish a sustainable food/care budget. Its nominal birth investment is 0.05 energy
per tick, before worker maintenance, brood metabolism and physical work. Current default laying
remains 800 ticks; only the independently measured growth assay uses 160.
Human visual acceptance, sustained chamber growth and a funded larger nursery remain open.
Five signal emissions demonstrate use of the action, not effective recruitment. A matched
signal-disabled comparison is still needed to attribute extra participation to pheromone B.
