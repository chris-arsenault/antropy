# Local RNN controller

One Elman RNN controls every cell, with shared inherited weights and private state stored as
float32 and evaluated in double precision.
There is no programmed fallback, task dispatcher, network ensemble or external optimizer.

<a id="controller-observation-contract"></a>

## Observation contract

The 35 inputs describe local chemistry, actual body capacity and private memory.

| Indices | Readings |
| --- | --- |
| 0–3 | Food A tonic, phasic, forward and left contrasts |
| 4–7 | Neutral chemical tonic, phasic, forward and left contrasts; normally zero with secretion disabled |
| 8 | Usable energy / actual core energy capacity, clamped to [0,1] |
| 9 | Actual core / genetic newborn core target minus one, clamped to [0,1] |
| 10–13 | Previous-step front, left, rear and right body contact |
| 14 | Opaque private task byte / 255 |
| 15–17 | Actual motor, A processing and storage, each divided by itself plus reference newborn stock |
| 18 | Stored nutrient / actual storage capacity, clamped to [0,1] |
| 19–22 | Food B tonic, phasic, forward and left contrasts |
| 23–26 | Toxin tonic, phasic, forward and left contrasts |
| 27–29 | Matrix tonic, forward and left contrasts; no matrix phasic baseline |
| 30 | Functional damage, [0,1] |
| 31–34 | Actual B processing, defense, toxin and matrix machinery, normalized like 15–17 |

For concentration C and configured K, tonic is C/(C+K); forward contrast is
(Cfront−Crear)/(Cfront+Crear+2K), and left contrast uses left/right. Bilinear spatial samples sit
at the body's center and perimeter with periodic wrapping. Local contrasts support chemotaxis;
they are not bearings to a source. Matrix normalization currently uses `matrixBarrier` even in
porous mode; that is the implemented sensor scale, not evidence of sensitivity to thin deposits.

Four receptor baselines cover A, neutral chemical, B and toxin. Phasic is current tonic minus the
previous baseline; then baseline approaches tonic with factor 1−exp(−dt/tau), tau 2 seconds.
Birth baselines use local concentration to avoid a false spike. Contacts are four body-relative
sectors, not nearby organism counts. Genotype targets do not masquerade as installed capacity.

No coordinates, compass, world tick, food identity, destination, route, lineage identity,
reproductive score or global population demand enters inference.

<a id="controller-action-contract"></a>

## Action contract

| Output | Decoding | Physical effect |
| ---: | --- | --- |
| 0 | max(0,tanh(logit)) | Forward swimming effort |
| 1 | tanh(logit) | Signed turning effort |
| 2 | max(0,tanh(logit)) | Neutral chemical release; maximum rate is zero in the default |
| 3 | round(255×sigmoid(logit)) | Candidate task byte |
| 4 | logit ≥ 0 | Commit candidate byte; otherwise retain memory |
| 5 | max(0,tanh(logit)) | Toxin synthesis/release effort |
| 6 | max(0,tanh(logit)) | Matrix synthesis/release effort |
| 7 | max(0,tanh(logit)) | Paid repair effort |

Physical efforts are simultaneous. Swimming/turning share motor power; secretion shares available
precursor and energy with movement. Paid efforts remain costly when obstructed. Emissions occur
locally after movement, with no ownership, broadcast or automatic following. Repair competes with
growth for resources. Uptake, growth and division remain physiology rather than extra motor commands.

The byte has no task semantics in physics. Inspector overrides are recorded as durable diagnostic
interventions, and the UI labels the run accordingly. Its write history is observable without
prescribing forage/rest/attack labels.

<a id="controller-topology-and-founder"></a>

## Topology and founder

The network has 35 inputs, 24 tanh recurrent units and eight output logits: 840 input weights,
576 recurrent weights, 24 hidden biases, 192 output weights and eight output biases, totaling
1,640 parameters. Nine additional loci define plasticity.

Private state includes 24 hidden values, 576 bounded synaptic traces, task byte and the previous
energy-fill observation used by plasticity. Receptor baselines are separate body state.

The founder's ordinary mutable weights encode A/B chemotaxis, nutrient/contact-dependent propulsion,
toxin avoidance, modest local toxin/matrix secretion and damage-dependent repair. All 48 founders
initially have the same genotype. There are no authored factions or strategy classes.
Neutral chemical is sensed but has no established founder steering use; its secretion is disabled.
Seeding a reflex does not establish that evolution discovered it.

<a id="controller-learning-and-module-boundary"></a>

## Learning and module boundary

Inference uses Wrecurrent + abs(alpha)×H. The inherited learning rule updates bounded H from
pre/post activity, food-A phasic change, neutral-chemical phasic change and energy-fill change.
Food B and toxin do not have dedicated modulation coefficients in this rule. This asymmetry is
a known limitation, not evidence that learning handles all new ecological pressures equally.

The controller owns seed, private-state creation, inference, assimilation, mutation, recombination,
expression, distance, inspection and codecs. Physics sees the action interface and does not inspect
weights. Organism genetics owns chromosome composition. A static adapter is sufficient; there is
no dynamic plugin registry for the single brain.

[Inheritance](funded-bodies.md#bodies-inheritable-learning) specifies learned-weight transmission and newborn
resets. [Experiments](experimentation.md) distinguish altered weights from useful learned behavior.
