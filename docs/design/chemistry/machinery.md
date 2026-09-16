# Fixed machinery and controller contract

The [composed runtime](composed-runtime.md) implements [computable chemistry](computational-foundation.md):
heritable manifold kernels, weighted mixture reductions and bounded product mappings with
actual funded capacity. Checkpoint v13 persists continuous targets and separate actual installed
coordinates. Earlier categorical direction, integer products and birth-time recycling are retired.

Status: implemented, with resolved choices in [numerical design](numerical-engine.md). The user specified a small
fixed-slot genome; four slots per class were selected during implementation. See the [overview](README.md) and
[substrate](substrate.md) for scope and chemistry rules.

## Fixed genome shape

Start with four receptors, four transporters and four unary enzymes per chromosome. Slots have
stable indices 0–3 in each class. There is no insertion, deletion, duplication, variable-length
genome or mutation that changes the neural interface size. Counts belong to a versioned schema,
not a runtime setting that can reinterpret existing genomes or checkpoints.

| Gene group | Heritable values per slot | Actual funded material |
| --- | --- | --- |
| Receptor | Target x/y, investment | Receptor stock |
| Transporter | Target x/y, investment | Transporter stock |
| Enzyme | Substrate-center x/y, product-offset dx/dy, investment | Enzyme stock |
| Membrane | One compatibility x/y coordinate for the cell | Included in ordinary core/membrane construction |
| General body | Core, motor and storage construction targets | Core, motor and storage stocks |

There are 15 material stocks: core, motor, storage and twelve machinery stocks. Chemical
inventory and usable energy are separate. Dedicated A/B processors, weapon, matrix builder, light harvester and universal chemical-defense
stocks are removed. General repair
remains a core-supported action, with energy and replacement-material costs.

Targets and membrane centers are bounded f64 coordinates in [0,15], reflected on mutation.
Continuous product offsets lie in [-15,15] on each axis. Reflected bilinear products preserve
discrete chemical identities and conserve material; local mutations cross grid boundaries smoothly.
Idle maps retain occupancy but change no material or work. Transport direction comes from signed
neural effort, with no categorical exporter allele.

Keep the core target strictly positive. Machinery investment uses bounded nonnegative construction
targets, scaled by the core blueprint and fixed
per-class reference ratios. Include zero and a local mutation path out of zero. There is no separate
irreversible disabled state. A nearly quiet slot still has a genetic target and neural channels;
mutation can raise investment or move its specificity without creating a new slot.

## Costs, development and competition

Slot capacity follows built stock, never investment directly. Each stock requires chemical matter,
assembly energy, occupied area and maintenance. Transport and conversion cost work; a catalytic
price applies only to material that changes identity. Inactive machinery still occupies the body and pays maintenance; turning
off transporter effort does not recover its construction cost.

Keep the current proportional-deficit growth rule toward twice the newborn blueprint, using the
new stock vector. Include every stock and internal amount in body volume, storage and drag.
Receptor gain depends on actual receptor stock relative to core; transporter/enzyme throughput is
bounded by installed stock, damage and actual supply. Per-class scales should be shared, not tuned
per slot or per species to manufacture distinct roles.

No extra specialist bonus or enforced zero-sum budget is proposed. More machinery already costs
matter, maintenance and space. Those costs may still permit a successful generalist. A constructed
comparison must measure conditional payoffs before claiming that investment alone ensures niches.

An inherited change alters a daughter's machinery specification and future construction targets.
Birth partitions actual parental stock by slot identity; it does not fill the daughter's changed
target for free. Changed machinery retains its actual coordinates and response until work above
the interval reserve funds gradual refitting. Optional lifetime transfer uses the same rule.
Unchanged stocks and compiled coefficients remain shared and partition normally.

## Receptors

For each receptor target t, sample `R(p) = sum(C(s,p) * affinity(t,s))` at the existing local
center and perimeter positions. Apply an installed-stock gain, for example
`g = receptorStock / (receptorStock + referenceReceptorPerCore * coreStock)`, before normalization.
Zero built receptor gives zero signal; infinitesimal stock must not provide full sensing for free.

Each receptor supplies four readings in a fixed order: local tonic level, temporal change,
body-forward contrast and body-left contrast. Retain bounded concentration normalization and
body-relative sampling. Contrast is across the cell, not a geographic bearing. Use one shared
receptor normalization scale initially; differential specificity comes from genes, not labels.

Each slot retains its own adaptation baseline with a fixed time constant. Initialize newborn
baselines from its actual local weighted reading to avoid artificial birth spikes. Growth can
change receptor gain and hence readings; baseline state follows the implemented gain convention
and is persisted. The controller receives no list of species or direct U/D/I/S lookup.

## Neural input and output layout

Retain one 24-unit recurrent controller. The controller has 39 inputs:

| Indices | Reading |
| --- | --- |
| 0–15 | Four receptor blocks, each tonic/phasic/forward/left |
| 16–19 | Four actual receptor capacities |
| 20–23 | Four actual transporter capacities |
| 24–27 | Four actual enzyme capacities |
| 28 | Usable energy / actual energy capacity |
| 29 | Core growth relative to newborn target |
| 30–33 | Front, left, rear and right contact |
| 34 | Opaque task byte / 255 |
| 35–36 | Actual motor and storage capacity |
| 37 | Total internal chemical amount / actual storage capacity |
| 38 | Functional damage |

Normalize installed capacities by actual stock and a reference newborn stock as in the current
body observations. Inputs describe funded physiology. There is no membrane coordinate, chemical
potential, compartment species list, global time, population demand or reproductive score input.
Receptors sense extracellular chemistry in v1; internal mixture composition is not individually
observable through these channels. Inventory fill, energy, damage and private memory provide the
controller's internal feedback. Record this limit when testing metabolic regulation.

Inference runs every 0.8 model seconds. The rational saturation and compact affinity are
specified in [the controller contract](../controller.md); actions are held between inferences.

Nine output logits:

| Index | Action | Decoding |
| --- | --- | --- |
| 0 | Forward swimming | `max(0, saturation(logit))` |
| 1 | Turning | `saturation(logit)` |
| 2 | General repair | `max(0, saturation(logit))` |
| 3 | Candidate private byte | `round(127.5 * (1 + saturation(logit/2)))` |
| 4 | Commit byte | Commit if logit is nonnegative |
| 5–8 | Transporter slot effort | Signed `saturation(logit)`, stored as `(1 + effort)/2` |

Negative effort exports, zero holds, positive effort imports. Enzymes operate constitutively from
installed stock, internal substrate and actual installed offsets. Receptor expression and biomass growth
remain physiology, not additional action selectors. Synthesis followed by export is ordinary
enzyme and transporter use; no output means toxin, signal, wall or sharing.

Transport uses neural effort; constitutive reactions with substrate/product occupancy are limited by installed stock
and physical resources.
Requests are simultaneous within the substrate's declared phases. No automatic optimizer chooses
profitable reactions, and no special metabolic fallback runs when the RNN is quiet. Founder import biases are explicit ordinary mutable weights; enzyme operation needs no action channel.

This network has 1,761 weights and biases plus eleven plasticity loci: 39*24 input weights,
24*24 recurrent weights, 24 hidden biases, 24*9 output weights and nine output biases. Its schema
is incompatible with the former 35-input/eight-output controller; old genomes are rejected.

## Learning and genetic ownership

Preserve paid private plasticity and explicit birth-local assimilation. Replace the old dedicated
food-A and neutral-chemical learning modulators with one coefficient per receptor's phasic reading,
plus the existing energy-change modulation and other learning terms. This changes the plasticity
schema; do not leave privileged named-chemical channels in an otherwise generic controller.

The controller owns weights, private state, inference, learning, assimilation, mutation,
recombination, distance and its codec. Organism genetics owns the fixed machinery genes, body
targets, chromosomes and inheritance. Chemistry owns affinities and affordable transfers/reactions.
Code outside the controller does not inspect its weight arrays to decide metabolism.

Default remains haploid clonal reproduction with independent environment, body and genetic random
streams. Mutations occur at funded local birth, do not select on measured success, and produce
immutable genotype records. Acquired traces are assimilated into recurrent weights once; hidden
state, byte, traces and contacts reset, receptor baselines initialize locally, damage persists.

For optional diploid/selfing policies, define expression explicitly in the new genetic schema:
average homologous continuous targets, offsets and investments. Recombine whole machinery-slot
alleles; do not splice coordinates from unrelated targets. These expression rules retain existing
optional policies, not an instruction to add outcrossing or new genome modes.

Gene transfer is implemented but disabled in the default. It transfers a complete typed slot allele and record donor, recipient, old/new genotype and slot.
Do not exchange a raw old physical-vector index. The transferred allele must use the same funding
and expression rules as descent; a genotype transfer is not a stock grant.

## Founder and UI interpretation

Seed at least two spatial colonies with the same modest viable genotype, funded internal inventory
and usable energy included in initial accounting. A candidate four-transporter arrangement can
use two import and two export slots, but their species targets and expression are founder genes,
not population roles or permanent slot semantics. Preserve free mutation of those targets.

A short authored founder check must establish that local sensing, paid import, downhill processing
and generic construction can run before its starting energy expires. Do not choose a founder by
long-run dominance or seed a panel of diagnostic specialists into the live world. Authored reflexes
and bootstrap inventory must be visible in the handoff record.

Show target coordinates, installed versus desired capacity, effort, actual flux and costs in the
inspector. Show membrane compatibility alongside measured stress, not an immunity percentage with
no exposure context. Inherited machinery and observed material flows may color local populations,
but slot identity or receptor color alone is not a species, niche or demonstrated adaptation.
