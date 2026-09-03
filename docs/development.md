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

| Target                     | What it runs                                                  |
| -------------------------- | ------------------------------------------------------------- |
| `make ci`                  | All checks below — run before every commit                    |
| `make lint`                | `eslint .` in `frontend/`                                     |
| `make fmt`                 | `prettier --check .` in `frontend/`                           |
| `make format`              | `prettier --write .` in `frontend/`                           |
| `make typecheck`           | `tsc -b` project references                                   |
| `make test`                | The complete bounded Vitest suite                             |
| `make docs-check`          | Required documentation files exist                            |
| `make terraform-fmt-check` | `terraform fmt -check -recursive infrastructure/terraform/`   |
| `make build`               | Production frontend build                                     |
| `make deploy`              | `scripts/deploy.sh`                                           |

Vitest is for bounded deterministic mechanics and integration invariants. Calibration,
long-horizon ecology, colony outcomes, and comparative simulation measurements run through
`pnpm harness` and are recorded in `frontend/harness/ledger.db`; they are not CI pass gates.

## Lint and quality rules

ESLint uses the v9 flat config (`frontend/eslint.config.js`) with the platform plugin set and
the `@ahara/standards` custom rules. Hard limits: cyclomatic and cognitive complexity 10,
400 lines per file, 75 lines per function. Prettier formatting is enforced separately
(`.prettierrc` at the repo root).

## Deploy

`scripts/deploy.sh` is parameterless: it builds the frontend, then runs `terraform init`
against the shared state bucket and `terraform apply`. CI performs the same steps on `main`
via the shared workflow.
