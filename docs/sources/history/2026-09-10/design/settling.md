# Capacity assessment and physical settling

The user authorized SCALE-01 and SCALE-02 on September 8. Digging is the next proposed
implementation milestone after this review, ahead of distributed storage and large-colony growth.
Genetics and RNN work remain off. This contract precedes the physical change.

## Physical rule

Y increases upward. Once per tick, after regrowth and before fields and ant decisions, exposed
loose food, queen and brood attempt to settle one cell toward negative Y. This is bounded cellular
settling with a one-cell terminal speed, not a velocity/impact or gravitational-energy model.
No crushing, slope rolling or soil collapse is introduced. The existing energy ledger tracks
food and metabolic energy; passive displacement neither creates that energy nor charges ant work.

Foreground solids support bodies from below. Backing supports gripping workers but does not hold
loose food, queens or brood in midair. Occupied destination cells block falling bodies. Bodies are
resolved from bottom to top with stable serialized-order tie breaking; workers that lose all grip
also fall and invalidate their own routes. Attached workers retain their position and action model.
Food piles merge only into available per-cell storage capacity; excess remains above. Buried food
does not move until exposed. Food quantity and source membership stay consistent after movement.

Renewable source coordinates represent stationary production sites, not mobile food objects.
Settling moves their existing food without moving or duplicating the production site. Regrowth
remains charged to the external input ledger. No remote food observation is refreshed by gravity.

The diagnostic cache marker is placed on the chamber floor at generation. If its support is later
removed, it descends through free cells; the material revision invalidates affected terrain queries
and routes. Its contents settle through the same food resolver. Current colony knowledge receives
the queen/cache landmark position, never remote hunger or unseen food quantities. Changed landmark
destinations invalidate existing routes; ants decide whether and where to acquire another route.

New worlds initialize queen and cache at terrain-supported positions so tick zero is reviewable.
Dynamic food and brood still settle during ordinary ticks. Restoring a checkpoint must preserve
mid-fall positions exactly and continue deterministically. A new checkpoint version and mechanism
manifest identify the changed physical contract. An explicit environment gravity toggle preserves
controlled comparisons; the current cellular configuration enables it and historical baseline
configuration disables it.

## Acceptance

Bounded checks cover negative-Y motion, floor/backing distinction, bodies and stacked food,
burial/exposure, support removal, quantity conservation, unchanged regrowth sites, landmark/route
updates and checkpoint continuation. Long colony observations belong in the harness ledger.
Do not alter the controller seed or economy to hide a gravity-induced failure; report it or resolve
a demonstrated integration defect. Changed physical trajectories require visual review.

The capacity probe uses valid, nonoverlapping high-count founder placements with accounted energy.
It measures cost, not sustainable population. Record host, config, source digest and setup/warmup
separately. Browser Canvas timings are isolated headless rendering measurements, not application
frame-rate certification on the user's device.

## Capacity and performance measurements

The assessment used compact terrain, seed 101 and unchanged programmed/LGP seeds. Host: Intel
Core i5-8500 at 3 GHz, Node v24.19.0; browser: cached headless Chromium 151. High-count fixtures
place every founder on a distinct walkable cell, spreading beyond the nest when necessary. They
are load probes, not ordinary colony initialization or sustainable population demonstrations.

| Budget for 2,000 workers | Per tick or concurrent count |
| --- | ---: |
| Successful replacement hatches needed at a 16,000-tick lifespan | 0.125 |
| Maximum laying interval before brood loss | 8 ticks |
| Minimum concurrent brood at 2,400-tick development | 300 |
| Queen-to-egg energy transfer | 0.25 energy/tick |
| Worker-to-larval investment transfer | 0.75 energy/tick |
| Worker, minimum brood and queen maintenance | 1.151 energy/tick |
| Maximum current renewable food energy input | 0.192 energy/tick |
| Current laying neighborhood before terrain/occupancy exclusions | 48 cells |

Food/egg/larval transfers are not additional dissipation: offspring retain funded reserves. The
1.151 maintenance floor excludes travel and other action costs. The present one-egg-per-800-ticks
rate implies about 20 sustainable workers even with perfect development. Scaling must address
rates, physical nursery space and feeding/transport access together. No economics were changed.

| Probe | Workers | Mean tick ms | Mean Canvas draw ms |
| --- | ---: | ---: | ---: |
| Node before settling, ledger 2719 | 8 | 4.81 | Not measured |
| Node before settling, ledger 2720 | 2,000 | 882 | Not measured |
| Node with settling, ledger 2725 | 200 | 108 | Not measured |
| Node with settling, ledger 2726 | 500 | 210 | Not measured |
| Node with settling, ledger 2727 | 1,000 | 232 | Not measured |
| Node with settling, ledger 2723 | 2,000 | 860 | Not measured |
| Browser before settling | 8 | 8.04 | 1.22 |
| Browser before settling | 2,000 | 848 | 13.59 |
| Browser with settling | 8 | 8.01 | 1.34 |
| Browser with settling | 2,000 | 873 | 13.00 |

Node timing excludes construction and ten warmup ticks; large probes sample twenty ticks.
Browser probes sample seven ticks after three warmup ticks, then thirty Canvas draws, using
1280 × 800 pixels, routes enabled and chemical overlays disabled. A pixel readback completes
Canvas work. These small, non-repeated samples identify a large bottleneck; the before/after
differences do not estimate the isolated overhead of gravity. Setup, terrain placement and
trajectories also differ. Mean tick costs near a second preclude interactive 2,000-ant simulation
on the current main-thread scheduler, regardless of the much shorter draw cost.
The intermediate fixtures already exceed the scheduler's nine-millisecond per-frame simulation
budget. Their knowledge-record counts and route workload differ, so these samples do not establish
a single population-to-runtime scaling exponent.

The CPU profile in ledger 2721 includes setup as well as stepping. Largest named self-time
contributors include route acquisition, candidate observation construction, contact/sensing and
the programmed expression evaluator; field equilibration is also substantial during setup.
Route acquisition allocates and fills a grid-sized parent array per search and repeatedly checks
occupancy against worker arrays. Later optimization should begin with those measured paths,
reusable search storage and spatial occupancy lookup, preserving sequential action semantics.
No broad runtime optimization or change to ant decisions was made in this milestone.

Artifacts live under `frontend/harness/artifacts/gravity-2026-09-08/`: `before/`, `after/`,
`visual/canvas.png`, and named colony-run checkpoint directories. Node rows retain complete
configurations and source digests. Before-settling source digest:
`c6caf986bccc5f9eb1f3bffa23a3238338c464da70bd3425ca5e5c0a2fdb1b85`.
The after-settling capacity row has digest
`58a71d2718a34e6c15b87db2276576d98e825f0f1b026616f2e07861e85c52aa`.

## Physical verification and review

Programmed and LGP 8,000-tick summaries are exactly equal (ledgers 2722 and 2724), including
action/result counts, knowledge, sampled economy and final workers. Both have a living queen,
11 workers and seven births. This is an early comparison, not the complete survival gate.
The first programmed run source digest is
`ea419f3c5916d5006c9dcdb0da713df39771b660eb5fd783c9c6107173e9c3b5`;
the LGP comparison follows mechanical refactoring/formatting at
`409663fa0f65356c9a0654466a0e10178a21d4c84a564fe4c0a47d7f2dc63a8b`.

The full programmed 48,000-tick observation passed the survival and continued-care gates
(ledger 2728, source digest matching the LGP comparison above). The queen survives with
21.591 reserve energy; 20 workers remain, 57 have hatched and all founders have died. Stored
food contains 471.983 energy. The maximum sampled absolute conservation residual is
2.488e-8 energy. The campaign took 1,184.885 seconds; its checkpoint is in `programmed-48k/`.
This demonstrates replacement on this seed and configuration, not varied-map or 2,000-ant viability.
No policy weights, task rules, food productivity or lifecycle rates were changed to obtain that
behavior. The final generation cleanup chooses a walkable founder position beside floor caches
on varied nests; it preserves the compact seed-101 start used in these campaigns. Bounded checks
cover that additional fix.

Initial integration exposed five older transfer/sensor fixtures that placed food and workers
inside soil after the queen moved to the floor. They now carve an explicit open feeding lane;
pickup still rejects buried food. The complete CI passes 132 tests, typecheck, formatting,
documentation checks and Terraform formatting. Human motion review remains required. The saved
Canvas image was inspected for floor placement; a still image does not certify later traffic.

Run from `frontend/`:

```bash
pnpm harness colony-capacity --workers 2000 --ticks 20 --label gravity --output harness/artifacts/capacity-review
pnpm harness knowledge-colony --driver colony-programmed --gravity true --ticks 48000 --output harness/artifacts/settling-review
node harness/browserCapacity.mjs /path/to/chrome http://localhost:26000 harness/artifacts/browser-capacity
```

The browser command uses an already-running local server and an isolated temporary browser
profile. It does not start a server. Environment controls expose the gravity toggle; checkpoints
store it and the new settling mechanism. Old world checkpoints are rejected, without an adapter.
The browser default remains a fresh programmed colony on compact terrain, paused at tick zero.

After review, the next work is digging: directional local excavation, material-dependent work,
finite carried spoil and physical deposition, terrain revision and route/support invalidation.
Preserve foreground/backing distinctions and buried-food exposure. Brood transport, distributed
storage and growth to 2,000 follow; genetics remains deferred.
