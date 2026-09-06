# Development

## Prerequisites

- Node 24.12.0 (pinned in `.node-version`)
- pnpm 10.29.3 (pinned via `packageManager` in `frontend/package.json`)
- Terraform >= 1.12 (for infrastructure changes)

## Local workflow

```bash
cd frontend
pnpm install
pnpm run dev        # dev server with HMR on 0.0.0.0:26000 (LAN-reachable dev port; strict — fails loudly if taken)
pnpm run build      # typecheck (tsc -b) + production build to dist/
pnpm run test       # vitest
pnpm run lint       # eslint
```

From the repo root:

| Target                     | What it runs                                                                    |
| -------------------------- | ------------------------------------------------------------------------------- |
| `make ci`                  | All checks below — run before every commit                                      |
| `make lint`                | `eslint .` in `frontend/`                                                       |
| `make fmt`                 | `prettier --check .` in `frontend/`                                             |
| `make format`              | `prettier --write .` in `frontend/`                                             |
| `make typecheck`           | `tsc -b` project references                                                     |
| `make test`                | The complete bounded Vitest suite                                               |
| `make docs-check`          | Required docs, local links, normalized-section indexes, and source preservation |
| `make terraform-fmt-check` | `terraform fmt -check -recursive infrastructure/terraform/`                     |
| `make build`               | Production frontend build                                                       |
| `make deploy`              | `scripts/deploy.sh`                                                             |

Vitest is for bounded deterministic mechanics and integration invariants. Calibration,
long-horizon ecology, colony outcomes, and comparative simulation measurements run through
`pnpm harness` and are recorded in `frontend/harness/ledger.db`; they are not CI pass gates.
Use `pnpm harness calibrate-colony-economy` for the authored-nest energy surface; its profile
syntax and current evidence are documented in [calibration.md](calibration.md).
The web app's scenario selector exposes two matched single-ant controls: an omniscient pathfinding
baseline and a programmed sensor-limited candidate. Both use the same authored nest, persistent
surface food patch, queen-core larder neighborhood, configuration, and ordinary body actions. Use
seeds 1–3 for the recorded comparison. The sensor arm is a stateless function of local production
sensors; its authored entrance-traffic trace is physical world state and can be disabled through the
existing
`authoredNestTrail` configuration gate.

`pnpm harness single-forager-comparison --seed 1` records the short five-load matched gate. It
requires five genuine external pickups and five completed returns into the queen's crop or physical
cache, final unloading stances within one voxel, completion within 1,100 ticks, no more than 10%
sensor slowdown, and no more than 6% immediate sensor-turn reversals. This outcome stays in the
harness rather than making the normal test suite build and run the 3D fixture repeatedly.

`pnpm harness programmed-foraging` preserves the former fixed 500-tick, four-world Appendix H panel
as invalidated evidence. Its ratios passed while direct review still found universal circling and
severe mouth congestion. Do not use it as a current gate. `pnpm harness clone-colony-loop` likewise
remains historical and must not train another controller from the rejected policy.
`evaluate-colony-cohort --controller-runs ...` and `robustness-colony-loop --controller-runs ...`
remain the no-selection held-out evaluation and production-mutation curve. `bake-colony-run --run
ID` regenerates the checked-in colony seed from an already measured ledger vector.
`optimize-colony-loop` remains available for historical diagnosis or an explicitly scoped
outcome-search experiment; it is not part of initial training.

Use `pnpm harness colony-resilience` for matched authored-nest worker-loss and worker-energy
curves. Shared flags include `--seeds`, `--fractions`, `--warmup`, `--recovery`, `--cadence`, and
`--jobs`; `--config nest --flag mortality=true` admits one later gate without source edits. Each
seed warms once, then every treatment restores that exact state. Episode summaries and demographic
time series land in `runs` and `demography_series`. The same cadence records completed-life
heritability, effective population, genome diversity, distance from retained founders, and
per-founder-line representation in `evolution_series`; unavailable estimates persist as SQL
`NULL` with their actual sample counts.

Named authored-nest presets preserve the measured phase boundaries: `nest` is the immortal
baseline, `nest-mortality` adds mortality and queen upkeep, and `nest-replacement` additionally
enables worker reproduction plus larval rearing. Per-world `--flag` overrides remain available for
one-axis investigations.

## Lint and quality rules

ESLint uses the v9 flat config (`frontend/eslint.config.js`) with the platform plugin set and
the `@ahara/standards` custom rules. Hard limits: cyclomatic and cognitive complexity 10,
400 lines per file, 75 lines per function. Prettier formatting is enforced separately
(`.prettierrc` at the repo root).

## Deploy

`scripts/deploy.sh` is parameterless: it builds the frontend, then runs `terraform init`
against the shared state bucket and `terraform apply`. CI performs the same steps on `main`
via the shared workflow.
