# Local RNN controller

One heritable Elman RNN chooses each organism's efforts. No fallback, task dispatcher, oracle
or external optimizer runs in the population. The controller identity is
the 56×24×38 Rust controller, with a physiological evaluation clock in checkpoint v35.

<a id="controller-observation-contract"></a>

## Observation contract

| Indices | Local readings |
| --- | --- |
| 0–15 | Four chemical receptors, each with level, temporal change, forward difference and left difference |
| 16–27 | Twelve installed receptor/transporter/enzyme stocks divided by themselves plus their genetic targets |
| 28 | Usable energy / actual energy capacity |
| 29 | Core / genetic newborn core target minus one, clamped to [0,1] |
| 30–33 | Current frozen-interface front, left, rear and right body contact |
| 34 | Opaque private task byte / 255 |
| 35–36 | Motor/storage stock divided by itself plus reference newborn stock |
| 37 | Internal chemical matter / actual storage capacity |
| 38 | Injury fraction |
| 39–42 | Funded optical level, temporal change, forward difference and left difference |
| 43 | Photoreceptor stock divided by itself plus genetic target |
| 44–51 | Four funded inward receptors, each level and temporal change |
| 52–55 | Enzyme records 4–7 stock relative to their genetic targets |

Each receptor uses a heritable coordinate and shared compact affinity `max(0,1-d²/R²)²`, R=3, over the local mixture.
Actual receptor stock supplies gain. Level is C/(C+K), with K=0.1; directional differences use
opposed perimeter samples divided by their sum plus 2K. Samples are bilinear and periodically
wrapped. They are local contrasts, not bearings to a source. Phasic input is current level minus
the saved baseline; baseline relaxation uses 1−exp(−dt/2). Birth initializes it locally.

Controllers receive no coordinates, compass, clock, chemical ID, route, lineage label, destination
or reproductive score. Machinery inputs distinguish installed capacity from genetic intent.

<a id="controller-action-contract"></a>

## Action contract

| Output | Decoding and effect |
| ---: | --- |
| 0 | Positive saturation: forward swimming effort |
| 1 | Signed saturation: turning effort |
| 2 | Positive saturation: paid repair effort |
| 3 | Rounded 127.5×(1+saturation(logit/2)): candidate private byte |
| 4 | Nonnegative logit commits the candidate |
| 5–8 | Half of one plus signed saturation: independent transporter direction/effort |
| 9–16 | Positive saturation: activity of each enzyme program |
| 17–36 | Positive saturation: requested construction allocation for each stock record |
| 37 | Positive saturation: shared retirement effort |

A transporter's allele selects its chemical target. Neural output selects direction and effort:
0 exports fully, 0.5 holds, and 1 imports fully. Actual transport requires machinery, available species, storage, conductance and
usable energy. Enzyme activity multiplies funded turnover; construction requests define desired
stock, and retirement pays to return surplus bound material to free inventory. These requests
cannot grant material or work. Repair competes with growth. Movement costs remain physical even when contact restricts it.
The task byte has no task semantics in physics; manual writes are recorded diagnostic interventions.

<a id="controller-topology-and-founder"></a>

## Topology and founder

The network has 56 inputs, 24 recurrent saturating units and 38 output logits: 1,344 input weights,
576 recurrent weights, 24 hidden biases, 912 output weights and 38 output biases, totaling
2,894 parameters. Eleven additional inherited loci define private plasticity. Bounded ports
belong to program records; inactive records have no funded function. Neutral duplication copies
activity/construction readouts and divides incoming stock contributions. Deletion removes the
program's ports but leaves its physical stock until paid retirement.

Private state includes 24 hidden values, 576 bounded traces, the private byte, a physiological
execution epoch and previous
energy fill. Four outward, four inward and one optical receptor baselines belong to body state. Weights/traces/hidden values
use float32 storage and SIMD arithmetic. The shared rational activation is
`x*(27+x²)/(27+9x²)` within [-3,3], saturated outside. Its maximum checked difference from tanh
is below 0.024. This is an explicit modeling approximation, not preserved old trajectories.
Each cell evaluates its RNN once per existing physiology interval (default 0.8 model seconds).
Physical owners publish cues at their update boundary: external sensing supplies chemistry
and light, physiology supplies funded stocks and internal state, and base stepping supplies
energy, contact and the private byte. Each channel retains its value and publication time;
the next evaluation integrates their signed time average, settles paid learning, updates
hidden state and decodes one held action. Constant channels need no repeated base-step
normalization or accumulation. New cues never act during the interval already elapsed.
Short exposures contribute to the average,
opposing exposures can cancel within a channel, and weak persistent cues have no cutoff.
Response can wait one interval. Constant inputs still advance recurrence. Task writes feed
the following atomic evaluation. Birth and interventions initialize a fresh local clock.
Private traces retain an affine-flow epoch and paid elapsed time, materialized for evaluation,
inspection or assimilation. Checkpoints retain cue integrals, publication times, clock remainder
and held action.
The [composed runtime](chemistry/composed-runtime.md#prepared-execution-and-physical-time)
owns the equations. Controller matrices use SIMD and reuse storage; an earlier sparse-support
cache increased complete workload cost and was rejected. Static learning advances no trace clock.

Ordinary mutable founder weights encode local chemical-gradient steering, reduced swimming when
the first two receptor levels rise, contact turns, damage-dependent repair and active transport.
Four mutable founder types start the circuit 0→128→136→8→0, six of each type in each colony.
They recognize their input, use input-centered membrane compatibility, and express mild product
export. Optical connections begin at zero and can mutate; there is no seeded light-seeking policy.
The [initial ecosystem design](chemistry/regenerative-ecosystem.md) explains their paid budgets. This seed is a declared initial
condition, not an evolved discovery or an authored final community.

Activity and construction biases start at saturation 3 (effort 1); retirement and inward
allocation start at zero. These are mutable alleles. Saturation reaches exactly one, allowing
core construction to reach its division threshold. A reduced core allocation can defer division.

<a id="controller-learning-and-module-boundary"></a>

## Learning and module boundary

Inference uses Wrecurrent + abs(alpha)×H. Paid bounded trace updates depend on pre/post activity,
the four receptor changes and energy-fill change. Static learning disables new trace effects,
updates and assimilation. Retention zero disables transmission while leaving private plasticity
available. Disabling random mutation alone does not freeze inherited learning.

The controller owns seed, private-state creation, action, assimilation, mutation, recombination,
expression, distance, diagnostics and codecs. Physics does not inspect weight layout.
Organism genetics owns chromosome composition and chemical/physical inheritance.
[Birth-local assimilation](funded-bodies.md#bodies-inheritable-learning) copies retained acquired
changes into offspring chromosomes exactly once; it never rewrites a shared parental genotype.
