# Persistent ecology diagnostics

Status: local implementation complete October 11; publication authorized October 12, 2026.
Sulion root: `e969974c-d545-45a3-ba9d-330b3dc93e96`.
Publication root: `24dc7e6d-d3a5-4945-ac74-54e94d8277d2`.

## Outcome and scope

Investigate a continuing or extinct native server world without replacing it to obtain a
stored checkpoint, and retain evidence of supply, actual paid activity, reproduction,
deaths and mortality recovery after the population disappears or the process restarts.
The user requested better observability during the live-collapse investigation, then asked
to enable recovery, commit and push. Publication follows the existing CI/CD path.

Physical accounts, configuration, random draws and checkpoint v53 remain unchanged.
Diagnostic records are private operator data on the existing volume, not spectator packets
or React state. Local captures belong in ignored harness artifacts. Collection begins when
the new runtime starts; it cannot recover measurements missing from older runs.

## Sources and decisions

- `engine/server/management_store.rs` and `store.rs` already read bounded stored bytes.
  Add authenticated GET export using the existing export semaphore and response ownership;
  no load, generation change or physical restore is needed, including for older formats.
- `engine/server/runtime.rs` owns the sole native World. Collect independently of viewers
  and manual stepping through the same runtime step method.
- `engine/src/lifecycle.rs` and the existing paid `Cell.flows` expose births, division and
  final physiology before cells disappear. An optional, serialization-skipped observer
  retains bounded end records and recent paid accounts. Native startup enables it.
- `engine/server/observations.rs` keeps presentation history only in memory and eventually
  samples empty time over populated history. The new operator history is separate from
  display publication, with explicit coverage, bounded recent and coarse temporal records,
  local source neighborhoods, and terminal evidence protected from empty-time replacement.
- Reuse the existing diagnostic volume and atomic writes. Compress bounded snapshots off
  the World owner, surface failures, retain recent run segments across restart/load, and
  expose coverage breaks instead of joining unrelated generations.
- Local reductions group residents by nearest reservoir, with source identity and position
  included. These are observation groups, not physical colony labels or proof of exchange.
  Detailed end records retain actual overlapping reservoir stock and chemistry.
- Use existing observer interval250 ticks for cadence and recent-cost windows. Bound event
  samples, source detail and history bytes. Counts describe all events; detailed event
  samples explicitly describe their sampling and truncation.

An unbounded event log, full physical snapshots per sample, and spectator-dependent history
would each fail the retention or ownership requirement. No simulation law or rescue mechanism
is selected by this work.

## Milestones

### M0 — Read-only retained checkpoint access

Sulion phase: `950cb247-ebdb-4c06-8620-0de125f88cf9`.
Acceptance: GET stored bytes under existing operator authentication; correct checkpoint
metadata, unchanged live state, bounded allocation and permit lifetime.
Evidence: management integration tests including auth, missing ID, busy export, byte equality
and physical-state invariance.

Execution: wire `GET /api/checkpoints/{id}` to the existing bounded store reader and shared
checkpoint response; extend management tests and endpoint documentation in the same step.
Expansion: `35f18bae-660f-436c-9133-453387215a9e`, one implementation step covering the
store reader, HTTP route, shared response allocation and integration coverage.

### M1 — Persistent ecology evidence [depends on M0]

Sulion phase: `c1ad7e99-9889-4075-be73-e8623cfd28d9`.
Acceptance: ordinary native startup collects global and local paid-flow/source history plus
bounded birth/death context without viewers; volume persistence and private API retain it
across empty time and process/run boundaries. Storage failure and retention gaps are visible.
Evidence: kernel neutrality and end-account tests, temporal retention and segmentation tests,
durable roundtrip/failure tests, authenticated endpoint tests.
Expansion follows current source inspection at phase start.

Execution expansion: two steps, kernel observation followed by native durability/API.
Expansion: `8a1dbdfd-aaf0-45a4-b17d-a9ad48e4921f`.
Kernel files: new `engine/src/ecology_observation.rs` and context helpers, plus optional
World state and lifecycle hooks. Keep the previous and current250-tick paid windows per
living cell, birth energy/body context, bounded end-event samples with complete genotype
and private physiology, pre-spill local chemistry and up to eight overlapping reservoirs.
Sample at most once per250 ticks in large populations; retain all endings when at most64
cells are observed, within an event count/byte cap. Count skipped/expired records explicitly.
Test snapshot neutrality and actual birth/death/cost accounting.

Native files: new `engine/server/ecology.rs` and retention/store helpers; runtime step and
replace paths, existing diagnostics/persistence, management route and tests. Sample every
250 ticks and at extinction. Keep bounded fine and coarse records plus end context; empty
time does not advance the populated-history retention window. Include global cumulative
accounts and nearest-reservoir resident windows, source stock, release, wait and composition.
Persist compressed snapshots outside the World owner; retain three bounded run segments,
visible save errors and explicit new coverage after physical restore. Test boundaries,
empty-time preservation, roundtrip and authenticated access without spectators.

### M2 — Standard investigation capture and integration [depends on M1]

Sulion phase: `610fb52c-a4d2-4457-8426-d4966d61d78a`.
Acceptance: a maintained harness command captures operator diagnostics and optionally a
retained living checkpoint through GET only, with local byte/time limits and useful failure
messages. Documentation states units, coverage and evidence limits. Relevant repository
checks pass; deployment status is reported separately from local delivery.
Expansion follows the implemented API at phase start.

Expansion: `cec2f88a-6413-47b9-9ab7-b35d2bf48d33`, one implementation step. Add
`frontend/harness/lib/serverReview.ts` with streaming download support and focused tests,
wire `pnpm harness server-review`, document the private API and temporal/retention limits,
and run repository checks as part of integration. All requests are GET, credentials remain
in the broker-backed environment and authorization header, and captures stay in ignored
local artifacts with deadlines and actual streamed-byte caps.

## Current state

M0, M1 and M2 are delivered locally. The October12 `make ci` passed:425 kernel tests,25 native tests,
17 chemistry-definition tests and105 frontend tests, plus formatting, lint, type, documentation,
storage-policy and Terraform format checks, including bounded-source detail and export-slot
ownership changes. The existing22 frontend lint
warnings and Rust's WASM atomics target-feature warning remain.

An isolated native/CLI integration captured six files including324,322 physical bytes,
confirmed GET capture left physical bytes unchanged, and restored two diagnostic segments
across a real process restart. Temporary servers and generated fixtures were cleaned up.
The new observer also retained all22 terminal division/death events from the existing
four-cell recovery-on comparison with no drops. Their birth and paid-flow accounts establish
the final daughters' reserve exhaustion; they do not reconstruct the earlier population
collapse. Raw records remain in ignored local artifacts.

At the configured10,000-source maximum, bound each point to256 rotating neighborhood groups
with explicit omission counts so local detail cannot crowd global accounts out of retention.
Ordinary240-source worlds can include every occupied or recently ending neighborhood.
Preserve other agents' existing documentation and chemical-key example changes.

October12 operating change: restarted the extinct seed27 world with only
`mortalityRecovery` changed to true, then saved the populated world on the server volume.
The existing feature ablations, terrain and finite-source settings remain as configured.
This enables the requested recovery mechanism; it does not establish sustained survival.
The publication plan owns the commit, normal pipeline deployment and live API checks.
