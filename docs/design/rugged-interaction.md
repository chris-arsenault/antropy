# Rugged chemical interaction

**Status:** Deferred proposal — research direction specified September 30, 2026; [complementarity binding](#leading-candidate-complementarity-binding) is the leading candidate for derivation; implementation is not selected or scheduled. The [research paper](kauffman-landscapes-research.md) supplies the literature and analysis.

## Intent

Make two outcomes possible that the present chemistry rarely produces:

1. **Surprising mutations.** A single mutation can sometimes change qualitatively how a cell
   interacts with chemical space, in either direction: gaining a new class of fuel, losing
   protection, turning its own waste into food, or making a harmless chemical lethal to it.
2. **Distinct co-located roles.** Cells sharing the same slowly varying local mixture can occupy
   sharply different relationships to it. One lives on A and excretes B; a neighbor is harmed by
   B; a third lives on B. Genotype differences sort cells into roles rather than a continuum.

Both must follow from non-smooth mathematics in how genotypes relate to chemical identities.
No chemical is labeled food, waste, toxin or signal, and no role is programmed.

## Scope boundary

- The spatial environment stays smooth: geography, diffusion, drift, transport and slowly varying
  concentrations are unchanged.
- The target is between-cell divergence. Sharp switching within one cell under slightly different
  conditions is outside this direction; the [strategic controller](strategic-controller.md) and
  controller work own within-cell modes.
- The achievable claim is unpredictability within the 256 prestated identities, not an expanding
  possibility space ([research §5, L7](kauffman-landscapes-research.md#5-synthesis-for-biotropy)).

## Present state

The consequence of chemical s for genotype g has three parts: harm, energy value and
recognition. All three are built from global low-frequency property surfaces read through radial
kernels of radius 3 around about 25 inherited chemical coordinates. Harm ranking and energy value
are the same for every cell; a genotype can only discount harm near its membrane coordinate and
choose which neighborhood it recognizes and transforms. Mutation moves coordinates with a
heavy-tailed step. The map from genes to interactions is continuous and locally monotone, close to
Kauffman's additive K = 0 limit. Long-run evidence shows geographic divergence and private
recycling rather than co-located roles.

## Requirements

Any mechanism selected under this direction must:

1. **Produce reciprocal sign epistasis** in the genotype-to-interaction map, so intermediates
   between roles can be worse than either role. Without it, multiple co-located optima are
   excluded.
2. **Expose ruggedness through one shared control,** comparable to NK's K or the rough Mount Fuji
   ratio, applied through one operator to all relevant machinery. No per-chemical, per-slot or
   per-role tuning.
3. **Keep a broad mutational effect distribution:** most mutations small or neutral, a minority
   drastic. Uniform ruggedness that defeats adaptation (the complexity catastrophe) fails this
   requirement; neutral networks with abrupt borders satisfy it.
4. **Leave the mutation law unchanged.** Steps keep the shared heavy-tailed distribution. The
   change is in what a step means, not in how steps are drawn.
5. **Preserve the accounts and the algebra.** Identities stay discrete; enzyme actions stay exact
   elements of `(S16 × S16) ⋊ C2`; material and work stay conserved. Genotype-relative harm and
   recognition are dissipative or kinetic and safe. Genotype-relative energy value must not create
   work: it may change rates, efficiency or access within `Δu + w`, not the reference potential.
6. **Keep perception local.** Cells still learn about chemicals only through funded sensors.
   No oracle reports a chemical's value to a genotype.
7. **Bound the cost.** New per-cell interaction tables compile at birth like existing operators;
   live reactions and transport do not gain per-species nonlinear evaluation.

## Candidate mathematical families

These are research candidates drawn from the literature. Complementarity binding is the leading
candidate and is derived below; the others remain recorded alternatives.

| Family | Idea | Kauffman or related source | Principal risk |
| --- | --- | --- | --- |
| NK-style genetic keys | Affinity for a chemical is an NK sum over the cell's key loci, each contribution depending on its own state, K other key loci and the chemical, as in Kauffman and Weinberger's antibody model. Applying NK to the chemical's bits instead makes reading rugged but leaves affinity linear in the genes | NK model | Random contribution tables have no physical interpretation; empirical molecular landscapes are often described by additive-plus-nonlinear models |
| Complementarity binding (leading) | Additive per-bit binding energy between a genetic key and the identity bits, passed through a sigmoid; one steepness control | Berg and von Hippel 1987; Gerland, Moroz and Hwa 2002; Otwinowski, McCandlish and Plotkin 2018; Farmer, Packard and Perelson 1986 | Broad keys enlarge recognition support and runtime cost |
| Many latent properties | Chemicals carry many independent high-frequency property channels; a cell's genes choose a signed projection, so which properties matter, and whether they help or harm, is genetic | Screwdriver and jury-rigging arguments | More property channels per identity; cost of per-cell projections |
| Rough Mount Fuji interaction | Present smooth kernel plus a genotype-and-identity rugged term, with one ratio controlling ruggedness | Neidhart, Szendro and Krug 2014 | The rugged term needs a heritable, mutable definition |
| Neutral-network encoding | Chemical machinery parameters are decoded from a many-to-one genetic encoding, flat over large sets with abrupt borders | Schuster et al. 1994; Wagner 2008 | Requires a new genotype representation and codec |
| Closure-defined consequences | No change to recognition; measure and expose how single mutations complete or break closed cycles among a neighborhood's capabilities | RAF theory, TAP | May not by itself create sign epistasis; mainly a diagnostic lens |

Two structural observations guide selection:

- **Bit space and manifold space can coexist.** Biotropy identities are 8 bits
  (`s = 16x + y`). Environmental chemistry already acts by single-bit flips. Interaction can read
  bit-space relations while transport and diffusion keep the smooth manifold metric.
- **Coupling is already present.** Cells change each other's surroundings through exports and
  deposits. By Kauffman and Johnsen's order parameter, adding interaction ruggedness shifts the
  balance from continual chasing toward mutually determined roles; too much freezes the ecosystem.

## Leading candidate: complementarity binding

Derived September 30, 2026. This is a candidate for review, not a selected law. It replaces the
radial recognition kernel with an additive binding energy over identity bits followed by one
nonlinearity, the form that describes transcription-factor binding (Berg and von Hippel 1987;
Gerland, Moroz and Hwa 2002) and much measured protein epistasis (Otwinowski, McCandlish and
Plotkin 2018; Sailer and Harms 2017).

### Operation

Write identity `s = 16x + y` as eight bits `(x3 x2 x1 x0 y3 y2 y1 y0)` and map each to a spin
`β_j(s) = +1` for a one bit and `−1` for a zero bit. Every recognition site carries a key: eight
weights `κ_j ∈ [−1, 1]` and a bias `b`. Its binding energy and affinity for identity s are

```text
E(s) = Σ_j κ_j β_j(s) + b
A(s) = 1 / (1 + exp(−λ E(s)))
```

λ is the single shared ruggedness control, measured in logits per unit energy. One full-weight
bit mismatch changes E by 2, so it moves affinity by 2λ logits. Weight sign says which bit value
the site prefers; weight magnitude says how much that bit position matters; the bias sets how
many mismatches the site tolerates.

A(s) replaces the radial kernel `k_a(s)` wherever the runtime compiles recognition rows:

| Site | Count | Use of A(s) |
| --- | --- | --- |
| Receptor | 4 | Sensing weight over the local mixture |
| Transporter | 4 | Recognition weight for import and export |
| Enzyme | 8 | Substrate engagement; the product action (reflection centers, orientation) is unchanged |
| Membrane | 1 | Protection `σ_s = 1 − (1 − floor) · A(s)`, passive permeability and the adhesion compatibility profile |

Unchanged: global property surfaces (U, D, I, S and the interaction profiles), exact enzyme
actions in `(S16 × S16) ⋊ C2`, material and work accounts, the heavy-tailed mutation law,
controller inputs and the smooth spatial environment. Harm stays non-negative and globally
ranked by S; what becomes cell-relative is which chemicals a membrane protects against.

### What keys can express

| Key | Weights and bias | Recognized set |
| --- | --- | --- |
| Single-identity lock | `κ_j = ±1` matching a target, `b = −7` | `E = 1 − 2h` for Hamming distance h: only the target |
| Tolerant lock | Same weights, `b = −5` | `h ≤ 1`: the target plus 8 identities, a cross along its row and column of the manifold |
| Row reader | Weights on x bits only | Affinity constant along y: the cell reads only the X coordinate |
| Periodic reader | Weight on x0 only | Alternating columns: periodic faster than any property surface |
| Generalist | Weights near zero, `b > 0` | Nearly every identity, weakly specific |

For example, a tolerant lock on 180 (`1011 0100`, x = 11, y = 4) recognizes 180 and
(3, 4), (15, 4), (9, 4), (10, 4), (11, 12), (11, 0), (11, 6) and (11, 5). Neighbors on the
manifold, such as (7, y) and (8, y), differ in four x bits and can fall on opposite sides of a
threshold.

### How it meets the requirements

- **Sign epistasis.** Affinity is a sigmoid of an additive trait, which gives magnitude epistasis
  within one chemical. One weight shifts the affinity of half of identity space together, so a
  mutation's net value depends on whether the chemicals it moves across threshold are food or
  harm for this cell, which the other weights and bias decide. Such pleiotropy across chemicals
  of opposite value produces sign epistasis, and reciprocal sign epistasis when two weights are
  needed together to reach or exclude a pattern.
- **One control.** λ sets ruggedness for every site. As λ → 0 affinity becomes uniform; large λ
  gives step-like locks.
- **Neutral networks with abrupt borders.** Many keys produce the same recognized set: any
  weights with the same signs and margins. Steps inside that set change little; a step that moves
  some identity across `E = 0` changes the set abruptly.
- **Mutation law unchanged.** κ and b are ordinary bounded scalar genes, mutated with the shared
  heavy-tailed law and reflection. A median step moves every affected energy by a fraction of one
  mismatch; rare large steps flip a weight's sign or a lock's tolerance.
- **Generalist cost from existing physics.** Transporter and enzyme capacity is already divided
  among recognized species by the shared occupancy denominator, so broad keys spread throughput
  thinly. No new charge is needed for a specialist/generalist tradeoff.

### Coherence with the existing chemistry

The manifold keeps its role for property surfaces, transport and enzyme actions; recognition
reads bit space. Environmental chemistry already moves identities by single-bit flips, so a public
conversion moves a chemical exactly one mismatch relative to every key. The founder circuit
0 → 128 → 136 → 8 → 0 is a square of single-bit flips (bits x3 and y3); tolerance-zero founder
keys recognize only their input, while tolerance-one keys would also recognize their product.

### Costs

Each birth compiles 17 sites × 256 identities of affinity, a negligible one-time cost. Runtime
cost follows recognition support. The radial kernel supports 25 identities away from the manifold edge; a
broad key can support all 256. Rows keep a support cutoff (affinity below a small fraction of the site maximum
is zero), and constructed checks must measure reaction and transport cost for specialist and
generalist populations.

The genotype grows from 17 coordinate pairs to 17 keys of nine scalars. Enzyme action genes are
unchanged. The checkpoint format advances without migration; founders are re-expressed with
explicit keys.

### Open choices for this candidate

1. Default λ. A starting range of 3–6 logits per full-weight mismatch is a hypothesis to test in
   constructed fixtures, not a calibrated value.
2. Bias bounds, which set the widest and narrowest possible locks.
3. Support cutoff and its measured cost for broad keys.
4. Whether the adhesion compatibility profile keeps its current form under keyed membranes.
5. How the inspector and chemical web present keys and recognized sets.

## Evidence

Delivery would include bounded constructed checks, recorded in a results document:

- distribution of effects of single chemical-gene mutations on harm, recognized supply and
  attainable yield in fixed mixtures, before and after, including the fraction of sign changes;
- correlation length of interaction response along random mutational walks;
- frequency of sign and reciprocal sign epistasis among mutation pairs;
- constructed co-located fixtures in which two or three handcrafted genotypes share one smooth
  mixture, showing distinct net returns and worse intermediates.

Long-run questions, such as whether distinct roles emerge and persist, belong to later observation
and follow the [experiment policy](experimentation.md). Diversity cannot be guaranteed.

## Open questions

1. Which layers become rugged: harm, recognition, energy access, or a combination?
2. Should ruggedness live in the chemical reading, in the genotype decoding, or both?
3. What value of the shared ruggedness control is a reasonable default, and how is it calibrated
   without tuning for a desired community?
4. How does this interact with the deferred [strategic controller](strategic-controller.md) and
   [utterances](cell-utterances.md)?
5. Does the founder circuit need re-expression under a rugged map, or can it be preserved as a
   declared initial condition?
