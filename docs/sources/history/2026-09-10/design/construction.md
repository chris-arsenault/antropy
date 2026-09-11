# Digging, queen transport and cache relocation

The subsequent [autonomous construction milestone](construction-pressures.md) supersedes this
milestone's manual-order boundary. Workers now select construction and relocation from observed
temperature, moisture, space, storage and traffic conditions. Brood carrying is implemented.
Browser work requests remain optional diagnostics; the implementation record below preserves the
original checkpoint-v12 measurements, not a requirement for normal operation.

The September 8 request authorizes these mechanisms before population scaling. Construction
requests are explicit colony-level interventions, selectable in the browser and persisted. They
name a work site, not a route or an assigned ant. The programmed policy and its compiled LGP seed
choose whether to claim work, travel, excavate, carry, place and finish. The task byte remains.
This milestone implements usable construction and relocation, not evolved nest planning.
Local digging, carrying and cache actions are available even without a request or claim. A
request guides the seed policy; it is not a kernel prerequisite for an independently evolved policy.

Excavation affects one adjacent foreground cell. Loose soil, soil, clay and wood require their
declared material work; rock cannot be excavated. Partial work persists per cell. Removing a
cell preserves backing and any buried food and produces exactly one material unit in a worker's
single spoil slot. Food and spoil cannot be carried together. A nominated disposal site must be
reached physically; depositing spoil fills one empty, unoccupied cell with that material. Worker
death leaves recoverable loose spoil. Material identity and quantity survive all transitions.

A worker attaches to an adjacent living queen and carries her as one composite occupied cell.
This is an explicit size abstraction. Attachment and placement each span at most one cell;
movement moves both together, costs extra energy and respects terrain and body collision.
The queen continues metabolism and feeding but cannot lay while carried. Carrier death releases
her at the death cell; subsequent gravity applies. Other workers cannot attach simultaneously.

Caches are registered physical storage sites with stable identities and per-cell food quantities.
Creating one marks an adjacent supported open cell; it does not create food or terrain capacity.
Relocation creates a destination, hauls food in bounded crops, and retires the empty source.
No action teleports food or renames a nonempty pile into a different location. Queen/cache
landmarks update only structural positions; resource quantities still require local observation.

Requests can wait on inaccessible terrain, full disposal/storage or interrupted care. Claiming
does not grant a private path or bypass collisions. Canceling releases the claim, not its cargo.
Construction must preserve ordinary colony nutrition; no training, genetics, collapse or brood
transport is included. Tests cover contested work, conservation, failure recovery and deterministic
checkpoint continuation. Controller-driven campaigns and browser review establish usable behavior.

## Implementation and limits

The construction module owns requests, partial work, spoil and transport preconditions. The existing
sequential resolver charges actions; terrain revisions invalidate routes and field geometry. Loose
spoil settles before decisions. Death reopens a claim and records the dropped load's location so
another worker can recover it; cancellation preserves physical loads. The original `world.cache`
reference remains for historical single-cache diagnostics only; shared-knowledge storage uses the
cache registry. No old-checkpoint adapter is provided.

The extended controller receives 95 inputs and selects among 23 request kinds. Its readable seed
compiles to 1,676 ordinary VM instructions, within a 2,048-instruction limit. There is no separate
programmed fallback in LGP execution; the work rules are part of the mutable program.

Excavation applies 0.2 work per action: loose soil takes two actions, soil five, clay fifteen and
wood twenty. Each construction action costs 0.002 energy; moving with spoil adds 0.0003 and moving
with the queen adds 0.0012. These costs are persisted configuration. A cache marker adds no hidden
food capacity: food remains in the cell with the existing 96-unit default limit. No brood transport,
collapse, autonomous nest planner or inherited construction behavior is implemented.

## Evidence and visual review

- Ledger 2729 exposed repeated queen reattachment after arrival. The seed now completes the request
  once the queen is placed; bounded tests cover this for both controllers.
- Ledgers 2730 and 2731 completed digging, queen transport, cache creation and two-trip cache-food
  relocation in the controlled arena. Ledgers 2735 and 2736 repeat the sequence with wood and soil.
  The original seven food units reach the destination, and one excavated material unit is deposited.
- Ledger 2733 completed the requests on the actual compact nest but exposed repeated cache-route
  switching. The seed now retains a viable storage route and distinguishes food fetched for care.
- Ledger 2734 repeats all four requests on the compact map and runs to 8,000 ticks: queen alive,
  ten workers, six births, and 52.698 stored energy. Maximum sampled conservation error is below
  6.2e-9. This is short-run operation on one map; it does not certify founder turnover or scale.
- Ledger 2732, with no requests, retains the previous 8,000-tick result: queen alive, eleven workers,
  seven births and 45.102 stored energy.
- Ledger 2737 repeats the full 8,000-tick construction sequence with LGP. Its complete summary
  equals ledger 2734, including requests, positions, jobs, sampled energy and demographic state.
  Programmed stepping took 96.417 seconds; LGP took 161.589 seconds on this host. Source digests
  and full configurations are retained in both ledger rows.
- Final interface review made the local actions available without any work request. A bounded
  test demonstrates an independent LGP choosing excavation directly. Ledger 2738 repeats all
  four jobs after this change; its first 2,000 ticks of sampled colony state match ledger 2737
  exactly. The 8,000-tick campaigns above predate this final action-menu expansion.

The browser probe exercised actual Shift-click selection, cache queuing, Run and Pause in an
isolated page on the already-running local server. The cache completed by tick 40; the saved
image shows the application, construction panel and remaining camera controls. Artifacts and
checkpoints are under `frontend/harness/artifacts/construction-2026-09-08/`. CI covers 150 tests;
the production build passes with its existing bundle-size warning. Human review of hauling,
queen movement and storage/care traffic remains required; counts alone do not certify motion.

## Use

Reload the browser for the current checkpoint contract. Shift-click a cell, choose the work type,
and queue it. For digging, select a supported empty disposal cell and press **Set spoil destination**
before selecting the excavation cell. Cache relocation also requires a source cache selection.
Then press **Run**. The panel shows claims, results and completion; canceled work retains its loads.
Unsupported or unreachable sites can remain unfinished until their terrain or access changes.

From `frontend/`, `pnpm harness construction --driver colony-lgp` runs the controlled arena;
`pnpm harness construction-colony --ticks 8000` measures requests in the actual compact colony.
Both accept `--output <directory>` and retain measurements in the harness ledger.
