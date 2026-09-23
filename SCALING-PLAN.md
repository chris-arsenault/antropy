# Structural runtime scaling

## September 22 systemic spatial ownership execution

Execution: `5fd3d7d0-9fd9-422b-95c6-ce1dace47ab3`, under root S. This section is the
current implementation contract. Earlier execution records below preserve their evidence;
their completion claims do not establish persistent regional ownership.

The audit found independently maintained material slots, chemical masks, carrier lists,
global revisions and reconstructed work buffers. Replace that convention with an encapsulated
spatial owner and reusable regional storage/dependency primitives. Ordinary writers must not
coordinate separate support, projection and invalidation structures themselves.

### Decisions

- One periodic geometry maps positions/nodes to persistent regions and finite halos. Start
  with 8×8-node regions, a numerical storage choice to assess with the populated checkpoint.
- Material commits own actual changes, masks, feature reductions, accounts and local wakes.
  Arrays are private; readers receive immutable rows/samples. Explicit diagnostic replacement
  has one bulk commit boundary. Retain contiguous chemical arithmetic and activity masks.
- Regions retain current/destination storage and clear only previously written chemical groups.
  Empty regions release material storage when no physical or pending work needs it.
- The same carrier contribution owner handles source and cell footprints, including removal
  and old/new neighborhoods. Their physical projection formulas remain distinct and unchanged.
- Derived operators use region/channel changes and cumulative anchors. Reach includes composed
  filter support and gradient neighbors. Periodic boundaries are resolved by the shared geometry.
- Physical due work is distinct from stale derived work: chemistry, decay, illumination and
  source renewal continue on model-time deadlines. No sleeping state freezes funded turnover.
- Parallel phases read a declared committed state and own disjoint destination regions. Donor
  contention remains jointly allocated before commit. Browser and native use the same operators.
- Keep chemical transformations, circle contact, reservoir renewal and funded biology. This
  work changes connected storage, dependency scheduling and consumers, not ecological capabilities.
- Local borrowing, bounded remote projections and cold exports retain the data-sharing contract.
  No deployment, new backend, checkpoint adapter or long ecological campaign is included.

### Milestones

1. **M0 Spatial owner and material transactions.** Replace disposable row ownership with
   persistent regional storage and move material/support/reduction writes behind one boundary.
   Migrate readers, diagnostics and parallel field commitment. Acceptance: the ordinary World
   uses the owner; no production mutable escape hatch; accounts, wake/reclaim and reuse tests pass.
2. **M1 Local dependencies and shared carriers.** Replace global carrier revision invalidation
   and whole-source reprojection with region-local updates and shared contribution ownership.
   Acceptance: a local change adds derived work only inside the declared halo; no-op writes do
   not invalidate; accumulated changes, source movement and periodic seams remain visible.
3. **M2 World execution and consumers.** Integrate region-owned parallel jobs, time-driven wakes,
   local contact/transport membership and committed read interfaces through ordinary stepping,
   rendering and observations. Acceptance: one/four workers, static illumination receivers,
   birth/death/region crossing and cross-region donor contention obey the same contracts.
4. **M3 Acceptance.** Run bounded local-work tests, existing mechanics tests, make ci and short
   populated-world measurements. Use the saved tick-15k world plus empty-area and populated-region
   comparisons. Record executed regions, invalidations, allocation/reuse, complete stepping and
   publication costs; no reliance on source-free cell fixtures alone. A failed locality invariant
   or a material performance regression reopens implementation rather than weakening the gate.

### M0 execution expansion

Files: `engine/src/field*`, `spatial_*`, connected field readers/writers and focused ownership tests.
1. Introduce the common periodic region geometry, stable regional storage and work sets.
2. Move material write/commit, support masks and reductions into the owner; reuse destination
   buffers and route every ordinary producer through its transactions.
3. Migrate immutable readers and explicit bulk fixtures, then verify donor/material closure,
   empty activation/reclamation and persistent allocation before advancing M1.

M0 implementation now uses persistent regional current/destination material and a private
Field material owner. Read-only callers use `amounts()`; cold fixtures use atomic replacement.
Region storage and local work ownership are reusable objects. Tests caught an empty-halo
allocation churn bug; destination halos now remain until no pending physical work needs them.

### M1 execution expansion

Replace the whole-support force rebuild with six persistent finite-support regional operators.
Use the existing 0.1 prepared-operator resolution against the last published carrier input;
zero/sign transitions and explicit cold replacements wake immediately. One carrier contribution
owner tracks cell and reservoir additions/removals and clears a node when its last owner leaves.
Test no-op writes, accumulated changes, distant populated regions, fractional reach and seams.

### M2 execution expansion

Move movement dependencies and contact membership onto reusable regional ownership. Keep current
circle overlap and joint donor allocation. Reuse transport membership when footprints are unchanged;
changed footprints must update donor membership before allocation. Use committed carrier readers
for rendering where their stage is appropriate. Retain explicit external clocks and immutable worker
publication. No independently sleeping physical economy is introduced.

### Bounded acceptance registration

Question: does local ownership remove support-wide rebuilds and improve complete ordinary stepping
in the existing populated world? Competing failure: region padding, lookup or reconciliation costs
could exceed the work removed. Use the existing tick-15000, 972-cell checkpoint from the independent
renewal test, unchanged starting configuration. Compare one and four workers, ten warm-up and 100
measured ticks, 60-second wall cap per case, initially one pair. No seed or horizon expansion.
Acceptance includes accounts/validity, local perturbation versus distant populated regions,
allocation reuse and whole-step time against the recorded 28.03/20.90 ms baseline. A regression
requires implementation correction, not a looser acceptance statement. Generated reports stay in
ignored `frontend/harness/artifacts/regional-ownership/`. Full CI follows connected integration.

Area acceptance uses the existing fixed 48-founder/48-source fixture at 1×/10×/20× the
original 320×240 area, one worker. Also check the existing 2,000-cell concentrated fixture
at 1× and 20× area, one worker, to catch regional membership overhead under dense overlap.
Each case has ten warm-up and 100 measured ticks with a 60-second wall cap. These fixtures
retain positions and add geography, rather than multiplying populations. Periodic boundaries
and resulting physical support can differ; record work counts rather than claim identical work.

### M3 measured result

The populated comparison uses HEAD `b224525` as its recorded baseline and the ordinary native
World restored from tick 15000 (972 cells, 720×540 geography). Final measurements run sequentially
without concurrent compilation. Ten warm-up plus 100 measured ticks finish at tick 15110 with
1,009 cells and no stop reason in both worker configurations.

| Workers | Before TPS | Regional owner TPS | Before ms/tick | Regional owner ms/tick |
| --- | ---: | ---: | ---: | ---: |
| 1 | 35.68 | 40.71 | 28.03 | 24.57 |
| 4 | 47.84 | 64.69 | 20.90 | 15.46 |

Attraction preparation averages 3.38/1.96 ms per tick at one/four workers; the physical field
partition averages 7.86/2.79 ms. These are subsets of environment time, not additional costs.
The final force preparation changes 63 input regions and visits 146,576 destinations across six
stages. Material occupies 58,647 rows in 1,065 current regions. Both material buffers together
allocate 147,323,040 bytes, including region padding; 2,130 regional allocations are retained.
Bounded tests independently establish buffer reuse after warm-up and local invalidation in a
world with distant populated regions. The saved continuation's final material/work residuals
are approximately 5.83e-6/3.13e-5; ordinary state validation passes.

Stepping excludes output publication. A separate cold full-map projection costs 8.29/8.57 ms;
census plus environment observation costs 23.44/23.41 ms. The display buffers hold 3,170,352
bytes. These measurements exclude network encoding, GPU upload, selected-cell inspection and
active-phenotype observations. They do not establish live 32-core server performance.

| Fixed 48-founder/48-source fixture | 1× area | 10× area | 20× area |
| --- | ---: | ---: | ---: |
| Stepping, TPS | 306.44 | 283.43 | 265.74 |
| Cold full-map projection, ms | 1.45 | 10.32 | 20.81 |
| Environment observation, ms | 0.77 | 0.91 | 1.04 |
| Process peak RSS, KiB | 33,752 | 89,416 | 143,664 |
| Active material nodes | 2,610 | 2,955 | 2,955 |

Adding empty geography therefore has a modest measured stepping cost, while full-map output
and scalar/index memory still grow with area. Different periodic boundaries produce different
support, so this is not an identical-work or asymptotic logarithmic-scaling claim.

Dense-query acceptance found per-cell neighborhood discovery, repeated regional lookup inside
chemical contractions and repeated crowded-donor scans. The query integration sub-plan
`4d4dc91c-c501-41fa-9916-57af2aaf8fe2` replaces those with occupied-bin traversal, borrowed rows
and delivery reverse links. Because unchanged biology stages also slowed against the earlier
baseline, the sub-plan registered one back-to-back old/new comparison at 1×/20× concentrated area, using the
same ten warm-up/100 measured ticks and 60-second case cap. Retain both binaries to avoid a
compilation interval between paired measurements; no horizon or seed expansion.

The first dense result was 43 TPS against 53 TPS. Correcting only allocation/bounds was
insufficient; completing bin-level sharing, row contractions and direct delivery updates was
necessary. The final pair after empty-row early exits measures:

| Concentrated 2,000-cell start, one worker | Before | Regional owner |
| --- | ---: | ---: |
| 1× area stepping, TPS | 53.19 | 52.65 |
| 20× area stepping, TPS | 53.47 | 51.88 |
| 20× cold full-map projection, ms | 17.09 | 21.51 |
| 20× process peak RSS, KiB | 344,068 | 316,948 |

The remaining 1–3% dense stepping difference is retained as an operating cost; this workload
has no demonstrated speedup. Full-map output at 20× is still more expensive than the baseline.
Neither result is hidden by the populated-world improvement. The revised owner meets the
30-TPS floor on these bounded fixtures, and the locality/account/membership tests establish
the selected structural obligations independently of the timing floor.

Failures retained: the first regional implementation measured 23.59 TPS on the populated
single-worker case. Node-by-node halo discovery and expensive inner filter addressing erased
the intended gain; shared interval halo traversal and regional rolling filters corrected them.
The final audit also caught empty-row reduction residue, no-op allocation and invalid restored
rows being pruned before validation; each now has a regression test. One final timing pair was
accidentally launched concurrently and is excluded (`contended-workers-*`). Final results
are `verified-*`; earlier measurements and all raw reports remain ignored local artifacts.

### Post-review ownership corrections

A callgrind profile of the same tick-15000 continuation found two remaining bypasses of the
owner. Reservoir release wrote every chemical of every footprint node through scalar
`Field::add`: about 2,200 calls per release, each repeating region lookup, group mask,
projection and carrier bookkeeping. That was 23% of stepping instructions, more than attraction.
The attraction filter also expanded its halo by a whole region at each of six box stages,
so one dirty region cost about 120 region visits although three radius-3 boxes reach 9 nodes.

- Release now commits one mixture row per footprint node through the shared row commit that
  cell exchange uses (`Field::release_mixture`, `commit_row`).
- The medium diffuses, is sensed and exchanges only at the physiology interval. Reservoirs now
  accrue stocked time and commit `rate × elapsed` at that boundary instead of writing the
  medium every tick. Restore derives accrued time from the checkpointed medium clock.
  Between boundaries the attraction input lacks at most 0.6 s of release.
- Each attraction axis gathers one input line per destination row and applies its three boxes
  in sequence. Only the x-pass and y-pass planes persist; each halo spans three box radii.
  The direct-convolution, wrapped-reach and local-invalidation tests pass unchanged.

Same checkpoint, ten warm-up and 100 measured ticks, sequential native release runs:

| Workers | Before TPS | After TPS | Environment ms/tick before → after |
| --- | ---: | ---: | --- |
| 1 | 41.2 | 53.3 | 17.76 → 12.24 |
| 4 | 64.3 | 97.4 | 11.59 → 6.43 |
| 6 | — | 103.1 | — → 5.93 |

Attraction falls from 3.31 to 1.95 ms per tick at one worker; visited sites per update fall
from 146,576 to 41,600. Population, generation and ledger totals match the earlier continuation;
the material residual is 5.81e-6 against 5.83e-6. Released supply is 3.67 lower because the
final tick leaves accrued release pending. The fixed 48-founder fixture rises from 306/283/266
to 679/621/590 TPS at 1×/10×/20× area. The dense 2,000-cell fixture is unchanged at
52.7/52.6 TPS because cell work dominates it.

Field transport is now the largest stage, 7.84 ms at one worker and 2.77 ms at four. All
58,679 active rows hold material above the concentration floor, 7,053 units in total, so this
cost follows real coverage rather than numerical haze. Further reduction needs a temporal or
numerical-method decision for the medium, not another bookkeeping repair.

### Region-owned commits and the serial fraction

Sulion plan: "Region-owned parallel commit and serial-stage removal". A stage model fitted to
one through six workers on the same checkpoint (T = serial + parallel/n + k·(n−1), three repeats)
attributed 7.21 ms of the 18.7 ms single-worker tick to single-threaded code: 39%, which caps
this CPU at about 139 TPS for any number of cores. The parallel sections themselves scaled
nearly linearly and rayon fork/join measured about 1.3 µs per extra thread. The limit was
serial write-back after each parallel pass and stages that were never parallelized.

- Each material region owns its rows, group masks and per-site projections (material, potential,
  impedance, stress, two signal axes). Every commit updates all three; the separate dense
  impedance, stress and material-signal arrays, the `Activity` node lists and the transport
  write-back loop are removed. Readers use the projection; restore recomputes it from material.
- The transport pass derives each destination region's candidate groups from neighboring masks
  inside the region job and commits masks, projections, totals and signal changes there.
  Destinations are occupied regions and their four neighbors; emptied regions return to a
  reuse pool.
- Exchange rows and reservoir release commit through one region-parallel batch
  (`Material::commit_batch`); rows of one node keep their order.
- Reservoirs advance in parallel from the frozen field; the medium commit, ledger and ordered
  renewal draws follow.
- Attraction reads material signal from region projections and checks changed inputs in
  parallel. Material changes are tracked per region by the owner.
- Cell motion marks footprint nodes, refreshes dependency anchors and gradients per region in
  parallel, then prepares each cell's coefficients in parallel without mutation.
- Scheduling uses one rule (`parallel::grain`): each task carries at least 20 µs of estimated
  work, and a section with less than two tasks stays on the calling thread. Per-item estimates
  are measured single-worker averages and change only task granularity.
- Node addressing uses a precomputed reciprocal instead of a division per lookup.

Checkpoint layout is unchanged: v40 still stores the derived feature arrays, now written from
material and ignored on load. Same checkpoint and protocol, three repeats:

| Workers | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Before, TPS | 53.5 | 76.2 | 89.5 | 96.5 | 103.0 | 103.6 |
| After, TPS | 51.4 | 80.6 | 104.4 | 121.3 | 131.4 | 136.0 |

A single confirmation run after projections became a pure function of each row (required for
exact checkpoint continuation) measured 51.8/79.5/103.1/116.7/131.0/133.5 TPS, within 4%.
The fitted serial time falls from 7.21 to 4.78 ms (25% of the single-worker tick); the fitted
per-core overhead is indistinguishable from zero. The single-core ceiling rises from about
139 to 209 TPS on this CPU. Population, generation and account residuals match. Remaining
serial time is spread across contact-search membership and pressure scatter, body and
reservoir carrier projection, exchange delivery-link maintenance, interface preparation and
tick bookkeeping, each at most about 0.4 ms.

The fixed 48-founder fixture measures 605–616/544–566/564–565 TPS at 1×/10×/20× area on one
worker, against 679/621/590 before this change: region-level bookkeeping costs 3–10% when there
is little work to parallelize. Peak memory at 20× area falls from 143 to 67 MB because the
area-sized feature arrays are gone. Full-map render and observation return to 21.8/1.2 ms
after reading each site once. The dense 2,000-cell fixture is 52.3/53.3 TPS at 1×/20× on one
worker and 107.0 TPS at 20× with six workers.

The production host has two 18-core sockets with hyperthreading. `compose.yaml` now pins the
container to one socket's physical cores with 16 compute threads, so workers share one memory
node and never share a core with the serial owner. A 32-core measurement remains open.

### Live-world serial removal

The measurements above used the light tick-15000 checkpoint. A checkpoint exported from the
private server (tick 409,584, 2,739 cells, biomass 30,151; ignored under
`frontend/harness/artifacts/live-20260923/`) is the representative workload. On it, timers
around every stage attributed roughly 14 ms per tick to serial code: per-cell carrier deposits
through a hash map, serial footprint-dependency marking, serial delivery-link edits and 16 MB of
per-interval row clearing in exchange, serial contact membership, and serial attraction commits.

- Body and reservoir carriers share one region-major plane. Owners compute their changes in
  parallel; deposits are sorted by region and applied by one job per touched region. A moved
  owner applies one net change on nodes both footprints share.
- Footprint dependencies are marked in dense per-region atomic masks; each region job derives
  footprint neighbors from those masks. No pass visits unmarked geography.
- The exchange delivery transpose and contact-search bins are rebuilt in parallel from sorted
  (node, owner) pairs into flat tables with dense node lookups. Donor rows are cleared by the
  projection job for exactly the groups its receivers request.
- Attraction input, x-pass and output are dense region-major planes. Pending regions are
  visited through disjoint references; the input check and both passes write their own slots.
- Field destination clearing, exchange request clearing, contact allocation, per-cell signals
  and basal maintenance run in their owners' parallel jobs.

Dense lookup tables and planes cost a few megabytes at the default area. Peak process memory on
the live checkpoint stays about 550 MiB for every version, dominated by the loaded world.

Live checkpoint, ten warm-up and 100 measured ticks, median TPS:

| Build | 1 worker | 4 workers | 6 workers |
| --- | ---: | ---: | ---: |
| `b224525`, currently deployed | 15.6 | 21.4 | 21.9 |
| `6209b8b`, region-owned commits | 18.8 | 41.3 | 46.5 |
| This change | 20.1 | 54.4 | 63.7–64.8 |

Accounts and population match across builds. The fitted model on this six-core desktop gives
41.1 ms of parallel and 8.8 ms of residual time per single-worker tick. That residual includes
the lower all-core clock, memory bandwidth in exchange rows and uneven region sizes, not only
serial code; the explicitly serial sections left are each below about 0.3 ms. The model predicts
about 72, 82 and 88 TPS at 8, 12 and 16 workers on this CPU, still rising at 16. The server
therefore keeps 16 pinned workers; slower Xeon cores will lower every figure.

The 48-founder fixture runs 560/495/509 TPS at 1×/10×/20× on one worker against 605/544/564
before this change: sorting and region bookkeeping cost about 0.2 ms per tick when there is
little work. The light checkpoint reaches 159 TPS with six workers.

M0–M3 are complete locally. `make ci` passes: 320 Rust tests, 79 frontend tests, serial/threaded
WASM builds, ownership/storage guards, type/lint/format checks, docs and Terraform formatting.
The registered server publication benchmark remains ignored by the ordinary suite; the cold
publication measurements above were run separately. Existing frontend warnings and the Rust
WASM atomics warning remain. Root S implementation is complete; P3 deployed operating acceptance,
32-core measurement and human motion review remain open. P4 terrain/climate remains separate.
This work does not claim evolved-community results and has not been committed or deployed.

## September 22 correction: simple circular contacts

The prior completion claim is withdrawn. Persistent spatial tiles and meaningful-change
scheduling were not delivered; compact chemical rows do not fulfill that architecture.
Current authorization completes contact simplification first. Root S remains open for tiles.
Execution branch: `4582f8fa-3491-4d9b-ad23-c246c1201071`.

Replace the sampled contact model with circles. For center distance d and summed radii R,
penetration is max(0,R-d), and contact strength is penetration/R. One undirected overlap
serves both cells; soft separation follows the center line with equal opposite contributions.
At coincident centers there is no invented heading-based direction. Heading does not enter
contact geometry, pressure, contact sensing or the exposed chemical mixture. Existing four
contact input slots receive equal shares of scalar crowding; no neural schema expansion.
Contact chemical readings are isotropic. Existing permeability through damage and paid
transport remains; transfers debit actual donor inventory. There is no contact sample lattice,
angular moment, shared-site chemical pool, or near/shared evaluation split.

1. Replace geometry and all consumers in contact/prepared/interface/exchange modules; delete
   contact quadrature. Keep existing local circle search and chemical/funding laws.
2. Check circle boundaries, arbitrary frame/heading invariance, reciprocal separation, donor
   contention and no self transfer. Compare ordinary World at 1×/20× with the prior sampled
   implementation: seed101, 10 warm-up plus 100 measured ticks, 60 seconds per case, one worker;
   repeat concentrated 2,000-cell 20× at four workers. No ecological campaign.
3. Update current laws, UI meanings and status; run make ci. Existing area-scaling measurements
   remain historical. Genuine all-overlap populations still have pairwise contact cost; do not
   retain elaborate sampling to claim a better worst case or hide that limit.

The sampled contact module and its dense-limit example have been deleted. Ordinary World,
selected-cell inspection, transport and the execution-budget diagnostic use circle contacts.
Inspector input labels now describe equal crowding shares instead of compass-relative contact.

Sequential native release comparison, same registered fixtures and no concurrent build load:

| Workload | Sampled contacts, 1 worker | Circle contacts, 1 worker |
| --- | ---: | ---: |
| 48 founders, original area | 211.4 TPS | 213.5 TPS |
| 48 founders, 20× area | 129.7 TPS | 135.3 TPS |
| 2,000 concentrated cells, original area | 34.2 TPS | 51.2 TPS |
| 2,000 concentrated cells, 20× area | 34.2 TPS | 49.2 TPS |

The enlarged concentrated case reaches 95.2 TPS with four workers. Original-area contact
preparation plus sensing falls from 8.80 to 3.10 ms/tick; exchange falls from 11.65 to
7.91 ms/tick. Endpoint geometry preparation falls from 6.84 to 0.63 ms. These are changed
physical rules from matched initial fixtures, not identical trajectories. The dispersed
2,000-cell fixture measures 55.1 TPS; the earlier sampled measurement was 51.3 TPS and the
pre-structural baseline was 81.2 TPS. Remaining geographic overhead is not solved by contact
simplification. Output preparation remains excluded from stepping and scales with output size.
Raw reports stay ignored under `frontend/harness/artifacts/structural-runtime/` as
`sampled-*` and `circles-*`; there is no new long-run ecological claim.

All 279 Rust unit tests pass, including rotation-independent circle geometry, heading-independent
contact readings, periodic search, changing radii, reciprocal separation, damage-triggered
permeability, simultaneous donor contention and material/work accounts. The former sampled
dense-limit assertion was removed with that rejected algorithm. The old directional-publication
test was changed to test overlap changes, because turning no longer changes contact readings.
Full `make ci` passes, including Rust checks, frontend lint/type checks, both WASM builds,
78 Vitest tests, experiment-storage and documentation checks, and Terraform formatting.
Human motion review remains open.

State: contact simplification implemented, measured and CI-validated. Root S remains open
for tiled execution. No commit, push or deployment in scope.

Updated September 21, 2026 after the user's repeated structural-first corrections.
Sulion root: `e3517c4b-b3df-4786-bcf4-10a488a294d1`.

## Current work order

Replace the execution structures that make meaningful simulation work unnecessarily expensive.
Design ownership, interaction representation, spatial reach, numerical participation and update
scheduling together. The goal remains an evolving, differentiated world at 10–20 times the
current geographic area, with useful browser and native-server speed.

The existing dense buffers, full-map filters, contact representation and phase schedule are
implementation choices to challenge. Faster execution of those choices does not satisfy this
work order. Persistent spatial tiles with local update limits are required. Retaining all
existing operators inside tiles is insufficient. Address structural costs before tuning loops.

The previous plan is preserved unchanged as
[historical evidence](docs/sources/history/2026-09-21-scaling-before-structural-correction.md).
Its dense-layout-first sequence, unchanged-equation restriction and dated experiment instructions
are superseded. Read specific historical sections when needed to understand a failed approach;
do not load or execute the entire old work order by default. The ended
[mature performance investigation](docs/plans/MATURE-PERFORMANCE-PLAN.md) is also historical.

## Requirements and implementation freedom

Preserve the [principles](docs/principles.md), the chemical transformation algebra, explicit
material/work accounts, funded local organisms, evolvable genomes/RNNs and
[data ownership](docs/design/chemistry/data-ownership.md). Physical and environmental effects
must remain conditional opportunities rather than prescribed roles or desired community shapes.

Numerical distance limits, concentration/participation thresholds, temporal resolution and
shared aggregate interactions are legitimate design choices. Select them from the common
mathematical model and their ecological consequences. Each must state its affected quantity,
units, approximation, accounting and how meaningful activity re-enters computation.
Exact trajectories, old save layouts and replayability are not acceptance requirements.
Do not weaken chemical symmetry or ownership to avoid engineering the replacement.

Do not rewrite unrelated working systems. Replace the connected owners and consumers needed
for the selected structural improvement; preserve unaffected mechanisms. One production
implementation serves browser and native execution. The installed thread pool is available
to the replacement architecture, not a reason to preserve the old one.

## Structural obligations

Before kernel changes, select a coherent replacement and record:

| Decision | Required substance |
| --- | --- |
| Work and ownership | What is stored, what owns writes, and how cost follows meaningful chemical support, interaction neighborhoods and organisms |
| Spatial influence | Support or justified truncation for each interaction; affected neighborhoods, periodic seams and propagation into previously inactive regions |
| Magnitude | A shared resolution rule with explicit treatment of omitted effects; accumulating meaningful material must wake computation |
| Time | What change makes a result stale, what forces a refresh, and how external forcing and slow accumulation are included |
| Dense communities | How cost behaves when neighborhoods fill; no arbitrary neighbor quota, population reduction or discarded contention to manufacture speed |
| Integration | Which current algorithms and callers are replaced, including observations, borrowed rendering and explicit exports |

Known production defects include full-map attraction scans/filtering after local changes,
area-sized field bookkeeping and dense material allocation for empty space. Those are starting
evidence, not the complete scope. Inspect biological/contact/exchange structures as well; the
objective includes the populated world, not just cheap empty geography.

A cache counts as structural work when it changes ownership and invalidation so unnecessary
computation disappears. Adding another cache around the same mandatory global traversal does not.
An intermediate threading or arithmetic improvement cannot close these obligations.

## Execution and completion

1. **Select the structural replacement.** Use existing measurements and a bounded inspection
   to identify avoidable work. Compare algorithmic alternatives, select shared bounds and
   write the owner/dependency model above. This phase ends with an implementable decision,
   not another list of possible optimizations. Ordinary engineering decisions need no new
   user approval.
2. **Replace production geography and interaction execution.** Implement the selected ownership,
   support and scheduling through ordinary consumers. Remove the replaced production path;
   do not retain an accelerated legacy path as the default. Include the required neighboring
   regions and invalidation sources. Numerical-law changes belong to this implementation,
   with their costs and opportunities checked.
3. **Complete populated-world integration.** Address the selected contact, exchange and cellular
   work structures, dense-neighborhood limits, external forcing and observations. Do not stop
   at an empty-field demonstration or leave a necessary consumer on the old representation.
4. **Establish the delivered outcome.** Use the existing bounded harness for fixed occupied
   patches at 1×/10×/20× area and populated/dense cases. Separate adding empty space from adding
   actual organisms, sources and chemistry. Record whole-step cost, recurring work, memory and
   observation costs. Check seams, funding, accounts, reactivation and intended opportunities.
   Run required CI. A failed structural prediction reopens the selected architecture; it is
   not permission to replace the goal with incremental speedups.

Do not launch a long ecology campaign to validate this engineering change. Use short mechanism
checks and bounded representative continuations; historical source-free 100-tick fixtures alone
cannot establish a populated large-world result. Decide case budgets from existing evidence
before execution. Use available hardware for architectural work; lack of 32-core measurements
does not justify postponing work elimination.

The minimum operational target remains 30 ticks/second on declared representative workloads.
A percentage improvement or crossing that floor does not excuse missing structural obligations.
Do not promise zero cost for additional populated ecology or certify behavior the user has not
reviewed. No tuning, fan-out benchmark campaign, terrain feature or save-compatibility project
should displace the current structural work.

## Multicore design

The same Rust World already supports a persistent Rayon pool, exclusive writes, joined phases
and borrowed local rendering. Browser 1/4 and a native 32-thread host are implemented.
The private HTTP management API is deployed. Public VPN routing remains disabled.

Historical P0–P2 describe delivered threading components, not completion of structural scaling.
The Sulion root now carries explicit pending structural implementation before P3 operating
acceptance. P3 must assess that replacement, not merely remeasure the old dense implementation.
P4 terrain remains separate future work; the [light ecology design](docs/design/light-ecology.md)
and other environmental backlogs retain their scope.

Earlier measurements remain evidence, not acceptance of this replacement: the default-area
2,000-cell browser fixture reached 124.36 ticks/s with six workers; the sparse 20×-area fixture
reached 45.89. A historical mature native fixture reached 18.53/36.98 ticks/s at one/six workers.
These differ in workload and exclude parts of live observation. The archived plan records their
conditions and negative findings. Current server deployment does not establish 32-core scaling.

## Context handoff

Start future performance work with the primary structural rule in `AGENTS.md`,
[principles](docs/principles.md), this current work order and the governing mathematical/ownership
contracts. Read source and targeted historical evidence to answer a named design question.
Past assistant promises, completed threading phases and old patch queues have no authority to
narrow the user's structural-first direction.

## Selected replacement and execution record

Execution subplan: `5fed34e4-5c94-40d9-9fd8-2f9f66ce5172`.

1. Geographic material is a compact owner of occupied 256-chemical rows, indexed by geographic
   node. Empty nodes share an immutable zero row. The destination owner contains only the active
   support plus its four-neighbor halo; zero output rows are reclaimed. Scalar geographic
   indices remain area-sized, but no recurring chemical traversal visits empty map strips.
   Material remains continuous in amount and discrete in chemical identity.
2. Mechanical signals own their support and revisions at writes. Attraction operates on that
   support and its finite convolution halo, rather than discovering changes with a map scan.
   The two normalized, signed, three-box kernels retain their existing meaning and periodic
   symmetry. No environmental wells or global force approximation is introduced.
3. Concentration resolution remains the common extracellular floor, in material per area.
   Removed material and potential remain numerical ledger losses. Deposits always allocate and
   wake their destination; diffusion wakes adjacent destinations. Coefficient preparation uses
   the shared normalized resolution, with accumulated change measured against its last anchor.
   Illumination continues to update from its external clock, independently of cell movement.
4. Contact uses a sparse shared quadrature, with spacing `h = mesh × RESOLUTION`. Each body
   deposits a radial tent of radius `sqrt(r² + h²/2)` and normalizes its weights in L2.
   Thus `K = W Wᵀ - diag(W Wᵀ)` is symmetric, nonnegative off the diagonal, and has compact
   support. The `h²/2` term resolves bodies smaller than a quadrature cell without losing them.
   This replaces linear pair penetration with overlap of finite body profiles. Sites touched
   by one body cancel against the diagonal and are removed. For material evaluation only,
   sites touched by at most eight bodies compile into short neighbor rows; higher-degree
   sites remain factored. This is an algebraic evaluation choice with the same weights,
   not a neighbor quota. Explicit entries are bounded by seven per footprint incidence.
   Pressure always uses site reductions. Cost follows footprint incidence, including when
   many bodies coincide, rather than requiring a complete dense contact graph.
   Crowding is `1/(1+K1)`. At each shared site, pressure uses the weighted displacement from
   its body centroid, normalized by twice the largest contributing radius. Opposite pair
   contributions cancel; self contributions are removed. The existing duration-based
   relaxation remains. Exact coincidence has zero passive direction; voluntary motion can
   break it. Directional receptor moments use the same bounded local displacements.
   Material uses `Wᵀ` demand scatter and `W` supply gather, subtracting every cell's own
   contribution. Each individual donor still reserves own export and all foreign demand
   against its frozen inventory; individuals retain distinct exposure and funded requests.
   This changes the geometric contact kernel, not chemical transformations or organism roles.
5. Rendering retains borrowed Rust-owned presentation buffers. Chemical observations iterate
   owned rows. Explicit exports serialize the new owner; no legacy checkpoint adapter is required.
6. A base step freezes its mechanical convolution after projecting current bodies. Sources,
   field transport and movement consume that same force evaluation; they do not repeatedly
   solve attraction after each other's writes. The next base step sees all committed changes.
   This is an explicit integration boundary, not a wall-clock delay. Standalone field assays
   still prepare their own stages. Motion coefficients query dependencies only at actual
   body footprints and their gradient neighbors. A full-map dependency scan was found during
   integration and removed; previously visited anchors retain cumulative small changes.

Validation registration: bounded engineering workloads, seed 101, one native worker first;
fixed occupied patches and unchanged sources/cells at 1×, 10× and 20× area; a 2,000-cell ordinary
fixture and a concentrated colony. Ten warm-up ticks and at most 100 measured ticks per case,
60 seconds per case. Include field support, allocated bytes, contact work and full presentation
cost separately. Compare before and after on identical initial fixtures, not identical trajectories.
No population campaigns or seed sweeps. Invariants cover seams, empty-region activation, signed
mechanical symmetry, material/work closure, donor contention and observer independence.

Additional bounded dense-limit check: two zero-tick fixtures with 512 and 2,048 coincident,
funded bodies, one worker, one evaluation each. Compare retained exact-pair discovery with
the installed shared operator, reporting actual pair/incidence counts and preparation time.
This distinguishes the asymptotic dense limit from the 100-tick colony, which spreads during
integration. It cannot substitute for whole-step measurements. Final native measurements use
one/four workers on this six-CPU environment; no 32-core scaling claim is made.

The final area comparison also checks the concentrated 2,000-cell fixture at 20× area,
with one/four workers and the same 10/100-tick and 60-second limits. This checks whether
the combined populated and geographic workload still meets the declared floor.

## Delivered measurements and limitations

Sequential release-mode measurements on September 21, 2026, six available CPUs, no concurrent
build/test load. Each whole-step case used seed101, ten warm-up and 100 measured ticks. The
before executable was retained before kernel edits; after uses the ordinary World entry point.
Sources and initial occupied patches retain their original coordinates as area increases.
Changing periodic dimensions changes some seam neighborhoods; these are identical initial
fixtures across before/after, not identical trajectories across map sizes. The independent
fixed-support invariant test establishes equal recurring support at 1×/10×/20× away from seams.

| Initial workload | Area | Before, 1 worker TPS | After, 1 worker TPS | After, 4 workers TPS |
| --- | --- | ---: | ---: | ---: |
| 48 founders, 48 sources | 1× | 292.0 | 214.4 | — |
| Same original patches | 10× | 44.4 | 138.2 | — |
| Same original patches | 20× | 20.6 | 129.5 | 134.0 |
| 2,000 varied cells concentrated in a 4×5 region | 1× | 50.1 | 34.8 | 53.7 |
| Same concentrated population | 20× | 21.1 | 34.5 | 53.1 |

The existing dispersed 2,000-cell fixture measured 51.3 TPS after, against an earlier 81.2 TPS
baseline in this session. It is a regression, as are the original-area rows above. Shared
quadrature pays more preparation overhead in moderate neighborhoods; the change is justified
by bounded dense interaction work and removal of geographic scaling, not universal speedup.
No population or neighbor quota was introduced. The changed overlap and pressure law needs
human motion review; passing accounts and symmetry tests does not certify colony appearance.

Peak resident memory for the first three one-worker cases fell from 88.3/660.4/1304.3 MiB to
28.8/108.5/186.0 MiB. The concentrated original-area case fell from 246.0 to 220.6 MiB.
These are process high-water measurements, including construction and final diagnostics;
the new runner additionally constructs contact probes. At 20×, 3,036 chemical rows were owned
out of 384,000 geographic nodes. Both material buffers and their indices occupied 11.0 MiB.
Scalar lookup arrays, presentation buffers and startup allocation still scale with area.
This is sparse chemical storage, not a claim of zero memory cost for empty geography.

Full packed Rust overview preparation at 20× fell from 31.7 to 21.1 ms; chemical observation
fell from 33.3 to 1.0 ms. The table excludes observation and display costs. A full overview
remains proportional to output area and is not a free per-tick operation. GPU upload, browser
pacing, network spectators and days-long memory growth are not measured by these native cases.

The zero-tick dense-limit check increased coincident bodies from 512 to 2,048: shared sites
remained 21, footprint incidences increased from 10,752 to 43,008, and no explicit neighbor
entries were created. Quadrature preparation took 1.36/3.32 ms; full interface preparation,
including its own geometry, took 3.97/13.82 ms. The retained exact-pair discovery alone created
130,816/2,096,128 pairs and took 3.34/53.54 ms. Those discovery timings are a lower bound on
the old full contact pipeline, not a whole-step comparison. This confirms the selected dense
cost law, while the whole-step table records its moderate-density cost.

Intermediate approaches retained as negative findings:

- Direct support scattering multiplied finite convolution work by kernel width. Event sorting
  and per-node intervals also imposed excessive overhead. The installed rolling sums operate
  on unions of occupied 32-node line blocks with the original kernel weights.
- A fully shared chemical pool at every contact site regressed the concentrated case to about
  21 TPS. Private-site cancellation, sparse-neighborhood algebraic compilation and direct
  recognition reductions removed unnecessary site chemistry without dropping interactions.
- Sparse material alone left a full-map motion-dependency scan and repeated mechanical solves.
  Query-owned dependencies and one frozen mechanical stage removed those remaining traversals.

Raw outputs remain ignored in `frontend/harness/artifacts/structural-runtime/`, principally
`final-before-*`, `final-after-*`, `final-capacity.json` and `final-contact-limit.json`.
Reproduce with `structural_capacity AREA ordinary|dense WORKERS OUTPUT`,
`parallel_capacity WORKERS OUTPUT`, and `contact_quadrature_capacity OUTPUT` release examples.
Do not promote the raw run logs or checkpoints into the tracked experiment ledger.

Validation covers chemical group actions, reciprocal contacts, periodic seams, newly occupied
destinations, reclaimed material accounting, single-cell self exclusion, individual frozen
donor caps, paid physiological opportunities and observer independence. Physical checkpoints
now use v36; v35 restoration is explicitly rejected. The report reader accepts v36 observations.
`make ci` passed: 280 Rust unit tests, eight server tests, 17 chemical-definition integration
tests, 78 Vitest tests, serial/shared WASM builds, Clippy, TypeScript, formatting, documentation,
experiment-storage and Terraform-format checks. ESLint retains 19 existing warnings and the
shared WASM build retains its compiler warning about unstable atomics support. Earlier CI
failures exposed stale checkpoint-version assertions and a Python reader whitelist; those
consumers were corrected and the complete command rerun successfully.

The structural implementation meets its selected work bounds and declared native stepping
floor. Root P3 retains live operating acceptance and human motion review; P4 terrain/climate
remains separate future work. Neither 32-core scaling nor long-horizon ecology is certified.

Status: all four structural execution phases completed locally. No commit, push or deployment
was requested for this implementation turn. Root P3/P4 remain open as described above.
