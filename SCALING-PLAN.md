# Runtime scaling

September 18, 2026. Optimization execution: Sulion
`56223ae5-4332-4c46-b3dd-54f21382292b` — completed.
Implementation resumed September 21: `e3517c4b-b3df-4786-bcf4-10a488a294d1`;
CLI phases 1–5 map to P0–P4. The shared-memory runtime and parallel field/biology operators
are installed. Available-core validation and P3 limits are recorded below; 16/32-core acceptance
remains unmeasured. Ecology and climate design proceed independently in
[the spatial isolation review](docs/design/spatial-isolation-review.md).
P4 retains the future scaling assessment of terrain and climate; it does not block their design.

## Outcome and constraints

Reduce ordinary simulation cost substantially and prepare a concrete architecture for
16–32 cores and 10–20 times the current geographic area. Area is a planning assumption;
10–20 times each linear dimension would require a different memory budget. Future elevation
and sun/rotation-driven climate must enter shared local fields and transformation work.
Terrain implementation remains outside the resumed threading work. The original single-thread
optimization record below is historical; the multicore section governs current execution.

Preserve the chemical manifold and action algebra, funded local organisms, material/work
accounts, shared vector equations, spatial resolution and Rust-owned borrowed rendering.
Numerical approximation, changed trajectories and incompatible checkpoints are permitted.
Do not tune toward a prescribed population or remove environmental return opportunities.

## Original single-thread execution (completed)

1. Measure concentration/work distributions and transport bounds on the retained ordinary
   seed 27 tick 5,000 checkpoint. Reuse the prior measured WASM baseline and capacity fixtures.
2. Reduce dominant field work. Select a common concentration cutoff from the distribution;
   keep discarded material in numerical accounts. Derive a positivity bound for transport
   instead of preserving an unnecessarily small timestep. Consider further shared arithmetic
   or cadence changes only if the remaining measured cost justifies them.
3. Verify transport positivity/conservation/periodic symmetry, chemical return opportunities,
   funded reproduction and complete accounting. Compare ordinary short continuations and
   saturated capacity, then run `make ci`.
4. Document multicore ownership, work partition, barriers, memory budgets, deployment
   prerequisites, acceptance measurements and future milestones.

## Bounded measurement registration

Question: can eliminating negligible field support and redundant transport passes produce
substantial whole-world speed without removing chemical access or regenerative opportunity?
Competing explanations are negligible tails, overly conservative stepping, and unavoidable
work in significant mixtures. First inspect the saved field without advancing time.

Use the existing optimization runner, four existing fixtures, 10 warmup + 100 measured ticks,
60 seconds per case, one process at a time, and ordinary census/inspection/render preparation.
Permit at most four targeted candidate batches; archive each loaded binary. Physical equality
is not an acceptance criterion. Stop on nonfinite state, failed accounts or the existing
3 GiB process / 1.5 GiB WASM limits. No GPU execution is included.

After selecting the numerical change, compare archived and current WASM for one 1,000-tick
continuation from the same tick 5,000 input, each capped at 90 seconds. Read population,
divisions, material/work residuals, uptake/reaction flows and chemical amounts at intervals.
This diagnoses a large disruption; it does not prove long-run ecological equivalence.
Use existing bounded Rust opportunity tests for causal mechanics. Do not extend the horizon
or sweep seeds to obtain an attractive ecological result.

Run one fresh archived-baseline capacity batch with the updated runner and a final candidate
batch after CI. The runner no longer allocates restored comparison worlds after each timed
case; repeating the archived binary under the same harness controls that and host variation.
This is the fourth and final candidate batch, not an ecological horizon extension.

## Source and consumer map

- `engine/src/field.rs`, `field_medium.rs`, `field_vector.rs`, `field_activity.rs`: transport,
  shared coefficients, sparse support and material ownership.
- `engine/src/climate.rs`, `weathering.rs`: local environmental conversion and external work.
- `engine/src/transport.rs`: local uptake/export with shared donor allocation.
- `engine/src/world.rs`: phase ordering, lifecycle and snapshot ownership.
- `frontend/src/engine/worker.ts`, `client.ts`, `canvas.ts`: scalar stepping and borrowed views.
- `frontend/harness/numerical/optimization.ts`: existing whole-workload measurements.
- [Data ownership](docs/design/chemistry/data-ownership.md),
  [principles](docs/principles.md), and
  [regenerative design](docs/design/chemistry/regenerative-ecosystem.md) govern retained behavior.

## Status

The tick 5,000 field contains 3,158.14 material units and 282,211 occupied four-species groups.
Cutoff 1e-6 removes 0.29736 units (0.00942%) and leaves 198,561 groups; every geographic node
still has some significant chemical. Cutoff 1e-5 would remove 2.80943 units (0.08896%) and leave
136,308 groups. Select 1e-6 first. These are one-time truncation figures, not accumulated loss.
The shared transport bound is 0.8 at the default interval; raise the substep ceiling from 0.5
to 0.9, below the positivity limit 1. One pass replaces two without modifying face coefficients.

The first candidate measures 169.68 ticks/s at the saved 5k state versus 87.94 before; saturated
48/2,000/2,000-growth cases measure 88.21/35.54/21.65. This is not the final build.
Sparse exchange now indexes only body-touched geographic rows and requested four-chemical
groups, preserving the shared donor allocation. Candidate 3 measures 166.09 ticks/s at 5k,
89.09/37.83/22.62 for saturated 48/2,000/2,000-growth.

### Final matched throughput

Ledger 4108–4115, archived original and final CI-built WASM with the same updated harness:

| Workload | Before ticks/s | After ticks/s | Speedup |
| --- | ---: | ---: | ---: |
| 48 cells, saturated field | 57.51 | 88.52 | 1.54× |
| 2,000 cells, saturated field | 23.15 | 37.54 | 1.62× |
| 2,000 growth, saturated field | 15.34 | 22.57 | 1.47× |
| Saved ordinary world at tick 5,000 | 88.82 | 167.34 | 1.88× |

These include census, inspection and packed rendering preparation, excluding GPU execution.
The growing saturated case remains below 30 ticks/s. Ordinary field/source stage time falls
from 9.61 to 4.57 ms/tick and exchange from 0.675 to 0.373 in separate instrumented replays.
WASM allocation high-water drops from 242.6 to 163.8 MB for the ordinary 100-tick workload.
This does not establish a browser RAM ceiling or scaled-world performance.

[Evidence and reproduction](docs/evidence/digital-chemistry/scaling-v27/README.md).
`make ci` passes 153 Rust tests, 62 Vitest tests, Clippy, ESLint, formatting, TypeScript,
documentation and Terraform formatting, with 12 pre-existing lint warnings. The first CI
attempt caught excessive complexity in the added sampling callback; moving observation
sampling into the existing observation helper corrected it. No server or browser run was
started, and no commit, push or deployment was performed.

Two bounded tests exposed cutoff consequences: a second-generation dissolved product fell
below the new resolution, and tiny reservoir batches stopped converting because their
reaction screen reused the dissolved cutoff. The product-wakeup fixture now uses a valid
unshielded, larger input above resolution. Finite reservoir inventory uses an owner-relative
conversion screen (`total * f32::EPSILON`), not concentration times interface area. Owned tiny
stocks are retained. A candidate with no conversion screen generated extremely small products
across the chemical space; source deposition cost grew and ordinary throughput regressed
to 127 ticks/s. This measured failure motivates retaining a scale-relative screen.
Small-reservoir conversion passes its original opportunity assertion.

### Paired continuation

Ledger 4106–4107, archived original versus candidate 3, each 10 warmup + 1,000 ticks from the same
tick 5,000 state, sampled every 200 ticks. Archived/current throughput is 80.40/169.30 ticks/s,
2.106×. Both finish at tick 6,010; this is a continuation rather than a run from zero.

| Quantity over measured interval | Archived | Optimized |
| --- | ---: | ---: |
| Imported material | 906.968 | 908.296 |
| Cellular reacted material | 781.066 | 773.645 |
| Environmental converted material | 27.156 | 26.848 |
| Reservoir converted material | 3.683 | 3.668 |
| Captured cellular work | 1925.489 | 1922.016 |
| Divisions | 274 | 278 |
| End population | 285 | 284 |
| Numerical material loss | 0.0464 | 4.7811 |
| Physical washout | 617.910 | 616.813 |
| End dissolved material | 2975.202 | 2969.769 |

Current numerical loss is 0.78% of physical washout in this interval. End material/work
residuals are 2.26e-7/1.41e-6. The leading chemical IDs remain 136, 0, 128, 129, 8; globally present
chemicals decline from 256 to 254. This is a resolution effect, not targeted chemical removal.
Population paths diverge, as expected, while substantial uptake, reactions and reproduction
continue. These checks and bounded opportunity tests support retaining the changes; they do
not prove long-run equivalence, endurance, sustained recycling or evolved diversity.

## Multicore design

Implementation resumed September 21 at the user's request. The single-thread investigation
in `docs/plans/MATURE-PERFORMANCE-PLAN.md` is ended with its throughput target unmet.
Retain its installed operators and uncommitted source changes. This work implements P0–P2
and measures P3 on available hardware; P4 terrain remains separate future work.

Sulion root: `e3517c4b-b3df-4786-bcf4-10a488a294d1`.
P0 expansion: `eb487315-d9be-45d0-a55f-ac35e5bf08b3`.

### P0 execution

1. Add a shared serial/parallel execution adapter and thread-safe immutable program caches.
   Keep mutation exclusive to each owner; no locks around entire cells or chemical updates.
   Validate the inherited untested compact product refactor with the Rust suite.
2. Factor field destination rows into independent jobs with frozen inputs, local weather
   scratch and small account reductions. Use contiguous geographic strips within the existing
   dense layout first; no material rearrangement or per-worker world copies. Preserve sparse
   activity, seam flux, donor bounds, and the pre-weathering medium boundary.
3. Verify conservation, positivity, cross-partition interactions and one/multiple-worker
   execution using the same operators. Benchmark available 1/2/4/6 cores. This six-core host
   cannot establish 16/32-core acceptance; retain those measurements as outstanding.

### P1–P2 execution

The build produces a raw serial module and a shared-memory module from the same Rust source.
The shared loader initializes the pinned Rayon pool before creating a World. Cross-origin
isolation selects that loader; unsupported environments execute the serial module. The existing
scalar ABI and borrowed render projections remain the application boundary. Pool startup failure
must be visible and must not leave a partial World running.

Cell sensing, control, movement and physiology use disjoint owners. Reactions keep worker-local
scratch and reduce optional observer accounts after joining. Exchange compiles a transposed
footprint adjacency so node jobs see all competing requests before allocation. Registry and
ancestry commits remain coordinator-owned. Detailed experiment trace mode may run physiology
serially; ordinary live reduced observations must remain parallel.

Validate a 1/4-worker bounded shared-kernel comparison with observer accounts, seam interactions,
save/restore and positive inventories. Browser registration: isolated Chromium on the existing
port 26000 server; verify pool startup, shared-memory borrowed WebGL uploads, scalar stepping,
save/restore, restart and failure reporting. Use small constructed worlds and at most 100 measured
ticks per capacity arm, 60 seconds per arm; no ecological inference or long campaign. Preserve
artifacts only under ignored `frontend/harness/artifacts/`.

### September 21 implementation evidence

P3 local admission probe: replace the unrelated 80,000-node limit with a 2 GiB geographic
reservation at 4096 bytes/node: two material buffers, 1024 bytes/node reserved for scalar,
index, coefficient and display storage, plus one field snapshot. Cell/genome/ancestry costs
remain additional and must be reported; this does not guarantee arbitrary population growth.
Measure 1×/10×/20× area at mesh 2 with 2000 fixed cells, and 48/480/960 cells at constant density,
one and six workers. Each case is 10 warmup and at most 100 measured ticks/60 seconds, plus
bounded save/render checks. The constructed load retains its existing initial field and funding;
it is not a demonstration of carrying capacity. No trajectory matching requirement.

The shared kernel and browser pool are installed, including destination field strips, local
weather accounts, cell sensing/control/movement/physiology, spatial candidate bins, gathered
contact pressure, and destination-grouped uptake requests. Small workload crossovers avoid
pool dispatch. Genotype and inventory caches use synchronized immutable initialization;
cell updates remain exclusive. Lifecycle/ancestry and reduced observation publication stay
on the coordinator. The existing material cutoff and chemical laws are unchanged.

The final default-area browser capacity probe measures 63.07/89.29/113.72/124.36 ticks/s with 1/2/4/6
workers for the constructed 2,000-cell load. All four shared-memory WebGL uploads return
no error, and checkpoint restore plus world replacement succeed. This measures stepping;
rendering/storage checks are outside its timed section. It is not mature-world throughput.

At 20× area, the initial six-worker result was only 20.56 ticks/s for 2,000 cells. Parallel
geographic medium updates and attraction filters, with contiguous transposed column passes,
raise it to 45.89 ticks/s. These execute the existing equations; no attraction reach,
chemical cutoff or physical cadence changed. The final geographic build measures:

| Area and initial cells | One worker ticks/s | Six workers ticks/s |
| --- | ---: | ---: |
| 20×, 2,000 | 16.71 | 45.89 |
| 20×, 960 (48 per original area) | 19.48 | 56.95 |

The preceding 10× build measured 28.17/35.74 ticks/s at 2,000 cells and 41.57/43.40 at
480 cells before the geographic passes were parallelized. It was not remeasured on the final
geographic build. All cases use mesh 2, no resource sources, ten warmups and 100 measured ticks.
The fixture's tiny initial dissolved concentrations are removed by the existing cutoff during
warmup. These are sparse constructed loads, not saturated fields or evolved 20× ecosystems.
Observation/render/storage work is outside timing. Raw results remain in ignored
`frontend/harness/artifacts/multicore-final/`, `multicore-scale/` and
`multicore-large-geographic/`.

The 20×, 2,000-cell six-worker case allocates 1.04 GiB of WASM memory while stepping and
2.58 GiB at the high-water mark while retaining the original world, snapshot and restored
world. Direct engine restore, memory growth, borrowed WebGL upload and replacement pass.
This exposed signed JavaScript interpretations of WASM pointers above 2 GiB; the ABI adapter
now interprets all exported pointers as unsigned 32-bit offsets.

Larger-world admission is a kernel capability, not a completed browser operating envelope.
These 20× raw snapshots are 414–444 MiB, exceeding the existing browser package limit of
192 MiB. Ordinary automatic recovery therefore cannot sustain these worlds yet. The limit
and retention policy were not raised. P3 remains open for a bounded large-world persistence
design, representative occupied workloads and 16/32-core measurements. Default dimensions
remain unchanged.

The actual application passes graphics context loss/recovery, export while paused, IndexedDB
restore and injected coordinator failure with a visible error and an available runtime report.
It reaches tick 316 with 55 living cells in this operational check; this is not an ecological
claim. Unit coverage checks the stalled-worker watchdog and serial capability fallback.
Direct helper-thread failure injection and long-duration pool endurance remain unmeasured.

Validation: `make ci` passes 275 Rust unit tests, 17 integration tests and 74 Vitest tests,
Clippy, TypeScript, formatting, documentation/storage policy and Terraform formatting, with
17 existing ESLint warnings. The initial production build failed because Vite's default IIFE
worker output cannot split the dynamic loader. ES-module worker output fixes the build; the
built application then passes stepping, inspection, rendering and manual save in isolated
Chromium using the existing server with local build interception. This is not a deployment.

The historical 180k checkpoint is evaluated through the existing isolated v33 fixture,
preserving its old persisted light layout while installing current execution operators.
One/six native workers measure 18.53/36.98 ticks/s over 100 measured ticks after ten warmups.
The six-worker mean stage costs are 3.69 ms field/footprints, 5.19 sensing/contacts,
6.39 local control/motion, 6.19 exchange, 4.55 physiology, and 1.03 lifecycle/upkeep.
This roughly 2× improvement is below the 16/32-core targets. It excludes active phenotype
observation, census, rendering and browser overhead. Raw records are local under
`frontend/harness/artifacts/multicore-second/`.

The production isolation policy is prepared locally. The website module in the sibling
`ahara-tf-patterns` checkout adds `response_headers_policy_id` to every cache behavior;
Antropy consumes it with COOP/COEP. Upstream publication must precede consumer deployment.
Neither repository has been committed, pushed or deployed during this work. Terrain/climate
P4 remains future work. The installed implementation uses 64-node contiguous strips rather
than changing the dense material layout to square tiles: this gives safe disjoint slices and
preserves frozen neighbor reads without a layout migration. Compact exchange commit, source
projection, lifecycle and ancestry publication retain coordinator ownership; parallel demand,
allocation and cell acceptance precede that commit.

### One Rust world, partitioned work

Keep the present owning worker as coordinator and WebGL renderer. Add a persistent pool of
compute workers executing Rust over one shared WASM memory. Each phase grants exclusive
write access to disjoint field tiles or organism ranges and read access to frozen inputs.
Helpers never own another World or call the coordinator's thread-local ABI store. They
receive bounded job descriptors, not serialized chemical arrays or population frames.
After a completion barrier, the coordinator can step the next phase or borrow display views.
Rendering, saving and memory growth cannot race outstanding jobs. Do not overlap rendering
with writes by quietly introducing a second full world snapshot.

Use Rust scoped parallel iteration through Rayon, with `wasm-bindgen-rayon` for browser pool
startup; keep the existing scalar-step and packed-render ABI behind a narrow loader adapter.
The current raw instantiation in `client.ts` and build script need a deliberate migration,
not just a Cargo dependency. Preserve a one-thread executor of the same operators for small
workloads and platforms without shared-memory support. A second simulation implementation
is unnecessary. Independent random streams may be assigned to worker tasks; they must not
couple environmental events to genetic sampling. Thread count need not preserve trajectories.

The [adapter documentation](https://docs.rs/wasm-bindgen-rayon/latest/wasm_bindgen_rayon/)
requires an atomics-enabled standard library, a pinned nightly toolchain and its web loader.
It supports Vite. Prototype the adapter against our exported memory and ABI before adopting
the build change. This is the selected approach; a custom allocator/thread runtime would add
unnecessary maintenance.

### Partition by geography and requested work

Start with 16×16 geographic tiles, independent of the 16×16 chemical manifold. One dense tile
contains 256 KiB per material buffer, so two buffers occupy 512 KiB. Tile size is provisional:
compare 8, 16, 32 against cache misses, scheduling cost and load balance. Queue several times
more jobs than workers; estimate cost from occupied chemical groups, reactive pairs and
resident cell requests, not tile area alone. A sparse empty region should not occupy a core
while one rich patch dominates another core's queue.

Field jobs read the old buffer including a one-node neighbor halo and write only their own
destination rows. Keep reciprocal face coefficients and one shared outgoing bound. Weathering
uses worker-local 256-value scratch, immutable compiled operators, and local account totals.
No atomic additions on each chemical. Reduce small job accounts and compact occupancy lists
after completion; rebuild geographic mixture summaries in disjoint rows. The field currently
rebuilds summaries after transport, while weathering reads the frozen pre-commit medium;
preserve this causal boundary deliberately even if a future cadence changes.

| Phase | Parallel work | Required shared boundary |
| --- | --- | --- |
| Body/source projection | Bin sparse footprint contributions by destination tile; tile owner sums them | Publish frozen medium before movement/field reads |
| Transport and conversion | Independent destination rows reading old material/medium | Join before buffer swap and publication of next summaries |
| Sensing/RNN/motion | Disjoint cells reading frozen field and immutable genomes | Join before rebuilding footprint/contact bins |
| Uptake/export | Cell requests; destination-node demand/availability; cell acceptance; destination commit | Barriers preserve competition and prohibit same-event export reuptake |
| Metabolism, repair, refitting | Disjoint cells and local resource accounts | Join before material releases and births |
| Contacts and lifecycle | Spatial pair bins; each unordered pair once; deferred contributions and birth/death proposals | Coordinator commits IDs, registry changes and ancestry |

CSR adjacency (offsets plus contribution records grouped by destination node) is the reusable
boundary for footprint projection and uptake/export. A tile owner gathers all requests to its
nodes, computes one donor fraction, then cells gather accepted amounts. This avoids shared
floating-point writes and retains fair competition between cells on opposite tile borders.
Birth/death decisions remain local physical decisions. Their final registry commit is a
bounded serial phase, not centralized reproductive selection. Large parallel birth batches
reserve ID ranges and reduce parentage events; do not put one global lock around each birth.

### Memory and bandwidth are scaling gates

Current mesh 2 gives 19,200 geographic nodes and 4,915,200 chemical entries. The two f32 field
buffers require 39.32 MB. At 10×/20× area they require 393.22/786.43 MB. The old two dense f64
exchange scratch arrays alone would add 786.43 MB/1.57 GB. The current compact-row exchange
removes that unconditional geographic allocation; memory follows touched rows and cells.
Do not allocate a world-sized reduction buffer per thread.

The next layout candidate is tiled chemical-group pages: a tile allocates a four-chemical
page only when material or an incoming halo requires it. Keep dense geographic scalar fields
for terrain, external forcing and mixture summaries; those are cheap compared with 256-species
arrays. Benchmark page occupancy first: many tiny pages and lookups can be slower than dense
contiguous rows. Retain dense pages within busy tiles, rather than a hash lookup per molecule.
Use the same iterator/operator interface for full and sparse pages. Rust packs the existing
display projection once per requested view; JavaScript still borrows it directly.

Measure bytes read/written per active chemical, effective bandwidth, worker imbalance and
barrier time. More cores cannot remove a memory-bandwidth ceiling. Reuse tile-local property
rows and summaries, fuse compatible traversals, and avoid whole-world clearing or scans in
otherwise local stages. The present 80,000-node validation limit must be replaced with a
measured memory budget before 10×/20× worlds are enabled. WASM32 address space, allocator
high-water use, genomes, ancestry, snapshots and GPU textures all count; field bytes alone
are not an operating budget.

### Elevation and climate fit the same substrate

Treat elevation as a scalar surface over the existing periodic XY world, with cached local
gradients/normals and symmetric face geometry. It is not a third organism coordinate.
Use the same local transport and work operators with spatial coefficients. A face must
represent the same material exchange from either side, including seams and slopes.

Sun direction and rotation provide slowly changing external fields. Local surface orientation
and medium determine received work; transformed material records its external input. Compile
static terrain quantities once, update moving illumination on a separate bounded clock, and
interpolate that shared field for local operators. Chemical response continues through the
existing manifold profiles and funded work rules. Do not create sun-specific cell roles,
hidden controller coordinates, unrelated weather scripts, or a general fluid solver without
a demonstrated ecological need. Shadowing and horizontal climate transport remain later
choices: require a named opportunity and a measured budget before selecting their equations.

### Browser and deployment prerequisites

Shared WASM memory requires cross-origin isolation. Plan COOP `same-origin` and COEP
`require-corp`, same-origin worker/WASM assets, and an explicit check of `crossOriginIsolated`.
These requirements follow the [browser contract](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated).
The current Vite config has no isolation headers, and the inspected shared website module
has no response-header-policy input. Add a reusable module option upstream when threading
implementation is authorized, then consume it here. Do not bypass the platform website
module or introduce a server. Verify actual response headers and worker startup after deploy;
Terraform declarations alone do not establish browser isolation.

Document the internal compute pool as an explicit extension of the current single-worker
ownership contract when implementing it. Preserve its invariants: one Rust physical owner,
no JavaScript mirror, no field/frame messages to React, synchronous borrowed GPU uploads,
bounded observations and backpressure. Existing ownership tests stay enabled and gain
checks that helpers cannot publish observations or write outside their granted partitions.

### Future milestones and acceptance

Threading implementation is authorized. Terrain remains future work. Performance thresholds
below remain targets until measured on the named hardware and world sizes.

- **P0 — Parallel tile kernel and memory budget.** Factor destination-row work and local
  accounts into shared serial/parallel kernels; use sparse exchange and measure tile-page
  occupancy. Native 1/2/4/8/16/32-thread capacity tests use the same kernel. Verify seam flux,
  positivity, conservation, cross-tile donor competition and environmental return opportunity.
  Reject a layout that merely lowers occupancy counters while increasing wall time or memory.
- **P1 — Browser shared-memory execution [depends on P0].** Integrate the pinned Rust pool,
  loader, headers and coordinator barriers. Test startup failure, worker failure, stop/reset,
  memory growth, save and renderer borrows without deadlock or partial-state publication.
  Compare whole browser step/render/observation throughput on actual 16/32-core hardware.
- **P2 — Parallel biological stages [depends on P1].** Parallelize per-cell control,
  physiology and CSR exchange; bound lifecycle/ancestry commits and footprint/contact work.
  Preserve local funding and fair donor allocation. Demonstrate benefit at fixed cell count
  and at constant density as geographic area grows.
- **P3 — Larger-world operating envelope [depends on P2].** Measure 1×/10×/20× area at mesh 2,
  both fixed occupied patches and constant ecological density. Declare population, source
  density, chemical occupancy, observation cadence, RAM and core count for every result.
  Targets: at least 8× whole-workload speedup on 16 cores and 12× on 32 for sufficiently large
  loads, plus at least 30 ticks/s at 20× area under the declared representative density.
  These are targets, not estimates established by this pass. Keep a small-world serial
  crossover so threading overhead cannot regress ordinary starts.
- **P4 — Terrain and external climate budget [depends on P3].** Add the surface/forcing
  fields through existing operators, with short local opportunity probes and an explicit
  share of the measured tick budget. Meaningful different local pressures must remain
  observable without prescribing an evolved community.

For 32 cores, a 5% serial fraction already caps ideal speedup at 12.5×; field-only threading
cannot meet the target once exchange and physiology dominate. For each milestone, measure
total tick latency, throughput, worst windows, phase barriers, RAM, and active work. Compare
against the optimized one-thread implementation, not the slower historical baseline.
This workspace has a 6-core i5-8500; it cannot establish 16/32-core scaling. Implementation
must obtain a declared suitable target before making those performance claims.
