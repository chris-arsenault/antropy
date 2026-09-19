# Current-default spatial observation, v27

Seed 27, chemistry 101, tick 0–50,000. Registration, findings, definitions and proposed changes
are in [the spatial isolation review](../../../design/spatial-isolation-review.md).
No physical laws or configuration changed during this study.

- [Geography over time](geography.png): source positions, cells, supplied species and all material.
- [Spatial metrics](metrics.json): 201 samples, including reductions at 21 checkpoint positions.
- [Endpoint and chemical totals](summary.json).
- [Observed individual transfers](transfers.json): identified cells observed in disjoint original
  radius-30 neighborhoods. These are incomplete sampled counts, not a migration probability.
- [Segment provenance](segments.json): shared retained boundary at tick 22,500. Original later
  samples are excluded; the second segment supplies the remaining trajectory.
- [Continuation result](continuation-result.json) and [manifest](continuation-manifest.json):
  ledger 4116, horizon reached at 50,000. Its elapsed time covers 27,500 advanced ticks.
- [Initial manifest](initial-manifest.json): its `running` status belongs to the interrupted
  process. It is retained unchanged as provenance, not evidence that a process remains running.

The first segment used optional cumulative reaction tracing. A lineage's edge list exceeded
31,000 entries, making linear diagnostic searches expensive. The retained physical checkpoint
continued without this trace; the exact physical binary and config match across segments.
The original 1,800-second deadline remained in force: total elapsed time was 1,605 seconds,
including interruption and the failed zero-step continuation attempt. The successful continuation
itself took 664.95 seconds. The complete local archive was about 3.35 GiB at run completion.

Raw files remain local under `frontend/harness/artifacts/spatial-isolation-v27/`. The `spatial`
directory contains the interrupted segment; `continuation` contains the failed zero-step
attempt; `continuation-untraced/spatial` contains the successful continuation. No running
process remains. The analysis reads checkpoints without advancing them:

```bash
cargo build --manifest-path engine/Cargo.toml --release --example spatial_snapshot
python3 frontend/harness/spatial_review.py frontend/harness/artifacts/spatial-isolation-v27/spatial --continuation frontend/harness/artifacts/spatial-isolation-v27/continuation-untraced/spatial --reader engine/target/release/examples/spatial_snapshot
```

All 21 restored field and binned-mixture totals match the corresponding existing field
observations. `make ci` passed: 153 Rust tests, 62 Vitest tests, formatting, lint, typecheck,
documentation and Terraform formatting. Twelve existing lint warnings remain. Browser motion
and endurance were not tested in this headless study.
