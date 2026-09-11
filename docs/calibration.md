# Current calibration

Source of truth: [sim/config.ts](../frontend/src/sim/config.ts). Each harness record stores its
resolved configuration. These are authored simulation scales, not empirical bacterial constants.
Historical calibration is preserved in the [snapshot](sources/history/2026-09-10/calibration.md).

<a id="calibration-default-scales"></a>

## Default scales

| Quantity | Default |
| --- | --- |
| World / timestep / founders | 80 × 60 periodic XY / 0.2 model seconds / 48 |
| Brain | 35 inputs, 24 recurrent units, 8 outputs |
| Finite deposits | 8; rate scale 0.3, radius scale 3, lifetime scale 60 s, mean replacement wait 20 s |
| Incoming food epochs | 80% A / 20% A alternation, 50,000 ticks per phase; total supply unchanged |
| Initial dissolved food | Total 0.15 per raster cell, split equally A/B |
| Food diffusion / decay | 0.3 / 0.001 |
| Toxin diffusion / decay / receptor K | 0.12 / 0.04 / 0.025 |
| Injury / maximum repair rate | 0.5 / 0.008 per second |
| Defense multiplier | 1 + 80 × actual defense/core |
| Matrix decay / drag / binding capacity / binding rate | 0.003 / 8 / 0.15 / 2 |
| Hard barrier | Threshold 1.5; disabled by porous mode |
| Neutral secretion | 0, disabled; optional transport constants retained |
| Food chemical energy / catabolic efficiency | 4 per material unit / 0.8 |
| Construction energy | 0.5 per new material unit |
| Founder reserve / usable energy | 0.8 / 0.5 |
| Core / motor / A processing / storage stock | 1 / 0.08 / 0.08 / 0.08 |
| B processing / defense / toxin / matrix stock | 0.05 / 0.025 / 0.02 / 0.02 |
| Body and reserve density / viscosity | 4 / 0.0004 |
| Motor power density / efficiency | 0.2 / 0.5 |
| Behavioral mutation probability / scale | 0.0006 / 0.06 |
| Physical mutation probability / scale | 0.025 / 0.08 |
| Learned-weight retention | 1 |
| UI target / population safety ceiling | 30 ticks/s / 10,000 cells, pause on limit |

Actual speed, radius and uptake are body-dependent; they are not fixed global phenotype values.
Ploidy, transmission, crossover, reproduction and plasticity policies are described in
[bodies and inheritance](design/funded-bodies.md).

<a id="calibration-why-the-injury-balance-changed"></a>

## Why the injury balance changed

The original strategic ecology used injury 0.05 and repair 0.08. Near zero damage, founder repair
was approximately 0.24 × damage per second, enough to suppress ordinary exposure almost completely.
Current rates make injury faster than repair under sufficiently concentrated toxin. For reference
defense, concentration 0.0019 yields approximately 0.0118 injury/s against 0.008 maximum repair/s.

The [default ablations](design/bacteria-results.md) establish consequences under these scales.
This is not proof of an optimal balance, real toxicity constants or evolved investment. Future
calibration must state a prediction, preserve conditions and stop when tuning fails structurally.
