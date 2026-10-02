# Mortality configuration tuning — October 2

The user authorizes configuration tuning and world restarts to obtain a sustaining world.
Preserving previous worlds is not a requirement. A better startup alone is insufficient.
Keep mortality recovery enabled and ordinary evolution installed; use existing supply controls.

## Registered operating comparison

Use the native server's ordinary seed27 ecology world, chemistry101,48 founders and16 threads.
Observe its existing bounded `/health` summary: population, living biomass, cell energy,
births/divisions/deaths, paid uptake, captured work, growth and recovery. Store raw summaries
locally in the existing ignored artifacts directory; add completed trials to the existing ledger.
There is no new reporting service or physical mechanism.

Question: does preserving finite batches at reduced release support repeated replacement after
initial reserves and nominal renewals? Competing explanations are an inadequate release ceiling
and excessively interrupted feed, versus sufficient ongoing food that yields bounded turnover.
Previous rate0.1/T600 failed at12,412 ticks; rate0.1/T1200 improved startup but was only measured
to3000 ticks. Prior rate0.2/T600/G600 supported a large populated v49 world.

Retain a nominal unit-richness batch of120 material in each candidate, using T=120/r, rather
than silently cutting startup stores again. SourceGap G remains the other installed control.
Ignoring local seasonality, mean external supply is r*T/(T+G), in material/s per richness.

| Candidate | r | T, model seconds | G, supply seconds | Mean supply per richness |
| --- | ---: | ---: | ---: | ---: |
| Current full batches | 0.1 | 1200 | 600 | 0.066667 |
| Higher reduced ceiling | 0.15 | 800 | 600 | 0.085714 |
| Shorter interruptions, if needed | 0.15 | 800 | 300 | 0.109091 |

Run these serially only as needed. Start with the current full-batch configuration. A concrete
starvation decline or extinction selects the next candidate; do not select by founder lineage,
desired population count or invented controller reward. All genotypes, learning, mutation,
terrain and seasons remain ordinary production settings.

For each trial, inspect an initial1000-tick pilot and then stop its comparison at30,000 ticks,
extinction, physical failure or600 wall seconds. Poll scalars every10 seconds; cap total tuning
at90,000 ticks and30 wall minutes. The30,000-tick horizon covers two3000-model-second seasons
and several nominal replenishment cycles, rather than repeating only the initial3000-tick check.
No parameter grid, seed sweep or automatic horizon extension is authorized by this registration.

These are observation horizons on an explicitly authorized running server world. End each
comparison at the first poll reaching its tick horizon and record any sampling overshoot; do
not pause the user's selected populated world merely to enforce an observation timestamp.

Assess net living-mass change, birth/death replacement and continuing uptake across the late
portion, including decline/recovery rather than treating an endpoint population as stability.
Use birth accounting where fission yields two births and ends one parent. A populated late
interval with replacement and no sustained collapse supports a sustaining configuration over
the measured interval; it does not prove an indefinitely stationary ecology. Stop testing once
a candidate supplies that operating evidence and leave its world running. An extinct trial is
restarted, not left simulating empty time. If the bounded envelope is insufficient, retain the
negative result and adapt explicitly to the measured bottleneck instead of silently sweeping.

## Selected configuration and operating result

Keep sourceRate0.1, sourceLifetime1200, sourceGap600 and enabled mortality recovery with
tau60/h_star0.25. These are already the delivered defaults in573b95e; the missing operating
step was applying them to a new world instead of retaining the extinct saved configuration.
The user-authorized restart replaced the empty world with ordinary seed27, server generation2.
No higher release ceiling or shorter gap trial was needed.

The registered comparison ended at tick30,252 with472 cells,841.918 living material and no
physical stop. This covers6050.4 model seconds and ordinary source renewals. Population fell
from150 at tick11,312 to109 at14,848, then recovered to175 at16,334; the declining interval
did not continue to extinction. Paid uptake and funded growth continued through the recovery.

| Late window, tick25,072 to30,252 | Measured result |
| --- | ---: |
| Living population range | 462–527 |
| Population change | +3 |
| Living material range | 841.918–1093.212 |
| Divisions | 1594 |
| Actual deaths | 1591 |
| Paid uptake, material | 13,414.221 |
| Funded growth, material | 2754.156 |

Living mass and population fluctuate; the result is sustained funded replacement, not a claim
of a constant population or stationary biomass. Recovery remained enabled and admitted36.458
of7404.604 dead-body material by the horizon. No recovery-ablation comparison was run, so this
operating result does not attribute the sustaining outcome uniquely to death feedback.

After the registered comparison, the selected world remained running. Routine operating reads
saw329 cells at tick35,905 and755 at39,384, with living biomass786.260 and recent funded
growth exceeding recent dead-body loss at the latter read. This records another decline and
recovery; no extra trial, parameter sweep or test horizon was launched.

The initial restart reply confirmed48 living cells at tick1. The first periodic health sample
was tick6408; startup before that is unobserved in this live series and is covered separately
by the earlier bounded startup fixtures.42 scalar samples took410.127 monitoring seconds.
The first poll beyond the target overshot by252 ticks, as allowed for live observation. The
remaining conditional candidates were not selected. Ledger entry4450 retains config, operating
summaries and limits under `frontend/harness/artifacts/mortality-config-tuning-oct2/` locally.
The deployed binary digest was not measured; the record identifies native v50 and repository
source573b95e without asserting byte identity. No raw evidence is committed.

Document/link and experiment-storage checks pass. No runtime code changed in this operating
delivery; its defaults already passed repository CI in the preceding configuration correction.
Restarts within a tuning request no longer require another permission question or preserved
old-world checkpoint. The selected populated world stays running.
