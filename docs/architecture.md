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
  pluggable `act`/`mutate`/`recombine`/`seed`/`genomeDistance` contract so controller models can be
  swapped without exposing genome internals to the world.
- **Module boundaries** (lint-enforced via ESLint import restrictions): `src/sim/` imports
  neither React, three.js, DOM APIs, nor the other layers; `src/render/` (three.js) and
  `src/ui/` (React, including in-house canvas charts —
  [ADR-0003](adr/0003-custom-canvas-charts.md)) read simulation state through its public
  surface; `src/persist/` serializes world state to IndexedDB and files.
- **Persistence**: IndexedDB for checkpoints plus downloadable file export/import. No server
  round-trips.

The ant renderer instances one merged low-poly geometry with abdomen, thorax, head, six legs, and
two antennae. Terrain rendering separates the adjustable-opacity surface skin from opaque
subsurface tunnel walls so x-ray viewing does not erase the tunnel boundary. These are display
mechanisms only; neither affects simulation state.

The full simulation design — controller model, genome, world, energy economy, reproduction,
regimes, and instrumentation — is decomposed in [the normalized design](design/README.md). The
original specification is retained in the [source archive](sources/design-spec.md). As of
v0.3.0 the world runs the liability metapopulation: colony-tagged scent channels
(ADR-0005), scripted queen provisioning via trophallaxis, food transport, larder restock,
and larval rearing (ADR-0006, ADR-0011), haploid males from a global pool (ADR-0007),
structured initialization with chemotaxis, excavation, nest-plume homing, brood care,
pickup, and heat-escape instincts (ADR-0004/0006/0008; interface ownership follows the
[current principles](principles.md#principles-layers)),
microclimate stress with climate-keyed egg exposure and year-round storms, physical
hoarding, nest decay, seasonal famine troughs, and automatic continuation from survivor
genetics on a 192×64×192 map. Measurements (tournaments, calibration, seed derivation,
determinism checks and evolutionary-health series) run through the harness into a committed SQLite ledger
(`frontend/harness/`, ADR-0012), never through the test tiers.

Genetic ancestry uses a world-wide monotonic identity distinct from transient ant ids, local
patrilines, and colony scent owners. The identity follows an egg into its adult or queen state;
durable records retain actual parents, founder line, offspring contribution, net external-food
merit, and completed death outcomes. Checkpoints preserve those records and the controller-owned
founder genome references used for distance measurements.

The web app exposes four world-level scenarios: the default authored-nest colony-loop review, the
historical functional-controller diagnostic, isolated nest digging, and the full liability colony.
A scenario selects the world configuration and founder seed together; feature gates and cargo
capacities are stored per world and displayed by the effective-config panel. The default review
uses the trained colony seed in the exact authored nest. It disables digging, mortality,
reproduction, founding, genetic variation, weather, decay, and automatic continuation so food
logistics can be watched without admitting later ladder systems.

The authored-nest builder carves the fixture before placing the colony and never calls the legacy
founding excavation path. The current [environment design](design/environment.md) gives this
control arm three physical carrier families: the deep-source homing field, absorbed owner-tagged
colony odor in nest material, and colony odor transferred by contact to handled food. Five scent
fields expose level, center, down/up, vertical stereo, and phasic samples through the 105-input
controller vector. The sensor-limited oracle and the RNN resolve the same eight outputs through
the same world action path.

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
