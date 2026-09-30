# Terrain integration corrections

**Status:** Implemented September 30, 2026; delivery through the shared CI/CD pipeline. No live-world reset or format change.

The September 30 review found combined-motion and configuration defects and questioned
reservoir refill timing. The implementation uses a scalar constitutive solve for combined
motor/passive travel, one ecology/diagnostic request parser, and lifecycle deadlines that
commit refills at their own time and interpolated position. The composed runtime owns the
equations; dynamic terrain is a separate open design direction.

Regression cases cover cancellation on uniform resistant ground, a downhill proposal whose
funded result travels uphill, oblique travel, nested configuration overrides, equivalent JSON
whitespace, explicit diagnostic defaults, an unscheduled refill before an epoch boundary,
and refills on either side of a zone crossing with ordinary and seasonal clocks. Existing tests retain accounts and checkpoint
continuation. Old registered isolated fixtures explicitly request diagnostic defaults where
they previously depended on partial configuration choosing that preset accidentally.

## Bounded cost check

Question: does the corrected movement solve retain the existing operating target with terrain
active? Competing explanation: repeated map sampling adds excessive cell-motion work.
Reuse `terrain_capacity integrated populated sources`: seed27, 720×540, mesh2, four native
workers, 2,000 cells and 240 sources, eight warm-up and 40 measured ticks, a 120-second measured
wall cap. Inspect phase time and whole-runtime ticks/s. This is a cost check, not ecology or a
before/after speedup claim; no seed expansion or extended horizon. Decision: simplify numerical
work if necessary while retaining the corrected constitutive relationship.

The example also saves and restores its result, checking the unchanged v46 state shape.
Generated output remains local under `frontend/harness/artifacts/terrain-corrections/`.

## Result

The registered four-worker run completed all 40 measured ticks with 2,000 cells and 240 sources
at **32.21 ticks/s**, above the 30 ticks/s target with limited headroom. The local cell phase
averaged 9.73 ms/tick; the combined source/field phase averaged 5.72 ms/tick. This is a short
constructed workload, not a mature live-world measurement or a before/after comparison.

Boot took 1.43 s; display preparation took 14.0 ms. The 76.2 MB v46 checkpoint saved in 114 ms
and restored in 239 ms. No horizon extension or second cost campaign was needed. The generated
report is `frontend/harness/artifacts/terrain-corrections/capacity-20260930.json`.

Rust tests, Clippy, frontend lint/format/type checks, all 82 Vitest tests, documentation/storage
checks and Terraform formatting passed. The automatic run exposed one scheduled-supply fixture
that implicitly relied on neutral seasonal timing; it now requests the diagnostic preset.
The documentation index check also required the new backlog anchor's index link, now present.
