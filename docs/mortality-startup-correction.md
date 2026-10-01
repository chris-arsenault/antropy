# Mortality rollout startup correction

## Measured failure

The deployed v50 seed27 world reached extinction at tick 12,412 after 56 starvation deaths,
eight divisions and a peak population of 49. Recovery admitted 7.959 of 136.033 dead-body
material. The server continued stepping with no physical stop, recorded panic or OOM kill.
The new sourceRate 0.1 also halved initial reservoir amounts and reservoir-derived priming.
Secondary 8/128 priming uses interface area and did not halve. The
[earlier full-batch supply findings](extinction-correction.md) rejected smaller initial stocks
as an establishment correction. The handcrafted mortality fixture did not test ordinary-founder
establishment; that omitted check allowed the startup regression to reach production.

The latest preserved v49 server checkpoint has 21,769 cells at tick 142,323. V50 cannot load it;
no checkpoint migration, rollback, live restart or removal of saves was performed for this diagnosis.
The extinct v50 checkpoint is preserved locally under
`frontend/harness/artifacts/mortality-v50-live-extinction/final.bin`.

## Registered comparison

Question: can preserving full finite batches and their priming support ordinary founders at
the reduced release ceiling? Compare sourceLifetime 600 (installed) with 1200, sourceRate 0.1 in
both. At zero ticks, r*T is restored to the prior full batch; mean future supply rises from
0.05*richness to 0.066667*richness per supply second, still below the former 0.1*richness.
Competing explanation: the discharge ceiling itself remains too weak, so preserving stock and
priming does not improve paid uptake, funded growth and early replacement.

Use the existing bacteria runner and ledger, ordinary ecology preset, seed27, chemistry101,
48 founders, mutation and private/inherited learning on. Keep terrain, sourceGap 600, physiology
and recovery tau60/h_star0.25 unchanged. No diagnostic genotype or founder replacement.
Record exact initial/final checkpoints and 100-tick summaries through the existing runner.

Run exactly two cases, each 3000 ticks with a 120-second wall cap: at most 6000 ticks and four
wall minutes. Stop at the horizon, physical failure or wall cap. Do not extend horizons or sweep
parameters. Compare initial material, actual intake/work, growth, births and deaths rather than
requiring long-term survival. The decision is whether to preserve full batches using the existing
duration parameter or retain the negative finding and diagnose a concrete further bottleneck.
All generated data remains ignored and local. The live server is inspected only.

## Result and decision

Both cases reached tick 3000 within their wall caps. Compared with the installed configuration,
full batches produced 652.811 versus 571.157 cumulative paid uptake (14.3% more relative to
the installed arm) and 51.340 versus 42.325 funded growth (21.3% more). Living biomass was
95.544 versus 68.885, from the same initial 79.680 bound material.

| At tick 3000 | Installed T600 | Full batches T1200 |
| --- | ---: | ---: |
| Living cells | 28 | 39 |
| Divisions | 3 | 6 |
| Starvation deaths | 23 | 15 |
| Measured stepping wall seconds | 52.254 | 53.930 |

Set default sourceLifetime to 1200, retaining sourceRate 0.1, sourceGap 600 and enabled recovery.
This retains full batches and their initial release while halving the discharge ceiling; mean
external supply remains one-third below the former rate0.2/T600 baseline. It uses the existing
finite-source law and control. No selected chemicals, reseeding, extra work or recovery gain is added.

This isolates the effect of increasing finite stocks, priming and subsequent batch duration at
the same lower ceiling. It does not isolate those three consequences from each other, attribute
the entire live extinction to one cause, or establish indefinite survival. The result supplies a
plausible establishment improvement and closes the configured startup correction. No extended
campaign or sweep was run. The current empty world requires an explicitly authorized restart
to use the revised configuration; changing defaults does not change a saved world's parameters.

`make ci` passes with 398 kernel tests, the native and persistence suites, 85 Vitest cases,
both WASM builds, lint/type/format checks, documentation and experiment-storage guards.
No physical format change is needed; existing v50 saves retain their stored configuration.

Local ledger entries 4448–4449 retain exact checkpoints, configuration, binary/source hashes
and 100-tick observations under `mortality-v50-startup-installed/run-4448/` and
`mortality-v50-startup-full-batches/run-4449/` in the ignored artifacts directory.
Run the same bounded comparison from `frontend`, using a new output directory each time:

```bash
pnpm harness bacteria --preset ecology --seeds 27 --ticks 3000 --wall-seconds 120 --source-rate 0.1 --source-lifetime 600 --output harness/artifacts/NEW_INSTALLED_DIRECTORY
pnpm harness bacteria --preset ecology --seeds 27 --ticks 3000 --wall-seconds 120 --source-rate 0.1 --source-lifetime 1200 --output harness/artifacts/NEW_FULL_BATCH_DIRECTORY
```
