# Digital chemistry reliability and validation plan

September 14, 2026. Sulion plan `a3da6ddc-b43a-46bb-a42c-e63d140ed830`.
Status: superseded by the September 15 [numerical restart](../../../DIGITAL-CHEMISTRY-PLAN.md).
Human motion/legibility and user-device acceptance remain unperformed and carry into
replacement acceptance. The original crash remains unattributed. The following body
records the prior implementation and its evidence, not work to resume or certification
of a replacement engine.

Prior implementation and measured operational checks were complete. Batched rendering repairs the
2,000-cell browser failure; periodic-index optimization restores the growth workload's margin.
The performance sub-plan is closed. Human motion and user-device acceptance remain unperformed.
See [execution evidence](reliability-results.md).
This plan owns the follow-up to the
code/evidence audit and the user's reported browser failure. It does not claim that
previous implementation completion established operational readiness.

## Outcome and boundaries

Deliver a digital chemistry world whose opportunities are credible and whose runtime
lets the user observe an unfolding experiment over long periods. Diagnose and repair
the browser failure, finish migrated observation tools, and resolve the specific
chemical and evolutionary questions below through small causal checks.

Preserve the [data ownership contract](data-ownership.md): Rust owns physical state,
the same worker renders borrowed WASM views, ticks use scalar exports, and React
receives bounded observations with revisions and backpressure. New diagnostics must
not create population/private-state mirrors or serialize fields for rendering.
Checkpoint copies remain an explicit cold path whose peak cost must be measured.

Keep 48 default founders in at least two colonies, local resource-funded reproduction,
generic chemistry and local RNN decisions. Numerical methods and parameters can change
when justified by the experiment's semantics. Do not reduce population to meet timing,
delete genealogy to bound memory, or install a diagnostic winner as the founder.

The user explicitly excludes earlier-save compatibility. Do not implement an adapter
or spend an implementation phase making old v10 artifacts load. Correct format identity
when the next format changes so incompatible files fail clearly. Same-build recovery
and preservation of a current run remain operational requirements; whether automated
saving contributes to this crash is still an open diagnostic question.

Execution is authorized. No new development server, external publication, new backend,
branch, commit or push is part of this work.

## Evidence at entry

| Evidence | Meaning and limit |
| --- | --- |
| User reports 48 cells declining to about 20 until approximately 90k ticks, then increasing to about 70 through approximately 250k ticks, followed by a browser crash | A long-lived observed population and a rebound worth investigating. Exact build, settings, genealogy, cause of rebound and crash cause are unverified. Do not substitute the older 600-tick test for this observation. |
| Local screenshot `.sulion-paste/paste-2026-09-14_17-33-07-771Z.png` | Gray failed-page image with no error code, stack or memory measurement. It cannot establish OOM, a WASM trap or a graphics-driver failure. |
| Audit ledger 3684–3687: four 300-tick allocation probes | Equal total funded machinery and supplied matter produced source-dependent construction advantages: 0.681 versus 0.402 on chemical 0, and 0.395 versus 0.637 on chemical 96. No divisions; this is a constructed tradeoff, not evolved adaptation. |
| Audit ledger 3688: ordinary 600-tick startup | 48 to 36 living cells, one division, 13 deaths; two daughters observed for only 25 ticks. Sampled cells and accounting match the earlier startup. Does not establish descendant recovery or repeated reproduction. |
| `evolve_report.py` versus `longRun.ts` | Reader expects `samples.json` and old trait shapes; producer writes schema-v3 `samples.jsonl`. Current-format sample root is rejected. |
| `World::retool` | Any changed machinery slot loses its installed stock to local decomposition before rebuilding. Accounting is paid, but a tiny gene change can cause a large immediate loss of function. Its evolutionary effect is unmeasured. |
| `Chemistry::new` | Diffusion coefficients exactly negate impedance coefficients before normalization; these properties are perfectly coupled. Default sources 0 and 15 differ approximately 86-fold in diffusion. The allocation probe used 0 and 96. |
| Capacity ledger 3681–3683 | Means 218.5, 61.1 and 33.8 ticks/s for 48, 2,000 and growing 2,000-cell workloads. GPU execution and React rendering excluded; these are not browser endurance measurements. |
| Fresh audit CI | 40 Rust and 46 TypeScript tests pass, with 14 nonblocking lint warnings. Earlier-v10 restoration and the report consumer still fail outside those tests. |

Generated audit artifacts remain under `frontend/harness/artifacts/chemistry-status-*`.
Archive the relevant reports and executable digests when updating durable evidence;
do not fabricate raw observations of the user's browser run.

## Phase 1: Identify the long-session failure

Establish browser/version, device, site/build, configuration, speed and selected panels
from available evidence. Ask only for facts unavailable locally. Read any voluntarily
provided browser crash details; do not search unrelated browser data or demand a rerun
of the lost experiment. Preserve available recoveries and artifacts without modifying
the user's running session or clearing storage. A saved state, if available, is an
optional diagnostic input, not a requirement to begin the investigation.

Trace lifetime and ownership across `Session`, worker scheduling, WASM allocation,
population/ancestry retention, census, selected inspection, history publication,
WebGL resources, package compression and IndexedDB retention. Existing count limits
do not prove bounded peak process memory. Distinguish retained live data, reusable
capacity, allocation churn and temporary peaks; WASM high-water memory alone does
not establish a leak. Small living populations can have accumulated history.

Use bounded operational fixtures on the production owners: 48/70 living cells with
increasing ancestry, mature chart/event history, repeated observation and selection,
repeated saves and rendering. Freeze or restore physical inputs when isolating an
observer cost. Do not evolve 250k ticks merely to fill a buffer. Compare the same
workload with one subsystem isolated at a time; disabling a subsystem is a diagnostic
control, not an accepted product repair.

Start with at most four differentiating cases, each capped at 120 wall seconds and
200 repetitions of the suspect operation. Record allocated WASM bytes, available
JS/process memory measures, retained record counts, operation times, reply sizes,
graphics resource counts, save sizes and in-flight operations. Mark unavailable
measurements explicitly. Add small bounded local failure breadcrumbs if necessary;
do not build a second telemetry pipeline or send data off-device.

Exit: a reproducible failing path or a narrowed, evidenced failure class with a
specific next test. If the original crash remains unattributed, say so. Finding an
independent leak does not prove that it caused this screenshot.

## Phase 2: Repair the demonstrated runtime failure

Repair the responsible owner, resource lifetime, allocation pattern or error path.
Measure repeated operation and accumulated-state peaks before and after. Include
save/compression/storage overlap, slow consumers, context loss and worker failure
when the diagnosis implicates them. Preserve diagnostic content through bounded
queries and retention semantics; keep full scientific parentage behind Rust.

Known resource limits should cause an actionable pause while the process is still
healthy. Do not assume a JavaScript catch can recover a terminated browser process.
Retain the last valid same-build recovery when writes fail, avoid failure/retry loops,
and verify that surviving controls can inspect or export a paused live world.

Exit: a regression that fails for the demonstrated defect and passes after repair;
stable retained resource use on a fixed workload, explained peaks, unchanged physics
for runtime-only changes and preserved ownership guards. Do not claim the reported
browser crash fixed solely because headless CI passes.

## Phase 3: Complete reports and diagnostic continuity

Repair the evolution reader for streamed schema-v3 samples, actual inherited traits,
empty/incomplete runs and explicit physical schema rejection. Test the actual evolve
producer against its report on a short generated artifact; do not use a generic
population table as the replacement for trait distributions or frequency histories.
Retain historical readers only for their documented read-only purpose.

Finish the missing capabilities in [diagnostic continuity](diagnostic-continuity.md):
recent behavior windows; inherited sequence and founder-relative comparisons;
population RNN divergence; developed-body and acquired-learning summaries;
source-epoch/task summaries; and longitudinal chemical phenotype observations.
Define denominators, sampling, retention and missing coverage. Keep grouping
descriptive, preserve genealogy/navigation and independent controls, and avoid
imposing a fixed number of ecological strategies.

The user's rebound motivates being able to relate demographic change to inherited
traits, resource access and local populations. It does not authorize a campaign to
prove its cause without the run's evidence. Any ancestor/descendant comparison must
separate inherited changes from actual body funding, private state and environment.

Exit: current producers and semantic report/display consumers agree on real fixtures;
historical and current schemas cannot silently mix; observation-cost and sharing
tests include the restored features. Update the migration coverage table honestly.

## Phase 4: Validate accessible inherited change

Use a common funded parent to produce unchanged and minimally retargeted daughters.
Separate slot target changes from investment changes, enzyme-offset changes, private
learning and inherited learning. Track stock retirement, retained inventory, sensor
or transport capacity, rebuilding cost/time, injury, net growth and next division.
Include empty-resource controls to distinguish initial reserves from resource-funded
continuation. Do not grant mature machinery to the mutant daughter.

Start with at most six paired comparisons, seed 101, at most 600 ticks and 30 wall
seconds per arm, stopping earlier on death or the declared lifecycle event. Choose
slots from the actual startup genotype and state the causal prediction before each
case. Missing next division at this horizon is unresolved, not permission to extend
automatically. A longer lifecycle follow-up requires an explicit budget and reason.

Decide whether wholesale retirement matches local-mutation semantics. If it blocks
otherwise useful changes, implement a coherent paid turnover/inheritance model and
test conservation, old/new machinery identity, birth funding and small-change
behavior. Do not simply waive construction cost or tune mutation until mutants win.

Exit: the cost and functional effect of nearby inherited variation are measured;
retain or revise the model with a recorded rationale. Demonstrate an accessible
funded lifecycle opportunity, not widespread adaptation or coexistence.

## Phase 5: Validate chemical space and ordinary habitats

Evaluate joint property coverage, not just independent minima/maxima. Read the
original [proposal](sources/chemistry-proposal.txt) and
[appendix](sources/migration-proposal.txt) against the implemented smooth manifold.
Measure the restriction imposed by exact diffusion/impedance coupling and decide
whether the intended chemistry needs additional combinations. If revising generation,
preserve deterministic coefficients, smooth locality, useful potential/stress ranges
and high-impedance/low-diffusion neighborhoods without selecting seeds for outcomes.
Validate general laws and neighbor/affinity behavior across fixed seeds.

Test the actual default source pair and release geometry. Compare local reading,
uptake conductance, paid processing, retained material, repair and growth; source
energy alone does not establish accessibility. Probe resident, near-gap and empty
conditions with ordinary controllers. Start with at most six 600-tick cases, seed 101,
30 wall seconds each; alter one mechanism per causal comparison. Keep the prior
allocation reversal as a reference, not evidence for the different default pair.

Retune only where a measured mechanism contradicts the intended opportunity. Preserve
a genuinely large, uneven world with consequential but possible travel. No target
population rebound, species count, obligatory barrier strategy or evolved founder.
Cross-feeding, detectable emission and detoxification retain their prior limited
claims; do not repeat every mechanism campaign unless a changed law affects it.

Exit: a justified chemical-space decision and measured ordinary local growth/travel
opportunities, with negative findings and unresolved ecological outcomes preserved.

## Phase 6: Verify integrated operating limits

Run the registered 48/2,000/growth capacity checks with full diagnostic preparation
after relevant changes. Separately measure the real worker, React, GPU and recovery
path using the existing server where accessible; do not start another server. Use
an isolated test session and operational fixtures, not the user's live experiment.
State browser/device/build and distinguish throughput, display latency and save pauses.
Require at least 30 ticks/s on declared foreground workloads, with memory, sampling
and timing conditions attached. No founder reduction or hidden physics simplification.

First repeat the causal failure fixture. Then use one bounded operational soak:
30 wall minutes maximum, or stop sooner on a crash, invariant failure, unexplained
memory trend or declared budget breach. Use synthetic accumulated state and repeated
production save/observe/render operations to exercise duration costs without requiring
an evolutionary discovery run. Do not extend the horizon automatically. Separate
intentional ancestry growth from leaks and explain measured peak memory headroom.

Cover history thinning/event rollover, selected living/dead genealogy, slow message
acknowledgment, repeated save retention, failed storage writes and graphics/worker
failure handling. Verify the restored diagnostics as part of the load. Synthetic
checks do not certify days/weeks endurance; a real-browser test cannot be replaced
by fake WebGL/IndexedDB assertions in the completion record.

Exit: the demonstrated failure is resolved under the tested conditions, limits are
explicit, and there is browser evidence for the integrated workload. If the target
browser cannot be inspected, keep that acceptance item open and identify the smallest
remaining device check rather than declaring the entire plan complete.

## Phase 7: Reconcile evidence, documentation and acceptance

Update current contracts after implementation, linking exact source/binary provenance,
positive and negative results, browser limits and any remaining causal uncertainty.
Keep implementation, constructed opportunity, observed adaptation and operational
readiness as separate claims. Run `make ci` and `make build` for the final changes.

Read the remaining bodies of the older chemistry plan
`d80ddca6-d78c-4f29-ac65-1164fe8ba5a8` and the Rust/diagnostic/sharing plans before
disposing of obligations. The old chemistry plan's remaining product integration,
motion/legibility and browser acceptance belong to phases 3, 5 and 6 here. Historical
TypeScript timing/codec choices do not govern this runtime. Do not mark an unperformed
acceptance check completed merely because a replacement implementation exists.

Maintain the Sulion phases as work proceeds. Branch multi-step prerequisite repairs
from blocked phases, return when they land, and close this plan only when its required
work has evidence. Earlier-save compatibility is excluded by the user's decision,
not recorded as successfully repaired. Broader evolutionary outcomes remain the
subject of the user's continuing experiment.
