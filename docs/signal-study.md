# Quorum signal: does an evolved population use a costed chemical it can sense?

Registered September 13, 2026 as phase 7 of
[roadmap two](design/README.md#design-roadmap-2), before reading any endpoint. Sulion plan
`Organism-generated selection`. Artifacts: `frontend/harness/artifacts/evolve-2026-09-13/signal/`.

## Question

The neutral chemical has been off since the bacterial conversion because useful communication
was unproved. With `secretionRate` on, secretion costs material and energy and the signal is
sensed through four inputs. Does an evolved population keep secreting (a cost with no direct
return) and does its behaviour or body split on the signal, with clusters that mutually invade?

## Setup

`pnpm harness evolve --world mixed --secretion-rate 0.02 --seed 101|202|303`, 150,000 ticks,
thick medium, mixed deposits, defaults otherwise. Control: the undisturbed mixed arms of the
[evolution record](evolve-study.md), where secretion is off and the four signal inputs read zero.

## Predictions, recorded before results

1. The emitted signal either decays to nothing (secretion effort evolves to zero, since it only
   costs) or persists at a nonzero population rate; either is a finding.
2. If it persists, sampled secretion effort is bimodal and the clusters mutually invade; if
   not, no cluster axis depends on it and the phase closes as a negative with the cost as the
   named cause.

## Results

Interpretation corrected September 13 from [saved endpoint shares](analysis-correction.md).
The questions and predictions above preserve the original registration, not the current work order.

Three arms completed (`evolve-2026-09-13/signal/`). Total signal emitted over 150,000 ticks was
64, 76 and 28 material units against 1,000–1,300 units of toxin and 95,000 of absorbed food: the
founder's secretion effort is near zero and reported output remained small. This does not by
itself show secretion evolved to zero, establish that receivers never responded, or identify
cost as the reason for low output. Those claims need behavioral or cost interventions.

| Arm | Cells, maximum generation | Signal emitted | k = 2 clusters (n, A share %, core %) | Rare-start endpoints (group/total, share) |
| --- | --- | --- | --- | --- |
| 101 | 846, 53 | 64 | 273 at 48 / 62 versus 573 at 58 / 39 | 8/328 (2.44%) and 59/243 (24.28%): one declines |
| 202 | 757, 54 | 76 | 506 at 46 / 44 versus 251 at 53 / 54 | 69/276 (25.00%) and 20/300 (6.67%): one declines |
| 303 | 756, 48 | 28 | 314 at 56 / 51 versus 442 at 62 / 46 | 8/269 (2.97%) and 78/225 (34.67%): one declines |

All rare groups began at 7/64 (10.94%); no pair gained share in both directions. The former
one-of-three pass is withdrawn. Useful communication was not demonstrated. Low output is a
negative finding about this setup, with cost, founder expression and accessible variation as
competing explanations. Cost is not the only possible source of local information: production,
transport and decay determine what a receiver can sense. If signaling matters to the proposed
world, a short cue/response/benefit probe is more informative than another search for clusters.
