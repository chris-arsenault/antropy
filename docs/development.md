# Development

## Prerequisites and checks

Use Node from `.node-version`, pnpm from `frontend/package.json`, Terraform 1.12 or newer,
and the Rust toolchain/wasm32 target declared in `rust-toolchain.toml`.
Install frontend dependencies with `pnpm install` in `frontend/`. Run `make ci` at the root for
Rust formatting/Clippy/tests, ESLint, formatting, TypeScript, bounded WASM/React tests,
documentation and Terraform formatting; `make build`
produces the SPA and WASM asset. `node frontend/scripts/build-engine.mjs` rebuilds the
engine for an already-running server without starting another server. Authored changes, including formatting, use native patch operations.

`cd frontend && pnpm run dev` starts port 26000. Agents start it only on explicit request.
The browser starts a paused new world; current operation is described in
[continuation](continuing-observation.md). No cloud resources are needed for development.

## Shared-memory engine builds

The engine build produces both `public/antropy-engine.wasm` and generated
`public/engine-threads/` assets. Both execute the same Rust operators. The build script installs
the pinned public `nightly-2026-02-01` toolchain with `rust-src` and `wasm-bindgen-cli 0.2.108`
when absent. Native checks and the serial fallback retain the ordinary toolchain. Threaded
WASM rebuilds the standard library with atomics; do not replace it with a prebuilt non-atomic
standard library. Generated bindings are ignored and must not be edited.

Vite development and preview responses set COOP `same-origin` and COEP `require-corp`.
The browser coordinator initializes a persistent Rayon pool before constructing its World,
normally using hardware concurrency minus one, capped at 32 workers. Small stages execute
serially. A browser without isolation uses the serial asset. Renderer uploads still borrow
WASM memory directly. Shared-buffer JSON decoding copies only bounded observation replies
because browsers reject SharedArrayBuffer input to TextDecoder.

The production Terraform consumer requires the new `response_headers_policy_id` option in
the shared `ahara-tf-patterns` website module. Publish that module change before deploying
this consumer. Local configuration and browser probes do not establish deployed headers.
No agent should start an additional server to test the pool.

See [the scaling plan](../SCALING-PLAN.md#multicore-design) for boundaries and measurements.
Geographic admission now permits up to 524,288 mesh nodes within its field reservation.
This does not enlarge the browser's 192 MiB raw package limit: 20× capacity fixtures can
step and restore through the engine but cannot use ordinary automatic recovery. Keep the
default dimensions for continuing browser observation until P3 persistence work lands.

## Chemistry and experiment boundaries

Experimental data is not version controlled. The harness creates its SQLite ledger at
`frontend/harness/artifacts/ledger.db` on first use; `recent` and `sql` use that same local
file. Checkpoints, sample arrays, traces, raw reports and generated plots also stay under
ignored artifact paths. A fresh checkout starts with an empty ledger. Existing local
history was moved from `frontend/harness/ledger.db` without dropping any records.

Keep authored findings, decisions, registrations and reproduction commands in Git.
Historical raw files under `docs/evidence/` remain local and ignored; only authored
`README.md` notes there are tracked. Links to local data work when those files are present
and are optional for documentation validation. CI rejects tracked experiment payloads.
Removing them from the current tree does not remove copies in earlier Git commits.

The [digital chemistry contract](design/chemistry/composed-runtime.md) governs current v19 checkpoints and
schema-v3 evidence. Historical studies preserve their original results, not executable current
registrations. Read [environmental evidence](design/chemistry/environmental-results.md) and
[rebuild evidence](design/chemistry/rebuild-results.md) before selecting a new comparison.
Register the question, competing explanation, conditions, horizons, wall budget and stopping decision.
Do not rerun every migrated campaign or search for a chosen community.

From `frontend/`, list constructed opportunities without advancing physics:

```bash
pnpm harness chemical-opportunities --case list
pnpm harness capabilities --case list
pnpm harness rps --case list
pnpm harness zones --case list
```

A named chemical opportunity defaults to 300 ticks (emissions 100), with a 30-second per-case cap.
The quick runner records exact initial/final checkpoints, resolved settings, source hashes,
local sensors/actions, typed transfers and stopping reasons. Reports use Matplotlib/NumPy locally:
`python3 harness/quick_report.py <root>`. Capability, RPS and population readers dispatch by
evidence schema and reject mixed old/new roots. No hosted artifact service is involved.

## Active command families

| Entry point | Current use |
| --- | --- |
| `bacteria --seed N --ticks T --wall-seconds S` | Ordinary population measurement, not external training |
| `bacteria-capacity --output NEW_DIRECTORY` | Fixed registered 48/2000/2000-growth computation loads, all 256 channels; not carrying capacity |
| `quick-food-access --stage probe` / `contest` | Generic finite-source sensing/access and paired controls |
| `spatial-probe --case near --ticks 300` | Ordinary founder resident/transit/empty controls; inspect results before extending |
| `chemical-opportunities --case NAME` | Registered allocation, stress, feeding, emission, corpse and barrier probes |
| `capabilities --case NAME` | Funded-body/control screens; follow-ups need explicit current checkpoint/candidate |
| `capability-pilots` | Separately justified selection pilots, not a smoke test |
| `ecology-causal` / `ecology-default` | Generic diagnostics / current-world injury and movement-impedance ablations |
| `rps --case NAME` | Constructed production, compatibility and susceptible variants; no required cycle |
| `zones --case NAME --world zones --shares 1,0` | Source-mixture and equal-machinery allocation comparisons |
| `evolve --seed N --ticks T --wall-seconds S --justification REGISTRATION` | Registered de novo run with generic trait samples and checkpoint provenance |
| `invasion --checkpoint PATH --k 2 --ticks T` | Descriptive-cluster representatives in rare-start comparisons |
| `bacteria-compare --checkpoint PATH --candidate ID` | Explicit observed genotype versus its ancestor, swapped assignments |
| `continuation-check --output NEW_DIRECTORY` | Registered startup, ancestry and chemical-load checks |
| `recent --n 5` / `sql "SELECT ..."` | Read the retained SQLite ledger |

Prefix entries with `pnpm harness`; use new output directories for append-only evidence.
Generic configuration flags include `--chemistry-seed`, `--source-species` (comma-separated IDs),
`--source-rate`, `--source-drift`, `--source-processing`, `--washout`, `--weathering-rate`, `--habitat-feedback on|off`,
`--viscosity`, `--damage-rate`, `--transfer-rate` and
`--disturbance on` on commands that use generic configuration. Named old-chemistry flags fail.
Read each command's settings before using flags from another family.

`evolve` accepts `--wall-seconds` and the older `--wall` alias; conflicting budgets and
unknown flags fail before execution. Current evolution reports describe stock-weighted
transporter targets and investment. Transport direction is a neural action, so those inherited
traits do not identify importers or exporters. Historical v10/v11 reports retain their old labels.

Source zones/epochs use share vectors over resolved IDs. Equal total matter can supply different
potential energy; preserve both quantities. The old `--regime` switch is rejected. Brief versus persistent food-access fixtures use an
explicit finite pulse and registered washout; general world configuration uses physical source lifetimes. Geography and chemical generation use independent randomness.

`bacteria` retains ploidy, transmission, crossover, mutation-kind, reproduction, learning and
learning-retention options. Mutation-off plus retention-zero freezes inheritance under clonal
transmission only when contact transfer is also off. Static learning is a distinct intervention.
No diagnostic or observed winner automatically replaces the browser founder.

## Studies, cohorts and batches

The retired `--weathering-period` flag fails explicitly; local mixtures now drive conversion.
All saved-genotype paths require explicit v19 binary checkpoints or browser packages. There is no default historical export,
hardcoded successful genotype or old-schema adapter. A short study invocation is:

```bash
pnpm exec tsx harness/lib/studyCli.ts --checkpoint CURRENT.bin --run NEW_NAME --ticks 2 --wall-seconds 30 --output harness/artifacts/my-study
python3 harness/study_sql.py load harness/artifacts/my-study/NEW_NAME harness/artifacts/my-study/study.duckdb
python3 harness/study_report.py harness/artifacts/my-study/study.duckdb harness/artifacts/my-study/report.json
```

Runs beyond 3,000 ticks require `--justification` referencing the declared question, short evidence,
horizon and stopping criteria. Batch scripts pass their explicit registration through this gate.
The two-tick example checks tooling; it cannot assess adaptation. Use registered durations for
scientific comparisons. Study mode `contest` takes explicit candidate and optional ancestor ID;
`--part behavior|physical|whole` selects the inherited component. Resume interventions require
an explicit living lineage, reset private state and retain installed machinery until paid refitting.
Knockouts are `none`, `damage` and `movement-impedance`; binding is absent.

The observer writes schema-v3 lifecycle, census, body, environment, genotype, exposure and
species/product flow tables. Python DuckDB loads completed manifests transactionally and refuses
mixed physical schemas. Reports include SQL, source hashes and explicit whole-population,
organism-time and resource-flow denominators. A null frequency denominator at extinction stays null.

`harness/study_variants.py` requires checkpoint, ancestor, candidate, part and output. It appends
diagnostic knock-in/reversion catalog records and leaves observed cells unchanged. Machinery
alleles include investment and complete coordinates/direction/offset. Provenance gives the new
comparison IDs. These generated records are not observed mutations.

Standalone `harness/epochRun.ts` takes `--phase-ticks` and runs three phases; `epochAssay.ts`
requires `--pre` and `--post` with identical chemistry/physical configuration. It samples 24
individual-weighted genomes per cohort. Source share and assignment swaps are separate controls.
`populationRun.ts` and epoch/evolution tools retain live/frozen inheritance comparisons and
report wall-capped runs as incomplete.

Python epoch, cohort and strategy batch scripts require explicit output, seeds, registration and
wall budgets; horizons and current checkpoint inputs are explicit. Use their `--help` for required
arguments. They do not authorize the campaigns they can execute. Current strategy panels use
chemical injury or motor/scheduled-resource questions. Historical batch defaults are removed.

## Persistence, reporting and verification

Physical checkpoint v32 preserves chemical definitions, source response settings, environmental configuration, inventories,
installed stocks and identity, immutable genes,
private state, random streams, ledgers, complete parentage and bounded browser history. Older
versions are rejected. Recovery retains up to six automatic/two manual points within256MiB, expiring older points to fit and
pauses on failure; raw snapshots are limited to 192 MiB. Field amounts use float32 with explicit rounding accounts; mesh geometry bounds allocation. Browser suspension, quota behavior and long-run responsiveness remain open.
The separately versioned browser observation package remains v11.

The registered environmental investigation reuses `runRecorded`, optional lineage traces and
the existing ledger. Its `harness/numerical/habitatBatch.ts` entry point has separate `pilot`
and `main` stages; inspect all pilots before invoking main. The fixed registration and resource
bounds live in `docs/plans/archive/ENVIRONMENTAL-ECOLOGY-PLAN.md`. New case directories are required. Run the
read-only report with `python3 harness/habitat_report.py STUDY NEW_REPORT`; it advances no ticks.
Headless recording limits do not change browser history or IndexedDB retention.

The [mobile-source registration](plans/archive/MOBILE-SOURCES-PLAN.md) uses six 300-tick cell-free probes
and ordinary comparisons capped at 3,000 ticks. From `frontend`, create a new study directory
with `pnpm exec tsx harness/numerical/mobileSources.ts probe harness/artifacts/NEW-STUDY`.
Inspect `probes.json` before invoking `case ROOT SEED DRIFT PROCESSING TICKS` on that entry point.
Cases share a 30-minute wall budget from probe creation and a 120-second per-case limit.
Read completed evidence without advancing ticks:
`python3 harness/mobile_source_report.py STUDY NEW_REPORT`.
These are registered investigation tools; their available parameter values do not authorize
additional sweeps. Headless source output observations are prospective normal release rates,
excluding expiration flushes; actual converted/released material is counted separately.

The cell inspector exposes44 local chemical/optical/body inputs, stocks/targets, chemical mixtures, U/D/I/S properties,
membrane compatibility, actual transfers, private recurrence and task state. Manual interventions
remain diagnostic and durable. Views never select reproduction or feed hidden information to RNNs.

Rust tests and Vitest verify bounded mechanics and integration; ecological outcomes belong in the ledger.
Human review judges motion. The user's days/weeks observation is not an agent experiment budget.
Historical ant tools remain recoverable from their tag, not executable compatibility paths here.

## Deployment

`scripts/deploy.sh` is parameterless and builds/applies the static-site Terraform root.
The shared workflow deploys main. Deployment is separate authorization from local implementation.
