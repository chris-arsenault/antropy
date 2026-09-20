# Integrated ecology review: 200,000 ticks

## Registration — September 19, 2026

User requests one long run and analysis across the recent changes. Sulion plan
`7170abe4-ea83-4e57-973a-97b9d1a6a575` tracks execution and analysis. No simulation laws,
founders, mutation rates or environmental constants will be tuned during this observation.

Run physical v31, current default seed 27 and default configuration. This includes shared
resource binding, composed local illumination, funded photoreception, heritable controllers
and bodies, chemical group transformations and the regenerative initial community. Enable
the existing measured-flow observer; it does not alter physical state. UI rearrangement and
observer implementation are not ecological mechanisms.

Questions and competing outcomes:

- Do inherited differences produce persistent differences in funded bodies, inputs/products,
  movement and local work returns, or does one broadly similar phenotype take over?
- Do changing light conditions accompany local population turnover and chemical succession,
  or do cells remain energy-saturated across them?
- Does photoreceptor investment survive and do ordinary evolved controllers respond to its
  readings, or are optical connections absent/ineffective? Read-only frozen-state input
  interventions can establish neural sensitivity, not the fitness value of photoreception.
- Do measured uptake/export/conversion flows support recycling beyond source feedstock and
  private intracellular cycling? Chemical abundance and possible routes alone cannot answer.
- Do finite resource clusters and cellular neighborhoods remain concentrated or diffuse?
  Inspect spatial maps, periodic nearest-neighbor distributions and material concentration.
- How do throughput, memory, field support and accounting behave as the world ages?

The horizon covers about 6.7 primary illumination periods and 2.2 secondary periods, but
only 0.65 of the modulation period. It permits many generations and repeated environmental
changes; it does not establish indefinite coexistence or a response to a complete modulation
cycle. Prior v30 short assays establish location-dependent work returns, without a growth
advantage. V31 photoreception probes establish funded local sensing and ordinary neural
steering; finite no-feeding probes exhausted their reserves. The v28 user save at tick
143,249 already contains large powered and small mostly motorless populations; it is
historical context rather than a matched causal control for all later changes.

Budget: one continuous 200,000-tick trajectory, no seed sweep, no parameter sweep. Its first
1,000 ticks form the resource pilot, after which the same world continues if sampled accounts
are finite and within existing tolerance, memory is below the caps and completion remains
within the four-hour wall budget. Stop on extinction, engine limit, failed accounting,
four hours, RSS 4 GiB, WASM 2 GiB, output 48 GiB or free disk below 20 GiB. Preserve incomplete
results; no automatic horizon extension. Checkpoints every 10,000 ticks plus initial/final;
full population/genotype samples every 1,000 ticks. Record every complete 250-tick accepted-
flow window through the existing paginated web API, including all route pages. Retain exact
engine/configuration provenance and the ordinary experiment ledger record.

Analyze checkpoints without advancing their worlds: local light, actual/target investment,
lineage and generation, chemical accounts, sampled controller responses with private state
cloned, and periodic spatial concentration. Original and copied-input actions use ordinary
controller inference; no controller weights are interpreted outside that module. No evolved
founder is installed into the application. Any short follow-up that advances physics needs
its own bounded question and registration before execution.

## Results

Completed the registered 200,000 ticks in 2,237.94 seconds (37.3 minutes), stopping at the
horizon with 129 cells and maximum living generation 335. The sampled population peak was
1,012 at tick 48,000. Ledger row **4215** records the trajectory; **4216–4217** record the
separate late operating checks. No simulation formulas, defaults or founders changed.

**The run produced substantial heritable body and behavioral differentiation, including a
late large-bodied population that processes intermediates internally. It did not establish
a substantial community of cells living on other cells' products. Resource sites continued
to disperse despite the binding law.** These are different outcomes and need separate next
decisions.

### Evolution, starvation and recovery

| Tick | Cells | Maximum living generation | Median funded mass |
| --- | ---: | ---: | ---: |
| 0 | 48 | 0 | 1.530 |
| 50,000 | 743 | 130 | 0.234 |
| 100,000 | 91 | 180 | 0.347 |
| 150,000 | 361 | 252 | 0.396 |
| 180,000 | 434 | 307 | 0.518 |
| 200,000 | 129 | 335 | 0.889 |

The four initial intended processing roles did not persist together. By 10k, all living
cells descended from founders assigned the 0→128 role. Founder 13's descendants were the
entire sampled population by 76k. This ancestry label does not describe their subsequent
enzymes or make them a single phenotype.

The 92k–100k collapse reduced population from 781 to 91. Complete parentage records show
3,853 starvation deaths and 3,163 divisions during that interval. Between 100k and 104k,
856 divisions and 585 starvation deaths brought population back to 362. This is a
starvation-driven die-off and recovery through surviving evolutionary branches.

Only two of the 91 cells alive at 100k contributed living descendants at 170k; one of those
two, cell 80528, accounts for **all 129 final cells**. At 100k it had mass 0.725, motor/core
ratio 0.185 and photoreceptor/core ratio 0.0237, versus whole-population medians of 0.347,
0.0580 and 0.0237. Its imports were 99.99% chemical 0. The final population also descends
from one of the 361 cells present at 150k, cell 107814. Repeated sweeps therefore coexist
with later differentiation; founder counts alone miss both processes.

### A late change that shorter reviews miss

The final mass distribution has 102 cells below mass 2, one at 5.36, and 26 between 10.29
and 20.68. The following cutoff describes that visible gap; it does not select organisms
or define a species.

| At 200k | Large cells, mass >10 | Remaining cells |
| --- | ---: | ---: |
| Count / complete population | 26/129 (20.2%) | 103/129 (79.8%) |
| Share of living biomass | 79.9% | 20.1% |
| Median funded mass | 14.079 | 0.803 |
| Median inherited newborn core target | 6.170 | 0.432 |
| Median motor/core stock | 0.0665 | 0.0431 |
| Median photoreceptor/core stock | 0.0360 | 0.00663 |
| Median usable energy / capacity | 99.0% | 71.4% |
| Source-ID share of living cells' lifetime imports | 98.86% | 96.37% |

The inherited target difference establishes a genetic body-size difference, rather than
just different ages or amounts of recent feeding. The large cells' median age is 1,490
ticks. Their lifetime processing consumed 30.10 units of chemical 98 and 24.53 of 114,
while their lifetime imports of those chemicals were only 0.632 and 0.310. They produced
40.02 and 29.24 internally. Processing is therefore extending through internally available
intermediates, rather than primarily buying those intermediates from neighboring cells.
Inherited stores are also available; the counters do not label every material unit's origin.

Population-wide accepted routes in the final 10k include **0→98, 0→114, 98→157 and
114→141**. The large survivors export substantial 230/214/215, while the remaining
survivors' exports favor 112/128/113. This is a real difference in processing and products.
It should not be called a closed cycle: reciprocal flow is still small, and multistep
processing need not return to its starting chemical.

### Illumination and evolved photoreception

The new optical inputs began with zero founder connections. Frozen-state ordinary RNN
inference shows effective connections developing during the run:

| Tick | Optical removal changes any action >0.01 | Small brightness change alters action >0.001 | Reversing directional cues alters action >0.001 |
| --- | ---: | ---: | ---: |
| 0 | 0/48 | 0/48 | 0/48 |
| 50k | 266/743 | 264/743 | 5/743 |
| 150k | 287/361 | 283/361 | 127/361 |
| 200k | 74/129 | 73/129 | 34/129 |

Most of the response is turning. The brightness perturbation adds 0.05 times funded
receptor gain to the tonic input. Directional reversal flips only the two body-relative
gradient inputs. Private state is cloned; ordinary physics is not advanced. These results
establish evolved neural use of optical inputs, without proving sun-seeking or its fitness
benefit. At 200k, **41/129 cells have photoreceptor stock ≤1e-6**; all 26 large cells retain
it. Evolution can retain the paid sensor in some descendants and largely discard it in others.

Local illumination alone does not explain every population crash. Between 92k and 100k,
cell-weighted mean light increased from 1.036 to 1.274 while population collapsed. Total
material release fell from 558.7 units in 92k–93k to 252.4 in 98k–99k, before recovering
to 299.3 in 99k–100k. Source availability, local chemistry and the changing surviving
population confound an attribution to illumination alone.

External work supplied to cellular reactions was 464.7 units in 140k–150k, 6,088.4 in
170k–180k and **29,154.0 in 190k–200k**. Accepted conversion increased from 1,710.1 to
3,505.7 between the first and last of those windows. Thus the late change is not just
more cells doing the same amount of processing: external work per processed material also
rose. Changing enzymes, chemical medium and illumination all enter the shared work law.
This single trajectory does not isolate their individual contributions. Supplied work is
an input account, not an exact partition of the origin of captured usable energy.

### Chemical web: broader internal processing, little public recycling

In the final 10k, **97.71–98.43% of imports were chemicals 0 or 136**, overwhelmingly 0.
The interval contains 2,514.93 units of conversion consuming 0, but only 8.76 producing it.
Reciprocal conversion accounts for 1.47% of accepted flow. These measurements allow longer
cycles and internal reuse; they do not support a large intercellular recycling web.

Complete conversion-route pages were recorded for all 800 consecutive 250-tick windows.
Import/export reports retain their existing top-eight-plus-remainder boundary. Source-ID
percentages therefore have explicit lower/upper bounds. An imported ID does not establish
whether that molecule came from a reservoir or recycling.

Individual lifetime counters reveal rare majority-nonfeed diets. Eligibility requires at
least 100 ticks of age and 0.01 imported material. At 90k there was 1/434; at 170k, 6/447;
at 180k, 1/372; at 190k, 3/226; at 200k, **4/113**. These snapshots do not count every
transient variant. The eleven identified candidates sampled before 200k left no living
descendants at 200k. Several divided, including one family with three divisions followed
by four starvation deaths. The four final candidates remain alive; their future is unobserved.
Alternative uptake is accessible and can accompany reproduction, but the observed earlier
families did not establish enduring branches. Intake may fund body material as well as energy.

Chemical **186 did not become abundant**: its maximum share across the 1k samples was
0.0169%, and its final share was 0.0000255%. Chemical 136 held 37.87% of extracellular
material at the end. It is a supplied feedstock that is barely processed, not the earlier
186 waste sink. Abundance alone would obscure that distinction.

### Binding and geographic separation

The implemented binding did **not** retain the initial tight resource clusters. Periodic
source nearest-neighbor median distance increased from 5.07 to 14.86 at 50k and 21.38 at
200k; RMS increased from 14.94 to 21.45 and 26.20. The area containing half the field
material increased from 1.31% to 6.16% and 9.49%. Source separation and material spreading
are both visible in the checkpoint maps.

Cells still form local patches with gaps, but that does not certify bound source clusters.
Final cell nearest-neighbor median/RMS are 2.92/11.67; their changing population count
also affects those distances. This run leaves long-term resource binding unresolved.

### Performance and evidence limits

The separate final-state operating samples measured **130.26 ticks/s with panels closed**
and **129.47 ticks/s with Web/Phenotypes active**, including census, selected inspection and
packed render preparation. Both completed their registered 100 measured ticks. These short
CPU measurements exclude GPU/browser execution and do not establish 2,000-cell capacity.

The full review averaged 89.4 ticks/s while recording every route page, checkpoint and
population sample. Peak sampled process RSS was 544.3 MiB; WASM high-water memory was
205.9 MiB. The final checkpoint is 26.44 MiB. Active four-species field groups occupied
15.97% of possible groups at 50k, 13.82% at 150k and 30.18% at 200k: the late chemical
expansion increases sparse-field work even while cell count falls. All 66,375 recorded
deaths were starvation. Maximum sampled absolute material/energy residuals were
6.41e-7 / 2.84e-6. No resource or accounting stop occurred.

The older v28 user run had 4,166 cells at 143,249 ticks, including large and small body
types. It is useful context for recurring strategies, not a matched control for attributing
population changes to illumination or photoreception. This study covers one seed and less
than one full 310k modulation cycle. UI appearance and multi-day browser memory behavior
were not tested here.

The next design issue supported by these results is the gap between successful internal
processing and unsuccessful establishment on exported products, alongside continuing source
dispersion. The evidence does not justify another wholesale chemistry rewrite or declaring
evolution absent. No tuning or follow-on ecology campaign was performed.

### Evidence and reproduction

- [Trajectory and optical responses](evidence/digital-chemistry/integrated-200k/trajectory.png)
- [Spatial checkpoints](evidence/digital-chemistry/integrated-200k/spatial.png)
- [Accepted chemical routes](evidence/digital-chemistry/integrated-200k/chemical-web.png)
- [Final body and photoreceptor differentiation](evidence/digital-chemistry/integrated-200k/final-phenotypes.png)
- [Reduced measurements and ancestry](evidence/digital-chemistry/integrated-200k/summary.json)
- [Exact configuration/provenance](evidence/digital-chemistry/integrated-200k/manifest.json)
- [Late operating costs](evidence/digital-chemistry/integrated-200k/cost.json)

Full checkpoints, genomes, flux windows and the archived WASM remain local under
`frontend/harness/artifacts/integrated-200k-v31/`. Exact WASM SHA-256:
`d445fe57952ecda9d6d55da540a0b933f5afb7a227e24540c8f6b3796058ea7a`.
The cost samples used that same binary. The harness emitted a source-change warning
because analysis files and formatting changed during the run; the running simulation's
loaded binary and laws did not change. Native inspection asserts it leaves snapshots unchanged.

The reusable runner is `frontend/harness/numerical/integrated200k.ts`; checkpoint reduction
is `engine/examples/inspect_ecology.rs`; plots and summaries use
`frontend/harness/integrated_review.py`. Run the trajectory only under a new explicit
registration. Reanalyzing existing files advances no physics.

### Registered late performance check

The review records every route page, including tiny accepted flows; this is more work than
the application performs for its visible page. Its elapsed throughput must not be presented
as ordinary browser throughput. After the 200k trajectory, restore its final checkpoint for
two 100-tick operating samples, each with 10 warmup ticks and a 30-second cap. Compare closed
observations with the ordinary active Web/Phenotypes reports every 25 ticks (one route page).
Use the existing operating measurement with census, selected inspection and packed render
preparation. Both start from the same checkpoint; no configuration or controller changes.
These 220 additional ticks answer only execution cost, not evolutionary outcomes or survival.
