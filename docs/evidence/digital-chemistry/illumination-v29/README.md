# Local illumination v29

September 19, 2026. [Registration and law](../../../plans/archive/ENVIRONMENTAL-ECOLOGY-PLAN.md#local-illumination).

## Implemented opportunity

Two local response components modify the existing external-work contraction in cells,
dissolved material and reservoirs. Three independently advancing phases act through two
spatial axes and one mixed harmonic. Chemical transformations, abiotic kinetic engagement,
source renewal, motion and cellular sensing retain their existing rules. Default contrast
is 0.8; periods are 600/7,200/31,000 model seconds. No overall work-strength increase was made.

The feature provides conditional metabolic returns. It does not establish evolved use of
illumination, sustained diversity or chaotic dynamics. Rational phase periods repeat after
1,116,000 model seconds; ecological feedback can have different dynamics.

## Short paid responses

[Assays](assays.json), [ledger IDs and native binary digest](assay-ledger.json).
Eight registered single-cell cases, 1,904 actual ticks total, no extended horizon. Role 1
converts 128→136; role 2 converts 136→8. Mutation and private learning are frozen; ordinary
funded machinery, diagnostic RNN transport/repair, material, work and damage remain active.
Both finite source interfaces and the uniform field are translated together, preserving
relative geometry. Reservoir release and weathering are disabled to isolate cell return.

Two locations in seed 27 maximize the difference between the two illumination responses.
The initial footprint responses are approximately (.267,1.734) and(1.459,.370).
Uniform controls at both locations agree and survive 300 ticks.

| Role and region | Uniform: captured work / survival | Varied: captured work / survival |
| --- | --- | --- |
| 128→136, response 2 favored | 3.852 / 300 ticks | 7.834 / 300 ticks |
| 128→136, response 1 favored | 3.852 / 300 ticks | .189 /death at 68 |
| 136→8, response 2 favored | 3.837 / 300 ticks | 0 /death at 36 |
| 136→8, response 1 favored | 3.837 / 300 ticks | 6.207 / 300 ticks |

Unequal terminal horizons are explicit; these totals are not equal-time rate estimates.
The zero-tick occupied-row calculation already predicts the reversal. At an identical
.016 material initial conversion, role 1's usable return changes from .231 to .010 across
the two locations; role 2 changes from −.0174 to .1875. Interval upkeep is .0121 before
transport, repair and growth. Unfavorable reactions therefore fail to finance the body.

Favorable extra capture mostly overflows: role 1 overflow rises 1.710→5.457 and role 2
1.721→3.969. Their constructed material and repaired damage match the corresponding
uniform controls. Brightness therefore does not produce additional growth in these supplied
fixtures. The consequential pressure is loss of affordable metabolism in the other region.
Construction can spend initial reserves before starvation; it is not by itself paid success.
All recorded material/work residual checks pass. No phenotype was promoted to a founder.

## Ordinary startup calibration

Ledger 4165/4166: seed 27, ordinary founders/mutation/private learning, 3,000 ticks per arm
(one fast cycle), 120-second caps. Both reached the horizon in about 10.7 seconds.
Uniform ended at 158 cells; varied ended at 130. Both reached generation 14.
Varied had 178 divisions and 96 deaths versus 237/127; this is changed startup selection,
not evidence of improved diversity. Overflow was 2345 versus 2151 despite lower captured
work 4527 versus 5008. This feature does not eliminate global work saturation.

The candidate survives the fast cycle without global extinction and creates the intended
opposite local opportunities, so contrast .8 is selected without a parameter sweep.
The initial passive reserve calculation for the damaged probe is 33 seconds; the 600-second
fast cycle is slow enough for physiology to experience adverse conditions. Slower periods
remain hypotheses for the user's continuing observation, not long-run certification.

The uniform run's source-digest warning followed harness formatting during execution;
the captured WASM stayed unchanged. Both arms retain their exact binary/config manifests,
initial/final saves and100-tick samples under
`frontend/harness/artifacts/illumination-v29/startup-{uniform,varied}`.

## Cost and implementation limits

[Capacity v28](capacity-v28.json), [capacity v29](capacity-v29.json),
[4,166-cell v28](dense4166-v28.json), [4,166-cell v29](dense4166-v29.json).
Ledger 4152–4156 and 4167–4170. Each constructed workload includes ordinary WASM stepping,
census, selected inspection and borrowed render preparation: 10 warmup and 100 measured ticks,
followed by save/restore and 3 continuation ticks. All continuations match and all horizons finish.

| Workload | v28 ticks/sec | v29 ticks/sec | Per-operation time change |
| --- | --- | --- | --- |
| 48 fixed cells | 86.05 | 82.94 | +3.76% |
| 2,000 fixed cells | 35.66 | 36.50 | −2.28% |
| 2,000 growing cells | 22.61 | 21.86 | +3.45% |
| 4,166 fixed cells | 20.72 | 22.52 | −7.99% |

Single bounded samples satisfy the 5% added-time target; variability and changed trajectories
mean the negative differences are not an optimization claim. Growing and mature-sized
workloads remain below 30 ticks/sec. Their failure to reach that broader target predates this
feature. WASM high-water memory is effectively unchanged: about 192/595/969/978 MB across
the four workload sizes, including restored worlds.

The [original mature save](mature-v28.json), tick 143249 and 4,166 cells, runs at 21.10 ticks/sec
under its original v28 kernel. Its field has 19,200 active nodes and 375,481 active SIMD groups.
V29's controlled 4,166-cell comparison does not establish performance on that exact evolved
mixture. The old checkpoint was neither migrated nor relabeled as a current save.

The native scalar evaluator costs approximately .0003/.0009 ms per tick for 12 queried nodes
at 160×120/640×480. Evaluating every node costs .12/1.83 ms. These are evaluator-only native
measurements; they do not establish performance of the entire 16× larger world or WASM.

All local generated artifacts are under `frontend/harness/artifacts/illumination-v29`.
Physical v29 rejects earlier checkpoints; the uploaded mature v28 save is measured using
its original binary. No save adapter or alternate runtime was introduced.

## Delivery

`make ci` passes 144 Rust unit, 17 Rust integration and 62 frontend tests, including borrowed
buffer uploads, paused layer changes, observer-neutral physical continuation, shared work
closure, illumination bounds, frame transformations and all three work consumers. Twelve
existing ESLint warnings remain. The selected default changes only the new forcing controls.
The default cell and chemical map display choices remain unchanged.

The [browser check](browser.json) and [screenshot](browser.png) use the actual existing
development server with an isolated Chromium profile. Default v29 starts paused at tick 0,
contrast .8. Composite illumination renders smoothly through worker WebGL2; selected inspection,
pause and manual recovery save pass with no worker errors or UI alerts. The 300-tick polling
target stopped at 431 ticks because the last observation arrived after the target; this is
the actual short horizon, not a claimed exact 300-tick stop. Save took 231 ms.
Human initial motion/legibility review remains pending and is not replaced by this screenshot.
