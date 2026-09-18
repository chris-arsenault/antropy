# Mature checkpoint cost

Registered September 18, 2026. Plan `f396acdc-5596-4f7e-82f7-20dcddbb6341`.

Question: does the cost in the user's two new saves come from active chemical support,
living-cell work or observation, and how much field work could local trace culling remove?
Competing explanations include dilute chemical coverage, substantial broad mixtures and
population/controller/refit cost. The result selects a performance intervention, not an
ecological winner. The checkpoints have different ages and physical laws; they are not a
matched before/after comparison.

Inputs: `.sulion-paste/antropy-27-227912.antropy.gz` (v20) and
`.sulion-paste/antropy-27-47504.antropy.gz` (v21). The saved execution digests match the
archived symmetry baseline and current v21 WASM respectively. Restore each under its exact
original kernel; no adapter or physical changes. Record actual checkpoint ticks independently
of filenames and potentially older observation metadata.

For each save: inspect the initial state, warm up10 ticks, measure100 ordinary ticks with
existing census/inspection/render preparation, then profile20 stage-measured ticks. Preserve
saved mutation, learning, transfer and source configuration. Maximum130ticks and120seconds
per save,260ticks/4minutes total,512MiB generated output. Stop on ordinary terminal outcomes,
invalid accounts or cap. No browser/GPU run, reseeding, history changes or campaign.

Read initial chemical planes through synchronous borrowed WASM render views. For common
concentration floors1e-9 through1e-3, calculate surviving four-species groups and their periodic
neighbor candidates, one-time removed material/reference value and local signal/impedance/stress
bounds. This is a static opportunity estimate; it neither applies culling nor measures its
speed or ecological consequences. Confirm that inspection leaves checkpoint bytes unchanged.
Reuse the existing operating timer, stage profiler, package codec and measurement ledger.

Command from frontend: `pnpm exec tsx harness/numerical/matureCost.ts <package.gz> <kernel.wasm>
<new-output-directory>`. Results and recommendation follow after inspection.

## Results

Both original kernels restore successfully. Each readout leaves canonical checkpoint bytes
unchanged and each continuation completes all130ticks within7seconds, with valid accounts.
Actual saved ticks are227756 and47412; filenames are later display ticks. Do not interpret
the filename discrepancy as additional measured simulation time.

| Initial state | v20, tick227756 | v21, tick47412 |
| --- | ---: | ---: |
| Ledger |4014|4015|
| Living cells |1583|744|
| Ordinary headless ticks/s |34.03|43.66|
| Field and footprints, ms/tick |18.17|17.28|
| Field fraction of profiled simulation time |65.4%|79.0%|
| Controller, ms/tick |1.62|0.74|
| Movement, ms/tick |1.23|0.71|
| Exchange, ms/tick |3.89|1.74|
| Physiology, ms/tick |2.18|1.10|
| Maintenance/lifecycle, ms/tick |0.69|0.31|
| Occupied geographic nodes |19200/19200|19200/19200|
| Active four-species groups |619798|576216|
| Candidate groups including neighbors |643662|593679|
| Dissolved material |1733.11|2204.64|

The stage profile is a separate20tick window; `exchangePreparationSubset` is already included
in field/footprint preparation and must not be added again. Ordinary timing includes25 packed
render preparations plus four census/inspection updates per100ticks, excluding GPU execution.
Those observations take151.1ms/81.1ms total; they are secondary to physical stepping.
Physical stage maxima create uneven pacing: maximum ordinary step106.2ms/87.0ms. These do not
establish browser FPS or isolate all costs of the user's selected display/inspection settings.

By47k ticks, the new run already has93% of the older run's active chemical groups despite
having47% as many cells. This supports accumulated geographic chemical coverage as the primary
target. It does not attribute the difference between the two runs to the symmetry correction.

### Static trace removal

Percent candidate groups removed includes the same periodic neighbor halo as production work.
Percent material removed uses the complete dissolved field as denominator. These values describe
one culling event on each saved state; repeated losses and biological consequences are unmeasured.

| Shared concentration floor | Candidate groups removed, v20 / v21 | Dissolved material removed, v20 / v21 |
| --- | ---: | ---: |
|1e-8|6.86% /5.18%|0.000134% /0.000091%|
|1e-7|21.17% /18.64%|0.00314% /0.00224%|
|1e-6|42.14% /38.54%|0.03990% /0.02940%|
|1e-5|65.05% /58.51%|0.36990% /0.27764%|
|1e-4|79.22% /74.64%|2.33528% /2.13948%|
|1e-3|90.68% /90.71%|16.47664% /13.99794%|

At1e-6 the one-time losses are0.6915/0.6481 material. Maximum local concentration loss,
summing all removed species, is2.55e-5/3.65e-5. Maximum impedance loss is0.000174/0.000236;
stress-load loss is1.55e-5/1.86e-5. These are bounds on direct initial field perturbations,
not bounds on subsequent RNN responses or evolutionary trajectory differences.

The1e-9 static row is not identical to existing active masks: deposits may occur between
field truncation passes, and borrowed f32 concentration rounding occurs at threshold ties.
Unfiltered masks reconstruct the exact reported initial group counts in both saves.

## Recommendation

Test a common extracellular floor of1e-6 first, keeping mesh2, the shared operators and all
cell/reservoir stocks. It is the first inspected decade that removes about40% of candidate
work with less than0.04% of standing dissolved material. Do not cull by chemical ID, global
abundance rank or distance to a cell. Material outside cells still defines future habitats.

Before adopting it, measure matched short continuations with gross truncation loss separated
from signed rounding error, actual field/whole-runtime timing, local readings, uptake and
funded growth. A new floor also changes the shared weathering work bound, so that effect needs
the same check. About40% fewer candidate groups cannot imply40% faster whole simulation:
node work, biology and observation remain, and active support can regrow. A pure linear cost
estimate gives roughly1.4× whole-simulation headroom, not a return to400ticks/s.

If this leaves substantial slowly changing background work, the next mechanism is bounded
deferred updates with accumulated elapsed time/error and neighbor wake-up. Stronger uniform
washout is an ecological change that also removes potential food and environmental modifications;
the present evidence does not require it to address tiny-trace cost.

No culling or physical change was applied. No additional200k run was started. Local artifacts:
`frontend/harness/artifacts/mature-cost-v20-227k/` and
`frontend/harness/artifacts/mature-cost-v21-47k/` (about213MiB combined), including exact kernels,
definitions, initial/final physical saves, threshold tables and measured stage results.
