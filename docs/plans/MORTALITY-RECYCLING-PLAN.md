# Mortality driven reservoir recycling

**Status:** Completed locally in v50, October 1, 2026. Recovery enabled by default with sourceRate0.1; live world unchanged.

**Subsequent rollout:** Published as `9a4f497`; the first v50 server world starved at tick12,412.
The [startup correction](../mortality-startup-correction.md), tracked by Sulion
`1d4b3e3a-5250-43a0-a382-57266cd843bd`, retains full batches using sourceLifetime1200 while
keeping rate0.1 and enabled recovery. This supersedes the earlier T600/halved-startup default
below. The historical registrations and their negative findings remain unchanged.

## Outcome and authorization

Implement [mortality driven reservoir recycling](../design/mortality-recycling.md):
ordinary turnover returns little body material to reservoirs, while substantial recent net
body loss redirects a larger finite fraction to nearby reservoirs. Preserve external growth,
the baseline resource landscape and ordinary paid physiology. The intended benefit is a lower
extinction boundary without continuous support for healthy reservoir residents. Wider useful
replenishment settings and evolved dispersal remain hypotheses, not promised outcomes.

The October 1 follow-up authorizes decisions and execution of all implementation milestones.
The delivery covers the complete local
native/WASM feature and its existing browser/native consumers. Commit, push, deployment,
live-world replacement and a long ecological campaign require subsequent authorization.
The locally delivered v49 code is the planning baseline; preserve the continuing server world.

The user's delivery clarification supersedes the initial default-off decision and the requirement
to preserve baseline reservoir amounts: enable recovery and lower default sourceRate from0.2
to0.1. Bounded correctness and plausible effect are sufficient for delivery. Long-term ecological
proof and the conditional supply campaign are not gates. The default correction is tracked by
Sulion plan `1c9d8687-a477-486a-a294-8da8d34cc0b9`.

## Evidence and reuse

The [design](../design/mortality-recycling.md) owns the candidate equations and boundaries.
The earlier [reservoir-storage proposal](../design/reservoir-storage.md) is insufficient as
the primary answer and is not a dependency: do not replace batch renewal with continuous
recharge or introduce concentration backpressure as part of this work.

The [extinction investigation](../extinction-correction.md) recorded starvation but did not
identify a unique cause. Equal-average shorter cycles did not reduce deaths per cell-time;
smaller startup batches performed poorly. The delivered change retained full batches and
priming, reducing `sourceGap` from 2,400 to 600 model seconds. It increased nominal mean input
2.5-fold. This plan preserves those installed defaults initially and tests lower baseline
supply separately; it does not quietly revert the correction or claim a measured response curve.

| Owner                                                                                         | Planning baseline (v49) and required reuse                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine/src/sources.rs`, `source_lifecycle.rs`, `source_medium.rs`                            | One amount and mixture; amount currently controls exhaustion and refill overwrites stock. Reuse independent renewal RNG, seasonal accrued time, frozen reads and source-local commits.                                                              |
| `engine/src/world.rs`                                                                         | Source release precedes physiology; lifecycle follows the tick advance. Initialize schedule allowance after finite priming, and place recovery at a joined lifecycle boundary. Preserve existing climate, chemistry and independent random streams. |
| `engine/src/lifecycle.rs`                                                                     | Natural deaths and disturbance currently release individually; fission endings are separate. Collect actual deaths before selecting one batch response; preserve ancestry, heat, disturbance mixing and event semantics.                            |
| `engine/src/physiology.rs`, `world_physiology.rs`, `world_base.rs`                            | Funded growth records material in `cell.flows.grown`; the energy spent on growth is a different quantity. Reduce genuine growth once after the physiology join, independent of observer state.                                                      |
| `engine/src/footprint.rs`, `source_footprint.rs`, `spatial_members.rs`, `spatial_carriers.rs` | Sorted finite body/source footprints and reusable node membership primitives. Carrier sums do not identify source recipients; add derived local source membership using these owners rather than scan every source per corpse.                      |
| `engine/src/commands.rs`, `world_validation.rs`, checkpoint codec in `world.rs`               | Explicit constructed deaths and population replacement need declared estimator rebasing. Persist and validate physical history and schedule allowance; derived membership rebuilds on restore.                                                      |
| `engine/src/strategic_local.rs`                                                               | Existing local reservoir readings use physical stock and elapsed empty state. Preserve local information; separate observable empty duration from the hidden nominal refill countdown.                                                              |
| `engine/src/observation.rs`, `render.rs`, `frontend/src/engine/`, `engine/server/display.rs`  | Extend bounded observations and the shared marker renderer. Local drawing borrows WASM projections; native publication uses existing bounded display packets.                                                                                       |
| `frontend/harness/lib/quickScenario.ts`, `quickRun.ts`, `quickObserver.ts`                    | Reuse constructed fixtures, ordinary inference/physics, local checkpoints and the existing ledger. Extend observables rather than create another experiment pipeline.                                                                               |

The [composed laws](../design/chemistry/composed-runtime.md#mobile-resource-reservoirs),
[resource budgets](../design/chemistry/resource-economy.md) and immutable
[ownership contract](../design/chemistry/data-ownership.md) govern execution.
Source locations, branch state, active writers and physical format must be refreshed on resume.

## Settled implementation boundaries

- One world-wide physical-time history estimates dead bound material, funded body growth and
  recent living bound mass. Use the design's net-loss severity and fixed quadratic response;
  only memory time `tau`, dimensionless half-response `h_star` and a world-start enable switch
  are added. Healthy balanced turnover should not create a continuing recovery subsidy.
- Initialize history from founding biomass with zero death/growth rates. Advance exact
  exponential decay with model time, including empty worlds. Account event material once at
  its actual lifecycle/physiology boundary; do not infer growth from births or census changes.
- Use the entire tick's actual death batch, including natural and disturbance deaths, and
  its pre-removal body-mass reference for one response fraction. A sudden die-off contributes
  to its own response. Division contributes nothing. Empty references have defined behavior;
  positive death material requires a positive reference, without an arbitrary epsilon.
- Recover bound-body chemistry only. Free inventory and unrecovered material spill into the
  ordinary local field; remaining usable energy becomes heat. Recovery is an internal transfer,
  not imported material, supplied energy or usable work.
- Recommend overlap weight `sum_node(cell_weight * source_weight)` on the installed finite
  footprints, normalized once across all intersecting recipients. All species share routing
  fractions; absent overlap spills locally. Confirm the reduction against existing geometry
  tests in M1. No new catchment radius or distant nearest-source fallback is allowed.
- Aggregate incoming chemical vectors per source before mixing with its single physical stock.
  Refresh material reductions and invalidate changed carrier/observation dependencies locally.
  Derived recipient membership uses current source footprints, including periodic seams and
  movement; it is neither persistent provenance nor a second material owner.
- Separate nominal batch allowance from actual inventory. Recovery never extends the active
  nominal schedule, restarts a wait or changes the next import. Imports add and mix into
  retained stock. Available recovered material can discharge during a wait at the existing
  seasonal rate ceiling, beginning at the next ordinary source commit.
- Preserve initial source amounts and priming. Initial schedule allowance equals the stock
  left after priming; later nominal batches retain `r * sourceLifetime`. Preserve zero-recovery
  release/refill timing and random draws, including zero rate, zero gap and multi-event steps.
- Keep current chemistry, source mobility, seasons, body economics and controller ports.
  Do not expose global severity, hidden refill waits or corpse provenance to controllers.
  Distinguish physical empty duration from nominal waiting even if recovered stock is present.
- Advance the physical format once for the complete feature; choose the next unused version
  at execution. Reject incompatible checkpoints. No migration, live reset, extra backend,
  full physical frame export or change to observer backpressure is included.

## Technical decisions resolved during implementation

These choices belong to the implementer; they do not require an acceptance phase.

| Decision                                           | Owner, evidence and affected milestone                                                                                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact event/history ordering                       | Exact interval decay with held living biomass; joined growth impulse; one sorted natural/disturbance batch after tick advance; spills before disturbance mixing. Subdivision, cadence and observer checks pass.                             |
| Local recipient index                              | Derived node membership built once when a death batch needs it; local footprint dot products and per-source aggregates. No corpse-by-all-sources scan; periodic, absent and multi-source cases pass. No large-population performance claim. |
| Initial `tau` and `h_star`                         | Tau60 model seconds against a45.5-second maintenance-only founder reserve; h_star0.25 for substantial net loss. Balanced turnover cancels algebraically. Settings stayed fixed; no claimed optimum or sourceGap coupling.                   |
| World-start default enablement and baseline supply | Enabled in both presets; sourceRate0.1 halves release and nominal stock, including startup. SourceGap600 and priming fraction0.1 remain. The negative survivor fixture remains recorded; bounded correctness and plausible effect suffice for delivery. |
| Display encoding                                   | Existing twelve-float marker records: solid/dashed actual stock, violet recent recovery, green measured release, retained seasonal band. Scalar history and one selected-reservoir query; no automatic polling or bulk transfer.            |

Growth elsewhere can mask a failing colony. Corpse chemistry may be unusable, direct spill may
feed survivors sooner, and recovery beside full sources cannot increase their instantaneous
output. Report those limits. A failed physical opportunity that requires changing agreed
boundaries must be surfaced before such a change; do not tune until a favorable endpoint appears.

## Milestones and Sulion mapping

Root plan `4ae0191b-e4f5-4161-9ebf-757b84247e8e`; M0, M1 and M2 complete. All children closed.
Tests and bounded checks belong within these implementation milestones. There is no separate
verification, ecological certification, observation or human-acceptance stage.

### M0 — Independent renewal with retained inventory

Sulion phase `b2b413ad-8366-4e43-bc4f-16c7f03c94a9` (CLI position 1).

Scope: separate nominal batch allowance and seasonal waiting from physical amount; introduce
conservative source admission/import mixing, correct lifecycle deadlines and elapsed-state
semantics. Cover initialization after priming, direct diagnostic stock changes and restore
validation. Prepare the complete feature's physical schema without compatibility behavior.

Acceptance: returned stock never postpones, advances or erases scheduled external input.
Waiting sources can discharge retained stock; already feeding sources retain their rate ceiling.
With zero recovery, initial funding, release parcels, renewal events and source RNG draws
match the ordinary schedule. Zones/epochs change incoming composition without overwriting stock.

Evidence: bounded Rust lifecycle cases for empty/waiting/full stock, simultaneous admission,
seasons, moving zone/epoch boundaries, zero rate/gap, multiple events and per-species material
and potential accounts. Check admission-to-next-commit latency and checkpoint continuation.

### M1 — Nonlinear mortality feedback and local recovery [depends on M0]

Sulion phase `6a2d1802-ac3f-46c4-b1ff-870ad5537546` (CLI position 2).

Scope: joined funded-growth reduction, persistent mortality history, one actual-death batch,
local footprint recipient membership and per-source chemical aggregates. Integrate natural
and disturbance deaths, ordinary spill, death heat, ancestry and explicit intervention rebasing.
Persist/validate history and lifecycle state in the single new physical format.

Acceptance: balanced turnover remains weak, substantial net loss produces a bounded stronger
response, and division alone produces none. Shuffling dead cells or changing worker count does
not change recipients or response beyond ordinary numerical tolerance. Every chemical and its
potential moves conservatively; no recipient means ordinary field spill. Pausing or observing
cannot drive physics. Explicit replacement is not an ecological die-off; a registered mortality
assay can explicitly exercise the death path.

Evidence: deterministic body-mass/history, cause, birth, periodic overlap, absent recipient,
multi-source mixing, disabled-path, intervention, account and continuation tests. Verify actual
growth material is counted once, not repeatedly reused from cell flows between physiology steps.
Short constructed cases measure admitted material, local spill and subsequent source release.

### M2 — Observable runtime integration and defaults [depends on M1]

Sulion phase `69a84b17-7b19-4493-83a5-819ae4fbc199` (CLI position 3).

Scope: validated world-start configuration and presets; bounded severity, response, dead body,
recovered material, spill and actual output observations; recovery cues in ordinary reservoir
marks/inspection and legend; browser/native consumer integration and current source contracts.
Resolve the two numerical scales, record authored findings and reproduction commands, and
complete serial/threaded WASM, native and production frontend builds with `make ci`.

Acceptance: ordinary consumers use the replacement, saved worlds retain feedback state, recovery
is visibly separate from external supply and actual feeding, and observers do not alter physical
state. The selected defaults have dimensional and bounded causal evidence, with negative
results and remaining ecological uncertainty stated. Ownership guards and observation limits
remain enabled. No live-world replacement follows from local delivery.

Evidence: budget-first registered checks below, deterministic observer/consumer/version tests,
complete repository CI and production builds. Record detailed findings in an authored results
document and generated data only in ignored local artifacts. Close the local plan when this
implementation is delivered; continuing ecology does not keep it open.

## Bounded checks within implementation

Before any run, register the exact fixture, question, competing explanations, causal chain,
decision, settings and resource budget. Use the existing ledger and `QuickScenario`/`runQuick`.
Handcrafted diagnostic genotypes/RNNs may express funded uptake and local response; they cannot
convert corpse chemistry into preferred food or use an oracle. Initially freeze mutation and
both private and inherited learning. Restore ordinary settings only in explicitly registered
follow-ups. The October1 execution request authorized these bounded implementation checks.

1. Calculate reserve duration, maintenance and accessible conversion/transport budgets without
   advancing ticks. Register at most four 300-tick mechanism cases, at most 60 wall seconds
   each: ordinary balanced turnover versus a finite die-off, enabled versus spill-only beside
   a waiting source. Empty/full/absent source permutations belong in Rust tests.
2. After inspecting those probes, use at most four survivor-feeding cases: matched startup and
   death mixtures, enabled versus disabled recovery and swapped placement. Use one to four
   survivors, at most 1,500 ticks and 120 wall seconds per case. Record real local chemistry,
   inputs/actions, uptake, work expenses, biomass growth and death; compare retention/delivery
   benefit against immediate field spill, not just recovered quantity.
3. If the opportunity is physically available, register three baseline supply levels with one
   seed and fixed feedback settings, enabled/disabled: at most six small-population cases,
   3,000 ticks and 120 wall seconds each. Keep initial stocks, priming, cells and random streams
   matched; change future wait settings only after initialization.
   Select exact levels before running from the budget and prior findings. Measure cumulative
   usable uptake, deaths per body-time, net living biomass, crisis response and healthy-period
   residence/displacement. These short cases measure a local response, not an extinction curve
   over generations or evolved dispersal. Do not count final population alone as success.

The complete ceiling is 25,200 ticks and 24 wall minutes; conditional cases are not automatic.
Stop at the registered horizon, extinction, physical failure or wall cap and preserve incomplete
results. Do not extend horizons, sweep seeds or add independent gains. If defaults require a
sensitivity check, replace cases within this declared budget and register that change before
execution. Broad long-run stability, selection for destructive turnover and sustained widening
of the ecological range belong to continuing observation, not a release gate.

## Current state and next action

### Execution decisions and M0 expansion

Use physical format v50 for the complete feature. Source allowance is a persisted supply-time
clock expressed in nominal material; physical stock discharges at the existing ceiling in
both active and waiting intervals. Scheduled imports mix conservatively. Finite priming sets
the initial allowance after withdrawal; explicit diagnostic stock replacement rebases it.
Recovery admission does not rebase it. Empty elapsed measures actual empty stock only.

Use exact exponential decay with held pre-event living biomass over each physical interval.
Funded growth is an impulse at the joined physiology boundary. Natural and disturbance deaths
share one end-of-tick response, with spills committed before ordinary disturbance mixing.
Recipient weights are the dot product of the installed finite footprints, aggregated by source
through node membership and normalized once for all species. Calibration remains evidence-driven
within M2; preserve sourceGap=600 and the existing startup state.

M0 expansion `a0842f64-3322-4b7c-8495-b57fcf7ea012`, step
`5813dd03-72f6-4f4e-a7c6-0af2c3fd5b1d`: implement independent allowance,
conservative admission/import, lifecycle deadline and physical-empty semantics in the source
owners; update initialization, diagnostic replacement and restore validation. Verify source
lifecycle, seasonal crossing, per-species mixing, zero recovery/RNG parity and continuation
using bounded Rust cases. Required repository-wide checks are shared with final M2 integration.

M0 completed: 28 source-related Rust cases pass, including admission, independent schedule/RNG,
retained-stock mixing and seasonal continuation. Empty imports retain their exact profile.

M1 expansion `654c5e4c-5b11-4ca1-b212-819dde5af43f`, step
`a243d000-ccca-417a-9665-bf90f2e3d172`: persist exact held-biomass history and joined growth
impulses; collect/sort natural and disturbance deaths and aggregate local source admissions.
Preserve spill-before-disturbance-mixing, heat and ancestry. Rebase explicit replacements and
provide a declared mortality assay through the existing research boundary. Verify balance,
subdivision, periodic routing, shuffled death order, absent recipients, disablement, interventions
and observer/restore independence with bounded Rust cases.

M1 completed: seven targeted Rust cases pass. Bound chemistry and potential close; free
inventory spills, combined natural/disturbance batches share one fraction, division creates no
loss, and growth is reduced once at physiology. History rebasing follows body refresh.

M2 expansion `9c7add0a-6017-4c84-bf96-ad89ce1e9036`: step
`2c96e29d-0b4f-440c-b353-fe34dae0d182` wires world-start settings, scalar history/stock/output
observations, one selected-reservoir query and existing marker lanes/legend across local/native
consumers. Step `02cde9a7-511c-49d5-b88c-fb75a9a30173` derives scales from zero-tick reserve
and turnover budgets, runs registered constructed checks through QuickScenario/runQuick, selects
enablement from measured feeding, records limits, and completes CI plus production builds.
Tau=60 model seconds and h_star=0.25 are retained after the budget and fixed-setting checks.

Read the complete mortality-recycling design, extinction findings, prior documentation plan
`b7f1c24c-9d93-46e1-8279-1f01c7f58388`, and the source bodies listed above. The previous plan
completed documentation only; this root tracks the now implemented feature. Repository/PTY
binding is `antropy`; existing authored planning changes were retained. The local physical
format is v50, while the existing server world was not replaced.

Eight registered cases advanced 2,477 ticks. Recovery increased growth but shortened survivor
life in both mirrored placements (287 versus 358 ticks); the conditional supply comparison was
not run. The initial disabled-default decision was superseded by the user's delivery clarification.
Recovery is enabled with sourceRate0.1 and `sourceGap=600`. Results
and reproduction live in [delivery findings](../mortality-recycling-results.md).

M2 complete: `make ci` passes, including kernel/native suites, 85 Vitest cases, Python report
consumer, ownership/storage checks and documentation links. Serial/threaded WASM, production
browser bundle and native server release builds pass. The first full run exposed a remaining
v49 Python report-reader allowlist; its v50 update passed on rerun. There is no remaining local
implementation work, publication or deployment in this plan. Live-world cutover is outside scope.

Default correction complete: both presets enable recovery and sourceRate is 0.1. The registered
paired 300-tick check released all recovered material and produced 6.7% more paid uptake and
10.1% more funded growth than spill-only at the same horizon, with closed accounts. Repository
CI and production builds pass. No ecological proof gate remains; local delivery is ready to push.
