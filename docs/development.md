# Development

## Prerequisites

- Node 24.12.0 from `.node-version`
- pnpm 10.29.3 from `frontend/package.json`
- Terraform 1.12 or newer for infrastructure changes

## Local workflow

```bash
cd frontend
pnpm install
pnpm run lint
pnpm run test
pnpm run build
```

`pnpm run dev` starts the LAN-reachable server on port 26000. Agents start it only after an explicit
user request.

From the repository root:

| Target                     | What it runs                                              |
| -------------------------- | --------------------------------------------------------- |
| `make ci`                  | All required non-deployment checks                        |
| `make lint`                | ESLint                                                    |
| `make fmt`                 | Prettier check                                            |
| `make format`              | Prettier write                                            |
| `make typecheck`           | TypeScript project build without output                   |
| `make test`                | Bounded Vitest suite                                      |
| `make docs-check`          | Required docs, links, stable indexes, source preservation |
| `make terraform-fmt-check` | Recursive Terraform format check                          |
| `make build`               | TypeScript plus production Vite build                     |

## Harness workflow

Run the current comparison from `frontend/`:

```bash
pnpm harness colony-survival --seeds 1,2,3 --ticks 40000 --label review
pnpm harness recent --n 5
pnpm harness sql "SELECT id, experiment, summary FROM runs ORDER BY id DESC LIMIT 5"
```

The colony command records population, brood, queen reserve, food storage, external harvest,
deaths, births and energy conservation. Add `--deprivation 8000` for a matched external-food-loss
control, or `--workers 4` to change the founder count without imposing a population target.
The historical `forager-comparison` and `train-rnn` commands remain single-worker diagnostics.

`pnpm harness colony-yield --seeds 21,22,23 --ticks 40000 --densities 1,0.75,0.5` measures
matched nutritional yield with per-worker activity in 2,000-tick windows and local context for
long turn sequences. Food quantity and navigation clues have the same initial configuration;
nutritional density changes usable energy. See [the experiment record](design/nutritional-yield.md).
The completed [colony training study](design/colony-training.md) has a separate full-colony path.

## Colony training tools

The optional trainer requires Python, NumPy and CPU PyTorch (the recorded experiment used
PyTorch 2.12.0+cpu). These are training dependencies only; the browser and `make ci` use pnpm.
Keep generated dataset prefixes and model filenames distinct. From `frontend/`:

```bash
pnpm harness colony-dataset --seeds 1,2,3 --ticks 12000 --output /tmp/colony-teacher-data
python harness/train_colony.py --data /tmp/colony-teacher-data --output /tmp/colony-candidate-model.json --epochs 60 --seed 17 --recurrent
pnpm harness colony-parity --model /tmp/colony-candidate-model.json
pnpm harness colony-evaluate --model /tmp/colony-candidate-model.json --seeds 4,5,6 --ticks 12000
```

`colony-dataset --model path` collects labels at learner-visited states. Supply all previous dataset
prefixes to the trainer's `--data` argument for aggregation. `--initial path` resumes weights;
`--memory-off true` ablates recurrence in evaluation. `--rms 0.005 --mutation-seed 101` evaluates a
parameter perturbation. Omit `--model` for the matched programmed control. All outcomes are recorded
with their decoding flags; `--discrete-scents true` tests binary learned secretion. Results are saved
in `harness/ledger.db`. The bounded study is complete and failed; these commands document reproduction,
not an instruction to continue tuning automatically.

The [directional experiment](design/directional-training.md) uses the same collector and evaluator:

```bash
python3 harness/train_directional.py --data /tmp/colony-teacher-data --output /tmp/directional-model.json --history 4
pnpm harness colony-parity --model /tmp/directional-model.json
pnpm harness colony-traps --model /tmp/directional-model.json --source 2522
pnpm harness colony-decisions --model /tmp/directional-model.json
pnpm harness colony-evaluate --model /tmp/directional-model.json --seeds 4 --ticks 12000
```

Use `--history 0` when fitting the recurrent-only arm and `--history-off true` when evaluating
the history-trained model with its command ledger erased before every action. This is separate
from `--memory-off true`, which disables recurrence. Learner dataset rows include the actual
previous commands; teacher data can reconstruct them from teacher actions. The trainer rejects
learner datasets that lack the requested history. Static trap replay uses empty recurrent and
command state because the historical capture did not contain either.

New datasets carry `colony-f32-v1`; both trainers reject older teacher labels. Directional exports
use version 4 with the carrying Boolean preserved. `colony-decisions` records separate synthetic
directional and care probes with empty private state. See the [sensory contract](design/colony-sensory-contract.md)
for the no-optimization export check and the programmed motion limitations.

## Quality boundary

The [registered-controller study](design/task-memory.md) adds these commands from `frontend/`:

```bash
python harness/train_registered.py --worlds path/to/world-cases.json --output /tmp/registered-study --initial path/to/version-4-model.json --gated
python harness/train_registered_teaching.py --worlds path/to/world-cases.json --output /tmp/registered-teaching --initial path/to/model.json --gated
pnpm harness colony-parity --model /tmp/registered-study/iteration-12.json
pnpm harness colony-outcomes --model /tmp/registered-study/iteration-12.json --seeds 41,42,43 --ticks 48000
python harness/test_registered_training.py
```

Training output directories must be new. PPO uses colony-wide physical rewards and stores every
update; teaching is a distinct supervised initialization experiment. No model is promoted by
training loss. Use **Import RNN** to load a registered JSON model in the browser. Checkpoint exports
retain its model and private state. Manual register edits mark the run as diagnostic.

`colony-outcomes --task-clamp 0` holds the register at zero as an explicitly recorded intervention.
`--rms 0.001 --mutation-seed 71` measures a fixed weight perturbation. `registered-probe` compares
motor choices across register values on the same sampled local frame and recurrent state.
`registered-checkpoint --model path --seed 41 --ticks 12000 --output path` exports a local review
checkpoint and verifies eight ticks of exact continuation using the normal runtime.

The browser now starts the frozen RNN on **Tiered woodland** at tick zero. **Terrain** selects
the reference, compact or tiered map and recreates the current seed without changing the model.
Drag the map to pan, wheel to zoom, or use Home/Fit colony/Fit world and the minimap. The observation
dock has Inspect, Metrics and Layers tabs and can be collapsed.

Use `colony-outcomes --model src/sim/controller/review-colony.json --terrain tiered --seeds 101
--ticks 48000` for frozen-model transfer. Omit `--model` for a programmed control. Terrain values
are `reference`, `compact` and `tiered`; all share the new cell-material support/transport model.
Version 7 checkpoints store altered terrain directly; earlier world checkpoints are rejected.

ESLint enforces cyclomatic and cognitive complexity 10, 400 lines per file, and 75 lines per
function. Simulation code cannot read wall time or unseeded randomness. Add bounded tests for
coordinate arithmetic, physical action preconditions, deterministic generation, policy
information boundaries, persistence, and UI wiring. Use the harness for performance and behavior
over time.

## Deployment

`scripts/deploy.sh` is parameterless. It builds the frontend and applies the static-site Terraform
root. The shared workflow performs deployment from `main`; local development does not require
cloud resources.

Environment comparison flags and full-config loading are documented in the [modular runtime contract](design/modular-runtime.md). Checkpoints now use version 9 and preserve resolved chemistry, mechanism identities and the independent nest seed.

## Nest-generalization study

The [protocol](design/nest-generalization.md) fixes original physics and reserves whole layouts.
From `frontend/`, create a new study directory and train on its explicit world cases:

```bash
pnpm exec tsx harness/nestGeneralization.ts init /tmp/nest-study
python3 harness/train_registered.py --worlds /tmp/nest-study/train.json --initial src/sim/controller/review-colony.json --output /tmp/nest-study/ppo --iterations 24 --temperature 0.25 --rate 0.00005 --entropy 0.0025 --trace 0.9997
pnpm exec tsx harness/nestGeneralization.ts evaluate /tmp/nest-study/validation.json /tmp/nest-study/ppo/iteration-24.json /tmp/nest-study/validation-ppo.json
pnpm exec tsx harness/selectGeneralization.ts /tmp/nest-study /tmp/nest-study/validation-ppo.json
pnpm exec tsx harness/nestGeneralization.ts evaluate /tmp/nest-study/test.json /tmp/nest-study/selected-model.json /tmp/nest-study/test-rnn.json
```

Use `programmed` in place of a model path for matched controls. Every case contains its numeric
identity, food/random seed and complete config. `nestSeed: 0` preserves the authored layout;
positive values vary its rooms and connections. The browser Environment panel and outcome CLI
(`--nest-seed`) expose this independently of the food seed. Both PPO and supervised initialization
require explicit world-case files, preventing silent use of default physics. Reserved test results
must not drive another fit; a later study needs a newly declared evaluation partition.
