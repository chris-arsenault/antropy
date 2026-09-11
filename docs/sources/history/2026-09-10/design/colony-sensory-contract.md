# Matched colony sensory precision

The programmed colony now makes decisions from float32 observations. The neural interface uses
the same quantized receptors before calculating normalized contrast. This removes a demonstrated
input mismatch without changing resource storage, energy accounting, local reach, or actions.
The September 7 user decision explicitly chose this direction over increasing neural precision.
No optimizer steps were taken for this change.

## Observation contract

`colony-f32-v1` rounds navigation receptors, fresh-air samples, internal reserve fraction and crop
quantity at the shared observation boundary. Food-contact quantities saturate at four units,
matching the existing neural encoding; the programmed policy only tests them against 0.25.
Crop and food quantities are rounded in their normalized units. Programmed decimal thresholds use
the corresponding float32 values. Boolean contacts retain their exact values.

JavaScript executes arithmetic using its ordinary number type, but both controllers receive the
same float32 sensor information. Conserved physical quantities retain their existing precision.
Quantization is pure and idempotent; neither policy changes the physical world through sensing.

Directional artifact version 4 retains the explicit carrying Boolean as its tenth global input.
The other architecture dimensions and optional four-command history are unchanged. Python export
and TypeScript validation require the versioned observation contract and exact global mapping.
Historical versions 2 and 3 remain readable for diagnostics with their original nine globals;
their weights do not gain a carrying input. Trainers reject datasets without the new contract,
so old double-precision teacher labels must be regenerated before any future fitting.

The regression fixture constructs two fresh-air frames that previously gave identical complete
neural vectors but different programmed actions. They now yield identical inputs and the same
programmed action. Separate tests cover quantizer purity, threshold behavior, blocked gradients,
tiny positive cargo, and the carrying input's route into a version 4 recurrent context.
This establishes a representational defect and its repair; it does not establish that this defect
caused the earlier failed colonies.

## Conditional decisions

Runs 2569 and 2570 apply the archived final directional models to 178 synthetic local cases each.
Every case begins with empty recurrent and command state. Travel cases vary the strongest sample,
its gap and whether that direction is obstructed. Care cases vary contact direction, crop quantity
and competing hunger. Correct means matching the programmed motor decision on the same rounded
frame; secretion is not scored. These are diagnostic cases, not a sampled natural-world accuracy
estimate or a closed-loop survival panel.

| Case                  | Recurrent only | With command history |
| --------------------- | -------------: | -------------------: |
| Air, open             |           6/15 |                 9/15 |
| Air, obstructed       |           7/15 |                10/15 |
| Food, open            |           4/15 |                 5/15 |
| Food, obstructed      |          10/15 |                15/15 |
| Home, open            |           4/15 |                 4/15 |
| Home, obstructed      |          10/15 |                15/15 |
| Eat local food        |            5/8 |                  7/8 |
| Pick up for recipient |            6/8 |                  5/8 |
| Feed recipient        |          18/24 |                20/24 |
| Release surplus       |           2/24 |                 3/24 |
| Eat before feeding    |           0/24 |                 3/24 |

Both models are historical version 3 weights tested with the corrected sensor precision. These
results do not measure the benefit of training with version 4's carrying Boolean. They show that
care priorities and open directional comparisons remain separate problems to investigate.

## Programmed survival and motion

Run 2572 repeats seeds 21–23 for 40,000 ticks using the float32 programmed policy. All queens
survive, all founders have died, and no worker starves. Final conservation residual magnitudes
are below 1.4e-8. The recorded source fingerprint includes the observation contract; its change
does not indicate a change to resource physics.

| Seed | Workers | Adult births | Queen reserve | Queen food received | Stored food |
| ---: | ------: | -----------: | ------------: | ------------------: | ----------: |
|   21 |      19 |           44 |        18.116 |             134.116 |      39.378 |
|   22 |      13 |           40 |        23.318 |             133.318 |      32.010 |
|   23 |      20 |           47 |        21.722 |             137.722 |     248.512 |

Survival does not certify motion. The longest uninterrupted turn sequences are thousands of
commands in both the previous double-precision control and this float32 control:

| Seed | Previous run 2565 | Float32 run 2572 |
| ---: | ----------------: | ---------------: |
|   21 |             3,289 |            3,574 |
|   22 |             5,279 |            4,803 |
|   23 |             2,293 |            2,025 |

This is an existing programmed-motion problem, not evidence that quantization introduced it.
Its local cause has not been diagnosed here. Diagnose those trajectories and obtain visual review
before treating the programmed policy as an acceptable motion teacher or resuming fitting.

## Export verification and reproduction

Run 2568 collects a 512-frame fixture on seed 1 over 64 ticks. Run 2571 invokes the directional
exporter with `--history 4 --epochs 0`: random initial weights, zero optimization, no candidate
selection. Python/TypeScript parity over 16 exported examples has maximum error 1.0431e-7.
The independent carrying-input unit test covers loaded state. The trainer also rejects an old
dataset with the expected message that teacher labels must be regenerated.

From `frontend/`, the following reproduce the interface check without fitting:

```bash
pnpm harness colony-dataset --seeds 1 --ticks 64 --output /tmp/antropy-f32-parity-data
python3 harness/train_directional.py --data /tmp/antropy-f32-parity-data --output /tmp/antropy-f32-parity-model.json --history 4 --epochs 0
pnpm harness colony-parity --model /tmp/antropy-f32-parity-model.json
pnpm harness colony-decisions --model harness/artifacts/directional-2026-09-07/final-history.json
pnpm harness colony-evaluate --seeds 21,22,23 --ticks 40000 --label matched-f32-programmed-reference
```

The generated zero-epoch files are temporary verification artifacts. Durable measurements live in
`frontend/harness/ledger.db`; the preceding commands regenerate the fixture. The bounded suite
passes 50 tests across 16 files. The learned controller remains uncertified and fitting remains
stopped; this change does not promote a model or add genetics or ecology.
