# Shared attraction implementation evidence

September 19, 2026. Registration and decisions are in the
[binding plan](../../../design/resource-binding-proposal.md).

## Mechanism

[Ordinary World probes](integrated.json) compare the local identity limit with six-unit
attraction through 3,000 ticks, including finite depletion/refill. They also compare a
funded cell with active and identity enzymes. The identity control dies at tick 48;
the [matched 40-tick follow-up](cell-matched.json) compares both while alive and removes
body contributions in a diagnostic field clone to isolate extracellular chemical feedback.
[Ledger IDs](ledger.json) are 4145–4151, including the 100-tick pilot.

The widest source separation contracts, but median separation ends above its initial
value. These results do not establish long-term cohesion. The chemical feedback effect
is measurable but small; no homeostatic colony or evolved regulation is claimed.

## Cost

The [baseline](baseline.json) is captured v27 from commit `70ef791`.
[Optimized v28](optimized.json) uses the same capacity fixtures and observations:
100 ticks after 10 warmups, 60-second caps, full mesh 2, 48/2000/2000-growth cells.

| Workload | Baseline ticks/s | V28 ticks/s | Added mean step ms |
| --- | ---: | ---: | ---: |
| 48 cells | 88.62 | 86.35 | 0.31 |
| 2,000 cells | 37.21 | 36.89 | 0.28 |
| 2,000 growing | 22.75 | 23.54 | -1.38 |

The last row is a different evolving trajectory and timing sample, not proof of a speedup.
The growing workload remains below 30 ticks/s. Final capacity ledger IDs are 4142–4144.
WASM memory rose by about 0.46 MiB/1 MiB in the two fixed loads; restore/continuation checks
passed. Derived attraction buffers are not serialized.

[Initial implementation](unoptimized.json) narrowly missed the added-cost budget at
2,000 cells. Two repeats are retained as baseline-repeat1/2.json and
unoptimized-repeat1/2.json. One slow candidate sample overlapped local CI compilation;
it is retained and is not evidence for a constitutive-law slowdown. The implementation
then paired equal opposite Gaussian weights to reduce output memory traffic without
changing the selected law. The final optimized panel ran without simultaneous builds.
The integrated native and browser mechanism checks precede this algebraically equivalent
accumulation optimization; bounded tests compare it with direct convolution.

## Browser and limits

[Browser report](browser.json) and [screenshot](browser.png) use the existing local server
with an isolated Chromium profile. Default seed 27, chemistry 101, attractionLength 6;
48 cells initially and 56 at tick 391. No runtime errors or alerts; rendering, selected
cell observation and manual save worked. This is operational evidence, not human motion
acceptance. Long-run persistence, larger geography and climate forcing remain unverified.

Full checkpoints, captured kernels and timing profiles remain under
`frontend/harness/artifacts/binding-*`. No long ecological run or seed sweep was performed.
