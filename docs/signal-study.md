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

Three arms completed (`evolve-2026-09-13/signal/`). Total signal emitted over 150,000 ticks was
64, 76 and 28 material units against 1,000–1,300 units of toxin and 95,000 of absorbed food: the
founder's secretion effort is near zero and nothing raised it. Prediction 1's first branch
holds: the signal decays to nothing, because it costs and returns nothing until a behaviour that
reads it exists, and no such behaviour arose in 48–54 generations.

| Arm | Cells, generations | Signal emitted | k = 2 clusters (n, A share %, core %) | Rare invasion (final cells, divisions per founder) |
| --- | --- | --- | --- | --- |
| 101 | 846, 53 | 64 | 273 at 48 / 62 versus 573 at 58 / 39 | 8 (3.0) and 59 (15.0): one way |
| 202 | 757, 54 | 76 | 506 at 46 / 44 versus 251 at 53 / 54 | 69 (17.0) and 20 (9.3): mutual |
| 303 | 756, 48 | 28 | 314 at 56 / 51 versus 442 at 62 / 46 | 8 (4.7) and 78 (19.6): one way |

The clusters are the diet-and-body-size pair every mixed-world arm produces, and one arm of
three passes the general gate. The phase closes as a negative with the cost as the named cause:
a costed signal with no receiver is a tax, and quorum behaviour would have to arrive before the
signal does. Making the signal free would remove the cost but also the only reason a signal
carries information about who is near; that trade is a design decision, not a rate.
