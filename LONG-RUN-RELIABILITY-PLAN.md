# Repair unattended browser failure

September 15, 2026. The user reports a tab crash sometime during an unattended hour
after accepting the initial visual review. OOM is a hypothesis; no error code or
runtime report has yet established the cause. The completed rebuild's initial visual
acceptance remains valid, but did not establish endurance.

**Repair complete:** React development profiling retained serialized component props in
the browser's User Timing buffer. Development startup now releases those records after
observer delivery. Two five-minute active runs completed without the reproduced memory
growth; the second also passed post-run fault/recovery checks. The first injected graphics
restore timed out and remains unexplained. The user's original crash still has no causal
trace, and these checks do not establish hour-long or days-long endurance.

## Contract and evidence

Fix demonstrated retention or allocation defects and verify active operation and
recovery. Preserve chemistry, full resolution, funded bodies, complete parentage and
the [immutable ownership boundary](docs/design/chemistry/data-ownership.md).
Do not reduce population or delete ancestry to conceal a leak. Use the existing local
server and isolated browser profiles; never modify the user's browser storage.

Current sources: `engine/src/world.rs`, `abi.rs`, `presentation.rs`, `transport.rs`,
`frontend/src/engine/session.ts`, `worker.ts`, `renderer.ts`, `recovery.ts`,
`package.ts`, `runtimeHealth.ts`, and the existing numerical browser runners.
The [prior reliability record](docs/design/chemistry/reliability-results.md) reports
save overlap and GPU queue defects that were repaired before this rebuild. Those
protections remain present. Its 30-minute fixture held physical state fixed; current
[rebuild checks](docs/design/chemistry/rebuild-results.md) exercised only short runs.
Neither establishes active hour-long memory behavior on the user's device.

Settled: investigate and implement locally; no new server, commit, push or external
publication. Separate retained WASM state, allocation high-water marks, transient
save copies, JS retention and GPU/process memory. Technical choices follow measured
evidence. The lost tab's exact cause remains unverified without its trace.

## Milestones

Root Sulion plan: `95e0b01f-5950-48c3-b876-d22092d3d057`.

- **M0 — Establish the failure mechanism.** Trace owners and run bounded operational
  probes. Acceptance: a reproduced defect with an isolated mechanism, or an explicit
  statement of missing evidence. No ecological conclusions from these checks.
- **M1 — Repair the demonstrated defect** [depends on M0]. Implement the smallest
  complete lifetime/allocation repair, with behavior regression and unchanged physical
  continuation where appropriate. Preserve existing durable state formats if possible.
- **M2 — Validate unattended operation** [depends on M1]. Repeat the relevant workload,
  exercise saving and recovery, run `make ci`, and record measured limits. A passing
  bounded check does not certify every browser or days/weeks of operation.

### M0 execution

Expansion `38c93281-21d8-4d2f-a0e5-121a0c2b8aa7`.

1. **Measure active allocation and save behavior.** Reuse the production Engine/Session
   and existing harness. Compare seed27, default h2 stepping with and without periodic
   snapshots/compression: at most 10,000 ticks per arm, 120 seconds per arm, stop on
   extinction or a runtime fault. Sample WASM bytes and process memory every250ticks.
   Hypotheses: live-state growth, fragmentation or save peaks; a plateau on identical
   inputs argues against a simple WASM leak. Record population and ancestors separately.
   This is an operational test, not a search for evolutionary outcomes.
2. **Isolate browser memory** [depends on #1]. Use an isolated profile on the existing
   server, production owners and the existing CDP runner. A three-minute pilot records
   worker/WASM, renderer-process and GPU memory with active stepping and saves. Stop on
   a fault or unexplained growth over256MiB in six ten-second samples. Subsystem
   isolation is diagnostic only. Extend a check only if pilot evidence identifies a
   specific unresolved retention mechanism and register the budget before execution.

The no-save arm completed10,000ticks: WASM plateau138,018,816bytes; process RSS
242,962,432bytes,137living and2,970ancestors. The compressed-export arm already exceeds
900MB process RSS by tick4,750 while WASM stays205,914,112bytes. Isolate checkpoint
compression with the existing browserRuntime save cases (100repetitions each for48
founders and70founders/100,000synthetic ancestors,120seconds percase) before attributing
Node's process growth to Chromium. This fixed-state control needs no ecological stepping.

M0 is complete. User error code, approximate counts and recovery availability were
requested; no crash trace has been supplied.

The active browser pilot stopped at51seconds on its growth limit: the application
renderer process grew380,756→1,216,276KiB; GPU stayed roughly136–148MiB. Main JS
heap underwent collection while process memory kept rising. Both100-save fixed-state
browser controls completed with flat WASM allocation. Repeat the active pilot with
DOM counts and performance-entry counts to distinguish main-page retention from saves
and simulation memory; same180second cap and early growth stop. React's installed
development build emits component performance measures and does not clear them.
Whether these retained entries explain the growth is the next causal check.

The repeat records155→3,362performance measures in21seconds alongside renderer RSS
growth, while WASM reaches139MB and GPU remains bounded. Register one paired180second
control clearing only the page performance-measure buffer each second. Physics,
panels, rendering and automatic saving stay enabled. If this removes the growth,
replace the diagnostic blanket cleanup with a scoped development-timing lifetime
policy and test it. This is an isolated probe, not a change to the user's browser.

### M1 execution design

Expansion `d2b0eee8-cbf9-4891-a474-285abeac87c3`, step1.
The diagnostic control completed180seconds and36,316ticks with automatic saving.
Its renderer process stayed roughly707–850MiB after the first save, versus the
uncleared page reaching about1.2GiB by51seconds. This establishes timing retention
as a reproduced defect, without proving the exact cause of the user's lost tab.

The diagnostic timing cleanup removes the rapid growth through the first120seconds;
finish its registered180seconds before changing the application. The intended repair
is a development-only `PerformanceObserver` installed before React mounts. Release
completed measures identified by React's Components/Scheduler track metadata after
observer delivery. Keep ordinary application timing records, production behavior and
all simulation/render/message boundaries unchanged. Dispose the observer on Vite hot
reload. Do not suppress React rendering, disable diagnostics, or change installed
dependencies to avoid the symptom.

Verify with real User Timing entries: repeated React component/scheduler measures are
released, unrelated measures remain, unsupported observer environments are harmless,
and disposal ends observation. Browser evidence supplies the before/after memory
regression; test names or file-existence checks do not.

Implemented in `frontend/src/ui/developmentTimings.ts` and installed before mounting
in `frontend/src/main.tsx`. Two real User Timing tests pass. The first five-minute
application check completed; its subsequent graphics-restore timeout is recorded below.
`make ci` passes69 Rust and56 frontend tests with13 existing lint warnings. The production
build passes and excludes the development observer. This change does not alter the WASM
binary or checkpoint formats.

### M2 validation registration

Expansion `6d3bf2e9-62d6-499e-b329-0811c350697c`: step1 covers active memory/recovery;
step2 covers CI, build and evidence closeout.

After the repair, run the actual development application for300seconds in an isolated
profile with all diagnostic panels open, selected-cell inspection, maximum-speed
ordinary seed27/h2 stepping, rendering and30-second automatic saves. No injected
timeline cleanup or forced garbage collection. Retain ten-second process/JS/WASM/DOM
and timing counts. Stop on runtime fault, ecological terminal state, or the same256MiB
growth limit. Then pause, save, and exercise existing graphics-loss export/recovery
and worker-failure reporting. This tests the repaired lifetime through repeated
updates/saves; it does not establish an hour or days of ecological endurance. Run
focused tests, `make ci` and the production build. No simulation laws change.

## Evidence

| Check | Result |
| --- | --- |
| [Initial active application](docs/evidence/digital-chemistry/unattended/baseline-memory.json) | Stopped at51seconds after renderer-process RSS grew from372 to1,188MiB. GPU stayed near144MiB. |
| [Active application with timing counts](docs/evidence/digital-chemistry/unattended/timing-baseline-memory.json) | Stopped at51seconds;7,833 retained measures,222,429,184WASM bytes after saving; renderer process again near1.2GiB. |
| [Timing-clear diagnostic control](docs/evidence/digital-chemistry/unattended/timing-control-memory.json) | Completed180seconds; completed measures cleared every second; renderer RSS stayed roughly707–850MiB from the first save onward. |
| [Control application and saves](docs/evidence/digital-chemistry/unattended/timing-control-result.json) | Reached36,316ticks with automatic recovery, manual save and no alerts. No ecological inference. |
| [Repaired active application memory](docs/evidence/digital-chemistry/unattended/repaired-memory.json) | Completed300seconds; zero retained measures in every sample, WASM221,970,432bytes after first save. Renderer RSS714–893MiB from60seconds onward. |
| [Repaired application and saves](docs/evidence/digital-chemistry/unattended/repaired-result.json) | Reached56,780ticks with no runtime alerts. Six automatic saves and one manual save retained. The subsequent injected context restore timed out; this row does not claim fault recovery passed. |
| [Short fault isolation](docs/evidence/digital-chemistry/unattended/short-fault-checks.json) | Loss/export/context restoration, recovery to tick396 and worker-failure reporting pass. This does not explain the post-duration timeout. |
| [Same-duration repeat memory](docs/evidence/digital-chemistry/unattended/recovery-repeat-memory.json) | Completed300seconds; zero retained measures, renderer RSS710–800MiB after60seconds, WASM222,429,184bytes after first save. |
| [Repeat application](docs/evidence/digital-chemistry/unattended/recovery-repeat-result.json) and [fault/recovery](docs/evidence/digital-chemistry/unattended/recovery-repeat-faults.json) | Reached57,276ticks; six automatic and one manual recovery retained. Export while graphics were lost produced3,995,902bytes. Graphics restoration, recovery to the saved tick and worker-failure report availability pass. |

Chromium uses an isolated profile and software graphics on the existing server.
Figures are individual process RSS, not total browser memory or live WASM allocation.
The test instrumentation records scalar status, clears consumed harness replies and
samples every10seconds; it does not keep a physical world mirror. CPU profiling is off
for duration runs. The final regression has no injected timing cleanup or forced GC.
CI ran concurrently with its startup, so its tick rate is not a capacity benchmark.

The loaded WASM SHA-256 remains
`450c3b5cdaf6b1aca8a8a6a1ccbdc05d80959eec3d45d15e412be7ddfe3b6a9f`.
The repair's source SHA-256 values are
`6997d7eeeab90072083164fa3b2b456e189cd712f68bd18993bc7c4b1432ae7b`
for `frontend/src/main.tsx` and
`3d5dcd5c909ea0a75496daabce573cbe1076e158229ebaf566ddc74ade0acc9f`
for `frontend/src/ui/developmentTimings.ts`.

Node's repeated compressed-export process growth is recorded separately above. It
did not identify the browser mechanism and was not used to justify a storage rewrite.
The user's original tab crash remains without a causal trace; a fixed reproduced
leak is not proof that every possible crash is resolved.

### Graphics validation prerequisite

M2 step1 was blocked under sub-plan `78994968-aa4f-46c2-a8f9-d94f1f34ede8`.
The repaired application completed300seconds/56,780ticks with no errors, zero retained
timing records in every sample, and seven retained saves (six automatic, one manual).
The subsequent injected context-loss test exported successfully but timed out waiting
for its reported error to clear after restoration. The runner discarded the partial
fault trace. Capture partial fault evidence and repeat the existing short300-tick/
30-second application check with fault injection to isolate the cause. Do not rerun
the five-minute workload merely to investigate a harness or context lifecycle failure.

The short repeat passed loss/export/context restore, checkpoint recovery to tick396,
and worker-failure reporting. It did not reproduce the post-duration failure. One
repeat of the same300second active workload is now justified to verify recovery
after prolonged graphics use; preserve partial errors, context-lost state and whether
the restoration event arrived if it fails. No extension beyond300seconds or seed
change is authorized by this registration. Keep the first timeout as an unresolved
negative finding even if the repeat passes.

The repeat passed all stages at tick57,276. No graphics runtime change was justified;
the runner now preserves partial errors and graphics-context state on failure. The
prerequisite is closed with the original timeout retained as an unresolved limitation.

## Handoff

`make ci` passes69 Rust and56 frontend tests with13 existing lint warnings; the production
build passes. Current saves retain the same v13 physical/v11 package formats and the
same WASM binary. No simulation law, population limit, field resolution, WebGL renderer
or worker data boundary changed.

Reload the application to load the repair. Under **Save, restore and export**, leave
**Latest saved state** selected and use **Restore selected state** to recover an available
automatic save. Restore starts paused. The isolated checks did not access or change the
user's browser storage. The fix and these results complete this repair's bounded scope;
the original crash's precise attribution and longer operating limits remain unverified.
