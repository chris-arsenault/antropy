# Appendix A: Evolutionary Dynamics, Signal-to-Noise, and Within-Lifetime Learning

*Supplement to the Ant Evolution Simulation Design Specification — August 2026, Rev. A*

> **Abstract.** The frozen design specification defines a continuous-time, individual-reproduction
> evolutionary simulation with no explicit fitness function. This appendix addresses four concerns
> raised against that design: (i) whether evolutionary throughput is sufficient given that
> generations are wall-clock-expensive ("seconds per generation"); (ii) whether environmental
> variance dominates genetic variance in realized fitness, nullifying selection; (iii) whether
> structured initialization pre-locks the reachable behavior space; and (iv) whether the design
> provides adaptation at the individual-lifetime timescale. The analysis concludes that raw
> throughput is adequate, that signal-to-noise is the binding constraint and is repairable by
> identified mechanisms, that pre-locking is a real risk requiring specific countermeasures, and
> that the principal structural addition should be **evolved synaptic plasticity with genomically
> specified reward wiring** — lifetime learning whose machinery, but not whose content, is
> heritable. Sections marked **[SUPERSEDES SPEC]** amend the frozen specification.

---

<a id="a-1"></a>

## A.1 Scope and Relationship to the Frozen Specification

At publication, this appendix amended the frozen specification. Its implemented contracts and
evidence remain in force, while current conflicts are resolved through the
[operating principles](ant-sim-principles.md). The following spec interfaces were amended:

1. **Sensor set** (spec §4): adds colony/nest-state inputs and internal reward-signal inputs
   (§A.9, §A.8). **[SUPERSEDES SPEC]**
2. **Controller contract** (spec §2.3): `internalState` now contains plastic parameters;
   `recombine` must perform convention alignment (§A.4.2). **[SUPERSEDES SPEC]**
3. **Caste dial** (spec §8): the authored feeding→size mapping is replaced by genomic reaction
   norms (§A.9). **[SUPERSEDES SPEC]**
4. **Initialization** (spec §10): single structured seed replaced by a seed *portfolio* (§A.5).
   **[SUPERSEDES SPEC]**
5. **Pheromone implementation** (spec §5.5): active-set representation with lazy decay is
   mandatory, not optional (§A.10). **[SUPERSEDES SPEC]**

---

<a id="a-2"></a>

## A.2 Throughput: The Arithmetic of "Seconds per Generation"

<a id="a-2-1"></a>

### A.2.1 Tick and selection-event budget

Let $N$ be the steady-state ant population and $L$ the mean lifespan in ticks. At demographic
equilibrium the death rate — and therefore the **selection-event** rate, since death and
reproduction are the only graders in a fitness-function-free system — is

$$\rho_{\text{sel}} = \frac{N}{L}\ \text{events/tick}.$$

With $N = 2{,}000$, $L = 5{,}000$: $\rho_{\text{sel}} = 0.4$ events/tick.

Controller cost per ant per tick, for the $n_i \to n_h \to n_o = 20 \to 12 \to 8$ recurrent
network, is

$$C_{\text{MAC}} = n_i n_h + n_h^2 + n_h n_o = 240 + 144 + 96 = 480\ \text{MACs},$$

where a MAC is one multiply-accumulate operation. Total neural cost is $\sim 10^6$ MACs/tick —
under a millisecond on one modern core even unvectorized. The neural controllers are therefore
**never** the bottleneck; world subsystems are (§A.10).

Empirical entity-simulation experience (order $10^2$ ticks/s for naive implementations in managed
languages) versus the disciplined ceiling (order $10^3$–$10^4$ ticks/s) gives the planning range:

$$\text{ticks/s} \in [10^2,\ 5 \times 10^3], \qquad \text{selection events/s} \in [40,\ 2 \times 10^3].$$

Even at the pessimistic bound, one hour of headless running yields $\sim 1.4 \times 10^5$
individual selection events, and with a genome-generation time of
$T_g \approx 2\text{–}4 \times 10^3$ ticks, a population generation elapses every 20–40
wall-clock seconds. The question is therefore not whether events occur fast enough, but how many
bits each event teaches the genome.

<a id="a-2-2"></a>

### A.2.2 Information-rate bound: why recombination is load-bearing

MacKay's analysis of evolution as an information-acquisition channel [[1]](#references) bounds
the rate at which selection can fix information in a genome of $G$ (binary-equivalent) loci: an
asexual population acquires $O(1)$ bits per generation, while a freely recombining population
acquires $O(\sqrt{G})$ bits per generation, because recombination allows the fitness contribution
of loci to be tested quasi-independently across the population rather than in linked bundles.
For our $G \approx 550$ weight-genes,

$$\dot{I}_{\text{sex}} \sim \sqrt{G} \approx 23\ \text{bits/gen} \quad\text{vs.}\quad \dot{I}_{\text{asex}} \sim 1\ \text{bit/gen}.$$

Two honest caveats. First, MacKay's bound assumes approximately additive fitness; strongly
epistatic traits gain less, and the assumption has been directly criticized as unrealistic for
natural genomes [[2]](#references). Our smooth-landscape controller choice (real-valued weights,
Gaussian mutation) is precisely the regime where quasi-additivity is most defensible, but the
$\sqrt{G}$ figure should be read as an optimistic ceiling, not a prediction. Second, the bound is
multiplied by realized heritability (§A.3); it is a *channel capacity*, achieved only when
selection can see the bits.

The design consequence stands regardless of the exact constant: sexual recombination is not a
stylistic choice but a throughput multiplier of order $\sqrt{G} \approx 23\times$, and every
asexual fallback in the specification silently forfeits it.

<a id="a-2-3"></a>

### A.2.3 Information demand of the search

Structured initialization pre-pays the chemotaxis core. The residual search — refining the seeded
behavior into robust foraging, digging, and provisioning competence on the low-dimensional
behavioral manifold — is estimated at $2\text{–}5 \times 10^2$ bits, with qualitatively novel
behavior requiring further increments of similar order. (This estimate is **explicitly
conditioned** on the solution lying near the seeded basin; §A.5 addresses the case where it does
not.) Dividing demand by capacity:

$$T_{\text{competence}} \sim \frac{200\text{–}500\ \text{bits}}{h^2 \sqrt{G}\ \text{bits/gen}} \approx 10\text{–}40\ \text{generations at } h^2 \approx 0.5,$$

i.e., minutes-to-hours of wall-clock even at pessimistic tick rates. Classical fixation dynamics
give the same order: a beneficial variant of selective advantage $s$ fixes with probability
$\approx 2s$ [[3]](#references), and conditional on fixing, sweeps in roughly $(2/s)\ln(2N_e)$
generations — for $s = 0.05$, $N_e = 10^3$, about 300 generations. The 5–7-figure generation
counts of from-scratch neuroevolution do not apply: those searches recover the *entire* behavior
function from noise, without seeding, recombination of the MacKay type, or a low-dimensional
target.

---

<a id="a-3"></a>

## A.3 Signal-to-Noise: The Binding Constraint

<a id="a-3-1"></a>

### A.3.1 Heritability under environmental dominance

Write realized fitness (lifespan, delivery count) as $P = G + E$ with genetic variance $V_g$ and
environmental variance $V_e$ (hatch location, local food luck, colony phase, season phase).
Narrow-sense heritability is $h^2 = V_g/(V_g + V_e)$, and the response to selection obeys the
breeder's equation [[4]](#references)

$$R = h^2 S,$$

where $S$ is the selection differential. The stated concern — "environmental conditions matter
more than any behavior configuration" — is exactly the regime $V_e \gg V_g$, $h^2 \to 0$,
$R \to 0$ regardless of $S$. Three mechanisms govern whether this kills the simulation.

<a id="a-3-2"></a>

### A.3.2 Population-level averaging of individual luck

Selection acts on allele frequencies, not individual outcomes. A variant present in $k$ carriers
has experienced $k$ quasi-independent environmental draws; the population is the averaging
machine, and individual-level lottery noise is already priced into the $2s$ fixation probability
(most beneficial mutations die young in nature too). Individual luck is survivable; what is not
survivable is *systematic* noise that flips the sign of $s$.

<a id="a-3-3"></a>

### A.3.3 Fluctuating selection and the season-period rule

If a variant's advantage $s(t)$ alternates sign with environmental phase on a timescale
comparable to its sojourn time, the time-averaged selection coefficient integrates toward zero:
variance is maintained but directional response stalls. This yields a hard constraint absent from
the frozen specification:

> **Design Rule 1 (Timescale separation).** Let $T_g$ be genome-generation time and $T_s$ the
> season period. Require
>
> $$10\,T_g \lesssim T_s \ll T_{\text{run}},$$
>
> so that lineages adapt coherently within a phase, while the $r$/$K$ regime cycle still recurs
> many times per run. $T_s \approx T_g$ is the worst possible tuning and must be excluded by
> construction, not convention.

<a id="a-3-4"></a>

### A.3.4 Aggregation estimators: merit succession as variance reduction

Merit-weighted royal succession scores a *patriline* by the summed delivery of its $n$ workers.
For a patriline-mean phenotype, environmental variance shrinks as $V_e/n$ while
between-patriline genetic variance is preserved, so the effective heritability of the succession
signal is

$$h^2_{\text{agg}} = \frac{V_g}{V_g + V_e/n} \xrightarrow[n \to \infty]{} 1.$$

With $n = 30$ workers per patriline and raw $h^2 = 0.1$ (i.e., $V_e = 9V_g$),
$h^2_{\text{agg}} = 0.77$. Merit succession is therefore formally a variance-reduction estimator
on the germ-line channel, not decorative flavor. The same logic motivates block design of the
environment: more parallel colonies = more environmental replicates per lineage.

<a id="a-3-5"></a>

### A.3.5 The cost: reproductive skew and effective population size

Aggregation concentrates reproduction, and concentrated reproduction destroys diversity. With
offspring-number variance $V_k$, the standard approximation is

$$N_e \approx \frac{4N}{V_k + 2}$$

[[5]](#references), [[4]](#references), and drift overwhelms selection at loci with
$|s| < 1/(2N_e)$. Queen-funneled reproduction plus winner-take-most succession can drive $N_e$ to
$10$–$10^2$ against a census of $2 \times 10^3$, at which point most weight-loci are effectively
neutral. The worker-laid-male channel is the designated $N_e$ repair mechanism and must carry
material gene flux; the succession weighting exponent is the dial trading variance-reduction
against diversity-preservation. Both must be instrumented (§A.11).

> **Design Rule 2 (Live heritability estimator).** Compute parent–offspring regression of
> delivery rate and lifespan continuously from lineage bookkeeping. Realized $h^2 \approx 0$ over
> a sustained window means the population is drifting, and the corrective action is environmental
> (food spikiness, colony count, tradeoff sharpness), not an increase in mutation rate.

---

<a id="a-4"></a>

## A.4 Failure Modes of Self-Adaptive Continuous Evolution

The system is a steady-state process of $(\mu + \lambda)$-ES character [[6]](#references):
offspring are Gaussian-local to parents; the population diffuses at mutation–selection balance
around local optima. It cannot "skip over hills"; its real pathologies are the following.

<a id="a-4-1"></a>

### A.4.1 σ-collapse

Near an optimum most mutations are deleterious, so second-order selection on the mutation-rate
gene $\sigma$ itself pushes $\sigma \downarrow 0$; self-adaptive step sizes are known to stagnate
by this route [[7]](#references), [[6]](#references). Evolvable $\sigma$ is **not**
self-correcting upward. Countermeasures (all three adopted):

1. Hard floor $\sigma \ge \sigma_{\min}$.
2. Log-normal meta-mutation in the ES tradition [[6]](#references):
   $\sigma' = \sigma \exp(\tau \xi)$, $\xi \sim \mathcal{N}(0,1)$,
   $\tau \approx 1/\sqrt{2G}$, which cannot absorb at zero.
3. **Hot eggs**: a fixed fraction $p_{\text{hot}}$ (order $10^{-2}$) of eggs are laid at
   $\sigma_{\text{hot}} \gg \sigma$ regardless of lineage $\sigma$ — a standing stream of
   long-jump trials, the digital analog of bacterial hypermutator lineages, which reach
   observable frequencies in adapting *E. coli* populations [[8]](#references).

<a id="a-4-2"></a>

### A.4.2 Competing conventions and convention-aligned recombination

Two RNNs implement identical behavior under any permutation (and sign-flip) of hidden units;
crossover or diploid averaging between parents in different conventions produces functional mush.
This is the classical *competing conventions* problem of neuro-genetic search
[[9]](#references), [[10]](#references). Mitigating structure: all lineages descend from a shared
seed-portfolio member and initially occupy one convention basin, and averaging within a loss
basin approximately preserves function (the linear-mode-connectivity phenomenon
[[11]](#references), [[12]](#references)). Over deep time, however, lineages drift into divergent
internal representations, and cross-lineage matings become progressively inviable.

The repair, mandatory in `recombine`: align parent B's hidden units to parent A's before
crossover/averaging by solving the $n_h \times n_h$ assignment problem on input-weight
similarity — the same permutation-matching operation used to align independently trained networks
[[13]](#references). At $n_h = 12$ this is computationally negligible.

**Algorithm 1 — Convention-aligned recombination** (executed inside `recombine`):

```text
Require: parent genomes A, B with input matrices W_in^A, W_in^B ∈ R^{n_h × n_i},
         recurrent W_rec, output W_out

1: C[a,b] ← cos( W_in^A[a,:], W_in^B[b,:] )      // n_h × n_h similarity, sign-aware
2: (π, s) ← ASSIGNMENT(C)                        // Hungarian or greedy; s_b ∈ {±1} sign flips
3: B~ ← permute rows of W_in^B, rows/cols of W_rec^B, cols of W_out^B by π; apply signs s
4: return CROSSOVER(A, B~)                       // then per-gene mutation as specified
```

> **Design Rule 3 (Speciation instrument).** Track the ratio of cross-colony to within-colony
> offspring survival. A sustained fall below baseline *despite* convention alignment is emergent
> hybrid inviability — the biological species concept realized in weight space — and is to be
> reported as a result, not suppressed as a bug.

---

<a id="a-5"></a>

## A.5 Anti-Pre-Locking Measures — [SUPERSEDES SPEC §10]

Structured initialization biases the evolutionary trajectory even though weights are erasable: a
population at mutation–selection balance leaves a basin only via drift, neutral corridors, or
environmental devaluation of the incumbent. Worse, an unmodified single-seed design is
unfalsifiable — persistent chemotaxis cannot be distinguished from pre-locked chemotaxis.
Adopted measures:

1. **Seed portfolio.** Founders (queens, and stored-sperm males within queens) draw from a
   portfolio of distinct structured seeds — chemotaxis-forward, dig-biased, wander-heavy,
   pheromone-reactive — plus a minority of unstructured random draws. Day one is a competition
   between behavioral hypotheses, not the refinement of one.
2. **Hot eggs** (§A.4.1): standing basin-escape machinery.
3. **Invasion events.** Periodic injection of founding queens carrying fresh portfolio draws or
   mutated *historical checkpoint* genomes into open territory; incumbents are re-tested against
   outsiders for the life of the run.
4. **Lock instrumentation.** Population distance-from-seed in weight space and, preferably, in
   *behavior* space (assay-arena response profiles against standard stimuli). An early, permanent
   plateau is measured pre-locking; the response is to escalate items 1–3, with evidence.

---

<a id="a-6"></a>

## A.6 The Memory Hierarchy: Organizing Principle

Every environmental regularity has a characteristic timescale and must be stored in a substrate
that adapts at that timescale. The system has four such substrates; the frozen specification
implemented three:

| Substrate | Adapts over | Stores | Status |
|---|---|---|---|
| Recurrent activations | seconds | momentary context | spec §2 |
| **Plastic synaptic state** | **one lifetime** | **local, current-world skill** | **this appendix** |
| Pheromone field (stigmergy) | colony-time | shared map of current resources | spec §5.5 |
| Genome | generations | permanent world structure | spec §3 |

The pheromone field is correctly understood as an external, collective, plastic memory —
coordination through traces left in the environment, Grassé's *stigmergie* [[14]](#references),
[[15]](#references). The missing tier is individual-lifetime memory: regularities stable within
one life but variable between lives (current food geography, this nest's routes, this soil's gait
economics) currently have nowhere to live — too slow for activations, too fast for genes, too
public for pheromones. Filling that tier is the principal structural addition of this appendix.

---

<a id="a-7"></a>

## A.7 Learnability: The Four-Gate Taxonomy

A trait belongs in the plastic tier only if it passes all four gates:

- **G1 — Feedback within lifetime.** The consequence of the behavior arrives before death.
- **G2 — Many trials.** Enough repetitions for statistical learning.
- **G3 — Survivable error.** First failures cost energy, not life.
- **G4 — Value signal available.** An internal reward proxy exists to learn against.

| Trait | G1 | G2 | G3 | G4 | Verdict |
|---|:-:|:-:|:-:|:-:|---|
| Spatial/route knowledge; cue–value associations; motor calibration | ✓ | ✓ | ✓ | ✓ | **learnable** (canonical payload) |
| Task response thresholds | ✓ | ✓ | ✓ | ✓ | **learnable**; reinforced thresholds are the standard model of insect division of labor [[16]](#references), [[17]](#references) |
| Reproductive strategy (lay timing, endowment) | ✗ | ✗ | — | — | innate: payoff post-mortem, few trials |
| One-shot hazards | — | — | ✗ | — | innate (or socially signaled): first error fatal |
| Reward wiring itself | — | — | — | ✗ | innate by necessity: bootstrap regress |
| Beyond-lifetime payoffs (architecture, stockpile insurance) | ✗ | — | — | — | neither learnable nor individually selectable; colony channel only |

Two corollaries. First, reinforced task thresholds mean lifetime learning is a third independent
road to role specialization (alongside patriline polymorphism and reaction norms, §A.9); real
polyandrous colonies exhibit genotypic task bias [[18]](#references), and
threshold-reinforcement models reproduce observed division of labor [[17]](#references). If
roles still fail to emerge with three mechanisms available, that is an informative negative
result. Second, the two-horizon credit structure of the frozen spec stands: plasticity does not
rescue beyond-lifetime payoffs.

---

<a id="a-8"></a>

## A.8 Evolved Plasticity — [SUPERSEDES SPEC §2.3, §4]

<a id="a-8-1"></a>

### A.8.1 Rationale

Gradient training performs $10^5$–$10^7$ *within-model* updates; our ants previously had none.
Encoding *learning machinery* rather than final behavior both fills the lifetime tier and smooths
the fitness landscape: partial genetic predispositions acquire fitness value because learning can
complete them — the Baldwin effect [[19]](#references), [[20]](#references), with genetic
assimilation [[21]](#references) gradually transferring stably useful structure into the genome.
Evolved plastic networks are an established lineage of methods [[23]](#references),
[[24]](#references), [[25]](#references), [[26]](#references).

<a id="a-8-2"></a>

### A.8.2 Mechanism (RNN controller)

Each connection $ij$ carries an innate weight $w_{ij}$ (gene) and a plastic trace $H_{ij}$
(state, initialized 0, dies with the ant). The effective weight is

$$w^{\text{eff}}_{ij} = w_{ij} + \alpha_{c(ij)}\, H_{ij},$$

where $\alpha_c$ is a genomic plasticity gain shared across connection class $c$ (input→hidden,
hidden→hidden, hidden→output) to bound genome growth. Traces update by a neuromodulated
generalized Hebbian rule [[24]](#references), [[26]](#references):

$$\Delta H_{ij} = m(t)\, \eta_c \left( A_c\, x_i y_j + B_c\, x_i + C_c\, y_j + D_c \right) - \eta_c\, y_j^2 H_{ij}, \tag{1}$$

where $x_i, y_j$ are pre-/post-synaptic activations, $(\eta, A, B, C, D)_c$ are genes, and the
final term is Oja-style decay [[27]](#references), preventing unbounded Hebbian growth; traces
are additionally clipped to $[-H_{\max}, H_{\max}]$.

The modulation signal $m(t)$ gates when experience writes:

$$m(t) = \tanh\!\left( \sum_k g_k\, u_k(t) \right), \tag{2}$$

with $u_k$ drawn from internal observables — energy delta, food contact, egg/larva contact,
pheromone gradient climbed, crowding change — and $\mathbf{g}$ a **genomic reward-wiring
vector**. Hardwiring $m$ to energy delta alone would pre-lock the learnable space to
energy-proximal skills, the same error §A.5 guards against in behavior space; evolvable
$\mathbf{g}$ permits lineages to evolve distinct motivational systems (e.g., a nurse-line for
which larva-contact is rewarding). Biologically, (1)–(2) is a three-factor rule: modulatory
gating of Hebbian eligibility, as in dopamine-gated plasticity [[28]](#references).

Genome growth: 3 classes × 6 parameters $+\ |\mathbf{g}| \approx 25$ genes — minor against
$\sim 550$.

**Algorithm 2 — Plastic controller `act()`** (per ant, per tick):

```text
Require: genome (W, α, η, A, B, C, D, g, ...); state (h, H);
         inputs x (sensors ∪ reward observables u)

1: W_eff ← W + α ⊙ H
2: h' ← tanh( W_eff_in · x + W_eff_rec · h );   o ← σ( W_eff_out · h' )
3: m ← tanh( g · u )
4: H ← clip( H + m·η·(A·x hᵀ' + B·x + C·hᵀ' + D) − η·(h'² ⊙ H),  ±H_max )
5: h ← h'
6: return (o, thinkCost = κ₀ + κ₁·‖α‖₁)         // plasticity is metabolically priced
```

<a id="a-8-3"></a>

### A.8.3 Inheritance discipline and known hazards

Plastic traces $H$ die with the ant: learning is Darwinian, not Lamarckian. (Lamarckian
inheritance of $H$ is a single flag and would accelerate adaptation while changing what the
simulation models; default **off**, documented.) Two hazards from the learning–evolution
literature are carried as requirements:

1. **Masking / hiding effect.** Sufficiently cheap learning shields genotypes from selection —
   selection sees the learned phenotype, not the innate wiring — stalling genetic assimilation
   [[22]](#references). Learning must therefore cost: juvenile incompetence (already present via
   juvenile growth), per-tick plasticity metabolic price (the $\kappa_1$ term, Algorithm 2), and
   error costs. Costly learning is the pressure that pushes stable regularities down the
   hierarchy into the genome.
2. **Stability matching.** Learning pays only when the environment is stable within a lifetime
   and variable between lifetimes; Design Rule 1 already places the season period in exactly this
   band. The SNR constraint and the learnability condition are the same constraint from two
   directions.

Assay-arena protocol is extended: each assayed lineage is tested as *naive* clone and as
*experienced* clone (fixed pre-exposure script), decomposing competence into innate and learned
components per lineage — the instrument that makes Baldwinian assimilation visible as a
migrating innate/learned ratio.

<a id="a-8-4"></a>

### A.8.4 Mechanism (linear-GP controller)

Both options preserve the controller contract:

1. **Architected** (reliable path): a bank of *plastic registers* updated by a built-in
   reinforcement rule gated by the same evolvable $m(t)$ —
   $r_p \leftarrow \mathrm{clip}(r_p + m\,\eta\,\text{src})$ — the direct analog of (1),
   discoverable by single instructions.
2. **Fully evolved** (moonshot, kept open): persistent registers plus conditionals are already
   sufficient for programs to *implement their own learning algorithms* (counters, running
   averages, reward-conditional increments) — strictly more open-ended, correspondingly unlikely
   to be found unassisted; cf. the digital-evolution precedent for program genomes evolving
   complex functions under continuous selection [[29]](#references), [[30]](#references).

The default is architected plasticity in both controllers. Note that plasticity sharpens the
competing-conventions hazard (crossover now mixes learning rules tuned to different
representations); Algorithm 1 is thereby promoted from repair to prerequisite.

---

<a id="a-9"></a>

## A.9 Developmental Reaction Norms and Colony-State Inputs — [SUPERSEDES SPEC §8, §4]

<a id="a-9-1"></a>

### A.9.1 Genomic reaction norms

The authored feeding→size mapping is replaced: each physical trait $z$ is expressed as an
evolvable function of developmental inputs,

$$z = z_0 + \sum_j \beta_j\, d_j + \epsilon, \qquad \epsilon \sim \mathcal{N}(0, \nu^2),$$

with $d_j \in \{$larval feeding, incubation depth/temperature, maternal signal$\}$, and
$(z_0, \boldsymbol{\beta}, \nu)$ genes. Steep, saturating norms yield discrete morphs (true
castes); shallow norms yield continuous variation; large evolved $\nu$ is developmental
bet-hedging — a legitimate strategy under Design Rule 1's oscillating environment. Which of these
obtains is an evolved outcome. (A sigmoidal norm variant,
$z = z_0 + \Delta\, \sigma(\beta_1 d_1 + \beta_2 d_2 - \theta) + \epsilon$ with genomic threshold
$\theta$, is the minimal extension if linear norms prove unable to express bimodality; adopt only
if measured necessary.)

<a id="a-9-2"></a>

### A.9.2 Colony-state sensory inputs

Division of labor requires that task *demand* be perceptible. The sensor set gains local,
biologically honest cues: stockpile scent, larval-hunger scent, and congestion — the stimulus
variables of threshold models of task allocation [[16]](#references), [[17]](#references).
Combined with own-body-scale input (spec §4) and patriline polymorphism (spec §7), the full
specialization pipeline is: heritable morphological divergence (norms × patrilines) × behavioral
conditioning on body and demand × colony-level arbitration of the mixture — with no role, nor the
existence of roles, presupposed.

---

<a id="a-10"></a>

## A.10 Compute Discipline for World Subsystems — [SUPERSEDES SPEC §5.5]

The neural tier is cheap (§A.2); naive world updates are not. Full-grid pheromone diffusion over
a $256 \times 256 \times 96$ volume is $O(10^6\text{–}10^7)$ voxel updates/tick and alone reduces
the simulation to the empirical $10^2$ ticks/s regime. Mandatory disciplines:

**Algorithm 3 — Active-set pheromone update with lazy exponential decay:**

```text
state: sparse map A : voxel → (I₀, t₀)          // intensity at last touch, timestamp

READ(v, t):
    return I₀(v) · λ^(t − t₀(v))  if v ∈ A else 0    // decay computed on demand

TICK(t):
    for each v ∈ A scheduled this tick:              // staggered: each voxel every k ticks
        I ← READ(v, t)
        if I < I_floor: evict v; continue
        diffuse fraction δI to air-adjacent voxels; insert/update them in A
        (I₀, t₀)(v) ← (I − δI, t)
```

- **Pheromones:** Algorithm 3. Working set is deposit-driven (order $10^4$ voxels), not
  volume-driven.
- **Tunnel decay** (spec §9.2): event-scheduled per voxel (priority queue keyed by last-traffic
  time), never scanned.
- **Ant storage:** structure-of-arrays layout; zero per-tick allocation on the hot path.
- **Optimization priority** when needed: pheromone active set > memory layout > WASM >
  (optional) GPU. GPU compute favors the RNN controller (dense linear algebra) over
  divergent-branching GP — a recorded scaling asymmetry, not a v1 concern.

Planning throughput remains the range of §A.2; all evolutionary-rate conclusions were checked at
its pessimistic bound.

---

<a id="a-11"></a>

## A.11 Instrumentation Additions

Beyond the frozen spec's instruments:

1. Live parent–offspring $h^2$ regression (Design Rule 2).
2. Realized $N_e$ estimate from offspring-number variance, with alarm at $N_e < 10^2$.
3. Distance-from-seed tracks in weight and behavior space (§A.5).
4. Cross- vs. within-colony offspring survival ratio (§A.4.2).
5. Per-lineage innate/learned competence decomposition via naive-vs-experienced assays (§A.8.3).
6. Per-lineage reward-wiring vectors $\mathbf{g}$ as first-class charted genes — the evolution of
   motivation is expected to be among the most interpretable outputs of the system.

---

<a id="a-12"></a>

## A.12 Parameter Constraints Summary

| Quantity | Constraint | Source |
|---|---|---|
| Season period $T_s$ | $10\,T_g \lesssim T_s \ll T_{\text{run}}$ | Design Rule 1 |
| Mutation scale $\sigma$ | $\sigma \ge \sigma_{\min}$; log-normal meta-mutation | §A.4.1 |
| Hot-egg fraction | $p_{\text{hot}} \sim 10^{-2}$, $\sigma_{\text{hot}} \gg \sigma$ | §A.4.1 |
| Effective population | $N_e \gtrsim 10^2$ monitored; worker-male flux material | §A.3.5 |
| Succession weighting | exponent tuned against $N_e$ alarm | §A.3.5 |
| Plasticity cost | $\kappa_1 > 0$ strictly (anti-masking) | §A.8.3 |
| Plastic trace bound | $\lvert H \rvert \le H_{\max}$; Oja decay active | Eq. (1) |
| Pheromone active set | floor-evicted, deposit-driven | Algorithm 3 |

---

<a id="a-references"></a>

## References

1. D. J. C. MacKay, *Information Theory, Inference, and Learning Algorithms*, ch. 19: "Why have
   Sex? Information Acquisition and Evolution." Cambridge Univ. Press, 2003.
2. J. B. Anderson, "A Speed Limit for Evolution: Postscript," arXiv:2212.00430, 2022.
   (Critique: the additive-fitness assumption underlying the $\sqrt{G}$ rate.)
3. J. B. S. Haldane, "A mathematical theory of natural and artificial selection, Part V:
   Selection and mutation," *Math. Proc. Camb. Phil. Soc.* 23(7), 838–844, 1927. (Fixation
   probability $\approx 2s$.)
4. D. S. Falconer and T. F. C. Mackay, *Introduction to Quantitative Genetics*, 4th ed. Longman,
   1996. (Breeder's equation; heritability; effective population size.)
5. S. Wright, "Size of population and breeding structure in relation to evolution," *Science*
   87, 430–431, 1938.
6. H.-G. Beyer and H.-P. Schwefel, "Evolution strategies — a comprehensive introduction,"
   *Natural Computing* 1, 3–52, 2002. (Self-adaptive $\sigma$; log-normal meta-mutation;
   $(\mu+\lambda)$ dynamics.)
7. G. Rudolph, "Self-adaptive mutations may lead to premature convergence," *IEEE Trans.
   Evolutionary Computation* 5(4), 410–414, 2001.
8. P. D. Sniegowski, P. J. Gerrish, and R. E. Lenski, "Evolution of high mutation rates in
   experimental populations of *E. coli*," *Nature* 387, 703–705, 1997.
9. J. D. Schaffer, D. Whitley, and L. J. Eshelman, "Combinations of genetic algorithms and
   neural networks: a survey of the state of the art," *Proc. COGANN-92*, IEEE, 1992.
   (Competing conventions / permutation problem.)
10. K. O. Stanley and R. Miikkulainen, "Evolving neural networks through augmenting topologies,"
    *Evolutionary Computation* 10(2), 99–127, 2002.
11. J. Frankle, G. K. Dziugaite, D. M. Roy, and M. Carbin, "Linear mode connectivity and the
    lottery ticket hypothesis," *ICML*, 2020.
12. R. Entezari, H. Sedghi, O. Saukh, and B. Neyshabur, "The role of permutation invariance in
    linear mode connectivity of neural networks," *ICLR*, 2022.
13. S. K. Ainsworth, J. Hayase, and S. Srinivasa, "Git Re-Basin: Merging models modulo
    permutation symmetries," *ICLR*, 2023 (arXiv:2209.04836).
14. P.-P. Grassé, "La reconstruction du nid et les coordinations interindividuelles chez
    *Bellicositermes natalensis* et *Cubitermes* sp. La théorie de la stigmergie," *Insectes
    Sociaux* 6, 41–80, 1959.
15. G. Theraulaz and E. Bonabeau, "A brief history of stigmergy," *Artificial Life* 5(2),
    97–116, 1999.
16. E. Bonabeau, G. Theraulaz, and J.-L. Deneubourg, "Fixed response thresholds and the
    regulation of division of labor in insect societies," *Bull. Math. Biol.* 60, 753–807, 1998.
17. G. Theraulaz, E. Bonabeau, and J.-L. Deneubourg, "Response threshold reinforcement and
    division of labour in insect societies," *Proc. R. Soc. Lond. B* 265, 327–332, 1998.
18. S. J. Waddington, L. A. Santorelli, F. R. Ryan, and W. O. H. Hughes, "Genetic polyethism in
    leaf-cutting ants," *Behavioral Ecology* 21(6), 1165–1169, 2010.
19. J. M. Baldwin, "A new factor in evolution," *American Naturalist* 30, 441–451, 1896.
20. G. E. Hinton and S. J. Nowlan, "How learning can guide evolution," *Complex Systems* 1,
    495–502, 1987.
21. C. H. Waddington, "Canalization of development and the inheritance of acquired characters,"
    *Nature* 150, 563–565, 1942.
22. G. Mayley, "Landscapes, learning costs, and genetic assimilation," *Evolutionary
    Computation* 4(3), 213–234, 1997. (Hiding effect; learning costs required for assimilation.)
23. D. Floreano and J. Urzelai, "Evolutionary robots with on-line self-organization and
    behavioral fitness," *Neural Networks* 13(4–5), 431–443, 2000.
24. A. Soltoggio, J. A. Bullinaria, C. Mattiussi, P. Dürr, and D. Floreano, "Evolutionary
    advantages of neuromodulated plasticity in dynamic, reward-based scenarios," *Proc. ALIFE
    XI*, 569–576, MIT Press, 2008.
25. A. Soltoggio, K. O. Stanley, and S. Risi, "Born to learn: The inspiration, progress, and
    future of evolved plastic artificial neural networks," *Neural Networks* 108, 48–67, 2018.
26. T. Miconi, J. Clune, and K. O. Stanley, "Differentiable plasticity: training plastic neural
    networks with backpropagation," *ICML*, PMLR 80, 2018.
27. E. Oja, "A simplified neuron model as a principal component analyzer," *J. Math. Biology*
    15, 267–273, 1982.
28. T. Miconi, A. Rawal, J. Clune, and K. O. Stanley, "Backpropamine: training self-modifying
    neural networks with differentiable neuromodulated plasticity," *ICLR*, 2019. (Three-factor
    / eligibility-trace gating.)
29. T. S. Ray, "An approach to the synthesis of life," in *Artificial Life II*, 371–408,
    Addison-Wesley, 1991. (Tierra.)
30. R. E. Lenski, C. Ofria, R. T. Pennock, and C. Adami, "The evolutionary origin of complex
    features," *Nature* 423, 139–144, 2003. (Avida.)
