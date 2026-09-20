# Funded machinery and controller contract

The [composed runtime](composed-runtime.md) implements [computable chemistry](computational-foundation.md):
heritable manifold kernels, weighted mixture reductions and bounded product mappings with
actual funded capacity. Checkpoint v33 persists continuous targets and separate actual installed
coordinates. Earlier categorical direction, integer products and birth-time recycling are retired.

Status: the [joint organization design](../cellular-organization-and-exchange.md) extends the
earlier fixed repertoire with bounded program duplication/deletion and funded local regulation. See the [overview](README.md) and
[substrate](substrate.md) for scope and chemistry rules.

## Bounded genome shape

Start with four receptors, four transporters and four unary enzyme programs per chromosome.
One to eight enzyme programs occupy stable records. Genetic programs and retired actual stock
share that bound: deletion cannot hide unbounded orphan machinery. A template may have zero
investment; inactive records provide no chemical function. Controller ports are bounded by the
same eight-record arena. Counts belong to the versioned schema.

| Gene group | Heritable values per slot | Actual funded material |
| --- | --- | --- |
| Receptor | Target x/y, inward fraction, investment | Stock divided between inward/outward sensing |
| Transporter | Target x/y, investment | Transporter stock |
| Enzyme | Recognition x/y, reflection centerX/centerY, orientation, investment | Enzyme stock |
| Membrane | One compatibility x/y coordinate for the cell | Included in ordinary core/membrane construction |
| General body | Core, motor and storage construction targets | Core, motor and storage stocks |

There are20 bounded material stock records: core, motor, storage, eight fixed receptor/transporter
stocks, eight enzyme records and a
separately funded photoreceptor. Optical sensing grants no harvesting or automatic steering. Chemical
inventory and usable energy are separate. Dedicated A/B processors, weapon, matrix builder, light harvester and universal chemical-defense
stocks are removed. General repair
remains a core-supported action, with energy and replacement-material costs.

Targets and membrane centers are bounded f64 coordinates in [0,15], reflected on mutation.
Reflection centers lie in[0,15] independently of recognition. Mixtures of interval reflections
and quarter turns preserve discrete identities and material; local parameter changes are continuous.
Chemical mutation uses the shared distribution in specificity units (recognition radius times
physical scale); rare large jumps remain uncapped. The full-width15 scaling was rejected.
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
Conversion yield includes the same accounted local environmental work as abiotic transformations;
the [runtime contract](composed-runtime.md) defines funding, frozen sampling and dissipation.

Use proportional-deficit growth toward neural construction requests: `2*g*b` for optional
stocks and `g*(1+b)` for core. Surplus stocks may be retired with paid work, one shared
handling budget and frozen storage headroom. Division requires twice the core target plus
actual daughter reserves; it grants no missing optional machinery. Include every stock and
internal amount in body volume, storage and drag.
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

Each receptor divides funded stock by its paid installed inward fraction. Outward stock supplies
local tonic level, temporal change, body-forward contrast and body-left contrast. Inward stock
supplies tonic level and temporal change of recognized free inventory divided by area.
Retain bounded concentration normalization and
body-relative sampling. Contrast is across the cell, not a geographic bearing. Use one shared
receptor normalization scale initially; differential specificity comes from genes, not labels.

Each slot retains its own adaptation baseline with a fixed time constant. Initialize newborn
baselines from its actual local weighted reading to avoid artificial birth spikes. Growth can
change receptor gain and hence readings; baseline state follows the implemented gain convention
and is persisted. The controller receives no list of species or direct U/D/I/S lookup.

## Neural input and output layout

Retain one 24-unit recurrent controller. The controller has56 inputs:

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
| 39–42 | Paid optical level, change, body-forward contrast and body-left contrast |
| 43 | Actual photoreceptor stock relative to its target |
| 44–51 | Four inward receptor tonic/phasic pairs |
| 52–55 | Enzyme records 4–7 actual capacities relative to targets |

Normalize installed capacities by actual stock and a reference newborn stock as in the current
body observations. Inputs describe funded physiology. There is no membrane coordinate, chemical
potential, compartment species list, global time, population demand or reproductive score input.
Receptors sample the same normalized accessible interface as transport, including exposed
free material of injured neighbors. Intact neighbors reveal no inventory. Inward sensing
adds chemical-specific internal observations, not direct property-table or rate-profit inputs.

Inference runs every 0.8 model seconds. The rational saturation and compact affinity are
specified in [the controller contract](../controller.md); actions are held between inferences.

Thirty-eight output logits:

| Index | Action | Decoding |
| --- | --- | --- |
| 0 | Forward swimming | `max(0, saturation(logit))` |
| 1 | Turning | `saturation(logit)` |
| 2 | General repair | `max(0, saturation(logit))` |
| 3 | Candidate private byte | `round(127.5 * (1 + saturation(logit/2)))` |
| 4 | Commit byte | Commit if logit is nonnegative |
| 5–8 | Transporter slot effort | Signed `saturation(logit)`, stored as `(1 + effort)/2` |
| 9–16 | Enzyme activity | Positive saturation |
| 17–36 | Stock construction allocation | Positive saturation |
| 37 | Shared retirement effort | Positive saturation |

Negative effort exports, zero holds, positive effort imports. Enzymes combine neural activity,
installed stock, internal substrate, product occupancy and retained-mixture rate response.
Physical physiology funds every requested construction, refit and retirement. Synthesis followed by export is ordinary
enzyme and transporter use; no output means toxin, signal, wall or sharing.

Transport and enzymes use neural effort; reactions with substrate/product occupancy are limited by installed stock
and physical resources.
Requests are simultaneous within the substrate's declared phases. No automatic optimizer chooses
profitable reactions, and no special metabolic fallback runs when the RNN is quiet. Founder
import, enzyme activity and construction biases are explicit ordinary mutable weights.

This network has2,894 weights and biases plus eleven plasticity loci:56*24 input weights,
24*24 recurrent weights, 24 hidden biases, 24*38 output weights and 38 output biases. Its schema
is incompatible with earlier controllers; old genomes are rejected.

## Learning and genetic ownership

Preserve paid private plasticity and explicit birth-local assimilation. Replace the old dedicated
food-A and neutral-chemical learning modulators with one coefficient per receptor's phasic reading,
plus the existing energy-change modulation and other learning terms. This changes the plasticity
schema; do not leave privileged named-chemical channels in an otherwise generic controller.

The controller owns weights, private state, inference, learning, assimilation, mutation,
recombination, program-port transformations, distance and its codec. Organism genetics owns machinery genes, body
targets, chromosomes and inheritance. Chemistry owns affinities and affordable transfers/reactions.
Code outside the controller does not inspect its weight arrays to decide metabolism.

Default remains haploid clonal reproduction with independent environment, body and genetic random
streams. Mutations occur at funded local birth, do not select on measured success, and produce
immutable genotype records. Acquired traces are assimilated into recurrent weights once; hidden
state, byte, traces and contacts reset, receptor baselines initialize locally, damage persists.

For optional diploid/selfing policies, define expression explicitly in the new genetic schema:
average homologous continuous targets, reflection centers and investments, with circular orientation means. Recombine whole machinery-slot
alleles; do not splice coordinates from unrelated targets. These expression rules retain existing
optional policies, not an instruction to add outcrossing or new genome modes.

Gene transfer is implemented but disabled in the default. It transfers a complete typed slot allele and record donor, recipient, old/new genotype and slot.
Do not exchange a raw old physical-vector index. The transferred allele must use the same funding
and expression rules as descent; a genotype transfer is not a stock grant.

## Founder and UI interpretation

Seed at least two spatial colonies with four mutable founder genotypes, funded internal inventory
and usable energy included in initial accounting. The [initial ecosystem design](regenerative-ecosystem.md)
selects the starting chemical circuit; ordinary mutation can leave those roles. A candidate four-transporter arrangement can
use two import and two export slots, but their species targets and expression are founder genes,
not population roles or permanent slot semantics. Preserve free mutation of those targets.

A short authored founder check must establish that local sensing, paid import, externally funded processing
and generic construction can run before its starting energy expires. Do not choose a founder by
long-run dominance or substitute harness diagnostic winners for the declared starting circuit. Authored reflexes
and bootstrap inventory must be visible in the handoff record.

Show target coordinates, installed versus desired capacity, effort, actual flux and costs in the
inspector. Show membrane compatibility alongside measured stress, not an immunity percentage with
no exposure context. Inherited machinery and observed material flows may color local populations,
but slot identity or receptor color alone is not a species, niche or demonstrated adaptation.
