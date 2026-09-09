# Architecture

Antropy is a static browser application. The deterministic, DOM-free bacterial kernel runs in
both the browser and Node harness. React controls pacing and inspection; Canvas reads world state.
The [bacteria contract](design/bacteria.md) defines the current substrate. Ant architecture is
preserved at tag `ant-colony-checkpoint-2026-09-09`.

## Ownership

| Module | Responsibility |
| --- | --- |
| `sim/config.ts`, `types.ts`, `world.ts` | Resolved parameters, durable world shape, initialization and step order |
| `sim/fields.ts`, `geometry.ts`, `spatial.ts` | Periodic transport and sampling, body geometry and local contact lookup |
| `sim/sensors.ts`, `controller/rnn.ts` | Local observation and receptor adaptation; float32 inference and genome variation |
| `sim/movement.ts`, `resources.ts`, `reproduction.ts` | Paid efforts, proportional uptake, metabolism, local division and death |
| `sim/events.ts`, `stats.ts` | Logged diagnostic overrides, events and accounting summaries |
| `persist/` | Validated bacterial checkpoints, IndexedDB and local file transfer |
| `ui/` | Canvas, camera, pacing, stats and individual inspection |
| `harness/` | Comparative runs, spatial traces, saved checkpoints and SQLite evidence |

Simulation modules import no UI, DOM, persistence or harness code. Physics calls the controller
interface without interpreting weights. The RNN receives an observation and private state, never
the world. Genome encoding and mutation stay inside the controller; checkpoint validation preserves
the exact encoding and scalar precision through controller-owned codecs. The physical interface
owns sensor/action types; a static controller adapter owns brain implementation and inspection.
There is no runtime plugin registry or alternate substrate. See [ADR 0018](adr/0018-bacterial-runtime.md).

## Kernel order

A world step executes supply and field transport, then every cell's observation and RNN inference
against the same chemical snapshot. Paid motion and contact resolution precede local secretion.
Simultaneous uptake divides limited nutrient proportionally among overlapping requests. Maintenance
and growth precede contact correction, death and local division. Daughters first act next tick.

Movement reserves basal maintenance before allocating motor and secretion expenditure. Body reserves,
biomass, environmental nutrient, external input and losses form an explicit resource balance.
Emitted chemical has a separate concentration/decay balance and cannot be eaten.

The world uses float64 resource fields and physical quantities; observations, weights and hidden state
use float32. Integer ticks, stable iteration, deterministic body perturbations and persisted random
streams make checkpoint continuation reproducible. Source schedules, body initialization/division
and genetic variation each have a separate persisted stream, so genetic draws cannot change
physical headings, placement or food schedules independently of inherited behavior.

## Controllers and inheritance

A dense 15-input, 16-unit recurrent network produces propulsion, steering, secretion, candidate task
byte and byte-write gate. All 597 weights and biases are heritable. Founder weights encode a small
nutrient response; there is no controller fallback, pathfinder or task dispatcher.

At resource-funded division the parent is replaced by two daughters. Each inherits independently
mutated weights, empty recurrent state and task byte, and locally initialized receptor baselines.
The world preserves organism ancestry and genotype ancestry. Diagnostic competition runs sample
genomes for measurement; they never select reproduction in a living population.

## Browser and persistence

The browser creates the same default configuration as the harness: seed 101, 48 founders, persistent
nutrient patches, mutation on. It starts paused at tick zero and does not silently restore a saved
run. Run and always-visible stats expose the experiment. Green nutrient and magenta chemical layers
are enabled, with drag pan, wheel zoom, fit and cell selection.

Checkpoint version 2 declares substrate `bacteria-xy`. It preserves fields, source state, resolved
configuration, PRNG streams, all live body/receptor/brain states, genome and organism ancestry,
resource ledgers, recent diagnostic events, durable manual intervention history and stop reason.
Import validates physical parameter relationships, matching body/ancestry records and lifetimes,
controller-owned encodings and resource balances. It rejects version 1 and ant files rather than
inventing missing history or random state. IndexedDB uses a separate bacterial database.
No backend or hosted data transfer is involved.

## Measurements and limits

The harness records configuration, seed, source digests before/after execution, elapsed time, outcomes and sampled trajectories
in local artifacts and the retained SQLite ledger. Old rows keep their ant identities. Bounded tests
cover mechanics and integration; ecological outcomes are in [the results record](design/bacteria-results.md).
Competition artifacts embed both compared genome encodings and hashes, source-checkpoint hash and
source interventions. A filename alone is not the identity of an experiment. The visible stats
mark runs with manual interventions as diagnostic even after recent events have rolled over.

Each mounted view owns one resize observer and reusable Canvas/raster buffers. Camera changes
reuse the field image; only field ticks, layer changes or a replaced world invalidate it.

The contact model uses bounded displacement and four local separation passes, not a rigid-body
constraint solver. Long-run ancestry retention grows with births. The 2,000-cell load probe falls
below 30 ticks/s on the measured host; no browser throughput or visual certification is claimed.

## Deployment

The frontend builds to static assets and deploys through the Ahara `website` module: S3,
CloudFront, ACM, and WAF. Terraform uses the shared Ahara state bucket at
`projects/antropy.tfstate`. The project has no application backend, database, or authentication.
