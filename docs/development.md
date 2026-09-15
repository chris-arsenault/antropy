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

## Chemistry and experiment boundaries

The [digital chemistry contract](design/chemistry/README.md) governs current v11 checkpoints and
schema-v3 evidence. Historical studies preserve their original results, not executable current
registrations. Read [numerical evidence](design/chemistry/numerical-results.md) before selecting a new comparison.
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
`--source-rate`, `--washout`, `--viscosity`, `--damage-rate`, `--transfer-rate` and
`--disturbance on` on commands that use generic configuration. Named old-chemistry flags fail.
Read each command's settings before using flags from another family.

Source zones/epochs use share vectors over resolved IDs. Equal total matter can supply different
potential energy; preserve both quantities. The old `--regime` switch is rejected. Brief versus persistent food-access fixtures use an
explicit finite pulse and registered washout; general world configuration uses physical source lifetimes. Geography and chemical generation use independent randomness.

`bacteria` retains ploidy, transmission, crossover, mutation-kind, reproduction, learning and
learning-retention options. Mutation-off plus retention-zero freezes inheritance under clonal
transmission only when contact transfer is also off. Static learning is a distinct intervention.
No diagnostic or observed winner automatically replaces the browser founder.

## Studies, cohorts and batches

All saved-genotype paths require explicit v11 binary checkpoints or browser packages. There is no default historical export,
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

Checkpoint v11 preserves chemical definitions, inventories, installed stocks and identity, immutable genes,
private state, random streams, ledgers, complete parentage and bounded browser history. Older
versions are rejected. Recovery retains six automatic/two manual points within 256 MiB and
pauses on failure; raw snapshots are limited to 192 MiB. Field amounts use float32 with explicit rounding accounts; mesh geometry bounds allocation. Browser suspension, quota behavior and long-run responsiveness remain open.

The cell inspector exposes 39 local inputs, stocks/targets, chemical mixtures, U/D/I/S properties,
membrane compatibility, actual transfers, private recurrence and task state. Manual interventions
remain diagnostic and durable. Views never select reproduction or feed hidden information to RNNs.

Rust tests and Vitest verify bounded mechanics and integration; ecological outcomes belong in the ledger.
Human review judges motion. The user's days/weeks observation is not an agent experiment budget.
Historical ant tools remain recoverable from their tag, not executable compatibility paths here.

## Deployment

`scripts/deploy.sh` is parameterless and builds/applies the static-site Terraform root.
The shared workflow deploys main. Deployment is separate authorization from local implementation.
