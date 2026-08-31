# Architecture

Antropy is a fully client-side application. The simulation, rendering, instrumentation, and
persistence all run in the browser; the deployed artifact is a static bundle.

## Application

- **Frontend** (`frontend/`): Vite + React + TypeScript SPA. Three.js renders the voxel world
  and instanced ant meshes; React owns the control surface (speed controls, charts,
  inspectors, event timeline).
- **Simulation core**: fixed-timestep simulation decoupled from the renderer. The behavioral
  controller sits behind a pluggable `act`/`mutate`/`recombine`/`seed` contract so controller
  models can be swapped without touching the rest of the simulation.
- **Persistence**: IndexedDB for checkpoints plus downloadable file export/import. No server
  round-trips.

The full simulation design — controller model, genome, world, energy economy, reproduction,
regimes, and instrumentation — is specified in [design-spec.md](design-spec.md).

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
