# Fresh composed runtime: registration and evidence

September 15, 2026. [Runtime laws](composed-runtime.md) and the
[root plan](../../plans/archive/DIGITAL-CHEMISTRY-PLAN.md) govern this rebuild. Reports below exercise
the sole production World; historical thermodynamic and candidate-only timings remain history.
Artifacts are local under `frontend/harness/artifacts/rebuild-20260915/` and the existing ledger.

## Initial visual acceptance and closeout

September15: the user reports, “I'm letting a long run happen but the initial visual review
passes”. This completes the initial motion/legibility handoff at restored mesh2 and closes
M3 and the rebuild plan. The user's long run remains ongoing ecological observation;
sustained diversity, adaptation and long-duration operating limits are not established by
this acceptance. The measured saturated-load limits remain in force.

## Browser handoff checks

September15 continuation: the user accepts thresholded h2 performance and considers complete
saturation unlikely in ordinary runs. Saturated benchmarks remain measured limits; further
optimization of them is not a blocker for the accepted handoff scope.

The existing Antropy server is now available at `http://127.0.0.1:26000`. Chrome151 with
headless SwiftShader ran the registered application checks in separate temporary profiles.
No server was started and no existing user session or IndexedDB was accessed. Default and
varied checks used the Vite application; the growth check loaded the generated production
bundle via the existing CDP build interception in its isolated target. `make build` passes.

| Check | Actual stop tick | Living at stop | Approximate observed ticks/s | Manual save, ms |
| --- | ---: | ---: | ---: | ---: |
| [Default seed27, h2](../../evidence/digital-chemistry/rebuild/browser-default-h2.json) | 380 | 61 | 292.04 | 281 |
| [2,000 varied, saturated](../../evidence/digital-chemistry/rebuild/browser-varied-h2.json) | 104 | 1,995 | 28.24 | 3,042 |
| [2,000 growth, saturated, production bundle](../../evidence/digital-chemistry/rebuild/browser-growth-h2.json) | 108 | 285 | 22.17 | 2,992 |

Rates divide elapsed ticks by the interval between the last tickzero status and the first
status at the stopping tick. They include browser scheduling/rendering/observation and
profiling, exclude the subsequent manual save, and are short smoke measurements rather
than sustained performance certification. The existing runner polls status every250ms;
its300/100tick stop requests overshot to380/104/108. No horizon was extended manually,
and all stayed inside their30second wall caps. Capacity packages use the ordinary dense
fixture at h2; their per-node starting material differs from the matched-resolution audit.
Do not interpret the changing growth population as steady2,000-cell capacity.

All three checks rendered, inspected a selected cell, exposed the observation panels,
saved to isolated IndexedDB and finished without unexpected alerts or faults. The default
[fault checks](../../evidence/digital-chemistry/rebuild/browser-faults-h2.json) confirm visible
pause after WebGL context loss, a1,109,472-byte export while paused, context restoration,
recovery to saved tick380, and runtime-report export availability after an injected worker
failure. The screenshot is local at
`frontend/harness/artifacts/rebuild-browser-default-20260915/page.png`.

All browser arms loaded binary SHA-256
`450c3b5cdaf6b1aca8a8a6a1ccbdc05d80959eec3d45d15e412be7ddfe3b6a9f`
and embedded source digest
`47a85286c78dd83f9cf0f5252af23c061476b32275d1977e01c6e01ff7ead198`,
independently checked against the current local WASM. These results close the previously
unperformed automated browser checks. The user subsequently passed the initial visual review
and started a long run. Long-duration operating limits remain unverified. No agent-run
ecological campaign was launched.

## Completed integration and nutrition

### September15 correction: active chemistry and restored spatial resolution

The user rejected processing zeros and negligible diffusion tails after the h2 audit.
New worlds again default to **mesh2**, with seed27 retained. Saved worlds retain their
stored mesh. Field storage remains contiguous Rust-owned f32 memory; the worker's borrowed
WebGL upload path and bounded message protocol are unchanged.

The solver now indexes occupied four-species groups per geographic node. It visits those
groups and their periodic neighbor halo, projects only occupied groups, and clears only
scratch groups it used. When most nodes are occupied, it constructs the same work list
in row order without sorting. Local mixture sampling and render material/value reductions
reuse that index. At each field substep, extracellular concentrations below `1e-24` are
rounded to zero; lost material and reference value enter numerical-error accounts. There
is no identity-dependent/global abundance filter and no intracellular deletion.

The cutoff contributes less than `world area × 256 × 1e-24` material loss per substep.
For320×240,600 ticks and300 field substeps this is at most `5.90e-15` material, separate
from ordinary f32 arithmetic error. Tests check the actual numerical accounts, neighbor
delivery across both seams, empty-region skipping, disappearance, reactivation and exact
above-floor vector results. Dense state storage and full-image preparation still scale
with world area; this is not a claim of logarithmic total cost or memory.

The [paired scaling report](../../evidence/digital-chemistry/rebuild/threshold-scaling.json),
ledger3896–3903, restores identical h2 inputs into the captured old and new WASM binaries.
Localized fixtures have48 founders, sixteen chemicals in one central node, no sources,
mutation disabled and static private learning. They use10 warmup plus100 measured ticks.
The ordinary seed27 startup uses600 measured ticks from tickzero with normal biology.
Both include census, inspection and packed render preparation, with a60-second cap per
case; GPU execution and browser messages are excluded. All runs finish their horizons.

| Matched h2 workload | Dense solver ticks/s | Active solver ticks/s | Active slowest20-tick window |
| --- | ---: | ---: | ---: |
| Localized chemistry,160×120 | 164.19 | 1592.48 | 1209.69 |
| Localized chemistry,320×240 | 61.41 | 1316.12 | 1177.79 |
| Localized chemistry,640×480 | 17.69 | 679.53 | 640.61 |
| Ordinary320×240 startup,600ticks | 61.66 | 372.34 | 288.86 |

The320×240 and640×480 localized cases both end with1,929 active nodes,14,168 occupied
four-species groups and30,472 group evaluations in the last field update. Quadrupling
geography adds no stencil evaluations in this comparison. Full tick costs still include
grid-sized arrays, contact-bin setup and rendering. All localized cases retain48 cells;
both startup arms end with74 cells and identical complete summary/accounting values.
All eight checkpoint restores and three-tick continuations match exactly within their arm.

The unchanged all-channel capacity inputs remain a separate worst case. Their material
at every node exceeds the cutoff. The [capacity report](../../evidence/digital-chemistry/rebuild/threshold-capacity.json),
ledger3890–3895, measures h2 at62.32/31.73/23.40ticks/s for48/2,000/2,000-growth,
versus73.46/34.55/25.29 before indexing. Slowest h2 windows are61.51/31.49/18.18.
This is a7–15% throughput regression in saturated fields; growth still fails30ticks/s.
Do not describe the default-world gain as solving that separate limit. All six h4/h2
capacity endpoints are byte-identical to the corresponding pre-change endpoints, and
all cold continuations match. The growing population remains a changing-load fixture.

The preliminary implementation, ledger3876–3889, retained dense render reductions and
scratch clearing. It improved the large localized case17→184ticks/s and startup62→279,
but included first-allocation cost in localized timing. The final comparison above removes
those scans and warms both localized arms identically. These are implementation comparisons,
not seed searches or ecological evidence. No server was started.

Current measured binary SHA-256:
`5e5939cfddb3237b0c53736f37cb29501b4f6eb5890093ed97f06dc5d309256f`.
The final checkpoint audit reproduced an empty-row edge case: withdrawal can leave tiny
rounding residues in persisted reductions. Restore now retains those locations for the
same next-step cleanup as an uninterrupted world. A focused failing-then-passing test
checks eight exact continuation steps. This cold-path correction does not change the
timed field operators or the benchmark inputs' work lists; the reports retain their
measured binary identity. Full CI checks69 Rust and54 Vitest tests. The renderer test
asserts the restored h2 dimensions and still verifies borrowed WASM uploads.

Final `make ci` and `make build` pass: 64 Rust and 54 Vitest checks, including material/work
closure, continuous products, paid installed expression, birth, exact cold continuation,
genotype retention, newborn contact reset, extinction stopping and body-left steering.
ESLint reports zero errors and 13 warnings. No check was disabled. Browser execution and
automated browser checks remain unverified; headless capacity misses the 200 ticks/s target.
The user subsequently accepted these speeds for now and reported that visual inspection mostly
looks good, with the startup placement issue addressed by the review seed below.

The final zero-tick [economy report](../../evidence/digital-chemistry/rebuild/economy.json)
uses the actual finite body footprint and distinguishes import-only from finite-processing bounds.
The first founder's maintenance is .0126 work/model-second. Under the report's explicitly
assumed internal mixture, finite processing provides at most .05983 work/model-second and
.03748 after upkeep, motor and transport. Accumulated products and actual controller expression
can reduce that surplus. It is not evidence of sustained ecology.

Four registered 600-tick nutrition cases compare supplied/empty at h4/h2, one founder,
mutation/learning/transfer off, finite 48-unit patch and no renewal. First results, ledger
3818–3821 (`nutrition-1`), exposed h4 starvation after seven divisions with material remaining.
At the last metabolic update, growth left .00137 work against .00390 next-tick upkeep.
Construction had protected one tick although metabolism runs every four ticks.

Growth and paid refitting now preserve upkeep, current motor effort and learning work through
the full physiology interval plus one movement tick; proposed larger stock sets the growth
reserve. This changes no source grant, chemistry or experiment horizon. The repeat, ledger
3822–3825 (`nutrition-2`), gives:

| Mesh / condition | Divisions | Living at tick 600 | Constructed material | Imported material |
| --- | ---: | ---: | ---: | ---: |
| h4 empty | 0 | 0 | .6000 | 0 |
| h4 supplied | 9 | 6 | 24.1275 | 25.8491 |
| h2 empty | 0 | 0 | .6000 | 0 |
| h2 supplied | 9 | 8 | 20.9749 | 22.2656 |

These runner versions continued the empty field to tick600 after the final death; the recorded
tick is not a survival time. Subsequent runs stop at extinction. Reproduction benefit survives
mesh refinement, with material numerical sensitivity: about16% more construction at h4.
No sustained diversity, evolutionary discovery or days-long survival follows from this check.

## Bounded chemical and sensory registration

Read prior negative findings in [numerical results](numerical-results.md) and
[reliability results](reliability-results.md): emission previously lacked demonstrated benefit,
detoxification did not improve construction, barriers had small effects, corpse access was finite,
and an earlier fixture confused inherited and installed machinery. Rebuild fixtures explicitly
install their declared targets at tickzero and subsequently use ordinary production rules.

Question: do the new composed laws provide the local physical responses promised by the design,
and which inherited old opportunities fail under the new finite throughput/occupancy?
Competing explanations are absent delivery, weak sensing, unexpressed action, unaffordable
processing and a real response that does not repay cost. These results can change fixture
interpretation or identify implementation defects; they do not authorize tuning for survival.

Seed101; one/two cells in 24×24 geography, h4, dt.2/physiology.8; actual body stocks declared
in initial checkpoints, .5 starting work and finite .8 internal material. Mutation, private
learning, contact transfer and disturbance are off. Private traces start at zero and division is disabled
by an explicit daughter-inventory requirement, so no acquired state is inherited. This isolates individual flows. All run through
World::step and diagnostic RNNs. No controller can inspect chemical IDs or field coordinates.

The existing sixteen named chemical cases run once: crossfeeding with export-off and processing-off
controls; emission with export-off; external/internal compatibility pairs; detoxification with idle
offset; corpse-capture with uptake held; barrier production; degradation with idle offset.
Emission is capped at100 ticks; others300. Stop earlier at extinction or30seconds per case.
Total ceiling4400 ticks/480seconds. No seed sweep, horizon extension or population follow-up.

Budget: actual seed101 values U0=7.7582, U128=3.9309, U240=.6381 permit downhill net work
about3.0119 and2.5842 per unit after the catalytic price. Four .04 enzyme stocks with turnover2.5
and offsets8/7 have pre-occupancy throughput ceilings .0493/.0621 material/model-second.
Donor-to-recipient delivery and product occupancy lower these limits. Both steps could fund
.0126 upkeep but no survival endpoint is assumed. The .8-unit corpse contains at most2.107 work
from 128→240 before catalytic/transport costs. ID120 has stress1; matched membrane response
retains susceptibility .05, while distant susceptibility approaches1. ID15 has impedance11.885
and D=.00514; 0→15 is uphill and a single slot can produce at most .00385 material/model-second
before occupancy. Barrier production is consequently expected to be weak and paid.

Observe actual imports, consumption, products, exported material, receptor values, signed actions,
exposure, work expenses and construction. Crossfeeding needs recipient uptake and processing;
emission needs a receptor/action difference without claiming communication payoff. Compatibility
needs exposure/injury differences; corpse access requires actual captured released material.
Barrier/degradation claims use actual ID15, not a phenotype name. A missing effect stays negative.

Six additional single-cell sensory cases use h4/h2 × left/right/disconnected cue,120ticks each,
30seconds/case (720ticks/180seconds total). Cells start at(9,9)/(9,15), heading0, beside the same
finite patch at(12,12). A fixed .5 swim logit and one body-left receptor→turn connection of gain4
are ordinary diagnostic weights. The control removes only that connection. Positive body-left
input must cause positive turning, mirrored placement the reverse; trace actual displacement,
uptake and motor work. Mesh differences and failure to repay movement remain reportable outcomes.
The founder's corresponding sign is checked independently at its actual controller boundary.

### Registered barrier follow-up

The completed barrier case contains actual paid ID15 (.3880 exported); degradation and its
control both remain alive at300ticks. Use the existing `barrierFollowup.ts` once:100ticks of
production followed by two200tick motion arms sharing its checkpoint, retained versus removed
ID15, with ID15 export held and product export retained. Each arm stops at extinction or30seconds.
The expected effect is reduced mobility/travel at comparable motor work, with no presumed benefit.
Use the saved300tick barrier for the existing ten-step, two-model-second tracer/background
subtraction, retaining versus removing ID15. This read-only field diagnostic creates no alternate
runtime or resource gain. Explicitly kill the saved degradation/control cells and measure ID15
returned with inventories, without further ticks. Total ceiling500productionticks plus40field
updates/90seconds. These paired interventions isolate movement/spread and material return.

## Chemical and sensory outcomes

Ledger3826–3847, `chemicals-1`, all declared horizons or extinction, no wall cap reached.
Per-species arrays are cumulative; `lastLiving` is explicitly the last living sample for a dead cell.

- Crossfeeding: donor exported4.9449 ID128; recipient imported1.5171 and converted1.4782 to ID240.
  Both lived at300ticks; recipient died with export or processing disabled. This establishes
  conditional recipient access and work return, not reciprocal cooperation or evolution.
- Emission: receiver tonic input .005717 and stored import action .508575 (signed effort .017150),
  versus0 and .5 (hold) without donor export. Receiver died in both arms. Signal/action response
  exists; useful communication and survival benefit remain unshown.
- Compatibility: cumulative injury .02345/.16768 for matching/distant external exposure and
  .02572/.18458 internally. All four survived. Compatibility reduced exposure and repair cost;
  it did not remove susceptibility or establish a growth advantage.
- Detoxification converted .48293 ID120. Injury .28932 versus .32936; repair work .67231 versus
  .75013. Both reached the disabled-division body's construction ceiling1.52. This assay cannot
  distinguish a growth advantage once construction saturates.
- Corpse capture imported .44470 of the finite .8 released ID128 and converted .43492. The cell
  lived at300ticks; held uptake exhausted at24. Construction .14860 versus .20368 does not support
  a construction advantage. The benefit demonstrated is finite resource access and survival.
- Barrier production exported .38804 ID15 by300ticks; degradation consumed .05883 ID15 versus0
  for the idle offset. Competitive payoff remains unmeasured.

Mirrored sensing fixtures produced opposite turn signs and mirrored paths at both meshes.
At120ticks the h4/h2 left cases turned1.150/1.240radians and traveled9.026/8.741 units.
Disconnected controls did not turn. Connected uptake5.065/5.061 exceeded control4.856/4.371,
but all reached construction1.52. Captured-work gain .00610/.01763 versus additional motor work
.01002/.00972 does not establish a net payoff once transport and repair are included. Correct
cue→turn→displacement survives refinement; trajectory and payoff are resolution-sensitive.

Barrier follow-up ledger3848–3852: retained/removed travel20.2189/20.2387 at equal motor
work .77242, initial mobility .95612/.96419. This is a small motion effect. The tracer second
moment was8.05391 with ID15 versus8.05131 without it, retaining .998002 material in both arms.
The predicted reduced tracer spread **failed**: combined profile drift and impedance did not
produce it in this fixture. No impermeable-barrier or diffusion-blocking strategy is established.
After explicit death, field ID15 was .69429 with degradation versus .74363 without (sum of
concentrations multiplied by16 area/node). Transformation reduced return, with no competitive claim.

## Operating and recovery registration

After final integration checks, repeat the root plan's unchanged48/2,000/2,000-growth capacity
once against the final binary, without concurrent builds/tests. A completed paid refit now reuses
the matching immutable target coefficients instead of recompiling them; unaffected allocations
stay shared. This removes redundant work without changing coordinates, funded amounts or equations.

Run one actual default seed101 startup, at most600ticks/30seconds, stopping at extinction or a
runtime limit. It checks the corrected founder steering plus live default mutation/learning and
two-colony source access; it is not an ecological persistence test or a selection campaign.
Use the existing zero-tick economy report with the actual finite body footprint first.

Repeat the existing seven storage cases once:100,000/two-million synthetic ancestors,
empty/patchy/widespread/dense chemical fields, and default startup. Five steps before save,
three paired continuation steps,60seconds per case. Two-million parent records occupy112MB
at56bytes each; the raw192MiB checkpoint ceiling and256MiB compressed retention policy remain.
Measure compression, restore, observation identity, physical byte identity and WASM high-water
memory. Synthetic storage is not a days-long ecological run.

Browser check, when the existing Antropy server URL is available: isolated Chromium profile,
actual production page/worker/WebGL2,48default and two existing2,000-cell capacity packages.
At most300default/100capacity ticks or30seconds per arm; observe all panels, inspect one cell,
save to isolated IndexedDB and verify the loaded kernel digest. Existing fault checks can test
visible pause/export/restore after context loss. No other server or user profile is used.
Headless SwiftShader performance cannot establish the user's GPU or human motion acceptance.

The first storage repeat (`storage-1`, ledger3856) passes all seven cases but reaches509.4MB
WASM high-water memory. Snapshot encoding built a complete temporary payload, then copied it
into a second buffer to prepend the version. Encode directly into the prefixed buffer instead;
the wire bytes must remain identical. Repeat the same bounded storage/capacity cases to verify
cold-path peak memory and timings. No physics, schedule or workload changes accompany this fix.

Two further arithmetic changes retain the same laws and registered loads: paired f64 property
projections for field refresh/commit, and complete chemical request rows for W/W-transposed
delivery. The latter replaces species-first transfer lists. Both preserve frozen donors,
pre-transfer headroom and work; exports still cannot feed an import during the same update.
Capacity is repeated once per changed layout (`capacity-6`/`capacity-7`). The final binary also
repeats the bounded600tick startup and seven storage cases because exchange arithmetic changed.
This authorizes no new ecological cases, seed or horizon.

## Final operating results and unresolved gates

The final [capacity report](../../evidence/digital-chemistry/rebuild/capacity-final.json),
ledger3865–3867, includes ordinary stepping, census, inspection and five-layer render
preparation. Each fixture has 10 warmup and 100 measured ticks; dt remains .2 model seconds.
These are isolated headless WASM measurements, excluding GPU execution and browser publication.

| Starting fixture | Average ticks/s | Slowest 20-tick window | p95 step, ms | Maximum step, ms | Model seconds/wall second |
| --- | ---: | ---: | ---: | ---: | ---: |
| 48 varied cells | 409.57 | 381.15 | 7.88 | 7.98 | 81.91 |
| 2,000 varied cells | 66.71 | 64.33 | 49.16 | 51.01 | 13.34 |
| 2,000 with funded growth | 43.17 | 36.31 | 84.65 | 145.44 | 8.63 |

All three restore and continue exactly. The **200 ticks/s target fails at high population**.
Headless windows exceed30 ticks/s; this does not establish the complete-browser minimum.
The varied fixtures end with47/1,984 cells. Growth starts measurement at2,200 cells and ends
with200 cells,2,000 cumulative divisions,3,800 deaths and6,000 ancestor records. It stresses
real birth, mutation, refitting and death; it is neither a constant4,000-cell benchmark nor
evidence of a sustainable population. The maximum step identifies a visible-jank risk that
an average throughput cannot dismiss.

The [earlier capacity report](../../evidence/digital-chemistry/rebuild/capacity-before-save-allocation.json)
measured354.47/62.57/41.98 ticks/s. Direct snapshot encoding, shared vector projections and
chemical-row delivery improve cost and cold memory without changing laws or fixtures.
They do not close the remaining high-population cost gap. Census and render preparation
consume about118 ms of the1,499 ms varied-population measurement; production stepping is
still the dominant expense. No additional seed, horizon, biological cadence or reduced
observation workload was used to obtain a passing result.

The final [default startup](../../evidence/digital-chemistry/rebuild/startup-final.json),
ledger3868, reaches600 ticks in1.294 seconds, with66 living cells,66 divisions,48 deaths
and180 ancestor records. It imports337.58 material, constructs196.43, pays14.69 learning
work and1.60 refitting work. Material/work closure residuals are5.04e-11/2.03e-9. Counts
match the pre-layout-change startup. These120 model seconds establish bounded default
integration, not sustained diversity, evolved strategies or days-long operation.

The final [storage report](../../evidence/digital-chemistry/rebuild/storage-final.json),
ledger3869, passes all seven cases: physical bytes, retained observations and three-step
cold continuation match. The two-million-ancestor case uses68,007,035 raw bytes and
11,064,605 compressed bytes; serialization271 ms, compression811 ms and restore407 ms.
WASM high-water memory is424,411,136 bytes, versus509,411,328 before duplicate snapshot
allocation was removed. Raw serialized bytes were independently checked to be unchanged
by that allocation fix. High-water memory persists in a reused WASM instance; it is not
a steady live-heap measurement or a browser endurance claim.

Final binary SHA-256: `577080a999de12321e78fa8818313e847c65bd2e4e6b2087ccae82d8d8528f7d`.
Embedded source digest: `e45e9cb5ce17a23db56c65fb474f35e6947a686241ec3d80139a08257bea33aa`.
Earlier chemical/sensory reports retain their own captured binaries and interpretation.
Local browser packages have been prepared from this final binary without advancing ticks.

**Automated browser checks pending:** the existing Antropy server URL has not been supplied. Port26000
refuses connections;26003 and26010 serve other projects. No server was started and no user
profile or saved world was touched. Registered browser checks, GPU cost, visible fault
recovery remain unperformed. The user's subsequent visual review is recorded below. The original plans are preserved
byte-for-byte in the history archive; the rebuild root remains active.

## Centered review setup and user acceptance

September15 follow-up: the user accepts the measured performance for now and reports that
visual inspection mostly looks good. The200 ticks/s target is deferred, not retrospectively
passed. Their screenshot identifies activity straddling the top/bottom boundary and an empty
center; this is a placement complaint, not a request to retune chemistry or select for survival.

Use **seed27**, with the default320×240 world,48 founders,48 sources and other settings unchanged.
In **Environment and new population**, set **Seed** to **27**, then **Apply and restart**.
The world starts paused at tickzero. At the user's subsequent request, seed27 is now the
new-world default. Existing saved populations and the independent chemistry seed101 are unchanged.

The same production WASM initializes seeds1–32 without advancing ticks. Selection requires all
founders to lie at least10% from every edge, then favors the fraction of initial field material
within the central60% of each axis. Seed27 places all founders at13–70% of width and28–49% of
height;90.36% of initial field material lies in that central rectangle. Seed20 had a larger
founder edge margin but only16.13% of material in the central rectangle, so field inspection
rejected it. No population outcomes, survival horizon or evolved traits informed selection.

Local evidence: `frontend/harness/artifacts/centered-review-20260915/selected-layouts.json`
and `selected-comparison.png`. These are tickzero field/source/founder previews, not browser
screenshots or claims that activity will remain centered throughout a long run.
