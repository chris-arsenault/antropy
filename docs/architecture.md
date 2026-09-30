# Architecture

**Status:** Current reference — module ownership, execution, rendering boundary and durability of the physical v46 runtime.

[Computable chemistry](design/chemistry/computational-foundation.md) and [ADR 0022](adr/0022-computable-chemistry.md)
govern the mathematical architecture: composed manifold reductions, shared geographic vector
operators and bounded cellular mappings designed with their execution cost. The module map and
clock descriptions below describe the current runtime. Current formulas belong to the
[composed runtime](design/chemistry/composed-runtime.md); old M0/M1/M2 sequences are archived
execution history.

Antropy is a browser application with one Rust physical kernel. The browser and headless
experiments execute the same WASM build; the native `biotropy-server` compiles the same crate.
React owns controls and reduced observations. The world-owning worker also renders through
OffscreenCanvas/WebGL2. [Execution modes](execution-modes.md) describe browser 1/4-thread
execution and the native server World.
[Runtime](design/bacteria.md), [composed laws](design/chemistry/composed-runtime.md) and
[migration dispositions](design/chemistry/numerical-migration.md) define the boundaries.

## Ownership

| Module | Responsibility |
| --- | --- |
| `engine/src/world.rs`, `config.rs` | Durable world, defaults, initialization and integration clock |
| `chemistry.rs`, `genetics.rs` | Constrained U/D/I/S manifold, compact affinities, immutable genomes and compiled operators |
| `field.rs`, `field_parallel.rs`, `sources.rs`, `source_lifecycle.rs` | Regional float32 chemical rows, region-parallel exchange commits, washout, finite reservoirs and their local release/refill clocks |
| `spatial.rs`, `spatial_regions.rs`, `spatial_material.rs`, `spatial_carriers.rs`, `spatial_members.rs` | Persistent 8×8 regional ownership: sparse material rows, the shared source/body carrier plane and parallel-rebuilt membership bins |
| `parallel.rs`, `execution.rs`, `execution_budget.rs` | Fork/join Rayon scheduling from estimated work, shared resolution for prepared operators and a zero-tick feasibility screen |
| `transport.rs`, `transport_passive.rs`, `metabolism.rs`, `organism.rs`, `physiology.rs`, `accounting.rs` | Shared supply, paid and passive transport, reactions, float64 inventories, genetic capacities at current biomass, aging maintenance and energy/material books |
| `movement.rs`, `sensing.rs`, `controller.rs` | Funded motion, local chemical/optical sensing, float32 RNN and paid private learning |
| `contact_search.rs`, `contact_geometry.rs`, `contact_exchange.rs`, `adhesion.rs` | Circle contacts, contact exchange capped against frozen donors and compatibility-weighted adhesion |
| `attraction.rs`, `medium_response.rs`, `reservoir_coupling.rs`, `climate.rs`, `reaction_medium.rs`, `source_medium.rs` | Shared material binding and crowding, reservoir repulsion/exclusion, compiled local chemical response, public reaction profiles and evolving reservoir mixtures |
| `terrain*.rs`, `geography.rs` | World-creation fractal elevation, conductance, overhead transmission, ceilings and source placement; immutable geography sampled at runtime |
| `illumination.rs`, `optics.rs`, `cover.rs`, `optical_accumulator.rs` | Composed illumination, paid emission, overhead material film and optical allocation |
| `phenotype.rs`, `phenotype_activity.rs` | Optional bounded recent-flow collection and read-only cohort reductions |
| `lifecycle.rs` | Funded local birth, conservative division, inheritance, disturbance and death |
| `ancestry.rs`, `world_validation.rs` | Bounded parentage retention, strict restore consistency and numeric checks |
| `observation.rs`, `census.rs`, `relationships.rs`, `terrain_observation.rs` | Read-only reduced facts, spatial groups, traits, geography and ancestry/genetic comparisons |
| `render.rs`, `render_terrain.rs`, `render_window.rs`, `presentation.rs`, `abi.rs` | Borrowed render buffers, the bounded static terrain projection, display windows and versioned WASM entry points |
| `fixtures.rs`, `study_commands.rs`, `study_trace.rs` | Explicit constructed interventions and optional applied-flow tracing; never production selection |
| `engine/server/` | Native `biotropy-server`: World owner thread, Tokio HTTP/WebSocket, shared display projections, `/api` management, volume persistence and restart diagnostics |
| `frontend/src/engine/` | Worker/session, WebGL2, React controls, retained observations, binary packaging and IndexedDB |
| `frontend/src/ui/pacing.ts` | Bounded wall-clock pacing; no physical rules |
| `frontend/src/persist/` | Local identity and recovery retention policy only |
| `frontend/harness/` | WASM experiment orchestration, SQLite ledger, versioned artifacts and local reports |

The Rust crate imports no browser or harness implementation. The controller owns weight layout,
diagnostics, inference, assimilation, mutation, expression and distance. There is no TypeScript
physical fallback, second renderer or old-checkpoint adapter. Named food/toxin/matrix pathways
and the superseded sparse-block kernel have been removed.

## Numerical execution

Movement ticks advance 0.2 model seconds. Sources, movement/contact and disturbance run each
tick. Every 0.8 seconds, the accumulated interval advances field
transport/washout, sensing/inference, injury, chemical transport, reactions, repair and development.
Maintenance and funded lifecycle decisions run every movement tick. Actions are held between
inferences. The donor-bounded transport operator prices the full accumulated interval. These clocks are persisted, including between physiology steps.

Internal amounts, physical quantities and accounting use float64. Field amounts and RNN
arithmetic use float32. Genotype compilation supplies sparse local affinities and reaction
operators; mutations rebuild these once. Owned material/impedance reductions avoid repeated
full scans. Shared substrate requests commit simultaneously, with no within-phase reaction
cascade or prospective import headroom from export. Field roundoff has explicit matter/energy
accounts. Active chemical groups skip negligible stencil work; the shared 1e-4 floor removes
trace concentration with explicit signed rounding accounts. Material lives in persistent 8×8
node regions: only occupied sites and their halos allocate contiguous 256-species rows, and each
region job commits its own rows, masks and projections
([regional execution](design/spatial-execution.md)). Field, cell and reservoir phases run on
a persistent Rayon pool (shared WASM memory in the browser build; a serial build uses the same
operators) and join before the owner publishes, renders or serializes state.

Separate environment, motion and genetic random streams support exact continuation on the
tested WASM runtime. Cross-machine bitwise identity is not promised. The chemistry seed and
resolved coefficients/table are stored together and validated. This supersedes
[ADR 0019's TypeScript implementation choice](adr/0019-single-language-kernel.md), retaining
its single-owner principle.

## Rendering and worker boundary

All cell/RNN/field state remains in WASM. The same worker borrows typed-array views over packed
cell/source/death records and an eight-scalar-per-node field projection. Views are renewed after memory
growth. Parallel stepping phases join before the owning worker renders, so rendering never
races physical updates.

React receives status, bounded history, reduced region summaries and an explicitly selected
cell. Neither the full 256-species field nor per-frame cell arrays cross the worker bridge.
WebGL uploads still transfer bytes to GPU memory. This removes JS array serialization and
worker structured clones from the render path; it does not claim literal CPU/GPU zero-copy.

The [immutable sharing contract](design/chemistry/data-ownership.md) also governs diagnostics.
Ticks use scalar exports. The browser rejects bulk state queries. Observations use one acknowledged
envelope, incremental history and selected-organism revisions; unchanged genes and genealogy are
not resent on each poll. Bounded replies are decoded from borrowed WASM bytes. Only explicit
checkpoint paths copy reply bytes for asynchronous ownership.

Layer toggles use GPU uniforms. Camera, source markers, population regions and color selection
are independent. Soft groups resolve into real cells as zoom increases. The chemical atlas
uses chemical coordinates, separate from geographic XY. Context loss pauses with world state
retained. Unsupported OffscreenCanvas/WebGL2 reports an error rather than silently changing engines.

## Durability and observation

Physical checkpoints use versioned v46 binary state. They retain the manifold, terrain,
all fields/inventories/bodies, genotypes, private memory, RNGs, source state, accounting,
integration clock, retained parentage, interventions and stop reason. No old schema is inferred.
Living/founder genomes remain; some dead non-founder sequences can be pruned while their
ancestry records remain. Unavailable genetic comparisons are labeled. Body capacities are
reconstructed from genetics and biomass rather than stored as separate installed machinery.

Browser gzip packages add independent run identity, execution provenance, 240 thinned history
samples, current regions and 2,048 recent spatial events with a dropped count. Missing observations
are not reconstructed as routes or extinctions. Census/trait sampling occurs every 25 ticks.
Group definitions are observer conventions, never species or controller inputs.
An independent 81-sample window retains recent effort distributions. Population body, inherited
sequence, founder-relative and learning comparisons are bounded Rust reductions.

IndexedDB retains up to six automatic and two manual packages within 256 MiB, expiring older
points to fit and always prioritizing the newest valid save. A raw physical checkpoint
is limited to 192 MiB. Saving runs in the worker; failed writes warn while execution continues
without replacing the last good save. Restores are explicit and paused. The older database stores
are untouched. Ended history expires at its budget without inhibiting births; living records remain.
Cold operations serialize before allocating snapshots. A GPU fence bounds unfinished frames;
presentation requests and simulation tasks have separate bounded scheduling. An eight-run local
health record can be exported even when the worker is unavailable.
Identity uses `crypto.getRandomValues` without consuming model randomness.
Manual interventions survive ordinary-event rollover; their explicit 4,096-record budget
rejects further interventions before mutation.

## Evidence and limits

Schema-v3 harness artifacts archive the exact loaded WASM binary and configuration, bounded
horizon, provenance, initial/final binary state and observations. Long runs stream samples and
genotypes; study tracing records applied species/product flows. Historical Python readers only
read historical artifacts and reject mixed physical schemas.

Throughput figures and their workloads live in [calibration](calibration.md#calibration-throughput)
and [continuing observation](continuing-observation.md); historical reliability checks retain
their versions.

## Deployment

The static frontend and WASM assets deploy through the Ahara website module using shared
Terraform state at `projects/antropy.tfstate`. Rust's WASM target and SIMD are build requirements.
The multicore browser build uses shared WASM memory and requires cross-origin isolation
(COOP/COEP response headers); browsers without it use the serial build. The native server image
deploys through CI and Komodo to the private host, keeps checkpoints on its Docker volume and
serves operator `/api` on the LAN only. The public spectator route `server.biotropy.ahara.io`
forwards only `/stream` and `/health`; the public site defaults to that server world
([execution modes](execution-modes.md)). There is no hosted experiment storage.
