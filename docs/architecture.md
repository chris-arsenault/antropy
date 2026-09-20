# Architecture

[Computable chemistry](design/chemistry/computational-foundation.md) and [ADR 0022](adr/0022-computable-chemistry.md)
govern the new mathematical architecture: composed manifold reductions, shared geographic vector
operators and bounded cellular mappings designed with their execution cost. The module map and
clock descriptions below describe the active physical v32 runtime. The September15 replacement
and subsequent shared ecology operators execute in ordinary World stepping. Current formulas
belong to the [composed runtime](design/chemistry/composed-runtime.md); old M0/M1/M2 sequences
are archived execution history.

Antropy is a static browser application with one Rust physical kernel compiled to WebAssembly.
The browser and headless experiments execute the same WASM binary. React owns controls and
reduced observations. The world-owning worker also renders through OffscreenCanvas/WebGL2.
[Runtime](design/bacteria.md), [composed laws](design/chemistry/composed-runtime.md) and
[migration dispositions](design/chemistry/numerical-migration.md) define the boundaries.

## Ownership

| Module | Responsibility |
| --- | --- |
| `engine/src/world.rs`, `config.rs` | Durable world, defaults, initialization and integration clock |
| `chemistry.rs`, `genetics.rs` | Constrained U/D/I/S manifold, compact affinities, immutable genomes and compiled operators |
| `field.rs`, `sources.rs` | Node-major float32 chemical amounts, conservative SIMD destination-row exchange, washout and finite localized supplies |
| `transport.rs`, `metabolism.rs`, `organism.rs`, `accounting.rs` | Shared supply, paid transport/reactions, float64 inventories, actual stocks and energy/material books |
| `movement.rs`, `sensing.rs`, `controller.rs` | Periodic contact and funded motion, local chemical/optical sensing, float32 RNN and paid private learning |
| `attraction.rs`, `illumination.rs`, `reaction_medium.rs`, `source_medium.rs` | Shared material binding, composed external drive, public reaction profiles and evolving reservoir mixtures |
| `phenotype.rs`, `phenotype_activity.rs` | Optional bounded recent-flow collection and read-only cohort reductions |
| `lifecycle.rs` | Funded local birth, inheritance, retooling, optional transfer, disturbance and death |
| `ancestry.rs`, `world_validation.rs` | Compact complete parentage, strict restore consistency and numeric checks |
| `observation.rs`, `census.rs`, `relationships.rs` | Read-only reduced facts, spatial groups, traits and ancestry/genetic comparisons |
| `render.rs`, `presentation.rs`, `abi.rs` | Borrowed render buffers and versioned WASM entry points |
| `fixtures.rs`, `study_commands.rs`, `study_trace.rs` | Explicit constructed interventions and optional applied-flow tracing; never production selection |
| `frontend/src/engine/` | Worker/session, WebGL2, React controls, retained observations, binary packaging and IndexedDB |
| `frontend/src/ui/pacing.ts` | Bounded wall-clock pacing; no physical rules |
| `frontend/src/persist/` | Local identity and recovery retention policy only |
| `frontend/harness/` | WASM experiment orchestration, SQLite ledger, versioned artifacts and local reports |

The Rust crate imports no browser or harness implementation. The controller owns weight layout,
diagnostics, inference, assimilation, mutation, expression and distance. There is no TypeScript
physical fallback, second renderer or old-checkpoint adapter. Named food/toxin/matrix pathways
and the superseded sparse-block kernel have been removed.

## Numerical execution

Movement ticks advance 0.2 model seconds. Sources, movement/contact, disturbance and optional
contact transfer run each tick. Every 0.8 seconds, the accumulated interval advances field
transport/washout, sensing/inference, injury, chemical transport, reactions, repair and development.
Maintenance and funded lifecycle decisions run every movement tick. Actions are held between
inferences. The donor-bounded transport operator prices the full accumulated interval. These clocks are persisted, including between physiology steps.

Internal amounts, physical quantities and accounting use float64. Field amounts and RNN
arithmetic use float32. Genotype compilation supplies sparse local affinities and reaction
operators; mutations rebuild these once. Owned material/impedance reductions avoid repeated
full scans. Shared substrate requests commit simultaneously, with no within-phase reaction
cascade or prospective import headroom from export. Field roundoff has explicit matter/energy
accounts. Active chemical groups skip negligible stencil work; the shared1e-6 floor removes
trace concentration with explicit signed rounding accounts. Physical field storage stays dense.

Separate environment, motion and genetic random streams support exact continuation on the
tested WASM runtime. Cross-machine bitwise identity is not promised. The chemistry seed and
resolved coefficients/table are stored together and validated. This supersedes
[ADR 0019's TypeScript implementation choice](adr/0019-single-language-kernel.md), retaining
its single-owner principle.

## Rendering and worker boundary

All cell/RNN/field state remains in WASM. The same worker borrows typed-array views over packed
cell/source/death records and an eight-scalar-per-node field projection. Views are renewed after memory
growth. Stepping and rendering execute sequentially, without shared-state races.

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

Physical checkpoints use versioned v32 binary state. They retain the manifold,
all fields/inventories/stocks, genotypes, private memory, RNGs, source state, accounting,
integration clock, complete parentage, interventions and stop reason. No old schema is inferred.
Living/founder genomes remain; some dead non-founder sequences can be pruned while their
ancestry records remain. Unavailable genetic comparisons are labeled.
Installed machinery identity is distinct from inherited instructions and remains reachable during
pruning. Paid refitting changes function without creating material; its cost becomes heat.

Browser gzip packages add independent run identity, execution provenance, 240 thinned history
samples, current regions and 2,048 recent spatial events with a dropped count. Missing observations
are not reconstructed as routes or extinctions. Census/trait sampling occurs every 25 ticks.
Group definitions are observer conventions, never species or controller inputs.
An independent 81-sample window retains recent effort distributions. Population body, inherited
sequence, founder-relative and learning comparisons are bounded Rust reductions.

IndexedDB retains up to six automatic and two manual packages within256MiB, expiring older
points to fit and always prioritizing the newest valid save. A raw physical checkpoint
is limited to 192 MiB. Saving runs in the worker; failed writes pause without replacing the last
good save. Restores are explicit and paused. The older database stores are untouched.
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

Current [habitat fixtures](material-habitats.md) measure63.78/32.00 ticks/s at48/2,000 cells.
The [mature-state investigation](session-runtime-review.md) measures17.79 headless ticks/s at
3,774 cells with measured observation closed, below the30-tick target. Its short browser probe
finds no forced-GC speed benefit and substantial WASM high-water allocation. The user's fivefold
reload speed change remains unattributed. Historical reliability checks retain their versions;
neither short operational tests nor initial human visual acceptance certify days/weeks endurance.

## Deployment

The static frontend and WASM asset deploy through the Ahara website module using shared
Terraform state at `projects/antropy.tfstate`. Rust's WASM target and SIMD are build requirements.
No backend, new response-header policy, SharedArrayBuffer, authentication or hosted experiment
storage is introduced.
