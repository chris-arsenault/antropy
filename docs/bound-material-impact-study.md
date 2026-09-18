# Bound-material impact: matched seed27 comparison

## Registration, September 17, 2026

Question: did preserving built chemical identity reduce #186 accumulation and change the
observed ecology, beyond the previously measured 600-tick startup? Compare archived v19
WASM with v20, both with seed27, chemistry101 and unchanged default configuration.
Use ordinary mutation, private learning and inherited learning; no interventions or tuning.
The earlier v18 50k study is context, not the control: physical coupling changed in v19.

Predictions and competing explanations:

- Removing compulsory #186 body returns should lower its absolute field amount and share.
- If founder metabolism is sufficient to preserve dominance, #186 can remain dominant.
- Returning energy-bearing construction inputs can support more reuse and turnover without
  producing a diverse food web. Compare imports with actual enzyme consumption and products.
- Altered body chemistry, work costs and local medium can change population cycles and
  inherited traits. Population growth alone does not demonstrate ecological diversification.

The existing deterministic growth, repair, division and death checks establish the physical
opportunity; startup establishes funded execution. First run 3,000 ticks per kernel, each
capped at 120 wall seconds. Inspect accounting, chemical trajectories, archive cost and
throughput before deciding whether the original tick-40,000 abundance question remains open.
If it does, run one fresh 40,000-tick trajectory per kernel, each capped at 900 wall seconds.
Total maximum: four runs, 86,000 ticks, 2,040 simulation wall seconds. Execute sequentially.
No seed sweep, horizon extension or parameter changes. Stop on terminal outcome, accounting
failure, wall cap or the existing resource guards (3 GiB RSS, 1.5 GiB WASM, 1 GiB per case,
11 GiB study, 20 GiB free disk). Preserve incomplete results.

Reuse `runRecorded`, `habitatObserver`, lineage flow counters and exact captured kernels.
Sample every 250 ticks and save checkpoints every 2,500 ticks (pilot: at 3,000).
At checkpoint cadence, aggregate every living cell's free and bound mixture through the
existing headless assay observation. v19 bound composition is its declared universal species.
Persist manifests, binaries, ledger rows, observed genomes and initial/final checkpoints.

Judge absolute #186, its share of total extracellular material, time-window means, population
turnover, biomass, work flows, actual reaction edges and body composition. Inspect inherited
traits using whole-population denominators. Compare initial conditions before interpreting.
Source and body-returned atoms of the same chemical are indistinguishable; imports of #0/#80
cannot identify their origin. One matched seed measures this trajectory's response, not a
universal effect size or a certified food web. Throughput includes identical observation work
and follows potentially different populations and chemical field activity.

Decision: retain or question the mitigation on its measured ecological effect; identify what
still limits chemical cycling. This study does not authorize changing simulation rules.

Command from `frontend`:

```bash
pnpm exec tsx harness/numerical/boundMaterialImpact.ts pilot PATH_TO_WASM NEW_CASE_DIRECTORY
pnpm exec tsx harness/numerical/boundMaterialImpact.ts main PATH_TO_WASM NEW_CASE_DIRECTORY
```

## Pilot and escalation decision

Ledger 4002 (v19) and 4003 (v20) completed 3,000 ticks in 14.18 and 15.95 seconds.
Configuration, chemistry, initial summary and every initial frame cell match exactly.
Both pass the existing accounting and resource guards. At tick 3,000, #186 is
821.84 units / 32.83% before, versus 542.19 / 26.97% after; populations are 204 and 351.
The v20 bound mixture already contains 318.52 units of #0, 266.91 of #80 and 81.55 of #186.
The result supports a changed material cycle, but does not answer the original 40k dominance
question. Proceed with the registered single 40k pair; no other runs or changed conditions.

The v19 main run (ledger 4004) stopped at tick 30,504 after 434.45 seconds on the
registered 1 GiB case-archive limit. Its genome archive grew faster than the pilot
estimate. This is an incomplete 40k observation, not a simulation crash or ecological
extinction. Preserve the cap and evaluate matched completed intervals against v20;
do not claim a measured 40k endpoint or extend the campaign.

## Results, September 18, 2026

**The change substantially reduces the artificial #186 sink, broadens the chemical mixture
and supports more biomass. It does not establish evolved waste metabolism.** Retain it.
The observed bottleneck is still that almost all enzymatic consumption uses #0/#80.

The v20 main run (ledger 4005) stopped at tick 21,764 after 374.02 seconds on the same archive
cap. Both runs completed the 0–20,000 comparison below; neither completed the registered 40k
horizon. Stops were harness archive limits, not browser memory failures or extinctions.
This is one matched seed, not a replicated general effect size.

[Generated findings](evidence/digital-chemistry/bound-material-v20/impact/findings.json) retain
binary/source digests, configuration, per-window flow totals, population extrema and selected
whole-population observations. The [comparison plot](evidence/digital-chemistry/bound-material-v20/impact/comparison.png)
shows each run through its actual stopping point; comparisons here use the common interval.

| Measurement | v19 before | v20 preserved material |
| --- | ---: | ---: |
| #186 amount at tick 20,000 | 1,185.21 | 335.61 |
| #186 share of extracellular material at tick 20,000 | 60.50% | 17.13% |
| Total extracellular material at tick 20,000 | 1,959.04 | 1,959.28 |
| Mean #186 share, ticks 10,000–20,000 | 62.66% | 26.97% |
| Mean living population, ticks 0–20,000 | 178.18 | 392.16 |
| Mean living biomass, ticks 0–20,000 | 195.98 | 368.42 |
| Divisions through tick 20,000 | 4,151 | 9,418 |
| Deaths through tick 20,000 | 3,841 | 8,816 |
| Maximum generation at tick 20,000 | 76 | 71 |

Means use trapezoidal integration of 250-tick samples. #186's endpoint amount falls 71.7%;
nearly identical total field material rules out simple dilution as the explanation. The effect
also spans the later 10k window, rather than depending on a favorable endpoint. #186 remains
the largest individual chemical in this run, but shares the field with #80 (11.72%), #218
(10.69%), #0 (9.70%) and #202 (9.35%). Chemical evenness, measured as 1/sum(share squared),
rises from 2.56 to 12.02 at tick 20k. This measures chemical distribution, not biological species.

### What changed in the material cycle

At tick 20k, 67.81% of v20's living body material is #0/#80 and 4.88% is #186. In v19, all
body material is defined as #186. Death and repair now return the actual mixture, retaining
the possibility of processing energy-bearing body inputs again. The simulation no longer
forces each construction/death cycle into the same low-potential chemical.

Cells actually produced **more** #186 enzymatically over the common interval: 3,233.64 versus
2,351.75 units. Its much lower standing amount therefore did not come from shutting down the
founder metabolic pathway. Late enzyme output is also broader: #186 represents 17.78% of
products during ticks 10k–20k, versus 32.72% before. The strongest new late reaction edge is
#0→#218 (363.94 units); #80→#186 remains substantial (353.22). These are measured reactions,
not merely encoded enzyme targets.

The construction heat account falls from 17,667.97 to 4,025.17 even while constructed material
rises from 4,261.26 to 8,050.34. The old account included the reference-value drop from inputs
to universal body material. The new account retains that value in the body and records ordinary
assembly expenditure. These heat totals must not be described as an equivalent reduction in
work paid by cells. Captured metabolic work rises from 16,398.22 to 31,876.19; the matched pair
does not separately attribute that increase to recycled atoms, changed access or evolved traits.

### What remains unresolved

#0/#80 account for 99.443% of all enzymatic consumption before and 99.454% after. Neither
population enzymatically consumes any #186 through tick 20k. The new run imports 1,377.67 units
of #186 versus 464.10 before, but uptake is not energy extraction. Non-feed import share rises
from 5.94% to 14.37%; this can supply body material without creating another trophic level.
Returned and newly supplied atoms with the same chemical identity are not distinguished.

Population declines and recoveries persist. Average biomass rises 88%, so the higher cell count
is not just a larger number of smaller cells. Both runs nevertheless evolve much smaller funded
bodies, from initial mean mass 1.52 to 0.50/0.56 at tick 20k. More divisions do not imply deeper
generations: maximum generation is 76 before and 71 after. The four surviving founder families
after the change include a dominant 507/650 cells (78%); before, one family supplies 338/358
(94%). Families are ancestry groups, not demonstrated distinct ecological strategies.

The change also does not simply remove environmental pressure. During ticks 10k–20k, mean
damage weighted by organism time rises from 0.055 to 0.092, and roughly 90%/91% of organism
time remains under the observer's slowed-movement threshold. More varied chemistry can alter
exposure as well as provide material; this comparison does not isolate those causal paths.

### Execution and verification

Both main runs pass sampled conservation checks. Maximum absolute material/work residuals are
2.94e-7/6.66e-7 before and 2.06e-7/5.60e-7 after. Recorded throughput averages 70.21 and 58.19
ticks/s over their **different full run durations**. These include detailed tracing, genome
export, census and checkpoints and follow different populations; they are neither a matched-load
kernel benchmark nor browser throughput. The earlier fixed-load comparison remains the evidence
about direct implementation overhead.

`make ci` passes: 104 Rust tests, 60 Vitest tests and the existing 13 lint warnings. No simulation
or browser runtime code changed in this study. Raw artifacts remain local under
`frontend/harness/artifacts/bound-material-impact-20260917/`; the runner and reducer reuse the
ordinary kernel, observers and ledger. Reproduce the readout without advancing ticks:

```bash
cd frontend
python3 harness/bound_material_report.py harness/artifacts/bound-material-impact-20260917 NEW_OUTPUT_DIRECTORY
```
