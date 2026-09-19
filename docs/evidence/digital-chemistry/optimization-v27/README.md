# v27 exact runtime optimization measurements

The [registration and conclusions](../../../design/chemistry/runtime-optimization.md) explain
the fixed workloads, source archives, profile-guided changes, rejected first arrangement and
validation. Each report includes source/WASM/input/final hashes, ordinary observation timings,
field work counts, physical accounts, cold continuation and memory. Before rows4080–4083 and
after rows4090–4093 are also in the harness ledger.

| Workload | Before | After |
| --- | --- | --- |
| 48 cells, saturated field | [41.19ticks/s](before-48.json) | [57.36ticks/s](after-48.json) |
| 2,000 cells, saturated field | [19.04ticks/s](before-2000.json) | [23.18ticks/s](after-2000.json) |
| 2,000 growth, saturated field | [13.22ticks/s](before-2000-growth.json) | [15.30ticks/s](after-2000-growth.json) |
| Saved default at5k | [73.17ticks/s](before-default-5000.json) | [87.94ticks/s](after-default-5000.json) |

All four complete final checkpoint hashes match. All cold continuations match. WASM memory
high-water allocations and field work counts are unchanged. Timings include census, inspection
and packed-render preparation, but exclude GPU execution. The saturated2,000-cell cases remain
below30ticks/s. The saved5k result is a short continuation, not an average of a new5,000tick run.

Separate `*-stages.json` files contain40tick instrumented replays. CPU sampling and timing
instrumentation can perturb those costs; throughput above comes from unprofiled100tick windows.
Complete binaries, endpoint checkpoints, CPU profiles and both source archives remain local in
`frontend/harness/artifacts/optimization-v27/`.
