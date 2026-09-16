# Reliability execution evidence

The September15 [fresh-core results](rebuild-results.md) govern the replacement simulation.
The measurements below retain their original binary/schema scope. Renderer/recovery obligations
and the unattributed original crash carry forward; these timings do not certify the fresh core.

September 14, 2026. Work is in progress under the [reliability plan](reliability-plan.md).
This record supersedes broad readiness claims inferred from earlier headless checks.
The user's lost browser run remains an observation without a recovered causal trace.

## Failure paths and operational limits

The screenshot contains no error code or memory reading. The reported 48 → 20 → 70
population history over roughly 250,000 ticks is preserved as the user's observation;
it does not by itself establish adaptation or identify the crash cause.

Two independent defects were reproduced:

- Concurrent manual saves could allocate two snapshots/compressions at once. The cold
  path now serializes save, export and restore before snapshot allocation, bounds queued
  requests, and skips overlapping automatic requests. A failing regression now passes.
- A fixed 70-cell, 100,000-ancestor detached-canvas browser workload accumulated GPU
  process memory while WASM allocation stayed at 125,763,584 bytes. GPU RSS increased
  from about 215 MiB at one minute to 477 MiB at two minutes, crossing the declared
  growth limit. A completion fence now permits at most one submitted frame. The same
  three-minute workload completed with GPU RSS around 143–144 MiB at two/three minutes.

Neither defect is attributed to the user's crash. An eight-run local health record now
preserves build, tick, population, retained counts, allocation and reported faults.
Export runtime report works without asking the simulation worker for bulk state.
No data leaves the device. Browser-process termination can still preclude a final write.

An isolated actual-browser fault check (`reliability-browser-faults-01`) deliberately lost
the WebGL context at tick 416. The worker paused, exported a 670,329-byte current package,
restored the context and recovered the saved tick with no remaining error. An injected uncaught
worker error then left the runtime-report control available. The Bridge now terminates a failed
worker so it cannot keep advancing behind a stopped display. Unit tests also cover retained saves
after failed writes and rejection of queued operations.

The four initial fixed-operation cases (`runtime-baseline-02`) completed 200 observation
or render operations and 100 serial saves. Their flat WASM allocation did not predict
the later GPU-process growth. The first duration run stopped at its declared memory
limit (`reliability-soak-01`). The repaired three-minute repeat is
`reliability-gpu-fence-01`. A later run (`reliability-soak-02`) lost its test page to the
development server's reload during edits; its approximately two-minute record is
incomplete, not a completed endurance test or a simulated ecological failure.

The final fixed-state run (`reliability-soak-03`) completed 1,800.038 worker wall seconds:
70 living cells, 100,000 synthetic ancestors, mature bounded observation history, more than
14,600 observation/render attempts and 49 completed saves. WASM allocation remained
125,763,584 bytes. Between two minutes and the end of active work, GPU RSS stayed within
109.4–110.7 MiB; the largest renderer-process RSS peaked at 297.2 MiB. The two-second monitoring
tail is outside the worker workload. No crash or declared memory-growth breach occurred.

This final fixture used a bare same-origin document supplied inside CDP to avoid Vite hot reloads;
it did not also initialize an unused SPA world. Its absolute process footprint is therefore not a
paired comparison with the earlier SPA-hosted fixture. The three-minute before/after test supplies
that comparison. The duration fixture repeatedly uses production owners on fixed physical state;
it does not exercise ecological growth, tab suspension or the user's graphics driver.

Browser tests use isolated Chromium profiles and the existing local server, with
software graphics. They do not inspect, clear or replace the user's browser storage.
An actual application test initialized 48 cells, selected a cell, expanded diagnostics,
advanced the worker, rendered the world and saved through IndexedDB. Larger actual
browser fixtures exposed a throughput gap. Headless capacity is not substituted for that
missing acceptance.

### Foreground application performance

Chromium 151.0.7922.34, 1440×1000 viewport, 1027×755 world canvas, software WebGL,
ordinary layers, selected cell 1 and 25 expanded diagnostic sections were exercised through
the actual page, Bridge, worker and IndexedDB. The ordinary 48-founder world advanced 332
ticks, with steady publication samples at 138–154 ticks/s and ongoing frame submissions.
Pausing followed by a manual save completed in 309 ms including the preceding automatic save.

Before the batched-rendering repair, the 2,000-cell varied fixture remained around 11 ticks/s.
A browser trace records 28 implicit
`GLES2::ReadPixels` calls on the dedicated worker consuming 7.605 seconds. There is no
`readPixels` call in Antropy's implementation. Worker CPU sampling mostly reported idle while
these graphics calls waited. The machine has no `/dev/dri` hardware graphics device. This is a
measured presentation cost in the tested software path, not evidence of a new physical-state copy
in the application and not a diagnosis of the user's browser crash. Treating the lack of a hardware
GPU as a stopping point was premature: subsequent layer isolation identified a repairable renderer
submission pattern.

Simulation now yields through one queued task; main-thread animation requests permit only one
unanswered frame command. Actual drawing and borrowed views stay in the WASM-owning worker.
Unchanged camera messages do not redraw. An apparent speedup with worker animation callbacks
was rejected because frames stopped. A draw-submission reduction also failed to improve this
limit and was removed. Disabling rendering was a diagnostic control only.

Headless ledger 3726–3728 includes the new census/inspection and render preparation: means
214.4/59.1/34.0 ticks/s at 48/2,000/2,000-growth, lowest windows 197.0/57.6/30.3, exact restore.
Those measurements preceded the continued renderer and spatial-index work below. The original
screenshot still has neither device identity nor a causal trace.

The pre-repair production build repeats the limit: its varied case reaches tick 104 with most steady
publication samples near 11 ticks/s. A funded 2,000-cell start reaches tick 108 after 2,000
divisions and ends with 1,631 living cells; it also fails 30 ticks/s. These capacity fixtures
include explicit initial grants and are not ecological populations. The application checks include
CPU profiling and startup/cold costs, so they are separate from the warmed headless benchmark.
The final varied-build record archives its binary and observed source digest; earlier exploratory
application profiles did not archive the executable and retain that provenance limitation.

### Continued renderer and spatial-index repair

Two layer-isolation controls kept the full 2,000-cell physics and ordinary field active. Omitting
only source/death markers left the approximately 11–12 tick/s limit. Omitting cell geometry raised
steady throughput to 52–58 ticks/s. Neither omission remains in the application.

Cell and marker geometry now uses batched triangles addressed into a GPU record texture rather
than thousands of tiny instanced meshes. Uploads remain borrowed WASM views; row boundaries use
subarray views, not a padded CPU copy. The same cell/halo shaders and nine periodic offsets remain.
The first full-layer repeat reached 52 ticks/s. The growth trace records 29 implicit readbacks
totaling 0.074 seconds, versus the earlier 28 totaling 7.605 seconds. Readbacks still occur inside
the browser; removing the expensive drawing pattern removes most of their waiting cost.

The growth profile then exposed repeated modulo calculations in periodic neighbor queries.
Canonical positions now bypass redundant floating-point wrapping; each query computes adjacent
axis buckets once, preserving traversal order and duplicate suppression on one/two-bucket axes.
No movement law, viscosity, population grant, chemical resolution or controller changed.

Throughput reporting now includes the completed batch's execution time and resets its measurement
window when resuming. The previous first sample included paused time, and later samples counted
the current batch before including its duration. Final-build measurements use the corrected clock.

Final actual-application observations use the first and last positive-throughput publications;
their tick difference divided by receipt-time difference measures the operating window. Initialization,
the first rate window and cold saving are reported separately. All runs have continuing frame
submissions and expanded diagnostics, with 25 sections when the selected cell remains alive.

| Load | Observed tick window | Ticks/s | Submitted frames/s | Pause plus queued manual save |
| --- | --- | ---: | ---: | ---: |
| Ordinary 48 founders, development page | 100–340 | 214.3 | 19.6 | 240 ms |
| 2,000 varied cells, production page | 28–124 | 54.1 | 14.6 | 2,921 ms |
| Funded 2,000-cell growth, production page | 16–100 | 32.6 | 9.3 | 3,531 ms |

Growth reaches 4,000 living cells and records 2,000 divisions; its initial rate window is 26.0 ticks/s,
followed by 30.2–33.5 tick/s windows. Final tick 108 has 1,631 living cells. These are short constructed
load checks, not sustained ecological or long-duration performance claims. Save duration includes
the automatic pause save followed by the manual request, not one compression operation.

Headless ledger 3770–3772 now measures 224.0/61.3/35.9 ticks/s, lowest 20-tick windows
198.5/60.6/32.1. Old and new WASM snapshots match byte-for-byte every ten ticks through tick 110
on all three loads, including private learning and births. The final renderer fault check loses
graphics at tick 388, exports 669,870 bytes, restores that tick and retains runtime-report access
after an injected worker failure. The [renderer repair evidence](../../evidence/digital-chemistry/reliability-renderer.json)
records executable/source hashes, rate samples and equivalence results.

The final renderer also completed a 180.088-second repeat of the fixed 70-cell/100,000-ancestor
fixture, with more than 1,400 observation/render attempts and five saves. WASM remained
125,763,584 bytes. GPU RSS ranged from 126.2 to 130.4 MiB during active monitoring; the final
post-disposal sample is excluded. The largest renderer process peaked at 297.2 MiB. This bounded
regression follows the earlier 30-minute soak; it does not replace that record or claim that the
new renderer itself ran for 30 minutes. CI ran concurrently with this memory-only check, so its
operation timings are not a throughput benchmark.

## Inherited variation

The [installed-machinery contract](installed-machinery.md) records the six paired
daughter probes, the discontinuity found in transporter retirement, the paid refitting
replacement and its controlled repeat. There is an accessible resource-funded next
division for nearby variants; this is not a claim of evolved discovery.

## Chemical-space revision

The old diffusion coefficients exactly negated impedance coefficients. At seed 101,
counts in slow/low-impedance, slow/high-impedance, fast/low-impedance and fast/high-impedance
regions were **0, 80, 80, 0**. Those missing combinations unnecessarily excluded
persistent chemistry with little mechanical effect and rapidly spreading impedance.

Chemistry version 3 uses a low-frequency interaction mode `cos(πx/15) cos(πy/15)` as
the dominant log-diffusion component, with seeded small basis perturbations. Potential
and impedance retain their broad X/Y components; stress retains its separate surface.
The generator does not inspect cells or select a seed for an ecological outcome.
Seed-101 counts become **21, 21, 20, 22**. Validation requires at least eight entries
in each joint region, alongside existing potential/stress coverage, neighbor slope,
affinity-neighborhood and connected high-impedance/low-diffusion checks. Eight fixed
seeds pass. Four properties on a two-dimensional manifold remain correlated; this does
not claim statistical independence or unrestricted chemistry.

The source pair for these measurements was IDs 0 and 15, with diffusion 0.4201 and 0.005143.
The later [resource-economy calibration](resource-economy.md) changes default supply to 0/80
and retunes renewal/washout; the measurements in this section retain their original configuration.
Asymmetry is retained because small causal habitat tests show both sources provide
accessible material; equalizing their properties would erase a potential tradeoff.

## Ordinary habitat checks

Ledger 3714–3719 records the former space; 3720–3725 repeats the six registered cases
under the revised space. Each isolates an actual seed-101 startup source and its finite
geometry in a 64×64 arena. Controllers are ordinary founders with mutation and learning
frozen. Near-gap cells start eight world units farther from the source center.

| Revised-space condition | Imported material | Constructed material | Travel distance | Outcome at 600 ticks |
| --- | ---: | ---: | ---: | --- |
| First source, resident | 0.6463 | 0.8968 | 17.59 | One living cell, no division |
| First source, near gap | 0.5849 | 0.8471 | 19.10 | One living cell, no division |
| Second source, resident | 0.4595 | 0.7261 | 16.62 | One living cell, no division |
| Second source, near gap | 0.3618 | 0.6432 | 19.45 | One living cell, no division |
| Empty control, either geometry | 0 | 0.4015 | 17.23 | Extinct at tick 288 |

Both source opportunities repay some operation and growth beyond reserves. These
results do not establish a completed colonization event, another division, or successful
long-distance migration. No source rate, founder count, viscosity or controller was
tuned to manufacture an endpoint. Outputs are in `reliability-habitat-01/` and `-02/`.

## Current mechanism checks

Changing diffusion affects the existing short chemical opportunities, so their registered
one/two-cell cases were repeated (ledger 3745–3760), followed by the registered 200-tick motion,
ten-step diffusion and death-release checks (3761–3765). Mutation/learning remain frozen.
A preceding repeat, 3729–3744, exposed a fixture bug: the second authored cell had inherited
instructions but the first cell's installed identity. Those results are retained as confounded;
the corrected fixture declares its initial installed machinery explicitly.

- Cross-feeding: the donor exported 5.113 material of ID128; the recipient imported 0.821 and
  converted 0.782. Both survived 300 ticks; disabling export or recipient processing left one
  survivor. This establishes a recipient benefit, not reciprocal cooperation.
- Emission: the last living receiver sample had receptor input 0.135 and import effort 0.384,
  versus zero/zero without emission. The receiver died in both arms. Detectability is preserved;
  communication benefit remains unshown.
- Compatibility: cumulative damage was 0.0216 versus 0.1504 for compatible/distant external
  exposure, and 0.0297 versus 0.1915 internally. All four survived; compatibility is not immunity.
- Detoxification: cumulative repair expense fell from 0.6871 to 0.3413, but constructed material
  also fell from 0.6563 to 0.6340. Reduced injury does not imply a growth advantage.
- Corpse access: import enabled 0.0754 material uptake and postponed extinction from tick 56 to
  108. This was access to an explicitly released corpse, not predation.
- Paid impedance: after stopping production, retained barrier material reduced 200-tick travel
  from 14.235 to 14.087 units. The tracer second moment was 2.02685 versus 2.03788 after two model
  seconds. These are small physical effects, not an established useful barrier strategy.
- Degradation: post-death extracellular ID15 was 0.9182 versus 0.9683 without conversion. Both
  alive cells constructed approximately 0.2697 material. Do not infer superior growth or ecosystem
  clearance from the changed death return alone.

Per-cell `flows` describe the current tick; chemical species arrays are lifetime counters.
The figures above use cumulative world accounting or lifetime species flows, with last-living
samples explicitly distinguished from survivors. No seed or horizon was expanded to improve a result.

## Reporting and continuity

The actual evolution producer wrote a 20-tick schema-v3 fixture (ledger 3689). Its streamed
samples/genotypes now produce inherited-trait distributions and descriptive frequency histories.
Tests cover identical sequences, extinction, no observations, an interrupted final JSONL write,
interior corruption and rejected physical versions. A torn final sample is omitted with an explicit
coverage warning; interior corruption remains an error. This report does not decode older saves.

The [continuity table](diagnostic-continuity.md) records all restored displays and their sampling
limits. Sequence counts use actual chromosome equality, not genotype IDs or hashes alone.
Recent efforts, actual body ranges, founder-relative targets, acquired/controller change, source
epochs, task registers and membrane history remain bounded observations. Genealogy is retained.

The [mechanism evidence extract](../../evidence/digital-chemistry/reliability-mechanisms.json)
retains source-result hashes, executable identities, accounting and named species observations.
The [capacity report](../../evidence/digital-chemistry/reliability-capacity.json) retains workload
conditions and exact-continuation checks. Raw snapshots, traces and binaries remain in the listed
local artifact directories; the extract is not a replacement checkpoint.
The [barrier/death follow-ups](../../evidence/digital-chemistry/reliability-followups.json)
retain the additional short checks and source hashes.
The [browser evidence](../../evidence/digital-chemistry/reliability-browser.json) retains memory
series, application timings, executable provenance where captured, and injected-failure results.

## Local validation

`make ci` passes 43 Rust tests and 52 TypeScript tests, Rust formatting/Clippy, ESLint,
Prettier, TypeScript, documentation checks and Terraform formatting. The existing 14
nonblocking lint warnings remain. `make build` passes. The current producer/report integration
and its Python edge-case test also pass. No development server, commit, push or hosted
publication was started by this work. A failed intermediate typecheck exposed generated benchmark
source archives being compiled as harness code; the compiler now excludes `harness/artifacts`.

## Plan disposition

The remaining body of old chemistry plan `d80ddca6-d78c-4f29-ac65-1164fe8ba5a8` requires
product integration, Appendix A consumers, recovery/load checks, sparse startup,
removal, documentation, CI/build and human review. These obligations map to phases
3–7 here. Human motion review remains human review. The Rust, genealogy and ownership
plans explicitly excluded GPU/device/endurance acceptance from their completed checks;
their earlier completion does not discharge this plan's browser obligations.
That older work order is now canceled as superseded, with its remaining phase marked migrated,
not passed. The repaired browser workload now meets the throughput minimum under the documented
conditions. The performance child is closed after final memory/CI verification; human motion review
and the user's device acceptance remain explicit, unperformed checks in the root plan.
