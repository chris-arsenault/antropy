# Rugged interaction: Kauffman's landscapes and role differentiation in Biotropy

**Status:** Current reference — research paper (September 30, 2026) supporting the deferred [rugged chemical interaction](rugged-interaction.md) direction; it reviews Stuart Kauffman's work and adjacent literature and selects no mechanism.

## Abstract

Biotropy's cells relate to chemicals through smooth global property surfaces read by smooth
radial recognition kernels. Mutation, even when heavy-tailed, therefore relocates a cell's
chemical capabilities without changing their kind, and cells sharing a slowly varying mixture
spread along a continuum of similar ways of living rather than separating into distinct roles.
Stuart Kauffman's work on rugged fitness landscapes, coevolving landscapes, Boolean networks,
autocatalytic sets and, more recently, affordances and the adjacent possible, offers a vocabulary
and a set of quantitative results for this problem. In Kauffman's NK terms the present
genotype-to-interaction map is close to the additive K = 0 limit. The literature indicates that
distinct coexisting roles require reciprocal sign epistasis in that map; that uniform ruggedness
defeats adaptation, while neutral networks with abrupt borders reconcile rare drastic effects
with evolvability; and that co-located roles behave like the frozen components of coupled
landscapes, whose stability depends on the ratio of within-genome ruggedness to ecological
coupling. Kauffman's recent work also sets an honest boundary: a world with 256 prestated
chemicals can become unpredictable, not unprestatable.

## 1. The problem

The user's intent, agreed September 30, has two parts:

1. **Surprise under mutation.** A single mutation can sometimes change qualitatively how a cell
   relates to chemical space, favorably or unfavorably: a new class of fuel, lost protection,
   a formerly harmless chemical becoming lethal, the cell's own waste becoming food.
2. **Divergent roles in shared conditions (between cells).** Cells in the same slowly varying
   local mixture can stand in sharply different relationships to it: one lives on A and excretes
   B, a neighbor is harmed by B, a third lives on B. Genotype differences should sort cells into
   distinct roles rather than a continuum.

Both must arise from non-smooth mathematics, not from labels or programmed roles. The spatial
environment stays smooth: slowly varying concentrations, diffusion and transport are unchanged.
Sharp switching within one cell under slightly different conditions is outside this scope.

## 2. The present system as a landscape

Write the consequence of chemical s for a cell with genotype g as F(s, g), with three parts:
harm, energy value and recognition. The installed runtime composes F from two ingredients.

**Global surfaces.** Each of the 256 identities sits at a point of a 16 × 16 manifold (identity
`s = 16x + y`) and has potential U, diffusivity D, impedance I, stress S and two interaction
profiles, generated from a few low-frequency cosine modes (`engine/src/chemistry.rs`). Every
cell sees the same values.

**Radial kernels.** Receptors, transporters, enzyme recognition and the membrane read chemicals
through `k_a(s) = max(0, 1 − |s − a|²/R²)²` with R = 3 around inherited coordinates a. A neighbor
at distance 1 receives 79% of the central weight. Enzyme products come from reflections and axis
exchanges, which preserve distance. Harm is `concentration × S(s) × (1 − 0.95 · membraneMatch)`
(`engine/src/sensing.rs`): a genotype can discount a globally ranked harm near one coordinate,
never reverse it. Energy value comes from `Δu + w` with U global.

The genotype enters F by positioning about 25 chemical coordinates (four receptors, four
transporters, eight enzymes with recognition and reflection centers, and the membrane) and
through enzyme orientation. Mutation moves those coordinates with a heavy-tailed isotropic step
scaled by R. The resulting map from genes to interactions is continuous and locally monotone:
a small gene step causes a small change, and a large step moves a disc of competence elsewhere.

Some non-smooth structure already exists and is worth preserving:

- identities are discrete and actions are exact permutations of `(S16 × S16) ⋊ C2`;
- enzyme program count mutates by discrete duplication and deletion;
- environmental chemistry flips single identity bits (jumps of 1, 2, 4 and 8 per axis), a
  relation that ignores manifold distance;
- the founder circuit 0 → 128 → 136 → 8 → 0 is a discrete closure among four enzyme types;
- the controller's saturating recurrent network can express switch-like behavior.

The long-run evidence matches the landscape reading. The v33 180k run showed geographic
divergence between colonies, private recycling near 98% in large colonies, direct neighbor
transfer under 2% of uptake and weak conditional enzyme regulation ([outcomes](../outcomes-and-directions.md)).

## 3. Kauffman's program

### 3.1 Rugged landscapes: the NK model

*The Origins of Order* (Kauffman 1993) argues that selection acts on systems whose generic,
ensemble-typical properties already supply much of their order, so predicting evolution needs
the statistical structure of the landscape, not only the selective force. The NK model makes that
structure tunable (Kauffman and Levin 1987; Kauffman and Weinberger 1989).

A genotype has N loci. Each locus i contributes `f_i(s_i; s_i1, …, s_iK)`, a value drawn
independently from U(0, 1) for every configuration of itself and K epistatic partners, and

```text
F(s) = (1/N) Σ_i f_i
```

A single mutation redraws on average K + 1 contributions.

- **K = 0** is the additive "Fujiyama" landscape: one global optimum, neighbors differing by
  O(1/N), walks of about N/2 steps.
- **K = N − 1** is fully random ("house of cards"): about `2^N/(N + 1)` local optima, walks of
  order ln N, and any start reaches only a small fraction of peaks (Kauffman and Levin 1987).
- **Intermediate K** raises the number of optima and steepens peaks; mean optimum height first
  rises slightly (K ≈ 2–4) and then falls toward the mean.

The mutational correlation length is approximately `ℓ ≈ N/(K + 1)` for random neighborhoods
(Weinberger 1990, 1991; derived form). Two results matter here:

- **Long jumps.** When mutations jump beyond ℓ, each jump samples an effectively random genotype.
  The waiting time to each further improvement doubles, so cumulative improvements after G
  generations grow as about `log₂ G`: rapid early change, then apparent stasis (Kauffman and
  Levin 1987).
- **Complexity catastrophe.** As K grows with N, attainable optima regress toward the mean of the
  space, and selection increasingly fails to hold populations on peaks.

### 3.2 Coupled landscapes: NKCS and frozen components

Kauffman and Johnsen (1991) couple S species: each locus's contribution depends on its K
internal partners and on C loci in each coupled species. One species' adaptive move deforms its
partners' landscapes. A Nash equilibrium holds when every species is at a local optimum given the
others. Their results, from the Santa Fe working paper version, are:

- `K = C` is a rough dividing line. When internal ruggedness exceeds coupling, equilibria form
  rapidly; when coupling dominates, species oscillate in "Red Queen" chasing.
- For ecosystems the order parameter is `K : C · S_i`. Ecosystems freeze into *frozen components*
  when internal ruggedness dominates and churn when coupling dominates. Frozen and churning
  regions can coexist in one ecosystem.
- Sustained mean fitness is highest near the boundary where equilibria "just tenuously form";
  there, perturbations trigger avalanches with power-law sizes.

Differentiation in NKCS is emergent: identical rules lock species into mutually determined local
optima, each best given the others. Discreteness comes from ruggedness combined with coupling
and disappears when coupling overwhelms ruggedness.

### 3.3 Discrete types from regulation: Boolean networks

Kauffman (1969) modeled gene regulation as N binary genes, each with K random inputs and a random
Boolean function. Trajectories fall onto attractors, proposed as cell types. With K = 2 the
networks are ordered; the annealed approximation gives the critical condition `K_c = 2` for
unbiased functions (Derrida and Pomeau 1986), generalized to mean average sensitivity equal to one
(Shmulevich and Kauffman 2004). Canalizing functions, where one input value fixes the output,
create frozen cores and leave isolated dynamic islands (Kauffman 1984; Kauffman et al. 2003).
Kauffman's original √N scaling of attractor counts was later corrected: counts grow faster than
any power of N (Samuelsson and Troein 2003) and exponentially in a connectivity-one case (Fink
and Sheldon 2023). The metaphor of discrete types from graded inputs survives. This line bears
mainly on within-cell switching, which is outside the present scope.

### 3.4 Collective closure: autocatalytic sets

Kauffman (1986) and Farmer, Kauffman and Packard (1986) showed that when molecular diversity
exceeds a threshold, random catalysis almost surely produces a reflexively autocatalytic set,
a connectivity phase transition. RAF theory formalizes this as a catalytic reaction system
(X, R, C, F) with food set F; a reaction subset is a RAF when every reaction is catalyzed by and
supplied from the closure of F under that subset (Hordijk and Steel 2004). A maximal RAF can be
found in polynomial time, appears at a mean catalysis level between 1 and 2 reactions per
molecule in the binary polymer model, and typically decomposes into many overlapping subRAFs
(Hordijk, Kauffman and Steel 2011; Hordijk and Steel 2017). Whether a set of capabilities closes
is a discrete property: a small change can complete or break it.

### 3.5 The adjacent possible and combinatorial innovation

*Investigations* (Kauffman 2000) introduced autonomous agents, work–constraint cycles and the
*adjacent possible*, the configurations one step from the actual, with a qualitative "fourth law"
that biospheres expand into it. The theory of the adjacent possible (TAP) was later written as

```text
M_{t+1} = M_t (1 − μ) + Σ_{i=2}^{M_t} α_i · C(M_t, i)
```

for M_t objects, extinction rate μ and decreasing combination constants α_i (Cortês, Kauffman,
Liddle and Smolin 2025). Its generic behavior is a long plateau followed by explosive divergence.
Novelty in TAP comes from combinations of existing items, not from perturbing one item.

### 3.6 Affordances and the limits of prestated worlds

Longo, Montévil and Kauffman (2012) argue that biospheric evolution is not entailed by laws but
*enabled*: new functions arise as exaptations, a lung partly filled with water becoming a swim
bladder, and they open new empty niches for others. Evolutionary trajectories are "cascades of
critical transitions, thus of symmetry changes", discontinuities that change which quantities
matter. Kauffman and Roli (2021) illustrate with the screwdriver: its uses are indefinite,
unordered and not deducible from one another. Roli, Jaeger and Kauffman (2022) extend this to
jury-rigging, where an object's use draws on a subset of its many causal properties, and conclude
that algorithmic systems cannot achieve open-ended evolution beyond their predefined possibility
space; Avida's "new" foods were "part of its initial ontology." Roli, Succi and Kauffman (2026)
separate *unpredictable* systems, whose fixed possibility space is intractable to forecast, from
*unprestatable* ones, whose possibility space itself changes. Kauffman's April 2026 *Noema*
interview, "Emergence Is Not Engineering", restates these claims for a general audience.

These arguments are contested. Hordijk (2016) frames McGhee's convergence view (function limits
form) and Kauffman's view (one form performs unboundedly many functions) as resting on different
assumptions that may both hold. Hirota, Saigo and Taguchi (2024) argue that category theory can
formalize perspective-dependent affordances. López-Díaz and Gershenson (2024) accept that
rule-based self-organization yields limited novelty but propose architectures with semantic
closure. Succi (2022) and van der Merwe (2023) question the scope and metaphysical commitments of
the program.

## 4. Adjacent results on epistasis and specificity

**Sign epistasis.** A mutation shows sign epistasis when its effect changes sign on a different
genetic background, and reciprocal sign epistasis when two mutations do so on each other's
backgrounds (Weinreich, Watson and Chao 2005). Reciprocal sign epistasis is a necessary, not
sufficient, condition for multiple peaks (Poelwijk et al. 2011). Empirically, few mutational
orderings toward β-lactamase resistance are accessible (Weinreich et al. 2006).

**Neutral networks and evolvability.** RNA sequence-to-structure maps are many-to-one: sequences
folding to common structures form extended neutral networks that percolate sequence space, and
common structures lie within a few mutations of an arbitrary sequence (Schuster et al. 1994).
The map is flat along networks and abrupt at their borders. Wagner (2008) shows that phenotype
robustness promotes phenotype evolvability, because a large neutral network borders many other
phenotypes. Holey landscapes (Gavrilets and Gravner 1997) give divergence along viable ridges
separated by holes.

**Tunable ruggedness without NK.** The rough Mount Fuji model `F(s) = −c · d(s, s*) + η(s)` sets
ruggedness by the ratio of the smooth slope c to the random term η (Neidhart, Szendro and Krug
2014).

**Additive binding energy and global epistasis.** Transcription-factor binding is well described
by a binding energy that is approximately additive over matched positions, with occupancy a
sigmoid (Fermi) function of that energy; sequence alone can then program the threshold
concentration over a wide range (Berg and von Hippel 1987; Gerland, Moroz and Hwa 2002). In
high-throughput mutagenesis data, much apparent epistasis is *global*: mutations act additively on
an unobserved trait that one monotone nonlinearity maps to the measured phenotype; in some proteins
this accounts for nearly all measured variation, in others substantial local epistasis remains
(Otwinowski, McCandlish and Plotkin 2018). After such nonlinear scales are removed, high-order
epistasis still contributes 2.2–31.0% of variation across seven experimental maps (Sailer and
Harms 2017). Szendro et al. (2013) compare ruggedness measures across empirical landscapes and
find ruggedness depends on whether mutations are beneficial or deleterious and on intragenic
versus intergenic interaction. These results make "additive match, then threshold" the best
physically grounded candidate for keyed recognition, with NK retained as an analysis framework.

**Shape space versus bitstrings.** Perelson and Oster (1979) placed molecular shapes in a
continuous low-dimensional space where each receptor recognizes a ball around its complement.
This is the smooth-kernel paradigm Biotropy uses. Farmer, Packard and Perelson (1986) instead
represented binding as thresholded complementarity between bitstrings: affinity is a step-like
function of Hamming distance, so one bit flip can cross a recognition threshold. On Biotropy's
8-bit identities, manifold neighbors can be far apart in bit space: (7, y) and (8, y) differ in
four bits of x.

## 5. Synthesis for Biotropy

**L1. The present map is near the additive limit.** Smooth kernels over smooth surfaces give
neighboring genotypes nearly equal returns in a fixed mixture: one basin per resource
configuration, continuous sliding, no local optima to hold distinct roles. Heavy-tailed mutation
supplies long jumps, but along the same continuum. Kauffman and Levin's theory implies that
discrete alternatives require a mutational correlation length that is short relative to typical
mutational steps in at least some directions of genotype space.

**L2. Distinct roles need reciprocal sign epistasis in the interaction map.** If every gene's
effect on interaction is monotone and smooth, the benefit of one change never reverses on another
background. Co-located roles that selection holds apart require genotype regions where
intermediates are worse than either role (Poelwijk et al. 2011).

**L3. Ruggedness should be tunable and not uniform.** Uniformly random interaction would trigger
the complexity catastrophe and defeat adaptation. Neutral networks, flat over large sets with
abrupt borders, give the intended distribution of mutational effects: most small or neutral,
some drastic (Schuster et al. 1994; Wagner 2008). One shared ruggedness parameter, such as NK's K
or the rough Mount Fuji ratio, fits the project's rule of few controls.

**L4. Co-located roles behave like NKCS frozen components.** Cells couple through the shared
medium: one cell's exports change what its neighbors experience. Kauffman and Johnsen's order
parameter predicts that if ecological coupling dominates interaction ruggedness, lineages chase
each other; if ruggedness dominates, they freeze into mutually determined roles; persistent roles
that still change lie between. Biotropy's coupling already exists; the missing term is ruggedness.

**L5. One orderable property per chemical is the source of continuity.** The screwdriver argument
depends on objects having many independent, unordered causal properties, with the agent's
context selecting which matter. A 2D coordinate read through a radial kernel is the opposite: one
metric property, uses ordered by distance. Interaction could read identity through structure other
than manifold distance, such as independent latent properties or bit-space relations, while
transport, diffusion and geography keep their smooth metric.

**L6. Drastic effects can come from combination and closure.** In TAP, RAF theory and exaptation,
large changes occur when a small change completes or breaks a combination of existing parts. In
Biotropy a mutation can matter drastically if it completes a closed cycle among a cell's or a
neighborhood's capabilities. RAF detection offers a discrete, measurable definition of such
closures.

**L7. The achievable target is unpredictability, not unprestatability.** The 256 identities and
their operators form an initial ontology in Kauffman's sense. Rugged interaction can make roles
and mutational outcomes surprising and hard to forecast within that space. By the argument of
Roli, Succi and Kauffman, it would not make the possibility space itself change. The direction
should claim the first and not the second.

## 6. Measurable signatures

These quantities distinguish a smooth interaction map from a rugged one without long ecological
runs, and later distinguish emergent roles from continua:

| Signature | Measure | Source |
| --- | --- | --- |
| Distribution of mutational effects | For fixed mixtures, the change in harm, recognized supply and attainable yield per chemical-gene mutation; tail weight and fraction of sign changes | NK, neutral networks |
| Correlation length | Autocorrelation of interaction response along random mutational walks; `ℓ = −1/ln r(1)` | Weinberger 1990 |
| Sign epistasis | Fraction of mutation pairs whose effects change sign on each other's background | Weinreich et al. 2005 |
| Local optima | Number of 1-mutant optima of returns in reduced constructed fixtures | Kauffman and Levin 1987 |
| Improvement dynamics | Cumulative improvements versus generations under constructed selection; `log₂ G` indicates uncorrelated long jumps | Kauffman and Levin 1987 |
| Co-located roles | Bimodal or multimodal interaction phenotypes within one neighborhood, with intermediate genotypes worse; mutual invasibility of the modes | NKCS; project experiment policy |
| Closure | Maximal RAF of a neighborhood's enzymes and supplies, and its change under single mutations | Hordijk and Steel 2004 |

## References

- Berg OG, von Hippel PH (1987). Selection of DNA binding sites by regulatory proteins: statistical-mechanical theory and application to operators and promoters. *Journal of Molecular Biology* 193(4):723–750.
- Cortês M, Kauffman SA, Liddle AR, Smolin L (2025). The TAP equation: evaluating combinatorial innovation. *European Economic Review* 179:105144. doi:10.1016/j.euroecorev.2025.105144.
- Derrida B, Pomeau Y (1986). Random networks of automata: a simple annealed approximation. *Europhysics Letters* 1(2):45–49. doi:10.1209/0295-5075/1/2/001.
- Farmer JD, Kauffman SA, Packard NH (1986). Autocatalytic replication of polymers. *Physica D* 22:50–67. doi:10.1016/0167-2789(86)90233-2.
- Farmer JD, Packard NH, Perelson AS (1986). The immune system, adaptation, and machine learning. *Physica D* 22:187–204. doi:10.1016/0167-2789(86)90240-X.
- Fink TMA, Sheldon FC (2023). Number of attractors in the critical Kauffman model is exponential. *Physical Review Letters* 131:267402. doi:10.1103/PhysRevLett.131.267402.
- Gavrilets S, Gravner J (1997). Percolation on the fitness hypercube and the evolution of reproductive isolation. *Journal of Theoretical Biology* 184:51–64. doi:10.1006/jtbi.1996.0242.
- Gerland U, Moroz JD, Hwa T (2002). Physical constraints and functional characteristics of transcription factor–DNA interaction. *PNAS* 99(19):12015–12020. doi:10.1073/pnas.192693599.
- Hirota Y, Saigo H, Taguchi S (2024). Reality of affordances: a category-theoretic approach. PsyArXiv. doi:10.31234/osf.io/52nzd.
- Hordijk W (2016). Evolution: limited and predictable or unbounded and lawless? *Biological Theory* 11:187–191. doi:10.1007/s13752-016-0251-5.
- Hordijk W, Kauffman SA, Steel M (2011). Required levels of catalysis for emergence of autocatalytic sets in models of chemical reaction systems. *International Journal of Molecular Sciences* 12(5):3085–3101. doi:10.3390/ijms12053085.
- Hordijk W, Steel M (2004). Detecting autocatalytic, self-sustaining sets in chemical reaction systems. *Journal of Theoretical Biology* 227(4):451–461. doi:10.1016/j.jtbi.2003.11.020.
- Hordijk W, Steel M (2017). Chasing the tail: the emergence of autocatalytic networks. *BioSystems* 152:1–10. doi:10.1016/j.biosystems.2016.12.002.
- Kauffman SA (1969). Metabolic stability and epigenesis in randomly constructed genetic nets. *Journal of Theoretical Biology* 22(3):437–467. doi:10.1016/0022-5193(69)90015-0.
- Kauffman SA (1984). Emergent properties in random complex automata. *Physica D* 10(1–2):145–156. doi:10.1016/0167-2789(84)90257-4.
- Kauffman SA (1986). Autocatalytic sets of proteins. *Journal of Theoretical Biology* 119:1–24. doi:10.1016/S0022-5193(86)80047-9.
- Kauffman SA (1993). *The Origins of Order: Self-Organization and Selection in Evolution*. Oxford University Press.
- Kauffman SA (1995). *At Home in the Universe*. Oxford University Press.
- Kauffman SA (2000). *Investigations*. Oxford University Press.
- Kauffman SA (2019). *A World Beyond Physics: The Emergence and Evolution of Life*. Oxford University Press.
- Kauffman SA, Johnsen S (1991). Coevolution to the edge of chaos: coupled fitness landscapes, poised states, and coevolutionary avalanches. *Journal of Theoretical Biology* 149(4):467–505. doi:10.1016/S0022-5193(05)80094-3.
- Kauffman SA, Levin S (1987). Towards a general theory of adaptive walks on rugged landscapes. *Journal of Theoretical Biology* 128(1):11–45. doi:10.1016/S0022-5193(87)80029-2.
- Kauffman S, Peterson C, Samuelsson B, Troein C (2003). Random Boolean network models and the yeast transcriptional network. *PNAS* 100(25):14796–14799. doi:10.1073/pnas.2036429100.
- Kauffman SA, Roli A (2021). The world is not a theorem. *Entropy* 23(11):1467. doi:10.3390/e23111467.
- Kauffman SA, Roli A (2023). A third transition in science? *Interface Focus* 13(3):20220063. doi:10.1098/rsfs.2022.0063.
- Kauffman SA, Roli A (2025). Is the emergence of life and of agency expected? *Philosophical Transactions of the Royal Society B* 380(1936):20240283. doi:10.1098/rstb.2024.0283.
- Kauffman SA, Weinberger ED (1989). The NK model of rugged fitness landscapes and its application to maturation of the immune response. *Journal of Theoretical Biology* 141(2):211–245. doi:10.1016/S0022-5193(89)80019-0.
- Kauffman S, Gardels N (2026). Emergence is not engineering. *Noema*, April 21. https://www.noemamag.com/emergence-is-not-engineering/.
- Longo G, Montévil M, Kauffman S (2012). No entailing laws, but enablement in the evolution of the biosphere. *GECCO Companion '12*, ACM. doi:10.1145/2330784.2330946.
- López-Díaz AJ, Gershenson C (2024). Closing the loop: how semantic closure enables open-ended evolution? arXiv:2404.04374.
- Neidhart J, Szendro IG, Krug J (2014). Adaptation in tunably rugged fitness landscapes: the rough Mount Fuji model. *Genetics* 198(2):699–721. doi:10.1534/genetics.114.167668.
- Otwinowski J, McCandlish DM, Plotkin JB (2018). Inferring the shape of global epistasis. *PNAS* 115(32):E7550–E7558. doi:10.1073/pnas.1804015115.
- Perelson AS, Oster GF (1979). Theoretical studies of clonal selection: minimal antibody repertoire size and reliability of self-non-self discrimination. *Journal of Theoretical Biology* 81(4):645–670. doi:10.1016/0022-5193(79)90275-3.
- Poelwijk FJ, Tănase-Nicola S, Kiviet DJ, Tans SJ (2011). Reciprocal sign epistasis is a necessary condition for multi-peaked fitness landscapes. *Journal of Theoretical Biology* 272(1):141–144. doi:10.1016/j.jtbi.2010.12.015.
- Roli A, Jaeger J, Kauffman SA (2022). How organisms come to know the world: fundamental limits on artificial general intelligence. *Frontiers in Ecology and Evolution* 9:806283. doi:10.3389/fevo.2021.806283.
- Roli A, Succi S, Kauffman SA (2026). Artificial intelligence: unpredictable or unprestatable? *Frontiers in Physics* 14. doi:10.3389/fphy.2026.1768372.
- Sailer ZR, Harms MJ (2017). Detecting high-order epistasis in nonlinear genotype-phenotype maps. *Genetics* 205(3):1079–1088.
- Samuelsson B, Troein C (2003). Superpolynomial growth in the number of attractors in Kauffman networks. *Physical Review Letters* 90:098701. doi:10.1103/PhysRevLett.90.098701.
- Schuster P, Fontana W, Stadler PF, Hofacker IL (1994). From sequences to shapes and back: a case study in RNA secondary structures. *Proceedings of the Royal Society B* 255(1344):279–284.
- Shmulevich I, Kauffman SA (2004). Activities and sensitivities in Boolean network models. *Physical Review Letters* 93:048701. doi:10.1103/PhysRevLett.93.048701.
- Succi S (2022). The world beyond physics: how big is it? *EPL*. doi:10.1209/0295-5075/ac52f7.
- Szendro IG, Schenk MF, Franke J, Krug J, de Visser JAGM (2013). Quantitative analyses of empirical fitness landscapes. *Journal of Statistical Mechanics* P01005. doi:10.1088/1742-5468/2013/01/P01005.
- van der Merwe R (2023). Stuart Kauffman's metaphysics of the adjacent possible: a critique. *Interdisciplinary Science Reviews* 48(1):49–61. doi:10.1080/03080188.2022.2125614.
- Wagner A (2008). Robustness and evolvability: a paradox resolved. *Proceedings of the Royal Society B* 275(1630):91–100. doi:10.1098/rspb.2007.1137.
- Weinberger E (1990). Correlated and uncorrelated fitness landscapes and how to tell the difference. *Biological Cybernetics* 63:325–336. doi:10.1007/BF00202749.
- Weinberger ED (1991). Local properties of Kauffman's N-k model: a tunably rugged energy landscape. *Physical Review A* 44:6399. doi:10.1103/PhysRevA.44.6399.
- Weinreich DM, Delaney NF, DePristo MA, Hartl DL (2006). Darwinian evolution can follow only very few mutational paths to fitter proteins. *Science* 312(5770):111–114. doi:10.1126/science.1123539.
- Weinreich DM, Watson RA, Chao L (2005). Sign epistasis and genetic constraint on evolutionary trajectories. *Evolution* 59(6):1165–1174.

Verification notes: the NK correlation-length form is a standard derivation rather than a quoted
equation; Kauffman and Johnsen's quantitative details come from Santa Fe Institute working paper
90-013; the Hirota et al. and López-Díaz and Gershenson venues are preprints as listed.
