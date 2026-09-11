# Training recovery audit, September 8

Status, September 8: this recovery work and its unfinished RNN branches are canceled at the
user's request. Preserve the evidence and artifacts below. Earlier continuation commands are
historical, not pending work; do not resume them. Next is [the 2,000-worker milestone](colony-scale.md).

Before cancellation, the user required the techniques that produced the earlier viable RNN and
rejected the frozen RNN as an initializer. That correction governed the nest-generalization study
and superseded continuation from `review-colony.json` and its geometry-PPO descendants.

## What the earlier successful run actually did

The [task-memory record](task-memory.md) and its
[artifact chronology](../../frontend/harness/artifacts/task-memory-2026-09-07/README.md)
establish the following. The earlier 6/6 result used one shared recurrent network throughout.

| Technique | Mechanism and evidence |
| --- | --- |
| Historical initialization | The task curriculum loaded v4 `outcome-2026-09-07/antropy-outcome-search-d/generation-2.json`. It contains learned navigation weights, not random initialization or a certified colony controller. |
| Task-labelled demonstrations | The local programmed policy supplied motor, secretion and temporary task-write targets. Values were permuted: forage 0, return 5, care 2, eating 7. |
| Decreasing assistance | Five 8,000-tick collection stages used assistance 1, 0.75, 0.5, 0.25 and 0. Each curriculum fit used that stage's frames; accumulated replay began afterward. Training-time assistance was explicitly recorded. |
| Retained autonomous error replay | `aggregate-concat` collected three new unassisted stages, retaining initial teacher and late learner trajectories (`stage-0.f32` and `stage-4.f32`). It used 20 epochs, 60 batches and rate 0.0005. |
| Temporal state and balanced losses | Training used exact previous recurrent state and actual command history, 32 consecutive decisions, motor/task class weighting and separate motor, register and pheromone losses. |
| Physical-outcome optimization | `ppo-replay-concat` ran 12 updates with temperature 0.25, rate 0.0001, entropy 0.005, gamma 0.9995 and trace 0.999. `ppo-long` then used 24 updates, rate 0.00005, entropy 0.0025, trace 0.9997 and the full-survival bonus. |
| Independent acceptance | Frozen run 2636 passed all six reserved 48,000-tick worlds: surviving queens and descendants, continuing feeding and births, no founders and conserved energy. Human motion review remained separate. |

Separate task specialists, neural weight splicing and a runtime expert router were not used.
Those were proposals. Calling both temporary task supervision and specialist-network training
"task-based training" caused contradictory answers. The subsequent claim that both earlier
answers were simply correct did not adequately correct that ambiguity.

## Errors in the recent continuation

1. Continuing the successful v5 weights with PPO omitted the earlier demonstration and replay
   stages when changing the training distribution. Raising temperature did not restore them.
2. The response pivoted to new specialists and recombination before accurately reconstructing
   the measured successful method. That proposal is not a prerequisite for this recovery.
3. The last handoff described a complete pipeline as running, although only the five-stage
   curriculum process had been launched. Separate replay, outcome optimization and final testing
   remained pending. Starting a process did not complete the requested training work.
4. CPU utilization and memory growth were reported as evidence that collection was healthy and
   advancing. They show resource use; stage artifacts and physical results establish progress.
5. Keeping 8,000-tick collection windows was attributed to a proven causal necessity. It is a
   setting from the historical recipe. No ablation established that exact duration as necessary;
   recurrent backpropagation actually spans 32 decisions, not 8,000.
6. Plans and the initial protocol still described the superseded initializer and omitted the
   recovery run's actual stage status. They must track measured work and explicit pending stages.
7. The first reproduction retained every curriculum stage, introducing replay earlier than the
   historical run without an ablation. The ingredients matched, but the data schedule did not.

The visible conversation records model switches. It does not establish which serving model
handled each response or causally attribute these errors to a particular model tier. No agent
spawn or model-switch operation was performed by this recovery audit. Do not claim that a model
has been pinned or changed without checking the actual selection mechanism.

## Corrected execution

Use the same historical v4 initializer, SHA-256
`fa6648df3adcfb0aca47cc048aff52b72939841bec50515f4035867abe161057`.
The current command and `task-curriculum/training.json` both name that initializer. New task
layers are initialized by the registered trainer. This is a new task-learning lineage, not a
fresh random network and not continuation of the rejected current v5 model.

The first reproduced five-stage curriculum used the six declared training layouts with original physics,
8,000 ticks per stage, 15 epochs, 40 batches, rate 0.0005 and ungated task projection.
It retained all earlier stages while fitting later stages. This was an untested change to the
historical curriculum. The `stage-local-recipe` reproduction restores stage-local fitting and
retains earlier datasets during subsequent autonomous aggregation, where the successful run used it.

After that curriculum, inspect autonomous care and replay coverage, then reproduce the three
unassisted aggregation rounds while retaining teacher and learner data. Rotate food seeds only
within training layouts as in the earlier progression. Continue with the measured replay-PPO
and longer survival-PPO stages, checking frozen candidates independently and diagnosing failures
before expanding a run. Collection results describe pre-update weights; they do not certify the
saved post-update candidate. Loss and task agreement are learning diagnostics, never survival gates.

Do not substitute a new specialist architecture or automatically repeat experiments already shown
to fail merely to claim every historical trial was rerun. Preserve the useful methods, their
provenance, current local-sensor contract and exact TypeScript/PyTorch inference checks.

Selection still uses the three declared validation layouts. The six test layouts remain reserved
until a candidate is frozen; they must never supply teacher data or choose a training change.
Keep all prior failed and comparison artifacts. A selected model must descend from the corrected
curriculum, not from the old model or its PPO-only continuation. Final evaluation and tick-zero
browser preparation remain required, followed by human visual review and a stop before further ecology.

## Verified status at audit

Three curriculum stages (assistance 1, 0.75 and 0.5) completed with 1,183,642 collected frames.
They include physical feeding and births but remain assisted, 8,000-tick observations. They are
not independent colony-survival passes. The curriculum process is still active. Separate
autonomous aggregation, corrected-lineage PPO, reserved evaluation and browser preparation are
pending; no automatic runner for those later stages has been launched. Refresh the actual training
report before reporting a newer status. Poll at meaningful intervals and use completed artifacts
for progress; do not replace progress with repeated process-resource reassurance.

## Continued execution, September 8

All five curriculum stages completed with 1,919,422 frames. Their final autonomous collection
used the stage-4 model; the fitted stage-5 model is a separate candidate. Stage-5 Python/TypeScript
inference agrees within 0.00000191 on the saved parity examples.

The recorded-state audit of that last curriculum collection found 89,580 teacher requests to
eat, of which the learner selected eat on 279 frames. It issued 11,415 empty-crop feed commands.
All 329 loaded contacts with a hungry recipient directly ahead selected feed. These observations
localize decision errors; they do not establish survival or describe the later fitted model.
The hashes and per-layout confusion matrices are in
`nest-generalization-2026-09-08/curriculum-autonomous-decisions.json` under the harness artifacts.
The synthetic zero-state probe (ledger 2666) remains a separate diagnostic.

Three autonomous aggregation rounds now retain the initial teacher and late learner datasets
while rotating food seeds 4 and 5 across the same six training layouts. The first collection
contains 330,875 frames. Its stage-5 behavior model reduced empty-crop feeding to 191 commands,
but followed only 70 of 6,987 teacher eat requests; local care and navigation still need work.
The food placement also changed, so this is not a controlled estimate of the curriculum update's
effect. `replay-initial-decisions.json` records the model, dataset and diagnostic source hashes.

`harness/nestGeneralization.ts rotate-food INPUT OUTPUT SEEDS` generates validated case files
while preserving nest geometry, physics and case identity. The reserved layout definitions are
unchanged. Neither replay diagnostics nor partial validation permits promotion to browser review.

The curriculum-only stage-5 validation completed with 0/3 survival passes (ledger 2667–2669).
The compact validation world retained its queen and three descendants at tick 48,000, but failed
the continued-birth condition. Reference and narrow colonies died. This is a completed negative
control for the subsequent replay and physical-outcome stages.

`harness/resume_registered_recovery.py` now watches the running aggregation process, verifies
three completed autonomous stages and the historical initializer lineage, and executes the
12-update replay PPO followed by 24-update long PPO with the historical settings. It then evaluates
the three frozen aggregate/replay/long endpoints on the declared validation layouts. Generated
`continuation.json` records commands and exit status; per-stage logs preserve failures. The runner
cannot freeze a selection, inspect reserved outcomes or modify the browser. Those remain separate
reviewed steps after development results are available.

Aggregation finished all three rounds (990,175 additional frames, ledger 2670). Its saved
stage-3 model passed the Python/TypeScript parity check within 0.00000191. The subsequent replay
PPO completed 12 updates and 1,156,683 actor decisions. Long PPO began automatically at 01:22:28 UTC
from that iteration-12 model, using the same six training nests and food seeds 1, 2 and 6.
Changing-policy training trajectories are not independent survival results; frozen validation
and selection remain pending at this checkpoint.

A frozen replay-PPO diagnostic on training reference nest 394729, food seed 2, confirms a delivery
failure (ledger 2672, `reference-care-diagnostic.json`). Across 16,000 ticks it records 121 release
commands, none with queen contact; queen feeding totals 1.6, brood feeding 3, births 0 and workers 0.
Stored energy remains 76.65. Its full config matches the training case. This is a training-world
diagnosis, not reserved evaluation. If the failure persists in frozen development validation,
prioritize the mistaken care decisions in retained replay before considering more PPO updates.

## Controlled care replay

The long-PPO midpoint passed only the compact validation case (ledger 2673–2675). Reference and
narrow lost their queens and workers. The reference endpoint retained 127.12 stored energy;
narrow issued 877 release commands, only 13 with queen contact. The original long run continues
to its declared endpoint as a comparison.

The new paired experiment holds the initializer, collected trajectories, retained datasets,
optimizer, seed, temperature, rate and fit duration constant. Its initializer is corrected-lineage
`ppo-long/iteration-12.json`, raw SHA-256
`847833159c27505b34dfd15ca41d7b1b29c085b9b221dd25709ce5e99a3fc0e2`.
Collection uses the six training nests, food seeds 1/2/6 and deployment temperature 0.25, with
zero assistance for 8,000 ticks. It retains curriculum `stage-0.f32` and `stage-4.f32`.

The control fits with ordinary sampling for 20 epochs, 60 batches and rate 0.0005. The paired
offline fit reuses the exact same files and initializer, checked by hashes. Half of its sequences
retain ordinary sampling. The other half sample equally among nonempty pickup, eat, feed and
release error groups. A group includes both missed teacher actions and premature learner actions.
Errors are scored across 32-decision sequences starting from the recorded recurrent state;
groups are fixed before that fit. No runtime action masks, teacher rules or sensors are added.

`fit_registered_replay.py` records zero new simulated ticks. Losses between the two sampling
distributions are not acceptance evidence. Frozen 48,000-tick validation on the same three
development worlds determines whether the change improves physical survival. Reserved worlds
remain excluded from collection and selection.

Both paired fits failed all three survival cases. Ordinary replay is recorded in ledger
2678/2680/2686; prioritized replay in 2682/2684/2688. Prioritization raised reference births to 19,
but feeding stopped and the queen and descendants died. It remains an explicit experimental
option, disabled by default. More births alone did not meet the declared outcome.

The original full-PPO endpoint completed 24 updates and 3,531,205 actor decisions. Frozen
validation passed narrow and compact but failed reference (2691–2693), making it the strongest
completed development candidate at 2/3. Reserved tests have not been opened.

## Coverage and corrective fitting

Two independent experiments now compare with the ordinary 8,000-tick replay control:

- Extend autonomous collection to 32,000 ticks, retaining the same initializer, six training
  worlds, early datasets, temperature and fit settings. Sampling remains ordinary. This changes
  which colony states are observed, not the 32-decision backpropagation horizon.
- Fit only the physical care output rows on the existing control data. Recurrent, directional,
  task-register and pheromone weights remain frozen and are checked exactly afterward. This tests
  whether joint corrective fitting disrupts previously learned behavior. It changes no runtime
  rules or network topology; 325 parameters can change in the current 64-unit model.

The teaching collector now streams float32 rows through a bounded buffer, and Python memory-maps
the completed file. A real 640-tick collection reproduced all 5,120 prior control frames exactly;
the longer run's first 8,000 ticks also match the control's 68,800 first-world rows byte-for-byte.
Physical collection progress is written every 2,000 ticks. A growing `.f32` is partial: only the
completed stage report certifies its row count and fit result.

The long collection produced 2,617,722 frames. Its frozen fit passed only compact (2699–2701),
with 20 descendants and 55 births; reference and narrow died. The care-output-only fit passed
0/3 (2695–2697). Neither experiment improved the full-PPO endpoint. A balanced classification
probe on a held-out training case found that raw local features reduced false release labels,
but increased false eating labels. The probe is not a survival result or proof that a larger
network would solve the failure. No reserved validation/test teacher frames were collected.

## Preserve learned behavior during correction

`conditional-care` uses the same midpoint initializer, control trajectories, retained data,
ordinary sequence sampling and fit settings as the ordinary care replay control. It changes
the training objective. In temporary teacher care roles or when the teacher requests a physical
care action, it teaches the teacher motor choice. Elsewhere it preserves the frozen initializer's
relative idle/turn/move distribution while suppressing premature physical care actions. It
distills the initializer's task and pheromone outputs on all frames instead of imposing the
teacher's task labels after PPO. All parameters remain trainable.

This tests interference from whole-controller teacher supervision without adding a runtime
router, mask, teacher or sensor. The frozen reference exists only inside the fitter. Both models
unroll the same 32-decision sequences from recorded private state. Loss and classification
accuracy cannot certify the resulting policy; the same frozen 48,000-tick validation applies.

Conditional correction passed compact only (2703/2704/2707), matching its midpoint initializer's
1/3 and remaining below the full-PPO endpoint's 2/3. Its inference parity error is 0.00000191.
Fixed quarter-point PPO checkpoints 6 and 18 each passed compact only (2706/2708/2710 and
2705/2709/2711). Alongside iteration 12 at 1/3 and iteration 24 at 2/3, this leaves the final
checkpoint strongest among these declared samples, without a valid candidate.

## Stage-local recipe reproduction

The original `teaching-concat-fixed/training.json` records motor counts for each stage separately:
they sum to that stage's frame count, allowing for clamped empty classes. The first reproduction's
counts instead accumulate all previous stages. This is direct evidence of a distribution-schedule
difference; it does not establish that retention caused the survival failures.

`train_registered_teaching.py --stage-data latest` now makes stage-local curriculum fitting
explicit. `--stage-data all` preserves accumulated aggregation. Explicit `--replay` files remain
present under either policy. Every completed stage records the actual fitted dataset paths,
hashes and row counts. The bounded tests cover both policies and preservation of explicit replay.

`run_registered_recipe.py` runs the five latest-stage curriculum fits, three retained aggregation
fits and both physical PPO stages, then evaluates frozen endpoints. The September 8 run began at
03:03:07 UTC under `nest-generalization-2026-09-08/stage-local-recipe`. Its train, validation,
reserved-test, replay-food and long-food case definitions exactly match the first reproduction.
The initializer remains the permitted historical v4. No topology, sensing, physics or acceptance
gate changes accompany this experiment; the runner cannot open reserved outcomes or promote the UI.

The first-stage model reproduced the first run byte-for-byte. The first two collections also
match exactly: SHA-256 `8a25aaa80664a4fcd83fd8420e5d42cd31573a323b7f4e4e1966e66eebf130d6`
and `89f4cbeb78f213cb0a72dcb8c2319e4154926b223be1f6f6a00fd4e6a8938bac`.
Stage-two fitted weights differ, isolating the intended schedule change before later trajectories
diverge. The user subsequently requested a pause at a clean checkpoint.

At 03:21 UTC the curriculum completed all five fits with 1,903,506 collected frames (ledger 2712).
Every fit used exactly its own stage. The saved `stage-local-recipe/task-curriculum/stage-5.json`
has raw SHA-256 `69bbb00e891c189a487f57985e495380459fe7f5ced8ed74dda46656a8e7e67d`;
Python/TypeScript parity passed 16 examples with maximum error 0.00000191. The final autonomous
collection, before that last fit, produced births in only one of six training worlds at 8,000
ticks. It is not a survival result for the saved model. New retained aggregation, PPO and frozen
validation remain pending. The best completed validation remains the first reproduction's
full-PPO endpoint at 2/3; no reserved outcomes have been opened and no new browser model is selected.

At the earlier pause, the recipe coordinator was suspended before its curriculum child completed;
the child subsequently exited successfully. Its session-local PID was 237981. The saved curriculum
and replay files preserve that unfinished boundary. The later cancellation supersedes the prior
resume instructions: no aggregation, PPO or frozen evaluation is pending as current work.
