# Local RNN controller

One heritable Elman RNN chooses each organism's efforts. No fallback, task dispatcher, oracle
or external optimizer runs in the population. The controller identity is
the 39×24×9 Rust controller in checkpoint v11.

<a id="controller-observation-contract"></a>

## Observation contract

| Indices | Local readings |
| --- | --- |
| 0–15 | Four chemical receptors, each with level, temporal change, forward difference and left difference |
| 16–27 | Twelve installed receptor/transporter/enzyme stocks divided by themselves plus their genetic targets |
| 28 | Usable energy / actual energy capacity |
| 29 | Core / genetic newborn core target minus one, clamped to [0,1] |
| 30–33 | Previous-step front, left, rear and right body contact |
| 34 | Opaque private task byte / 255 |
| 35–36 | Motor/storage stock divided by itself plus reference newborn stock |
| 37 | Internal chemical matter / actual storage capacity |
| 38 | Injury fraction |

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
| 2 | Positive tanh: paid repair effort |
| 3 | Rounded 127.5×(1+saturation(logit/2)): candidate private byte |
| 4 | Nonnegative logit commits the candidate |
| 5–8 | Positive tanh: independent effort for each transporter |

A transporter's inherited allele selects import or export and its target coordinate. The action
controls effort. Actual transport requires machinery, available species, storage, conductance and
usable energy. Enzymes are constitutive; no extra neural enzyme controls or named secretion outputs
exist. Repair competes with growth. Movement costs remain physical even when contact restricts it.
The task byte has no task semantics in physics; manual writes are recorded diagnostic interventions.

<a id="controller-topology-and-founder"></a>

## Topology and founder

The network has 39 inputs, 24 recurrent saturating units and nine output logits: 936 input weights,
576 recurrent weights, 24 hidden biases, 216 output weights and nine output biases, totaling
1,761 parameters. Eleven additional inherited loci define private plasticity.

Private state includes 24 hidden values, 576 bounded traces, the private byte and previous
energy fill. The four receptor baselines belong to body state. Weights/traces/hidden values
use float32 storage and SIMD arithmetic. The shared rational activation is
`x*(27+x²)/(27+9x²)` within [-3,3], saturated outside. Its maximum checked difference from tanh
is below 0.024. This is an explicit modeling approximation, not preserved old trajectories.
Inference and paid learning occur every 0.8 model seconds; actions are held between updates.

Ordinary mutable founder weights encode local chemical-gradient steering, reduced swimming when
the first two receptor levels rise, contact turns, damage-dependent repair and active transport.
Chemical genes initially recognize bootstrap sources, convert them toward the decomposition
coordinate, retain it for construction and export when storage exceeds roughly 75% capacity.
The membrane initially matches that product. Both the export response and chemical targets remain
ordinary mutable alleles. All founders share one genotype. This seed is a declared initial
condition, not an evolved discovery or an authored final community.

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
