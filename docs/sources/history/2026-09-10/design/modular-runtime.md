# Modular runtime and controlled environment experiments

This is the completed refactor record. The later [colony-knowledge implementation](colony-knowledge.md)
adds an LGP genome and checkpoint v10; references below to neural-only codecs and checkpoint v8
describe this earlier boundary. RNN-specific continuation is canceled. Remaining architecture
work now follows measured needs of [the 2,000-worker milestone](colony-scale.md).

The September 7 architecture review replaces coupled environment presets and monolithic stepping
with resolved configuration and a small deterministic kernel. The user authorized this refactor,
including two independent architecture audits, while requiring all cellular terrain work to remain
available. The RNN weights and local observation vector remain unchanged. No training is part of
this work.

## Audit and decision

Two independent agents reviewed current source bodies: one for SOLID/DRY and one for systems
engineering. Both recommended statically registered, typed plugins with explicit execution order.
The structural index still described retired 3D source; it was not used as current evidence.

| Finding | Implemented response |
| --- | --- |
| `terrainLayout` selected nest, dimensions, ground profile, pockets and tiers together | Independent environment fields; preset names are interpreted only at composition |
| `world.ts` combined construction, fields, controller selection and two tick loops | Construction stays in `world.ts`; generic kernel, simulation composition and feature registrations are separate |
| Global chemistry coefficients were absent from saved configuration | Each world receives a validated, deeply frozen configuration including chemistry; checkpoints retain it |
| Ant creation and persistence knew private neural state details | Controller runtime adapter owns creation, validation, size and inspection metadata |
| `World.ant` retained a dead founder after extinction | Living-worker array is authoritative; checked diagnostic accessor derives its value; extinct summaries return zero |
| Extracting a source module could silently remove it from `physicsDigest` | Recursive sorted runtime source inventory hashes file paths and contents |
| Import accepted invalid chemical indices and incomplete physical state | Checkpoint v8 validates resource identities, chemical cells, reserves, controller state and mechanism manifest |
| Soil pockets consumed the random stream used by tiers | Pocket draws are consumed deterministically even when carving is disabled, preserving existing terrain while isolating the toggle |

The change does not introduce a dynamic loader, service locator, event bus or ECS. TypeScript
modules provide independent development boundaries without hidden scheduling or runtime discovery.

## Ownership and execution

`sim/kernel.ts` validates registration IDs, versions and phase order, then invokes systems over
typed phase contexts. It imports no world, controller, UI or field implementation. Adding a system
within a phase requires a registration and an appropriate context, not a new kernel operation.

`sim/simulation.ts` is the composition root. It binds context data to these registrations:

1. `resources.ts`: grow renewable food and charge the external-energy ledger.
2. `chemistrySystem.ts`: emit and transport fields on the configured cadence.
3. `actorSystem.ts`: iterate workers in existing array order, sense, pay sensing cost, choose a
   local action and resolve it immediately.
4. `lifecycleSystem.ts`: apply worker upkeep/deaths, brood development and queen upkeep/laying.

The tick increments before phase execution. Actions remain sequential: later workers observe
earlier workers' resolved actions. Newborn workers first act on the next tick. The refactor does
not change this causal model to simultaneous decisions.

The historical single-worker RNN assay uses the same kernel with only fields and actors. Its
existing omission of regrowth/lifecycle is explicit and does not determine the colony schedule.

Resource and chemistry plugins have narrowed context types. Actor resolution and lifecycle still
receive the broader world because their existing physical transactions span several stores.
These are trusted physical implementations. Local controller adapters receive only the existing
navigation/colony observations and private numeric state. The map-aware diagnostic is dispatched
outside that adapter and remains quarantined.

## Configuration

`SimConfig.environment` independently selects:

| Field | Values | Mechanism |
| --- | --- | --- |
| `lightModel` | `occluded`, `depth-attenuated` | Binary sky visibility or attenuation by exposed backing depth |
| `nestShape` | `reference`, `narrow`, `compact` | Original nest, original branching with half-size rooms, or compact branching |
| `surfaceProfile` | `rolling`, `woodland` | Generated ground relief |
| `soilPockets` | Boolean | Clay and loose-soil material pockets |
| `surfaceTiers` | Boolean | Connected wood ramps and ledges |
| `support` | `column`, `contact` | Backing at this cell or within two cells below; alternatively backing or nearby solid in any direction |
| `odorTransport` | `supported`, `airborne` | Odor/fresh-air transport over supported cells or all air cells |
| `chemicalSensing` | `supported`, `airborne` | Which neighboring cells chemical receptors can sample |

Width, height and ground datum remain independent numeric configuration values. `chemistry`
contains coefficients, emission strengths and initialization parameters. Pheromone transport
remains surface-bound in both odor modes. Warm initialization still impregnates supported cells;
runtime odor transport follows its own setting.

The column rule derives support from material backing cells. It does not resurrect a runtime
height array, second substrate or old checkpoint adapter. Foreground materials still govern air,
collision and burial. Current generation makes this rule reproduce the original training world's
support envelope.

Presets `reference`, `compact` and `tiered` preserve the three previous terrain combinations.
`baseline` selects original dimensions, original nest, rolling surface, no pockets/tiers and
supported transport/sampling with column support and depth-attenuated light. Every preset resolves to ordinary settings;
physics never branches on the preset name. Generation validates room extents and headroom
separately from checkpoint validity, because saved terrain is restored without regeneration.

Browser **Environment** edits a draft and **Apply and restart** creates a paused world with the
same selected controller and seed. New world and model import preserve selected settings. Scenario
switching preserves environment and chemistry but selects that scenario's economic defaults.

The outcome harness accepts the same independent settings:

```bash
cd frontend
pnpm harness colony-outcomes --terrain baseline --nest-shape compact --seeds 101,102,103 --ticks 48000 --model src/sim/controller/review-colony.json
```

Other flags are `--light-model`, `--surface-profile`, `--soil-pockets`, `--surface-tiers`, `--support`,
`--odor-transport`, `--chemical-sensing`, `--width`, `--height` and `--surface-base`.
`--config path.json` loads a full resolved `SimConfig`; individual flags override named axes.
Boolean values are `true` or `false`. Outcomes record the complete resolved config and source hash.

## Persistence and reproducibility

Checkpoint v8 records foreground/backing materials, actual nest geometry, full resolved config,
the ordered mechanism manifest, food quantities, colony state, and all existing controller state.
It rejects older world formats. The v5 model format and bundled model bytes remain unchanged.
Restoration neither calls terrain generation nor warms fields. Numeric state validation occurs
before constructing runtime fields. Registered state validation belongs to the controller adapter.

Shared equilibrium templates are keyed by exact terrain, support policy, source positions and
complete environment/chemistry config. The synchronous chemical solver retains reusable process
scratch; differently configured interleaved worlds are tested against separately executed worlds.
Concurrent/reentrant stepping inside one JavaScript isolate is not supported.

## Verification and experimental scope

The pre-refactor capture contains six 100-tick worlds: programmed and frozen RNN on each previous
terrain preset. Refactored state hashes match all six exactly, including foreground cells, fields,
worker observations, private memory, food and energy. Schema/config/terrain metadata are excluded
from that hash because their representation changed.

The original-rules preset additionally matches the saved `ppo-long` implementation at every
100-tick sample from zero through 2,000, including generated nest, fields and private state. The
comparison uses whole-file copies of the archived source snapshots in a temporary directory;
no historical implementation enters the browser bundle. The harness script is
`frontend/harness/refactorCheck.ts` and results live under
`frontend/harness/artifacts/architecture-2026-09-07/`.

An initial long panel revealed a missing axis: original light was attenuated down an open
entrance shaft, while cellular light was binary. Those preliminary results are preserved as
binary-light diagnostics, not original-baseline reproduction. The light setting was added, then
archived-source equivalence was extended from 100 to 2,000 ticks before the corrected panel.

The survival panel first reproduces original rules, then varies only `nestShape`. It uses seeds
101–103, both controllers and 48,000 ticks. These seeds previously participated in held-out testing;
this is a transfer regression panel, not new independent evidence for training selection. Depth,
surface tiers and carrier changes remain available as separate axes. Prior terrain runs 2638–2643
remain valid observations about their bundled settings but do not isolate nest-shape transfer.

Depth is checked separately by `harness/depthCheck.ts`: the original nest/surface are translated
from height 128/datum 104 into height 512/datum 320 with original physical rules. All 21 samples
through 2,000 ticks match exactly after translating worker, brood, food and field positions.
This is a bounded translation-invariance check, not a new long-horizon survival certification.
The separate surface-tier feature remains available for subsequent comparisons and retraining.

### Completed survival panel

All runs finish at 48,000 ticks on seeds 101–103. Entries count passes of the full survival and
replacement gate, rather than queen survival alone.

| Nest | Frozen RNN | Programmed | RNN / programmed ledger IDs |
| --- | --- | --- | --- |
| Original | 3/3 | 2/3 | 2651 / 2649 |
| Original branching, narrower rooms | 2/3 | 3/3 | 2650 / 2648 |
| Compact | 0/3 | 3/3 | 2647 / 2646 |

Both original-nest result arrays match the corresponding first three historical results in runs
2636 and 2632 exactly, including the entire sampled series and telemetry, not just final counts.
The programmed original seed 103 retains its queen and workers but misses a late-replacement
window. The narrower-room RNN seed 102 has no workers or brood at the endpoint, although its
queen retains 2.875 energy. All three compact RNN colonies become extinct after only 2, 1 and 1
adult births. Their programmed counterparts finish with 20, 18 and 16 workers.

Only nest shape differs between these configurations; that invariant was checked on the recorded
config bodies. All 18 worlds share runtime source fingerprint
`536c7f5ffdc378400c630451cb7a05e036350e93744615fb136b164e706ae1c4`.
Maximum absolute conservation residual across every recorded sample is 1.936e-8.

The findings support a learned-controller transfer problem on changed nests. They do not establish
which local cue or behavior causes failure, or prove that training overfit one geometric feature.
Future training should vary nest geometry and reserve unseen layouts for evaluation. The frozen
model, current browser terrain and all failed results remain available for human review.

Validation passes 107 tests in 32 files, repository CI and the production build. An intermediate
CI run hit two timeouts under concurrent simulation load; the subsequent full run passed without
raising test timeouts. No browser trajectory review was performed in this environment.

## Remaining architecture boundaries

- The current durable controller format still uses `RegisteredModel` and Float32 private state.
  The runtime adapter centralizes that knowledge; arbitrary future genome codecs require an
  explicit format decision. Genetics is not implemented by adding empty mutation hooks.
- Food quantities and current source membership remain two coordinated stores; renewable source
  locations are separate. Removing the redundant membership set is a later data-model change.
- Actor/lifecycle physical capabilities remain broad. Further narrowing should follow an actual
  new mechanism and its transaction requirements, while preserving energy accounting.
- General plugin-owned persistent stores and migrations are not provided. A new stateful plugin
  must define its checkpoint fields and increment its mechanism version before registration.
- Gravity, collapse, excavation actions and microclimate remain unimplemented. Materials and
  mutable cellular geometry support subsequent work; toggles do not claim those mechanisms exist.
