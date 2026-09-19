# v27 runtime optimization

September 18, 2026. Sulion plan `6573e08b-6a8a-47ef-88a7-0598c32dbd77`.

## Scope and registration

Preserve the v27 simulation and seek cheaper execution: derived caches, repeated arithmetic,
allocation reuse and exact early exits. Keep equations, numerical floor, clocks, resolution,
mutation, starting conditions, accounts and borrowed rendering. Any approximate threshold
change would need a separate error comparison; first exhaust measured exact reductions.

Question: which repeated calculations dominate the retained World and can be eliminated
without changing its trajectory? Competing explanations are field stencil/weathering cost,
per-cell machinery/transport cost, and growing observation overhead. Use stage timing and
a CPU profile to distinguish them before editing hot paths.

Fixed fixtures: the v27 capacity48/2,000/2,000-growth initial snapshots and the ordinary
seed27 tick5,000 checkpoint retained under `frontend/harness/artifacts/regenerative-20260918/`.
No ecological campaign or seed sweep. Each case runs10warmup+100measured ticks with the existing
`measureOperating` census/inspection/render preparation, plus three continuation ticks.
A separate40tick replay supplies per-stage and CPU profiles. Each case has a60second timing
cap; artifacts remain local under `frontend/harness/artifacts/optimization-v27/`.
Run one simulation process at a time. Initial baseline and final candidate each cover all four
cases; up to two targeted candidate revisions may repeat only cases relevant to the measured
hot path. Stop at the registered horizon, runtime failure or3GiB RSS/1.5GiB WASM limit.

Archive the original WASM/source, input hashes, final checkpoint hashes, timings, operation
counts and memory. A retained exact optimization must match the archived final physical bytes,
including ledgers and random streams, and cold continuation. Derived caches must rebuild after
restore and invalidate when their inputs change. Performance evidence includes whole workloads;
stage timing or a microbenchmark alone cannot establish a user-facing gain.

The first targeted5k candidate matched physical bytes but ran slower than the fourth case of
the baseline batch. All measured stages slowed, and native test compilation overlapped the
targeted run. Add one targeted replay of the archived baseline binary, using the same runner
and cold module order without compilation, to distinguish harness/host effects from a regression.
The final complete batch remains the acceptance measurement. No simulation horizon is extended.

## Work phases

1. Profile and preserve baseline — complete, ledger4080–4083.
2. Remove measured redundant work — complete, candidate4086–4089 matches all physical bytes.
3. Verify and record results — complete, final build ledger4090–4093 and full CI.

The preceding [regenerative evidence](../../evidence/digital-chemistry/regenerative-v27/README.md)
remains the ecological record. This pass does not certify endurance or evolved coexistence.

## Findings and retained changes

The saved5k workload spends12.11ms of13.62ms measured stepping in fields, source processing
and footprints. CPU samples place almost all of that time in the geographic stencil and
weathering, rather than source motion. The field has19,200 active locations and283,198 active
four-species groups, about23% of possible groups. Existing sparse culling is working, but
the remaining loops still repeat unnecessary work. A chemistry-definition cache would save
little compared with these loops and would add invalidation obligations; it was not added.

Only two production files change:

- `climate.rs` calculates the existing minimum-donor threshold once per geographic location
  instead of once per chemical pair. Pairs with exactly zero eligible engagement return before
  allocation/account arithmetic. This uses exact zero, not a new cutoff.
- The rounded weathering commit handles four species together in WASM and skips unchanged
  groups' float conversions and field writes. The same f64 addition, f32 rounding and existing
  floor comparison remain. A ceiling conversion of the floor preserves comparison against
  every representable f32, including non-power-of-two mesh areas. Scratch clears normally.
- The weathering loop stays outside the large geographic function. The first compiler
  arrangement inlined it into that function and measured poorly; the retained boundary makes
  the two loops separate. This changes compilation, not the update sequence.
- `field_vector.rs` computes the positive part of bounded finite drift with compare-and-mask
  SIMD instructions. It preserves positive zero and the original operation order while avoiding
  general NaN-aware maximum instructions. Valid face construction supplies finite bounded drift.

There is no persistent cache, extra field allocation, new approximation, or checkpoint change.
The original1e-9 concentration floor, material ownership, source/body laws, mutation, rendering
and observation schedules are retained. No cold-cache invalidation or new schema is needed.

## Final evidence

| Workload | Baseline ticks/s | Final ticks/s | Gain |
| --- | ---: | ---: | ---: |
| 48 cells, saturated field | 41.19 | 57.36 | 39.3% |
| 2,000 cells, saturated field | 19.04 | 23.18 | 21.7% |
| 2,000 growth, saturated field | 13.22 | 15.30 | 15.7% |
| Saved ordinary world at5k | 73.17 | 87.94 | 20.2% |

[Archived before/after reports](../../evidence/digital-chemistry/optimization-v27/README.md),
ledger4080–4083 and4090–4093. The preceding candidate batch4086–4089 measured
57.51/23.22/15.06/87.79ticks/s, consistent with the final build. No profiler runs during
the timed workloads. Separately instrumented stage timings vary more and are diagnostic,
not the basis of the gain percentages.

All four input hashes and final physical checkpoint hashes agree; cold restore and three-step
continuation agree. Field work counts and WASM high-water allocations are identical. Largest
WASM allocation is992.9MB, including replay/storage; sampled process RSS remains below2.04GB.
These are whole-workload timings with census, inspection and packed-render preparation. GPU
execution is excluded. Saturated2,000-cell cases still miss30ticks/s.

The first targeted candidate (4084) matched bytes but measured50.34ticks/s. The equally cold
archived baseline control (4085) measured67.64, versus73.17 after earlier batch cases. Module
warmup and overlapping native compilation made the initial comparison imperfect; the later
complete batch also corrected the compiler boundary and added finite-drift masking. It does
not isolate the contribution of each small change. The slower arrangement is not the delivered
configuration. Native tests additionally compare rounding/floor edges and scratch reuse against
the scalar formula. A test's initially ambiguous float literal was corrected before full CI.

Final confirmation reran the four registered cases after the CI build because the floor helper
was factored and its boundary test added after the candidate binary was built. All complete
physical bytes still match. `make ci` passes150Rust tests,62Vitest tests, Clippy, formatting,
TypeScript, documentation and Terraform formatting. ESLint retains12warnings and no errors.
`git diff --check` passes. Local artifacts total652MiB; measured process RSS stays below2.04GB.
No longer ecological horizon, new workload, browser/server session or deployment was introduced.
Existing v27 checkpoints remain compatible. This pass measures the current5k state and synthetic
loads, not far-run endurance or all possible future chemical coverage/populations.
