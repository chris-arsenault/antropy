# Shared directional controller experiment

The completed experiment produces no viable learned colony. Four-command history improves
movement in a matched development ablation, but both frozen learned candidates fail all three
fresh final worlds. The programmed controls pass all three. No model is promoted to the browser.

The user authorized this experiment and suggested remembering recent actions on September 7.
The [previous dense-network study](colony-training.md) remains a failed comparison.

## Frozen protocol

One jointly trained network processes eight body-relative directions with the same 16-input,
16-unit tanh encoder. Each direction contains five contacts, raw and normalized air, four raw
and four normalized odor contrasts, and an odor-receptor availability bit. Rear odor samples
are unavailable, zero-filled and masked. These are reorganized existing observations.

Eight embeddings, nine global local/body values and optional action history enter a 64-unit
tanh recurrent layer. A shared 16-unit tanh scorer receives each forward/left/right embedding
with recurrent context and produces its motor logit, with three learned motor biases. A linear
head produces five care/idle logits and two secretion logits. All eight motors compete through
the existing decoder; there is no programmed direction selection or care switch.

Compare recurrence alone against recurrence with the previous four attempted motor commands,
encoded as 32 one-hot values, newest first. Empty birth history is all zero. History belongs
to the worker, contains no coordinates or teacher answers, and records an attempted move even
if physics blocks it. No turn is prohibited. History has no additional metabolic charge in
this frozen-physics experiment and is an input-representation comparison, not a priced neural
biology model.

Training seeds 1–3; development 4–6; fresh final seeds 21–23 at 40,000 ticks. The prior final
seeds 11–13 are already opened and cannot serve as untouched evidence again. Two initial
60-epoch fits, 100 batches of 64 consecutive 16-step sequences per epoch, initialization 17,
Adam 0.001, at most one 40-epoch aggregation per arm for measured missing trajectory coverage.
Retain prior rows and never stitch sequences between different datasets. Reset recurrent state
at training chunk boundaries; reset runtime state only at birth.

First check Python/TypeScript inference and re-evaluate captured development errors from run
2522 with zero recurrent state. The latter is a static probe because original hidden states
and action histories were not captured. Compare closed-loop queen feeding, births, conservation,
movement and turn reversals next. The numerical viability gate remains queen alive, no founders,
at least eight descendants, recruitment and gross exterior pickup in the final 8,000 ticks,
and residual magnitude below 1e-6. Gross pickup can recount dropped food and is not net intake.

Freeze candidates before opening final worlds. Compare matched programmed controls and disable
history in the history-trained candidate to assess reliance. Test perturbations only if a viable
center exists. Preserve the programmed browser default and pause before genetics or ecology.

## Structural correction before further fitting

The first two fits, runs 2541–2542, correct 27/31 old static traps each (2543–2544), but their
12,000-tick development rollouts (2545–2546) collect no exterior food and lose every worker.
Run 2545 attempts 59,387 moves with only 2,287 observed translations. Captured blocked forward,
left and right samples are identical; the shared scorer therefore produces identical values
apart from three constant motor biases. Recurrent context and action history cannot change
their relative ordering. This is a representation limitation, not a request for more epochs.

Model version 3 extends each shared scoring branch with its two neighboring direction embeddings
and a three-value one-hot actuator identity. The neighboring embeddings expose lateral openings;
actuator identity allows learned context to distinguish moving from turning even when all local
samples match. Every weight is jointly trained. There is no action veto, tie-breaking policy or
field selection rule. Version 2 inference remains available to reproduce the failed first fits.
The two corrected 60-epoch fits replace the invalid initial topology in the comparison; preserve
all four artifacts and report the extra compute. The one-aggregation-per-arm bound remains.

Inspection then caught an implementation error: the initial global input list omitted sky light
and included cache contact. Two widened-scorer fits had also completed with that mapping and are
retained as invalid previews, not behavioral comparisons. Final artifacts explicitly serialize
their global input indices; the runtime reproduces older artifacts using the original mapping.
The corrected fits retain sky light, jitter and handedness using the sensor enum in TypeScript.
This repair adds two further fits; it is not evidence for a learning improvement from architecture.

## Corrected development evidence

Corrected initial fits are 2550–2551. Their static replay corrects 8/31 and 21/31 old errors
(2552–2553); no historical recurrent state is available. On development seed 4 at 12,000 ticks,
the base arm collects zero exterior food and the history arm records 37.31 gross pickup units
(2554–2555). Neither feeds the queen or recruits workers. Both retain two founders.

The widened scorer removes the structural blocked-move tie: base observed translations are
19,207 of 19,210 move attempts, history 26,507 of 26,509. It does not remove oscillation:
the base arm has 38,998 immediate opposite-turn pairs and a 10,134-command continuous turn run;
the history arm has 1,252 opposite-turn pairs and a 681-command turn run.

Datasets 2556–2557 each add 126,000 learner-visited training frames from seeds 1–3. Fits 2558–2559
retain all 339,520 original teacher frames for 465,520 rows per arm. Final static replay is
22/31 and 21/31 (2560–2561), and final Python/TypeScript parity is below 4e-6.

The matched 12,000-tick development comparison uses the final frozen models:

|  Run | Controller                                   | Observed translations | Immediate opposite turns | Longest turn run | Gross exterior pickup |
| ---: | -------------------------------------------- | --------------------: | -----------------------: | ---------------: | --------------------: |
| 2547 | Programmed reference                         |                82,545 |                      907 |               16 |                176.05 |
| 2562 | Recurrent directional                        |                 1,065 |                   60,418 |            6,226 |                     0 |
| 2563 | Recurrent plus four-command history          |                25,229 |                   18,630 |            6,536 |                 52.29 |
| 2564 | Same history-trained weights, history erased |                   742 |                   60,625 |           11,674 |                     0 |

All learned arms deliver zero queen feeding and zero births; base feeds four energy units to a
larva without sustaining development. The reference delivers 39.48 energy to the queen and has
12 births. Learned arms each execute 66,000 worker commands; the reference executes 118,384 as
its population grows. Translation observations exclude a worker's final action if it dies before
the next observation; counters are harness-only and never enter controller inputs.

The ablation establishes that this candidate uses command history and that erasing it harms
movement on this development world. It does not establish colony viability, general improvement
across training initializations, or an absence of oscillation. Training uses 16-step chunks while
runtime recurrence continues for a worker's life; that mismatch remains a possible contributor,
not a measured cause. No anti-oscillation override was installed.

Eight fits consumed 409.29 summed process seconds, including the four flawed initial/preview
fits. Runs 2541–2542 and 2548–2549 preserve those errors rather than hiding their compute or
presenting them as controlled architecture comparisons. There are no further fits in this study.

Weights and parity examples are retained in
[the local artifact directory](../../frontend/harness/artifacts/directional-2026-09-07/README.md).

## Final survival and disposition

Models were frozen before opening seeds 21–23. Each world ran 40,000 ticks:

|  Run | Controller                         | Viable worlds | Final workers, seeds 21 / 22 / 23 | Queen feeding                   | Adult births        |
| ---: | ---------------------------------- | ------------: | --------------------------------- | ------------------------------- | ------------------- |
| 2565 | Programmed control                 |           3/3 | 18 / 8 / 20                       | 128.72 / 125.21 / 137.15 energy | 40 / 34 / 47        |
| 2566 | Recurrent directional              |           0/3 | 0 / 0 / 0                         | Zero in every world             | Zero in every world |
| 2567 | Recurrent directional with history |           0/3 | 0 / 0 / 0                         | Zero in every world             | Zero in every world |

All learned queens are dead by tick 16,000. There is no viable center for a weight-perturbation
panel, so no mutation radius is claimed and no additional perturbation compute is spent.
The physical source fingerprint matches the previous study:
`27dec270ee154a5e1e2bcf01afaf75c4fbb930e4c11a1238d31714ca5411ccb0`.

The evidence supports retaining recent commands as a useful experimental input. It does not
support another automatic fit, promoting the candidate, or adding genetics, microclimate or
digging. Reliable travel and return to queen care remain unresolved. A future learning experiment
must target the recorded long turn loops and distinguish training coverage, temporal optimization
and receptor comparison failures before increasing compute. No specific next remedy is established.

Verification: 45 bounded tests in 15 files, exported inference parity below 4e-6, `make ci`,
production build and `git diff --check`. ESLint retains one advisory about the optional global
input list, which exists to reproduce the original archived artifacts. No server was started,
no visual acceptance was inferred, and no model or data was uploaded.
