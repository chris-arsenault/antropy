# Strategic controller

**Status:** Implemented locally with utterances, physical v49, October 1, 2026. The running v48 world is unchanged.

[Directional cell utterances](cell-utterances.md) and strategy share one delivery. The
[local RNN controller](controller.md) and [composed runtime](chemistry/composed-runtime.md) own
installed behavior; [delivery evidence](../utterances-and-strategy-results.md) records the bounded checks and costs.

## Purpose

Each cell currently inherits two constructs: a physical genotype (body proportions, chemical
machinery, membrane) and one 52-input Elman RNN. The RNN evaluates every physiology interval
(0.8 model seconds) and maps local, immediate readings to efforts. It is a physiological reflex
layer, with a private byte as its only explicit persistent register.

This design adds a third heritable construct: a small, slow, learned controller responsible for
strategy. It integrates the cell's own history, social contact, local environmental rhythms and
life history. It issues no physical actions. Its outputs become additional inputs to the reflex
layer, which alone chooses efforts. Strategy therefore changes behavior only by changing the
reflex layer's operating mode.

Terminology: Jaynes's "bicameral mind" describes one chamber issuing commands the other obeys.
That captures the commander/obeyer relation but not the separation of timescales and inputs.
The closer technical terms are hierarchical control with timescale separation (manager/worker,
multiple-timescale RNNs) and neuromodulation. The closest bacterial analog is global regulation
by second messengers such as c-di-GMP and ppGpp: slow integration of nutrient, crowding and
stress history switches motile/sessile and growth/persistence programs.

The design draws on these strategic inputs used by real organisms:

| Source | Quantity used | Design consequence |
| --- | --- | --- |
| Marginal value theorem (Charnov 1976) | Current intake relative to long-run average intake | Surprise transform |
| Reward prediction error (Schultz 1997) | Outcome minus expectation | Strategic learning modulator |
| Expected/unexpected uncertainty (Yu & Dayan 2005); adaptive gain (Aston-Jones & Cohen 2005) | Volatility and surprise | Volatility transform; learning-gain output |
| Anticipatory regulation (Tagkopoulos 2008; Mitchell 2009) | Learned cue→future correlations | Learned strategy |
| Bet-hedging and persisters (Kussell & Leibler 2005; Balaban 2004) | Internal stochasticity | Noise input |
| Notch–Delta lateral inhibition | Neighbor state read through contact | Neighbor display |
| Circadian clocks (cyanobacterial KaiABC) | Local light phase | Local rhythm inputs |
| Microbial memory, epigenetic inheritance (Lambert & Kussell 2014) | Parental state at birth | Inherited strategic state |
| Life-history theory | Age, reproductive history | Life-history inputs |

<a id="strategic-common-operation"></a>

## Common operation

The strategic controller uses the reflex layer's operator: Elman recurrence, the shared rational
activation and the per-row incoming-strength budget
([composed runtime](chemistry/composed-runtime.md)). It differs in clock, inputs and heredity.

```text
every k physiology intervals (initial k = 8, 6.4 model s; calibrated at implementation):
  u   = strategic inputs (below), built from channel integrals over the strategic interval
  h_s = r ⊙ h_s + (1 − r) ⊙ act(budget(W_u u + W_h h_s + b_h))
  y   = act(budget(W_o h_s + b_o))
  c   = y[0..4]                  context values in [-1, 1], held until the next evaluation
  g   = 1 + y[4]                 reflex learning gain in [0, 2]
reflex RNN inputs 0–51 unchanged; hearing occupies 52–78; c becomes inputs 79–82
```

`r` is a heritable per-unit retention in [0, 1), so evolution selects memory from one strategic
interval to many minutes. Initial size is 8 hidden units and 5 outputs. Output values are held
between evaluations; the reflex layer sees piecewise-constant context.

Adding c as reflex inputs is an additive bias shift on reflex hidden units, which is sufficient
to express operating modes. Multiplicative gating of reflex weights is outside this design.

<a id="strategic-perception-boundary"></a>

## Perception boundary

The strategic controller may receive anything about the cell itself, anything physically present
at its location or contacts, and any computation over its own history. Abstract derived
quantities (expectations, surprise, volatility, counts) are permitted. Oracles are excluded:

- distant or global state: other locations' conditions, population counts, world aggregates;
- designer labels: coordinates, bearings, raw world tick, lineage/kin identity, genome distance,
  fitness or reproductive score, terrain class;
- future random draws, such as a reservoir's remaining refill wait.

**Local rhythms and lifecycle phases are a named permitted class.** Periodic environmental
processes acting at the cell's location may be encoded directly as circular phase, and the
current state of local lifecycles may be encoded as present fractions and elapsed time.
A raw tick number remains excluded; a phase is its value modulo a local cycle as experienced at
the cell. Phase is available regardless of shade or funded photoreceptors, as an organism with
an internal clock perceives time of day in a burrow. These rhythms are also learnable
indirectly through the surprise transform on received light and uptake; direct encoding makes
them exact.

The light phase changes as a cell moves across the traveling illumination pattern. This conveys
the same directional information as the existing optical forward/left differences and is not a
compass input.

New sensing organs pay their own work. Information carried by existing contact geometry or
by the cell's own location costs nothing beyond strategic controller upkeep.

<a id="strategic-inputs"></a>

## Strategic inputs

### Shared history transform

Each raw history channel x keeps a short memory (the strategic interval integral, using the
existing cue-channel integration) and a long memory with one heritable organism-wide timescale
`T_long = T_strategic × 2^λ`, λ in [2, 8]. The controller receives three values per channel:

```text
level      = short(x)
surprise   = short(x) − long(x)
volatility = long(|short(x) − long(x)|)
```

One operation supplies expectation, novelty and uncertainty for every channel. Raw channels:

| Channel | Source |
| --- | --- |
| Net energy balance | (income − upkeep − action costs) / energy capacity over the interval |
| Energy fill | actual usable work / actual capacity |
| Injury | reflex input 36 |
| Growth rate | biomass growth / biomass |
| Receptor level | mean of the four outward receptor levels |
| Realized net uptake | net transported material / storage capacity |
| Crowding | scalar circle crowding (reflex inputs 30–33) |
| Motor load | reflex input 51 per unit swim effort |
| Received light | funded optical level; zero without photoreceptors |

Utterance activity and signed-bit diversity use the same transform, adding six inputs.
The eleven raw channels therefore contribute 33 inputs. Diversity is zero without heard
activity; otherwise it is the mean `1 − mean(bit)²` over the eight signed bit components.

### Life history and self

| Input | Encoding |
| --- | --- |
| Age | age / (agingTime × core fraction), saturated |
| Divisions so far | n / (n + 4) |
| Time since last division | t / (t + T_strategic × 16) |
| Path straightness | net displacement / path length over the interval; no direction |
| Private byte | byte / 255, read-only |
| Body endowment | three fractions of expressed body in motility, transport and enzymes |
| Efference copy | interval means of swim effort, turn magnitude and repair effort |

These contribute 11 inputs.

### Local rhythms and lifecycles

| Input | Encoding |
| --- | --- |
| Fast light phase | (cos a, sin a), a = 2πx/width − phaseFast at the cell |
| Slow light phase | (cos b, sin b), b = 2πy/height − phaseSlow at the cell |
| Light modulation phase | (cos m, sin m) of phaseModulation |
| Supply season | A(x)·(cos, sin)(2πt/P + φ(x)) at the cell; amplitude-weighted, zero where A = 0 |
| Local reservoir state | coverage-weighted means over reservoirs whose release footprint covers the cell: stocked fraction, elapsed empty time / sourceGap (saturated), total coverage (saturated) |

These contribute 11 inputs. Coverage uses the reservoir's ordinary release kernel at the cell.
Elapsed time is past state; the drawn remaining wait is never exposed.

### Social contact and noise

| Input | Encoding |
| --- | --- |
| Neighbor display | contact-weighted mean of contacting cells' context vectors c (4 values) |
| Display coverage | total contact weight, saturated |
| Noise | one uniform value in [-1, 1] per evaluation from the cell's environmental stream |

These contribute 6 inputs; the complete total is 61.

<a id="strategic-neighbor-display"></a>

## Neighbor display

Each cell displays its current context vector c on its membrane. Contact weights are the
ordinary circle-contact overlap weights already used by compatibility-weighted adhesion.
A cell receives the weighted mean of its contacts' displays and total weight. Display is the
strategic state itself rather than a separate output, as with Notch–Delta, where signal
expression is part of the differentiating state. Lateral inhibition, recruitment or indifference
all require evolved weights; no response is authored. Display transfers no material or work.
Readings come from the previous strategic evaluation's published displays so evaluation order
does not matter.

<a id="strategic-learning-and-inheritance"></a>

## Learning and inheritance

Both layers learn. The strategic layer uses the reflex layer's paid bounded trace law with its
own plasticity loci. Its modulator is surprise in net energy balance, a reward-prediction error,
and its traces advance on the strategic clock. Learning cost uses the existing per-update price.

Output g multiplies the reflex layer's trace update rate and its learning cost. Strategy thereby
controls when the reflex layer learns: during youth, in novel or volatile conditions, or not
at all. g = 1 reproduces current reflex learning.

Birth-local assimilation applies to both layers through the existing path, with a separate
retention locus for each layer. Daughters also start with the parent's strategic hidden state,
long memories and display, rather than zeros. Fission and budding copy this information to
both daughters; it is information, so copying does not violate material or work conservation.

<a id="strategic-heredity-and-cost"></a>

## Heredity and cost

The strategic genotype is a separate chromosome block inside the controller module: weights,
biases, retention r, long timescale λ and plasticity loci. It mutates under the shared heavy-tail
law. Genome distance includes it. Reproduction is clonal, so recombination passes it intact.
Code outside the controller does not inspect it.

Controller upkeep becomes proportional to evaluated parameters per unit time, normalized so the
current reflex-only cost is unchanged:

```text
controllerUpkeep = controllerCost × (1 + (P_s / T_strategic) / (P_f / T_physiology))
```

where P_s and P_f are strategic and reflex parameter counts. At the initial sizes this adds
2.30% to controller upkeep: 605 strategic parameters against 3,292 reflex parameters,
evaluated at one eighth of the reflex frequency.

<a id="strategic-founder"></a>

## Founder

Founders relay two channels with unit weights: net-energy-balance surprise to c0 and crowding
level to c1. Remaining strategic weights are zero, g's bias is neutral, and reflex weights from
c start at zero. Context is therefore observable and one mutation from use, and no policy is
authored. This is a declared initial condition.

<a id="strategic-observation"></a>

## Observation

The phenotype panel reports a selected cell's c, g, retention summary and neighbor display
through bounded revisioned observations. The [data-ownership contract](chemistry/data-ownership.md) applies
unchanged.

<a id="strategic-implementation-checks"></a>

## Implementation checks

These are ordinary implementation work, recorded in a results document:

- invariants: no raw tick reaches either layer; phases and fractions stay bounded; observers
  do not change state; parental strategic state is copied; the exposed reservoir state excludes
  remaining wait;
- an ablation option that clamps c to each cell's own long-run mean, usable on saved checkpoints;
- a constructed single-cell probe with handcrafted strategic weights that switches between
  residence and dispersal from balance surprise and supply season, showing readings, context,
  effort, displacement and costs.

<a id="strategic-open-items"></a>

## Implementation choices

The private byte remains reflex-owned and strategic read-only. Speaking has separate explicit
byte outputs. The complete reflex layout is 83 inputs, 24 hidden units and 28 outputs.
Physical format v49 advances once for both features, without migration. The previously running
world is not changed by local delivery.

The interval is eight physiology intervals; hidden width is eight; λ spans [2,8] with default
5. Retention alleles map to [0,1), initially 0.5. Founder relays use unit weights, with zero
reflex context connections and neutral learning gain. Strategic learning pays one ordinary
physiology-update price per strategic evaluation. Reflex gain multiplies both paid trace time
and its price. Basal upkeep, future motors and both learning layers are protected through the
shared interval reserve before optional speech or growth.

[Local resource seasons](local-resource-seasons.md) retains its reflex information boundary;
the strategic layer additionally receives present local circular phases and past empty time.
Checkpoint state retains the interval integrals, long memories, context, noise stream and
ablation setting; derived spatial reductions rebuild on restore.

The ordinary `strategyAblation` command takes `enabled: true` to clamp displayed context to
each cell's long mean and `enabled: false` to restore generated context. An optional living
`cell` ID selects one cell; omitting it applies the setting to every current cell. The selected
cell inspector exposes the same control. Native execution requires the existing operator
authentication. The intervention and each cell's setting survive checkpoints.
