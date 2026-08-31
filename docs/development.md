# Development

## Prerequisites

- Node 24.12.0 (pinned in `.node-version`)
- pnpm 10.29.3 (pinned via `packageManager` in `frontend/package.json`)
- Terraform >= 1.12 (for infrastructure changes)

## Local workflow

```bash
cd frontend
pnpm install
pnpm run dev        # dev server with HMR
pnpm run build      # typecheck (tsc -b) + production build to dist/
pnpm run test       # vitest
pnpm run lint       # eslint
```

From the repo root:

| Target                    | What it runs                                             |
| ------------------------- | -------------------------------------------------------- |
| `make ci`                 | All checks below with the fast test tier — run before every commit |
| `make ci-full`            | `make ci` plus the slow test tier                        |
| `make lint`               | `eslint .` in `frontend/`                                |
| `make fmt`                | `prettier --check .` in `frontend/`                      |
| `make format`             | `prettier --write .` in `frontend/`                      |
| `make typecheck`          | `tsc -b` project references                              |
| `make test`               | Fast tier: `vitest run` excluding `*.slow.test.ts` (~6s) |
| `make test-slow`          | Slow tier: the long-run simulation gates (~1min)         |
| `make docs-check`         | Required documentation files exist                       |
| `make terraform-fmt-check`| `terraform fmt -check -recursive infrastructure/terraform/` |
| `make build`              | Production frontend build                                |
| `make deploy`             | `scripts/deploy.sh`                                      |

Long-running simulation gates (ecology calibration, multi-generation evolution, checkpoint
determinism, MVP acceptance) live in `*.slow.test.ts` files. The shared cloud CI workflow
invokes vitest with the default config and runs both tiers; locally, run `make test-slow`
(or `make ci-full`) after changes to simulation dynamics, reproduction, or persistence.

## Lint and quality rules

ESLint uses the v9 flat config (`frontend/eslint.config.js`) with the platform plugin set and
the `@ahara/standards` custom rules. Hard limits: cyclomatic and cognitive complexity 10,
400 lines per file, 75 lines per function. Prettier formatting is enforced separately
(`.prettierrc` at the repo root).

## Deploy

`scripts/deploy.sh` is parameterless: it builds the frontend, then runs `terraform init`
against the shared state bucket and `terraform apply`. CI performs the same steps on `main`
via the shared workflow.
