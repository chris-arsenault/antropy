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
| `sim/genetics/`, `phenotype.ts` | Chromosomes, transmission/mutation policies and independent construction targets |
| `sim/body.ts`, `development.ts`, `accounting.ts` | Actual material stocks, viscous rates, catabolism/construction and separate resource books |
| `sim/controller/plasticity.ts`, `inference.ts` | Private synaptic traces, inherited learning rules and paid updates |
| `sim/reproductivePolicies.ts` | Local fission/budding placement and parent-survival policy |
| `sim/movement.ts`, `resources.ts`, `reproduction.ts` | Paid efforts, kinetic/diffusion-limited uptake, conservative local division and death |
| `sim/events.ts`, `stats.ts` | Logged diagnostic overrides, events and accounting summaries |
| `persist/` | Validated bacterial checkpoints, IndexedDB and local file transfer |
| `ui/` | Canvas, camera, pacing, stats and individual inspection |
| `harness/` | Comparative runs, spatial traces, saved checkpoints and SQLite evidence |

Simulation modules import no UI, DOM, persistence or harness code. Physics calls the controller
interface without interpreting weights. The RNN receives an observation and private state, never
the world. Behavioral genome encoding and variation stay inside the controller; organism genetics
owns chromosome and physical-gene encoding. Checkpoint validation preserves
the exact encoding and scalar precision through controller-owned codecs. The physical interface
owns sensor/action types; a static controller adapter owns brain implementation and inspection.
There is no runtime plugin registry or alternate substrate. See [ADR 0018](adr/0018-bacterial-runtime.md).

## Kernel order

A world step executes supply and field transport, then every cell's observation and RNN inference
against the same chemical snapshot. Paid motion and contact resolution precede local secretion.
Simultaneous uptake divides limited nutrient proportionally among overlapping requests. Catabolism,
maintenance and construction precede contact correction, death and local division. Daughters first act next tick.

Inference first funds optional learning. Movement reserves basal maintenance before allocating
quadratic motor and linear secretion expenditure. Nutrient material, built core/machinery, usable
energy, chemical-energy content, external inputs and sinks have separate material and energy
balances. Secretion consumes precursor material and processing energy. Emitted chemical retains
chemical energy until decay, but cannot be eaten. See [the accounting equations](design/funded-bodies.md).

The world uses float64 resource fields and physical quantities; observations, weights and hidden state
use float32. Integer ticks, stable iteration, deterministic body perturbations and persisted random
streams make checkpoint continuation reproducible. Source schedules, body initialization/division
and genetic variation each have a separate persisted stream, so genetic draws cannot change
physical headings, placement or food schedules independently of inherited behavior.

## Controllers and inheritance

A dense 19-input, 16-unit recurrent network produces propulsion, steering, secretion, candidate task
byte and byte-write gate. All 661 weights and biases plus nine plasticity loci are heritable. Founder weights encode a small
nutrient response; there is no controller fallback, pathfinder or task dispatcher.

Genotypes contain one or two chromosomes, each with behavioral and physical blocks. Diploid
expression is additive. Four independent physical genes target core, motor, transporter and storage
construction. Only actual material stocks affect capabilities. Growth consumes material and usable
energy; inherited target mutations do not grant machinery. Actual volume includes stored food and
sets translational/rotational drag and thermal angular diffusion.
Static policy tables select clonal/selfing transmission, uniform/one-point crossover,
uniform/Gaussian mutation and fission/budding. The controller owns behavioral variation and
expression; no other module interprets its weight layout. Genotypes are immutable after registration;
expression caches use object identity and are reconstructed after restore.

Resource-funded fission replaces the parent with two daughters; budding keeps the experienced
parent and produces one daughter. Offspring receive empty recurrent state, task and synaptic traces,
plus locally initialized receptor baselines. The controller's `assimilate` operation adds a retained
fraction of acquired recurrent changes to birth-local chromosome copies before transmission and
mutation. It leaves shared parental genotypes unchanged. New traces start at zero because learned
changes already reside in the inherited baseline. Genotype ancestry records transfer magnitude;
learning-transfer and mutation counters remain distinct.
The world preserves organism ancestry and genotype ancestry. Diagnostic competition runs sample
genomes for measurement; they never select reproduction in a living population.

## Browser and persistence

The browser creates the same default configuration as the harness: seed 101, 48 founders, persistent
nutrient patches, haploid clonal fission, physical/behavioral mutation, paid plasticity and full
acquired-weight retention on.
It starts paused at tick zero and does not silently restore a saved
run. Run and always-visible stats expose the experiment. Green nutrient and magenta chemical layers
are enabled, with drag pan, wheel zoom, fit and cell selection.

Checkpoint version 4 declares substrate `bacteria-xy`. It preserves fields, source state, resolved
configuration, PRNG streams, all live body/receptor/brain states, genome and organism ancestry,
resource ledgers, recent diagnostic events, durable manual intervention history and stop reason.
Import validates physical parameter relationships, matching body/ancestry records and lifetimes,
controller-owned encodings, actual stock capacities, chromosome counts and both resource balances.
It rejects versions 1–3 and ant files rather than
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
