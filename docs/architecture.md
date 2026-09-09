# Architecture

Antropy is a static browser application. The simulation is deterministic and DOM-free; React owns
control flow around it, and Canvas renders a read-only view of its state.

## Layer boundaries

| Layer | Path | Responsibility |
| --- | --- | --- |
| Simulation | `frontend/src/sim/` | Grid, world generation, fields, sensing, actions, policies, metrics |
| Persistence | `frontend/src/persist/` | Versioned 2D checkpoint serialization, IndexedDB, file transfer |
| UI | `frontend/src/ui/` | Canvas rendering, controls, inspector, pacing |
| Harness | `frontend/harness/` | Comparative runs and SQLite evidence |

The simulation imports no React, DOM, UI, persistence, or harness modules. UI and harness callers
may inspect simulation state. Diagnostic interventions are explicit; production controller actions
resolve through the shared physical boundary.

## Runtime composition

The [modular runtime design](design/modular-runtime.md) records the independent SOLID/DRY and
systems audits, contracts and limitations. A small typed kernel executes statically registered
resources, chemistry, actors and lifecycle systems in explicit order. The composition root binds
phase contexts; feature implementations own their registrations. World construction, controller
adapters and checkpoint codecs are separate.

Configuration resolves independent environment mechanisms and per-world chemistry. Presets are
conveniences at the browser/harness boundary, never physical branch conditions.

## Simulation core

The current review world is a 2,048 × 512 X/Y cell lattice. Y is height. Foreground and backing
materials represent heterogeneous ground, exposed chamber walls and connected surface tiers.
A compact six-room nest leaves substantial unused soil. The original layout remains a reference
fixture on this same substrate. A seed determines terrain variation and distributed food.
The material grids, five chemical fields, variable worker
population, queen, staged brood, food quantities, PRNG state and economy are serializable. Integer ticks and deterministic iteration make
checkpoint continuation reproducible.

The default world runs the frozen task-register RNN; programmed controls remain selectable.
Turning consumes a tick; translation attempts
one adjacent unoccupied legal cell. Mandibles pick up or release a bounded food quantity one cell
forward. Workers eat physical food and feed contacted queens or larvae over an occluded two-cell
reach. Their reserves pay for work and upkeep. Queen-funded eggs and locally fed larvae become
pupae and adults; starvation and age remove workers. See the [colony contract](design/programmed-colony.md)
for the conservation equation and development rules.

## Controller boundary

The navigation policies receive a 33-value current-frame vector. The colony policy additionally
receives local contact observations, neighboring fresh-air concentrations and body reserve/crop quantities. It contains body-relative openness;
center concentrations and signed adjacent contrasts for food odor, deep nest odor, and two
pheromones; immediate food and cache contact; carried load; attenuated light; and deterministic individual
variation. The stateless programmed policy has no reference to the world. The map-aware diagnostic
receives the world only in its quarantined policy module, computes a shortest path, then emits the
same action shape as local policies.

The historical generic controller contract exposes `seed`, `act`, `mutate`, `recombine`, and inspection for the historical RNN. The current runtime adapter centralizes state creation, validation and
inspection. Persistence still uses registered models and Float32 state; arbitrary genome opacity
is a remaining boundary, not an implemented claim.

Imported registered colony models add a private byte, a learned task-write head and optional
sensory gains to a shared 64-unit recurrent actor. Eight values are used in the current study;
their meanings are unconstrained at runtime. Private command history and seeded sampling state
remain per worker. The programmed colony writes its existing decision mode for monitoring.

## Browser and persistence

React owns scenario selection, seed selection, pacing, field-layer visibility, checkpoint
controls, live charts, ratios, effective configuration, and the creature inspector. The Canvas
projection uses a two-axis camera with anchored zoom, pan, fit controls and a minimap,
and draws the material cross-section, quantified food, selected fields, oriented workers,
carried-load color, queen reserve and brood stages. It
does not create simulation state.

Checkpoint version 9 declares `dimension: "2d"`, stores foreground/backing cells and actual nest
geometry without regenerating the map, records resolved environment/chemistry and ordered mechanism
versions and independent nest-generation seed, separates food quantity from nutritional energy,
and stores imported registered models plus each worker's numeric register, recurrent state,
command history and private random stream. Import rejects every other shape rather than
guessing at a migration. Browser storage is IndexedDB; file export is local to the user.

## Measurement harness

The harness runs outside Vitest and writes summaries with seed, parameters, commit state, elapsed
time, and outcome to `frontend/harness/ledger.db`. The colony harness measures population, queen reserves, staged brood, food transfers, deaths,
births and energy conservation, including matched deprivation. The retained forager panel measures the
map-aware, programmed, and recurrent arms for five complete food round trips in identical
randomized worlds. Unit tests cover bounded mechanics, not campaign outcomes.

## Deployment

The frontend builds to static assets and deploys through the Ahara `website` module: S3,
CloudFront, ACM, and WAF. Terraform uses the shared Ahara state bucket at
`projects/antropy.tfstate`. The project has no application backend, database, or authentication.
