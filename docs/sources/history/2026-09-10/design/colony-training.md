# Colony controller training

The user authorized training after the programmed-colony handoff on September 7. This permission
does not constitute a recorded visual acceptance. Train a viable, perturbable local controller;
keep the programmed colony as the reference and keep all physical parameters unchanged.

## Declared experiment

- Training worlds: seeds 1–3, initially 12,000 ticks; extend coverage only for measured omissions.
- Development worlds: seeds 4–6. Diagnose individual action errors before increasing compute.
- Final untouched worlds: seeds 11–13, 40,000 ticks, matched programmed controls.
- Numerical viability: queen alive, no surviving founders, at least eight descendant workers,
  adult recruitment and external harvest during the final 8,000 ticks, conservation residual
  magnitude below 1e-6. Report every seed and the programmed control, including failures.
- Fit the current-frame policy first; compare recurrence on the same interface. Hidden state is
  per worker and resets at birth, never shared between workers.
- Initial fitting budget: two deterministic fits from the same initialization seed, zero-memory
  and recurrent, 60 epochs each. At most two diagnostic dataset
  aggregation rounds, 40 epochs each, before an explicit structural disposition. Do not select on
  final held-out worlds or change physics to rescue a candidate.
- Perturbations: three independently seeded variants at each of 0.001, 0.005 and 0.01 absolute
  weight RMS, measured in closed loop. Perturbations are harness experiments, not inheritance.

The network receives only the teacher's local frame. Receptor normalization may express local
contrasts more legibly but cannot supply desired headings or actions. Motor logits compete before
action resolution; pheromone outputs share the physical resolver. No teacher fallback executes
inside a learned colony. Genetics, climate, digging and reproductive selection remain excluded.

## Reproducibility

Datasets and model JSON files are generated artifacts. Record source digests, seeds, settings,
model hashes, class errors, closed-loop outcomes and perturbation distances in the harness ledger.
Training uses locally installed CPU PyTorch; the browser runtime stays TypeScript and requires no
Python or tensor library. Verify exported inference against Python logits before behavioral gates.

## Result: no viable learned colony

The bounded study is complete. Neither the recurrent network nor the final aggregated feedforward
network sustains a queen. No model was promoted into the default browser simulation. The programmed
colony remains the reference; genetics, microclimate and digging remain excluded.

The encoder has 111 values: the original 33 navigation values, 40 local contact values, eight air
samples, reserve and crop quantities, eight normalized air contrasts and twenty normalized odor
contrasts. Normalization only compares values in the supplied local frame. The networks have two
64-unit tanh layers, eight competing motor logits and two sigmoid pheromone outputs. The recurrent
variant adds a 64-by-64 matrix over the individual worker's previous hidden state. Model format 1
contains 16,074 numeric parameters; the zero-memory variant leaves the recurrent matrix inactive.

Training used PyTorch 2.12.0+cpu with three CPU threads and initialization seed 17. The recurrent
fit uses consecutive 16-step worker sequences with state reset at chunk boundaries; it does not
claim full-life backpropagation. Both first fits use 60 epochs of 100 batches, with 1,024 frames
per batch. Adam uses rate 0.001, bounded class weights and gradient clipping at 5. Two 40-epoch
aggregation rounds retain the original teacher data and add learner-visited training-world frames.

| Training run | Candidate                      | Dataset rows | Final fitting loss | Zero-state motor accuracy |
| -----------: | ------------------------------ | -----------: | -----------------: | ------------------------: |
|         2514 | Feedforward                    |      339,520 |            0.12355 |                    97.30% |
|         2515 | Recurrent                      |      339,520 |            0.08818 |                    94.88% |
|         2519 | First feedforward aggregation  |      465,520 |            0.08398 |                    98.12% |
|         2525 | Second feedforward aggregation |      591,520 |            0.07032 |                    98.46% |

The recurrent zero-state score is an ablation diagnostic, not its sequential accuracy. Fitting
losses use weighted motor cross-entropy plus 0.2 times pheromone binary cross-entropy and are not
colony fitness. Fitting took approximately 84 seconds across the four runs; behavioral evaluation
was separate. Dataset runs are 2513, 2518 and 2524. Model-output naming initially overwrote one
generated dataset manifest; its exact contents were restored from run 2518, weights were preserved,
and the trainer now rejects model/report paths that overlap dataset inputs.

## Closed-loop evidence

Development probes 2516, 2517, 2520, 2521, 2522 and 2526 never feed the queen or produce adults.
Run 2520 disables memory in the trained recurrent model; that also fails. Run 2523's matched
programmed controls pass on all three development worlds. Late local frames in run 2522 record
workers choosing repeated turns while the teacher would move along the available air gradient.
The network's errors alter the positions and chemical traffic it subsequently observes; higher
training accuracy does not remove those closed-loop traps.

The final models were frozen before opening held-out seeds 11–13. All runs last 40,000 ticks:

|  Run | Controller                   | Viable worlds | Final workers, seeds 11 / 12 / 13 | Adult births     | Queen feeding                   |
| ---: | ---------------------------- | ------------: | --------------------------------- | ---------------- | ------------------------------- |
| 2534 | Programmed control           |           3/3 | 20 / 20 / 20                      | 47 in each world | 137.30 / 137.70 / 137.49 energy |
| 2530 | Recurrent                    |           0/3 | 0 / 0 / 0                         | 0 in every world | 0 in every world                |
| 2538 | Final aggregated feedforward |           0/3 | 0 / 0 / 0                         | 0 in every world | 0 in every world                |

All queens in the learned arms are dead by tick 16,000. The world-source fingerprint is identical
across every dataset and evaluation row in this study; resource, action, maintenance, development
and chemical parameters were not retuned. Final energy residual magnitudes remain below 1.3e-8
in the held-out panels.

## Weight perturbations and disposition

Runs 2527–2529, 2531–2533 and 2535–2537 apply uniform independent noise to every recurrent-model
parameter, using seeds 101–103 at requested RMS scales 0.001, 0.005 and 0.01. Each runs on development
world 4 for 40,000 ticks. All nine lose the queen and workers, with zero queen feeding and zero adult
births. Actual measured parameter distances are retained per run. There is no viable center around
which these measurements could establish a safe mutation radius.

The existing `harvested` counter measures gross exterior pickup and can recount food released and
picked up again outside. One perturbation records 797.29 pickup units but zero queen feeding; that
counter alone cannot certify food return or give an evolutionary reward. Conservation and actual
queen provisioning remain separate measurements.

Final review also tested whether weak unintended pheromone deposition explains the failure.
`--discrete-scents true` decodes each learned sigmoid secretion at 0.5 to an exact zero or one.
Runs 2539 and 2540 test the aggregated and recurrent candidates on development seed 4 for 12,000
ticks. Both still deliver zero queen feeding and zero adult births; recurrent gross pickup rises
to 83.025 units. Secretion decoding affects travel but does not resolve the colony failure.

Stop fitting this candidate family. The measured blocker is reliable local motor control during
travel, before colony-care labels can become useful. A proposed next experiment is a learned
directional scoring representation that preserves comparisons between local receptor samples,
tested first on the captured turn traps. That is a hypothesis, not a verified fix or permission to
change the physical world. This study does not justify advancing to genetics or additional ecology.

Exact model values and Python parity vectors are retained in
[the artifact directory](../../frontend/harness/artifacts/colony-2026-09-07/README.md).

The user subsequently authorized the [shared directional experiment](directional-training.md),
including consideration of recent-action memory. Its evidence is separate from this completed study.

Verification: 40 bounded tests in 14 files, Python/TypeScript parity below 2e-6 on the exported
examples, lint, formatting, TypeScript, documentation and Terraform format checks, and the production
build. The initial whole-world equality test exceeded the five-second test limit; its corrected
checkpoint-based comparison verifies durable state without scanning unused chemical scratch space.
