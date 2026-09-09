# Default colony pressure audit

The September 8 user review failed after approximately 18,000 ticks without visible new behavior.
The earlier browser check established one excavation and spoil deposit around tick 305. It did
not establish useful autonomous construction or relocation. The review remains failed; this audit
does not change controller rules, climate parameters, food supply, colony size or terrain.

Plan: 3aaecb35-af8a-47f2-b392-6dd277ae09d2.

## Matched replay protocol

`pnpm harness default-pressure-audit --ticks 18000 --digging true --output
harness/artifacts/default-pressure-audit-2026-09-08` replays the browser's compact seed-101
programmed colony. Repeat with `--digging false` for the matched excavation-disabled arm.
Both use `withReviewPressures`, the same configuration constructor as the browser. The only
physical difference is excavation availability. Queen/brood transport and storage actions remain
available in both arms, so this comparison isolates excavation rather than all autonomous work.

The observer records every resolved action and preserves job state after colony memory expires.
It samples candidate inputs and scores once per 64 worker turns, staggered by worker ID, and
records the highest-scoring proposal of each kind once per 256 turns. These samples are diagnostic
observations, not exhaustive counts of opportunities. They never supply an action, observation,
destination or reward to a worker. A bounded checkpoint comparison verifies that attaching the
observer leaves the trajectory unchanged, including when construction proposals are generated.

Every 250 ticks the replay records the colony economy, population, brood, actual queen climate,
known nearby free floors, excavation and spoil totals. Known floor temperatures are timestamped
worker observations, not a census of current remote conditions. Thermal exposure integrates
degrees outside the queen's 18–28°C comfort band over simulation ticks. This measures exposure,
not survival certification or a new controller fitness score. Runtime measurements include trace
overhead; browser throughput is measured separately.

## Measured result

Ledger 2764 is the default; 2763 disables excavation. Both finish the full 18,000 ticks, with no
manual work requests or task overrides. They share runtime digest
`1c441306bc5ff9cccde912fd2cb5289d3335d4652f7e388710c412ad27dcc5be`.

| At tick 18,000 | Default | Excavation disabled |
| --- | ---: | ---: |
| Living workers / births | 19 / 19 | 19 / 19 |
| Remaining founders | 0 | 0 |
| Queen reserve | 23.352 | 23.695 |
| Queen surroundings | 26.452°C | 26.462°C |
| Stored food energy | 85.014 | 86.905 |
| Queen / larval food delivered | 63.021 / 146.089 | 63.214 / 146.298 |
| Completed excavation / spoil placement | 7 / 7 | 0 / 0 |
| Completed brood relocations | 3 | 9 |
| Accepted queen / cache construction / cache relocation jobs | 0 / 0 / 0 | 0 / 0 / 0 |
| Canceled digging jobs | 1 | 0 |
| Last accepted work / last completion tick | 3,351 / 3,435 | 7,260 / 7,272 |
| Queen thermal excess, degree-ticks | 13,903.805 | 12,655.475 |
| Spoiled food energy | 3.576 | 2.559 |

Both arms lose all eight founders to age and have zero worker starvation or brood deaths.
Maximum sampled absolute energy residual is 1.16e-8. Excavation produces no survival or replacement
advantage in this matched pair and increases integrated queen thermal excess by 9.86%. Queen
temperatures converge as the initial heat dissipates. A single seed and this finite horizon do
not establish a general ranking of construction policies.

The default's last cut finishes at tick 3,342; its last brood move finishes at 3,435. Thus the
remaining 14,565 ticks contain no completed construction or relocation. The seven cuts and three
early moves are real, but do not meet the requested visual milestone. The default remains failed.
The UI's recent relocation counts derive from jobs retained for 8,000 ticks, so the early brood
moves have also disappeared from those counters by tick 18,000. That observation loss does not
explain away the long absence of new work.

The [pressure comparison figure](../../frontend/harness/artifacts/default-pressure-audit-2026-09-08/pressure-comparison.png)
shows the two queen-temperature trajectories and the early excavation plateau.

## Where the chain stops

1. **Storage demand is disconnected from actual stockpiles.** The default reaches a peak of
   97.660 stored food energy and ends at 85.014. Its named cache physically contains zero food;
   80.857 units instead lie at (1025, 262), next to the queen, with the rest in nearby loose piles.
   Every recorded storage-fill feature is zero, in both arms. Cache creation and relocation have
   no positive-scoring candidate in the sampled decisions and produce no accepted jobs. This
   confirms the startup dependency described below; the stored-food UI metric is not the signal
   used by the storage controller.
2. **Thermal pressure expires without a useful relocation.** The default has 729 sampled
   proposal frames with a hot queen source, and cooler material appears in 1,926 frames. These
   are separate counts and do not imply a usable, supported, unoccupied destination with a fresh
   source observation and sufficient benefit. No queen proposal scores positively in the 2,726
   sampled proposal frames. No queen job is accepted and no queen carrying action executes.
   This identifies a decision/opportunity failure, not evidence that the carrying resolver fails.
   The current trace does not attribute every rejected proposal to its proposal kind or individual
   gate; further queen-specific diagnosis must retain that distinction.
3. **Nursery demand is mostly absent.** None of the default's sampled proposal frames meets
   the seed's nursery-crowding condition. The disabled arm meets it in six frames and completes
   nine brood relocations using existing space. The full-world condition does not recreate the
   confined supplied-reserve assay that established the individual digging mechanism.
4. **Some selected work wastes turns.** The default resolves 551 proposals as blocked and
   cancels one dig at age 513 ticks; ten jobs finish. The disabled arm resolves 1,093 proposals
   as blocked and completes nine jobs. The policy's site reservations and the resolver's
   additional same-source exclusion differ. The trace establishes repeated rejected proposals,
   but does not assign all of those rejections to that mismatch.

The next recommended correction is the ordinary storage loop: make delivery, capacity observation,
retrieval and relocation describe the same physical stockpiles from the original one-cache start.
Prove that loop without a manually added second cache. Then assess actual space and preservation
constraints before altering climate magnitude or growth rates. Another initial heat pulse or an
early excavation counter is not a sufficient acceptance criterion. A corrective behavior change
must receive a new full default comparison and human review; none is promoted by this audit.

## Contracts checked in the source

| Mechanism | Physical condition and policy gate | Integration concern |
| --- | --- | --- |
| Thermal excavation | A hot source, observed cooler diggable material, supported work/disposal sites and sufficient worker energy | Excavation does not commit the colony to use the new cavity. The queen must subsequently qualify for a separate relocation. |
| Queen relocation | An observed empty supported site more than two cells from the source; source observation younger than 512 ticks; comfort gain above 2 plus 0.05 times source-to-site distance | A cool solid cell is an excavation opportunity, not a usable relocation site. A transient temperature difference can disappear before the second decision. |
| Nursery expansion | Observed brood and fewer than two free nursery floor cells, or sufficiently high local traffic | An already-built nest need not become crowded at the current reproduction throughput. |
| Extra cache | Observed food at named caches exceeds 70% of their capacity, including planned capacity | The general stored-food metric includes all accessible interior food; the expansion sensor counts named cache locations only. |
| Cache relocation | A recently observed source cache holds more than 0.5 food and an empty supported destination is over 0.2 drier and below 30°C | Food lying outside named caches is not a relocation source. |

The default queen begins at (1026, 263); the original cache is at (991, 274), with capacity 96.
Ordinary return/deposit rules target the queen and nearby open cells. The seed's additional
cache-directed delivery rules require `storageChanged`, which is false while the original cache
is the only cache. The trace confirms this circular startup dependency:
delivery to named storage depends on a changed cache arrangement, while expansion depends on
existing cache use. Retrieval rules can already use a known nonempty original cache; they do not
put food into the empty default cache.

The queen lays at most one egg every 800 ticks. An adult lives at most 16,000 ticks. Under steady
production, even perfectly funded development supports an average population of roughly 20 adults
before other losses; delayed development can still produce transient emergence bursts. These
settings do not create a path toward a sustained 2,000-worker colony. The scale design already
defers the required food, care and nursery throughput work. Increasing food alone does not remove
the current laying-rate limit. None of these rates are changed by this audit.

## Browser pacing

The former 1x setting meant one tick per animation frame; higher multipliers raised the batch
limit while retaining the same 9 ms compute budget. The replacement offers explicit targets of
1, 10, 30, 60 and 120 ticks per second plus Maximum. The default is 30 ticks per second. Targets
follow elapsed wall time independently of display refresh rate. Maximum uses the available frame
budget; it does not guarantee full CPU utilization. A single indivisible tick can exceed the budget.
Catch-up debt is bounded, and resuming after Pause starts a fresh clock.

Metrics displays requested rate, measured ticks per second and computation milliseconds per tick.
When measured throughput falls below the target, it states that computation and display work are
limiting the rate. All other controls remain available. Simulation state and pacing are separate;
changing the target does not change the physical duration or cost of a tick.

The isolated browser check uses actual Run, Pause, New world and tick-rate controls. Each rate
starts the same default world at tick zero. In four-second windows, target 1 advances three ticks
and reports 1.0 ticks/s in its last measurement window; target 10 averages 9.63 ticks/s; target 30
averages 24.68 ticks/s; Maximum averages 25.44 ticks/s. Short-window totals include startup latency
and differ from the last one-second rate. Pause stops tick progression at every setting. These
host-specific measurements establish working pacing and throughput reporting, not colony behavior.

Artifacts: `frontend/harness/artifacts/default-pressure-audit-2026-09-08/`, including the browser
probe's `browser-pacing/browser.json` and inspected `browser-pacing/canvas.png`.
