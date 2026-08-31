# Agent Guide

Antropy is a browser-based 3D ant evolution simulation (Vite + React + Three.js SPA) deployed
on the Ahara platform.

## Read first

| Topic                  | Link                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| Workspace overview     | [README.md](README.md)                                                           |
| Design specification   | [docs/design-spec.md](docs/design-spec.md)                                       |
| Documentation index    | [docs/README.md](docs/README.md)                                                 |
| Architecture           | [docs/architecture.md](docs/architecture.md)                                     |
| Architecture decisions | [docs/adr/README.md](docs/adr/README.md)                                         |
| Backlog                | [docs/backlog.md](docs/backlog.md)                                               |
| Changelog              | [CHANGELOG.md](CHANGELOG.md)                                                     |
| Platform integration   | [../ahara/INTEGRATION.md](../ahara/INTEGRATION.md)                               |
| Ahara standards        | [../ahara-standards/standards/README.md](../ahara-standards/standards/README.md) |

## Critical rules

- Follow the Ahara platform contract: shared Terraform state bucket, `ahara-tf-patterns`
  modules, no per-project buckets or load balancers. This project deploys only the `website`
  module — a static SPA behind CloudFront.
- Hand-code the sensory/motor interface, never ant behavior. Trail-following, castes,
  cannibalism, and architecture must emerge from evolved genomes ([design spec §1](docs/design-spec.md)).
- Treat the behavioral controller as a pluggable module behind the `act`/`mutate`/
  `recombine`/`seed` contract. Nothing outside the controller inspects genome internals.
- Use pnpm, TypeScript (`.ts`/`.tsx` only), and Vitest. ESLint enforces complexity 10, files
  under 400 lines, functions under 75 lines, plus the `@ahara/standards` custom rules.
- Run `make ci` before handoff after changing files.
- Start local development servers only when the user explicitly asks.
- Persistence is client-side (IndexedDB and file export). There is no backend, database, or
  auth; do not add ALB, RDS, or Cognito integration without an explicit decision.

## Code map

| Path                        | Purpose                                                    |
| --------------------------- | ---------------------------------------------------------- |
| `frontend/`                 | Vite React/TypeScript SPA — simulation, rendering, UI      |
| `infrastructure/terraform/` | Project Terraform root using the Ahara `website` module    |
| `scripts/`                  | Parameterless local deploy script                          |
| `docs/`                     | Design spec, architecture, development notes, ADRs, backlog |

## Commands

| Command                    | Purpose                                                |
| -------------------------- | ------------------------------------------------------ |
| `make ci`                  | Lint, format-check, typecheck, test, docs and tf checks |
| `make build`               | Production frontend build                              |
| `make deploy`              | Run the parameterless local deploy script              |
| `cd frontend && pnpm run dev` | Local dev server (only when explicitly requested)   |
