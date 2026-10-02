# Mortality recovery delivery and bounded checks

**Status:** V50 deployed October 1. The first server world starved at tick12,412. Recovery stays enabled with sourceRate0.1; the [startup correction](mortality-startup-correction.md) retains full batches using sourceLifetime1200. Earlier negative survival findings remain recorded.

## Registration

Question: does nonlinear recovery of actual body chemistry create useful later uptake at a
waiting reservoir, compared with ordinary field spill? Competing explanations are retention and
redistribution benefiting the survivor, versus slower release or inaccessible chemistry making
direct spill more useful. A positive admission is not evidence of feeding or an extinction shift.
Read the negative supply timing/startup findings in [extinction correction](extinction-correction.md).

First calculate production resource budgets at zero ticks, with the current founder bodies,
maintenance, transport and conversions. Compare founder energy divided by age-zero maintenance
with candidate tau=60 model seconds. The candidate half-response is 0.25 recent net bound-body
loss: 1% net loss then recovers about 0.16%, 25% recovers half, and 75% about 90%. Balanced
funded growth cancels death material; no sourceGap-based scale or new rate gain is introduced.

Use the existing QuickScenario/runQuick and ledger. Handcraft one stationary paid-uptake reflex
genotype through diagnosticController, assigning all founders its capacities. Keep four ordinary
conservatively funded founder bodies and their existing bound mixtures, and freeze mutation,
private learning and inherited learning. Do not transform corpse chemistry into selected food.
Source mobility and processing stay installed, but the constructed waiting source is stationary;
all cell actions and subsequent chemistry use the ordinary World.

Mechanism panel: four 300-tick cases, at most 60 wall seconds each, enabled/disabled paired
with ordinary feeding versus a finite die-off. The ordinary case begins with a stocked reservoir
and no forced mortality; the crisis case starts physically empty and waiting 600 supply seconds,
then removes cells 2–4 in one declared mortality assay at tick 20. One source at (24,24), radius 3,
rate 0.2; the world is 48×48, diagnostic terrain, seed 27 and chemistry 101. Founder 1 remains near
the interface. Default washout, climate, transport, enzymes and growth remain installed.

Inspect the probes before feeding comparisons. If local sensing, funded transport and some
survivor uptake exist, run four 1,500-tick cases (enabled/disabled, two mirrored placements),
one survivor after the same death batch and at most 120 wall seconds each. Compare chemical
uptake, captured work, expenses, growth, deaths, admitted material and actual source release.
Mirror positions/headings about the source; do not select a favorable seed.

Conditional supply comparison: only if feeding evidence supports the opportunity, run six
3,000-tick small-population cases at gaps 600,1200,2400, enabled/disabled, fixed tau/h_star,
same seed and matched startup stocks/priming. The zero-tick mean supply law predicts fractions
0.5, 1/3 and 0.2 of each site's ceiling. No startup changes are made. Record deaths per
body-time, cumulative uptake/work, net living mass and healthy-period displacement. These
bounded outcomes cannot establish a long-term extinction curve or evolved dispersal.

Maximum budget: 25,200 ticks, 24 wall minutes. Stop at horizon, extinction, physical failure
or wall cap. Preserve negative and incomplete results; no automatic replication or retuning.
Generated configurations, reports, traces and checkpoint data stay in ignored local artifacts.

## Reproduction

From `frontend`, use `pnpm exec tsx harness/numerical/mortalityRecovery.ts STAGE NEW_DIRECTORY`.
Implemented stages are `budget`, `probe`, `feeding` and `defaults`. Read the budget and probe results
before later stages. The command refuses existing directories. The conditional supply panel
was not executed or added as an unused command after the negative feeding result.

## Findings and decisions

Keep tau=60 model seconds and h_star=0.25 fixed. The zero-tick founder reserve is about
45.5 maintenance-only seconds, from energy 0.5 and maintenance 0.01098 work/second. Action,
growth and repair expenses shorten that reserve; this is a scale estimate, not a survival
prediction or an optimal memory calibration. Exact balanced growth/death impulses cancel
in Rust tests. Short ordinary fixtures also incurred genuine net deaths, so they are not
evidence of balanced ecological turnover.

All four probes had paid uptake. The crisis pair had identical cell observations through
tick 20, before the declared deaths; source recovery then admitted about 5.271 material from
actual bound-body chemistry. It released 0.320 by tick 30 and the full initial recovered deposit
by tick 200, while the external wait stayed unchanged. No new import occurred. Local receptors
read the resulting chemistry; transport and enzyme activities were expressed with zero motor
effort. Recovery was never interpreted as survivor intake.

Both mirrored feeding pairs reached finite-food extinction before their 1,500-tick ceiling:

| Terminal comparison (first placement) | Ordinary spill | Recovery |
| ------------------------------------- | -------------: | -------: |
| Extinction tick                       |            358 |      287 |
| Total paid uptake, material           |          2.957 |    2.632 |
| Captured usable work                  |          1.523 |    1.371 |
| Funded growth, material               |          1.462 |    1.666 |
| Growth work                           |          0.731 |    0.833 |
| Organism-time, model seconds          |           83.6 |     69.4 |

Totals include the identical pre-death histories of all four founders and subsequent activity
of the single survivor. They end at different times and are not uptake-rate comparisons.
Growth is about 14% higher relative to the spill pair's 1.462 material, yet extinction is 71 ticks
(14.2 model seconds, about 20% of the spill pair's 358-tick lifetime) earlier. Both mirrored
placements reproduced these terminal ticks with only small floating-point differences.
At the matched tick 250, survivor usable energy was 0.094 with recovery versus 0.250 with spill;
its body was larger. This supports a growth/survival tradeoff in this fixture, without assigning
a unique cause to release timing, chemical processing or upkeep. No parameter was retuned.

The ordinary stocked probe also failed to establish benefit: both modes retained two cells
at tick 300, while recovery slightly reduced cumulative uptake and growth. No forced death is
not equivalent to healthy balanced turnover. Neither result establishes an evolved response,
indefinite diversity or dispersal.

Initial decision: leave recovery disabled and retain supply defaults. The user rejected that
decision and its burden of proof. Working physics, non-breaking integration and a plausible
path to the intended effect suffice for delivery; a single fixed-controller survival result
does not justify disabling the requested feature.

Initial lower-rate decision: enable recovery in both presets and reduce sourceRate from0.2 to0.1.
This halves the discharge ceiling and nominal refill amount, including initial source stock
and its priming allocation. SourceGap600, sourceLifetime600, priming fraction0.1, tau60 and
h_star0.25 remain. Actual chemical recovery, paid uptake and funded growth establish the
plausible opportunity. Wider extinction boundaries remain a research question.

After the deployed world starved, the ordinary-founder startup comparison exposed the omitted
establishment check. Current defaults retain rate0.1 but increase sourceLifetime from600 to1200,
preserving full batches and reservoir-derived priming. Secondary8/128 priming was never halved.
The [startup correction](mortality-startup-correction.md) records the observed improvement;
configuration changes apply through a new-world restart. The user subsequently authorized
[operating tuning and restarts](mortality-configuration-tuning.md), removing that permission gate.

## Default-rate check registration

Question: does recovered body material still discharge into accessible chemistry and support
ordinary paid uptake at the reduced default rate? Competing explanations are useful delayed
delivery versus release too slow to reach a survivor. Reuse the registered crisis fixture above
with one placement, freezing mutation and learning as before; set the scheduled source's rate
from the new world's actual configuration. Compare enabled recovery with its spill-only ablation.
The causal chain is death batch → conserved admission → rate-limited release → local chemistry
→ paid intake and funded growth. This checks plausibility, not a required survival advantage.

At zero ticks, sourceRate0.1 predicts a0.1-material/s discharge ceiling for the unit-richness
fixture; the earlier5.271-material crisis deposit takes at least52.71 supply seconds to discharge.
The unchanged600-second external wait exceeds the300-tick (60-model-second) check. Run exactly
two cases via `defaults`, each capped at300 ticks or extinction and60 wall seconds: at most600
ticks and two wall minutes. Stop on physical failure; no tuning, extra placements or horizon
extension. The result can identify a concrete broken delivery path, not gate a long campaign.

## Default-rate findings

Both cases reached the 300-tick horizon with one survivor. Recovery admitted 5.271 material
from the declared death batch and released all of it through the 0.1-material/s source ceiling
before the horizon. No external refill occurred. At the same horizon, paid uptake was 2.711
material with recovery versus 2.541 with spill (6.7% more relative to spill), and funded growth
was 1.610 versus 1.462 (10.1% more). These are whole-fixture totals including identical pre-death
activity; mutation and learning remained frozen. The largest account residual was below
1.1×10^-13 percent of accounted input.

This demonstrates a working delivery path and a plausible benefit at the reduced default rate.
The implementation is complete and ready to push. The prior faster-release survival result
remains negative; no additional ecological campaign is required for delivery.

## Local evidence and implementation checks

Budget artifacts are `frontend/harness/artifacts/mortality-v50-budget/`; the four probes are
under `mortality-v50-probe/` and four feeding cases under `mortality-v50-feeding/`, all within
that ignored artifacts directory. Existing ledger entries 4438–4445 retain manifests, exact
checkpoints, engine/source hashes, traces and stopping reasons. Eight cases advanced 2,477 ticks
in less than one second of measured stepping wall time. All stopped at the declared horizon
or extinction. Largest feeding account residuals were below 2×10^-13 percent of accounted input.
These constructed checks do not replace invariant tests or production-consumer builds.

The default-rate pair is retained under `frontend/harness/artifacts/mortality-v50-defaults/`,
with ledger entries 4446–4447, exact checkpoints, manifests and source/binary hashes. It advanced
600 ticks in 0.212 seconds of measured stepping time and stayed within its declared budget.

Rust checks cover independent timing/RNG, conserved incoming species and potential, admission
latency, real empty duration, periodic/multiple/absent recipients, common death batches, division,
joined growth, interventions and checkpoint continuation. Browser/native checks keep selected
inspection bounded and read-only, forbid mortality assays to spectators and preserve borrowed
rendering and packet stride. Physical format v50 rejects earlier formats without migration.

`make ci` passes: 398 kernel cases, the native server and persistence suites, 85 Vitest cases,
Rust formatting/Clippy, TypeScript, ESLint, Prettier, storage/link guards and Terraform formatting.
The Python evolution reader initially rejected v50; its supported-schema check and current
producer fixture are updated and pass. Existing lint warnings and the nightly atomics warning
remain nonfatal. Serial/threaded WASM, the production Vite bundle and the native server release
build pass. No deployment, live-world replacement or user recovery-database access occurred.
