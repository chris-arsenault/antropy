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
| Finite deposits | 24; rate scale 0.2, radius scale 3, lifetime scale 60 s, mean replacement wait 20 s |
| Food layout | Zones: pure-A left half, pure-B right half, four deposit slots each; epochs (80% A / 20% A, 50,000 ticks) selectable |
| Initial dissolved food | Total 0.15 per raster cell, split equally A/B |
| Food diffusion / decay | 0.3 / 0.001 |
| Toxin diffusion / decay / receptor K | 0.12 / 0.04 / 0.025 |
| Injury / maximum repair rate | 0.5 / 0.008 per second |
| Contact injury rate | 0 (off) per second per unit neighbour weapon/core |
| Protection divisor | 1 + 80 × actual defense/core + 1000 × actual toxin machinery/core |
| Matrix decay / drag / binding capacity / binding rate | 0.003 / 8 / 0.15 / 2 |
| Hard barrier | Threshold 1.5; disabled by porous mode |
| Neutral secretion | 0, disabled; optional transport constants retained |
| Food chemical energy / catabolic efficiency | 4 per material unit / 0.8 |
| Construction energy | 0.5 per new material unit |
| Founder reserve / usable energy | 0.8 / 0.5 |
| Core / motor / A processing / storage stock | 1 / 0.08 / 0.08 / 0.08 |
| B processing / defense / toxin / matrix stock | 0.05 / 0.025 / 0.02 / 0.02 |
| Body and reserve density / viscosity | 4 / 0.4 (a thick medium: cells move about 3 units per 1,000 ticks and 13% cross a band in their lifetime, versus 22 units and 96% at 0.0004) |
| Motor power density / efficiency | 0.2 / 0.5 |
| Behavioral mutation probability / scale | 0.0015 / 0.08 (about 2.5 loci per birth) |
| Physical mutation probability / scale | 0.1 / 0.12 (about 0.8 loci per birth) |
| Decomposition | Detritus returns half as food A and half as food B |
| Membrane crowding | `machineryCrowding` 0 (additive pathway returns); the [cycle study](cycle-study.md) runs at 0.5 and 0.75, where constructed guilds each invade from rarity, and at 1 the founder mixotroph stops reproducing |
| Element cycle (`config.cycle`, off by default) | light 0.5; lightSupply 0.001 fixation per raster cell per second gathered over a radius-2 footprint of 13 raster cells, so an isolated harvester can fix at most 0.013/s and the whole world offers 4.8/s, equal to the deposit supply; photoRate 0.3; photoRatio 0.05; photoMaintenance 0.05/s per unit stock; exudation 0.3; carbonK 0.3; oxygenK 0.05; oxygenPerMaterial 1; anaerobicEfficiency 0.25; atmosphere oxygen 0.2 and carbon 1; exchangeRate 0.0001/s; initialCarbon 1; carbon/oxygen diffusion 0.3/0.5. With light unlimited per unit ground, harvesting income was density-independent and three evolution arms passed 800–1,200 cells by 85,000 ticks; a one-raster cap of 0.01 let three more arms pass 800–1,400 by 70,000–90,000 because 4,800 raster cells offered ten times the deposit supply. Under the footprint supply a lone half-core three-fold harvester divides about every 3,000 ticks on light alone and 48 of them plateau near 45–60 cells in the default world |
| Learned-weight retention | 1 |
| UI target / population safety ceiling | 30 ticks/s / 10,000 cells, pause on limit |

Actual speed, radius and uptake are body-dependent; they are not fixed global phenotype values.
Ploidy, transmission, crossover, reproduction and plasticity policies are described in
[bodies and inheritance](design/funded-bodies.md).

<a id="calibration-throughput"></a>

## Measured throughput

Measured September 11, 2026 on the development host with Node 24, single-threaded, from tick zero.
Checkpoint hashes at the end of each run were identical before and after the kernel optimization,
so trajectories are bit-for-bit unchanged.

| Configuration | Before | After |
| --- | ---: | ---: |
| Seed 101 default, 2,500 ticks, ending at 196 cells | 130 ticks/s | 215 ticks/s |
| Seed 7, 300 founders, source rate 1.0, 600 ticks, ending at 418 cells | 50 ticks/s | 94 ticks/s |
| Seed 9 default with solid matrix and signaling, 1,500 ticks, 192 cells | 143 ticks/s | 228 ticks/s |

Remaining cost at about 440 cells is roughly a quarter RNN inference, a quarter contact resolution
and neighbour lookup, and the rest sensing, uptake, growth and fields. Further exact speedups would
require changing float32 evaluation order or the four-pass contact model, which are physics changes.

In the browser, population statistics cost about as much as one step (6–10 ms) and previously ran
every animation frame; they now refresh at most every 250 ms while the map redraws every frame,
and maximum speed uses a 28 ms frame budget (about 30 frames per second). Browser throughput is
not certified; expect maximum speed to reach roughly four fifths of the headless rate.

A Rust WebAssembly kernel for inference, contacts and sensing was measured on September 12,
2026 at 44 ticks/s versus 24 for the evolved seed-303 checkpoint (1,324 cells) and about 20%
faster at 450–550 cells, then removed under [ADR 0019](adr/0019-single-language-kernel.md):
the split boundary made the physics harder to reason about, and the profile after it showed
only about 15% of a tick left parallelizable, so threads were never worth building. The thick-
medium default at 1,300 cells runs at roughly 25 ticks/s headless with per-operation float32
rounding removed from the RNN.

Generation time in the default is about 5,000 ticks at steady state, set by turnover rather than
growth: at carrying capacity, births match deaths and the founder rarely dies of anything but
starvation. Faster generations follow from higher mortality in the ecology, not from tuning growth.

<a id="calibration-residency"></a>

## Why the medium is thick

Measured September 12, 2026 over 6,000 ticks from the seed-101 default with mutation off, tracking
every cell that lived at least 500 ticks. Displacement is per 1,000 ticks of life; crossing is
the share of cells that entered the other half of the world during their life.

| Viscosity | Deposits, rate | Median displacement | 90th percentile | Crossed a band | Median life, ticks | Motor share of dissipated energy |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 0.0004 | 8, 0.3 | 22.4 | 46.6 | 96% | 3,125 | 29.7% |
| 0.004 | 8, 0.3 | 15.0 | 29.2 | 75% | 2,116 | 29.5% |
| 0.04 | 8, 0.3 | 8.0 | 13.2 | 41% | 1,900 | 29.4% |
| 0.4 | 8, 0.3 | 3.5 | 4.9 | 12% | 1,499 | 30.1% |
| 0.4 | 24, 0.2 | 3.0 | 4.5 | 13% | 1,686 | 30.2% |

At the old viscosity a lineage foraged across the whole world within one generation, which made
every local interaction global: toxin became area denial and band-limited food could not select
on diet. At 0.4 a lineage born in a band mostly stays there while chemotaxis still finds the
denser deposits, and the constructed diet specialists partition the zoned world by survival alone.
Motor energy is unchanged because the same power buys less speed; deposits were made denser and
supply raised so slow cells have local food and the population is about 340 rather than 170.

<a id="calibration-why-the-injury-balance-changed"></a>

## Why the injury balance changed

The original strategic ecology used injury 0.05 and repair 0.08. Near zero damage, founder repair
was approximately 0.24 × damage per second, enough to suppress ordinary exposure almost completely.
Current rates make injury faster than repair under sufficiently concentrated toxin. For reference
defense, concentration 0.0019 yields approximately 0.0118 injury/s against 0.008 maximum repair/s.

The [default ablations](design/bacteria-results.md) establish consequences under these scales.
This is not proof of an optimal balance, real toxicity constants or evolved investment. Future
calibration must state a prediction, preserve conditions and stop when tuning fails structurally.
