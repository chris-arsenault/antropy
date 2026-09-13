# Spatial ecology calibration proof points

Registered September 13, 2026 before execution. These tests use the shared quick runner, its
typed flow observer, exact initial/final checkpoints, source hashes and SQLite ledger. They do
not seek evolved communities or select a browser founder. The ordinary founder RNN is unchanged.

Question: does reducing viscosity permit paid movement between nearby opportunities while a
larger gap remains consequential, and can finite local food fund reproduction? Competing
explanations are unaffordable physical travel, movement that fails to express useful displacement,
and food spread that feeds cells without requiring arrival. Examine local input/action traces,
distance, actual uptake, motor expenses, material construction, survival and divisions separately.

Fixtures use one founder, an initially aligned heading, a 208 × 64 periodic world, no renewing
sources, and a finite mixed A/B Gaussian food patch (96 material, sigma 3). Mutation, private
learning and inherited learning are off. Initial placement is diagnostic knowledge; controllers
receive ordinary local inputs and never a target. Arrival is entering radius 4, distinct from
first uptake, reproduction or persistent colonization. Initial A and B each have denominator 48.

| Case | Initial distance | Viscosity | Food |
| --- | ---: | ---: | ---: |
| resident | 2 | 0.004 | 96 |
| near | 18 | 0.004 | 96 |
| thick | 18 | 0.4 | 96 |
| far | 70 | 0.004 | 96 |
| empty | 18 | 0.004 | 0 |

Budget: first five 300-tick single-cell probes, one seed, 120 seconds maximum per case. Inspect
these before further execution. Up to four 1,500-tick followups may resolve funded reproduction,
arrival or placement sensitivity identified in the probes; select them explicitly from those
results. Maximum total 7,500 ticks and 18 minutes wall time, with no automatic expansion. Stop on
horizon, extinction or wall cap. A missing response changes the design question, not the budget.
Any additional assay needs a stated reason and its own registration, not a silent extension.

Run one named case from `frontend`:

```bash
pnpm harness spatial-probe --case near --ticks 300 --output harness/artifacts/spatial-calibration
```

The separate phase-2 default-world load measurement used 100 ticks with mutation and learning
disabled: 1,623 ms, 49 living cells, 6,758,400 bytes in the eleven fields. This is a short headless
execution observation, not sustained browser performance or an ecological acceptance result.

Probe decision: the resident produced three divisions within 300 ticks. The near case acquired
1.84 material but had not entered radius 4; the thick case acquired only 0.09. The far case's
uptake was numerical-scale Gaussian tails, not meaningful food access. The empty control crossed
the geometric target radius without food, demonstrating why arrival alone is insufficient.
Use the four registered followups for near, thick, far and empty at 1,500 ticks to distinguish
funded founding from diffusion-only access and to observe transit failure. No extra seed or
placement run is selected; this leaves directional robustness unmeasured.

## Results and disposition

Ledger rows 3469–3477 preserve nine cases. Actual execution totaled 6,051 ticks; both extinction
followups ended before their cap. All use source digest
`436089faa97becffc7bf48f1f7a3c4eb748a37863dd8cdebe4274f48b65bbc8f` before and after execution.

| Case and horizon | Stop tick | Living / initial | Founder arrival tick | Divisions | Absorbed A+B material |
| --- | ---: | ---: | ---: | ---: | ---: |
| resident, 300 | 300 | 4 / 1 | 1 | 3 | 12.077 |
| near, 1,500 | 1,500 | 4 / 1 | 350 | 3 | 18.726 |
| thick, 1,500 | 1,500 | 1 / 1 | none | 0 | 3.141 |
| far, 1,500 cap | 776 | 0 / 1 | none | 0 | 0.0000144 |
| empty, 1,500 cap | 775 | 0 / 1 | 268 | 0 | 0 |

The lower-viscosity near founder closed the initial 18-unit gap, reached the radius-4 food region
and reproduced. The old-viscosity control received diffused food without arriving or dividing.
The farther journey and empty control died of starvation. This supports the candidate viscosity
for affordable local movement with consequential longer gaps; it does not establish unscripted
search, evolved migration, directional robustness or persistent colonization. Initial heading was
aligned in every case. Reproduction counts are divisions, not population generations.

The resident's matrix slowed 98.1% of its 114.8 organism-seconds at the probe horizon. Thus paid
local environmental modification can create residence even with a less viscous background, but
benefit relative to a matrix-off control was not tested. Keep that attribution unresolved.

Gaussian tails yield technically positive first-uptake ticks even when intake is negligible.
Use integrated material flows, actual distance and funded growth for interpretation. The quick
report's combined nutrient-loss percentage uses offered A as its denominator; it is not the
fraction of total A+B lost. No ecological success is inferred from that field.

Durable generated results and manifests:
[resident](evidence/spatial-calibration/resident-300-false/result.json),
[near](evidence/spatial-calibration/near-1500-false/result.json),
[thick](evidence/spatial-calibration/thick-1500-false/result.json),
[far](evidence/spatial-calibration/far-1500-false/result.json) and
[empty](evidence/spatial-calibration/empty-1500-false/result.json).
Each adjacent `manifest.json` records the fixture and source identity. Full checkpoints and
traces remain in the ignored local harness artifacts; the ledger retains all nine cases.
