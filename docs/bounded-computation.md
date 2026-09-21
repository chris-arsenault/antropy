# Bounded mature-world computation

September 21, 2026. Plan `4a713c00-7da8-46ae-94d7-fff7b61d4807`.

## Question and decision

The preceding [contact pass](contact-performance.md) reached 8.14 ticks/s at 6,975
cells. Census construction adds approximately 32 ms/tick; physical stepping still
costs 89 ms/tick. This pass may change numerical resolution and update laws when
they preserve local evolutionary opportunities, material ownership and paid work.
Identical trajectories are not a requirement. Single-thread execution remains the
scope. Illumination ecology and multicore execution remain separate backlog work.

The useful analogy to finite propagation is bounded local influence and response,
not a claim about why physical constants exist. Existing compact recognition,
finite-rate transport and local geographic stencils already provide such bounds.
Additional limits must constrain a specific expensive operation, with a stated
error or response scale. Population caps and arbitrary nearest-neighbor quotas
would remove dense-colony interactions without establishing that bound.

## Registered investigation and verification

- Profile one existing 180k checkpoint workload with the V8 CPU sampler: ten warmup
  and at most 100 measured ticks or 30 seconds per closed/active-panel arm. Determine
  whether tiny refit recompilations or contact reductions dominate the remaining
  physical work. Do not change refit laws on suspicion alone.
- Replace the census's dense cell-neighbor graph with a finite-resolution spatial
  density observation. Derive resolution from its existing six-unit observation
  reach. This observer may shift boundaries near its resolution, but must retain
  periodicity, reject isolated migrants, report each member once and remain unable
  to change simulation state. It is not an interaction rule for cells.
- Select physical work limits after the profile. Record their mechanism and predicted
  consequences here before the comparison. Small heritable target changes must remain
  expressible; no chemical identities or evolutionary branches receive exceptions.
- Compare the same bounded mature workload against the preceding contact results.
  Use the existing isolated v33 source export with the production optimization files;
  the checkpoint predates scalar illumination. No production compatibility adapter.
  Permit one intermediate measurement to decide whether an implementation is useful,
  then one final pair after corrections. Record material/work accounts, population,
  stage costs and model duration. No long ecological campaign or claim of evolved
  equivalence follows from this check.
- Check current v34 release WASM at 48 fixed, 2,000 fixed and 2,000 growing cells:
  ten warmup and 100 measured ticks, 60-second case caps. Use focused opportunity
  tests for any physical rule change and run `make ci` before handoff.

## Selected limits and work elimination

The V8 sample attributes the largest physical self costs to contact construction,
reaction evaluation and exchange. Refitting is not the leading cost; leave its paid
continuous target changes intact. A zero-tick inspection of the 6,975 cells finds
950,811 occupied active reaction edges. At concentration 1e-6, only 581,987 remain,
while unfunded proposed throughput falls from 91.76565175 to 91.76498114 material
units per physiology interval: 38.8% fewer edges and 0.000731% less proposal volume.
There are no subnormal inventory entries. This is a support measurement, not a
prediction of identical accepted flux or long-term ecology.

Use the existing shared concentration resolution (1e-6) for intracellular reaction
participation. A substrate is processed only when `amount > resolution * volume`.
Below that limit it remains stored with unchanged chemical identity, potential and
ownership. Imports and other reactions can accumulate it above the threshold. Small
cells have proportionately smaller absolute thresholds. No enzyme, chemical identity,
mutation distance or population size receives an exception. The limit bounds ignored
standing substrate per identity; it does not bound accumulated trajectory divergence.
Keep transport uptake continuous so scarce nutrients can accumulate instead of being
permanently inaccessible. Test that accumulating above the threshold re-enables a
paid reaction, and verify material/work accounts.

For contacts, look up adjacent occupied bins once per bin pair, then traverse their
compact body lists. Retain every true overlap. Order the much smaller occupied-bin
list; stop sorting all physical contact edges. Exchange reduces requested chemical
support once per receiver before visiting donors. These changes reduce work without
introducing a cap on neighbors, colony density or cell size.
Interface preparation also reduces each donor's stress once per frozen pass, before
applying receiver-specific membrane compatibility. Zero-capacity transport skips its
recognition work.

The census bins have widths at most 1.5 units (one quarter of the six-unit reach).
Density connectivity uses bin-center distance and a three-cell core minimum. Each
occupied bin has a fixed local stencil independent of how many cells overlap there.
Membership storage is linear in population; neighborhood work depends on occupied
bins, with ordered-bin construction adding a logarithmic factor. Pairwise distance
classification can shift by at most the bin diagonal, about 2.12 units, near the
six-unit boundary. This is explicitly an approximate display partition; it must not
be interpreted as proof of physical isolation or a controller signal.

## Results

The final matched 180k workload runs at **12.77 ticks/s** with panels closed and
**10.87 ticks/s** with measured panels active, versus 8.14 and 7.31 after the preceding
contact pass: gains of 57% and 49%. The original mature baseline was 2.44/2.39.
The physical clock stays at 0.2 seconds/tick: final throughput is 2.55/2.17 model
seconds per wall second. No performance gain comes from advancing less model time.

| Closed-panel cost, ms per measured tick | Previous pass | Final |
| --- | ---: | ---: |
| Whole physical step, average | 88.60 | 71.74 |
| Census, amortized at four calls per 100 ticks | 32.03 | 4.77 |
| Movement, sampled | 22.39 | 12.33 |
| Sensing/controller, sampled | 14.81 | 12.25 |
| Exchange, sampled | 20.83 | 18.30 |
| Physiology, sampled | 19.62 | 17.42 |

Stage samples are approximate; aggregate timings include unprofiled ticks. The
intermediate implementation measured 12.80/10.88 ticks/s. The final shared stress
reduction has no separately established speed benefit at this workload; its result
is within sampling variation. Census and occupied-bin contact work account for most
of the measured gain. The reaction threshold's independent runtime benefit is not
isolated by this combined comparison.

Over the same 100 measured ticks, final accepted reaction material differs by −0.013%,
captured energy by −0.0068%, imports by −0.103%, direct contact imports by −0.197%,
construction by −0.672%, and traveled distance by −0.015% from the preceding pass.
The endpoint has 7,014 cells versus 7,016. Both panel arms close their accounts:
absolute residuals are 3.00e-6 material and 4.76e-6 work, within the existing relative
tolerance. These short continuations establish operation and cost, not unchanged
long-term ecology or evolved exploitation of every opportunity.

Current v34 capacity fixtures measure 65.02→64.11 ticks/s at 48 fixed cells,
29.81→29.48 at 2,000 fixed cells and 19.00→18.36 with growth. These short samples are
1.4%, 1.1% and 3.4% slower respectively; this pass establishes a mature dense-world
gain, not a general startup-sized improvement. There is no evidence here that all
scales got faster. The **30 ticks/s mature-world goal remains unmet**. Exchange,
physiology and sensing now account for most physical cost; removing the remaining
census overhead alone cannot achieve the goal. Dense true contacts still require
pair work; this implementation does not impose a universal bound on physical neighbor
count or replace the contact law with a fixed-resolution interaction medium.

`make ci` passes: 176 Rust unit tests, 17 integration tests, 71 Vitest tests, the
Python producer-contract check, lint/type/format/docs and Terraform checks. The 17
existing lint warnings remain. Focused tests establish threshold recovery at three
body scales, material/work closure, overlap completeness, periodic grouping, unique
membership and bounded dense census work. No browser visual review, long ecological
run, commit, push or deployment was performed in this pass.

## Evidence and provenance

[Raw evidence](evidence/bounded-computation/README.md) retains the matched reports,
zero-tick concentration-support inspection and current-version capacities. Ledger
4286–4287 is the CPU-profiled baseline, 4288–4289 the intermediate comparison,
4290–4291 the final comparison, and 4292–4294 the current capacities. Local CPU samples,
binary snapshots and full reports remain under
`frontend/harness/artifacts/bounded-computation/`.

The mature comparison uses the existing isolated `fad7fa9` source export with the
production `movement.rs`, `interfaces.rs`, `contact_geometry.rs`,
`contact_geometry_tests.rs`, `census.rs`, `census_groups.rs`, `metabolism.rs`,
`transport.rs` and `contact_exchange.rs` files. It retains the checkpoint's v33
illumination; current-v34 capacity runs use the ordinary production build. This is
benchmark isolation, not a second production runtime or restore adapter. Earlier
pass reports retain their earlier binary hashes; the reusable isolated source
directory now contains this pass's changes.
