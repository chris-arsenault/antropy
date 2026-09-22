# Material-supported habitats and chemical renewal

September 20, 2026. Implemented under [the execution plan](plans/archive/MATERIAL-HABITATS-PLAN.md).
Physical checkpoints are v32; the chemical definition and observation package retain their
existing versions. Rust owns the fields and sources; worker rendering still borrows WASM views.

September 22 update: [reservoir simplification](plans/MODEL-SIMPLIFICATION-PLAN.md#m1--single-composition-reservoirs)
replaces the two-mixture v32-v37 source lifecycle with one composition and an actual amount.
It retains evolving refill chemistry, removes lifetime expiry and random renewal coupling,
and stops empty-source motion. The measurements below describe the earlier laws; current
[composed laws](design/chemistry/composed-runtime.md#mobile-resource-reservoirs) own the replacement.

The same simplification's M2 replaces the two-scale attraction below with `K6*A` and
removes cohesion-dependent washout. Local signed repulsion, nonlinear crowding, circle
separation and bounded reservoir signals remain. Binding affects redistribution; external
washout now removes the same fraction from every deposit. The earlier force curves, retention
and timings below are historical evidence, not measurements of v39.

## Changes

All three mechanical consumers—dissolved material, cells and reservoirs—use the same attractive
field: `4*(K6*A-K12*A)`. The two normalized even kernels give compatible material a neighborhood
of attraction and a weaker opposing contribution farther away. Local repulsion and nonlinear
crowding pressure remain. The only added control is attraction amplitude; the second length is
the fixed octave of the existing length. No fixed well, cluster ID or anchor exists.

Local cohesion is `max(A*A*-B²,0)/(1+L)`, where A and B are the shared signed material profiles,
A* is the attractive field and L is combined impedance. Washout is reduced by the same
`1/(1+scale*cohesion)` response already used for impedance. Supporting material can therefore
retain a deposit; removal or conversion of that support releases it. Loss remains finite and
explicitly accounted. Deposits are ordinary chemical material, not a second phase or hidden stock.

Each reservoir now persists a normalized replenishment distribution. It starts from the seed
landscape and evolves through local environmental conversion, including while the reservoir is
empty. Renewal uses that history instead of resetting to the starting chemicals. The distribution
is a boundary condition; it projects no material or force. Refilling books the full incoming mass
and potential. Explicit experimental source zones/epochs can still prescribe their external supply.

Public chemistry now has eight exact actions: flip one of four coordinate bits on either chemical
axis. They belong to the existing finite transformation group, are involutions, connect all 256
identities and preserve D4 covariance as a set. Longer edges use the same distance attenuation
as enzymes. The shared work coefficient determines whether an uphill edge is funded; kinetic
branch normalization does not change work per accepted unit. Field conversion, source processing,
replenishment evolution and the environmental web all use these operators.

Chemical 0 has no privileged live uptake, metabolism, construction, death, washout or renewal rule.
Explicit starting IDs remain in configuration, founder/circuit initialization and initial priming.
Tests, named diagnostic fixtures and atlas/UI examples retain explicit IDs as declared examples.
Construction chemistry and the cellular external-work formula were not changed.

## Bounded evidence

The [retained evidence](evidence/digital-chemistry/material-habitats) contains ordinary World
results, not a certification of evolved cooperation or long-term geography.

| Check | Result |
| --- | --- |
| Default seed 27 through 5,000 ticks | 234 living cells; maximum living generation 29; 493 divisions |
| Whole-world material/work residual at 5,000 | 5.29e-8 / -4.76e-7 |
| Seven-source neighborhood, 3,000 ticks | nearest-neighbor RMS 16.23→11.89; widest separation 33→32.29 |
| Local-attraction control | nearest-neighbor RMS 16.23→16.09; widest separation 33→32.81 |
| Default-source RMS through 5,000 | 14.94→15.65; no long-run dispersion conclusion |
| Default replenishment at 5,000 | mean 98.415% in starting IDs 0/136; all 48 distributions have changed |
| Public-feeding pair | 0.03055 imported/processed; 0.05609 usable work captured; control zero |

The source neighborhood separates into tighter local groups: median all-pairs distance increases
17→24.30 while nearest-neighbor distances decrease. This is local clustering, not retention of
every source in a single cluster. Depletion and refill remain finite; long-run persistence is open.

The public-food fixture selects 114→118 from a zero-tick calculation, without searching simulated
outcomes. An ordinary diagnostic cell recognizes 118, outside its recognition radius from 114,
imports the transformed material and processes it back to 114. Cellular external work is zero in
this probe; the captured energy came from the public conversion. Transport cost 0.00153 is below
the captured 0.05609, but available material also enabled repair costing 0.17348. The enabled cell
died at 150 ticks; the no-conversion control died at 182. This demonstrates accessible recycled food
and a negative whole-cell survival result, not a profitable strategy after all costs.

The older active/identity cellular-feedback fixture also terminates early: 130/48 ticks. These
negative outcomes are retained. No extra seed, larger horizon or founder tuning was used to turn
them into a favorable population result. The ordinary default startup survives independently.

The replenishment change removes forced feedstock resets, but does not instantly replace the
feedstock economy. At 5,000 ticks the distributions have only shifted about 1.6% on average. Its
long-term ecological impact, evolving use of public products and visual motion require observation.

## Operating costs and validation

Identical capacity fixtures use 10 warmup and 100 measured ticks, with census, packed render
preparation and inspection. GPU execution is excluded.

| Population | Baseline ticks/sec | Final ticks/sec | Change |
| --- | --- | --- | --- |
| 48 | 84.32 | 63.78 | -24.4% |
| 2000 | 36.72 | 32.00 | -12.9% |

The added field kernel, spatial loss account and public branches have a real cost. Both fixed
workloads remain above 30 ticks/sec, with limited margin at 2,000. The initial candidate panel
overlapped a startup run; the final panel ran without another task simulation/build. These figures
do not establish mature-world or expanded-map performance. No ecological formula was weakened to
recover the baseline speed. The 5000-tick startup segments took about 31 seconds combined.

CI initially exposed a WASM stack overflow in diagnostic world creation. Compiled public-route
tables now live on the heap; all 16 tests in the five previously failing files pass. Kernel checks
cover group inversion/reachability, all D4 frames, matching public/source chemistry, bounded
funding, no same-update cascade, no isolated self-force, reversible retention, actual local loss
accounts and source renewal after an empty interval/restore. Final `make ci` passed: 156 Rust
unit tests, 17 integration tests and 66 frontend tests, plus the Python producer contract,
formatting, clippy, type checking, documentation and Terraform checks. The 17 existing ESLint
warnings remain.

Ledger 4218/4219 holds the baseline; 4220/4221 public feeding; 4225–4228 neighborhood/cell probes;
4224/4229/4230 the startup segments; 4231/4232 final capacity. Raw checkpoints and binaries are in
`frontend/harness/artifacts/material-habitats-*`. Startup/native ecological evidence preceded the
heap-allocation-only repair; the final capacity and WASM validation use the repaired binary.

No browser session, deployment or long evolutionary campaign was run for this change.

## Subsequent user observation

The [83,980-tick checkpoint review](material-habitats-review.md) records dense differentiated
colonies, broad nonseed imports and continued dependence on original feedstocks in net flow.
It supplements the short implementation checks below without converting their negative
public-food result into a success. The [runtime investigation](session-runtime-review.md)
records the mature-state operating limit and unresolved reload-speed report.
