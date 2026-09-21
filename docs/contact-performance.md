# Mature contact-search optimization

September 21, 2026. Plan `90cad6da-8962-4b34-9d36-84077eb99a4c`.

## Scope and prediction

The [180k profile](cellular-200k-review.md#runtime-cost-contact-search-is-the-first-optimization-target)
measured 2.43 ticks/s at 6,975 cells. The maximum-radius grid generated 5,201,125 candidate
pairs for 38,071 overlaps. Movement, sensing and exchange repeat the search at distinct physical
stages. Candidate tests repeatedly derive radii from the full cell representation.

Replace that search with sparse diameter classes and compact per-pass positions, radii and
headings. Within a class, test each pair once; smaller cells query larger occupied classes.
Each queried bin is at least as wide as the largest possible pair reach. Periodic nine-bin
queries therefore cannot miss an overlap. Reject by coordinate bounds and squared distance
before evaluating contact geometry. Share the resulting geometry with each stage's consumers.
Retain actual overlap, contact normalization, soft relaxation, chemical exposure and donor
competition. Rebuild after physical changes rather than reuse stale inter-stage contacts.

Classes affect search only; they do not quantize physical radius. Sparse occupied-bin storage
scales with population, not world area. No new physical knob, reduced update frequency, lost
small contact, population cap or ecological change is introduced. Prediction: materially fewer
candidates and much lower movement/contact preparation costs. Remaining controller, chemistry,
observer and persistence costs may prevent the 30 ticks/s target at this mature population.

## Bounded verification registration

- Verify the exact pair set against all-pairs distances on heterogeneous radii, periodic seams,
  coincident centers, very small grids, empty/single populations, and reordered cells. Compare
  interface weights/directions with the original equations. Retain existing symmetry and
  funded-exchange tests. No ecological campaign is required for a broad-phase optimization.
  One zero-tick native check also compares the mature pair set against every pair using cached
  radii and records old/new candidate counts; this is not a native-versus-WASM speed comparison.
- The 180k checkpoint is v33; current production is v34. Use an isolated source export of
  commit `fad7fa9` under ignored harness artifacts, applying only the same contact optimization
  files. Benchmark archived v33 before/after on unchanged bytes. No production restore adapter,
  history rewrite or regenerated long world. Record the isolated source and binary hashes.
- Existing `integratedCost` workload: ten warmup ticks and at most 100 measured ticks or
  30 seconds per arm, ordinary observations plus closed/active measured panels. One before and
  one after pair of arms, sequentially. If a large change warrants tighter attribution, permit
  one repeat pair at the same horizon; no horizon expansion. Inspect stage timing and accounts.
- Current v34 release-WASM capacities: 48 fixed, 2,000 fixed and 2,000 growing cells, ten warmup
  and 100 measured ticks, 60-second cap. Before/after sequential samples verify startup-sized
  workloads do not pay excessive spatial-index overhead.
- Full `make ci`, runtime ownership checks and documentation. No server or user-tab access.

Illumination ecology remains [backlogged design](design/light-ecology.md). Save/export limits
and exhaustive route recording are separate work; do not disguise those limits with this fix.

## Results

The delivered search considers 303,934 candidates instead of 5,201,125 at tick 180,000:
94.2% fewer. The zero-tick check matches all 38,071 true overlaps against an exhaustive
all-pairs reference. Cached radii remain continuous physical values; diameter classes only
restrict where candidates are looked up. Contact normalization, relaxation, directional sensing,
injured-material access, stage timing and donor allocation retain their laws.

### Actual mature world

| Workload, including ordinary census/render preparation | Before ticks/s | Final ticks/s | Gain |
| --- | ---: | ---: | ---: |
| Measured panels closed | 2.44 | 8.14 | 3.34× |
| Measured panels active | 2.39 | 7.31 | 3.06× |

Baseline rows 4274–4275 reproduce the earlier finding. They complete 74/72 ticks within their
30-second caps. Initial optimized rows 4276–4277 measure 8.07/7.29 ticks/s. A final repeat,
rows 4281–4282, includes preservation of the exact half-world directional tie convention and
completes all 100 measured ticks. This small final adjustment is covered by the all-pairs and
direction tests; it is not an additional ecological rule. Both final arms finish with 7,016 cells.
The stage samples cover different numbers of physiology updates, so costs are approximate.

| Closed-panel sampled stage | Before ms/tick | Final ms/tick |
| --- | ---: | ---: |
| Fields/footprints | 9.73 | 9.05 |
| Sensing/controller, including interfaces | 71.14 | 14.81 |
| Movement/contact resolution | 212.20 | 22.39 |
| Exchange, including interfaces | 78.17 | 20.83 |
| Physiology | 22.27 | 19.62 |

The final matched benchmark passes the shared material/work account validator. Absolute terminal
residuals are 3.00e-6 material and 4.77e-6 work, within its relative tolerance. Measurements use
the archived v33 chemistry to isolate the optimization. Only `movement.rs`, `interfaces.rs` and
the new contact geometry/test files differ from the exported `fad7fa9` kernel; those files match
current production exactly. No checkpoint adapter or alternate production mode was added.

### Remaining cost

These are the limits at this pass's closeout. The subsequent
[bounded-computation pass](bounded-computation.md) addresses census materialization,
repeated occupied-bin queries and negligible intracellular reaction support.

Current v34 capacities measure 63.34→65.02 ticks/s at 48 fixed cells, 29.80→29.81 at 2,000
fixed cells, and 19.57→19.00 with growth (rows 4278–4280 and 4283–4285). These single short
samples range from +2.7% to −2.9%; they establish no general startup-sized speed improvement.
The material gain occurs in the evolved population with heterogeneous radii and dense contacts.

This is still below the 30 ticks/s goal at roughly 7,000 cells. Closed-panel physical stepping
averages 88.60 ms/tick; the four ordinary census calls add 32.03 ms/tick over the measurement.
The census still materializes and sorts broad six-unit neighborhood lists for dense colonies.
That is the next concrete observation optimization to inspect. The physical remainder includes
reaction/controller work and repeated donor reductions in interface preparation; the stage
profile alone does not identify their individual line costs. No claimed fix for those costs,
the earlier session reload difference, or the oversized mature save follows from this result.

Raw reports and binary provenance are retained in [the evidence directory](evidence/contact-performance/README.md).
Complete local engine exports and benchmark artifacts remain in
`frontend/harness/artifacts/contact-performance-v34/`.

## Validation and delivery

`make ci` passes: 173 Rust unit tests, 17 Rust integration tests, 71 Vitest tests, the Python
producer-contract check, lint/format/type checks, documentation links and Terraform formatting.
The existing 17 lint warnings remain. New tests cover heterogeneous radii, seams, reordered and
coincident cells, exact half-world directional ties, small periodic grids, empty/single inputs,
interface equations and outlier search cost. Existing contact funding, conservation, symmetry,
continuation and borrowed-render tests pass. No browser visual check or long ecological run was
performed, and the user's live session was not touched. The optimization is installed in the
ordinary v34 runtime; this pass did not commit, push or deploy it.
