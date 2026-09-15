# Numerical admissibility and operating budget

## Current design contract

Revised September 15, 2026. [Computable chemistry](../../design/chemistry/computational-foundation.md)
and [ADR 0022](../../adr/0022-computable-chemistry.md) govern formula selection and acceptance.

Choose a computable discrete update, accounting, bounds, precision and schedule together.
Conservation and nonnegative owners must follow from verified operators/allocation; any energy
or stability property claimed needs its own argument and bounded checks. Reference comparisons
are against the selected artificial rules, not mandatory reproduction of M0 thermodynamics.
Full-field logarithms, exponential face biases, f64 proposal arrays and repeated global F tests
are revisable numerical choices. Define the protection replacing each before retiring it.

Retain release-WASM measurements before integration and the complete 30 ticks/s minimum with
reported model-time throughput, all 256 channels, 48/2,000 varied cells and funded growth. At the
comparison dt=0.2 this requires 6 model seconds per wall second. The 320×240, h=2 fixture and
16 ms spatial allocation provide a comparison and total-budget discipline, not inviolable
physical constants. Resolution/scheduling changes require matched-time causal checks and an
explicit budget; reducing active work or model time cannot manufacture a pass. Immutable Rust
ownership and borrowed worker rendering remain requirements. The superseded spatial subset
missed its allocation; the composed replacement is measured independently in validation.

## Selected computable contract — revision 4

The new arithmetic lives beside existing owners in a composed-kernel module. It accepts Rust
Field/Cell owners and explicit installed operator inputs. Ordinary World stepping remains
unchanged through M1; tests and the existing scalar diagnostic boundary exercise these kernels.
Old spatial candidates remain only until their live consumers can be reconciled in M2.

```text
resolved 256-ID properties -> contiguous static coefficient rows
field amounts + actual cell material -> H[2], resistance and stress
shared neighboring differences -> two shared face coefficients
species dot products + diffusion -> one destination-row conservative stencil
local cloud sampling -> funded receptor/transport/processing requests
shared donor/work allocation -> paid conversion/body events -> refreshed dependent fields
```

Selected geography is 320×240 with h=4 (4,800 nodes; 1,228,800 amounts), dt=0.2.
The h=2 case remains the recorded comparison. Resolution changes preserve extent and concentration,
not the old per-node amount; multiply fixture amounts by h²/4 before starting its books.
Use f32 bulk amounts and inexpensive contiguous vector operations; reductions/accounts that
establish conservation use f64. One reusable f32 next-field buffer and O(N) shared coefficients
serve field transport. Local exchange owns four f64[P][256] arrays (32PS bytes) for sampled
mixtures, import coefficients, exports and accepted donor concentrations. One sparse CSR W
owns O(N+footprint entries) geometry, used for both sampling and transposed delivery. Donor
demand/availability and commitment use reusable 256-channel stack rows; the former dense f64
donor grid and touched-species list are removed. O(256) static rows and bounded per-slot reaction
scratch complete these arithmetic owners. This is not a claim of O(N) total memory.
The analytical outgoing-rate bound determines substeps; at reference values one substep fits.
Nonnegative state and local event accounts replace iterative full-world energy acceptance.
Finite-state validation and signed rounding audits remain necessary; no prospective numerical
energy becomes spendable work. Require measured errors within the derived floating-point bound.

Refresh field projections before each transport substep. Cell material projections refresh after
inventory/body/membrane changes; movement changes only geographic footprints. Field transport and motion read
the same frozen medium for that explicit step; motion does not trigger a second full refresh.
Apply shared directional coefficients through the three static diffusion/response rows. Each
destination chemical row loads four geographic neighbors and writes one result; there are no
per-species velocity arrays or repeated face writes. Fuse washout and finite/nonnegative checks
into that stencil, then refresh amounts' dependent reductions once. This changes floating-point
operation order and uses f32 decay, with the residual against f64 washout booked as numerical error.
At each 0.8 model-second physiology event, rebuild moved clouds, sample local mixtures once,
allocate exchange, evaluate exposure/receptors and processing, then paid body/installed events.
Freeze owners within allocation stages; exports/products enter the next stage. The shared sampled
mixture is the physiology stage's input, not a claim that it incorporates that stage's exports.
No active operation may use stale installed coefficients. M1 implements one canonical compiler
with exact definition/parameter/revision identity; paid actual changes rebuild through that owner. M2 integrates the selected
ordering with persisted model clocks. A nominal tick advances its full dt even when substepped.
Physiology integrates all elapsed time; its pending remainder is state, not discarded model time.
Field/motion remain at 0.2. The .8 physiology schedule changes operator splitting; short equal-time
processing checks quantify its difference, and coupled live refinement remains an M2–M4 gate.

Selected budget: 12 ms spatial, 10 ms cellular arithmetic and changed-installed work,
11.3 ms reserved for controller/lifecycle orchestration, observations, rendering and history.
These allocations total 33.3 ms; aim for headroom. They are not claims of browser acceptance.
M0 measures the full arithmetic composition at 48/2,000 varied installed sets and dense chemistry,
10 warmup + 100 measured ticks, 60-second cap each. Report cold and changed-state costs, full
source/binary identity, mean/worst windows, memory and actual model time. See the root expansion
for the bounded diffusion baseline and evidence-triggered rerun policy. Failed cost selection
returns to the rules before M1; no reduction of active chemistry/cells buys acceptance.

Finite reach and bounded accumulated material do not establish geometric accuracy or ecology.
Compare short equal-model-time drift/diffusion and cell-response cases at h and h/2, dt and dt/2;
report retained directions/delivery plus quantitative error. Set tolerances from the designed
operators and actual precision. Full browser/GPU, growth and retained-history testing remains M7.

M1 reruns that unchanged composition through the canonical compiler: 8.680/18.479 ms mean
and 8.757/18.681 ms worst 20-tick windows at 48/2,000 cells. Setup includes validation and exact
keys; recurring paid changes include rebuilding. Material/energy accounts, operations and final
states exactly match M0's recorded pair. Individual physiology ticks reach 44.18 ms at 2,000;
the gate measures sustained 20-tick throughput, not a per-frame latency promise.
See [M1 evidence](validation.md#reopened-m1-canonical-execution-evidence) for costs and exclusions.

Those figures describe the preceding canonical implementation. The subsequent
[composition correction](validation.md#manifold-composition-correction) implements the row
stencil, CSR allocation, compiled engagement, material reuse and dependency-local compiler
refresh described above. Its measured cost remains distinct from ordinary-world performance.

## Historical M0 selection — reference only

Everything below records the previous formula selection and its original verification scope.
Imperatives and milestone instructions in this section are superseded as work orders. The
record remains available for independent comparison and reuse; passing its tests does not
approve these equations or their computational cost for the replacement system.

M0 selects conservative finite volumes with exponentially fitted face fluxes, explicit bounded
event updates and full free-energy acceptance. This is an initial discretization family with
testable limits, not a claim that the full nonlinear browser workload meets its performance gate.
The existing diffusion-only CFL and slower `World::field_elapsed` physical updates do not establish
correctness for field-coupled cells.

### Positivity, work and nonlinear bounds

For frozen excess potentials, define directed outgoing coefficients
`a_i->j,s=(face_length/center_distance) D_face B((psi_j-psi_i)/T)/A_i`.
An explicit field step is a nonnegative linear map if
`dt sum_neighbors a_i->j,s <= 1` for every donor. Select safety bound **0.5** initially.
This bound includes diffusion and directed drift. For ideal uniform square cells it becomes
`dt<=0.5 h²/(4 Dmax)`; with Dmax=0.5 and h=2 this permits dt<=1 t. Large potential jumps
increase a and reduce the permitted step even when D is unchanged.

Nonlinear crowding and interaction invalidate a frozen-coefficient CFL as a complete proof.
For positive amounts, the chemical Hessian contains ideal diagonal `T/n`, crowding cross terms
`2 gamma rho/A` and the symmetric kernel matrix. On a segment with n>=n_min>0, a conservative
row-sum bound is
`L_F <= max_i [T/n_min + 2 gamma rho_max S/A + sum_j,s |q_s G K_ij q_t|]`
in amount-coordinate units. For a proposed direction v with grad F·v<0, the descent lemma gives
`dt <= -2 grad F·v/(L_F ||v||²)` as a sufficient energy bound. This illustrates why crowding
adds stiffness beyond diffusion; do not pretend n_min is a physical concentration cutoff.

Select the directly evaluated acceptance rule: after conservative shared allocation, compute
the **full** tentative state and require nonnegative owners, valid capacitor range and
`F_new<=F_old` for each closed passive/reaction batch. Paid events include their W debit in F.
Prescribed boundary events use their declared boundary books instead. Start within the outgoing
coefficient and donor/work bounds, halve a rejected physical substep and recompute rates from
the unchanged initial state. Accept exact zero without logs; at an empty receiver F uses 0 log 0,
and the finite influx uses the fitted expression. No donor concentration is rounded up to enable
reaction. This finite-event test also covers mixed-derivative/volume effects missed by a scalar CFL.

For reactions and membrane exchange, allocate signed net extents using frozen owners, then bound
each substrate's summed demand, each charge store and each storage headroom. Scale each event's
whole stoichiometric vector by the minimum affected-owner fraction. Scaling nonnegative channel
progress preserves its initial thermodynamic direction; the final F test handles overshoot and
coupling between channels. Simultaneous products/exports become available only on the next stage.
The work bound uses exact capacitor changes, not cached per-unit energy. Do not scale forward and
reverse gross rates independently; that would change equilibrium under constraints.

For motion require center travel <=min(h/4,r/4), rotation-induced rim travel <=r/4 and the
full paid-energy inequality. Soft contacts add curvature k_contact, so a single-coordinate
overdamped explicit update requires dt<=2 zeta/k_contact; use half that limit initially and the
coupled energy check. Growth/remodeling/dissolution obey their rate and work limits and pass the
same full-state check. The norm of a tentative field change bounds the nonlinear refresh region;
it is never permission to evaluate a dependent force with stale source contributions.

Allow at most 64 accepted physical substeps per nominal tick and at most 20 trial halvings per
substep. Exceeding either is an explicit numerical operating failure with the last valid state,
not permission to advance the displayed clock, drop a field channel or reduce population.
Record trials and accepted substeps. They are cost measurements, not model parameters.

### Ordering and clocks

Pin nominal tick dt=0.2 t for the reference workload. Controller observation/private-learning
interval remains 0.8 t initially; held actions are allowed between observations. On each physical
substep: source boundary event; refresh; field flux; refresh; local sensing when due; motor/contact
motion; refresh changed interfaces; injury; simultaneous membrane exchange; refresh; simultaneous
reactions; refresh; paid upkeep/repair/growth/remodel; refresh; local division/dissolution; refresh;
uniform washout boundary event. Reaction and physical rates integrate the elapsed substep, not the
controller interval. A tick completes only after its full 0.2 model seconds. Persist exact clocks,
installed state, bath/boundary books and any continuation-affecting reductions.

This first-order operator split has O(dt) global temporal error. Current ordering is revisable
only against the registered small refinement tests, never to claim speed by doing less model time.
Uniform washout is a separate exact exponential event. It no longer commutes with nonlinear field
transport or interface response, so the current linear commutation optimization retires.

### Precision and rounding

Keep bulk field amounts f32; compute potentials, charge, energy, reductions and proposed event
amounts in f64. Preserve deterministic reduction order in scalar/SIMD implementations. Use f64
trial state/deltas for energetic checks before committing f32 amounts. Each commit records signed
`R_M=sum(n_exact-n_stored)` and exact energetic/free-energy rounding deltas evaluated with the
same functional. Linear `sum u_s error_s` alone is insufficient once fields interact.

For normal f32 values the single-store error is bounded by `2^-24 |n_exact|`; include half an
f32 subnormal unit for subnormal values. Ledger accumulation uses compensated f64 sums. For a
reviewed finite batch, compare residual to 32 f64 ulps times the sum of absolute book terms,
plus the explicitly measured representation error. At O(1) values the M0 algebra tests use
1e−14 to 2e−14; derivative checks use their separate truncation bounds. If a positive numerical
F error occurs, book it as numerical input and do not credit it as usable work. Monitor cumulative
numerical input independently of physical work; a large ratio fails fidelity even if books close.
Tiny or already-rounded-to-identical transfers may be deferred as numerical no-ops, with no clock
or mass subsidy. No global epsilon is a physical extinction/removal threshold.

### Memory and work estimates

Let N be field nodes, S=256, k=2, P active cells, Rm inactive material remnants and H ancestry rows.
At 320×240 with h=2, N=19,200 and NS=4,915,200. These are shape calculations, not measurements.

| Allocation/work | Formula | Reference estimate |
| --- | --- | --- |
| Persistent f32 amounts | 4 NS bytes | 19,660,800 bytes (18.75 MiB) |
| f32 next/commit buffer | 4 NS | Another 18.75 MiB |
| f64 proposal/accumulated delta buffer, reused across stages | 8 NS | 37.5 MiB |
| Profiles, convolution output and separable scratch | 3×8kN | 921,600 bytes |
| Density, resistance, stress, potential/energy scalar reductions | up to 8×8N | 1,228,800 bytes |
| Two oriented faces per node | 2 NS species-face evaluations | 9,830,400 per field pass |
| Chemical profile projections | k NS multiply-adds, plus scalar reductions | 9,830,400 profile multiply-adds |
| Separable convolution, support width w≈2l/h+1 | 2 k N w multiply-adds | 384,000 for w=5 |
| Internal inventories, dense worst case | 8 S(P+Rm) | 4,096,000 bytes at P=2,000, Rm=0 |
| Private state and traces | 4(24+576)P | 4,800,000 bytes at P=2,000 |
| Distinct controller chromosomes | 4×1761×genomes, plus small plasticity/body loci | 14,088,000 bytes for 2,000 haploid genomes |
| Enzyme edges | <=4 slots×36 substrates×4 products=576 per installed set | Up to 1,152,000 at 2,000 unique sets |
| Four transporter/receptor supports | <=144 each per installed set | 288,000 each at 2,000 unique sets |
| Compact parentage | <=56 H bytes at current representation | <=112,000,000 bytes at H=2,000,000 |

The 36-entry support bound applies to R=3 only. Edge size and installed-cache sharing must be
measured after M1; at 32–48 bytes per edge, 2,000 fully distinct sets cost 36.9–55.3 MB before
allocator overhead. Remnant records need material/interface state but no RNN or catalytic cache.
Count Rm separately and stop explicitly on a declared physical-record memory limit; do not silently
remove stubborn material to fit the living-population count.

The planned field buffers alone are about 77 MiB. A full field stage needs projections, convolution,
face flux, trial free-energy evaluation and commit/rounding reductions. The nominal ideal case fits
one substep, but nonlinear retries multiply those passes. Bernoulli/activity evaluation adds a
transcendental throughput risk to memory bandwidth; rank-two projection does not remove it. Budget
at least 4–6 reads/writes of bulk fields per physical stage, approximately 80–160 MB depending on
f64 trial traffic. At 30 nominal ticks/s this is several GB/s before cells/GPU. SIMD and cache reuse
must preserve the flux/equilibrium contract; M2/M7 measure actual bandwidth and arithmetic cost.

Render stays in the owning worker. Current packed cell/marker projection uses 48 bytes per record;
field display projections use bounded texture channels, not 256 chemical textures in React. Budget
GPU traffic as `fps*(4 C N +48(P+markers))` for C f32 display channels, separately from simulation
traffic. For C=20 and P=2,000 this is 1,632,000 bytes/frame, about 98 MB/s at 60 fps. Borrowed views
remove intermediate CPU copies, not GPU transfers. Main-thread observations remain revisioned and
bounded; cold save copies are separate, admitted by the existing four-request serialized queue.
Budget recovery peak as live+scratch+snapshot+compressed snapshot+restoring state; do not infer
peak usage from checkpoint size or clean-up success alone.

### Existing evidence and later acceptance

Read the retained [ownership capacity report](../../evidence/digital-chemistry/ownership-capacity.json)
and current capacity/performance source. Rows 3681–3683 use WASM digest
`0b3e7aed763f661dcb165f98fed3e007b031c291762e445859b6366375edb409`, the old physical model and
48/2,000/2,000-growth fixtures. They measured 218.54/61.10/33.82 ticks/s with packed render
preparation and inspection. They exclude actual GPU work. Their final model time is 22 t after
10 warmup plus 100 measured ticks at dt=0.2. They are historical timing-scope evidence, **not a
matching baseline** for these selected laws, changed geometry, physical refresh or remnant state.
No matching integrated-chemistry binary/configuration exists in M0. No capacity run was performed.

Register the same fixture counts, all 256 channels, actual learning and funded births, 10 warmup
and 100 measured ticks, 60-second wall cap per case, exact binary/configuration/checkpoints, mean
and minimum 20-tick window rate, plus each physical stage/substep count. Add actual worker/GPU/
observation timing in M6/M7. At least 30 ticks/s means at least **6 model seconds per wall second**
at dt=0.2; both are required. Startup remains 48 founders/two colonies; 2,000-growth remains an
active reproductive load, not a count silently reduced by extinction. Define and report actual
active-cell trajectory. Snapshot/restore timing and exact continuation remain separate gates.

### M0 verification

Three `numerics::` tests cover conservative positive nonlinear two-compartment exchange with
energy descent, rejection of an excessive step, first-order refinement against an independent
exponential solution, and f32 rounding at 1e−24, 1 and 1e6 scales. They also check the reference
field shape and 30 ticks/s to model-time conversion. These probes do not measure browser throughput.
