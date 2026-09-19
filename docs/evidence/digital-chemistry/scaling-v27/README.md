# Active-work optimization evidence

September 18, 2026. [Canonical plan and results](../../../../SCALING-PLAN.md).

## Reports

- `before-{48,2000,2000-growth,default-5000}.json`: archived original WASM, current runner,
  ledger 4108–4111.
- `after-{48,2000,2000-growth,default-5000}.json`: final CI-built WASM, ledger 4112–4115.
- Matching `*-stages.json`: separate 40-tick instrumented replays. Do not combine their
  absolute times with uninstrumented throughput.
- [Before continuation](before-continuation.json) and
  [after continuation](after-continuation.json): paired 1,000-tick continuation from the
  same saved state, ledger 4106–4107, with 200-tick chemical and population observations.

All throughput cases include ordinary census, selected inspection and packed-render
preparation. GPU execution is excluded. Timed intervals have no profiler or checkpoint
serialization. Input, source and WASM hashes identify each case. Different endpoint hashes
are expected; comparison focuses on cost, physical opportunities and material/work accounts.
Candidate 3 used for the continuation has the same production arithmetic as the final build;
later edits changed comments and moved a harness sampling call into its observation helper.

Retained local artifacts are under `frontend/harness/artifacts/scaling-*`: actual binaries,
initial-input references, endpoint snapshots, profiles and candidate reports. The original
binary remains in `optimization-v27/final/engine.wasm`. Existing directories are never
overwritten. Historical candidates include the rejected no-screen reservoir conversion
that expanded tiny products and increased deposition cost.

## Reproduction

Read the registration in the canonical plan before repeating workloads. From `frontend`:

```bash
OPTIMIZATION_ENGINE=harness/artifacts/optimization-v27/final/engine.wasm pnpm exec tsx harness/numerical/optimization.ts harness/artifacts/NEW-BASELINE
pnpm exec tsx harness/numerical/optimization.ts harness/artifacts/NEW-CANDIDATE harness/artifacts/NEW-BASELINE
```

An optional third argument selects a fixed case. A fourth argument of `1000` selects the
registered continuation horizon; otherwise the runner measures 100 ticks after 10 warmup.
The runner records bounded resource residuals, stop reason, field work, memory and ledger
provenance. It does not require old saves or matching trajectories for future optimization.

Read the concentration distribution without advancing the retained world, from the repository:

```bash
cargo run --release --manifest-path engine/Cargo.toml --example field_cost -- frontend/harness/artifacts/regenerative-20260918/default/mixed-27-chem101-rate0.2/checkpoint-5000.bin
```

## Limits

The 2,000-cell growth fixture remains below 30 ticks/s. No larger map, multicore browser,
terrain, sun/rotation, long-run endurance or evolved-community claim is established here.
The current cutoff removes more tiny dissolved material; numerical losses are reported in
the continuation table. All chemistry is subject to the same cutoff, and owned inventory
is retained. User visual review of the changed trajectories remains separate from these checks.
