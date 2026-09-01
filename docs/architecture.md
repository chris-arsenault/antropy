# Architecture

Antropy is a fully client-side application. The simulation, rendering, instrumentation, and
persistence all run in the browser; the deployed artifact is a static bundle.

## Application

- **Frontend** (`frontend/`): Vite + React + TypeScript SPA. Three.js renders the voxel world
  and instanced ant meshes; React owns the control surface (speed controls, charts,
  inspectors, event timeline).
- **Simulation core** (`frontend/src/sim/`): pure TypeScript, deterministic
  (seeded sfc32 PRNG, fixed integer ticks — [ADR-0002](adr/0002-deterministic-simulation.md)),
  running on the main thread in a budgeted loop with a worker-portable state shape
  ([ADR-0001](adr/0001-main-thread-simulation.md)). The behavioral controller sits behind a
  pluggable `act`/`mutate`/`recombine`/`seed` contract so controller models can be swapped
  without touching the rest of the simulation.
- **Module boundaries** (lint-enforced via ESLint import restrictions): `src/sim/` imports
  neither React, three.js, DOM APIs, nor the other layers; `src/render/` (three.js) and
  `src/ui/` (React, including in-house canvas charts —
  [ADR-0003](adr/0003-custom-canvas-charts.md)) read simulation state through its public
  surface; `src/persist/` serializes world state to IndexedDB and files.
- **Persistence**: IndexedDB for checkpoints plus downloadable file export/import. No server
  round-trips.

The full simulation design — controller model, genome, world, energy economy, reproduction,
regimes, and instrumentation — is specified in [design-spec.md](design-spec.md). As of
v0.2.0 the world runs the metapopulation loop: colony-tagged scent channels (ADR-0005),
scripted queen provisioning via bidirectional trophallaxis and food transport (ADR-0006),
haploid males mating from a global pool (ADR-0007), a four-instinct structured
initialization (chemotaxis, excavation, transport/homing with path integration, brood
care — ADR-0004/0006/0008), nest decay, egg exposure, and seasonal carrying capacity on a
192×64×192 map.

## Deployment

- **Hosting**: the Ahara `website` module (`ahara-tf-patterns`) — S3 + CloudFront + ACM + WAF
  at `antropy.ahara.io`. Terraform root: `infrastructure/terraform/`.
- **State**: shared Ahara state bucket, key `projects/antropy.tfstate`.
- **CI/CD**: the shared reusable workflow (`chris-arsenault/ahara/.github/workflows/ci.yml`)
  reads `platform.yml` (`stack: typescript, terraform`), runs eslint/tsc/vitest/Qlty and
  `terraform fmt`, and deploys on push to `main`.
- **Identity**: the project's deployer role is registered in `ahara-infra`
  (`infrastructure/terraform/control/project-antropy.tf`) with the `website` module bundle
  and `terraform-state` policy.

The project uses no ALB, database, or Cognito integration; those platform steps activate only
if cloud-stored checkpoints or authenticated features are added later
(see [backlog.md](backlog.md)).
