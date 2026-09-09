# Inspectable per-worker task memory

The user authorizes an unattended experimental study of an explicit task byte shared by programmed
and neural controllers. Values need no permanent semantic labels. This changes controller memory
and training, not world physics, food productivity, mortality, gravity or genetics.

## Contract

Each living worker owns a byte initialized to zero at birth. Its current value enters its own
local observation; the controller may keep it or write a new value alongside an ordinary action.
The write becomes visible on the next decision. There is no global task allocator, destination,
automatic carrying-to-return rule, compulsory dwell period or privileged route. Task age and
transition counts are diagnostic measurements. Numeric values and neural state survive checkpoints.

The programmed reference reports its existing local decision modes through this register. Its
conventional values are a reference for monitoring, not the meaning of learned values. Neural
models declare a cardinality, initially eight, and learn their own use of those values. A task
selection head competes among keeping the current value and writing a value. All workers share
the same weights; each has private register, recent-command and recurrent state.

Manual writes and harness clamps are diagnostic interventions, recorded in the world and
checkpoint. Such a run cannot be certified as independent colony survival. Inspectors expose
the numeric value, its age and transitions. No semantic task name is required after training.

## Experimental order

1. Verify deterministic writes, isolation, newborn initialization and exact persistence. Preserve
   the programmed reference's physical action choices and measure survival after interface changes.
2. Establish Python/TypeScript inference parity for registered recurrent models. Compare register
   concatenation with learned modulation of directional sensory inputs. The modulator is neural;
   the simulation does not decide which scent belongs to which value.
3. Diagnose return choices with ordinary recorded local frames, exact recurrent state and controlled
   register settings. A fixed register probe measures execution, not autonomous task selection.
4. Try general-purpose outcome learning with temporal credit assignment and explicit task writes.
   Keep a register-disabled comparison and inspect value occupancy, switching, care and return.
5. Use staged physical starts or combined trained experts only if measured failures identify what
   the general approach is missing. Record all assistance and require transfer back to fresh starts.
6. Freeze promising candidates before fresh 48,000-tick colony tests. Require queen survival,
   continued real feeding, founder turnover, funded replacement and conservation. Measure weight
   perturbations and food loss only after a viable center exists. Human visual review remains open.

Training and diagnostic seeds start at 1–6 and 41–46. Reserve 101–106 for frozen final candidates;
do not tune on those results. Use bounded batches with explicit hypotheses and stop flat searches.
Archive models, parity examples, failed outcomes and training settings locally in the harness.
No automatic browser promotion, deployment or in-world inheritance is authorized by this study.

## Implemented topology and training

The registered model is artifact version 5: 64 recurrent units, a shared 16-unit directional
encoder/scorer, four previous motor commands, and an eight-value register. A one-hot encoding
of the current byte adds a learned projection to the recurrent preactivation. The optional gate
uses that encoding to scale 16 directional receptor channels and ten global body/local-context
channels by learned factors between zero and two. It does not choose a field in simulation code.
The output has eight competing physical actions, two continuous pheromone outputs, and nine
register choices (keep, or write 0–7). The constant-register comparison has one value.

Nonzero artifact temperature samples motor and register choices using a private seeded stream.
Two exact 16-bit words preserve the stream in float32 controller state. Temperature zero uses
argmax. Both execution modes are part of the artifact, run identically in browser and harness,
and require separate outcome measurements. Pheromone quantities remain continuous outputs;
PPO directly trains motor and register likelihoods, with no direct secretion-policy gradient.

Recurrent PPO records the actual previous hidden state and command history for each decision.
It backpropagates through 32 consecutive decisions and bootstraps a training-only value network
across 2,048-tick batches. Worlds continue until extinction or 48,000 ticks. Discount is 0.9995
and trace decay 0.999. The shared reward is the change in queen/worker/brood reserves and actual
recipient transfers and births, with queen-death loss and a small queen-alive term. This is
physical shaping, not proof of survival; the 48,000-tick acceptance test remains separate.
The longer final follow-up uses trace decay 0.9997 and adds a 100-point terminal bonus for meeting
the full physical survival gate at 48,000 ticks. It retains exact source snapshots and distinguishes
the model that collected each rollout from the updated model. Frozen evaluation is still required
because training changes the shared weights between rollout batches.

The three first 12-update PPO runs produced no queen or brood feeding. Follow-up experiments
therefore include programmed preparation followed by PPO, and supervised initialization with
decreasing action assistance. Temporary demonstration values are deliberately permuted:
0 for foraging, 5 for return, 2 for local care and 7 for eating. These labels exist only in the
teaching harness. The imported actor has no corresponding task rules or programmed fallback.
The first supervised curricula fit the latest stage only. The subsequent aggregation experiment
retains earlier demonstrations while collecting new autonomous mistakes. Its initial improvement
therefore cannot be attributed to the task byte alone. Read the
[artifact chronology](../../frontend/harness/artifacts/task-memory-2026-09-07/README.md) for the
interrupted assistance-threshold run, corrected driver labels and source-hash limitations.

Checkpoint version 6 stores the model, register, hidden and command state, private random stream
and intervention count. The inspector can set a value within the imported model's vocabulary.
Manual writes invalidate independent-survival certification. Import a model locally with
**Import RNN**; the programmed colony remains the browser default.

The first complete neural survival instances are replay-initialized PPO models: the projection
model passes diagnostic seed 43, and the gated model passes seed 41. Both fail the other two
diagnostic seeds at 48,000 ticks. These are working instances, not a reliable controller class.
The gated instance loses its pass under a 0.001 RMS perturbation and under a register-zero clamp;
the latter shows that its register affects execution, but does not establish general task semantics.
The completed reserved panel follows below.

## Final results and disposition

The longer-trained projection model passes **6/6 reserved worlds** at 48,000 ticks (run 2636).
These seeds were not used for training or tuning. The frozen actor shares one 19,102-parameter
network across workers, with 64 recurrent units, four-command history and an eight-value private
register. This candidate uses the task projection without sensory gating. Its initializer came
from demonstration replay; its final optimization used only physical colony outcomes.

| Seed | Full gate | Living workers | Worker births | Queen reserve |
| ---: | :--- | ---: | ---: | ---: |
| 101 | Pass | 6 | 34 | 12.460 |
| 102 | Pass | 14 | 30 | 17.291 |
| 103 | Pass | 7 | 24 | 10.844 |
| 104 | Pass | 8 | 17 | 13.310 |
| 105 | Pass | 15 | 39 | 13.547 |
| 106 | Pass | 14 | 37 | 14.016 |

All founders are absent. Each world retains a living queen and descendants, actual queen and
larval feeding and new births in both late 8,000-tick windows. Conservation remains within the
1e-6 acceptance tolerance. No task overrides, teacher actions or programmed preparation occur
in these evaluations. The stored model remains fixed throughout each evaluated lifetime.

The gated candidate passes **3/6** reserved worlds (103, 104, 106; run 2634). Matched programmed
controls pass **5/6** under the same strict gate (run 2632), with every queen alive. Programmed seed
103 has 32 births at both ticks 32,000 and 40,000; it subsequently recovers to 38 births and six
workers. That late birth gap remains a failure under the predeclared gate. No criterion was relaxed.
Six worlds do not establish a general superiority of the neural model over the reference.

For the gated seed-41 survivor, clamping the byte to zero produces extinction and zero births
(run 2627), so the register affects that actor's execution. Two 0.001 RMS weight perturbations
give one pass and one failure; the 0.005 perturbation fails (2625, 2628, 2630). These are small
diagnostic samples. Weight-neighborhood reliability is not established for the final projection
model. Removing external food at tick 24,000 causes extinction in both the gated model and its
matched programmed control (2631, 2633), while preserving energy accounting.

The study includes seven substantive PPO arms, 92 updates and 2,869,941 recorded actor decisions,
plus four supervised arms, 16 stages and 2,567,584 collected demonstration/error frames. The
short smoke check and two interrupted collectors are excluded from those totals. Pure initial
PPO failed; demonstrations, retained error replay and subsequent outcome optimization produced
the successful recipe. This does not isolate the task byte's contribution from the other changes.

Training is stopped. Keep the programmed browser default and review the neural motion before
promotion or further biology. In the browser, use **Import** with
[the final model's seed-101 checkpoint](../../frontend/harness/artifacts/task-memory-2026-09-07/review-long-seed101.checkpoint.json)
and then **Run**. It starts at tick 12,000 with nine workers, a living queen and funded brood.
Run 2635 verifies eight ticks of exact restored continuation; its starting measurements exactly
match the evaluated seed-101 trajectory. The model can also be loaded into a fresh world with
**Import RNN** using
[the frozen model](../../frontend/harness/artifacts/task-memory-2026-09-07/ppo-long/iteration-24.json).

Validation: `make ci`, 72 Vitest tests, two bounded Python training checks, production build,
`git diff --check`, and export parity pass. The final parity sample has maximum error 2.63e-6.
One pre-existing optional-property lint warning remains. No genetics, digging, gravity change,
deployment or automatic model promotion was performed.

## Browser review entry point

The user subsequently requested direct browser startup with the successful RNN. The app now bundles
the exact `ppo-long/iteration-24.json` artifact as
`frontend/src/sim/controller/review-colony.json` and opens seed 101 at tick zero, paused. Press
**Run** to watch from the beginning; **New world** recreates the selected seed with fresh worker
memory. No checkpoint import is needed. The scenario selector retains the programmed controls.
This explicit review default does not certify motion or authorize further training.
