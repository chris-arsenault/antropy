# Rebuild Antropy as composed artificial chemistry

> Historical execution record, archived September20, 2026. Version-specific instructions and
> pending gates below retain their original meaning; they are not an active work queue.
> See [plan dispositions](../README.md) and [current design](../../design/README.md).

Historical completed rebuild. Current mathematical work belongs to the single
[canonical math plan](MATHEMATICAL-SYMMETRY-PLAN.md#canonical-work-order).
The closeout and implementation records below retain their original scope and evidence;
they are not another active execution sequence.

September 15, 2026. The user directed deleting the numerical implementations before
rebuilding because repeated attempts to restart became patches to the existing system.
This instruction supersedes the old M0–M8 integration work order. The user subsequently
authorized designing and implementing the complete replacement. The archived plans
retain the conversation's requirements; canceling their execution order did not cancel
those requirements. Implementation is authorized through the milestones below.

## Replacement contract and current work

### Closeout — September 15

The user reports: “I'm letting a long run happen but the initial visual review passes”.
This completes the initial motion/legibility handoff at restored mesh2. M0–M3 are complete.
The user's long run is ongoing ecological observation; its outcome and long-duration
operating limits remain unverified and are not additional implementation gates.

### Thresholded-work correction — September 15

The user explicitly requests restoring processing thresholds after the resolution audit.
This supersedes the implementation's no-cutoff choice: empty regions and infinitesimal
diffusion tails must not cost a full 256-species update. Expansion
`9fe57b2e-5067-4222-951f-e40360c4654f` is under M3 capacity. No new execution model,
thermodynamic law, worker boundary, reduced cadence or smaller population is authorized.

1. **Implement active work.** `field.rs`, a derived activity index and vector kernels
   track four-species SIMD groups per geographic node. Iterate occupied groups and a
   one-node periodic halo, refreshing only their reductions. Cut off extracellular
   concentrations below `1e-24` after a substep, booking all lost material/reference value
   in existing numerical error accounts. Species identity never affects the cutoff;
   intracellular material remains funded and retained. Dense amounts stay owned by Rust
   for existing borrowed renderer/checkpoint consumers. Rebuild activity from amounts on
   restore; order reductions canonically so checkpoint continuation is exact.
   Verify dense equivalence above the cutoff, periodic halo delivery, disappearance and
   reactivation, aggregate truncation bounds, conservation and restored continuation.
2. **Validate full resolution and scaling** [depends on #1]. Restore default spacing 2
   (160×120). Retain the six saved h4/h2 capacity inputs from ledger3870–3875, 10 warmup
   plus100 measured ticks each, 60-second cap. All-channel saturation remains a distinct
   worst case; thresholds must not be raised to make it sparse. Add a bounded spatial
   scaling probe using the same localized material in 160×120, 320×240 and640×480 worlds
   at h2: field work counters plus ordinary World/observer timing, 10 warmup and100 measured ticks,
   no mutation campaign. Measure default seed27 for600ticks with existing instrumentation.
   Compare against the captured pre-change WASM. Register/check truncation and physical
   differences; run `make ci`. No server or browser simulation is started.

This corrects processing cost, not memory allocation: dense field storage and full-image
GPU preparation still depend on grid size. The earlier `1e-24` proposal provides a
conservative starting numerical resolution, not evidence of this implementation's speed.
Acceptance requires real sparse-work savings, correct accounting/continuation, restored
resolution and honest saturated-load limits. The200ticks/s target remains a target.

**Completed evidence:** 69 Rust and54 Vitest checks cover the final correction. Ledger3896–3903 measures
identical saved h2 states: default600-tick throughput61.66→372.34ticks/s; localized
320×24061.41→1316.12 and640×48017.69→679.53. The latter two have identical field
work counts despite4× geography. All restores/continuations match; default summaries
are identical. Ledger3890–3895 preserves all six original dense endpoints byte-for-byte,
but h2 saturated growth is23.40ticks/s (25.29 before); the index adds overhead when
nothing can be skipped. Saturated growth remains below30ticks/s, an accepted operating limit.
The subsequent browser checks and initial human visual review are complete.
Current laws, error bounds and reports are in
[rebuild results](../../design/chemistry/rebuild-results.md#september15-correction-active-chemistry-and-restored-spatial-resolution).
The correction and M3's browser/human handoff are complete.

Root plan `878094ce-a296-4838-b365-24c2e5566d4d` is complete. M0 selected the laws; M1
implemented the new production World and v13 checkpoint. M2's bounded mechanism evidence
and M3's operating performance, recovery and accepted handoff are recorded.
No additional approval is needed for numerical choices.
The removal record later in this file describes the starting tree, not a prohibition on
writing the new core. Reusing an interface name is permitted; restoring the deleted
implementation or rebuilding its diagnostic-only integration sequence is not.

### Design evidence and decisions

Read sources: the original chemistry proposal and migration appendix, computational
foundation/ADR 0022, principles, bacterial/funded-body/controller contracts, installed
machinery findings, the archived integrated plan, and previous reliability/cost evidence.
Current consumers reviewed include Cell/Genotype, Config, source release, World validation,
scalar ABI, commands, snapshots, capacity and observation preparation.

Retrieved user turn 158241668 in session 01a09995-751c-7013-ae06-0abc4cd32c7e calls for
deeply composed manifold functions and matrix operations. Turn 184770467 objects to
losing performance previously described as over 200 ticks/s. The requirements are a
200 ticks/s engineering target and a complete-runtime minimum of 30 ticks/s, at retained
model time. These are targets to measure, not a claim that historical timings used the
same workload. Report averages, windows and individual slow ticks separately.

The simulation defines artificial transport and material/work rules. It has no temperature,
entropy functional, capacitor, detailed-balance requirement, full-world energy acceptance
iteration or thermodynamic reference solver. Chemical reference values price conversion
and bound spendable work. Spatial profiles are constitutive movement signals, with no
stored interaction energy and no route to harvesting passive displacement as usable work.
This makes their accounting meaning explicit rather than silently omitting a reservoir.

The 256 discrete IDs, smooth reflected chemical manifold, finite engagement, bounded
unary product maps, actual funded stocks, local controller and immutable sharing remain.
Retain the validated chemistry generator and conservative product-coordinate utilities.
Chemical role labels never drive mechanics. Keep independent chemical potential,
diffusion, impedance and stress properties; do not collapse them into one attribute.

### Composed update and state ownership

Let N be geographic mesh nodes, P living cells and S=256 chemical IDs. Rust owns:

| Owner | Persistent meaning | Computation |
| --- | --- | --- |
| Field C[N,S] | f32 material amounts, explicit rounding accounts | Contiguous chemical vectors and conservative geographic redistribution |
| Cell X[P,S], B[P,15], work[P] | Internal material, actual built stocks and spendable work | Frozen-donor allocation, paid transformations and material events |
| Definition rows[S,k] | Validated immutable property coefficients | Shared mixture reductions and short response products |
| Installed machinery[P] | Actual continuous coordinates plus revision, distinct from immutable target genome | Compile only changed inputs; share immutable operators; birth inherits actual installation |
| W[P,N] | Derived normalized finite body footprints | One geographic sampling/deposition operator, rebuilt after motion or extent change |
| Shared signals[N,k] | Material-derived mixture signals | Chemical projections plus W-transposed body contributions; shared neighbor differences |
| Controller and ancestry | Private learning/state and immutable genetic/parent records | Existing controller interface and bounded historical ownership |

Use 320×240 geography with h=4 as the first engineering selection (4,800 nodes,
1,228,800 chemical values; 4.69 MiB per f32 field). Validate h4 against h2 on matched
physical initial data and model time before accepting it. All species, founders and
resource extent remain. A different mesh is not a species cutoff or background grant.
The initial schedule retains dt=.2 and physiology=.8; integrate full elapsed time.
Choose field scheduling against measured delivery/motion sensitivity, never by changing
the meaning of one model second. Persist scheduler remainder and every stateful reduction
needed for exact continuation; reproducible derived coefficients rebuild at restore.

1. Advance finite source owners and boundary accounting. Sources remain demand-independent.
2. Form H=C times property rows plus W-transposed actual-body response. Differences of
   H supply shared directional coefficients. Compose each species' diffusion and drift
   through its short response row; apply a conservative donor-bounded update. Nonlinear
   bounding is on shared coefficients, not exponential work per species/face.
3. Sample local chemistry through W and body-relative receptor samples. Each funded receptor
   reports tonic, temporal, forward and lateral readings. RNN actions use the existing
   39-input/24-recurrent/nine-output boundary. No chemical-property table or geographic
   direction enters the controller. Hold efforts between paid inference updates.
4. Combine bounded passive response with paid swimming/turning and local exclusion. An
   isolated cell's own deposited profile has zero net self response. Body mass/extent,
   membrane and inventory affect response; impedance affects both cell and chemical motion.
   Contacts provide local observations; contact resolution cannot credit usable work.
5. Build finite transporter requests from installed kernels, current mixtures, funded
   stocks, damage and signed RNN effort. Decode existing bounded action storage so 0 is
   export, .5 is hold and 1 is import. Allocate all requests against frozen local donors,
   pre-transfer storage and work. W and its transpose gather demand and accepted material;
   each geographic donor is allocated/committed once. Exports cannot fund same-stage imports.
6. Enzymes use compiled recognition and conservative reflected product maps. Slot occupancy
   includes substrate and product feedback via a compiled pullback. Capacity is bounded by
   installed stock, elapsed time and occupancy. Transformation distance reduces throughput
   by a shared, explicitly priced rule. Allocate common substrates and work before committing
   products; products cannot cascade by slot iteration order. No enzyme is chosen by an
   optimizer according to profitability.
7. Pay maintenance, internal/external stress repair, growth and gradual refitting. Any
   internal species can fund generic biomass, selected proportionally from inventory.
   Installed coordinates move toward targets only as work is paid on actual affected stock;
   unchanged operators are retained. A nearby target change cannot destroy the old capability
   or install a complete replacement for free. More machinery costs material, volume and upkeep.
8. Resolve death, optional typed transfer and local funded reproduction. Birth splits actual
   stocks, inventory, post-cost work, damage and installed machinery; only genetic instructions
   mutate/assimilate. Preserve fission/budding and supported genetic policies. Empty resources
   exhaust; no reseeding or centralized parent selection. Record complete ancestry.
9. Publish only through existing scalar stepping, borrowed worker rendering and bounded
   revisioned observations. Checkpoints are explicit cold operations with a new physical
   version; incompatible prior saves fail. No old-save adapter or second economy.

Material account: sources + field + cell inventory + generic body, with explicit external
input, washout and signed rounding. Work account: reference material value + usable work;
conversion captures a fraction of a downhill difference and charges more for the return.
Assembly pays overhead plus any reference-value increase; excess input value dissipates.
Repair exchanges actual replacement material; death returns inventory and generic body
locally. Motors, learning, transport and refitting consume work. A restored material/body
cycle cannot gain spendable work. These local identities replace global thermodynamic tests.

### Cost model and verification decisions

The dominant general workload is O(N*S) field traversal plus O(P*S*footprint) local
sampling and bounded fixed-slot work. Budget actual passes, allocations and refreshes:
one retained field double buffer, shared small signal arrays, reusable local-exchange
scratch and immutable compiled installed kernels. No N*S velocity arrays, repeated
definition serialization, per-product occupancy reconstruction or per-tick history scan.
Cells sharing installed parameters may share coefficients; live stock and work never do.

Target <=5 ms per complete headless tick at 2,000 varied cells, including amortized
observation/render preparation, seeking 200 ticks/s. Measure the growth case separately
and require >=30 ticks/s complete browser operation. Report both core and presentation
cost, maxima, model seconds/wall second, active cells/chemistry and source/binary identity.
Do not turn an isolated arithmetic allocation into completion. A failed cost result returns
to the actual operations/data shapes; it does not authorize workload dilution or a new
thermodynamic solver. Browser acceptance and human motion judgment remain distinct.

Before timing: derive local supply, processing, upkeep, assembly, repair and travel budgets
from these same operators. At default newborn B=(1,.08,.08,4*.01,4*.04,4*.04), upkeep
under retained initial coefficients is .0126 work/model-second. Two import slots supply
at most .2 material/model-second before occupancy, shared delivery and funding. At a
reference-value drop of 4, .8 efficiency needs .00394 converted material/model-second
to cover upkeep alone; growth, movement and repair raise the required rate. These are
conditional bounds, not evidence that the controller expresses them or local supply exists.
Determine actual source mixture/concentration and product-map return in the zero-tick
economy report, then use that prediction to choose the bounded biological probe.

First production capacity registration: seed101, 48/2,000/2,000-growth, all256 channels,
10 warmup +100 measured ticks, 60s/case, saved initial/final states and existing ledger.
Retain varied genomes, learning and actual births in growth. No reset/replenishment loop
inside the replacement benchmark. Cold compilation/save/restore are separately measured.
Other checks: deterministic conservation/donor tests, self/paired response, body-relative
sensing, paid mutation expression, supported continuation and h/dt sensitivity. A supplied
single-cell probe and empty-source control are capped at600 ticks/30s each; inspect the
budget and first response before population assays. Register any follow-up before execution.

### Milestones and acceptance

- **M0 — Select the complete update and cost model.** Recover the design conversation,
  derive owners/accounts/operation and resource budgets, record initial choices and tests.
  Source review establishes design completeness; no standalone arithmetic runtime is built.
- **M1 — Implement the complete production world.** New field, local delivery, compiled
  machinery, installed state, control, lifecycle, accounting and exact continuation work
  through World::step. Resolve affected consumers as needed to compile and execute it.
  Independent invariant tests and the production capacity registration establish acceptance.
- **M2 — Reconcile consumers and establish opportunities.** Complete semantic updates to
  settings/atlas/inspection/reports, analytical economy and the reusable assay harness.
  Bounded probes establish supplied reproduction, exhausted control, inherited continuity
  and conditional substrate/stress/barrier/cross-feeding/emission/corpse opportunities;
  preserve failed predictions. No evolved community or long campaign is required.
- **M3 — Verify operating performance and handoff.** Full CI/build, production worker/GPU
  and accumulated-state recovery checks on the existing server, exact schema/ownership,
  docs and measured limits. Human motion/legibility remains the user's final judgment
  on the usable implementation; automated counters cannot supply it.

### M0 execution

Expansion `8b980b91-5067-453a-95e2-1eec7229db0f` under root phase1.
Step1 reads design sources and producer/consumer bodies, recovers the performance and
compositional direction, and derives the above operators/accounts. Step2 records this
contract and bounded registrations in the existing working document and reviews it
against retained requirements. No numerical implementation is accepted in this phase.
The baseline `make ci` failure is the deliberate missing-core state from the removal.

## M1 implementation and verification

Current implementation law: [composed runtime](../../design/chemistry/composed-runtime.md).
Native and WASM builds succeed. Sixty-four Rust checks pass, covering preserved
controller/ancestry/ownership boundaries and new composed invariants. These results do
not establish browser performance or human motion acceptance. Full CI passes64 Rust
and54 Vitest checks; earlier59-test counts describe earlier binaries.

Capacity cost sub-plan `c8eeaecf-4914-4b30-b7ef-bde36e0147ae` branches from M1 step3.
The first full registration, ledger3809–3811, measured 253/23.3/25.8 ticks/s for
48/2,000/2,000-growth. Concurrent Vitest makes those wall timings provisional; restore
and continuation matched in all cases. The isolated stage sample identified exchange
(7.4 ms), physiology (4.0 ms), control/sensing (3.2 ms), field (2.4 ms) and movement
(1.1 ms) as mean per-tick costs. This is a failure of the complete cost target.

The cost branch composes receptor sample rows before recognition, gathers local mixtures
in contiguous vector arithmetic, reserves geographic donors once, commits one complete
chemical row per affected node, removes temporary accepted-transfer/reaction lists, and
uses four-lane RNN reductions. No species, elapsed time, biological phase or population
load was removed. A following stage sample is about14.7 ms/tick; the 5 ms target remains
unmet. The next full measurement runs without concurrent tests and retains the same
10+100-tick workloads. Smaller updates and formula tests are not substitutes for that gate.

### M1 execution expansion

Expansion `d72e64dc-7087-4fd5-b620-d6d45ac737a9`, root phase2.

1. Implement state and complete update in `engine/src/`: new field/vector arithmetic,
   footprint/contact geometry, finite molecular operators, paid physiology and World
   orchestration/persistence. Reconcile Genotype/Cell, source, ABI, command and trace
   consumers with the same owners. No code is restored from the deleted implementations.
   Verify by compilation and the shared production checks in steps2/3. Completed.
2. Verify real production invariants and supported continuation in Rust, retaining
   controller/ancestry/ownership obligations and replacing discarded-law assertions with
   independent expectations. Include installed changes across birth and snapshot, shared
   donors, work cycles, zero self response and empty-resource behavior. Completed.
3. Use the existing capacity runner on the complete production step, with the registered
   fixed workloads and cold-path measurements. Inspect actual stage costs if the target
   fails; record the causal change before another bounded measurement. Run full CI and
   resolve integration defects without reintroducing the old laws. Completed with the 200ticks/s
   target unmet, explicitly retained for M3 rather than marked passed.

## M2 execution and evidence

Expansion `e7ad644b-e816-4082-b19b-b7f0f502b022`, root phase3.
Consumer reconciliation covers actual installed coordinates, signed efforts, continuous inheritance,
disk geometry, controller-owned fixture mutation, complete ancestry with bounded genotype payloads,
newborn contact reset, recorded typed transfer and visible extinction stopping. The founder's
chemical turn sign now agrees with body-left sensing and positive heading change.

The existing harness produced registered nutrition, chemical, sensory and barrier follow-up
evidence in [rebuild results](../../design/chemistry/rebuild-results.md), ledger3818–3852.
Supplied reproduction, crossfeeding, stress compatibility, finite corpse uptake and mirrored
cue response work. Emission benefit and net movement payoff remain unproved; predicted reduced
tracer spread failed. A schedule-dependent growth starvation defect was corrected through a
separate prerequisite branch, with original failures retained. No ecosystem outcome was tuned.

M3 registrations retain the unchanged full capacity workloads, one600tick default startup,
seven synthetic storage cases and isolated production browser checks on the existing server.
No new server is authorized. The subsequent user acceptance and centered review setup are recorded below.

## M3 implementation and remaining acceptance

Expansion `35194a1b-d70b-4c91-9df0-81aa2db9f32f`, root phase4. Shared field projections and
complete chemical-row exchange replace repeated scalar reductions and species-first geographic
delivery. The full48/2,000/2,000-growth workload measures409.57/66.71/43.17ticks/s, with minimum
20tick windows381.15/64.33/36.31. All cold continuations match. The200ticks/s target remains
unmet at high populations; no cadence, species, growth or reporting workload was reduced.
The largest recorded individual step is145.44ms in the growth fixture. Its changing population
does not establish constant-population or evolutionary performance.

Direct snapshot encoding removes a duplicate full payload allocation. The same wire bytes and
seven synthetic storage cases pass; two-million-ancestor high-water memory fell from509.4MB
to424.4MB in the paired serialization measurement. Default startup and final storage evidence
are recorded in [rebuild results](../../design/chemistry/rebuild-results.md).

The earlier missing-server condition is resolved: on the September15 continuation,
`http://127.0.0.1:26000` serves Antropy. Existing browser checks ran in temporary Chromium
profiles against that server. Default and varied-capacity checks used the Vite application;
the growth check served the generated production bundle inside its isolated browser target.
No server was started, and the user's session and saves were untouched.

All three checks initialized, rendered, inspected, saved and reported no unexpected faults.
The default check also passed graphics-loss pause, export, context restoration, saved-state
recovery and runtime-report availability after an injected worker failure. The loaded kernel
matches the current binary/source digests. Polling overshot the300/100tick stop requests,
ending at380/104/108ticks, within the30second wall caps. These checks do not certify motion
or days-long operation. Browser evidence and retained saturated-load limits are in
[rebuild results](../../design/chemistry/rebuild-results.md#browser-handoff-checks).

The user accepts the thresholded h2 performance and treats complete saturation as an unlikely
worst case. Keep its measured limits; no further saturation optimization blocks this handoff.
M0–M3 are complete. The user passes the initial visual review at restored resolution and has
started a long run. Continuing observation does not require an agent-run evolutionary campaign
for closeout. Emission benefit, net movement payoff and sustained ecological
diversity remain unproved findings, not hidden implementation phases.

September15 user follow-up accepts409.57/66.71/43.17ticks/s for now and reports that visual
inspection mostly looks good. M3 performance acceptance is complete by that decision;200ticks/s
is deferred, not measured as passed. Centered startup review uses **seed27 with default settings**
through the existing Seed/Apply and restart controls. All founders start13–70% across and28–49%
down the map;90.36% of initial field material lies in its central60% rectangle. Selection used
only tickzero geometry among seeds1–32, with no ecological runs. The user subsequently requested
seed27 as the default; new-world creation now uses27 while the independent chemistry seed remains101.
Sub-plan `729f4f44-98b0-48ae-b7cc-bbc3d8fbc451` records this review setup and acceptance scope.

## Historical removal state

The live numerical executors, abandoned thermodynamic solver and composed candidate
have been deleted from the working tree. The Rust engine cannot build or advance a
world. This is the requested removal boundary, not a working replacement or a passing
runtime milestone. Do not repair this state by restoring the deleted implementations,
adding compatibility adapters, disabling checks or supplying placeholder physics.

Removal plan: `36ca17f8-278e-4d5d-ae51-89db28a50347`.
Pre-removal source: Git commit `41fd5d2edb06be5d6ab0c342ffa4fe1456baa87c`.
The [previous plan](../../sources/history/digital-chemistry-plan-before-core-removal.md)
is preserved verbatim as history. Its relative links describe its original root location.
The standalone M0/M1 plans and mathematical specification chapters are historical
implementation records; their formulas, layouts and completion flags do not constrain
the rebuild. Do not resume their steps or restore code to recover their test counts.

## Removed implementation boundary

All paths in this table are under `engine/`. Source files are absent, not renamed into
a fallback runtime. Git preserves their original bodies and the recorded evidence.

| Removed owners | Reason |
| --- | --- |
| `src/world.rs` | Remove the old state orchestration, initialization and step sequence as a foundation for incremental integration. |
| `src/field.rs`, `field_batch.rs`, `numeric.rs`, `movement.rs` | Remove live field transport, numerical buffers/reductions and motion/contact implementation. |
| `src/transport.rs`, `metabolism.rs`, `sensing.rs`, `refitting.rs`, `lifecycle.rs`, `accounting.rs` | Remove live exchange, processing, sensing/exposure, body changes, inheritance orchestration and numerical accounts. |
| `src/disk.rs`, `field_reductions.rs`, `interaction.rs`, `spatial_energy.rs`, `spatial_flux.rs`, `spatial_kernel.rs`, `spatial_numeric.rs`, `spatial_rounding.rs`, `spatial_step.rs` | Remove the abandoned thermodynamic solver, quadrature, energy acceptance and caches. |
| All nine files in `src/composed/`, plus `src/chemical_operators.rs` | Remove the replacement candidate, compiler and separate capacity loop so neither becomes another patch target. |
| `src/economy.rs`, `src/economy_tests.rs` | Remove analytical calculations and assertions tied to the discarded live laws. |
| `tests/chemistry_contract.rs`, its eleven child files, and `tests/spatial_physics.rs` | Remove the superseded equation and candidate-kernel test targets. Their previous results remain historical evidence. |

Total: 31 implementation files and 14 test files removed. Deletion follows reviewed
execution paths, imports and sampled function/test bodies; this was not a fresh
line-by-line mathematical audit of every removed file. Whole modules were deliberately
removed, including useful helpers embedded in them, to establish the requested boundary.

## Preserved requirements and consumers

The governing [principles](../../principles.md) and
[worker ownership contract](../../design/chemistry/data-ownership.md) remain requirements.
Preserve 256 discrete chemicals on the 16×16 manifold, periodic XY geography, individual
genomes/local RNNs, funded bodies and reproduction, finite sources, explicit material/work
accounts, 48 founders in two colonies, ancestry and continuing observation.

The controller, chemical definition/manifold utilities, random streams, application,
worker/rendering, observations, recovery, genealogy, harness and evidence remain on disk.
Remaining physical schemas, genotype compilation, settings, source release, atlas/economy
reports, fixtures and Rust ABI/module declarations are unresolved consumers. Their
presence does not freeze their old shapes, coefficients, helpers or scheduling.
They must be reconciled with the new core, not used to reconstruct the old core.

Retained ownership, recovery, controller and integration tests preserve obligations.
Their compilation is blocked by the missing core; they have not passed after removal.
Removed tests do not waive conservation, finite delivery, funded work, mutation continuity,
nonnegative owners or exact supported continuation. Re-establish these through the new
production operators with independent expected results.

## Rebuild boundary

The next implementation designs state ownership, composed manifold operations and the
complete production update together. Follow the computational direction of
[ADR 0022](../../adr/0022-computable-chemistry.md); select formulas and cost together.
Previous revision-4 formulas, h4 resolution, .2/.8 scheduling, compiler layouts and core
timing allocations are evidence to consider, not obligations to preserve.

Use one Rust physical state and one production step for browser and harness. Establish
field delivery, sensing/RNN actions, movement/contact, processing, paid growth, division,
death and exact continuation through that step. Capacity fixtures may construct controlled
loads, but must exercise the production update rather than a separately orchestrated core.
Do not defer complete active-workload cost until after isolated subsystem completion.

Keep the analytical resource-budget requirement and bounded causal checks. Supplied
reproduction and empty-source exhaustion must exercise the real lifecycle. Complete
performance includes the 48/2,000/growth workloads, actual model time, rendering and
diagnostics, with at least 30 ticks/s and useful headroom. No ecological campaign or
prescribed community is required.

The prior reliability plan's remaining human motion/legibility and user-device acceptance
carry into the replacement handoff. The original crash remains unattributed. Prior
renderer/recovery repairs and measurements retain their original scope; they do not
certify the replacement. No unperformed acceptance is marked completed.

This removal task supplies no replacement implementation. Do not run a development
server, overwrite generated evidence or treat an already generated WASM binary as a
build of this source tree. The existing user session and local saves remain untouched.

## Removal verification

The deletion audit confirms all 45 removed paths are absent, with 7,759 source/test
lines removed and no changes under `frontend/`. The archived root plan is byte-identical
to its pre-removal Git version. `git diff --check` passes.

`make ci` exits 2 at Rust formatting's module resolution: `engine/src/accounting.rs`
does not exist. Clippy, Rust tests, frontend checks and the WASM build are not reached.
This failure must remain visible until the replacement exists; no check was disabled.
The first separate documentation check found historical links to removed source.
The M0/M1 plans were archived unchanged and compiler references marked historical.
The final `make docs-check` passes: 218 files, 68 normalized headings and 176 source
headings. All three archived plans are byte-identical to their pre-removal versions.
